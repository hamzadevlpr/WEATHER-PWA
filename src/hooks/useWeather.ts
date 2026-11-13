import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CityResult, WeatherBundle } from '../types';
import { fetchWeather } from '../services/weather';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../services/storage';

interface UseWeatherReturn {
  data: WeatherBundle | null;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
  lastCity: CityResult | null;
  setSelectedCity: (city: CityResult) => void;
  selectedCity: CityResult | null;
}

export function useWeather(): UseWeatherReturn {
  const [selectedCity, setSelectedCityStorage] = useLocalStorage<CityResult | null>(
    STORAGE_KEYS.lastCity,
    null,
  );
  const [, setLastWeather] = useLocalStorage<WeatherBundle | null>(
    STORAGE_KEYS.lastWeather,
    null,
  );
  const queryClient = useQueryClient();

  const queryKey = selectedCity
    ? ['weather', selectedCity.latitude, selectedCity.longitude]
    : ['weather'];

  const { data, isLoading, isFetching, error, refetch } = useQuery<WeatherBundle>({
    queryKey,
    queryFn: ({ signal }) => {
      if (!selectedCity) throw new Error('No city selected');
      return fetchWeather(selectedCity, signal);
    },
    enabled: !!selectedCity,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Persist last successful weather data for offline use
  useEffect(() => {
    if (data) {
      setLastWeather(data);
    }
  }, [data, setLastWeather]);

  const setSelectedCity = useCallback(
    (city: CityResult) => {
      setSelectedCityStorage(city);
      // Update URL params
      const params = new URLSearchParams(window.location.search);
      params.set('city', city.name);
      params.set('lat', String(city.latitude));
      params.set('lon', String(city.longitude));
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
      // Invalidate previous weather query
      queryClient.invalidateQueries({ queryKey: ['weather'] });
    },
    [setSelectedCityStorage, queryClient],
  );

  // Load from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cityName = params.get('city');
    const lat = params.get('lat');
    const lon = params.get('lon');

    if (cityName && lat && lon) {
      const urlCity: CityResult = {
        id: `${lat},${lon}`,
        name: cityName,
        region: '',
        country: '',
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      };
      setSelectedCityStorage(urlCity);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data: data ?? null,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch: () => { refetch(); },
    lastCity: selectedCity,
    setSelectedCity,
    selectedCity,
  };
}
