import { readFileSync } from 'node:fs';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Grain, IslandRings, Reveal, Ring, SectionTone } from '../../src/design/primitives';

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

  it('never hides content that already intersects the first viewport', () => {
    setReducedMotion(false);
    const observer = stubObserver();
    // jsdom lays everything out at 0x0, which reads as above the fold anyway.
    // Pin it explicitly so the assertion is about the rule, not about jsdom.
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ top: 120, bottom: 260, left: 0, right: 0, width: 0, height: 140, x: 0, y: 120, toJSON: () => ({}) } as DOMRect);

    render(<Reveal delay={180}><p>above the fold</p></Reveal>);
    const node = screen.getByText('above the fold').parentElement!;

    // No attribute, so no `opacity: 0` — it is the LCP candidate it looks like,
    // and anything focusable inside it is focusable at full opacity.
    expect(node.hasAttribute('data-reveal')).toBe(false);
    expect(observer.observed).toHaveLength(0);
    rect.mockRestore();
  });

  it('sets pending before paint, then in when the observer intersects, then disconnects', () => {
    setReducedMotion(false);
    const observer = stubObserver();
    // Below the fold: window.innerHeight is 768 in jsdom.
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ top: 2000, bottom: 2140, left: 0, right: 0, width: 0, height: 140, x: 0, y: 2000, toJSON: () => ({}) } as DOMRect);
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
    rect.mockRestore();
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

