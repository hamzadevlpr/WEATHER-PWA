import type { CityResult, WeatherBundle } from '../../types';
import { fetchOWMWeather } from './openweathermap';
import { fetchOpenMeteoWeather } from './openmeteo';
import { isAppError } from '../../lib/errors';

/**
 * Fetches weather data from OpenWeatherMap with automatic fallback to Open-Meteo.
 * Fallback triggers on: 429 (rate limit), 401/403 (auth), 5xx (server error),
 * network failures, or Zod validation errors.
 */
export async function fetchWeather(
  city: CityResult,
  signal?: AbortSignal,
): Promise<WeatherBundle> {
  try {
    return await fetchOWMWeather(city, signal);
  } catch (error) {
    // Don't fallback for AbortError (user cancelled)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    // Don't fallback for missing API key — try Open-Meteo directly
    const shouldFallback =
      !isAppError(error) ||
      error.kind === 'network' ||
      error.kind === 'rate_limited' ||
      error.kind === 'invalid_key' ||
      error.kind === 'validation';

    if (shouldFallback) {
      return await fetchOpenMeteoWeather(city, signal);
    }

    throw error;
  }
}

export { fetchOWMWeather } from './openweathermap';
export { fetchOpenMeteoWeather } from './openmeteo';
export { aggregateForecast } from './openweathermap';
