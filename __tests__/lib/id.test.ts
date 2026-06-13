import { describe, it, expect } from 'vitest';
import { generateId } from '@/lib/id';

describe('generateId', () => {
  it('returns a string of length 21', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(21);
  });

  it('returns unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
