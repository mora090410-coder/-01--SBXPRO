import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from '../../../design/primitives';

export interface ParallaxOptions {
  /** Maximum vertical travel, in pixels. The hero uses 40. */
  maxPx: number;
  /** Caller-side off switch. When true the hook attaches nothing. */
  disabled?: boolean;
  /** Optional rotation eased across the same range, written to the `rotate` property. */
  rotateFromDeg?: number;
  rotateToDeg?: number;
}

/** Parallax is a desktop affordance only. Below this width the hook is inert. */
const DESKTOP = '(min-width: 768px)';

/**
 * Scroll parallax for one decorative element.
 *
 * It drives the INDEPENDENT `translate` and `rotate` properties, never
 * `transform`. That matters twice over:
 *
 *  1. Tailwind's `rotate-*` / `translate-*` utilities compile to those same
 *     properties in v4. Writing `transform` would not override the class — per
 *     CSS Transforms Level 2 the rendered matrix is
 *     `translate -> rotate -> scale -> transform`, so an inline `transform`
 *     ADDS to the class rotation instead of replacing it. The hero would rest
 *     at 3deg + 3deg = 6deg. Writing `rotate` replaces the class value, which
 *     is what the caller means.
 *  2. `translate` is applied BEFORE `rotate`, so the travel is exactly
 *     vertical. Previously the element's CLASS rotation (`rotate: 3deg`) was
 *     applied before the `transform` property, so the translate inside that
 *     string ran in an already rotated frame and leaked 40*sin(3deg) ~ 2px of
 *     real horizontal displacement.
 *
 * Writes are coalesced into one `requestAnimationFrame` per frame and the
 * scroll listener is `passive`. The first write happens in `useLayoutEffect`,
 * before paint, so a page that loads already scrolled never shows a jump.
 *
 * The hook is completely inert — no listener, no frame, no style write — when
 * `disabled`, when `prefers-reduced-motion: reduce` is set, or when the
 * viewport is below `md`. It also SUBSCRIBES to that breakpoint: narrowing a
 * desktop window or rotating a tablet detaches and clears the inline values, so
 * the element falls back to whatever its classes give it rather than keeping a
 * stale desktop rotation that would cancel the phone one.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>({
  maxPx,
  disabled = false,
  rotateFromDeg,
  rotateToDeg,
}: ParallaxOptions) {
  const ref = useRef<T | null>(null);
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
      if (!el) return;
      touched = el;
      const travel = Math.max(1, window.innerHeight || 1);
      const progress = Math.min(1, Math.max(0, (window.scrollY || 0) / travel));
      // Vertical only. A horizontal translate could widen the document.
      el.style.translate = `0 ${(progress * maxPx).toFixed(2)}px`;
      if (typeof rotateFromDeg === 'number' && typeof rotateToDeg === 'number') {
        const deg = rotateFromDeg + (rotateToDeg - rotateFromDeg) * progress;
        el.style.rotate = `${deg.toFixed(3)}deg`;
      }
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
    };

    /** Detach and hand both properties back to the class values. */
    const detach = () => {
      if (!attached) return;
      attached = false;
      window.removeEventListener('scroll', onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      const el = touched ?? ref.current;
      touched = null;
      if (el) {
        el.style.translate = '';
        el.style.rotate = '';
      }
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
  }, [disabled, reduced, maxPx, rotateFromDeg, rotateToDeg]);

  return ref;
}
