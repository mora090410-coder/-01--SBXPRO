import React from 'react';

export type SectionToneName = 'cardinal' | 'live' | 'gold';

export interface SectionToneProps {
  tone: SectionToneName;
  /** Which vertical edge of the section the light sits on. Never a corner. */
  side?: 'left' | 'right';
  className?: string;
}

const TINT: Record<SectionToneName, string> = {
  cardinal: 'var(--g-tint-cardinal)',
  live: 'var(--g-tint-live)',
  gold: 'var(--g-tint-gold)',
};

/**
 * Ambient ground tone for one section. Zero JS, no animation, decorative only.
 *
 * A single large soft radial of one locked brand color, vertically centered on
 * the section's left or right edge — light in the room, not chromatic UI. It is
 * NOT a `Spotlight`; a page still gets exactly one spotlight, behind its artifact.
 *
 * Contract: place it as the first child of a `relative overflow-hidden` section
 * and give that section's content `relative z-10`. The clip is required, not
 * cosmetic: the blob is edge-anchored and half of it sits outside the section
 * box, and a transformed element contributes to scrollable overflow — without
 * `overflow-hidden` (or `overflow-x-clip`) the page grows horizontally. It
 * is `aria-hidden` and `pointer-events-none`, so it can never be read or clicked.
 * The tint alpha is capped in `tokens.css` so text over it still clears WCAG AA.
 */
export function SectionTone({ tone, side = 'right', className = '' }: SectionToneProps) {
  const edge = side === 'left' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2';
  return (
    <div
      aria-hidden="true"
      className={`absolute z-0 top-1/2 -translate-y-1/2 ${edge} pointer-events-none rounded-full blur-[90px] opacity-[0.55] ${className}`.trim()}
      style={{
        width: 'min(1100px, 140vw)',
        height: 'min(1100px, 140vw)',
        background: `radial-gradient(circle at center, ${TINT[tone]} 0%, transparent 70%)`,
      }}
    />
  );
}
