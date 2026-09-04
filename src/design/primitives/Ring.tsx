import React, { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from './motion';

type Tone = 'fg' | 'gold' | 'live' | 'cardinal';
const STROKE: Record<Tone, string> = {
  fg: 'var(--g-text)',
  gold: 'var(--g-gold)',
  live: 'var(--g-live)',
  cardinal: 'var(--g-cardinal)',
};

export interface RingProps {
  /** 0 to 1 */
  value: number;
  label: string;
  caption: string;
  tone?: Tone;
  size?: number;
  /**
   * Opt in to the entry animation: the arc starts empty and grows to `value`
   * the first time the ring scrolls into view. Off by default, so every
   * existing caller renders exactly as it did before.
   */
  growOnEnter?: boolean;
}

/** Small SVG ring gauge with a mono caption beneath. */
export function Ring({ value, label, caption, tone = 'fg', size = 28, growOnEnter = false }: RingProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arcRef = useRef<SVGCircleElement | null>(null);
  const reduced = useReducedMotion();

  /**
   * Same contract as `Reveal`: the RESTING state is the finished state.
   *
   * `stroke-dashoffset` is rendered as an attribute holding the real value, so
   * a server render, a no-JS browser, a browser without `IntersectionObserver`,
   * and anyone with `prefers-reduced-motion: reduce` all see the true arc
   * immediately, with nothing to wait for. The empty start is an inline style
   * — which outranks the attribute — applied only here, only when animation is
   * actually allowed, and only ever removed again. `useLayoutEffect` runs
   * before paint, so the arc is never seen full and then emptied.
   *
   * Releasing it is a style REMOVAL, not a second write: the attribute
   * underneath is already correct, so a `value` that changes mid-animation
   * still lands on the right number, and the ring can never be left holding a
   * stale inline value.
   *
   * The accessible label and the mono caption always state the real value.
   * Nothing about the number depends on the animation running.
   */
  useLayoutEffect(() => {
    const arc = arcRef.current;
    if (!arc) return;
    const release = () => arc.style.removeProperty('stroke-dashoffset');

    if (!growOnEnter || reduced || typeof IntersectionObserver === 'undefined') {
      release();
      return;
    }

    arc.style.setProperty('stroke-dashoffset', String(c));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            release();
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(arc);
    return () => {
      observer.disconnect();
      release();
    };
  }, [growOnEnter, reduced, c]);

  return (
    <span className="inline-flex flex-col items-center gap-1">
      <svg role="img" aria-label={label} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--g-hairline)" strokeWidth={stroke} />
        <circle
          ref={arcRef}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={STROKE[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset var(--g-dur-spring) var(--g-ease-state)' }}
        />
      </svg>
      <span className="font-mono tabular-nums text-[12px] leading-none text-fg-2">{caption}</span>
    </span>
  );
}
