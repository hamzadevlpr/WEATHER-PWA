import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import type { CityResult } from '@/types';

interface SuggestionListProps {
  items: CityResult[];
  activeIndex: number;
  listboxId: string;
  onSelect: (city: CityResult) => void;
  label?: string;
  headerAction?: React.ReactNode;
}

export const SuggestionList = forwardRef<HTMLUListElement, SuggestionListProps>(
  function SuggestionList(
    { items, activeIndex, listboxId, onSelect, label, headerAction },
    ref,
  ) {
    if (items.length === 0) return null;

    return (
      <div>
        {(label || headerAction) && (
          <div className="flex items-center justify-between px-3 pb-1 pt-2">
            {label && (
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                {label}
              </span>
            )}
            {headerAction}
          </div>
        )}
        <ul
          ref={ref}
          id={listboxId}
          role="listbox"
          aria-label={label ?? 'Search suggestions'}
          className="py-1"
        >
          {items.map((city, index) => {
            const isActive = index === activeIndex;
            const uniqueKey = city.id || `${city.name}-${city.latitude}-${city.longitude}-${index}`;
            const optionId = `${listboxId}-option-${uniqueKey}`;

            return (
              <li
                key={uniqueKey}
                id={optionId}
                role="option"
                aria-selected={isActive}
                className={cn(
                  'flex min-h-[44px] cursor-pointer select-none items-center gap-2 px-3 py-2',
                  'transition-colors',
                  isActive
                    ? 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]',
                )}
                onMouseDown={(e) => {
                  // Prevent input blur before selection
                  e.preventDefault();
                  onSelect(city);
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                    {city.name}
                  </p>
                  <p className="truncate text-xs text-[var(--color-text-tertiary)]">
                    {[city.region, city.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);