describe('Ring', () => {
  const SIZE = 28;
  const CIRCUMFERENCE = 2 * Math.PI * ((SIZE - 3) / 2);
  /** The finished arc for value=0.75: three quarters of the circle drawn. */
  const FINAL = String(CIRCUMFERENCE * 0.25);

  /** The one circle that carries the value; the first is the hairline track. */
  function arcOf(container: HTMLElement): SVGCircleElement {
    return container.querySelectorAll('circle')[1] as SVGCircleElement;
  }

  /** Put the ring below the fold, so the first-viewport bail does not apply. */
  function belowTheFold() {
    return vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ top: 2000, bottom: 2028, left: 0, right: 28, width: 28, height: 28, x: 0, y: 2000, toJSON: () => ({}) } as DOMRect);
  }

  it('renders its final stroke-dashoffset immediately with no growOnEnter', () => {
    setReducedMotion(false);
    const observer = stubObserver();
    const { container } = render(<Ring value={0.75} label="75 of 100 squares filled" caption="75%" />);
    const arc = arcOf(container);

    // The attribute is the resting state and it is already correct.
    expect(arc.getAttribute('stroke-dashoffset')).toBe(FINAL);
    // Nothing was written inline, so nothing has to be released later.
    expect(arc.style.getPropertyValue('stroke-dashoffset')).toBe('');
    // A ring that did not opt in never watches the viewport at all.
    expect(observer.observed).toHaveLength(0);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', '75 of 100 squares filled');
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders its final stroke-dashoffset immediately with growOnEnter under reduced motion', () => {
    setReducedMotion(true);
    const observer = stubObserver();
    const { container } = render(<Ring value={0.75} label="75 of 100 squares filled" caption="75%" growOnEnter />);
    const arc = arcOf(container);

    expect(arc.getAttribute('stroke-dashoffset')).toBe(FINAL);
    expect(arc.style.getPropertyValue('stroke-dashoffset')).toBe('');
    expect(observer.observed).toHaveLength(0);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', '75 of 100 squares filled');
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders its final stroke-dashoffset immediately with growOnEnter and no IntersectionObserver', () => {
    setReducedMotion(false);
    (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = undefined;
    const { container } = render(<Ring value={0.75} label="75 of 100 squares filled" caption="75%" growOnEnter />);
    const arc = arcOf(container);

    expect(arc.getAttribute('stroke-dashoffset')).toBe(FINAL);
    expect(arc.style.getPropertyValue('stroke-dashoffset')).toBe('');
  });

  it('renders its final stroke-dashoffset immediately when the observer never fires', () => {
    // The failure this fences: opted in, motion allowed, an observer that is
    // available but never calls back. Without the first-viewport bail the ring
    // is emptied here and nothing ever releases it, so it rests EMPTY forever
    // while the label goes on announcing 75%. The bail is what makes an arc
    // that is already on screen never get emptied in the first place.
    setReducedMotion(false);
    const observer = stubObserver();
    const { container } = render(<Ring value={0.75} label="75 of 100 squares filled" caption="75%" growOnEnter />);
    const arc = arcOf(container);

    expect(arc.style.getPropertyValue('stroke-dashoffset')).toBe('');
    expect(arc.getAttribute('stroke-dashoffset')).toBe(FINAL);
    expect(observer.observed).toHaveLength(0);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', '75 of 100 squares filled');
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('leaves the arc full when reduced motion is switched off after the ring has scrolled past', () => {
    // Live `matchMedia` listener: reduce on at load, off later. The effect
    // re-runs against an element now ABOVE the viewport, where no scroll can
    // ever make an observer fire. Bailing is the only outcome that is not a
    // permanently empty ring.
    setReducedMotion(false);
    const observer = stubObserver();
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ top: -900, bottom: -872, left: 0, right: 28, width: 28, height: 28, x: 0, y: -900, toJSON: () => ({}) } as DOMRect);

    const { container } = render(<Ring value={0.75} label="75 of 100 squares filled" caption="75%" growOnEnter />);
    const arc = arcOf(container);

    expect(arc.style.getPropertyValue('stroke-dashoffset')).toBe('');
    expect(arc.getAttribute('stroke-dashoffset')).toBe(FINAL);
    expect(observer.observed).toHaveLength(0);
    rect.mockRestore();
  });

  it('starts empty before paint, releases to the real value on first intersection, then disconnects', () => {
    setReducedMotion(false);
    const observer = stubObserver();
    const rect = belowTheFold();
    const { container } = render(<Ring value={0.75} label="75 of 100 squares filled" caption="75%" growOnEnter />);
    const arc = arcOf(container);

    // The observed element is the wrapping span, which has a real CSS box.
    // Observing the `<circle>` is a cross-engine hazard: an engine may never
    // fire for an SVG child, which would strand the empty value below.
    expect(observer.observed).toHaveLength(1);
    expect(observer.observed[0]!.tagName).toBe('SPAN');
    expect(observer.observed[0] === container.querySelector('span')).toBe(true);

    // Empty start is an INLINE style. The attribute underneath still holds the
    // real value, so the number is never lost even mid-animation.
    expect(arc.style.getPropertyValue('stroke-dashoffset')).toBe(String(CIRCUMFERENCE));
    expect(arc.getAttribute('stroke-dashoffset')).toBe(FINAL);
    // The label states the real value while the arc is still empty.
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', '75 of 100 squares filled');
    expect(screen.getByText('75%')).toBeInTheDocument();

    observer.fire(false);
    expect(arc.style.getPropertyValue('stroke-dashoffset')).toBe(String(CIRCUMFERENCE));

    observer.fire(true);
    // Released by REMOVAL, so the attribute takes over again.
    expect(arc.style.getPropertyValue('stroke-dashoffset')).toBe('');
    expect(arc.getAttribute('stroke-dashoffset')).toBe(FINAL);
    expect(observer.disconnected).toBeGreaterThan(0);
    rect.mockRestore();
  });

  it('disconnects the observer on unmount without ever having intersected', () => {
    setReducedMotion(false);
    const observer = stubObserver();
    const rect = belowTheFold();
    const { unmount } = render(<Ring value={0.4} label="40 of 100 squares filled" caption="40%" growOnEnter />);
    expect(observer.disconnected).toBe(0);
    unmount();
    expect(observer.disconnected).toBeGreaterThan(0);
    rect.mockRestore();
  });
});

