export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'snow'
  | 'heavy-snow'
  | 'sleet'
  | 'unknown';

export interface CurrentWeather {
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // 0–100
  windSpeed: number; // m/s
  windDirection: number | null; // degrees
  condition: WeatherCondition;
  conditionText: string;
  isDay: boolean;
  highToday: number;
  lowToday: number;
  localTime: string; // ISO string or formatted
  timezoneOffset: number; // seconds from UTC
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  dayName: string;
  high: number; // Celsius
  low: number;
  condition: WeatherCondition;
  conditionText: string;
  precipChance: number; // 0–100
  isDay: boolean;
}

export interface WeatherBundle {
  current: CurrentWeather;
  daily: DailyForecast[];
  source: 'openweathermap' | 'open-meteo';
  fetchedAt: number; // Date.now() timestamp
  timezoneOffset: number;
  city: CityResult;
}

export interface CityResult {
  id: string;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface FavouriteCity extends CityResult {
  addedAt: number;
}

export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:mm
  cityId: string | null; // null = use last viewed or first favourite
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type TemperatureUnit = 'celsius' | 'fahrenheit';

export type AppErrorKind =
  | 'network'
  | 'rate_limited'
  | 'invalid_key'
  | 'not_found'
  | 'validation'
  | 'storage'
  | 'unsupported'
  | 'unknown';

export interface AppError {
  kind: AppErrorKind;
  message: string;
  retryable: boolean;
  cause?: unknown;
}

export interface UserMessage {
  title: string;
  description: string;
  action?: string;
}
