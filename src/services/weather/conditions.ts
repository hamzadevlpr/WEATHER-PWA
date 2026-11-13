import type { WeatherCondition } from '../../types';

// OWM condition code to internal condition mapping
// https://openweathermap.org/weather-conditions
export function owmCodeToCondition(code: number, icon?: string): { condition: WeatherCondition; text: string; isDay: boolean } {
  const isDay = icon ? !icon.endsWith('n') : true;

  if (code >= 200 && code < 300) {
    return { condition: 'thunderstorm', text: 'Thunderstorm', isDay };
  }
  if (code >= 300 && code < 400) {
    return { condition: 'drizzle', text: 'Drizzle', isDay };
  }
  if (code === 500 || code === 501) {
    return { condition: 'rain', text: 'Rain', isDay };
  }
  if (code >= 502 && code < 600) {
    return { condition: 'heavy-rain', text: 'Heavy rain', isDay };
  }
  if (code === 600 || code === 601) {
    return { condition: 'snow', text: 'Snow', isDay };
  }
  if (code >= 602 && code < 700) {
    if (code === 611 || code === 612 || code === 613 || code === 615 || code === 616) {
      return { condition: 'sleet', text: 'Sleet', isDay };
    }
    return { condition: 'heavy-snow', text: 'Heavy snow', isDay };
  }
  if (code >= 700 && code < 800) {
    return { condition: 'fog', text: 'Fog', isDay };
  }
  if (code === 800) {
    return { condition: 'clear', text: 'Clear sky', isDay };
  }
  if (code === 801) {
    return { condition: 'partly-cloudy', text: 'Few clouds', isDay };
  }
  if (code === 802) {
    return { condition: 'partly-cloudy', text: 'Scattered clouds', isDay };
  }
  if (code === 803) {
    return { condition: 'cloudy', text: 'Broken clouds', isDay };
  }
  if (code === 804) {
    return { condition: 'overcast', text: 'Overcast', isDay };
  }
  return { condition: 'unknown', text: 'Unknown', isDay };
}

// WMO weather code to internal condition mapping
// https://open-meteo.com/en/docs
export function wmoCodeToCondition(code: number, isDay: boolean): { condition: WeatherCondition; text: string } {
  switch (code) {
    case 0:
      return { condition: 'clear', text: 'Clear sky' };
    case 1:
      return { condition: 'clear', text: 'Mainly clear' };
    case 2:
      return { condition: 'partly-cloudy', text: 'Partly cloudy' };
    case 3:
      return { condition: 'overcast', text: 'Overcast' };
    case 45:
    case 48:
      return { condition: 'fog', text: 'Fog' };
    case 51:
    case 53:
      return { condition: 'drizzle', text: 'Drizzle' };
    case 55:
      return { condition: 'drizzle', text: 'Dense drizzle' };
    case 56:
    case 57:
      return { condition: 'sleet', text: 'Freezing drizzle' };
    case 61:
    case 63:
      return { condition: 'rain', text: 'Rain' };
    case 65:
      return { condition: 'heavy-rain', text: 'Heavy rain' };
    case 66:
    case 67:
      return { condition: 'sleet', text: 'Freezing rain' };
    case 71:
    case 73:
      return { condition: 'snow', text: 'Snowfall' };
    case 75:
    case 77:
      return { condition: 'heavy-snow', text: 'Heavy snowfall' };
    case 80:
    case 81:
      return { condition: 'rain', text: 'Rain showers' };
    case 82:
      return { condition: 'heavy-rain', text: 'Heavy rain showers' };
    case 85:
      return { condition: 'snow', text: 'Snow showers' };
    case 86:
      return { condition: 'heavy-snow', text: 'Heavy snow showers' };
    case 95:
      return { condition: 'thunderstorm', text: 'Thunderstorm' };
    case 96:
    case 99:
      return { condition: 'thunderstorm', text: 'Thunderstorm with hail' };
    default:
      return { condition: isDay ? 'clear' : 'clear', text: 'Unknown' };
  }
}

export function conditionToDisplayText(condition: WeatherCondition): string {
  const map: Record<WeatherCondition, string> = {
    clear: 'Clear',
    'partly-cloudy': 'Partly Cloudy',
    cloudy: 'Cloudy',
    overcast: 'Overcast',
    fog: 'Foggy',
    drizzle: 'Drizzle',
    rain: 'Rain',
    'heavy-rain': 'Heavy Rain',
    thunderstorm: 'Thunderstorm',
    snow: 'Snow',
    'heavy-snow': 'Heavy Snow',
    sleet: 'Sleet',
    unknown: 'Unknown',
  };
  return map[condition];
}
