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
      className="rounded-xl bg-[var(--color-surface-secondary)] p-6"
    >
      {/* Main temperature + icon */}
      <div className="flex items-start justify-between">
        <div>
          <p className="tabular-nums text-6xl font-light tracking-tight text-[var(--color-text-primary)]">
            {formatTemperature(current.temperature, unit)}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Feels like{' '}
            <span className="tabular-nums">
              {formatTemperatureWithUnit(current.feelsLike, unit)}
            </span>
          </p>
          <p className="mt-2 text-base font-medium text-[var(--color-text-primary)]">
            {current.conditionText}
          </p>
        </div>
        <WeatherIcon
          condition={current.condition}
          isDay={current.isDay}
          size={64}
        />
      </div>

      {/* Stats */}
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--color-text-secondary)]">
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
        <span>
          {formatLocalTime(current.timezoneOffset)}
        </span>
      </div>

      {/* High / Low */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <p className="text-[var(--color-text-secondary)]">
          H:{' '}
          <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
            {formatTemperature(current.highToday, unit)}
          </span>
          {'  '}
          L:{' '}
          <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
            {formatTemperature(current.lowToday, unit)}
          </span>
        </p>

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
                'rounded-md p-1 transition-colors',
                'hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-secondary)]',
                'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none',
              )}
              aria-label="Refresh weather data"
            >
              <RefreshCw size={14} aria-hidden="true" className={cn(isRefreshing && 'animate-spin')} />
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
