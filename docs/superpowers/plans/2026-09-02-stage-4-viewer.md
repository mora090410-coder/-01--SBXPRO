# Broadcast Glass — Stage 4: Phone Viewer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the presentation layer of the phone viewer (`/b/:shareCode`, `/demo`, organizer preview) on the Broadcast Glass primitives, add the pinned score island, turn Find My Squares into a sheet, and delete the legacy viewer tree and the `viewer_v2` flag. The score path, scenario model, board-grid model, name matching, identity persistence, and notification API are untouched.

**Architecture:** `ViewerShell` keeps its exact `ViewerShellProps` contract (plus one optional `onShare`), so `components/BoardView.tsx` and organizer preview keep working. Every viewer component in `src/features/viewer/**` is restyled in place with the primitives; the pure models (`*Model.ts`) are not edited. `components/board/FindSquaresModal.tsx` keeps its props and matching behavior but renders inside the `Sheet` primitive. `BoardView` renders `ViewerShell` unconditionally; `GameDayHorizon`, `BoardGrid`, and `PlayerFilter` are deleted.

**Tech Stack:** React 19, Tailwind v4, Vitest + Testing Library (jsdom), Playwright. Primitives from `src/design/primitives` (`Base`, `Eyebrow`, `CapsuleButton`, `CapsuleTag`, `CapsuleInput`, `Glass`, `Numeral`, `Sheet`, `Ring`, `Island`, `IslandRings`).

**Spec:** `docs/superpowers/specs/2026-09-01-broadcast-glass-redesign-design.md` §4. Hierarchy rules: `docs/phone-viewer-hierarchy.md`.

## Global Constraints

- Dark base only. Phone-first single column; at `lg` the board moves to a right column as today.
- Do NOT edit: `src/features/viewer/**/​*Model.ts`, `utils/playerNameMatching.ts`, `hooks/**`, `services/**`, `functions/**`, `workers/**`, `supabase/**`, `components/NotificationOptIn.tsx`'s fetch call and payload, `components/BoardView.tsx`'s data, persistence, auth, or organizer branches (only the viewer render branch, the demo banner, the not-found and locked screens, and the header condition change).
- `ViewerShellProps` stays source-compatible; the only addition is `onShare?: () => void`.
- Exact strings that must survive (tests and Playwright pin them): `Find my squares`; `Score updates about every minute`; `Current result`; `Winning square`; `{abbr} {digit} across × {abbr} {digit} down`; `Offline · last known`; `Last known · `; `Checked`; `Using the last-known score checked {time} until scoring reconnects.`; `Using last-known score until scoring reconnects.`; `Scenarios appear after kickoff.`; `Publish this board to show live scenarios.`; `All possible next scores`; `None of the next scores listed here match your squares right now.`; `These are arithmetic score outcomes, not odds or predictions.`; `What score changes the next result?`; `Current result matches now.`; `Next score: `; `View on board top {n} side {n}`; `{n} squares` / `1 square`; `{name} square summary` (region name); `Get winner emails`; `winner email` (form name); `Quarter-winner email for {name}`; `Verify email`; `Final record`; `Board details`; `This board has no assignments yet.`; `Columns: … Rows: … Current square: …` orientation sentence; `Top · {abbr}`; `Side · {abbr}`; `Zoom out`; `Zoom in`; `Center current result`; `Center selected square`; `Current zoom`; `This is a sample board. Ready to run yours?`; `Demo: Super Bowl LIX`; `This link does not open a published GridOne board.`; `Go to GridOne`; `This board is not published yet.`; `Board unavailable`; `Viewer link unavailable`; `No names have been assigned on this board yet.`; `Did you mean…`; `Choose the organizer-entered name`; `No close match. Browse every name`; `Browse every name`; `Name used on board`; `Clear selection`; `browse-name-list` and `name-suggestions` test ids.
- Renamed on purpose: `Reset/Fit` → `Fit`; helper copy under Find becomes `Use the name the organizer wrote on the board.`; `viewer-board-grid-v2` test id → `viewer-board-grid`; the `<main>` keeps `aria-label="{title} viewer"` and drops `data-feature-flag` / `data-variant`.
- Product copy bans (productionCopy test): none of `Viewer proof`, `C1 viewer hierarchy`, `Winner email disclosure`, `standard next-score outcome`, `All next-score outcomes`, `'Unassigned'` (with quotes), `beta convenience`, `organizer to be authoritative`, `settled period`, `queues verified winner notifications` may appear in viewer source. Anti-slop: no icons, no purple.
- Every control ≥ 44px (`h-11`/`min-h-11`); grid controls also `min-w-11`.
- `viewer_v2` removed from `utils/featureFlags.ts`, `components/BoardView.tsx`, `.env.example`, `.env.production`, `tests/featureFlags.test.ts`, Playwright; `organizer_v2` stays. `eventSchema.ts` untouched.
- Every task ends with `npx tsc --noEmit` and `npx vitest run --project unit` green. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File map

| Path | Change |
|---|---|
| `src/features/viewer/shell/ViewerIsland.tsx` | New. Pinned score capsule; expands to authority/freshness/source and the wins-now line. |
| `src/features/viewer/score/ScoreInstrument.tsx` | Restyle: Glass, serif title, Numerals, status block kept. |
| `src/features/viewer/identity/FindSquaresEntry.tsx` | Restyle: primary capsule, selected chip + Clear. |
| `components/board/FindSquaresModal.tsx` | Renders inside `Sheet`; same props, matching, strings, test ids. |
| `src/features/viewer/personal/YourSquaresSummary.tsx` | Restyle: chips row, gold wins-now line, Glass rows. |
| `src/features/viewer/scenarios/ScenarioDisclosure.tsx` | Restyle: mono rows, details kept. |
| `src/features/viewer/notifications/WinnerEmailDisclosure.tsx` + `components/NotificationOptIn.tsx` | Restyle: capsule input + button; API unchanged. |
| `src/features/viewer/details/BoardDetailsDisclosure.tsx` | Restyle; uses `milestoneLabel`. |
| `src/features/viewer/board/ViewerBoardGrid.tsx` | Restyle cells/axes/controls; `Fit`; test id rename. |
| `src/features/viewer/shell/ViewerShell.tsx` | Composition on `Base`, island, order, final-record promotion, `onShare`. |
| `components/BoardView.tsx` | Unconditional `ViewerShell`; demo banner, not-found, locked screens restyled; header only for owner admin; `viewer_v2` removed. |
| Deleted | `components/GameDayHorizon.tsx`, `components/BoardGrid.tsx`, `components/PlayerFilter.tsx`, `playwright-tests/viewer-v2.spec.ts` (replaced by `viewer.spec.ts`). |
| Tests | `tests/viewerShell.test.tsx`, `tests/viewerBoardGrid.test.tsx`, `tests/findSquaresModal.test.tsx`, `tests/customerFlowFixes.test.tsx`, `tests/featureFlags.test.ts` updated; `tests/viewer/island.test.tsx` new. |

---

### Task 1: Score instrument and island

**Files:**
- Modify: `src/features/viewer/score/ScoreInstrument.tsx`
- Create: `src/features/viewer/shell/ViewerIsland.tsx`
- Test: `tests/viewer/scoreInstrument.test.tsx`, `tests/viewer/island.test.tsx`

**Interfaces:**
- `ScoreInstrument` props unchanged (`game, board, live, liveStatus, isSynced`). Renders `<section aria-labelledby="viewer-score-title">` with: `Eyebrow` date, `<h1 id="viewer-score-title">` serif title, matchup line `{leftAbbr} at {topAbbr}`, a `Glass` score row (two `Numeral size="lg"` with labels `{leftName or leftAbbr} {score}`), and the `role="status" aria-live="polite"` block with the same sentences as today.
- `ViewerIsland` props: `{ game: GameState; board: BoardData; live: LiveGameData | null; liveStatus: string; isSynced: boolean; selectedPlayer: string; yourSquares: number; winsNow: boolean }`. Uses `Island` with `placement="top"`, label `"Score"`. Collapsed: `{leftAbbr} {leftScore} · {topAbbr} {topScore} · {periodLabel}` in mono, plus when `selectedPlayer` a `Ring` (`value = yourSquares / 100`, caption `{yourSquares}`, label `{yourSquares} squares for {selectedPlayer}`) tinted gold when `winsNow`. Expanded: authority label and detail, freshness line (with `Last known · ` prefix when stale), `Score updates about every minute`, `live.sourceName` when present, and when `winsNow` the gold line `{selectedPlayer} wins right now`. Returns `null` when `live` is null.

- [ ] **Step 1: Write failing tests**

