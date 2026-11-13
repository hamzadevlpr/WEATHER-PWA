import type { CityResult, WeatherBundle, CurrentWeather, DailyForecast } from '../../types';
import { OWMCurrentSchema, OWMForecastSchema, type OWMForecastItem } from '../../schemas';
import { classifyHttpError, createAppError } from '../../lib/errors';
import { owmCodeToCondition } from './conditions';
import { formatDayName } from '../../lib/dates';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

function getApiKey(): string {
  return import.meta.env.VITE_OWM_API_KEY || '';
}

export async function fetchOWMCurrent(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<{ current: CurrentWeather; timezoneOffset: number }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw createAppError('invalid_key', 'OpenWeatherMap API key is not configured.');
  }

  const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw classifyHttpError(response.status, url);
  }

  const json = await response.json();
  const result = OWMCurrentSchema.safeParse(json);

  if (!result.success) {
    throw createAppError('validation', 'Unexpected response format from OpenWeatherMap.');
  }

  const data = result.data;
  const weather = data.weather[0]!;
  const { condition, text, isDay } = owmCodeToCondition(weather.id, weather.icon);

  return {
    current: {
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg ?? null,
      condition,
      conditionText: text,
      isDay,
      highToday: data.main.temp_max,
      lowToday: data.main.temp_min,
      localTime: new Date((data.dt + data.timezone) * 1000).toISOString(),
      timezoneOffset: data.timezone,
    },
    timezoneOffset: data.timezone,
  };
}

export async function fetchOWMForecast(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<DailyForecast[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw createAppError('invalid_key', 'OpenWeatherMap API key is not configured.');
  }

  const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw classifyHttpError(response.status, url);
  }

  const json = await response.json();
  const result = OWMForecastSchema.safeParse(json);

  if (!result.success) {
    throw createAppError('validation', 'Unexpected response format from OpenWeatherMap forecast.');
  }

  return aggregateForecast(result.data.list, result.data.city.timezone);
}

export function aggregateForecast(
  items: OWMForecastItem[],
  timezoneOffset: number,
): DailyForecast[] {
  // Group entries by local date
  const byDate = new Map<string, OWMForecastItem[]>();

  for (const item of items) {
    const localTimestamp = (item.dt + timezoneOffset) * 1000;
    const localDate = new Date(localTimestamp);
    const dateKey = `${localDate.getUTCFullYear()}-${String(localDate.getUTCMonth() + 1).padStart(2, '0')}-${String(localDate.getUTCDate()).padStart(2, '0')}`;

    const existing = byDate.get(dateKey);
    if (existing) {
      existing.push(item);
    } else {
      byDate.set(dateKey, [item]);
    }
  }

  const dailies: DailyForecast[] = [];

  for (const [dateStr, dayItems] of byDate) {
    if (dailies.length >= 5) break;

    const temps = dayItems.map((i) => i.main.temp);
    const high = Math.max(...temps);
    const low = Math.min(...temps);
    const maxPrecip = Math.max(...dayItems.map((i) => Math.round((i.pop ?? 0) * 100)));

    // Pick the most representative condition:
    // Prefer the midday entry (12:00-15:00 local), or the most frequent condition
    const middayItem = dayItems.find((i) => {
      const localHour = new Date((i.dt + timezoneOffset) * 1000).getUTCHours();
      return localHour >= 12 && localHour <= 15;
    });

    let representativeItem: OWMForecastItem;
    if (middayItem) {
      representativeItem = middayItem;
    } else {
      // Most frequent weather condition
      const conditionCount = new Map<number, number>();
      for (const item of dayItems) {
        const code = item.weather[0]!.id;
        conditionCount.set(code, (conditionCount.get(code) ?? 0) + 1);
      }
      let maxCount = 0;
      let maxCode = dayItems[0]!.weather[0]!.id;
      for (const [code, count] of conditionCount) {
        if (count > maxCount) {
          maxCount = count;
          maxCode = code;
        }
      }
      representativeItem = dayItems.find((i) => i.weather[0]!.id === maxCode) ?? dayItems[0]!;
    }

    const weather = representativeItem.weather[0]!;
    const { condition, text } = owmCodeToCondition(weather.id, weather.icon);

    dailies.push({
      date: dateStr,
      dayName: formatDayName(dateStr),
      high,
      low,
      condition,
      conditionText: text,
      precipChance: maxPrecip,
      isDay: true,
    });
  }

  return dailies.slice(0, 5);
}

export async function fetchOWMWeather(
  city: CityResult,
  signal?: AbortSignal,
): Promise<WeatherBundle> {
  const [currentResult, daily] = await Promise.all([
    fetchOWMCurrent(city.latitude, city.longitude, signal),
    fetchOWMForecast(city.latitude, city.longitude, signal),
  ]);

  // Update today's high/low from forecast data if available
  const today = daily[0];
  if (today) {
    currentResult.current.highToday = today.high;
    currentResult.current.lowToday = today.low;
  }

  return {
    current: currentResult.current,
    daily,
    source: 'openweathermap',
    fetchedAt: Date.now(),
    timezoneOffset: currentResult.timezoneOffset,
    city,
  };
}
