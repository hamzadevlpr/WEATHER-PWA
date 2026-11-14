import React from 'react';
import type { TemperatureUnit } from '@/types';
import { cn } from '@/lib/cn';

export interface UnitToggleProps {
  unit: TemperatureUnit;
  onChange: (unit: TemperatureUnit) => void;
  className?: string;
}

export const UnitToggle: React.FC<UnitToggleProps> = ({
  unit,
  onChange,
  className,
}) => {
  const options: { value: TemperatureUnit; label: string; symbol: string }[] = [
    { value: 'celsius', label: 'Celsius', symbol: '°C' },
    { value: 'fahrenheit', label: 'Fahrenheit', symbol: '°F' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Temperature unit selection"
      className={cn(
        'inline-flex p-1 gap-2 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]',
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = unit === option.value;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={isSelected}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-11 min-w-11 sm:min-h-9 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all outline-none',
              isSelected
                ? 'bg-[var(--color-surface)] text-primary-500 shadow-sm border border-[var(--color-border)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              'focus-visible:ring-2 focus-visible:ring-primary-500/40',
            )}
          >
            <span className="font-semibold text-sm">{option.symbol}</span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};
