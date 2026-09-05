import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BoardFill } from '../../src/features/homepage/artifacts/BoardFill';
import {
  AXIS_FROM,
  AXIS_TO,
  FILL_SEED,
  SQUARE_SPAN,
  WINNER_INDEX,
  axisThreshold,
  fillOrder,
  fillThresholds,
} from '../../src/features/homepage/artifacts/fillOrder';
import { demoBoard, demoGame, demoWinnerNow, demoWinnerSquares } from '../../src/features/homepage/demoData';

/**
 * jsdom implements neither `@property` nor `clamp()` resolution, and it does no
 * layout, so nothing here asserts on rendered opacity or on a computed colour.
 * What jsdom CAN check is the whole contract that decides those values: which
 * elements exist, what `--fill-threshold` each one carries, whether the root
 * carries `data-fill` and `--fill-progress` at all, and what the accessible
 * label says. The visual half is Task 4's Playwright pass.
 */

const realMatchMedia = window.matchMedia;
const realObserver = (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;

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

/** jsdom has no IntersectionObserver, and BoardFill treats its absence as "no motion". */
function stubObserver() {
  class FakeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
    root = null;
    rootMargin = '';
    thresholds = [];
  }
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = FakeObserver;
}

afterEach(() => {
  window.matchMedia = realMatchMedia;
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = realObserver;
  vi.restoreAllMocks();
});

const num = (el: Element, prop: string) =>
  Number((el as HTMLElement).style.getPropertyValue(prop));

describe('fillOrder', () => {
  it('is a permutation of 0..99', () => {
    const order = fillOrder();
    expect(order).toHaveLength(100);
    expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: 100 }, (_, i) => i));
  });

  it('is stable for a given seed and different for another', () => {
    expect(fillOrder(FILL_SEED)).toEqual(fillOrder(FILL_SEED));
    expect(fillOrder(1)).toEqual(fillOrder(1));
    expect(fillOrder(1)).not.toEqual(fillOrder(2));
  });

  it('is a shuffle, not a row-by-row sweep', () => {
    const identity = Array.from({ length: 100 }, (_, i) => i);
    expect(fillOrder()).not.toEqual(identity);
    // Not merely "one swap away" from a sweep either: most squares must move.
    const moved = fillOrder().filter((index, position) => index !== position).length;
    expect(moved).toBeGreaterThan(90);
  });

  it('lands the winning square in the last quarter, so the payoff comes last', () => {
    for (const seed of [FILL_SEED, 1, 2, 7, 12345, 99999]) {
      const order = fillOrder(seed);
      expect(order.indexOf(WINNER_INDEX), `seed ${seed}`).toBeGreaterThanOrEqual(75);
    }
  });

  it('derives the winning index from the demo data rather than hard-coding it', () => {
    const winner = demoWinnerSquares[0]!;
    const row = demoBoard.leftAxis.indexOf(winner.left);
    const col = demoBoard.topAxis.indexOf(winner.top);
    expect(WINNER_INDEX).toBe(row * 10 + col);
    expect(demoBoard.squares[WINNER_INDEX]![0]).toBe(demoWinnerNow);
  });

  it('spreads square thresholds across 0..SQUARE_SPAN and stops before the digits start', () => {
    const thresholds = fillThresholds();
    expect(thresholds).toHaveLength(100);
    expect(Math.min(...thresholds)).toBe(0);
    expect(Math.max(...thresholds)).toBe(SQUARE_SPAN);
    // Every square is fully in before the first digit begins to roll: the CSS
    // ramp is `* 12`, so a cell completes 1/12 of progress past its threshold.
    expect(SQUARE_SPAN + 1 / 12).toBeLessThan(AXIS_FROM);
    expect(axisThreshold(0)).toBe(AXIS_FROM);
    expect(axisThreshold(9)).toBeGreaterThan(axisThreshold(0));
    expect(axisThreshold(9)).toBeLessThanOrEqual(1);
  });
});