describe('IslandRings growOnEnter', () => {
  const rings = [
    { value: 0.75, label: '75 of 100 squares filled', caption: '75%' },
    { value: 0.5, label: '50 of 75 squares paid', caption: '50%' },
  ];

  it('does not opt any ring in by default, so the organizer workspace is untouched', () => {
    setReducedMotion(false);
    const observer = stubObserver();
    render(<IslandRings rings={rings} />);
    expect(observer.observed).toHaveLength(0);
  });

  it('forwards the opt-in to every ring when the homepage preview asks for it', () => {
    setReducedMotion(false);
    const observer = stubObserver();
    // Below the fold, or the first-viewport bail would (correctly) skip both.
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ top: 2000, bottom: 2028, left: 0, right: 28, width: 28, height: 28, x: 0, y: 2000, toJSON: () => ({}) } as DOMRect);
    render(<IslandRings rings={rings} growOnEnter />);
    expect(observer.observed).toHaveLength(2);
    rect.mockRestore();
  });
});

describe('device rim light', () => {
  const tokens = readFileSync('src/design/tokens.css', 'utf8');
  const rule = tokens.slice(tokens.indexOf('.device-rim::before'), tokens.indexOf('}', tokens.indexOf('mask-composite: exclude')));

  it('is a single-hue gradient, not a multi-color one', () => {
    const stops = [...rule.matchAll(/rgba?\([^)]*\)|var\(--g-rim[\w-]*\)/g)].map(([s]) => s);
    // Every stop resolves to one of the three white rim tokens: one hue, three alphas.
    expect(stops.length).toBeGreaterThan(2);
    for (const stop of stops) expect(stop).toMatch(/^var\(--g-rim(-soft|-none)?\)$/);
    for (const name of ['--g-rim', '--g-rim-soft', '--g-rim-none']) {
      expect(tokens).toMatch(new RegExp(`${name}:\\s*rgba\\(255, 255, 255, [\\d.]+\\)`));
    }
  });

  it('is an edge, not a corner glow: the gradient is directional and fully out before halfway', () => {
    expect(rule).toContain('linear-gradient(');
    expect(rule).not.toContain('radial-gradient');
    expect(rule).toMatch(/linear-gradient\(\s*145deg/);
    const lastStop = Number(rule.match(/var\(--g-rim-none\)\s*(\d+)%/)![1]);
    expect(lastStop).toBeLessThanOrEqual(50);
  });

  it('cannot change the frame box or add overflow, and is not animated', () => {
    expect(rule).toContain('position: absolute');
    expect(rule).toContain('inset: 0');
    expect(rule).toContain('pointer-events: none');
    expect(rule).not.toMatch(/animation|transition/);
  });

  it('is defined once, as a containing block plus its own stacking context and nothing else', () => {
    const frame = readFileSync('src/features/homepage/renders/PhoneFrame.tsx', 'utf8');
    // `isolate` scopes the pseudo-element's `z-index: 1` to the frame instead
    // of letting it join an ancestor's stacking context.
    expect(frame).toMatch(/export const RIM = 'relative isolate device-rim'/);
    expect(rule).toContain('z-index: 1');
    // No radius of its own: the rim inherits the frame's, and the frame's is
    // `Glass`'s `rounded-card`. The dead 32px override is gone from the markup
    // (comments stripped first, since one explains why it left).
    const code = frame.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(code).not.toMatch(/rounded-/);
    // The exported hover lift is untouched: still `translate`, still motion-safe.
    expect(frame).toContain('motion-safe:hover:-translate-y-1');
    expect(frame).toContain("transitionProperty: 'background-color, translate, box-shadow'");
  });

  it('reaches every framed artifact on the page from that one definition', () => {
    const frame = readFileSync('src/features/homepage/renders/PhoneFrame.tsx', 'utf8');
    const organizer = readFileSync('src/features/homepage/renders/OrganizerPreview.tsx', 'utf8');
    // Both phone aspects here...
    expect([...frame.matchAll(/\$\{RIM\}/g)]).toHaveLength(2);
    // ...and the organizer preview, which shares the class rather than the CSS.
    expect(organizer).toMatch(/import \{[^}]*\bRIM\b[^}]*\} from '\.\/PhoneFrame'/);
    expect([...organizer.matchAll(/\$\{RIM\}/g)]).toHaveLength(1);
    // The rim can only ever be clipped, never scrolled to: the frame clips.
    expect(organizer).toContain('overflow-hidden');
    // No second copy of the gradient anywhere outside `tokens.css`.
    expect(organizer).not.toContain('linear-gradient');
    expect(frame).not.toContain('linear-gradient');
  });
});
