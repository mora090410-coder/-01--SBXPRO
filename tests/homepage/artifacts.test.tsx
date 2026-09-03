import React from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BoardFragment } from '../../src/features/homepage/artifacts/BoardFragment';
import { ScoreMoment } from '../../src/features/homepage/artifacts/ScoreMoment';
import { useCountUp } from '../../src/features/homepage/atmosphere/useCountUp';
import { demoLive } from '../../src/features/homepage/demoData';

const realMatchMedia = window.matchMedia;
const realObserver = (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
const realRaf = globalThis.requestAnimationFrame;
const realCaf = globalThis.cancelAnimationFrame;

function setReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: reduced && q.includes('reduce'),
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

/** jsdom has no IntersectionObserver. Stub one whose callback we can fire by hand. */
function stubObserver() {
  const state: { fire: (isIntersecting: boolean) => void; observed: Element[] } = {
    fire: () => {},
    observed: [],
  };
  class FakeObserver {
    constructor(cb: IntersectionObserverCallback) {
      state.fire = (isIntersecting: boolean) => {
        cb(
          state.observed.map((target) => ({ target, isIntersecting }) as IntersectionObserverEntry),
          this as unknown as IntersectionObserver,
        );
      };
    }
    observe(el: Element) { state.observed.push(el); }
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
    root = null;
    rootMargin = '';
    thresholds = [];
  }
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = FakeObserver;
  return state;
}

/** A manually pumped rAF, so a roll can be driven frame by frame. */
function stubRaf() {
  const queue: FrameRequestCallback[] = [];
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    queue.push(cb);
    return queue.length;
  }) as typeof globalThis.requestAnimationFrame;
  globalThis.cancelAnimationFrame = (() => {}) as typeof globalThis.cancelAnimationFrame;
  return {
    flush() {
      const pending = queue.splice(0, queue.length);
      for (const cb of pending) cb(0);
    },
    get pending() { return queue.length; },
  };
}