describe('BoardFill resting state', () => {
  it('renders 100 squares and both axes, finished, with no progress prop', () => {
    setReducedMotion(false);
    stubObserver();
    const { container } = render(<BoardFill />);

    expect(container.querySelectorAll('[data-cell]')).toHaveLength(100);
    expect(container.querySelectorAll('[data-axis="top"]')).toHaveLength(10);
    expect(container.querySelectorAll('[data-axis="left"]')).toHaveLength(10);

    const root = screen.getByRole('img');
    expect(root).not.toHaveAttribute('data-fill');
    expect(root.style.getPropertyValue('--fill-progress')).toBe('');
  });

  it('shows real names, the OPEN squares, and the real axis digits', () => {
    setReducedMotion(false);
    const { container } = render(<BoardFill />);
    expect(container.textContent).toContain(demoWinnerNow);
    expect(container.textContent).toContain('J. Rivera');
    expect(container.textContent).toContain('OPEN');
    const top = [...container.querySelectorAll('[data-axis="top"]')].map((el) => Number(el.textContent));
    const left = [...container.querySelectorAll('[data-axis="left"]')].map((el) => Number(el.textContent));
    expect(top).toEqual(demoBoard.topAxis);
    expect(left).toEqual(demoBoard.leftAxis);
  });

  it('gives every square a --fill-threshold between 0 and 1', () => {
    setReducedMotion(false);
    const { container } = render(<BoardFill />);
    const cells = [...container.querySelectorAll('[data-fill-cell]')];
    expect(cells).toHaveLength(100);
    for (const cell of cells) {
      const t = num(cell, '--fill-threshold');
      expect(Number.isFinite(t)).toBe(true);
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(1);
    }
    // The winning square is one of the last to arrive.
    const winner = container.querySelector(`[data-fill-cell="${WINNER_INDEX}"]`)!;
    expect(num(winner, '--fill-threshold')).toBeGreaterThan(SQUARE_SPAN * 0.75);
  });

  it('gives every axis digit a threshold in the tail, after the squares', () => {
    setReducedMotion(false);
    const { container } = render(<BoardFill />);
    const axis = [...container.querySelectorAll('[data-axis]')];
    expect(axis).toHaveLength(20);
    for (const digit of axis) {
      const t = num(digit, '--fill-threshold');
      expect(t).toBeGreaterThanOrEqual(AXIS_FROM);
      expect(t).toBeLessThanOrEqual(1);
      expect(t).toBeGreaterThan(SQUARE_SPAN);
    }
  });

  it('is one role="img" whose label identifies an example board, the matchup, and the winning square', () => {
    setReducedMotion(false);
    const { container } = render(<BoardFill />);
    const label = screen.getByRole('img').getAttribute('aria-label')!;
    const winner = demoWinnerSquares[0]!;
    expect(label).toContain('Example board');
    expect(label).toContain(demoGame.title);
    expect(label).toContain(demoGame.meta);
    expect(label).toContain(`${demoGame.topAbbr} ${winner.top}`);
    expect(label).toContain(`${demoGame.leftAbbr} ${winner.left}`);
    expect(label).toContain(demoWinnerNow);
    // Nothing inside the grid is exposed separately.
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(100);
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });
});

