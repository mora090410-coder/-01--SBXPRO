import React from 'react';

interface SpotlightProps {
  className?: string;
}

/**
 * The one glow a page is allowed. Place it behind the hero artifact inside a `relative` parent.
 * Default position is centered; override with className (e.g. `right-[-10%] top-[-20%]`).
 */
export function Spotlight({ className = 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' }: SpotlightProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none w-[720px] h-[720px] rounded-full blur-[80px] opacity-80 ${className}`.trim()}
      style={{ background: 'radial-gradient(circle at center, var(--g-glow) 0%, transparent 65%)' }}
    />
  );
}
