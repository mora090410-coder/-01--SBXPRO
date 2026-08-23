import React, { Suspense, useState } from 'react';
import type { BoardData, GameState, LiveGameData } from '../../types';

const ViewerShell = React.lazy(() => import('../viewer/shell/ViewerShell'));

const demoGame: GameState = {
  title: 'Lincoln Softball Booster Board',
  meta: 'Chiefs at Eagles · Jan 18, 2026',
  organizationDisplayName: 'Lincoln Softball Boosters',
  leftAbbr: 'KC',
  leftName: 'Kansas City',
  topAbbr: 'PHI',
  topName: 'Philadelphia',
  dates: 'Jan 18, 2026',
  lockTitle: true,
  lockMeta: true,
};

const demoLive: LiveGameData = {
  leftScore: 17,
  topScore: 14,
  quarterScores: {
    Q1: { left: 7, top: 0 },
    Q2: { left: 3, top: 7 },
    Q3: { left: 7, top: 7 },
    Q4: { left: 0, top: 0 },
    OT: { left: 0, top: 0 },
  },
  clock: '6:42',
  period: 3,
  state: 'in',
  detail: '3rd quarter',
  isOvertime: false,
  sourceName: 'Demonstration fixture',
  retrievedAt: '2026-01-18T21:18:00.000Z',
  staleAfter: '2026-01-18T21:19:00.000Z',
  freshness: 'fresh',
};

const demoBoard: BoardData = {
  topAxis: [4, 1, 8, 6, 2, 9, 0, 5, 7, 3],
  leftAxis: [7, 2, 5, 0, 9, 4, 1, 8, 3, 6],
  allowOpenSquares: true,
  isDynamic: false,
  participants: [
    { id: 'taylor-m', displayName: 'Taylor M.', publicLabel: 'Taylor M.' },
    { id: 'ava-r', displayName: 'Ava R.', publicLabel: 'Ava R.' },
    { id: 'open', displayName: 'OPEN', publicLabel: 'OPEN' },
  ],
  squares: Array.from({ length: 100 }, (_, index) => {
    if ([0, 27, 64].includes(index)) return ['Taylor M.'];
    if ([12, 45, 88].includes(index)) return ['Ava R.'];
    if ([9, 71].includes(index)) return ['OPEN'];
    return index % 5 === 0 ? ['Booster'] : [];
  }),
};

const TouchButton = ({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`min-h-11 rounded-full border px-4 text-sm font-bold transition ${active ? 'border-gold bg-gold text-ink' : 'border-broadcast-white/20 bg-broadcast-white/5 text-broadcast-white'}`}
    style={{ minHeight: 44 }}
  >
    {children}
  </button>
);

const OrganizerProof = () => (
  <div className="grid gap-4" aria-label="Organizer demonstration proof">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">B2 organizer artifact</p>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-broadcast-white">Organizer proof</h2>
      <p className="mt-2 text-sm leading-relaxed text-broadcast-white/75">Fill → Reconcile → Draw → Preview → Go Live</p>
    </div>
    <div className="rounded-2xl border border-broadcast-white/15 bg-broadcast-white/95 p-3 text-ink shadow-2xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black">Lincoln Softball Booster Board</p>
          <p className="text-xs text-ink/60">Chiefs at Eagles · assigned 42 / open 58</p>
        </div>
        <span className="rounded-full bg-live-green/15 px-3 py-1 text-xs font-black text-live-green">Ready to preview</span>
      </div>
      <div className="grid grid-cols-10 gap-1" aria-label="Synthetic organizer board preview">
        {demoBoard.squares.map((square, index) => (
          <div key={index} className={`aspect-square rounded-sm border text-[8px] font-bold leading-none ${square[0] === 'Taylor M.' ? 'border-gold bg-gold/30' : square[0] === 'OPEN' || !square[0] ? 'border-ink/10 bg-ink/5 text-ink/40' : 'border-cardinal/20 bg-cardinal/10 text-cardinal'}`}>
            <span className="flex h-full items-center justify-center overflow-hidden px-0.5">{square[0]?.slice(0, 2) || '—'}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
        <div className="rounded-xl bg-ink/5 p-2">Private paid status</div>
        <div className="rounded-xl bg-ink/5 p-2">Axis draw locked</div>
        <div className="rounded-xl bg-ink/5 p-2">Viewer link ready</div>
      </div>
    </div>
  </div>
);

const ViewerProof = () => (
  <div aria-label="Viewer demonstration proof" className="overflow-hidden rounded-2xl border border-broadcast-white/15 bg-ink">
    <div className="border-b border-broadcast-white/15 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">C1 viewer hierarchy</p>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-broadcast-white">Viewer proof</h2>
      <p className="mt-2 text-sm text-broadcast-white/75">Find my squares first. Then current result and next-score paths.</p>
      <p className="mt-3 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm font-bold text-gold">Your squares · Taylor M. · 3</p>
      <p className="mt-2 text-sm font-bold text-broadcast-white">What makes Taylor M. win next?</p>
    </div>
    <div className="max-h-[560px] overflow-auto">
      <Suspense fallback={<p className="p-4 text-broadcast-white">Viewer proof selected.</p>}>
        <ViewerShell
          game={demoGame}
          board={demoBoard}
          live={demoLive}
          liveStatus="LIVE"
          isSynced
          highlights={{ quarterWinners: {}, currentLabel: 'Ava R.' }}
          winnerHistory={[]}
          pendingMilestones={[]}
          selectedPlayer="Taylor M."
          onClearPlayer={() => undefined}
          onFindSquares={() => undefined}
          highlightedCoords={null}
          onScenarioFocus={() => undefined}
          shareCode="DEMO2026"
          servicesEnabled={true}
          organizerPreview={false}
        />
      </Suspense>
    </div>
  </div>
);

export default function HomepageProofArtifact() {
  const [mode, setMode] = useState<'organizer' | 'viewer'>('organizer');

  return (
    <section data-testid="homepage-proof-artifact" className="rounded-surface border border-broadcast-white/10 bg-broadcast-white/[0.04] p-3 shadow-2xl md:p-5" aria-label="GridOne product proof">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="rounded-full border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-gold">Demonstration board — synthetic data</p>
        <div className="flex gap-2" aria-label="Proof mode">
          <TouchButton active={mode === 'organizer'} onClick={() => setMode('organizer')}>Organizer proof</TouchButton>
          <TouchButton active={mode === 'viewer'} onClick={() => setMode('viewer')}>Viewer proof</TouchButton>
        </div>
      </div>
      {mode === 'organizer' ? <OrganizerProof /> : <ViewerProof />}
    </section>
  );
}
