import { useCallback, useId, useRef, useState } from 'react';
import { Search, Loader2, AlertCircle, X, Navigation } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SuggestionList } from './SuggestionList';
import type { CityResult, AppError } from '@/types';

interface CitySearchProps {
  onCitySelect: (city: CityResult) => void;
  onUseCurrentLocation?: () => void;
  isLocating?: boolean;
  disabled?: boolean;
  query: string;
  setQuery: (q: string) => void;
  results: CityResult[];
  isLoading: boolean;
  error: AppError | null;
  recentSearches: CityResult[];
  clearRecentSearches: () => void;
  retry: () => void;
}

export function CitySearch({
  onCitySelect,
  onUseCurrentLocation,
  isLocating = false,
  disabled = false,
  query,
  setQuery,
  results,
  isLoading,
  error,
  recentSearches,
  clearRecentSearches,
  retry,
}: CitySearchProps) {
  const uid = useId();
  const listboxId = `${uid}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const showRecents = trimmedQuery.length === 0 && recentSearches.length > 0;
  const hasResults = results.length > 0;
  const showNoResults =
    trimmedQuery.length >= 2 && !isLoading && !hasResults && !error;

  const visibleItems = showRecents ? recentSearches : results;
  const expanded =
    isOpen &&
    (visibleItems.length > 0 ||
      isLoading ||
      showNoResults ||
      error !== null ||
      !!onUseCurrentLocation);

  const activeItem = activeIndex >= 0 ? visibleItems[activeIndex] : undefined;
  const activeDescendant = activeItem
    ? `${listboxId}-option-${activeItem.id}`
    : undefined;

  const selectCity = useCallback(
    (city: CityResult) => {
      onCitySelect(city);
      setQuery(city.name);
      setIsOpen(false);
      setActiveIndex(-1);
      setValidationError(null);
      inputRef.current?.blur();
    },
    [onCitySelect, setQuery],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!expanded) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < visibleItems.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : visibleItems.length - 1,
        );
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(visibleItems.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeItem) {
          selectCity(activeItem);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay to allow mousedown on suggestion to fire
    setTimeout(() => {
      setIsOpen(false);
      setActiveIndex(-1);

      // Validation
      const val = query.trim();
      if (val.length === 0) {
        setValidationError('Enter a city name to search');
      } else if (val.length < 2) {
        setValidationError('Type at least 2 characters to search');
      } else {
        setValidationError(null);
      }
    }, 150);
  };

  const handleFocus = () => {
    setIsOpen(true);
    setValidationError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
    setValidationError(null);
  };

  return (
    <div className="relative w-full">
      {/* Combobox input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          {isLoading ? (
            <Loader2
              size={18}
              className="animate-spin text-[var(--color-text-tertiary)]"
              aria-hidden="true"
            />
          ) : (
            <Search
              size={18}
              className="text-[var(--color-text-tertiary)]"
              aria-hidden="true"
            />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendant}
          aria-autocomplete="list"
          aria-label="Search for a city"
          aria-invalid={validationError ? 'true' : undefined}
          aria-describedby={validationError ? `${uid}-error` : undefined}
          placeholder="Search for a city…"
          value={query}
          disabled={disabled}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full min-h-11 rounded-lg border bg-[var(--color-surface)] py-2.5 pl-10 pr-12',
            'text-base sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]',
            'transition-colors',
            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            validationError
              ? 'border-error-500'
              : 'border-[var(--color-border)]',
          )}
        />

        {/* Clear button */}
        {query.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className={cn(
              'absolute inset-y-0 right-0 min-h-11 min-w-11 flex items-center justify-center',
              'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg',
            )}
            aria-label="Clear search"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}

        {/* Current location button when input is empty */}
        {query.length === 0 && onUseCurrentLocation && !disabled && (
          <button
            type="button"
            onClick={onUseCurrentLocation}
            disabled={isLocating}
            className={cn(
              'absolute inset-y-0 right-0 min-h-11 min-w-11 flex items-center justify-center',
              'text-[var(--color-text-tertiary)] hover:text-sky-500',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg transition-colors',
            )}
            title="Use current location"
            aria-label="Use current location"
          >
            {isLocating ? (
              <Loader2 size={16} className="animate-spin text-sky-500" />
            ) : (
              <Navigation size={16} />
            )}
          </button>
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <p
          id={`${uid}-error`}
          role="alert"
          className="mt-1 text-xs text-error-500"
        >
          {validationError}
        </p>
      )}

      {/* Dropdown */}
      {expanded && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border',
            'border-[var(--color-border)] bg-[var(--color-surface)]',
            'shadow-lg',
          )}
        >
          {/* Quick option: Use device location */}
          {onUseCurrentLocation && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onUseCurrentLocation();
                setIsOpen(false);
              }}
              disabled={isLocating}
              className="flex w-full min-h-11 items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)] transition-colors text-left"
            >
              {isLocating ? (
                <Loader2 size={16} className="animate-spin text-sky-500 shrink-0" />
              ) : (
                <Navigation size={16} className="shrink-0" />
              )}
              <span>{isLocating ? 'Locating your device…' : 'Use current device location'}</span>
            </button>
          )}
          {/* Recent searches */}
          {showRecents && (
            <SuggestionList
              items={recentSearches}
              activeIndex={activeIndex}
              listboxId={listboxId}
              onSelect={selectCity}
              label="Recent"
              headerAction={
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearRecentSearches();
                  }}
                  className="min-h-11 min-w-11 inline-flex items-center justify-center text-xs font-medium text-primary-500 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded px-2"
                >
                  Clear
                </button>
              }
            />
          )}

          {/* Loading */}
          {isLoading && !showRecents && (
            <div className="flex items-center justify-center py-6" role="status">
              <Loader2
                size={20}
                className="animate-spin text-[var(--color-text-tertiary)]"
                aria-hidden="true"
              />
              <span className="ml-2 text-sm text-[var(--color-text-tertiary)]">
                Searching…
              </span>
            </div>
          )}

          {/* Results */}
          {!showRecents && hasResults && !isLoading && (
            <SuggestionList
              items={results}
              activeIndex={activeIndex}
              listboxId={listboxId}
              onSelect={selectCity}
            />
          )}

          {/* No results */}
          {showNoResults && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                No cities match &lsquo;{trimmedQuery}&rsquo;. Check the
                spelling or try a larger nearby city.
              </p>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <AlertCircle
                size={24}
                className="text-error-500"
                aria-hidden="true"
              />
              <p className="text-sm text-[var(--color-text-secondary)]">
                {error.message}
              </p>
              {error.retryable && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    retry();
                  }}
                  className={cn(
                    'mt-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium',
                    'bg-primary-500 text-white hover:bg-primary-600',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    'transition-colors',
                  )}
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
