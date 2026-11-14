import { useState, useCallback } from 'react';
import type { CityResult } from '../types';
import { getUserDeviceLocation } from '../services/location';

export function useGeolocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestDeviceLocation = useCallback(async (): Promise<CityResult | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const city = await getUserDeviceLocation();
      return city;
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
          ? (err as { message: string }).message
          : 'Could not access device location.';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    requestDeviceLocation,
  };
}
