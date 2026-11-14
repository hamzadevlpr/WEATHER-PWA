import React from 'react';
import { X, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog } from 'lucide-react';
import type { FavouriteCity, WeatherCondition } from '@/types';
import { cn } from '@/lib/cn';

export interface FavouriteChipProps {
  city: FavouriteCity;
  isSelected: boolean;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
  temperature?: string;
  condition?: WeatherCondition;
  className?: string;
}

function ConditionIcon({ condition, className }: { condition?: WeatherCondition; className?: string }) {
  if (!condition) return null;

  switch (condition) {
    case 'clear':
      return <Sun className={className} aria-hidden="true" />;
    case 'rain':
    case 'heavy-rain':
      return <CloudRain className={className} aria-hidden="true" />;
    case 'snow':
    case 'heavy-snow':
    case 'sleet':
      return <CloudSnow className={className} aria-hidden="true" />;
    case 'thunderstorm':
      return <CloudLightning className={className} aria-hidden="true" />;
    case 'drizzle':
      return <CloudDrizzle className={className} aria-hidden="true" />;
    case 'fog':
      return <CloudFog className={className} aria-hidden="true" />;
    case 'cloudy':
    case 'overcast':
    case 'partly-cloudy':
    default:
      return <Cloud className={className} aria-hidden="true" />;
  }
}

export const FavouriteChip: React.FC<FavouriteChipProps> = ({
  city,
  isSelected,
  onClick,
  onRemove,
  temperature,
  condition,
  className,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'group relative flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2 transition-all outline-none',
        'border border-[var(--color-border)]',
        isSelected
          ? 'bg-primary-500/10 border-primary-500 text-primary-500'
          : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-secondary)] hover:bg-[var(--color-surface-secondary)]',
        'focus-visible:ring-2 focus-visible:ring-primary-500/40',
        className,
      )}
      aria-pressed={isSelected}
      aria-label={`View weather for ${city.name}, ${city.country}`}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        {condition && (
          <ConditionIcon
            condition={condition}
            className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]"
          />
        )}
        <div className="truncate">
          <span className="text-sm font-medium leading-none truncate block">
            {city.name}
          </span>
          <span className="text-xs text-[var(--color-text-tertiary)] truncate block">
            {city.region ? `${city.region}, ${city.country}` : city.country}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {temperature && (
          <span className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
            {temperature}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e);
          }}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-xs text-[var(--color-text-tertiary)]',
            'transition-colors hover:bg-[var(--color-surface-tertiary)] hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
          )}
          aria-label={`Remove ${city.name} from favourites`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
