import { getItem, getJSON, removeItem, setItem, setJSON } from '@/services/storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

describe('Storage Service Degradation & Validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves basic values', () => {
    setItem('test-key', 'test-value');
    expect(getItem('test-key')).toBe('test-value');
    removeItem('test-key');
    expect(getItem('test-key')).toBeNull();
  });

  it('validates schema when reading JSON and removes corrupted values', () => {
    const TestSchema = z.object({ name: z.string(), score: z.number() });

    // Valid data
    setJSON('valid-data', { name: 'Alice', score: 100 });
    const valid = getJSON('valid-data', TestSchema);
    expect(valid).toEqual({ name: 'Alice', score: 100 });

    // Corrupted schema data
    localStorage.setItem('corrupted-data', JSON.stringify({ name: 'Bob', score: 'not-a-number' }));
    const invalid = getJSON('corrupted-data', TestSchema);
    expect(invalid).toBeNull();
    // Verify it was cleaned up
    expect(localStorage.getItem('corrupted-data')).toBeNull();

    // Malformed JSON string
    localStorage.setItem('bad-json', '{unquoted_broken_json');
    const bad = getJSON('bad-json', TestSchema);
    expect(bad).toBeNull();
    expect(localStorage.getItem('bad-json')).toBeNull();
  });

  it('degrades gracefully to in-memory store if localStorage throws', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    // Should not throw even when storage throws
    setItem('memory-key', 'memory-val');
    expect(getItem('memory-key')).toBe('memory-val');

    setItemSpy.mockRestore();
  });
});
