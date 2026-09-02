import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DUR_REDUCED, DUR_SPRING, DUR_STATE, EASE_STATE, durations, useReducedMotion } from '../../src/design/primitives/motion';

describe('motion', () => {
  it('exports the two curves', () => {
    expect(EASE_STATE).toBe('cubic-bezier(0.2, 0, 0, 1)');
    expect(DUR_STATE).toBe(200);
    expect(DUR_SPRING).toBe(450);
  });

  it('collapses both durations to the reduced value', () => {
    expect(durations(false)).toEqual({ state: 200, spring: 450 });
    expect(durations(true)).toEqual({ state: DUR_REDUCED, spring: DUR_REDUCED });
  });

  it('reads prefers-reduced-motion', () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduce'), media: q, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
    window.matchMedia = original;
  });
});
