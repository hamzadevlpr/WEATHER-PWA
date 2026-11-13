import { useCallback, useEffect, useState } from 'react';
import { getJSON, setJSON, getItem, removeItem, isStorageAvailable } from '../services/storage';
import type { z } from 'zod';

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  schema?: z.ZodType<T>,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (schema) {
      const parsed = getJSON(key, schema);
      return parsed ?? defaultValue;
    }
    const raw = getItem(key);
    if (raw === null) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        setJSON(key, nextValue);
        return nextValue;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    setStoredValue(defaultValue);
    removeItem(key);
  }, [key, defaultValue]);

  // Listen for cross-tab changes
  useEffect(() => {
    if (!isStorageAvailable()) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key) return;
      if (e.newValue === null) {
        setStoredValue(defaultValue);
      } else {
        try {
          const parsed = JSON.parse(e.newValue) as T;
          if (schema) {
            const result = schema.safeParse(parsed);
            setStoredValue(result.success ? result.data : defaultValue);
          } else {
            setStoredValue(parsed);
          }
        } catch {
          setStoredValue(defaultValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, defaultValue, schema]);

  return [storedValue, setValue, removeValue];
}
