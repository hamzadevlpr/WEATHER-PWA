import { useMemo } from 'react';
import { ForecastDay } from './ForecastDay';
import type { DailyForecast, TemperatureUnit } from '@/types';

interface ForecastListProps {
  daily: DailyForecast[];
  unit: TemperatureUnit;
}

export function ForecastList({ daily, unit }: ForecastListProps) {
  const { globalMin, globalMax } = useMemo(() => {
    const lows = daily.map((d) => d.low);
    const highs = daily.map((d) => d.high);
    return {
      globalMin: Math.min(...lows),
      globalMax: Math.max(...highs),
    };
  }, [daily]);

  if (daily.length === 0) return null;

  return (
    <section aria-label="Weather forecast">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {daily.length}-Day Forecast
      </h2>
      <div className="space-y-2">
        {daily.map((day) => (
          <ForecastDay
            key={day.date}
            day={day}
            unit={unit}
            globalMin={globalMin}
            globalMax={globalMax}
          />
        ))}
      </div>
    </section>
  );
}
