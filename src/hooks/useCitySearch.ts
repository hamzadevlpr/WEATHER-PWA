import { useCallback, useEffect, useRef, useState } from 'react';
import type { CityResult, AppError } from '../types';
import { searchCities } from '../services/geodb';
import { useDebounce } from './useDebounce';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../services/storage';
import { classifyError } from '../lib/errors';
import { RecentSearchesStoreSchema } from '../schemas';

interface UseCitySearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: CityResult[];
  isLoading: boolean;
  error: AppError | null;
  recentSearches: CityResult[];
  clearRecentSearches: () => void;
  addToRecentSearches: (city: CityResult) => void;
  retry: () => void;
}

export function useCitySearch(): UseCitySearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debouncedQuery = useDebounce(query.trim(), 300);

  const [recentSearches, setRecentSearches] = useLocalStorage<CityResult[]>(
    STORAGE_KEYS.recentSearches,
    [],
    RecentSearchesStoreSchema,
  );

  const fetchCities = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const cities = await searchCities(searchQuery, controller.signal);
      if (!controller.signal.aborted) {
        setResults(cities);
        setIsLoading(false);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!controller.signal.aborted) {
        setError(classifyError(err) as AppError);
        setResults([]);
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCities(debouncedQuery);
  }, [debouncedQuery, fetchCities]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const retry = useCallback(() => {
    if (debouncedQuery.length >= 2) {
      fetchCities(debouncedQuery);
    }
  }, [debouncedQuery, fetchCities]);

  const addToRecentSearches = useCallback(
    (city: CityResult) => {
      setRecentSearches((prev) => {
        const filtered = prev.filter((c) => c.id !== city.id);
        return [city, ...filtered].slice(0, 5);
      });
    },
    [setRecentSearches],
  );

  const clearRecentSearches = useCallback(
    () => setRecentSearches([]),
    [setRecentSearches],
  );

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    recentSearches,
    clearRecentSearches,
    addToRecentSearches,
    retry,
  };
}
