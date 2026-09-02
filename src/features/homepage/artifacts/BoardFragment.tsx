import React from 'react';
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
  const holder = demoBoard.squares[row * 10 + col][0] ?? 'OPEN';
  const label = `Board fragment, ${holder} holds ${demoGame.topAbbr} ${highlight.top} across, ${demoGame.leftAbbr} ${highlight.left} down`;

  return (
    <div role="img" aria-label={label} className={`inline-grid gap-px bg-hairline rounded-cell overflow-hidden ${className}`.trim()} style={{ gridTemplateColumns: `28px repeat(${size}, minmax(0, 1fr))` }}>
      <div className="bg-ground" />
      {cols.map((c) => (
        <div key={`t${c}`} className="bg-ground h-7 flex items-center justify-center font-mono text-[12px] text-fg-3">{demoBoard.topAxis[c]}</div>
      ))}
      {rows.map((r) => (
        <React.Fragment key={`r${r}`}>
          <div className="bg-ground w-7 flex items-center justify-center font-mono text-[12px] text-fg-3">{demoBoard.leftAxis[r]}</div>
          {cols.map((c) => {
            const names = demoBoard.squares[r * 10 + c];
            const name = names[0] ?? '';
            const isOpen = name === 'OPEN' || name === '';
            const isHit = r === row && c === col;
            return (
              <div
                key={`c${r}-${c}`}
                data-cell={`${demoBoard.leftAxis[r]}-${demoBoard.topAxis[c]}`}
                className={`h-12 px-1 flex items-center justify-center text-center font-ui text-[12px] leading-tight rounded-cell ${isHit ? 'bg-gold text-ink font-medium' : isOpen ? 'bg-panel text-fg-3' : 'bg-ground text-fg'}`}
              >
                {isOpen ? 'OPEN' : name}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
