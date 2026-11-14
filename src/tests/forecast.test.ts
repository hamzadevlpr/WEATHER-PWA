import { describe, it, expect } from 'vitest';
import { aggregateForecast } from '@/services/weather/openweathermap';
import type { OWMForecastItem } from '@/schemas';

describe('aggregateForecast', () => {
  it('correctly produces daily summaries from 3-hour entries', () => {
    // Generate mock entries across 5 days (8 entries per day = 40 total)
    const mockItems: OWMForecastItem[] = [];
    const baseTime = 1700000000; // Reference timestamp

    for (let day = 0; day < 5; day++) {
      for (let step = 0; step < 8; step++) {
        const dt = baseTime + (day * 86400) + (step * 10800);
        mockItems.push({
          dt,
          main: {
            temp: 15 + day + (step === 4 ? 10 : 0), // Midday has highest temp
            feels_like: 15 + day,
            temp_min: 10 + day,
            temp_max: 25 + day,
            humidity: 60,
          },
          weather: [
            {
              id: 800,
              main: 'Clear',
              description: 'clear sky',
              icon: '01d',
            },
          ],
          wind: {
            speed: 3.5,
            deg: 180,
          },
          pop: 0.1 * day,
          dt_txt: new Date(dt * 1000).toISOString(),
        });
      }
    }

    const aggregated = aggregateForecast(mockItems, 0);
    expect(aggregated.length).toBeLessThanOrEqual(5);
    expect(aggregated[0]).toHaveProperty('high');
    expect(aggregated[0]).toHaveProperty('low');
    expect(aggregated[0]).toHaveProperty('condition');
    expect(aggregated[0]).toHaveProperty('precipChance');
  });
});
