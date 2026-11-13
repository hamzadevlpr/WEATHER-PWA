import { describe, it, expect } from 'vitest';
import {
  wmoCodeToCondition,
  owmCodeToCondition,
} from '@/services/weather/conditions';

describe('Condition Mappings', () => {
  it('maps WMO clear weather codes correctly', () => {
    expect(wmoCodeToCondition(0, true).condition).toBe('clear');
    expect(wmoCodeToCondition(1, true).condition).toBe('clear');
    expect(wmoCodeToCondition(2, true).condition).toBe('partly-cloudy');
    expect(wmoCodeToCondition(3, true).condition).toBe('overcast');
  });

  it('maps WMO rain and storm codes correctly', () => {
    expect(wmoCodeToCondition(61, true).condition).toBe('rain');
    expect(wmoCodeToCondition(65, true).condition).toBe('heavy-rain');
    expect(wmoCodeToCondition(71, true).condition).toBe('snow');
    expect(wmoCodeToCondition(95, true).condition).toBe('thunderstorm');
  });

  it('maps OWM codes accurately', () => {
    expect(owmCodeToCondition(800, '01d').condition).toBe('clear');
    expect(owmCodeToCondition(800, '01n').condition).toBe('clear');
    expect(owmCodeToCondition(800, '01n').isDay).toBe(false);
    expect(owmCodeToCondition(500, '10d').condition).toBe('rain');
    expect(owmCodeToCondition(211, '11d').condition).toBe('thunderstorm');
  });
});