afterEach(() => {
  window.matchMedia = realMatchMedia;
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = realObserver;
  globalThis.requestAnimationFrame = realRaf;
  globalThis.cancelAnimationFrame = realCaf;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('BoardFragment', () => {
  it('is one picture with the winning cell in gold and no readable cells', () => {
    render(<BoardFragment highlight={{ left: 7, top: 4 }} />);
    const grid = screen.getByRole('img', { name: 'Board fragment with the winning square at PHI 4, KC 7' });
    expect(grid).toBeInTheDocument();
    const gold = grid.querySelector('[data-cell="7-4"]');
    expect(gold?.className).toContain('bg-gold');
    expect(gold).toHaveAttribute('aria-hidden', 'true');
    expect(grid.textContent).toContain('OPEN');
  });

  it('pulses the winning cell by class alone, leaving the label and content untouched', () => {
    setReducedMotion(false);
    const observer = stubObserver();
    render(<BoardFragment highlight={{ left: 7, top: 4 }} />);

    const name = 'Board fragment with the winning square at PHI 4, KC 7';
    const grid = screen.getByRole('img', { name });
    const gold = grid.querySelector('[data-cell="7-4"]') as HTMLElement;
    const contentBefore = grid.textContent;

    expect(gold.className).not.toContain('board-cell-pulse');

    act(() => observer.fire(true));

    // Class-driven only: same accessible name, same DOM content, same gold fill.
    expect(gold.className).toContain('board-cell-pulse');
    expect(gold.className).toContain('bg-gold');
    expect(screen.getByRole('img', { name })).toBe(grid);
    expect(grid.textContent).toBe(contentBefore);
  });

  it('never pulses under reduced motion', () => {
    setReducedMotion(true);
    const observer = stubObserver();
    render(<BoardFragment highlight={{ left: 7, top: 4 }} />);
    const grid = screen.getByRole('img', { name: 'Board fragment with the winning square at PHI 4, KC 7' });
    act(() => observer.fire(true));
    expect((grid.querySelector('[data-cell="7-4"]') as HTMLElement).className).not.toContain('board-cell-pulse');
  });
});

describe('useCountUp', () => {
  it('returns the target immediately when disabled', () => {
    setReducedMotion(false);
    stubRaf();
    const { result } = renderHook(() => useCountUp(17, { disabled: true, started: true }));
    expect(result.current).toBe(17);
  });

  it('returns the target immediately under reduced motion, even once started', () => {
    setReducedMotion(true);
    stubRaf();
    const { result } = renderHook(() => useCountUp(17, { started: true }));
    expect(result.current).toBe(17);
  });

  it('holds the target while the observer never fires', () => {
    setReducedMotion(false);
    stubRaf();
    const { result } = renderHook(() => useCountUp(14, { started: false }));
    expect(result.current).toBe(14);
  });

  it('rolls from zero and lands exactly on the target', () => {
    setReducedMotion(false);
    const raf = stubRaf();
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(0);

    const { result, rerender } = renderHook(
      ({ started }: { started: boolean }) => useCountUp(17, { started, durationMs: 900 }),
      { initialProps: { started: false } },
    );
    expect(result.current).toBe(17);

    act(() => { rerender({ started: true }); });
    expect(result.current).toBe(0);

    now.mockReturnValue(450);
    act(() => { raf.flush(); });
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThanOrEqual(17);

    now.mockReturnValue(2000);
    act(() => { raf.flush(); });
    expect(result.current).toBe(17);
    expect(raf.pending).toBe(0);
  });
});

describe('ScoreMoment', () => {
  it('renders both scores with accessible labels and the live tag', () => {
    render(<ScoreMoment />);
    expect(screen.getByRole('img', { name: 'Kansas City 17' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Philadelphia 14' })).toBeInTheDocument();
    expect(screen.getByText('Live · Q3')).toBeInTheDocument();
    expect(screen.getByText(/Sample score/)).toBeInTheDocument();
  });

  it('renders the true scores when there is no IntersectionObserver at all', () => {
    setReducedMotion(false);
    (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = undefined;
    render(<ScoreMoment />);
    expect(screen.getByRole('img', { name: 'Kansas City 17' }).textContent).toBe('17');
    expect(screen.getByRole('img', { name: 'Philadelphia 14' }).textContent).toBe('14');
  });

  it('lands on the true final scores after the observer fires', () => {
    setReducedMotion(false);
    const observer = stubObserver();
    const raf = stubRaf();
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(0);

    render(<ScoreMoment />);
    act(() => { observer.fire(true); });
    // Mid-roll the glyphs are below the target, but the accessible names are not.
    expect(screen.getByRole('img', { name: 'Kansas City 17' })).toBeInTheDocument();

    now.mockReturnValue(5000);
    act(() => { raf.flush(); });
    expect(screen.getByRole('img', { name: 'Kansas City 17' }).textContent).toBe('17');
    expect(screen.getByRole('img', { name: 'Philadelphia 14' }).textContent).toBe('14');
  });

  it('keeps the source and checked-time line final, unanimated, and never delayed', () => {
    setReducedMotion(false);
    stubObserver();
    stubRaf();
    render(<ScoreMoment />);

    const truth = screen.getByText(new RegExp(`^${demoLive.sourceName} · updated `));
    expect(truth).toBeInTheDocument();
    // Truth carries no reveal state, no animation class, and no transition delay.
    expect(truth).not.toHaveAttribute('data-reveal');
    expect(truth.className).not.toContain('animate');
    expect(truth.className).not.toContain('live-dot');
    expect((truth as HTMLElement).style.transitionDelay).toBe('');
    // The quarter and clock are truth too, and are in the DOM on first paint.
    expect(screen.getByText('Live · Q3')).toBeInTheDocument();
    expect(screen.getByText(demoLive.clock)).toBeInTheDocument();
  });

  it('gives the live dot the decorative pulse class and hides it from assistive tech', () => {
    render(<ScoreMoment />);
    const tag = screen.getByText('Live · Q3');
    const dot = tag.querySelector('.live-dot');
    expect(dot).not.toBeNull();
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    // The word carries the meaning; the dot is never the sole signal.
    expect(tag.textContent).toContain('Live');
  });
});
