import { describe, it, expect } from 'vitest';
import { snapToGrid } from '@/lib/grid';

describe('snapToGrid', () => {
  it('snaps position to nearest grid point', () => {
    expect(snapToGrid({ x: 17, y: 23 }, 20)).toEqual({ x: 20, y: 20 });
  });

  it('snaps exactly on grid points', () => {
    expect(snapToGrid({ x: 40, y: 60 }, 20)).toEqual({ x: 40, y: 60 });
  });

  it('rounds to nearest, not floor', () => {
    expect(snapToGrid({ x: 11, y: 9 }, 20)).toEqual({ x: 20, y: 0 });
  });

  it('handles grid size of 1 (no snapping)', () => {
    expect(snapToGrid({ x: 17, y: 23 }, 1)).toEqual({ x: 17, y: 23 });
  });

  it('handles negative coordinates', () => {
    expect(snapToGrid({ x: -13, y: -27 }, 20)).toEqual({ x: -20, y: -20 });
  });
});
