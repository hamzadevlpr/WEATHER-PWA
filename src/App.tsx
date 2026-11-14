import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Settings,
  Heart,
  CloudSun,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Navigation,
} from 'lucide-react';

import { useTheme, useThemeProvider, ThemeContext } from '@/hooks/useTheme';
import { useUnits } from '@/hooks/useUnits';
import { useWeather } from '@/hooks/useWeather';
import { useCitySearch } from '@/hooks/useCitySearch';
import { useFavourites } from '@/hooks/useFavourites';
import { useReminder } from '@/hooks/useReminder';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { STORAGE_KEYS } from '@/services/storage';
import { CitySearch } from '@/components/search/CitySearch';
import { CurrentConditions } from '@/components/weather/CurrentConditions';
import { ForecastList } from '@/components/weather/ForecastList';
import {
  CurrentConditionsSkeleton,
  ForecastSkeleton,
} from '@/components/weather/Skeletons';
import { FavouritesPanel } from '@/components/favourites/FavouritesPanel';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { InstallButton } from '@/components/pwa/InstallButton';
import { UpdateToast } from '@/components/pwa/UpdateToast';
import { Button } from '@/components/ui/Button';
import { ToastProvider } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { getUserMessage } from '@/lib/errors';
import type { CityResult, AppError } from '@/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
    },
  },
});

const DEFAULT_POPULAR_CITIES: CityResult[] = [
  { id: 'karachi', name: 'Karachi', region: 'Sindh', country: 'Pakistan', latitude: 24.8607, longitude: 67.0011 },
  { id: 'lahore', name: 'Lahore', region: 'Punjab', country: 'Pakistan', latitude: 31.5497, longitude: 74.3436 },
  { id: 'islamabad', name: 'Islamabad', region: 'Islamabad Capital Territory', country: 'Pakistan', latitude: 33.6844, longitude: 73.0479 },
  { id: 'rawalpindi', name: 'Rawalpindi', region: 'Punjab', country: 'Pakistan', latitude: 33.5651, longitude: 73.0169 },
  { id: 'faisalabad', name: 'Faisalabad', region: 'Punjab', country: 'Pakistan', latitude: 31.4504, longitude: 73.1350 },
  { id: 'multan', name: 'Multan', region: 'Punjab', country: 'Pakistan', latitude: 30.1978, longitude: 71.4697 },
  { id: 'peshawar', name: 'Peshawar', region: 'Khyber Pakhtunkhwa', country: 'Pakistan', latitude: 34.0151, longitude: 71.5249 },
  { id: 'quetta', name: 'Quetta', region: 'Balochistan', country: 'Pakistan', latitude: 30.1798, longitude: 66.9750 },
  { id: 'hyderabad', name: 'Hyderabad', region: 'Sindh', country: 'Pakistan', latitude: 25.3960, longitude: 68.3578 },
  { id: 'sukkur', name: 'Sukkur', region: 'Sindh', country: 'Pakistan', latitude: 27.7052, longitude: 68.8574 },
  { id: 'rohri', name: 'Rohri', region: 'Sindh', country: 'Pakistan', latitude: 27.6906, longitude: 68.8950 },
  { id: 'gujranwala', name: 'Gujranwala', region: 'Punjab', country: 'Pakistan', latitude: 32.1877, longitude: 74.1945 },
  { id: 'sialkot', name: 'Sialkot', region: 'Punjab', country: 'Pakistan', latitude: 32.4945, longitude: 74.5229 },
];