Create `tests/viewer/scoreInstrument.test.tsx`:
```tsx
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ScoreInstrument from '../../src/features/viewer/score/ScoreInstrument';
import type { BoardData, GameState, LiveGameData } from '../../types';

const board: BoardData = { topAxis: [0,1,2,3,4,5,6,7,8,9], leftAxis: [0,1,2,3,4,5,6,7,8,9], squares: Array.from({ length: 100 }, () => []) };
board.squares[14] = ['Carrie Moss'];
const game: GameState = { title: 'GridOne Bowl', meta: '', leftAbbr: 'KC', leftName: 'Kansas City', topAbbr: 'PHI', topName: 'Philadelphia', dates: 'Sep 13', lockTitle: false, lockMeta: false };
const live = (o: Partial<LiveGameData> = {}): LiveGameData => ({ leftScore: 21, topScore: 14, quarterScores: { Q1: { left: 7, top: 0 }, Q2: { left: 7, top: 7 }, Q3: { left: 7, top: 7 }, Q4: { left: 0, top: 0 }, OT: { left: 0, top: 0 } }, clock: '8:12', period: 3, state: 'in', detail: '3rd quarter', isOvertime: false, sourceName: 'ESPN', retrievedAt: '2026-09-13T20:15:00.000Z', staleAfter: '2026-09-13T20:16:00.000Z', freshness: 'fresh', ...o });

describe('ScoreInstrument', () => {
  it('renders identity, accessible numerals, and the trust sentences', () => {
    render(<ScoreInstrument game={game} board={board} live={live()} liveStatus="LIVE" isSynced />);
    expect(screen.getByRole('heading', { level: 1, name: 'GridOne Bowl' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Kansas City 21' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Philadelphia 14' })).toBeInTheDocument();
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/Current result/);
    expect(status).toHaveTextContent('Carrie Moss');
    expect(status).toHaveTextContent('PHI 4 across × KC 1 down');
    expect(status).toHaveTextContent(/Score updates about every minute/);
    expect(status).toHaveTextContent(/Checked/);
  });

  it('marks stale scores as last known', () => {
    render(<ScoreInstrument game={game} board={board} live={live({ freshness: 'offline' })} liveStatus="LIVE" isSynced />);
    expect(screen.getByRole('status')).toHaveTextContent(/Offline · last known/);
    expect(screen.getByRole('status')).toHaveTextContent(/Last known · /);
  });

  it('shows dashes before a score exists', () => {
    render(<ScoreInstrument game={game} board={board} live={null} liveStatus="PREGAME" isSynced={false} />);
    expect(screen.getAllByText('—').length).toBe(2);
    expect(screen.getByRole('status')).toHaveTextContent('Waiting for score');
  });
});
```

Create `tests/viewer/island.test.tsx`:
```tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ViewerIsland from '../../src/features/viewer/shell/ViewerIsland';
import type { BoardData, GameState, LiveGameData } from '../../types';

const board: BoardData = { topAxis: [0,1,2,3,4,5,6,7,8,9], leftAxis: [0,1,2,3,4,5,6,7,8,9], squares: Array.from({ length: 100 }, () => []) };
const game: GameState = { title: 'GridOne Bowl', meta: '', leftAbbr: 'KC', leftName: 'Kansas City', topAbbr: 'PHI', topName: 'Philadelphia', dates: 'Sep 13', lockTitle: false, lockMeta: false };
const live: LiveGameData = { leftScore: 21, topScore: 14, quarterScores: { Q1: { left: 7, top: 0 }, Q2: { left: 7, top: 7 }, Q3: { left: 7, top: 7 }, Q4: { left: 0, top: 0 }, OT: { left: 0, top: 0 } }, clock: '8:12', period: 3, state: 'in', detail: '3rd quarter', isOvertime: false, sourceName: 'ESPN', retrievedAt: '2026-09-13T20:15:00.000Z', staleAfter: '2026-09-13T20:16:00.000Z', freshness: 'fresh' };

describe('ViewerIsland', () => {
  it('shows the score strip collapsed and trust details expanded', () => {
    render(<ViewerIsland game={game} board={board} live={live} liveStatus="LIVE" isSynced selectedPlayer="" yourSquares={0} winsNow={false} />);
    const toggle = screen.getByRole('button', { name: /Score/ });
    expect(toggle).toHaveTextContent('KC 21');
    expect(toggle).toHaveTextContent('PHI 14');
    expect(screen.queryByText(/Score updates about every minute/)).toBeNull();
    fireEvent.click(toggle);
    expect(screen.getByText(/Score updates about every minute/)).toBeInTheDocument();
    expect(screen.getByText(/ESPN/)).toBeInTheDocument();
  });

  it('adds a ring and the wins-now line once a name is selected', () => {
    render(<ViewerIsland game={game} board={board} live={live} liveStatus="LIVE" isSynced selectedPlayer="Carrie Moss" yourSquares={3} winsNow />);
    expect(screen.getByRole('img', { name: '3 squares for Carrie Moss' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Score/ }));
    expect(screen.getByText('Carrie Moss wins right now')).toBeInTheDocument();
  });

  it('renders nothing without a score', () => {
    const { container } = render(<ViewerIsland game={game} board={board} live={null} liveStatus="PREGAME" isSynced={false} selectedPlayer="" yourSquares={0} winsNow={false} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --project unit tests/viewer`
Expected: island test fails (module missing); score test fails on `getByRole('img')` and `getAllByText('—')`.

- [ ] **Step 3: Rewrite `ScoreInstrument.tsx`**

```tsx
import React from 'react';
import type { BoardData, GameState, LiveGameData } from '../../../../types';
import { Eyebrow, Glass, Numeral } from '../../../design/primitives';
import { buildViewerScoreModel } from './viewerScoreModel';
import { playersForDigits, quarterForLive } from '../scenarios/scenarioModel';

const shortName = (names: string[], empty = 'Unassigned') => {
  if (!names.length) return empty;
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
};

export interface ScoreInstrumentProps {
  game: GameState;
  board: BoardData;
  live: LiveGameData | null;
  liveStatus: string;
  isSynced: boolean;
}

const ScoreInstrument: React.FC<ScoreInstrumentProps> = ({ game, board, live, liveStatus, isSynced }) => {
  const score = buildViewerScoreModel({ live, liveStatus, isSynced });
  const quarter = quarterForLive(live);
  const currentNames = live ? playersForDigits(board, live.topScore % 10, live.leftScore % 10, quarter) : [];
  const stale = live?.freshness === 'stale' || live?.freshness === 'offline' || live?.freshness === 'refreshing';
  const topDigit = live ? live.topScore % 10 : null;
  const sideDigit = live ? live.leftScore % 10 : null;
  const leftLabel = game.leftAbbr || 'AWAY';
  const topLabel = game.topAbbr || 'HOME';

  return (
    <section className="flex flex-col gap-4" aria-labelledby="viewer-score-title">
      <div className="flex flex-col gap-2">
        <Eyebrow>{game.dates || 'Game date pending'}</Eyebrow>
        <h1 id="viewer-score-title" className="font-display text-[34px] leading-[1.05] tracking-[-0.01em] text-fg">{game.title || 'Football squares'}</h1>
        <p className="font-ui text-[15px] text-fg-2">{leftLabel} at {topLabel}</p>
      </div>

      <Glass as="div" padding="lg" className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-4" aria-label="Score">
        <div className="flex flex-col gap-2 min-w-0">
          <Eyebrow>{game.leftName || leftLabel}</Eyebrow>
          {live ? <Numeral value={live.leftScore} size="lg" label={`${game.leftName || leftLabel} ${live.leftScore}`} /> : <span className="font-mono text-[36px] text-fg-3">—</span>}
        </div>
        <span className="font-mono text-[13px] text-fg-3 pb-2">{score.periodLabel}</span>
        <div className="flex flex-col items-end gap-2 min-w-0 text-right">
          <Eyebrow>{game.topName || topLabel}</Eyebrow>
          {live ? <Numeral value={live.topScore} size="lg" label={`${game.topName || topLabel} ${live.topScore}`} /> : <span className="font-mono text-[36px] text-fg-3">—</span>}
        </div>
      </Glass>

      <div className="flex flex-col gap-1 font-ui text-[15px] text-fg" role="status" aria-live="polite">
        <p><strong className="font-medium">{score.periodLabel}</strong> · Current result: <strong className="font-medium">{live ? shortName(currentNames) : 'Waiting for score'}</strong></p>
        {live && live.state !== 'pre' && <p>Winning square: <strong className="font-mono font-medium">{topLabel} {topDigit} across × {leftLabel} {sideDigit} down</strong></p>}
        <p className="text-fg-2"><strong className="font-medium text-fg">{score.authority.label}</strong> · {score.authority.detail}</p>
        <p className="font-mono text-[13px] text-fg-3">{stale ? 'Last known · ' : ''}{score.freshness || 'Checked time unavailable'} · {score.pollingText}</p>
        {live?.detail && <p className="text-fg-3">{live.detail}</p>}
        {live?.warning && <p className="text-gold">{live.warning}</p>}
      </div>
    </section>
  );
};

export default ScoreInstrument;
```

- [ ] **Step 4: Create `ViewerIsland.tsx`**

