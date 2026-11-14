import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Settings,
  Heart,
  CloudSun,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

import { useTheme, useThemeProvider, ThemeContext } from '@/hooks/useTheme';
import { useUnits } from '@/hooks/useUnits';
import { useWeather } from '@/hooks/useWeather';
import { useCitySearch } from '@/hooks/useCitySearch';
import { useFavourites } from '@/hooks/useFavourites';
import { useReminder } from '@/hooks/useReminder';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
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
  { id: 'london', name: 'London', region: 'England', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { id: 'newyork', name: 'New York', region: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060 },
  { id: 'tokyo', name: 'Tokyo', region: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
  { id: 'lahore', name: 'Lahore', region: 'Punjab', country: 'Pakistan', latitude: 31.5497, longitude: 74.3436 },
  { id: 'sydney', name: 'Sydney', region: 'New South Wales', country: 'Australia', latitude: -33.8688, longitude: 151.2093 },
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

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [swNeedsUpdate, setSwNeedsUpdate] = useState(false);

  // Default selection if nothing selected yet: fallback to first favourite or London
  useEffect(() => {
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
  }, [selectedCity, favourites, setSelectedCity]);

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
    setSelectedCity(city);
    citySearch.addToRecentSearches(city);
  };

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
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-colors duration-200">
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
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
              <CloudSun className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-[var(--color-text-primary)]">
                WeatherBoard
              </h1>
              <p className="hidden text-[11px] font-medium text-[var(--color-text-tertiary)] sm:block">
                Atmospheric intelligence
              </p>
            </div>
          </div>

          <div className="flex flex-1 max-w-md mx-2">
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
              disabled={!isOnline}
            />
          </div>

          <div className="flex items-center gap-2">
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
              className="h-9 w-9 p-0 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main id="main-content" className="mx-auto flex-1 w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar / Favourites Panel */}
          <div className="lg:col-span-1 space-y-4">
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
                <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                <span>Popular Cities</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_POPULAR_CITIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCitySelect(c)}
                    className="rounded-lg bg-[var(--color-surface-secondary)] px-2 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Weather View */}
          <section className="lg:col-span-3 space-y-6" aria-label="Weather forecast">
            {/* Top action row */}
            {selectedCity && (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
                    {selectedCity.name}
                  </h2>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {[selectedCity.region, selectedCity.country].filter(Boolean).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleToggleFavourite}
                    className="h-8 gap-1.5 text-xs font-medium"
                    aria-label={isCurrentFav ? 'Remove from favourites' : 'Save to favourites'}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${isCurrentFav ? 'fill-rose-500 text-rose-500' : 'text-[var(--color-text-secondary)]'
                        }`}
                    />
                    <span>{isCurrentFav ? 'Saved' : 'Save'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Loading Skeleton */}
            {isWeatherLoading && (
              <div className="space-y-6 animate-pulse">
                <CurrentConditionsSkeleton />
                <ForecastSkeleton />
              </div>
            )}

            {/* Error Message */}
            {!isWeatherLoading && formattedError && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                  {formattedError.title}
                </h3>
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">
                  {formattedError.description}
                </p>
                {formattedError.action && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => refetchWeather()}
                    className="mt-4 gap-1.5 text-xs"
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
