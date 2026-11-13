import { z } from 'zod';

// GeoDB Cities API
export const GeoDBCitySchema = z.object({
  id: z.number(),
  name: z.string(),
  region: z.string().optional().default(''),
  country: z.string(),
  countryCode: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  population: z.number().optional(),
});

export const GeoDBResponseSchema = z.object({
  data: z.array(GeoDBCitySchema),
});

export type GeoDBCity = z.infer<typeof GeoDBCitySchema>;
export type GeoDBResponse = z.infer<typeof GeoDBResponseSchema>;

// OpenWeatherMap Current
export const OWMWeatherItemSchema = z.object({
  id: z.number(),
  main: z.string(),
  description: z.string(),
  icon: z.string(),
});

export const OWMCurrentSchema = z.object({
  coord: z.object({ lon: z.number(), lat: z.number() }),
  weather: z.array(OWMWeatherItemSchema).min(1),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    temp_min: z.number(),
    temp_max: z.number(),
    humidity: z.number(),
  }),
  wind: z.object({
    speed: z.number(),
    deg: z.number().optional(),
  }),
  dt: z.number(),
  timezone: z.number(),
  name: z.string(),
  cod: z.number(),
});

export type OWMCurrent = z.infer<typeof OWMCurrentSchema>;

// OpenWeatherMap Forecast
export const OWMForecastItemSchema = z.object({
  dt: z.number(),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    temp_min: z.number(),
    temp_max: z.number(),
    humidity: z.number(),
  }),
  weather: z.array(OWMWeatherItemSchema).min(1),
  wind: z.object({
    speed: z.number(),
    deg: z.number().optional(),
  }),
  pop: z.number().optional().default(0),
  dt_txt: z.string(),
});

export const OWMForecastSchema = z.object({
  list: z.array(OWMForecastItemSchema),
  city: z.object({
    timezone: z.number(),
    name: z.string(),
    country: z.string(),
  }),
});

export type OWMForecastItem = z.infer<typeof OWMForecastItemSchema>;
export type OWMForecast = z.infer<typeof OWMForecastSchema>;

// Open-Meteo
export const OpenMeteoCurrentSchema = z.object({
  temperature_2m: z.number(),
  relative_humidity_2m: z.number(),
  wind_speed_10m: z.number(),
  weather_code: z.number(),
  is_day: z.number(),
});

export const OpenMeteoDailySchema = z.object({
  time: z.array(z.string()),
  weather_code: z.array(z.number()),
  temperature_2m_max: z.array(z.number()),
  temperature_2m_min: z.array(z.number()),
  precipitation_probability_max: z.array(z.number()).optional(),
});

export const OpenMeteoResponseSchema = z.object({
  current: OpenMeteoCurrentSchema,
  daily: OpenMeteoDailySchema,
  utc_offset_seconds: z.number(),
});

export type OpenMeteoResponse = z.infer<typeof OpenMeteoResponseSchema>;

// Favourites (stored in localStorage)
export const FavouriteCitySchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  addedAt: z.number(),
});

export const FavouritesStoreSchema = z.array(FavouriteCitySchema);

// Reminder settings
export const ReminderSettingsSchema = z.object({
  enabled: z.boolean(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  cityId: z.string().nullable(),
});

// Recent searches
export const RecentSearchSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export const RecentSearchesStoreSchema = z.array(RecentSearchSchema);