```tsx
import React from 'react';
import type { BoardData, GameState, LiveGameData } from '../../../../types';
import { Island, Ring } from '../../../design/primitives';
import { buildViewerScoreModel } from '../score/viewerScoreModel';

export interface ViewerIslandProps {
  game: GameState;
  board: BoardData;
  live: LiveGameData | null;
  liveStatus: string;
  isSynced: boolean;
  selectedPlayer: string;
  yourSquares: number;
  winsNow: boolean;
}

/** Pinned score capsule. Mirrors the score instrument so the score stays in view while the board scrolls. */
const ViewerIsland: React.FC<ViewerIslandProps> = ({ game, live, liveStatus, isSynced, selectedPlayer, yourSquares, winsNow }) => {
  if (!live) return null;
  const score = buildViewerScoreModel({ live, liveStatus, isSynced });
  const stale = live.freshness === 'stale' || live.freshness === 'offline' || live.freshness === 'refreshing';
  const leftLabel = game.leftAbbr || 'AWAY';
  const topLabel = game.topAbbr || 'HOME';

  return (
    <Island
      label="Score"
      placement="top"
      collapsed={(
        <span className="flex items-center gap-3 font-mono tabular-nums text-[14px] text-broadcast-white">
          <span>{leftLabel} {live.leftScore}</span>
          <span className="text-broadcast-white/40">·</span>
          <span>{topLabel} {live.topScore}</span>
          <span className="text-broadcast-white/40">·</span>
          <span className={live.state === 'in' ? 'text-tone-live' : 'text-broadcast-white/70'}>{score.periodLabel}</span>
          {selectedPlayer ? (
            <Ring value={Math.min(1, yourSquares / 100)} label={`${yourSquares} squares for ${selectedPlayer}`} caption={String(yourSquares)} tone={winsNow ? 'gold' : 'fg'} size={24} />
          ) : null}
        </span>
      )}
      expanded={(
        <div className="flex flex-col gap-2 min-w-[260px] font-ui text-[14px] text-broadcast-white/80">
          {winsNow && selectedPlayer ? <p className="font-medium text-gold">{selectedPlayer} wins right now</p> : null}
          <p><span className="font-medium text-broadcast-white">{score.authority.label}</span> · {score.authority.detail}</p>
          <p className="font-mono text-[12px] text-broadcast-white/60">{stale ? 'Last known · ' : ''}{score.freshness || 'Checked time unavailable'} · {score.pollingText}</p>
          {live.sourceName ? <p className="font-mono text-[12px] text-broadcast-white/60">Source · {live.sourceName}</p> : null}
        </div>
      )}
    />
  );
};

export default ViewerIsland;
```

- [ ] **Step 5: Run tests and commit**

Run: `npx vitest run --project unit tests/viewer tests/viewerShell.test.tsx && npx tsc --noEmit`
Expected: the two new files pass; `tests/viewerShell.test.tsx` may fail on `getByText('21')` (now inside a labelled numeral). If it does, leave it: Task 7 rewrites that file. Everything else green.

```bash
git add src/features/viewer/score/ScoreInstrument.tsx src/features/viewer/shell/ViewerIsland.tsx tests/viewer
git commit -m "viewer: score instrument on glass, pinned score island

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Find My Squares entry and sheet

**Files:**
- Modify: `src/features/viewer/identity/FindSquaresEntry.tsx`, `components/board/FindSquaresModal.tsx`
- Test: `tests/findSquaresModal.test.tsx` (existing; keep every assertion, adjust only selectors that referenced the old dialog structure), `tests/viewer/findSquaresEntry.test.tsx` (new)

**Interfaces:** props of both components unchanged.

- [ ] **Step 1: Write the failing entry test**

Create `tests/viewer/findSquaresEntry.test.tsx`:
```tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FindSquaresEntry from '../../src/features/viewer/identity/FindSquaresEntry';

