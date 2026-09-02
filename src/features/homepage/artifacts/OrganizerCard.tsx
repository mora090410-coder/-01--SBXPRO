import React from 'react';
import { Glass, IslandRings } from '../../../design/primitives';
import { BoardFragment } from './BoardFragment';
import { demoGame } from '../demoData';

const rings = [
  { value: 0.83, label: '83 percent filled', caption: '83%' },
  { value: 0.5, label: '50 percent paid', caption: '50%', tone: 'gold' as const },
  { value: 1, label: 'Numbers drawn', caption: 'Drawn', tone: 'gold' as const },
];

/** The organizer workspace at a glance, on the cream base. Stage 6 swaps in the real workspace. */
export function OrganizerCard({ className = '' }: { className?: string }) {
  return (
    <div data-base="cream" className={`bg-ground text-fg font-ui rounded-card p-4 ${className}`.trim()}>
      <Glass as={'figure' as unknown as 'article'} aria-label="Sample organizer workspace" padding="lg" className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-[28px] leading-none text-fg">{demoGame.title}</h3>
          <span className="font-mono text-[12px] text-fg-3">Saved</span>
        </div>
        <p className="font-mono text-[13px] text-fg-2">83 filled · 17 open · 6 unpaid</p>
        <BoardFragment highlight={{ left: 7, top: 4 }} size={5} />
        <div className="self-end inline-flex items-center h-14 px-5 rounded-capsule bg-chyron" data-base="dark">
          <IslandRings rings={rings} />
        </div>
      </Glass>
    </div>
  );
}
