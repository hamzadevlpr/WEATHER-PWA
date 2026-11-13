import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import type { ThemeMode } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../services/storage';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useThemeProvider() {
  const [theme, setThemeValue] = useLocalStorage<ThemeMode>(
    STORAGE_KEYS.theme,
    'system',
  );

  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const resolvedTheme = useMemo(
    () => (theme === 'system' ? getSystemTheme() : theme),
    [theme, getSystemTheme],
  );

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeValue(newTheme);
    },
    [setThemeValue],
  );

  // Apply theme class and update meta
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update theme-color meta
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolvedTheme === 'dark' ? '#0c1222' : '#0ea5e9');
    }
  }, [resolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      // Force re-render
      setThemeValue('system');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, setThemeValue]);

  return useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );
}
