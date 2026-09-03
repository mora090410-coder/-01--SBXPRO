import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Grain, Reveal, SectionTone } from '../../src/design/primitives';

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

/** jsdom has no IntersectionObserver. Stub one whose callback we can fire by hand. */
function stubObserver() {
  const state: {
    fire: (isIntersecting: boolean) => void;
    options?: IntersectionObserverInit;
    observed: Element[];
    disconnected: number;
  } = { fire: () => {}, observed: [], disconnected: 0 };

  class FakeObserver {
    constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      state.options = options;
      state.fire = (isIntersecting: boolean) => {
        cb(
          state.observed.map((target) => ({ target, isIntersecting }) as IntersectionObserverEntry),
          this as unknown as IntersectionObserver,
        );
      };
    }
    observe(el: Element) { state.observed.push(el); }
    unobserve() {}
    disconnect() { state.disconnected += 1; }
    takeRecords() { return []; }
    root = null;
    rootMargin = '';
    thresholds = [];
  }

  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = FakeObserver;
  return state;
}

afterEach(() => {
  window.matchMedia = realMatchMedia;
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = realObserver;
  vi.restoreAllMocks();
});

describe('Reveal', () => {
  it('renders children visible with no data-reveal attribute under reduced motion', () => {
    setReducedMotion(true);
    stubObserver();
    render(<Reveal><p>Score updates about every minute</p></Reveal>);
    const node = screen.getByText('Score updates about every minute').parentElement!;
    expect(node.hasAttribute('data-reveal')).toBe(false);
    expect(node.style.opacity).toBe('');
    expect(node.style.transform).toBe('');
  });

  it('renders children visible with no data-reveal attribute when IntersectionObserver is missing', () => {
    setReducedMotion(false);
    (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = undefined;
    render(<Reveal><p>no observer</p></Reveal>);
    const node = screen.getByText('no observer').parentElement!;
    expect(node.hasAttribute('data-reveal')).toBe(false);
  });

  it('sets pending before paint, then in when the observer intersects, then disconnects', () => {
    setReducedMotion(false);
    const observer = stubObserver();
    render(<Reveal delay={120}><p>reveal me</p></Reveal>);
    const node = screen.getByText('reveal me').parentElement!;

    expect(node.getAttribute('data-reveal')).toBe('pending');
    expect(node.style.transitionDelay).toBe('120ms');
    expect(observer.options).toMatchObject({ rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    observer.fire(false);
    expect(node.getAttribute('data-reveal')).toBe('pending');

    observer.fire(true);
    expect(node.getAttribute('data-reveal')).toBe('in');
    expect(observer.disconnected).toBeGreaterThan(0);
  });

  it('honors the `as` prop and applies className to the rendered element', () => {
    setReducedMotion(true);
    stubObserver();
    const { container } = render(<Reveal as="section" className="mt-8"><p>as prop</p></Reveal>);
    const section = container.querySelector('section')!;
    expect(section).toBeTruthy();
    expect(section.className).toBe('mt-8');
  });
});

describe('SectionTone', () => {
  it('is decorative, click-through, and never a corner glow', () => {
    const { container } = render(<SectionTone tone="live" side="left" />);
    const tone = container.firstElementChild as HTMLElement;
    expect(tone.getAttribute('aria-hidden')).toBe('true');
    expect(tone.className).toContain('pointer-events-none');
    expect(tone.className).toContain('absolute');
    // Vertically centered on an edge, not pinned to a corner.
    expect(tone.className).toContain('top-1/2');
    expect(tone.className).toContain('left-0');
    expect(tone.className).not.toContain('top-0');
    expect(tone.className).not.toContain('bottom-0');
    expect(tone.style.background).toContain('var(--g-tint-live)');
  });

  it('defaults to the right edge and carries no animation', () => {
    const { container } = render(<SectionTone tone="cardinal" />);
    const tone = container.firstElementChild as HTMLElement;
    expect(tone.className).toContain('right-0');
    expect(tone.className).not.toMatch(/animate-|transition/);
    expect(tone.style.background).toContain('var(--g-tint-cardinal)');
  });
});

describe('Grain', () => {
  it('is a fixed, aria-hidden, click-through overlay', () => {
    const { container } = render(<Grain />);
    const grain = container.firstElementChild as HTMLElement;
    expect(grain.getAttribute('aria-hidden')).toBe('true');
    expect(grain.className).toContain('fixed');
    expect(grain.className).toContain('inset-0');
    expect(grain.className).toContain('pointer-events-none');
    expect(grain.style.opacity).toBe('0.035');
    expect(grain.style.mixBlendMode).toBe('overlay');
    expect(grain.style.backgroundImage).toContain('feTurbulence');
  });

  it('accepts an opacity override', () => {
    const { container } = render(<Grain opacity={0.02} />);
    expect((container.firstElementChild as HTMLElement).style.opacity).toBe('0.02');
  });
});
