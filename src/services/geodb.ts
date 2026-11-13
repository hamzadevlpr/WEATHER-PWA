import type { CityResult } from '../types';
import { GeoDBResponseSchema } from '../schemas';
import { classifyHttpError, createAppError } from '../lib/errors';

const BASE_URL = 'https://wft-geo-db.p.rapidapi.com/v1/geo/cities';

export async function searchCities(
  query: string,
  signal?: AbortSignal,
): Promise<CityResult[]> {
  const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
  const apiHost = import.meta.env.VITE_RAPIDAPI_HOST || 'wft-geo-db.p.rapidapi.com';

  if (!apiKey) {
    throw createAppError('invalid_key', 'RapidAPI key is not configured. Add VITE_RAPIDAPI_KEY to your .env.local file.');
  }

  const params = new URLSearchParams({
    namePrefix: query,
    limit: '6',
    sort: '-population',
    types: 'CITY',
  });

  const url = `${BASE_URL}?${params.toString()}`;

  const response = await fetch(url, {
    signal,
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': apiHost,
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw createAppError(
        'rate_limited',
        'Too many searches. Wait a second and try again.',
      );
    }
    throw classifyHttpError(response.status, url);
  }

  const json = await response.json();
  const result = GeoDBResponseSchema.safeParse(json);

  if (!result.success) {
    throw createAppError('validation', 'Unexpected response from the city search service.');
  }

  return result.data.data.map((city) => ({
    id: String(city.id),
    name: city.name,
    region: city.region || '',
    country: city.country,
    latitude: city.latitude,
    longitude: city.longitude,
  }));
}
