import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../../design/primitives';

export interface ParallaxOptions {
  /** Maximum vertical travel, in pixels. The hero uses 40. */
  maxPx: number;
  /** Caller-side off switch. When true the hook attaches nothing. */
  disabled?: boolean;
  /** Optional rotation eased across the same range, composed into one transform. */
  rotateFromDeg?: number;
  rotateToDeg?: number;
}

/** Parallax is a desktop affordance only. Below this width the hook is inert. */
const DESKTOP = '(min-width: 768px)';

/**
 * Scroll parallax for one decorative element.
 *
 * It writes a VERTICAL translate and an optional rotation, composed into a
 * single `transform` string. It never writes a horizontal translate, so the
 * document can never grow wider than it already is. Writes are coalesced into
 * one `requestAnimationFrame` per frame and the scroll listener is `passive`.
 *
 * The hook is completely inert — no listener, no frame, no style write — when
 * `disabled`, when `prefers-reduced-motion: reduce` is set, or when the
 * viewport is below `md`. In those cases the returned ref is an ordinary ref
 * and the element keeps whatever transform its classes give it.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>({
  maxPx,
  disabled = false,
  rotateFromDeg,
  rotateToDeg,
}: ParallaxOptions) {
  const ref = useRef<T | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (disabled || reduced) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    if (!window.matchMedia(DESKTOP).matches) return;
    const node = ref.current;
    if (!node) return;

    let frame = 0;

    const write = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const travel = Math.max(1, window.innerHeight || 1);
      const progress = Math.min(1, Math.max(0, (window.scrollY || 0) / travel));
      // Vertical only. A horizontal translate could widen the document.
      let transform = `translate3d(0, ${(progress * maxPx).toFixed(2)}px, 0)`;
      if (typeof rotateFromDeg === 'number' && typeof rotateToDeg === 'number') {
        const deg = rotateFromDeg + (rotateToDeg - rotateFromDeg) * progress;
        transform += ` rotate(${deg.toFixed(3)}deg)`;
      }
      el.style.transform = transform;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    write();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      const el = ref.current;
      if (el) el.style.transform = '';
    };
  }, [disabled, reduced, maxPx, rotateFromDeg, rotateToDeg]);

  return ref;
}
