import { useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../../design/primitives';

export interface CountUpOptions {
  /** Roll length, in milliseconds. */
  durationMs?: number;
  /** Flips true when the number enters view. The roll runs once, on that flip. */
  started?: boolean;
  /** Caller-side off switch. When true the hook is inert and returns the target. */
  disabled?: boolean;
}

/** The same `power3.out` shape the rest of the system eases with. No overshoot. */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A number that rolls to its value once, on entry.
 *
 * The resting value is the REAL value, never zero. The hook returns `target`
 * immediately when `disabled`, when `prefers-reduced-motion: reduce` is set,
 * when there is no `requestAnimationFrame`, and — critically — whenever
 * `started` is false, which is what a missing `IntersectionObserver` or a
 * never-firing observer leaves it as. A viewer can therefore never be stranded
 * on a placeholder or on a wrong number that is not visibly mid-roll, and a
 * server or no-JS render shows the true score on first paint.
 *
 * Only the displayed glyphs roll. Callers must keep any accessible name and any
 * truth line (source, checked time, freshness) on the real value at all times.
 */
export function useCountUp(
  target: number,
  { durationMs = 900, started = false, disabled = false }: CountUpOptions = {},
): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState<number>(target);
  const frame = useRef(0);

  const inert =
    disabled ||
    reduced ||
    typeof window === 'undefined' ||
    typeof window.requestAnimationFrame !== 'function';

  // Layout effect, so the roll's first frame is written before paint: there is
  // no flash of the final number at full opacity ahead of the animation.
  useLayoutEffect(() => {
    if (inert || !started) {
      setValue(target);
      return;
    }

    const startedAt = Date.now();
    let cancelled = false;

    const step = () => {
      frame.current = 0;
      if (cancelled) return;
      const elapsed = Date.now() - startedAt;
      const t = durationMs <= 0 ? 1 : Math.min(1, elapsed / durationMs);
      if (t >= 1) {
        setValue(target);
        return;
      }
      setValue(Math.round(target * easeOutCubic(t)));
      frame.current = window.requestAnimationFrame(step);
    };

    setValue(0);
    frame.current = window.requestAnimationFrame(step);

    return () => {
      cancelled = true;
      if (frame.current) window.cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [inert, started, target, durationMs]);

  return value;
}
