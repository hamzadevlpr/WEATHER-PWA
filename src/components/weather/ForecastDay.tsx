import { cn } from '@/lib/cn';
import { formatTemperature, getTemperatureRange } from '@/lib/units';
import { WeatherIcon } from './WeatherIcon';
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
        'flex items-center gap-3 rounded-lg px-4 py-3',
        'bg-[var(--color-surface-secondary)]',
        'transition-colors hover:bg-[var(--color-surface-tertiary)]',
        // Card layout on mobile, row on desktop
        'max-sm:flex-wrap max-sm:gap-2',
      )}
    >
      {/* Day name */}
      <span className="w-12 shrink-0 text-sm font-medium text-[var(--color-text-primary)] max-sm:w-auto">
        {day.dayName}
      </span>

      {/* Icon */}
      <WeatherIcon condition={day.condition} isDay={day.isDay} size={32} />

      {/* Temps + bar */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="tabular-nums w-10 text-right text-sm text-[var(--color-text-tertiary)]">
          {formatTemperature(day.low, unit)}
        </span>

        {/* Temperature range bar */}
        <div className="relative h-1.5 flex-1 rounded-full bg-[var(--color-surface-tertiary)]">
          <div
            className="absolute inset-y-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-500"
            style={{
              left: `${left}%`,
              width: `${width}%`,
            }}
          />
        </div>

        <span className="tabular-nums w-10 text-sm font-medium text-[var(--color-text-primary)]">
          {formatTemperature(day.high, unit)}
        </span>
      </div>

      {/* Precip chance */}
      {day.precipChance > 0 && (
        <span className="flex items-center gap-1 text-xs text-primary-500">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M6 1C6 1 2 5.5 2 8a4 4 0 0 0 8 0C10 5.5 6 1 6 1Z" />
          </svg>
          {day.precipChance}%
        </span>
      )}
    </div>
  );
}
