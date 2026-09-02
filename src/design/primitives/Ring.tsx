import React from 'react';

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
}

/** Small SVG ring gauge with a mono caption beneath. */
export function Ring({ value, label, caption, tone = 'fg', size = 28 }: RingProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <svg role="img" aria-label={label} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--g-hairline)" strokeWidth={stroke} />
        <circle
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
