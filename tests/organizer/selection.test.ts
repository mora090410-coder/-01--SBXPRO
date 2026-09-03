import { describe, expect, it } from 'vitest';
import { assignable, rangeBetween, toggle } from '../../src/features/organizer/workspace/selection';

const squares = (filled: number[]): string[][] =>
  Array.from({ length: 100 }, (_, index) => (filled.includes(index) ? ['Ann R.'] : []));

describe('selection.toggle', () => {
  it('adds an absent index and removes a present one without mutating the input', () => {
    const start: ReadonlySet<number> = new Set([4]);
    const added = toggle(start, 7);
    expect([...added].sort((a, b) => a - b)).toEqual([4, 7]);
    expect([...start]).toEqual([4]);
    expect([...toggle(added, 4)]).toEqual([7]);
  });
});

describe('selection.rangeBetween', () => {
  it('returns the rectangular block between two corners, row-major and inclusive', () => {
    expect(rangeBetween(0, 11)).toEqual([0, 1, 10, 11]);
    expect(rangeBetween(22, 44)).toEqual([22, 23, 24, 32, 33, 34, 42, 43, 44]);
  });

  it('gives the same block when the anchors are reversed', () => {
    expect(rangeBetween(44, 22)).toEqual(rangeBetween(22, 44));
    expect(rangeBetween(9, 90)).toEqual(rangeBetween(90, 9));
  });

  it('keeps a single cell to itself', () => {
    expect(rangeBetween(35, 35)).toEqual([35]);
  });

  it('spans whole rows rather than the run of indices between the corners', () => {
    const block = rangeBetween(9, 10);
    expect(block).toHaveLength(20);
    expect(block[0]).toBe(0);
    expect(block.at(-1)).toBe(19);
  });
});

describe('selection.assignable', () => {
  it('accepts every index on a draft board, filled or not', () => {
    expect(assignable([0, 1, 2], squares([0]), false)).toEqual({ ok: [0, 1, 2], blocked: [] });
  });

  it('blocks sold squares on a published board and keeps the OPEN ones', () => {
    expect(assignable([0, 1, 2], squares([1]), true)).toEqual({ ok: [0, 2], blocked: [1] });
  });
});
