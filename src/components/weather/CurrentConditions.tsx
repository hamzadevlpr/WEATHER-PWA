import { Droplets, Wind, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  formatTemperature,
  formatTemperatureWithUnit,
  formatWindSpeed,
  windDirectionToCompass,
} from '@/lib/units';
import { formatRelativeTime, formatLocalTime } from '@/lib/dates';
import { WeatherIcon } from './WeatherIcon';
import type { WeatherBundle, TemperatureUnit } from '@/types';

interface CurrentConditionsProps {
  weather: WeatherBundle;
  unit: TemperatureUnit;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function CurrentConditions({
  weather,
  unit,
  onRefresh,
  isRefreshing = false,
}: CurrentConditionsProps) {
  const { current, source, fetchedAt } = weather;
  const compass = windDirectionToCompass(current.windDirection);

  return (
    <section
      aria-label="Current weather conditions"
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
    >
      {/* Main temperature + icon */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="tabular-nums text-5xl sm:text-6xl font-light tracking-tight text-[var(--color-text-primary)]">
              {formatTemperature(current.temperature, unit)}
            </p>
            <div className="space-y-0.5 text-xs text-[var(--color-text-secondary)]">
              <p>
                Feels like{' '}
                <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
                  {formatTemperatureWithUnit(current.feelsLike, unit)}
                </span>
              </p>
              <p>
                H:{' '}
                <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
                  {formatTemperature(current.highToday, unit)}
                </span>
                {' '}•{' '}
                L:{' '}
                <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
                  {formatTemperature(current.lowToday, unit)}
                </span>
              </p>
            </div>
          </div>
          <p className="mt-2 text-base font-medium text-[var(--color-text-primary)] truncate">
            {current.conditionText}
          </p>
        </div>
        <div className="shrink-0">
          <WeatherIcon
            condition={current.condition}
            isDay={current.isDay}
            size={64}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Atmospheric stats + Time & Refresh */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-y-3 gap-x-2 pt-4 border-t border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
        {/* Humidity + Wind closely grouped */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="inline-flex items-center gap-1.5">
            <Droplets size={16} aria-hidden="true" />
            <span>{current.humidity}%</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wind size={16} aria-hidden="true" />
            <span>
              {formatWindSpeed(current.windSpeed, unit)}
              {compass ? ` ${compass}` : ''}
            </span>
          </span>
          <span className="text-xs sm:text-sm">
            {formatLocalTime(current.timezoneOffset)}
          </span>
        </div>

        {/* Updated + Refresh */}
        <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
          <span className="text-xs">
            Updated {formatRelativeTime(fetchedAt)}
          </span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className={cn(
                'min-h-11 min-w-11 -mr-2 flex items-center justify-center rounded-lg transition-colors',
                'hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-secondary)]',
                'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none',
              )}
              aria-label="Refresh weather data"
            >
              <RefreshCw size={16} aria-hidden="true" className={cn(isRefreshing && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      {/* Source footnote */}
      {source === 'open-meteo' && (
        <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">
          Data: Open-Meteo
        </p>
      )}
    </section>
  );
}
