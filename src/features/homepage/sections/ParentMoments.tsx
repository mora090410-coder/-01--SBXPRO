import React from 'react';
import { Eyebrow, Glass } from '../../../design/primitives';
import { BoardFragment } from '../artifacts/BoardFragment';
import { demoGame, demoLive, demoWinnerNow, demoWinnerSquares } from '../demoData';

const winning = { left: demoLive.leftScore % 10, top: demoLive.topScore % 10 };

/** A score delta is reachable if it is 0 or any sum of 2, 3, 6, 7, 8 — i.e. 0 or at least 2. */
const reachable = (delta: number) => delta === 0 || delta >= 2;

/** Smallest score pair at or after the current score that lands on the given digits, is reachable for both teams, and is not the current score. */
const nextScoreFor = (pair: { left: number; top: number }) => {
  for (let left = demoLive.leftScore; left < demoLive.leftScore + 40; left += 1) {
    if (left % 10 !== pair.left || !reachable(left - demoLive.leftScore)) continue;
    for (let top = demoLive.topScore; top < demoLive.topScore + 40; top += 1) {
      if (top % 10 !== pair.top || !reachable(top - demoLive.topScore)) continue;
      if (left === demoLive.leftScore && top === demoLive.topScore) continue;
      return { left, top };
    }
  }
  return null;
};

const nextScores = demoWinnerSquares.map(nextScoreFor).filter((s): s is { left: number; top: number } => s !== null);

const moments = [
  {
    heading: 'Where are my squares?',
    body: 'Type a name once. The board remembers it on that phone and lists every square as digits, with a tap to jump to the cell.',
    artifact: (
      <Glass padding="lg" className="flex flex-col gap-3">
        <Eyebrow>Your squares · {demoWinnerNow} · {demoWinnerSquares.length}</Eyebrow>
        <ul className="flex flex-wrap gap-2" aria-label="Your squares">
          {demoWinnerSquares.map((s) => (
            <li key={`${s.left}-${s.top}`} className="inline-flex items-center h-9 px-3 rounded-capsule border border-hairline font-mono tabular-nums text-[14px] text-fg">
              {demoGame.topAbbr} {s.top} · {demoGame.leftAbbr} {s.left}
            </li>
          ))}
        </ul>
      </Glass>
    ),
  },
  {
    heading: 'Who wins right now?',
    body: 'The current digits light one square. If it is yours, the board says so in one line, in gold.',
    artifact: (
      <Glass padding="lg" className="flex flex-col gap-4">
        <p className="font-ui text-[17px] font-medium text-gold">{demoWinnerNow} wins right now</p>
        <BoardFragment highlight={winning} />
      </Glass>
    ),
  },
  {
    heading: 'What score wins next?',
    body: 'A short list of scores that would put you on the winning square this game. Arithmetic, not odds or predictions.',
    artifact: (
      <Glass padding="lg" className="flex flex-col gap-3">
        <Eyebrow>Scores that put {demoWinnerNow} on a winning square</Eyebrow>
        <ul className="flex flex-col gap-2 font-mono tabular-nums text-[15px] text-fg">
          {nextScores.map((s) => (
            <li key={`${s.left}-${s.top}`}>{demoGame.leftAbbr} {s.left} · {demoGame.topAbbr} {s.top}</li>
          ))}
        </ul>
      </Glass>
    ),
  },
];

export function ParentMoments() {
  return (
    <section className="px-6 py-16 md:px-12 md:py-24 flex flex-col gap-16">
      <div className="flex flex-col gap-3 max-w-[560px]">
        <Eyebrow>What a parent sees</Eyebrow>
        <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">Three answers, no scrolling.</h2>
      </div>
      {moments.map((m, i) => (
        <div key={m.heading} className={`grid gap-8 md:grid-cols-2 md:items-center ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
          <div className="flex flex-col gap-3 max-w-[460px]">
            <h3 className="font-display text-[28px] leading-[1.1] text-fg">{m.heading}</h3>
            <p className="font-ui text-[17px] leading-[1.5] text-fg-2">{m.body}</p>
          </div>
          <div className="max-w-[420px] md:justify-self-end">{m.artifact}</div>
        </div>
      ))}
    </section>
  );
}
