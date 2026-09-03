import React from 'react';
import { useReducedMotion } from './motion';

interface SpotlightProps {
  className?: string;
  /**
   * Slow ambient drift: a 12s ease-in-out `scale(1 → 1.04)`, alternating
   * forever. Off by default, and never runs under reduced motion.
   */
  breathe?: boolean;
}

/**
 * The one glow a page is allowed. Place it behind the hero artifact inside a `relative` parent.
 * Default position is centered; override with className (e.g. `right-[-10%] top-[-20%]`).
 *
 * `breathe` drives the drift through the `scale` property rather than
 * `transform`, so it composes with the positioning translate in `className`
 * instead of overwriting it. It is neutralized twice: the class is not emitted
 * under reduced motion, and `tokens.css` kills the animation in its
 * `prefers-reduced-motion: reduce` block.
 */
export function Spotlight({ className = 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2', breathe = false }: SpotlightProps) {
  const reduced = useReducedMotion();
  const drift = breathe && !reduced ? 'spotlight-breathe ' : '';
  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none w-[720px] h-[720px] rounded-full blur-[80px] opacity-80 ${drift}${className}`.trim()}
      style={{ background: 'radial-gradient(circle at center, var(--g-glow) 0%, transparent 65%)' }}
    />
  );
}