describe('BoardFill driven state', () => {
  it('arms only when a caller passes progress and motion is allowed', () => {
    setReducedMotion(false);
    stubObserver();
    render(<BoardFill progress={0.4} />);
    const root = screen.getByRole('img');
    expect(root).toHaveAttribute('data-fill', 'on');
    expect(root.style.getPropertyValue('--fill-progress')).toBe('0.4');
  });

  it('floors a negative progress so the prop can never blank the board', () => {
    // A negative value would hold digit-roll's from-state and floor every
    // square via the clamp — a blank board through the component's own API.
    setReducedMotion(false);
    stubObserver();
    render(<BoardFill progress={-1} />);
    expect(screen.getByRole('img').style.getPropertyValue('--fill-progress')).toBe('0');
  });

  it('finishes the last axis digit before progress reaches 1', () => {
    // The squares carry slack; the digits must too. A driver that plateaus just
    // short of 1.0 would otherwise rest both axis rows permanently half-rolled,
    // with no way for the reader to finish them.
    const css = readTokens();
    const ramp = css.match(/\.board-fill-axis\b[^}]*?\*\s*-(\d+)s\)/s);
    expect(ramp, 'axis ramp not found in tokens.css').not.toBeNull();
    const seconds = Number(ramp![1]);
    // digit-roll runs 1s, so a digit at threshold t completes at t + 1/seconds.
    const lastDigitDoneAt = AXIS_TO + 1 / seconds;
    // Assert the headroom, not a magic bound: the fill must be visibly finished
    // before a driver that plateaus short of 1.0 leaves it stranded.
    expect(1 - lastDigitDoneAt).toBeGreaterThan(0.04);
  });

  it('stays finished under prefers-reduced-motion even when progress is passed', () => {
    setReducedMotion(true);
    stubObserver();
    render(<BoardFill progress={0} />);
    const root = screen.getByRole('img');
    expect(root).not.toHaveAttribute('data-fill');
    expect(root.style.getPropertyValue('--fill-progress')).toBe('');
  });

  it('stays finished when there is no IntersectionObserver to drive it', () => {
    setReducedMotion(false);
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    render(<BoardFill progress={0} />);
    const root = screen.getByRole('img');
    expect(root).not.toHaveAttribute('data-fill');
  });

  it('ignores a progress that is not a finite number', () => {
    setReducedMotion(false);
    stubObserver();
    render(<BoardFill progress={Number.NaN} />);
    expect(screen.getByRole('img')).not.toHaveAttribute('data-fill');
  });

  it('writes progress imperatively, so a scroll driver on the same node is not clobbered', () => {
    setReducedMotion(false);
    stubObserver();
    const { rerender } = render(<BoardFill progress={0.2} className="x" />);
    const root = screen.getByRole('img');
    root.style.setProperty('--fill-progress', '0.9');
    // A re-render that does not change progress leaves the driver's value alone.
    rerender(<BoardFill progress={0.2} className="x" />);
    expect(root.style.getPropertyValue('--fill-progress')).toBe('0.9');
  });

  it('hands the root back through a ref so a driver can write the same element', () => {
    setReducedMotion(false);
    stubObserver();
    const ref = { current: null as HTMLDivElement | null };
    render(<BoardFill progress={0} ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('img'));
  });
});

describe('BoardFill CSS contract', () => {
  const css = readTokens();

  it('registers both custom properties, with only --fill-progress inheriting', () => {
    const progress = block(css, '@property --fill-progress');
    const threshold = block(css, '@property --fill-threshold');
    for (const b of [progress, threshold]) {
      expect(b).toMatch(/syntax:\s*'<number>'/);
      expect(b).toMatch(/initial-value:\s*0/);
    }
    // The container value has to reach the cells; the cell value must not leak.
    expect(progress).toMatch(/inherits:\s*true/);
    expect(threshold).toMatch(/inherits:\s*false/);
  });

  it('resolves a cell entirely in CSS from the two properties', () => {
    expect(css).toContain('clamp(0, calc((var(--fill-progress) - var(--fill-threshold)) * 12), 1)');
  });

  it('scrubs the existing digit-roll keyframe instead of adding a second one', () => {
    const axis = block(css, '[data-fill="on"] .board-fill-axis');
    expect(axis).toContain('digit-roll');
    expect(axis).toContain('paused');
    expect(axis).toMatch(/animation-delay:\s*calc\(\(var\(--fill-progress\) - var\(--fill-threshold\)\) \* -20s\)/);
  });

  it('neutralizes the whole fill under reduced motion and in print', () => {
    const printAt = css.indexOf('@media print');
    // The reduced-motion guard lives in the LAST such block, beside the Reveal one.
    const regions: Record<string, string> = {
      'reduced motion': css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)', printAt), printAt),
      print: css.slice(printAt),
    };
    for (const [name, region] of Object.entries(regions)) {
      expect(region, name).toMatch(/\[data-fill="on"\] \.board-fill-in \{\s*opacity: 1;/);
      expect(region, name).toMatch(/\[data-fill="on"\] \.board-fill-axis \{\s*animation: none;/);
    }
  });
});

function readTokens(): string {
  return readFileSync('src/design/tokens.css', 'utf8');
}

/** The text of the first rule or at-rule whose selector matches, braces balanced. */
function block(css: string, selector: string): string {
  const at = css.indexOf(selector);
  expect(at, `${selector} present in tokens.css`).toBeGreaterThan(-1);
  const open = css.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(at, i + 1);
    }
  }
  throw new Error(`Unbalanced braces after ${selector}`);
}
