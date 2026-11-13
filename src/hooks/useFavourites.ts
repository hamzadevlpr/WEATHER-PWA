import { useCallback, useMemo, useState } from 'react';
import type { CityResult, FavouriteCity } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../services/storage';
import { FavouritesStoreSchema } from '../schemas';

const MAX_FAVOURITES = 5;

interface UseFavouritesReturn {
  favourites: FavouriteCity[];
  addFavourite: (city: CityResult) => boolean;
  removeFavourite: (id: string) => void;
  isFavourite: (id: string) => boolean;
  canAddMore: boolean;
  isAtLimit: boolean;
}

export function useFavourites(): UseFavouritesReturn {
  const [favourites, setFavourites] = useLocalStorage<FavouriteCity[]>(
    STORAGE_KEYS.favourites,
    [],
    FavouritesStoreSchema,
  );

  const [, setPendingRemoveId] = useState<string | null>(null);

  const addFavourite = useCallback(
    (city: CityResult): boolean => {
      if (favourites.length >= MAX_FAVOURITES) return false;
      if (favourites.some((f) => f.id === city.id)) return false;

      const favourite: FavouriteCity = {
        ...city,
        addedAt: Date.now(),
      };

      setFavourites((prev) => [...prev, favourite]);
      return true;
    },
    [favourites, setFavourites],
  );

  const removeFavourite = useCallback(
    (id: string) => {
      setFavourites((prev) => prev.filter((f) => f.id !== id));
      setPendingRemoveId(null);
    },
    [setFavourites],
  );

  const isFavourite = useCallback(
    (id: string) => favourites.some((f) => f.id === id),
    [favourites],
  );

  const canAddMore = useMemo(() => favourites.length < MAX_FAVOURITES, [favourites]);
  const isAtLimit = useMemo(() => favourites.length >= MAX_FAVOURITES, [favourites]);

  return {
    favourites,
    addFavourite,
    removeFavourite,
    isFavourite,
    canAddMore,
    isAtLimit,
  };
}
