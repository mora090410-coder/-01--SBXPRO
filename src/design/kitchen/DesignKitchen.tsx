import React, { useState } from 'react';
import {
  Base, type BaseKind, CapsuleButton, CapsuleInput, CapsuleTag, Eyebrow, Glass, Island, IslandRings, Numeral, Ring, Sheet, Spotlight,
} from '../primitives';

const RINGS = [
  { value: 0.83, label: '83 percent filled', caption: '83%' },
  { value: 0.5, label: '50 percent paid', caption: '50%', tone: 'gold' as const },
  { value: 1, label: '100 percent drawn', caption: 'Drawn', tone: 'gold' as const },
];

function Panel({ kind }: { kind: BaseKind }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState('');
  return (
    <Base kind={kind} className="relative overflow-hidden p-8 flex flex-col gap-10">
      <Spotlight className="right-[-160px] top-[-200px]" />

      <header className="relative flex flex-col gap-3 max-w-[560px]">
        <Eyebrow>Football squares, run live</Eyebrow>
        <h1 className="font-display text-[56px] leading-[1] tracking-[-0.01em] text-fg">Build it once. Share one link.</h1>
        <p className="font-ui text-[17px] text-fg-2">Let the board run game day.</p>
        <div className="flex items-center gap-3 pt-2">
          <CapsuleButton size="lg">Create your board</CapsuleButton>
          <CapsuleButton variant="ghost">Sign in</CapsuleButton>
        </div>
      </header>

      <Glass as="section" aria-label="Live score" className="relative flex items-end justify-between gap-6 max-w-[560px]">
        <div className="flex flex-col gap-2">
          <Eyebrow>Kansas City</Eyebrow>
          <Numeral value={21} size="xl" label="Kansas City 21" />
        </div>
        <div className="flex flex-col items-center gap-2 pb-2">
          <CapsuleTag tone="live">Live · Q3</CapsuleTag>
          <span className="font-mono text-[13px] text-fg-3">8:12</span>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Eyebrow>Philadelphia</Eyebrow>
          <Numeral value={14} size="xl" label="Philadelphia 14" />
        </div>
      </Glass>

      <div className="relative flex flex-wrap items-center gap-3">
        <CapsuleTag>Draft</CapsuleTag>
        <CapsuleTag tone="gold">Final</CapsuleTag>
        <CapsuleTag tone="cardinal">Corrected</CapsuleTag>
        <Numeral value="$14" secondary=".99" size="lg" label="14 dollars and 99 cents" />
        <Numeral value="3" secondary="squares" size="md" label="3 squares" />
      </div>

      <div className="relative flex items-center gap-8">
        {RINGS.map((r) => <Ring key={r.label} {...r} size={40} />)}
      </div>

      <div className="relative max-w-[420px] flex flex-col gap-4">
        <CapsuleInput label="Find my squares" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <CapsuleInput label="Winner email" placeholder="you@example.com" trailing={<CapsuleButton>Notify me</CapsuleButton>} />
        <CapsuleButton variant="quiet" onClick={() => setSheetOpen(true)}>Open sheet</CapsuleButton>
      </div>

      <Glass as="section" aria-label="Board fragment" padding="none" className="relative w-fit overflow-hidden">
        <div className="grid grid-cols-5 gap-px bg-hairline">
          {['Carrie Moss', 'Open', 'Alex Kim', 'Dana Ortiz', 'Open', 'Sam Lee', 'Open', 'Carrie Moss', 'Pat Nguyen', 'Jo Baker'].map((n, i) => (
            <div key={i} className={`w-20 h-16 flex items-center justify-center rounded-cell text-[13px] font-ui px-1 text-center ${n === 'Open' ? 'bg-panel text-fg-3' : i === 7 ? 'bg-gold text-ink font-medium' : 'bg-ground text-fg'}`}>{n}</div>
          ))}
        </div>
      </Glass>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Find my squares">
        <CapsuleInput label="Name" hideLabel placeholder="Start typing a name" autoFocus />
        <ul className="mt-4 flex flex-col gap-1 font-ui text-[16px]">
          {['Carrie Moss', 'Carrie M.', 'Carl Mosley'].map((n) => <li key={n} className="h-12 flex items-center px-3 rounded-control hover:bg-panel-hover">{n}</li>)}
        </ul>
      </Sheet>
    </Base>
  );
}

export default function DesignKitchen() {
  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        <Panel kind="dark" />
        <Panel kind="cream" />
        <Island
          label="Board status"
          placement="corner"
          collapsed={<IslandRings rings={RINGS} />}
          expanded={(
            <div className="flex flex-col gap-3 min-w-[260px]">
              <p className="font-ui text-[15px] text-broadcast-white/70">83 filled · 17 open · 6 unpaid</p>
              <CapsuleButton>Draw numbers</CapsuleButton>
            </div>
          )}
        />
      </div>
    </div>
  );
}