function WeatherDashboard() {
  const { theme, setTheme } = useTheme();
  const { unit, setUnit } = useUnits();
  const isOnline = useOnlineStatus();
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();

  const {
    data: weatherData,
    isLoading: isWeatherLoading,
    isFetching: isWeatherFetching,
    error: weatherError,
    refetch: refetchWeather,
    selectedCity,
    setSelectedCity,
  } = useWeather();

  const citySearch = useCitySearch();
  const { favourites, addFavourite, removeFavourite, isFavourite, canAddMore } = useFavourites();
  const reminder = useReminder();
  const geolocation = useGeolocation();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [swNeedsUpdate, setSwNeedsUpdate] = useState(false);

  // Default selection on load: prioritize user device location
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('city') || params.get('lat')) {
      return;
    }

    const isManual = localStorage.getItem(STORAGE_KEYS.isManualCity);
    const isOldDefault = selectedCity?.id === 'london' && isManual !== 'true';

    if (!selectedCity || isManual !== 'true' || isOldDefault) {
      geolocation
        .requestDeviceLocation()
        .then((deviceCity) => {
          if (deviceCity) {
            setSelectedCity(deviceCity);
          } else if (!selectedCity) {
            if (favourites.length > 0 && favourites[0]) {
              setSelectedCity(favourites[0]);
            } else {
              const defaultCity = DEFAULT_POPULAR_CITIES[0];
              if (defaultCity) {
                setSelectedCity(defaultCity);
              }
            }
          }
        })
        .catch(() => {
          if (!selectedCity) {
            if (favourites.length > 0 && favourites[0]) {
              setSelectedCity(favourites[0]);
            } else {
              const defaultCity = DEFAULT_POPULAR_CITIES[0];
              if (defaultCity) {
                setSelectedCity(defaultCity);
              }
            }
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic reminder background check when tab is visible
  useEffect(() => {
    if (!reminder.settings.enabled) return;

    const checkReminder = () => {
      const today = new Date().toISOString().split('T')[0];
      const last = localStorage.getItem('weatherboard:v1:lastNotifiedDate');
      if (last === today) return;

      const [hours, minutes] = reminder.settings.time.split(':').map(Number);
      if (hours === undefined || minutes === undefined) return;
      const now = new Date();
      const scheduled = new Date();
      scheduled.setHours(hours, minutes, 0, 0);

      if (now >= scheduled && weatherData) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('WeatherBoard — Morning Weather', {
            body: `${weatherData.city.name}: ${Math.round(weatherData.current.temperature)}°C, ${weatherData.current.conditionText}. Have a great day!`,
            icon: '/icons/icon-192.png',
          });
          localStorage.setItem('weatherboard:v1:lastNotifiedDate', today ?? '');
        }
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, [reminder.settings, weatherData]);

  const handleCitySelect = (city: CityResult) => {
    localStorage.setItem(STORAGE_KEYS.isManualCity, 'true');
    setSelectedCity(city);
    citySearch.addToRecentSearches(city);
  };

  const handleUseCurrentLocation = async () => {
    const deviceCity = await geolocation.requestDeviceLocation();
    if (deviceCity) {
      localStorage.removeItem(STORAGE_KEYS.isManualCity);
      setSelectedCity(deviceCity);
      citySearch.addToRecentSearches(deviceCity);
    }
  };

  const isDeviceLocation =
    selectedCity?.id.startsWith('geo-') ||
    localStorage.getItem(STORAGE_KEYS.isManualCity) !== 'true';

  const isCurrentFav = selectedCity ? isFavourite(selectedCity.id) : false;

  const handleToggleFavourite = () => {
    if (!selectedCity) return;
    if (isCurrentFav) {
      removeFavourite(selectedCity.id);
    } else {
      addFavourite(selectedCity);
    }
  };

  const formattedError = weatherError
    ? getUserMessage(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (weatherError as any).kind
        ? (weatherError as unknown as AppError)
        : {
          kind: 'unknown',
          message: weatherError.message,
          retryable: true,
        },
    )
    : null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-colors duration-200">
      {/* Skip to main content link for keyboard a11y */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Offline Alert Banner */}
      <OfflineBanner
        isOnline={isOnline}
        lastCityName={weatherData?.city.name ?? selectedCity?.name}
        lastUpdated={weatherData?.fetchedAt}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-secondary)] text-primary-500">
                <CloudSun className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-[var(--color-text-primary)]">
                  WeatherBoard
                </h1>
                <p className="hidden text-[11px] font-medium text-[var(--color-text-tertiary)] md:block">
                  Atmospheric intelligence
                </p>
              </div>
            </div>

            <div className="flex sm:hidden items-center gap-2">
              <InstallButton
                canInstall={canInstall}
                isInstalled={isInstalled}
                isIOS={isIOS}
                onInstall={promptInstall}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="min-h-11 min-w-11 p-0 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-1 w-full sm:max-w-md sm:mx-2 min-w-0">
            <CitySearch
              query={citySearch.query}
              setQuery={citySearch.setQuery}
              results={citySearch.results}
              isLoading={citySearch.isLoading}
              error={citySearch.error}
              recentSearches={citySearch.recentSearches}
              clearRecentSearches={citySearch.clearRecentSearches}
              retry={citySearch.retry}
              onCitySelect={handleCitySelect}
              onUseCurrentLocation={handleUseCurrentLocation}
              isLocating={geolocation.isLoading}
              disabled={!isOnline}
            />
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <InstallButton
              canInstall={canInstall}
              isInstalled={isInstalled}
              isIOS={isIOS}
              onInstall={promptInstall}
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="min-h-11 min-w-11 sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0 p-0 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main id="main-content" className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar / Favourites Panel */}
          <div className="col-span-1 md:col-span-4 xl:col-span-3 space-y-4 min-w-0">
            <FavouritesPanel
              favourites={favourites}
              onSelect={handleCitySelect}
              onRemove={removeFavourite}
              canAddMore={canAddMore}
              selectedCityId={selectedCity?.id}
            />

            {/* Quick Suggestions for first-time explore */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                <span>Popular Cities</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_POPULAR_CITIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCitySelect(c)}
                    className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg bg-[var(--color-surface-secondary)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-colors border border-[var(--color-border)]"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Weather View */}
          <section className="col-span-1 md:col-span-8 xl:col-span-9 space-y-6 min-w-0" aria-label="Weather forecast">
            {/* Top action row */}
            {selectedCity && (
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] truncate">
                      {selectedCity.name}
                    </h2>
                    {isDeviceLocation && (
                      <Navigation
                        className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)]"
                        aria-label="Current device location"
                      />
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                    {[selectedCity.region, selectedCity.country].filter(Boolean).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleToggleFavourite}
                    className="min-h-11 min-w-11 sm:min-h-8 sm:h-8 gap-1.5 px-3 text-xs font-medium"
                    aria-label={isCurrentFav ? 'Remove from favourites' : 'Save to favourites'}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 shrink-0 ${isCurrentFav ? 'fill-rose-500 text-rose-500' : 'text-[var(--color-text-secondary)]'
                        }`}
                    />
                    <span>{isCurrentFav ? 'Saved' : 'Save'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Loading Skeleton */}
            {(isWeatherLoading || (geolocation.isLoading && !selectedCity)) && (
              <div className="space-y-6 animate-pulse">
                <CurrentConditionsSkeleton />
                <ForecastSkeleton />
              </div>
            )}

            {/* Error Message */}
            {!isWeatherLoading && formattedError && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface-secondary)] text-error-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {formattedError.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
                  {formattedError.description}
                </p>
                {formattedError.action && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => refetchWeather()}
                    className="mt-4 min-h-11 min-w-11 px-4 gap-1.5 text-xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{formattedError.action}</span>
                  </Button>
                )}
              </div>
            )}

            {/* Weather Content */}
            {!isWeatherLoading && !weatherError && weatherData && (
              <div className="space-y-6">
                <CurrentConditions
                  weather={weatherData}
                  unit={unit}
                  onRefresh={() => refetchWeather()}
                  isRefreshing={isWeatherFetching}
                />

                <ForecastList daily={weatherData.daily} unit={unit} />
              </div>
            )}

            {/* Initial Empty State if no city picked */}
            {!isWeatherLoading && !weatherData && !weatherError && (
              <EmptyState
                icon={<CloudSun className="h-8 w-8 text-sky-500" />}
                title="Select a city to explore weather"
                description="Search for any city worldwide using the search bar above, or pick one from popular cities."
              />
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-tertiary)]">
        <p>WeatherBoard PWA — Client-side atmospheric intelligence</p>
      </footer>

      {/* Modals & Toasts */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        theme={theme}
        onThemeChange={setTheme}
        unit={unit}
        onUnitChange={setUnit}
        reminderSettings={reminder.settings}
        onReminderUpdate={reminder.updateSettings}
        permissionState={reminder.permissionState}
        onPermissionRefresh={reminder.refreshPermission}
        isPeriodicSyncAvailable={reminder.isPeriodicSyncAvailable}
        canUseReminders={reminder.canUseReminders}
        limitationMessage={reminder.limitationMessage}
        activeCityName={weatherData?.city.name}
        activeCityTemp={
          weatherData ? `${Math.round(weatherData.current.temperature)}°` : undefined
        }
        activeCityCondition={weatherData?.current.conditionText}
      />

      <UpdateToast
        needsUpdate={swNeedsUpdate}
        onUpdate={() => {
          setSwNeedsUpdate(false);
          window.location.reload();
        }}
      />
    </div>
  );
}

export default function App() {
  const themeValue = useThemeProvider();

  return (
    <ThemeContext.Provider value={themeValue}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <WeatherDashboard />
        </ToastProvider>
      </QueryClientProvider>
    </ThemeContext.Provider>
  );
}