describe('FindSquaresEntry', () => {
  it('offers one primary action and the organizer-name hint before selection', () => {
    const onFindSquares = vi.fn();
    render(<FindSquaresEntry selectedPlayer="" onFindSquares={onFindSquares} onClearPlayer={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Find my squares' });
    expect(button.className).toContain('bg-action');
    fireEvent.click(button);
    expect(onFindSquares).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Use the name the organizer wrote on the board.')).toBeInTheDocument();
  });

  it('shows the selected name as a chip with Clear and a change action', () => {
    const onClearPlayer = vi.fn();
    render(<FindSquaresEntry selectedPlayer="Carrie Moss" onFindSquares={vi.fn()} onClearPlayer={onClearPlayer} />);
    expect(screen.getByText('Carrie Moss')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClearPlayer).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Choose another name' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --project unit tests/viewer/findSquaresEntry.test.tsx`
Expected: FAIL on hint copy and `bg-action`.

- [ ] **Step 3: Rewrite `FindSquaresEntry.tsx`**

```tsx
import React from 'react';
import { CapsuleButton, CapsuleTag, Eyebrow } from '../../../design/primitives';

export interface FindSquaresEntryProps {
  selectedPlayer: string;
  onFindSquares: () => void;
  onClearPlayer: () => void;
}

const FindSquaresEntry: React.FC<FindSquaresEntryProps> = ({ selectedPlayer, onFindSquares, onClearPlayer }) => (
  <section className="flex flex-col gap-3" aria-label="Find squares">
    {selectedPlayer ? (
      <div className="flex flex-wrap items-center justify-between gap-3" aria-live="polite">
        <div className="flex flex-col gap-1">
          <Eyebrow>Selected name</Eyebrow>
          <CapsuleTag tone="gold">{selectedPlayer}</CapsuleTag>
        </div>
        <div className="flex items-center gap-2">
          <CapsuleButton variant="quiet" onClick={onFindSquares}>Choose another name</CapsuleButton>
          <CapsuleButton variant="ghost" onClick={onClearPlayer}>Clear</CapsuleButton>
        </div>
      </div>
    ) : (
      <>
        <CapsuleButton size="lg" className="w-full" onClick={onFindSquares}>Find my squares</CapsuleButton>
        <p className="font-ui text-[14px] text-fg-3">Use the name the organizer wrote on the board.</p>
      </>
    )}
  </section>
);

export default FindSquaresEntry;
```

- [ ] **Step 4: Rewrite `FindSquaresModal.tsx` on the Sheet**

Replace the file's imports and JSX; keep `useMemo`/state/matching logic exactly:
```tsx
import React, { useMemo, useState } from 'react';
import { BoardData } from '../../types';
import { distinctAssignedNames, matchPlayerNames } from '../../utils/playerNameMatching';
import { CapsuleButton, CapsuleInput, Eyebrow, Sheet } from '../../src/design/primitives';

interface FindSquaresModalProps {
    board: BoardData;
    selectedPlayer: string;
    onSelectPlayer: (player: string) => void;
    onClose: () => void;
}

const rowClass = 'w-full min-h-11 px-3 text-left font-ui text-[16px] text-fg rounded-control hover:bg-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action';

const FindSquaresModal: React.FC<FindSquaresModalProps> = ({ board, selectedPlayer, onSelectPlayer, onClose }) => {
    const [query, setQuery] = useState('');

    const assignedNames = useMemo(() => distinctAssignedNames(board.squares), [board.squares]);
    const result = useMemo(() => matchPlayerNames(query, assignedNames), [assignedNames, query]);
    const hasQuery = query.trim().length > 0;
    const showBrowseList = !hasQuery || result.tier === 'none';

    const selectPlayer = (player: string) => {
        onSelectPlayer(player);
        onClose();
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (result.autoSelect) selectPlayer(result.autoSelect);
    };

    return (
        <div data-base="dark">
            <Sheet open onClose={onClose} title="Find my squares">
                <form onSubmit={submit} className="flex items-end gap-2">
                    <CapsuleInput
                        id="viewer-player-search"
                        label="Name used on board"
                        hideLabel
                        type="search"
                        autoComplete="off"
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Type your name"
                        className="flex-1"
                        trailing={<CapsuleButton type="submit" disabled={!result.autoSelect}>Find</CapsuleButton>}
                    />
                </form>

                <div className="mt-5 flex flex-col gap-2" aria-live="polite">
                    {!assignedNames.length ? (
                        <p className="font-ui text-[15px] text-fg-3">No names have been assigned on this board yet.</p>
                    ) : showBrowseList ? (
                        <>
                            <Eyebrow>{hasQuery ? 'No close match. Browse every name' : 'Browse every name'}</Eyebrow>
                            <div className="max-h-[50dvh] overflow-y-auto flex flex-col" data-testid="browse-name-list">
                                {assignedNames.map((name) => (
                                    <button type="button" key={name} onClick={() => selectPlayer(name)} className={rowClass}>{name}</button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <Eyebrow>{result.tier === 'exact' ? 'Choose the organizer-entered name' : 'Did you mean…'}</Eyebrow>
                            <div className="flex flex-col" data-testid="name-suggestions">
                                {result.candidates.map((name) => (
                                    <button type="button" key={name} onClick={() => selectPlayer(name)} className={rowClass}>{name}</button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {selectedPlayer && (
                    <CapsuleButton variant="ghost" className="mt-4 w-full" onClick={() => { onSelectPlayer(''); onClose(); }}>Clear selection</CapsuleButton>
                )}
            </Sheet>
        </div>
    );
};

export default FindSquaresModal;
```
Note: `Sheet` mounts its own focus handling; the `autoFocus` on the input is defeated by Sheet's effect (known), so Sheet's first-focusable logic should land on the input because the input precedes the row buttons but the Close button in the Sheet header precedes it. Accept Close receiving focus for now (Sheet focus order is a stage-6 item) UNLESS `tests/findSquaresModal.test.tsx` asserts initial focus; if it does, update `Sheet.tsx` so the first `[autofocus]` element wins: in the open effect, `const preferred = panel?.querySelector<HTMLElement>('[autofocus]'); (preferred ?? firstFocusable ?? panel)?.focus();` and add a test for it in `tests/design/sheet.test.tsx`.

- [ ] **Step 5: Run the modal test and fix selectors only**

Run: `npx vitest run --project unit tests/findSquaresModal.test.tsx tests/viewer`
If the modal test fails on the close control name (it was `aria-label="Close"`, now a visible "Close" button) or on the `Find` button role, adjust the test selector to the new markup; do not remove or weaken behavior assertions. Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/features/viewer/identity/FindSquaresEntry.tsx components/board/FindSquaresModal.tsx tests/viewer tests/findSquaresModal.test.tsx src/design/primitives/Sheet.tsx tests/design/sheet.test.tsx
git commit -m "viewer: find my squares as a capsule entry and a sheet

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Personal summary, scenarios, winner email, details

**Files:**
- Modify: `src/features/viewer/personal/YourSquaresSummary.tsx`, `src/features/viewer/scenarios/ScenarioDisclosure.tsx`, `src/features/viewer/notifications/WinnerEmailDisclosure.tsx`, `components/NotificationOptIn.tsx`, `src/features/viewer/details/BoardDetailsDisclosure.tsx`
- Test: `tests/viewer/personal.test.tsx` (new)

**Interfaces:** props unchanged. `YourSquaresSummary` keeps region name `{name} square summary`, count text, `Current result matches now.` / `Current result: none of the selected squares match now.`, `View on board top {n} side {n}` buttons, `Next score: …`. `ScenarioDisclosure` keeps all strings, the `<details>`, and the focus/hover callbacks. `NotificationOptIn` keeps its `fetch` and copy; only markup/classes change.

- [ ] **Step 1: Write the failing test**

Create `tests/viewer/personal.test.tsx`:
```tsx
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import YourSquaresSummary from '../../src/features/viewer/personal/YourSquaresSummary';
import ScenarioDisclosure from '../../src/features/viewer/scenarios/ScenarioDisclosure';
import BoardDetailsDisclosure from '../../src/features/viewer/details/BoardDetailsDisclosure';
import type { BoardData, GameState, LiveGameData, WinnerResolution } from '../../types';

const board: BoardData = { topAxis: [0,1,2,3,4,5,6,7,8,9], leftAxis: [0,1,2,3,4,5,6,7,8,9], squares: Array.from({ length: 100 }, () => []), participants: [{ id: 'p', displayName: 'Carrie Moss', publicLabel: 'Carrie Moss' }] };
board.squares[14] = ['Carrie Moss'];
board.squares[34] = ['Carrie Moss'];
const game: GameState = { title: 'GridOne Bowl', meta: '', leftAbbr: 'KC', leftName: 'Kansas City', topAbbr: 'PHI', topName: 'Philadelphia', dates: 'Sep 13', lockTitle: false, lockMeta: false };
const live: LiveGameData = { leftScore: 21, topScore: 14, quarterScores: { Q1: { left: 7, top: 0 }, Q2: { left: 7, top: 7 }, Q3: { left: 7, top: 7 }, Q4: { left: 0, top: 0 }, OT: { left: 0, top: 0 } }, clock: '8:12', period: 3, state: 'in', detail: '3rd quarter', isOvertime: false, sourceName: 'ESPN', retrievedAt: '2026-09-13T20:15:00.000Z', staleAfter: '2026-09-13T20:16:00.000Z', freshness: 'fresh' };

describe('YourSquaresSummary', () => {
  it('lists every square as a mono chip and says who wins now in gold', () => {
    const onViewSquare = vi.fn();
    render(<YourSquaresSummary board={board} game={game} live={live} selectedPlayer="Carrie Moss" onViewSquare={onViewSquare} />);
    const region = screen.getByRole('region', { name: 'Carrie Moss square summary' });
    expect(within(region).getByText('2 squares')).toBeInTheDocument();
    const winsNow = within(region).getByText('Current result matches now.');
    expect(winsNow.className).toContain('text-gold');
    fireEvent.click(within(region).getByRole('button', { name: /View on board top 4 side 1/ }));
    expect(onViewSquare).toHaveBeenCalledWith({ top: 4, left: 1 });
    expect(within(region).getByText(/Next score: KC Safety \+2/)).toBeInTheDocument();
  });
});

describe('ScenarioDisclosure', () => {
  it('keeps matching scenarios first and the rest behind a closed disclosure', () => {
    render(<ScenarioDisclosure board={board} game={game} live={live} selectedPlayer="Carrie Moss" servicesEnabled onScenarioFocus={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'What score changes the next result?' })).toBeInTheDocument();
    const details = screen.getByText('All possible next scores').closest('details');
    expect(details?.open).toBe(false);
    expect(screen.getByText('These are arithmetic score outcomes, not odds or predictions.')).toBeInTheDocument();
  });
});

describe('BoardDetailsDisclosure', () => {
  it('names milestones in the final record', () => {
    const history: WinnerResolution[] = [{ milestone: 'Q2', sideScore: 14, topScore: 7, sideDigit: 4, topDigit: 7, participantName: 'Carrie Moss', resolvedAt: '2026-09-13T21:00:00.000Z' }];
    render(<BoardDetailsDisclosure game={game} board={board} winnerHistory={history} final />);
    expect(screen.getByRole('heading', { name: 'Final record' })).toBeInTheDocument();
    expect(screen.getByText(/Halftime/)).toBeInTheDocument();
    expect(screen.getByText('Board details')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --project unit tests/viewer/personal.test.tsx`
Expected: FAIL on `text-gold`, on `Halftime`, and on the scenario region role (the current heading id wiring may already pass; that's fine).

- [ ] **Step 3: Rewrite `YourSquaresSummary.tsx`** (keep the `selectedRows` helper verbatim; replace the component body)

```tsx
const YourSquaresSummary: React.FC<YourSquaresSummaryProps> = ({ board, game, live, selectedPlayer, onViewSquare }) => {
  if (!selectedPlayer) return null;
  const rows = selectedRows(board, game, live, selectedPlayer);
  const currentQuarter = quarterForLive(live);
  const currentNames = live ? playersForDigits(board, live.topScore % 10, live.leftScore % 10, currentQuarter) : [];
  const winsNow = currentNames.includes(selectedPlayer);
  const topLabel = game.topAbbr || 'Top';
  const leftLabel = game.leftAbbr || 'Side';

  return (
    <section className="flex flex-col gap-4" role="region" aria-label={`${selectedPlayer} square summary`}>
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>Your squares · {selectedPlayer}</Eyebrow>
        <span className="font-mono tabular-nums text-[15px] text-fg">{rows.length} {rows.length === 1 ? 'square' : 'squares'}</span>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label="Your squares">
        {rows.map((row) => (
          <li key={row.index} className={`inline-flex items-center h-9 px-3 rounded-capsule border font-mono tabular-nums text-[14px] ${row.matchesCurrent ? 'border-gold text-gold' : 'border-hairline text-fg'}`}>
            {topLabel} {row.top} · {leftLabel} {row.left}
          </li>
        ))}
      </ul>
      <p className={`font-ui text-[17px] font-medium ${winsNow ? 'text-gold' : 'text-fg-2'}`}>
        {winsNow ? 'Current result matches now.' : 'Current result: none of the selected squares match now.'}
      </p>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={`row-${row.index}`}>
            <Glass padding="md" className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-mono tabular-nums text-[15px] text-fg">{topLabel} column {row.top} × {leftLabel} row {row.left}</span>
                <span className="font-ui text-[14px] text-fg-2">
                  {row.matchesCurrent ? 'This square matches the current result.' : row.nextLabels.length ? `Next score: ${row.nextLabels[0]}` : 'None of the next scores listed here match this square.'}
                </span>
              </div>
              {row.top !== null && row.left !== null && (
                <CapsuleButton variant="quiet" onClick={() => onViewSquare({ top: row.top as number, left: row.left as number })}>
                  <span aria-hidden="true">View on board</span>
                  <span className="sr-only">View on board top {row.top} side {row.left}</span>
                </CapsuleButton>
              )}
            </Glass>
          </li>
        ))}
      </ul>
    </section>
  );
};
```
Add `import { CapsuleButton, Eyebrow, Glass } from '../../../design/primitives';` at the top.

- [ ] **Step 4: Rewrite `ScenarioDisclosure.tsx`** (keep `lastKnownCopy` and the early returns verbatim; early-return `<p>` classes become `font-ui text-[15px] text-fg-2`)

Replace `renderButton` and the returned JSX:
```tsx
  const renderButton = (scenario: ViewerScenario) => (
    <button
      type="button"
      key={`${scenario.team}-${scenario.points}-${scenario.top}-${scenario.left}`}
      className="w-full min-h-11 rounded-control px-3 py-2 text-left bg-panel border border-hairline hover:bg-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action transition-[background-color] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)]"
      onFocus={() => onScenarioFocus({ left: scenario.left, top: scenario.top })}
      onBlur={() => onScenarioFocus(null)}
      onMouseEnter={() => onScenarioFocus({ left: scenario.left, top: scenario.top })}
      onMouseLeave={() => onScenarioFocus(null)}
      onClick={() => onScenarioFocus({ left: scenario.left, top: scenario.top })}
    >
      <span className="block font-mono tabular-nums text-[15px] text-fg">{scenario.team} {scenario.label} +{scenario.points}</span>
      <span className="block font-ui text-[14px] text-fg-2">{game.topAbbr || 'Top'} column {scenario.top} × {game.leftAbbr || 'Side'} row {scenario.left} · winner: {scenario.names.length ? scenario.names.join(', ') : 'OPEN'}</span>
    </button>
  );

  return (
    <section className="flex flex-col gap-3" role="region" aria-labelledby="viewer-scenarios-title">
      <h2 id="viewer-scenarios-title" className="font-display text-[26px] leading-[1.1] text-fg">What score changes the next result?</h2>
      <p className="font-ui text-[14px] text-fg-3">Read each result across the top team’s columns, then down the side team’s rows.</p>
      {model.status === 'last-known' && <p className="font-ui text-[14px] text-gold">{lastKnownCopy(model.lastKnownCheckedAt)}</p>}
      {selectedPlayer && selected.length > 0 && (
        <div className="flex flex-col gap-2" aria-label="Next scores that match your squares">
          {selected.map(renderButton)}
        </div>
      )}
      {selectedPlayer && selected.length === 0 && (
        <p className="font-ui text-[15px] text-fg-2">None of the next scores listed here match your squares right now.</p>
      )}
      <details className="group rounded-card border border-hairline p-3">
        <summary className="min-h-11 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden font-ui text-[15px] text-fg">
          <span>All possible next scores</span>
          <span aria-hidden="true" className="font-mono text-fg-3 group-open:hidden">+</span>
          <span aria-hidden="true" className="font-mono text-fg-3 hidden group-open:inline">−</span>
        </summary>
        <div className="mt-3 flex flex-col gap-2">{secondary.map(renderButton)}</div>
      </details>
      <p className="font-mono text-[12px] text-fg-3">{model.disclaimer}</p>
    </section>
  );
```

- [ ] **Step 5: Rewrite `WinnerEmailDisclosure.tsx` and restyle `NotificationOptIn.tsx`**

`WinnerEmailDisclosure.tsx` return:
```tsx
  return (
    <section className="flex flex-col gap-3" aria-labelledby="winner-email-title">
      <h2 id="winner-email-title" className="font-display text-[26px] leading-[1.1] text-fg">Get winner emails</h2>
      <div role="form" aria-label="winner email">
        <NotificationOptIn shareCode={shareCode} participantId={participantId} displayName={displayName} />
      </div>
    </section>
  );
```
`NotificationOptIn.tsx`: keep state, `submit`, the fetch, and the copy. Replace the JSX with:
```tsx
  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <div className="flex flex-col gap-1">
        <p className="font-ui text-[15px] font-medium text-fg">Quarter-winner email for {displayName}</p>
        <p className="font-ui text-[14px] text-fg-2">One verified email for Q1, halftime, Q3, and Final wins. GridOne does not handle payouts.</p>
      </div>
      {status !== 'sent' && (
        <CapsuleInput
          id="viewer-notification-email"
          label="Email address"
          hideLabel
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          trailing={<CapsuleButton type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Verify email'}</CapsuleButton>}
        />
      )}
      {message && <p role="status" className={`font-ui text-[14px] ${status === 'error' ? 'text-cardinal' : 'text-fg-2'}`}>{message}</p>}
    </form>
  );
```
Replace the `Field` import with `import { CapsuleButton, CapsuleInput } from '../src/design/primitives';`.

- [ ] **Step 6: Rewrite `BoardDetailsDisclosure.tsx`**

```tsx
import React from 'react';
import type { BoardData, GameState, WinnerResolution } from '../../../../types';
import { Eyebrow, Glass } from '../../../design/primitives';
import { milestoneLabel } from '../milestones/milestoneViewModel';

export interface BoardDetailsDisclosureProps {
  game: GameState;
  board: BoardData;
  winnerHistory: WinnerResolution[];
  final: boolean;
}

export const FinalRecord: React.FC<{ winnerHistory: WinnerResolution[] }> = ({ winnerHistory }) => (
  <Glass as="section" padding="lg" className="flex flex-col gap-3 border-gold/40" aria-labelledby="final-record-title">
    <h2 id="final-record-title" className="font-display text-[26px] leading-[1.1] text-fg">Final record</h2>
    {winnerHistory.length ? (
      <ol className="flex flex-col gap-2">
        {winnerHistory.map((winner) => (
          <li key={`${winner.milestone}-${winner.resolvedAt}-${winner.resolutionVersion || 1}`} className="flex items-baseline justify-between gap-3">
            <span className="font-ui text-[15px] text-fg"><span className="font-medium">{milestoneLabel(winner.milestone)}</span> · {winner.participantName || (winner.openSquare ? 'Open square' : 'Unassigned')}</span>
            <span className="font-mono tabular-nums text-[14px] text-fg-3">{winner.topDigit} across · {winner.sideDigit} down{winner.corrected ? ' · corrected' : ''}</span>
          </li>
        ))}
      </ol>
    ) : (
      <p className="font-ui text-[15px] text-fg-2">No resolved winner records have been published yet.</p>
    )}
  </Glass>
);

const BoardDetailsDisclosure: React.FC<BoardDetailsDisclosureProps> = ({ game, board, winnerHistory, final }) => (
  <section className="flex flex-col gap-4" aria-labelledby="board-details-title">
    {final && <FinalRecord winnerHistory={winnerHistory} />}
    <details className="group rounded-card border border-hairline p-3">
      <summary id="board-details-title" className="min-h-11 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden font-ui text-[15px] text-fg">
        <span>Board details</span>
        <span aria-hidden="true" className="font-mono text-fg-3 group-open:hidden">+</span>
        <span aria-hidden="true" className="font-mono text-fg-3 hidden group-open:inline">−</span>
      </summary>
      <dl className="mt-3 flex flex-col gap-3">
        <div><dt><Eyebrow as="span">Teams</Eyebrow></dt><dd className="font-ui text-[15px] text-fg">{game.leftName || game.leftAbbr} at {game.topName || game.topAbbr}</dd></div>
        <div><dt><Eyebrow as="span">Squares assigned</Eyebrow></dt><dd className="font-mono tabular-nums text-[15px] text-fg">{board.squares.filter((names) => names.length > 0).length} of 100</dd></div>
        <div><dt><Eyebrow as="span">Digits</Eyebrow></dt><dd className="font-ui text-[15px] text-fg-2">Top axis and side axis use organizer-published digits.</dd></div>
      </dl>
    </details>
  </section>
);

export default BoardDetailsDisclosure;
```

- [ ] **Step 7: Run and commit**

Run: `npx vitest run --project unit tests/viewer tests/productionCopy.test.ts && npx tsc --noEmit`
Expected: green. (`productionCopy` scans these files for banned phrases.)

```bash
git add src/features/viewer/personal src/features/viewer/scenarios/ScenarioDisclosure.tsx src/features/viewer/notifications src/features/viewer/details components/NotificationOptIn.tsx tests/viewer/personal.test.tsx
git commit -m "viewer: personal summary, scenarios, winner email, details on primitives

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Board grid

**Files:**
- Modify: `src/features/viewer/board/ViewerBoardGrid.tsx`
- Test: `tests/viewerBoardGrid.test.tsx` (update: `Reset/Fit` → `Fit`; test id → `viewer-board-grid`; class assertions `ring-gold`/`text-broadcast-white` → the new state classes listed below; everything else unchanged)

**Interfaces:** props unchanged. Behavior unchanged: roving tabindex, arrow/Home/End keys, `centerState`, `fitGrid` (bound to `Fit`), zoom range 0.5–1.5, sticky axes, `data-*` attributes, `aria-*` attributes, orientation sentence, `NOW` and `C` badges.

- [ ] **Step 1: Update the test first**

In `tests/viewerBoardGrid.test.tsx`: replace `'Reset/Fit'` with `'Fit'`; replace `viewer-board-grid-v2` with `viewer-board-grid`; where cell classes are asserted, use: current → `bg-gold`, corrected → `bg-cardinal`, selected → `ring-action`, resolved → `border-gold`, open → `text-fg-3`. Run `npx vitest run --project unit tests/viewerBoardGrid.test.tsx` and confirm the renamed assertions fail.

- [ ] **Step 2: Restyle the grid**

In `ViewerBoardGrid.tsx`:
- `stateClass` becomes:
```ts
const stateClass = (cell: ViewerBoardCellModel) => {
  const states = cell.states;
  if (states.includes('corrected') && states.includes('current')) return 'bg-cardinal text-broadcast-white ring-2 ring-inset ring-gold';
  if (states.includes('corrected')) return 'bg-cardinal text-broadcast-white';
  if (states.includes('current')) return 'bg-gold text-ink font-medium';
  if (states.includes('selected')) return 'bg-panel-hover text-fg ring-2 ring-inset ring-action';
  if (states.includes('resolved')) return 'bg-panel text-fg border border-gold';
  if (states.includes('open')) return 'bg-transparent text-fg-3';
  return 'bg-panel text-fg';
};
```
- Controls row: replace each `<button className="oa-slab …">` with `<CapsuleButton variant="quiet" className="min-w-11" …>`; rename `Reset/Fit` to `Fit`; the `<output>` becomes `<output className="font-mono tabular-nums inline-flex min-h-11 min-w-11 items-center justify-center px-3 rounded-capsule border border-hairline text-fg" aria-label="Current zoom">`. Keep `style={controlStyle}` on every control so the 44×44 test still reads inline styles.
- Orientation paragraph: `font-ui text-[14px] text-fg-2`.
- Viewport div: `className="gridone-viewer-board-viewport overflow-auto rounded-card border border-hairline bg-ground p-2"`.
- Table: `className="gridone-board-grid w-[760px] min-w-[760px] table-fixed border-separate border-spacing-[2px] text-fg"` (border-separate so cells can be rounded).
- Corner header and side label: `bg-chyron text-broadcast-white rounded-cell font-mono text-[12px] uppercase tracking-[0.08em]`.
- Axis headers (`data-sticky-axis`): `sticky … bg-chyron text-gold font-mono tabular-nums text-[15px] rounded-cell`.
- Cells: `relative h-14 rounded-cell p-1 text-center align-middle font-ui text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action ${stateClass(cell)}`; the inner name span drops `oa-board-name` and keeps `flex h-full min-h-11 items-center justify-center`. Badges: `NOW` → `font-mono text-[10px]` (color ink on gold, gold on cardinal), `C` → `font-mono text-[10px] text-broadcast-white`.
- Root: `data-testid="viewer-board-grid"`.
- Import `CapsuleButton` from `../../../design/primitives`.

- [ ] **Step 3: Run and commit**

Run: `npx vitest run --project unit tests/viewerBoardGrid.test.tsx && npx tsc --noEmit`
Expected: green.

```bash
git add src/features/viewer/board/ViewerBoardGrid.tsx tests/viewerBoardGrid.test.tsx
git commit -m "viewer: board grid cells, axes, and capsule controls on the dark base

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Shell composition

**Files:**
- Modify: `src/features/viewer/shell/ViewerShell.tsx`
- Test: `tests/viewerShell.test.tsx` (rewrite: same scenarios, new selectors)

**Interfaces:** `ViewerShellProps` + `onShare?: () => void`. Structure:
```
<Base kind="dark">
  <ViewerIsland … />
  <main aria-label="{title} viewer" class="mx-auto max-w-6xl px-4 pt-20 pb-16 md:px-6 grid gap-8 lg:grid-cols-[minmax(320px,440px)_1fr]">
    <div data-testid="viewer-first-viewport" class="flex flex-col gap-8 min-w-0">
      <ScoreInstrument/>
      <FindSquaresEntry/>
      <YourSquaresSummary/>          (self-hides)
      {pending milestones Glass}     (when any && servicesEnabled)
      {isFinal && <FinalRecord/>}    (promoted above scenarios/grid at Final)
      <ScenarioDisclosure/>
      <WinnerEmailDisclosure/>
    </div>
    <section aria-labelledby="viewer-board-title" data-board-locked>
      header row: Eyebrow "Published board" + h2 "Board" + (onShare ? quiet "Share" capsule : null) + quiet "Find" capsule
      empty message or <ViewerBoardGrid/>
      <BoardDetailsDisclosure final={false}/>   (details only; Final record already promoted)
    </section>
  </main>
</Base>
```
`yourSquares` for the island = count of `board.squares` containing `selectedPlayer`; `winsNow` = `playersForDigits(board, top%10, left%10, quarterForLive(live)).includes(selectedPlayer)` when `live` is present.

- [ ] **Step 1: Rewrite `tests/viewerShell.test.tsx`**

Keep the fixtures and `renderShell` from the current file. Replace the `describe` block with:
```tsx
describe('ViewerShell', () => {
  it('renders the unpersonalized stack: identity, score, trust, one primary action, no me language', () => {
    renderShell({ selectedPlayer: '' });
    const firstViewport = screen.getByTestId('viewer-first-viewport');
    expect(within(firstViewport).getByRole('heading', { level: 1, name: 'GridOne Bowl' })).toBeVisible();
    expect(within(firstViewport).getByText('KC at PHI')).toBeVisible();
    expect(within(firstViewport).getByRole('img', { name: 'Kansas City 21' })).toBeInTheDocument();
    expect(within(firstViewport).getByRole('img', { name: 'Philadelphia 14' })).toBeInTheDocument();
    const status = within(firstViewport).getByRole('status');
    expect(status).toHaveTextContent(/Current result/);
    expect(status).toHaveTextContent('Carrie Moss');
    expect(status).toHaveTextContent('PHI 4 across × KC 1 down');
    expect(status).toHaveTextContent(/Score updates about every minute/);
    expect(within(firstViewport).getByRole('button', { name: 'Find my squares' })).toBeVisible();
    expect(firstViewport).not.toHaveTextContent(/payout|makes me win/i);
    expect(screen.getByRole('main', { name: 'GridOne Bowl viewer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Score/ })).toHaveTextContent('KC 21');
  });

  it('puts personalized summary and scenarios before winner email', () => {
    renderShell({ selectedPlayer: 'Carrie Moss' });
    const summary = screen.getByRole('region', { name: 'Carrie Moss square summary' });
    const scenarios = screen.getByRole('region', { name: 'What score changes the next result?' });
    const winnerEmail = screen.getByRole('form', { name: 'winner email' });
    expect(summary.compareDocumentPosition(scenarios)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(scenarios.compareDocumentPosition(winnerEmail)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(within(summary).getByText('2 squares')).toBeVisible();
    expect(within(summary).getByText('Current result matches now.')).toBeVisible();
    expect(within(summary).getByRole('button', { name: /View on board top 4 side 1/ })).toBeInTheDocument();
    expect(screen.getByText('Next score: KC Safety +2')).toBeVisible();
    expect(screen.getByText('These are arithmetic score outcomes, not odds or predictions.')).toBeVisible();
    expect(screen.getByRole('img', { name: '2 squares for Carrie Moss' })).toBeInTheDocument();
  });

  it('shows no inert scenarios in pregame and promotes the final record at Final', () => {
    const { rerender } = renderShell({ live: live({ state: 'pre', period: 0, leftScore: 0, topScore: 0 }) });
    expect(screen.queryByRole('button', { name: /Safety|Field goal|Touchdown/ })).toBeNull();
    expect(screen.getByText('Scenarios appear after kickoff.')).toBeVisible();

    rerender(<ViewerShell game={game} board={board} live={live({ state: 'post' })} liveStatus="FINAL" isSynced highlights={{ quarterWinners: {}, currentLabel: '' }} winnerHistory={[]} pendingMilestones={[]} selectedPlayer="Carrie Moss" onClearPlayer={vi.fn()} onFindSquares={vi.fn()} highlightedCoords={null} onScenarioFocus={vi.fn()} shareCode="ABCDEFGH" servicesEnabled organizerPreview={false} />);
    expect(screen.queryByText('What score changes the next result?')).toBeNull();
    const finalRecord = screen.getByRole('region', { name: 'Final record' });
    const grid = screen.getByTestId('viewer-board-grid');
    expect(finalRecord.compareDocumentPosition(grid)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('collapses unselected live outcomes behind a closed disclosure', () => {
    renderShell({ selectedPlayer: '' });
    const disclosure = screen.getByText('All possible next scores').closest('details');
    expect(disclosure).not.toHaveAttribute('open');
    fireEvent.click(screen.getByText('All possible next scores'));
    expect(disclosure).toHaveAttribute('open');
    expect(screen.getAllByText(/Safety \+2/)).toHaveLength(2);
  });

  it('shows stale last-known copy and hides winner email in preview or without a durable participant', () => {
    const { rerender } = renderShell({ live: live({ freshness: 'offline' }), selectedPlayer: 'Carrie Moss' });
    expect(screen.getByRole('status')).toHaveTextContent(/Offline · last known/);
    expect(screen.getByRole('status')).toHaveTextContent(/Last known · /);
    expect(screen.getByText(/Using the last-known score checked .* until scoring reconnects\./)).toBeVisible();

    rerender(<ViewerShell game={game} board={board} live={live()} liveStatus="LIVE" isSynced highlights={{ quarterWinners: {}, currentLabel: '' }} winnerHistory={[]} pendingMilestones={[]} selectedPlayer="Carrie Moss" onClearPlayer={vi.fn()} onFindSquares={vi.fn()} highlightedCoords={null} onScenarioFocus={vi.fn()} shareCode="ABCDEFGH" servicesEnabled organizerPreview />);
    expect(screen.queryByRole('form', { name: 'winner email' })).toBeNull();

    rerender(<ViewerShell game={game} board={{ ...board, participants: [] }} live={live()} liveStatus="LIVE" isSynced highlights={{ quarterWinners: {}, currentLabel: '' }} winnerHistory={[]} pendingMilestones={[]} selectedPlayer="Carrie Moss" onClearPlayer={vi.fn()} onFindSquares={vi.fn()} highlightedCoords={null} onScenarioFocus={vi.fn()} shareCode="ABCDEFGH" servicesEnabled organizerPreview={false} />);
    expect(screen.queryByRole('form', { name: 'winner email' })).toBeNull();
  });

  it('uses randomized axis digits for View on board focus coordinates', () => {
    const randomized = { ...board, topAxis: [9,8,7,6,5,4,3,2,1,0], leftAxis: [9,8,7,6,5,4,3,2,1,0] };
    const onScenarioFocus = vi.fn();
    renderShell({ board: randomized, selectedPlayer: 'Carrie Moss', onScenarioFocus });
    fireEvent.click(screen.getByRole('button', { name: /View on board top 5 side 8/ }));
    expect(onScenarioFocus).toHaveBeenCalledWith({ top: 5, left: 8 });
  });

  it('renders the final record with resolved winners and no scenarios', () => {
    const winnerHistory: WinnerResolution[] = [{ milestone: 'FINAL', sideScore: 21, topScore: 14, sideDigit: 1, topDigit: 4, participantName: 'Carrie Moss', resolvedAt: '2026-09-13T22:00:00.000Z' }];
    renderShell({ live: live({ state: 'post' }), liveStatus: 'FINAL', winnerHistory, selectedPlayer: 'Carrie Moss' });
    expect(screen.getByRole('region', { name: 'Final record' })).toHaveTextContent(/Final · Carrie Moss/);
    expect(screen.queryByText('What score changes the next result?')).toBeNull();
  });

  it('offers Share when a handler is provided and never uses feature-flag markers', () => {
    const onShare = vi.fn();
    const { container } = renderShell({ onShare });
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(onShare).toHaveBeenCalled();
    expect(container.querySelector('[data-feature-flag]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**, then **Step 3: rewrite `ViewerShell.tsx`**

```tsx
import React, { useMemo, useState } from 'react';
import type { BoardData, GameState, LiveGameData, PendingMilestone, WinnerHighlights, WinnerResolution } from '../../../../types';
import { Base, CapsuleButton, Eyebrow, Glass } from '../../../design/primitives';
import ViewerBoardGrid from '../board/ViewerBoardGrid';
import ScoreInstrument from '../score/ScoreInstrument';
import ViewerIsland from './ViewerIsland';
import FindSquaresEntry from '../identity/FindSquaresEntry';
import YourSquaresSummary from '../personal/YourSquaresSummary';
import ScenarioDisclosure from '../scenarios/ScenarioDisclosure';
import WinnerEmailDisclosure from '../notifications/WinnerEmailDisclosure';
import BoardDetailsDisclosure, { FinalRecord } from '../details/BoardDetailsDisclosure';
import { playersForDigits, quarterForLive } from '../scenarios/scenarioModel';

export interface ViewerShellProps {
  game: GameState;
  board: BoardData;
  live: LiveGameData | null;
  liveStatus: string;
  isSynced: boolean;
  highlights: WinnerHighlights;
  winnerHistory: WinnerResolution[];
  pendingMilestones: PendingMilestone[];
  selectedPlayer: string;
  onClearPlayer: () => void;
  onFindSquares: () => void;
  highlightedCoords: { left: number; top: number } | null;
  onScenarioFocus: (coords: { left: number; top: number } | null) => void;
  locked?: boolean;
  shareCode?: string | null;
  servicesEnabled?: boolean;
  organizerPreview?: boolean;
  onShare?: () => void;
}

const ViewerShell: React.FC<ViewerShellProps> = ({
  game, board, live, liveStatus, isSynced, highlights, winnerHistory, pendingMilestones, selectedPlayer,
  onClearPlayer, onFindSquares, highlightedCoords, onScenarioFocus, locked = false, shareCode, servicesEnabled = true, organizerPreview = false, onShare,
}) => {
  const [boardFocus, setBoardFocus] = useState(highlightedCoords);
  const selectedParticipant = useMemo(() => {
    const matches = board.participants?.filter((participant) => participant.displayName === selectedPlayer) || [];
    return matches.length === 1 ? matches[0] : undefined;
  }, [board.participants, selectedPlayer]);
  const isFinal = live?.state === 'post';
  const isEmpty = !board.squares.some((names) => names.length > 0);
  const showNotification = Boolean(servicesEnabled && !organizerPreview && shareCode && selectedParticipant?.id);
  const yourSquares = useMemo(() => (selectedPlayer ? board.squares.filter((names) => names.includes(selectedPlayer)).length : 0), [board.squares, selectedPlayer]);
  const winsNow = useMemo(() => {
    if (!live || !selectedPlayer) return false;
    return playersForDigits(board, live.topScore % 10, live.leftScore % 10, quarterForLive(live)).includes(selectedPlayer);
  }, [board, live, selectedPlayer]);

  const setFocus = (coords: { left: number; top: number } | null) => {
    setBoardFocus(coords);
    onScenarioFocus(coords);
  };

  return (
    <Base kind="dark">
      <ViewerIsland game={game} board={board} live={live} liveStatus={liveStatus} isSynced={isSynced} selectedPlayer={selectedPlayer} yourSquares={yourSquares} winsNow={winsNow} />
      <main
        className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-20 pb-16 md:px-6 lg:grid-cols-[minmax(320px,440px)_1fr]"
        aria-label={`${game.title || 'GridOne board'} viewer`}
      >
        <div data-testid="viewer-first-viewport" className="flex min-w-0 flex-col gap-8">
          <ScoreInstrument game={game} board={board} live={live} liveStatus={liveStatus} isSynced={isSynced} />
          <FindSquaresEntry selectedPlayer={selectedPlayer} onFindSquares={onFindSquares} onClearPlayer={onClearPlayer} />
          <YourSquaresSummary board={board} game={game} live={live} selectedPlayer={selectedPlayer} onViewSquare={setFocus} />
          {pendingMilestones.length > 0 && servicesEnabled && (
            <Glass as="section" padding="md" className="flex flex-col gap-2" aria-labelledby="pending-results-title">
              <h2 id="pending-results-title" className="font-ui text-[15px] font-medium text-fg">Pending confirmation</h2>
              <ul className="flex flex-col gap-1 font-mono tabular-nums text-[14px] text-fg-2">
                {pendingMilestones.map((pending) => (
                  <li key={pending.milestone}>{pending.milestone} · {pending.topScore}-{pending.sideScore} · digits {pending.topDigit}/{pending.sideDigit}</li>
                ))}
              </ul>
            </Glass>
          )}
          {isFinal && <FinalRecord winnerHistory={winnerHistory} />}
          <ScenarioDisclosure board={board} game={game} live={live} selectedPlayer={selectedPlayer} servicesEnabled={servicesEnabled} onScenarioFocus={setFocus} />
          <WinnerEmailDisclosure shareCode={shareCode} participantId={selectedParticipant?.id} displayName={selectedPlayer} enabled={showNotification} />
        </div>

        <section className="flex min-w-0 flex-col gap-4" aria-labelledby="viewer-board-title" data-board-locked={locked}>
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Eyebrow>Published board</Eyebrow>
              <h2 id="viewer-board-title" className="font-display text-[26px] leading-[1.1] text-fg">Board</h2>
            </div>
            <div className="flex items-center gap-2">
              {onShare ? <CapsuleButton variant="quiet" onClick={onShare}>Share</CapsuleButton> : null}
              <CapsuleButton variant="quiet" onClick={onFindSquares}>Find</CapsuleButton>
            </div>
          </div>
          {isEmpty && !organizerPreview ? (
            <Glass padding="lg" className="text-center font-ui text-[15px] text-fg-2">This board has no assignments yet.</Glass>
          ) : (
            <ViewerBoardGrid board={board} game={game} highlights={highlights} winnerHistory={winnerHistory} pendingMilestones={pendingMilestones} live={live} selectedPlayer={selectedPlayer} highlightedCoords={boardFocus} showOpenSquares={board.allowOpenSquares === true} />
          )}
          <BoardDetailsDisclosure game={game} board={board} winnerHistory={winnerHistory} final={false} />
        </section>
      </main>
    </Base>
  );
};

export default ViewerShell;
```
`FinalRecord`'s section needs `role="region"` for the test's `getByRole('region', { name: 'Final record' })`: add `role="region"` to the `Glass` in Task 3's `FinalRecord` (Glass forwards HTML attributes).

- [ ] **Step 4: Run the viewer suites and commit**

Run: `npx vitest run --project unit tests/viewer tests/viewerShell.test.tsx tests/viewerBoardGrid.test.tsx tests/productionCopy.test.ts && npx tsc --noEmit`
Expected: green.

```bash
git add src/features/viewer/shell/ViewerShell.tsx src/features/viewer/details/BoardDetailsDisclosure.tsx tests/viewerShell.test.tsx
git commit -m "viewer: shell composition on the dark base with island and final-record promotion

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Board view wiring, legacy deletion, flag removal

**Files:**
- Modify: `components/BoardView.tsx`, `utils/featureFlags.ts`, `.env.example`, `.env.production`, `tests/featureFlags.test.ts`, `tests/customerFlowFixes.test.tsx`, `tests/instrumentationSchema.test.ts` (only if it breaks)
- Delete: `components/GameDayHorizon.tsx`, `components/BoardGrid.tsx`, `components/PlayerFilter.tsx`

- [ ] **Step 1: `BoardView.tsx`**

1. Remove `import GameDayHorizon …` and the `viewerV2Enabled` local; in `envFlagConfig()` drop the `viewer_v2` key; `featureFlags` is still used for `organizer_v2`.
2. `renderMainContent`: the `viewerV2Enabled ? … : …` ternary becomes just the `<ViewerShell …/>` branch, adding `onShare={activePoolId && isActivated ? () => setShowShareModal(true) : undefined}`.
3. Locked screen (inside `renderMainContent`) becomes:
```tsx
<Base kind="dark"><main className="mx-auto max-w-[640px] px-6 py-20 flex flex-col gap-4" role="status">
  <Eyebrow>Viewer link unavailable</Eyebrow>
  <h1 className="font-display text-[34px] leading-[1.05] text-fg">This board is not published yet.</h1>
  <p className="font-ui text-[17px] text-fg-2">The organizer can still preview it. Viewers will see the board here after it is unlocked and published.</p>
</main></Base>
```
4. Not-found screen (the `poolError` return) becomes the same shape with `role="alert"`, `Eyebrow` `Board unavailable`, h1 `This link does not open a published GridOne board.`, `<p>{poolError}</p>`, and `<CapsuleButton onClick={() => navigate('/')}>Go to GridOne</CapsuleButton>`.
5. Public viewer wrapper: change the outer `<div className="oa-root gdh-root …">` to `<div className="min-h-[100dvh] w-full flex flex-col bg-ground text-fg" data-base="dark">`. Render `<BoardHeader …/>` only when `isOwner && !isPreviewMode` (the admin header); the public header is gone because `ViewerShell` carries identity and Share.
6. Demo banner becomes:
```tsx
{demoMode && (
  <aside className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-hairline bg-panel px-4 py-3" aria-label="Demo board notice">
    <p className="font-ui text-[15px] text-fg"><span className="font-medium">Demo board — sample names and scores.</span> This is a sample board. Ready to run yours?</p>
    <div className="flex flex-wrap gap-2">
      <CapsuleButton onClick={() => navigate('/create')}>Create your free board</CapsuleButton>
      <CapsuleButton variant="quiet" onClick={() => navigate('/')}>How GridOne works</CapsuleButton>
    </div>
  </aside>
)}
```
7. Demo seed: `detail: 'Sample score'`, `sourceName: 'Sample score'` (was "Synthetic demonstration score" / "Demonstration fixture"). Title stays `Demo: Super Bowl LIX`.
8. Import `Base, CapsuleButton, Eyebrow` from `../src/design/primitives`.

- [ ] **Step 2: Flags and deletions**

`utils/featureFlags.ts`: `FEATURE_FLAG_NAMES = ['organizer_v2'] as const`; drop `viewer_v2` from `DEFAULT_FLAGS` and `variants`. `tests/featureFlags.test.ts`: drop every `viewer_v2` key/expectation. `.env.example` / `.env.production`: delete `VITE_GRIDONE_VIEWER_V2` lines.
```bash
git rm components/GameDayHorizon.tsx components/BoardGrid.tsx components/PlayerFilter.tsx
```
`tests/customerFlowFixes.test.tsx`: delete the tests that import `BoardGrid` and `PlayerFilter` and their imports; keep the `RequireAuth`, `ShareModal`, and `Paid` tests.
Check `tests/instrumentationSchema.test.ts` still passes (it uses `viewer_v2:on` literals that stay in `eventSchema.ts`).
Check `src/index.css` for `.gdh-*` rules: leave them (stage 7 cleanup) unless `tsc`/build complains.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npx vitest run --project unit
npm run build 2>&1 | tail -2
grep -rn "GameDayHorizon\|components/BoardGrid\|PlayerFilter\|viewer_v2\|VITE_GRIDONE_VIEWER_V2" --include='*.ts' --include='*.tsx' . | grep -vE "node_modules|dist|docs/|eventSchema|instrumentationSchema"
```
Expected: green; the grep returns only Playwright files (fixed in Task 7).

- [ ] **Step 4: Commit**

```bash
git add -A components/BoardView.tsx components/GameDayHorizon.tsx components/BoardGrid.tsx components/PlayerFilter.tsx utils/featureFlags.ts .env.example .env.production tests/featureFlags.test.ts tests/customerFlowFixes.test.tsx
git commit -m "viewer: render the new shell unconditionally; remove viewer_v2, GameDayHorizon, BoardGrid, PlayerFilter

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Playwright

**Files:**
- Create: `playwright-tests/viewer.spec.ts`
- Delete: `playwright-tests/viewer-v2.spec.ts`
- Modify: `playwright-tests/accessibility-contract.spec.ts` (viewer sections), `playwright-tests/feature-flags-off.spec.ts`, `playwright-tests/user-workflows.spec.ts` (viewer selectors only), `playwright-tests/smoke.spec.ts` if it asserts legacy viewer copy

- [ ] **Step 1: `viewer.spec.ts`**

Port the two tests from `viewer-v2.spec.ts` without the `?viewer_v2=true` query and with: no `[data-feature-flag]` assertion (assert `toHaveCount(0)` instead), `getByTestId('viewer-board-grid')`, `Fit` instead of `Reset/Fit`, and one new test: on `/demo` at 390×844, `Find my squares` button and the `role="status"` block are inside the first 844px, the island `button[name^="Score"]` is visible, tapping it reveals `Score updates about every minute`, and the page has no horizontal overflow.

- [ ] **Step 2: accessibility contract**

In `playwright-tests/accessibility-contract.spec.ts`: remove every `?viewer_v2=true`; change `name: /Published Week 1 game day/i` to `/Published Week 1 viewer/i`; delete the legacy-only assertions (`Select the name used by the organizer`, `Choose another name` as legacy button text is now real — keep that one, `Clear Ann` → `Clear`); keep `Quarter-winner email for Ann` (still rendered by `NotificationOptIn`), `Offline · last known`, `Score updates about every minute`, the last-known sentence, and the DOM-order / bounding-box assertions.

- [ ] **Step 3: flags-off and workflows**

`feature-flags-off.spec.ts`: drop `viewer_v2=false` fragments and the `[data-feature-flag="viewer_v2"]` assertion; `/demo` keeps `Demo: Super Bowl LIX`. `user-workflows.spec.ts`: update any viewer selector that targeted legacy copy (run it and fix by reading the failure; do not touch organizer flows).

- [ ] **Step 4: Run**

```bash
npx playwright test playwright-tests/viewer.spec.ts playwright-tests/feature-flags-off.spec.ts playwright-tests/accessibility-contract.spec.ts playwright-tests/smoke.spec.ts --project=chromium 2>&1 | tail -15
npx playwright test playwright-tests/user-workflows.spec.ts --project=chromium 2>&1 | tail -15
```
Expected: all pass. If `user-workflows` needs a running Cloudflare functions server for organizer flows and fails for that reason alone, say so in the report with the exact error; do not stub.

- [ ] **Step 5: Commit**

```bash
git add -A playwright-tests
git commit -m "viewer: playwright contract for the rebuilt viewer

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Browser verification and stage gate (controller)

- [ ] Start `vite-dev`; open `/demo` at 375px and desktop: console errors none; island pinned at top; score instrument, Find capsule, and status inside first viewport at 375×812; tap island → expanded; Find → sheet opens, type a name → suggestions → select → chips + gold line + grid highlight; `Fit` fits the grid; Tab reaches Find with a ring; no horizontal overflow outside the board viewport. Screenshots at both sizes.
- [ ] Gate: `npx tsc --noEmit`, `npx vitest run --project unit`, `npm run build`, `npm run design:lint` (0 errors).
- [ ] Log entry in `docs/REFACTOR_LOG.md` (stage 4: scope, deleted files, evidence, rollback), commit `docs: log broadcast glass stage 4`.
