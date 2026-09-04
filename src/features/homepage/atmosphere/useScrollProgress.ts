import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import { useReducedMotion } from '../../../design/primitives';

/** The custom property `BoardFill`'s cells read. Written on the board's root. */
const PROPERTY = '--fill-progress';

/** The fill is a desktop affordance only. Below this width nothing attaches. */
const DESKTOP = '(min-width: 768px)';

/**
 * Where the fill starts, as a fraction of the viewport height. The section's
 * top has to travel to 60% of the way down the screen before progress leaves
 * 0 — otherwise the board sits visibly empty for a full viewport of scrolling
 * while the section is still arriving, which reads as broken rather than as
 * anticipation.
 */
const START = 0.6;

export interface ScrollProgressOptions<T extends HTMLElement, U extends HTMLElement> {
  /**
   * The element written to. This must be the same node that carries
   * `data-fill` — i.e. `BoardFill`'s own root, via its `ref` prop. Writing to a
   * wrapper does not work: the board's root sets `--fill-progress` inline for
   * itself when it arms, and an element's own value always shadows an
   * inherited one.
   */
  ref: RefObject<T | null>;
  /**
   * The element measured. Defaults to `ref`. It exists because the board is
   * `position: sticky` while it fills, and a pinned element's
   * `getBoundingClientRect().top` is a constant — it cannot measure its own
   * travel. The section around it can.
   */
  trackRef?: RefObject<U | null>;
  /** Caller-side off switch. When true the hook attaches nothing. */
  disabled?: boolean;
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Drives `--fill-progress` from the scroll position. Returns nothing.
 *
 * **It writes one custom property on one element and does nothing else.** No
 * state, no re-render, no class or attribute toggling, and nothing touched on
 * the 100 cells below it — they resolve their own opacity in CSS from this
 * value and the `--fill-threshold` each carries. A scroll frame is therefore
 * one `setProperty`, which is the whole reason the property exists. If you ever
 * find yourself adding `useState` here, the section will re-render at 60fps
 * with a hundred cells under it, and the design is defeated.
 *
 * Same shape as `useParallax`: writes coalesced into one
 * `requestAnimationFrame`, listeners `{ passive: true }`, first write in
 * `useLayoutEffect` so a page loaded already scrolled is correct before paint,
 * and a `matchMedia` `change` SUBSCRIPTION rather than a single read — a
 * narrowed window or a rotated tablet detaches and hands the property back
 * instead of leaving a stale desktop value behind.
 *
 * The hook is completely inert — no listener, no frame, no write — when
 * `disabled`, under `prefers-reduced-motion: reduce`, or below `md`. In every
 * one of those cases the board keeps the state it renders at rest, which is the
 * finished one.
 */
export function useScrollProgress<T extends HTMLElement = HTMLElement, U extends HTMLElement = HTMLElement>({
  ref,
  trackRef,
  disabled = false,
}: ScrollProgressOptions<T, U>): void {
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (disabled || reduced) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const query = window.matchMedia(DESKTOP);
    let frame = 0;
    let attached = false;
    /** The last element actually written to. React may detach `ref` before this
     *  effect's cleanup runs, so cleanup cannot rely on `ref.current` to undo. */
    let touched: T | null = null;

    const write = () => {
      frame = 0;
      const el = ref.current;
      const track = trackRef?.current ?? el;
      if (!el || !track) return;
      touched = el;

      const viewport = Math.max(1, window.innerHeight || 1);
      const rect = track.getBoundingClientRect();
      // The window runs from "section top 60% down the screen" to "section
      // bottom at the bottom of the screen". A section shorter than that window
      // has no travel to spend, so it is simply finished.
      const start = viewport * START;
      const end = viewport - rect.height;
      const span = start - end;
      const progress = span > 0 ? clamp01((start - rect.top) / span) : 1;

      // Four decimals: the CSS ramp multiplies the difference by 12, so this is
      // finer than a single cell's step and far finer than a rendered pixel,
      // while keeping the written string short.
      el.style.setProperty(PROPERTY, progress.toFixed(4));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    const attach = () => {
      if (attached) return;
      attached = true;
      write();
      window.addEventListener('scroll', onScroll, { passive: true });
      // The window is part of the math, not just the trigger: a resize changes
      // `innerHeight` and therefore the span, with no scroll event to follow.
      window.addEventListener('resize', onScroll, { passive: true });
    };

    /** Detach and hand the property back, so the board falls to its resting
     *  (finished) state rather than keeping a stale half-filled value. */
    const detach = () => {
      if (!attached) return;
      attached = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      const el = touched ?? ref.current;
      touched = null;
      if (el) el.style.removeProperty(PROPERTY);
    };

    const sync = () => {
      if (query.matches) attach();
      else detach();
    };

    sync();
    // Safari < 14 only has the deprecated addListener/removeListener pair.
    if (typeof query.addEventListener === 'function') query.addEventListener('change', sync);
    else if (typeof query.addListener === 'function') query.addListener(sync);

    return () => {
      if (typeof query.removeEventListener === 'function') query.removeEventListener('change', sync);
      else if (typeof query.removeListener === 'function') query.removeListener(sync);
      detach();
    };
  }, [disabled, reduced, ref, trackRef]);
}

/**
 * Whether the caller should hand `BoardFill` a `progress` at all.
 *
 * The board's resting state is the FINISHED board, and it arms itself the
 * moment it is given a finite `progress` — so a caller that passes one on a
 * surface this hook will never drive would leave a permanently empty board.
 * That is exactly the phone case: below `md` the board is not sticky, there is
 * no pinned travel to scrub, and `useScrollProgress` deliberately attaches
 * nothing. The board must therefore be handed no progress at all there.
 *
 * Starts `false`, so the first paint — including a server render, a no-JS
 * document, and the frame before any effect runs — is the finished board. It
 * flips in `useLayoutEffect`, before paint, so there is no flash in either
 * direction. It re-renders exactly twice in a page's life (mount, and a
 * breakpoint crossing), never while scrolling.
 */
export function useFillDriven(): boolean {
  const reduced = useReducedMotion();
  const [desktop, setDesktop] = useState(false);

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    // No observer means `BoardFill` will not arm, so there is nothing to drive.
    if (typeof IntersectionObserver === 'undefined') return;

    const query = window.matchMedia(DESKTOP);
    const sync = () => setDesktop(query.matches);
    sync();

    if (typeof query.addEventListener === 'function') query.addEventListener('change', sync);
    else if (typeof query.addListener === 'function') query.addListener(sync);

    return () => {
      if (typeof query.removeEventListener === 'function') query.removeEventListener('change', sync);
      else if (typeof query.removeListener === 'function') query.removeListener(sync);
    };
  }, []);

  return desktop && !reduced;
}
