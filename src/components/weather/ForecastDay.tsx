import { cn } from '@/lib/cn';
import { formatTemperature, getTemperatureRange } from '@/lib/units';
import { WeatherIcon } from './WeatherIcon';
import { Droplet } from 'lucide-react';
import type { DailyForecast, TemperatureUnit } from '@/types';

interface ForecastDayProps {
  day: DailyForecast;
  unit: TemperatureUnit;
  globalMin: number;
  globalMax: number;
}

export function ForecastDay({
  day,
  unit,
  globalMin,
  globalMax,
}: ForecastDayProps) {
  const { left, width } = getTemperatureRange(
    [day.low, day.high],
    globalMin,
    globalMax,
  );

  return (
    <div
      className={cn(
        'flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-sm transition-colors',
        'hover:bg-[var(--color-surface-secondary)] min-w-0',
      )}
    >
      {/* Day name */}
      <span className="w-14 sm:w-16 shrink-0 text-xs sm:text-sm font-medium text-[var(--color-text-primary)] truncate">
        {day.dayName}
      </span>

      {/* Icon */}
      <div className="shrink-0">
        <WeatherIcon condition={day.condition} isDay={day.isDay} size={24} />
      </div>

      {/* Precip chance */}
      <div className="w-10 sm:w-12 shrink-0">
        {day.precipChance > 0 ? (
          <span className="inline-flex items-center gap-0.5 text-[11px] sm:text-xs text-primary-500 font-medium">
            <Droplet className="h-3 w-3 fill-primary-500/20" />
            <span>{day.precipChance}%</span>
          </span>
        ) : null}
      </div>

      {/* Temperature range bar */}
      <div className="relative h-1.5 flex-1 min-w-[32px] sm:min-w-[48px] rounded-full bg-[var(--color-surface-secondary)]">
        <div
          className="absolute inset-y-0 rounded-full bg-primary-500"
          style={{
            left: `${left}%`,
            width: `${width}%`,
          }}
        />
      </div>

      {/* High & Low grouped closely together */}
      <div className="flex w-16 sm:w-20 shrink-0 items-center justify-end gap-1.5 sm:gap-2 text-right tabular-nums text-xs sm:text-sm">
        <span className="font-medium text-[var(--color-text-primary)]">
          {formatTemperature(day.high, unit)}
        </span>
        <span className="text-[var(--color-text-tertiary)]">
          {formatTemperature(day.low, unit)}
        </span>
      </div>
    </div>
  );
}
