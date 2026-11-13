import type { TemperatureUnit } from '../types';

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

export function msToMph(ms: number): number {
  return ms * 2.23694;
}

export function mphToMs(mph: number): number {
  return mph / 2.23694;
}

export function formatTemperature(celsius: number, unit: TemperatureUnit): string {
  const value = unit === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius;
  return `${Math.round(value)}°`;
}

export function formatTemperatureWithUnit(celsius: number, unit: TemperatureUnit): string {
  const value = unit === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius;
  return `${Math.round(value)}°${unit === 'fahrenheit' ? 'F' : 'C'}`;
}

export function formatWindSpeed(ms: number, unit: TemperatureUnit): string {
  if (unit === 'fahrenheit') {
    return `${Math.round(msToMph(ms))} mph`;
  }
  return `${Math.round(ms * 10) / 10} m/s`;
}

export function windDirectionToCompass(degrees: number | null): string {
  if (degrees === null) return '';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index] ?? 'N';
}

export function getTemperatureRange(
  temps: number[],
  globalMin: number,
  globalMax: number,
): { left: number; width: number } {
  const range = globalMax - globalMin;
  if (range === 0) return { left: 0, width: 100 };
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const left = ((min - globalMin) / range) * 100;
  const width = ((max - min) / range) * 100;
  return { left, width: Math.max(width, 4) }; // min 4% width for visibility
}
