import React from 'react';
import { Eyebrow, Glass } from '../../../design/primitives';
import { BoardFragment } from './BoardFragment';
import { DEMO_LABEL, demoGame, demoLive, demoWinnerNow, demoWinnerSquares } from '../demoData';

const winning = { left: demoLive.leftScore % 10, top: demoLive.topScore % 10 };

/** Phone-shaped card showing what a parent sees at Q3. Built from primitives; stage 6 swaps in the real viewer. */
export function HeroViewerCard({ className = '' }: { className?: string }) {
  return (
    <Glass as={'figure' as unknown as 'article'} aria-label="Sample game-day view" padding="none" className={`w-[300px] max-w-full flex flex-col gap-5 p-5 ${className}`.trim()}>
      <div className="self-center inline-flex items-center gap-3 h-10 px-4 rounded-capsule bg-chyron text-broadcast-white font-mono tabular-nums text-[14px]">
        <span>{demoGame.leftAbbr} {demoLive.leftScore}</span>
        <span className="text-broadcast-white/40">·</span>
        <span>{demoGame.topAbbr} {demoLive.topScore}</span>
        <span className="text-broadcast-white/40">·</span>
        <span className="text-live">Q{demoLive.period}</span>
      </div>
      <h3 className="font-display text-[26px] leading-[1.05] text-fg">{demoGame.title}</h3>
      <div className="flex flex-col gap-2">
        <Eyebrow>Your squares · {demoWinnerNow} · {demoWinnerSquares.length}</Eyebrow>
        <ul className="flex flex-wrap gap-2" aria-label="Your squares">
          {demoWinnerSquares.map((s) => (
            <li key={`${s.left}-${s.top}`} className="inline-flex items-center h-8 px-3 rounded-capsule border border-hairline font-mono tabular-nums text-[13px] text-fg">
              {demoGame.topAbbr} {s.top} · {demoGame.leftAbbr} {s.left}
            </li>
          ))}
        </ul>
      </div>
      <p className="font-ui text-[15px] font-medium text-gold">{demoWinnerNow} wins right now</p>
      <BoardFragment highlight={winning} className="self-start" />
      <figcaption className="font-mono text-[12px] text-fg-3">{DEMO_LABEL}</figcaption>
    </Glass>
  );
}
