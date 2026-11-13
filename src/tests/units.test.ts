import { describe, it, expect } from 'vitest';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  msToMph,
  mphToMs,
  formatTemperature,
  formatTemperatureWithUnit,
  formatWindSpeed,
  windDirectionToCompass,
} from '@/lib/units';

describe('Unit Conversions', () => {
  it('converts Celsius to Fahrenheit correctly', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(Math.round(celsiusToFahrenheit(25))).toBe(77);
  });

  it('converts Fahrenheit to Celsius correctly', () => {
    expect(fahrenheitToCelsius(32)).toBe(0);
    expect(fahrenheitToCelsius(212)).toBe(100);
    expect(Math.round(fahrenheitToCelsius(77))).toBe(25);
  });

  it('converts m/s to mph correctly', () => {
    expect(Math.round(msToMph(10))).toBe(22);
    expect(Math.round(mphToMs(22.3694))).toBe(10);
  });

  it('formats temperature with and without units', () => {
    expect(formatTemperature(23.4, 'celsius')).toBe('23°');
    expect(formatTemperature(23.4, 'fahrenheit')).toBe('74°');
    expect(formatTemperatureWithUnit(23.4, 'celsius')).toBe('23°C');
    expect(formatTemperatureWithUnit(23.4, 'fahrenheit')).toBe('74°F');
  });

  it('formats wind speeds based on unit', () => {
    expect(formatWindSpeed(5, 'celsius')).toBe('5 m/s');
    expect(formatWindSpeed(5, 'fahrenheit')).toBe('11 mph');
  });

  it('converts wind directions accurately', () => {
    expect(windDirectionToCompass(0)).toBe('N');
    expect(windDirectionToCompass(90)).toBe('E');
    expect(windDirectionToCompass(180)).toBe('S');
    expect(windDirectionToCompass(270)).toBe('W');
    expect(windDirectionToCompass(null)).toBe('');
  });
});
