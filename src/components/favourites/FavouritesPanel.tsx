import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, Sparkles } from 'lucide-react';
import type { CityResult, FavouriteCity, WeatherBundle } from '@/types';
import { FavouriteChip } from './FavouriteChip';
import { ConfirmRemoveDialog } from './ConfirmRemoveDialog';
import { fetchWeather } from '@/services/weather';

interface FavouritesPanelProps {
  favourites: FavouriteCity[];
  onSelect: (city: CityResult) => void;
  onRemove: (id: string) => void;
  canAddMore: boolean;
  selectedCityId?: string;
}

// Mini preview hook for favourite item
function FavouriteItemWithWeather({
  city,
  isSelected,
  onClick,
  onRemoveRequest,
}: {
  city: FavouriteCity;
  isSelected: boolean;
  onClick: () => void;
  onRemoveRequest: () => void;
}) {
  const { data } = useQuery<WeatherBundle>({
    queryKey: ['weather', city.latitude, city.longitude],
    queryFn: ({ signal }) => fetchWeather(city, signal),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: true,
  });

  return (
    <FavouriteChip
      city={city}
      isSelected={isSelected}
      onClick={onClick}
      onRemove={onRemoveRequest}
      temperature={data ? `${Math.round(data.current.temperature)}°` : undefined}
      condition={data?.current.condition}
    />
  );
}

export function FavouritesPanel({
  favourites,
  onSelect,
  onRemove,
  canAddMore: _canAddMore,
  selectedCityId,
}: FavouritesPanelProps) {
  const [cityToRemove, setCityToRemove] = useState<FavouriteCity | null>(null);

  return (
    <aside
      className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
      aria-label="Favourite cities"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-sky-500 fill-sky-500/20" />
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
            Favourites
          </h2>
        </div>
        <span className="text-xs font-medium text-[var(--color-text-tertiary)] tabular-nums">
          {favourites.length}/5
        </span>
      </div>

      {favourites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">No saved cities yet</p>
          <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)] max-w-[180px]">
            Search for a city and click the heart icon to save up to 5 favourites.
          </p>
        </div>
      ) : (
        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {favourites.map((fav, index) => (
            <FavouriteItemWithWeather
              key={fav.id || `${fav.name}-${fav.latitude}-${fav.longitude}-${index}`}
              city={fav}
              isSelected={selectedCityId === fav.id}
              onClick={() => onSelect(fav)}
              onRemoveRequest={() => setCityToRemove(fav)}
            />
          ))}
        </div>
      )}

      {favourites.length >= 5 && (
        <p className="text-[11px] text-[var(--color-text-tertiary)] text-center">
          Maximum of 5 favourites reached
        </p>
      )}

      <ConfirmRemoveDialog
        open={!!cityToRemove}
        cityName={cityToRemove?.name ?? ''}
        onConfirm={() => {
          if (cityToRemove) {
            onRemove(cityToRemove.id);
            setCityToRemove(null);
          }
        }}
        onCancel={() => setCityToRemove(null)}
      />
    </aside>
  );
}
