import type { CityResult, WeatherBundle, CurrentWeather, DailyForecast } from '../../types';
import { OpenMeteoResponseSchema } from '../../schemas';
import { classifyHttpError, createAppError } from '../../lib/errors';
import { wmoCodeToCondition } from './conditions';
import { formatDayName } from '../../lib/dates';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export async function fetchOpenMeteoWeather(
  city: CityResult,
  signal?: AbortSignal,
): Promise<WeatherBundle> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '5',
    wind_speed_unit: 'ms',
  });

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw classifyHttpError(response.status, url);
  }

  const json = await response.json();
  const result = OpenMeteoResponseSchema.safeParse(json);

  if (!result.success) {
    throw createAppError('validation', 'Unexpected response format from Open-Meteo.');
  }

  const data = result.data;
  const isDay = data.current.is_day === 1;
  const { condition, text } = wmoCodeToCondition(data.current.weather_code, isDay);

  const current: CurrentWeather = {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.temperature_2m, // Open-Meteo free tier doesn't provide feels_like in current
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windDirection: null, // Not available in this request
    condition,
    conditionText: text,
    isDay,
    highToday: data.daily.temperature_2m_max[0] ?? data.current.temperature_2m,
    lowToday: data.daily.temperature_2m_min[0] ?? data.current.temperature_2m,
    localTime: new Date().toISOString(),
    timezoneOffset: data.utc_offset_seconds,
  };

  const daily: DailyForecast[] = data.daily.time.map((dateStr, i) => {
    const dayCode = data.daily.weather_code[i] ?? 0;
    const { condition: dayCondition, text: dayText } = wmoCodeToCondition(dayCode, true);
    return {
      date: dateStr,
      dayName: formatDayName(dateStr),
      high: data.daily.temperature_2m_max[i] ?? 0,
      low: data.daily.temperature_2m_min[i] ?? 0,
      condition: dayCondition,
      conditionText: dayText,
      precipChance: data.daily.precipitation_probability_max?.[i] ?? 0,
      isDay: true,
    };
  });

  return {
    current,
    daily: daily.slice(0, 5),
    source: 'open-meteo',
    fetchedAt: Date.now(),
    timezoneOffset: data.utc_offset_seconds,
    city,
  };
}
