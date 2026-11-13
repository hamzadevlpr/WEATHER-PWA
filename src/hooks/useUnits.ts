import { useCallback, useMemo } from 'react';
import type { TemperatureUnit } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../services/storage';

interface UnitsContextValue {
  unit: TemperatureUnit;
  setUnit: (unit: TemperatureUnit) => void;
  toggleUnit: () => void;
}

export function useUnits(): UnitsContextValue {
  const [unit, setUnitValue] = useLocalStorage<TemperatureUnit>(
    STORAGE_KEYS.units,
    'celsius',
  );

  const setUnit = useCallback(
    (newUnit: TemperatureUnit) => setUnitValue(newUnit),
    [setUnitValue],
  );

  const toggleUnit = useCallback(
    () => setUnitValue((prev) => (prev === 'celsius' ? 'fahrenheit' : 'celsius')),
    [setUnitValue],
  );

  return useMemo(() => ({ unit, setUnit, toggleUnit }), [unit, setUnit, toggleUnit]);
}
