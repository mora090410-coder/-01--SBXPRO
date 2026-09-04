import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../../design/primitives';
import { demoBoard, demoGame } from '../demoData';

interface BoardFragmentProps {
  highlight: { left: number; top: number };
  size?: 4 | 5;
  className?: string;
}

/** A slice of the demo board with one cell lit. Axes carry the real digits. */
export function BoardFragment({ highlight, size = 4, className = '' }: BoardFragmentProps) {
  const row = demoBoard.leftAxis.indexOf(highlight.left);
  const col = demoBoard.topAxis.indexOf(highlight.top);
  const rowStart = Math.max(0, Math.min(row - 1, 10 - size));
  const colStart = Math.max(0, Math.min(col - 1, 10 - size));
  const rows = Array.from({ length: size }, (_, i) => rowStart + i);
  const cols = Array.from({ length: size }, (_, i) => colStart + i);
  const label = `Board fragment with the winning square at ${demoGame.topAbbr} ${highlight.top}, ${demoGame.leftAbbr} ${highlight.left}`;

  // One gold pulse on the winning cell the first time the fragment is seen, then
  // rest. Decorative only: the `role="img"` label above already names the winning
  // square, and the cell's gold fill is unchanged whether the pulse runs or not,
  // so nothing here is carried by motion alone. It adds a class and never touches
  // the DOM content or the accessible name.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const [pulsed, setPulsed] = useState(false);

  useEffect(() => {
    if (reduced || typeof IntersectionObserver === 'undefined') return;
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setPulsed(true);
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    // The cell and hairline tokens are translucent, so the fragment carries its own
    // opaque ground: without it the tiles composite over whatever section they sit
    // on and the muted `OPEN` label drops below WCAG AA (axe color-contrast).
    <div ref={rootRef} role="img" aria-label={label} className={`inline-block bg-ground rounded-cell overflow-hidden ${className}`.trim()}>
      <div className="grid gap-px bg-hairline" style={{ gridTemplateColumns: `28px repeat(${size}, minmax(0, 1fr))` }}>
      <div className="bg-ground" aria-hidden="true" />
      {cols.map((c) => (
        <div key={`t${c}`} aria-hidden="true" className="bg-ground h-7 flex items-center justify-center font-mono text-[12px] text-fg-3">{demoBoard.topAxis[c]}</div>
      ))}
      {rows.map((r) => (
        <React.Fragment key={`r${r}`}>
          <div aria-hidden="true" className="bg-ground w-7 flex items-center justify-center font-mono text-[12px] text-fg-3">{demoBoard.leftAxis[r]}</div>
          {cols.map((c) => {
            const names = demoBoard.squares[r * 10 + c];
            const name = names[0] ?? '';
            const isOpen = name === 'OPEN' || name === '';
            const isHit = r === row && c === col;
            // An OPEN tile is `bg-panel` over the grid's `bg-hairline` over the
            // fragment ground, which composites to #3F4046 — the lightest surface
            // on the page. At the shipped `--g-text-3: 0.64` the muted token on
            // that measures 4.79:1 and does clear AA, so this is headroom rather
            // than a rescue: the OPEN label uses the full `text-fg` token (9.03:1)
            // because 0.29 of margin is not enough to spend on decoration, and a
            // tint or a token nudge could take it back. The tile's lighter fill,
            // not the ink, is what still reads OPEN as the quieter of the two
            // states.
            return (
              <div
                key={`c${r}-${c}`}
                aria-hidden="true"
                data-cell={`${demoBoard.leftAxis[r]}-${demoBoard.topAxis[c]}`}
                className={`h-12 px-1 flex items-center justify-center text-center font-ui text-[12px] leading-tight rounded-cell ${isHit ? `bg-gold text-ink font-medium${pulsed ? ' board-cell-pulse' : ''}` : isOpen ? 'bg-panel text-fg' : 'bg-ground text-fg'}`}
              >
                {isOpen ? 'OPEN' : name}
              </div>
            );
          })}
        </React.Fragment>
      ))}
      </div>
    </div>
  );
}
