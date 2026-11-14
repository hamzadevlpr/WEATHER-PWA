import type { CityResult } from '../types';
import { createAppError } from '../lib/errors';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Gets the user's current geographic coordinates using the browser Geolocation API.
 */
export function getUserCoordinates(options?: PositionOptions): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(createAppError('unsupported', 'Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        let msg = 'Could not retrieve your location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Enable location in your browser settings to see local weather.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        reject(createAppError('unknown', msg, err));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // cache for 5 minutes
        ...options,
      },
    );
  });
}

/**
 * Reverse geocodes coordinates to a CityResult object.
 * First tries OpenWeatherMap reverse geocoding if an API key is available,
 * then falls back to BigDataCloud client reverse geocoding,
 * and finally falls back to a generic "Current Location" label.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<CityResult> {
  const roundedLat = Number(latitude.toFixed(4));
  const roundedLon = Number(longitude.toFixed(4));
  const id = `geo-${roundedLat}-${roundedLon}`;

  // 1. Try OpenWeatherMap reverse geocoding if key is available
  const owmKey = import.meta.env.VITE_OWM_API_KEY;
  if (owmKey) {
    try {
      const url = new URL('https://api.openweathermap.org/geo/1.0/reverse');
      url.searchParams.set('lat', String(latitude));
      url.searchParams.set('lon', String(longitude));
      url.searchParams.set('limit', '1');
      url.searchParams.set('appid', owmKey);

      const res = await fetch(url.toString(), { signal });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0]?.name) {
          const item = data[0];
          return {
            id,
            name: item.name,
            region: item.state || '',
            country: item.country || '',
            latitude,
            longitude,
          };
        }
      }
    } catch {
      // Ignore and proceed to fallback
    }
  }

  // 2. Try BigDataCloud free client reverse geocoding
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(bdcUrl, { signal });
    if (res.ok) {
      const data = await res.json();
      const name = data.city || data.locality || data.principalSubdivision;
      if (name) {
        return {
          id,
          name,
          region: data.principalSubdivision || '',
          country: data.countryCode || data.countryName || '',
          latitude,
          longitude,
        };
      }
    }
  } catch {
    // Ignore and proceed to fallback
  }

  // 3. Fallback when reverse geocoding is unavailable
  return {
    id,
    name: 'Current Location',
    region: '',
    country: '',
    latitude,
    longitude,
  };
}

/**
 * Gets the user's device location and returns it as a CityResult.
 */
export async function getUserDeviceLocation(signal?: AbortSignal): Promise<CityResult> {
  const coords = await getUserCoordinates();
  return await reverseGeocode(coords.latitude, coords.longitude, signal);
}
