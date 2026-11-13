import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWeather } from '@/services/weather';
import type { CityResult } from '@/types';

const mockCity: CityResult = {
  id: 'lahore',
  name: 'Lahore',
  region: 'Punjab',
  country: 'Pakistan',
  latitude: 31.5497,
  longitude: 74.3436,
};

describe('Provider Fallback Logic', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('falls back to Open-Meteo when OpenWeatherMap fails with 429', async () => {
    // Mock fetch: reject OWM with 429, succeed for Open-Meteo
    global.fetch = vi.fn().mockImplementation((url: string | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('api.openweathermap.org')) {
        return Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        });
      }

      if (urlStr.includes('api.open-meteo.com')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            current: {
              temperature_2m: 24.5,
              relative_humidity_2m: 55,
              wind_speed_10m: 3.2,
              weather_code: 1,
              is_day: 1,
            },
            daily: {
              time: ['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17'],
              weather_code: [1, 2, 0, 61, 80],
              temperature_2m_max: [28, 27, 26, 24, 25],
              temperature_2m_min: [16, 15, 15, 14, 15],
              precipitation_probability_max: [0, 10, 5, 80, 45],
            },
            utc_offset_seconds: 18000,
          }),
        });
      }

      return Promise.reject(new Error('Unknown url'));
    });

    const result = await fetchWeather(mockCity);
    expect(result.source).toBe('open-meteo');
    expect(result.city.name).toBe('Lahore');
    expect(result.current.temperature).toBe(24.5);
    expect(result.daily.length).toBe(5);
  });
});
