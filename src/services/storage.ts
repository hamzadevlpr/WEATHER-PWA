import type { z } from 'zod';
import { createAppError } from '../lib/errors';

const memoryStore = new Map<string, string>();
let storageAvailable: boolean | null = null;

function checkStorageAvailable(): boolean {
  if (storageAvailable !== null) return storageAvailable;
  try {
    const testKey = '__weatherboard_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function isStorageAvailable(): boolean {
  return checkStorageAvailable();
}

export function getItem(key: string): string | null {
  if (checkStorageAvailable()) {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  }
  return memoryStore.get(key) ?? null;
}

export function setItem(key: string, value: string): void {
  if (checkStorageAvailable()) {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      // Fall through to memory
    }
  }
  memoryStore.set(key, value);
}

export function removeItem(key: string): void {
  if (checkStorageAvailable()) {
    try {
      localStorage.removeItem(key);
      return;
    } catch {
      // Fall through to memory
    }
  }
  memoryStore.delete(key);
}

export function getJSON<T>(key: string, schema: z.ZodType<T>): T | null {
  const raw = getItem(key);
  if (raw === null) return null;

  try {
    const parsed = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    // Data is corrupted or schema changed — remove it
    removeItem(key);
    return null;
  } catch {
    // Invalid JSON — remove it
    removeItem(key);
    return null;
  }
}

export function setJSON(key: string, value: unknown): void {
  try {
    setItem(key, JSON.stringify(value));
  } catch (err) {
    throw createAppError('storage', 'Failed to save data to storage', err);
  }
}

// Storage keys (namespaced and versioned)
export const STORAGE_KEYS = {
  favourites: 'weatherboard:v1:favourites',
  theme: 'weatherboard:v1:theme',
  units: 'weatherboard:v1:units',
  recentSearches: 'weatherboard:v1:recentSearches',
  reminderSettings: 'weatherboard:v1:reminderSettings',
  lastCity: 'weatherboard:v1:lastCity',
  lastWeather: 'weatherboard:v1:lastWeather',
  lastNotifiedDate: 'weatherboard:v1:lastNotifiedDate',
} as const;
