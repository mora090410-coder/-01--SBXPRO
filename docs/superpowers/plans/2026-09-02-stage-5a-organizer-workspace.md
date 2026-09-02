# Broadcast Glass — Stage 5a: Organizer Workspace (draft side)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single organizer workspace for unpublished boards on the cream base: everything editable in place with autosave, the phase carried by an island, the draw animated into the board, preview as a sheet, and publish as a confirmation sheet with the upgrade path. Stage 5b wires it into `BoardView`, adds the game-day side, rebuilds the dashboard and create pages, and deletes the legacy admin panel.

**Architecture:** New tree `src/features/organizer/workspace/`. A hook `useWorkspaceDraft` owns local game/board state, debounced autosave through the existing `updatePool` path, and the `draftSaveModel` state machine. Components are presentational and take callbacks. Existing services (`manualScoreService`, `publishedOpenSquares`, `milestoneCorrectionService`), the lifecycle model, `ScheduledGamePicker`, `useContestEntries`, and `utils/boardImage` are reused unchanged. `OrganizerWorkspace` composes everything and is rendered by `BoardView` in stage 5b; in this stage it is verified through unit tests and a temporary kitchen entry.

**Tech Stack:** React 19, Tailwind v4, Vitest + Testing Library, primitives from `src/design/primitives`, `qrcode.react` (already a dependency), Supabase client for `contest_entries`.

**Spec:** `docs/superpowers/specs/2026-09-01-broadcast-glass-redesign-design.md` §5. Contract: `docs/organizer-journey-contract.md`.

## Global Constraints

- Cream base (`<Base kind="cream">`). Cardinal is the action color; gold marks committed/settled states (drawn digits, published). No icons except a single-stroke 16px where a label is impossible (none expected).
- Do NOT edit: `hooks/usePoolData.ts`, `hooks/useBoardActions.ts`, `hooks/useContestEntries.ts`, `services/**`, `functions/**`, `workers/**`, `supabase/**`, `src/features/organizer/lifecycle/**`, `src/features/organizer/draft/draftSaveModel.ts`, `src/features/organizer/services/**`, `utils/boardImage.ts`, `components/ScheduledGamePicker.tsx`.
- Autosave: debounce 800ms; serialized; never publish while the save state is not `clean`; `beforeunload` guard while dirty/saving; conflict shows `This board changed in another session.` with a `Reload latest board` action; save failure shows `Retry`.
- Draft-only rules: at least one assigned square before draw/publish; open squares require an explicit acknowledgement group `{n} squares are open. Draw anyway?` with buttons `Keep assigning` and `Draw with {n} OPEN` and the sentence `Open squares stay marked OPEN`; the acknowledgement persists as `allowOpenSquares: true` on the board; publish body sends `{ allowOpenSquares: true }` only when acknowledged and open squares remain.
- Payout descriptions: fields Q1, HALF (label `Halftime`), Q3, FINAL (label `Final`) with `maxLength={120}`, `notes` with `maxLength={280}`, placeholder `Winner gets bragging rights`, button `Save payout rules`, saved through the PATCH path (`onSavePayoutDescriptions`). No numeric inputs, no invented amounts. (Label changed from `Save payout descriptions` to `Save payout rules` in stage 5b: `productionCopy` bans the phrase.)
- Publish: flush the draft save, then `POST /api/pools/:id/publish`; on `402` with `upgradeTo` open the upgrade sheet (copy from the existing `UpgradePaywall`: headlines `That board's live. Want another?` / `Sounds like you're running this for a whole organization.`, buttons `Not now` and `Continue to $9.99 checkout` / `Continue to $79 checkout`, organization name 2–120 chars); on success show copy link, QR, `Open public board`, and `Enter game-day controls`; never `window.location.reload()`.
- Copy bans (productionCopy test scans `src/features/organizer/shell/*` today; add the new tree in stage 5b): never `Assignment workspace`, `Draw workspace`, `Viewer preview workspace`, `Correction flow`, `Reconcile open squares`, `Draw axis digits`, `Preview the viewer link`, `Go Live for game day`, `Payout descriptions` (as UI copy), `Hard blockers`, `Private advisories`, `Draft draw preview`. Use plain words.
- Controls ≥ 44px. Every task ends with `npx tsc --noEmit` and `npx vitest run --project unit` green. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File map

| Path | Responsibility |
|---|---|
| `src/features/organizer/workspace/useWorkspaceDraft.ts` | Local game/board state, autosave, `DraftSaveState`, flush, retry, reload. |
| `src/features/organizer/workspace/WorkspaceHeader.tsx` | Editable serif title, matchup and kickoff line, `Change game` sheet, save pill. |
| `src/features/organizer/workspace/BoardEditor.tsx` | 10×10 editable grid with axes; tap opens `SquareSheet`; paste-to-fill; draw preview digits animate into axes. |
| `src/features/organizer/workspace/SquareSheet.tsx` | Name, sold by, paid/unpaid; `Save` and `Save and next`. |
| `src/features/organizer/workspace/entryMetaService.ts` | `saveEntryMeta` (upsert to `contest_entries`), `clearEntryMeta`. Extracted from `AdminPanel`. |
| `src/features/organizer/workspace/PayoutRulesCard.tsx` | Payout/rules fields with bounded text and PATCH save. |
| `src/features/organizer/workspace/ReconcileCard.tsx` | `{n} filled · {open} open · {unpaid} unpaid`, blockers vs follow-ups, tap highlights open cells. |
| `src/features/organizer/workspace/BoardToolsCard.tsx` | Send board image (owners/sellers), import paper photo, clear names. |
| `src/features/organizer/workspace/OrganizerIsland.tsx` | Rings filled/paid/drawn; expanded: phase, one primary action, secondary actions. |
| `src/features/organizer/workspace/DrawControl.tsx` | Open-square acknowledgement group; `Draw numbers` / `Use these numbers` / `Draw again` / `Replace draft draw`. |
| `src/features/organizer/workspace/PreviewSheet.tsx` | Full-height sheet wrapping `renderPreview()` with `Review and publish`. |
| `src/features/organizer/workspace/PublishSheet.tsx` | Confirmation summary, allowance line, publish call, error. |
| `src/features/organizer/workspace/UpgradeSheet.tsx` | 402 upgrade path to Stripe checkout. |
| `src/features/organizer/workspace/PublishedSheet.tsx` | Success: copy link, QR, open viewer, enter game day. |
| `src/features/organizer/workspace/publishBoard.ts` | `publishBoard(poolId, { allowOpenSquares })` → typed result or `{ upgradeTo }`. |
| `src/features/organizer/workspace/OrganizerWorkspace.tsx` | Composition for unpublished boards. |
| `tests/organizer/*.test.tsx` | One file per unit. |

---

### Task 1: `useWorkspaceDraft`

**Files:** Create `src/features/organizer/workspace/useWorkspaceDraft.ts`; Test `tests/organizer/useWorkspaceDraft.test.tsx`

**Interfaces:**
```ts
export interface UseWorkspaceDraftInput {
  game: GameState;
  board: BoardData;
  revision: number;                 // from usePoolData
  isPublished: boolean;             // autosave is off when published
  onSave: (data: { game: GameState; board: BoardData }) => Promise<unknown>; // throws on failure (useBoardActions.handlePublish)
  onApply?: (game: GameState, board: BoardData) => void;                    // mirrors local state to BoardView for preview
  onReload?: () => Promise<void> | void;
  debounceMs?: number;              // default 800
}
export interface UseWorkspaceDraft {
  game: GameState; board: BoardData;
  setGame: (updater: (g: GameState) => GameState) => void;
  setBoard: (updater: (b: BoardData) => BoardData) => void;
  saveState: DraftSaveState;
  flush: () => Promise<void>;       // clears the timer and awaits the pending save
  retry: () => Promise<void>;       // re-runs a failed save
  reloadLatest: () => Promise<void>;// calls onReload and resets to clean at the new revision
}
export function useWorkspaceDraft(input: UseWorkspaceDraftInput): UseWorkspaceDraft
```
Behavior: local state initialised from props; when `revision` or the `board`/`game` props change and local state is clean, adopt the props. Any `setGame`/`setBoard` marks dirty (`markDraftDirty`), calls `onApply`, and schedules a save; the save uses `startDraftSave({ expectedRevision: revision })`, awaits `onSave`, then `acknowledgeRemoteSave({ serverRevision: latest revision prop })`. If `onSave` throws: if the `revision` prop moved during the save → `conflicted` (set status via `startDraftSave` semantics: build `{ status: 'conflicted', revision, localRevision, error: 'revision_mismatch', canPublish: false }`), else `failDraftSave`. Edits made while saving re-mark dirty after the save resolves and schedule another save. `beforeunload` listener while status is `dirty` or `saving`. When `isPublished`, edits still update local state and call `onApply` but never autosave (game-day writes go through dedicated endpoints).

- [ ] **Step 1: Write the failing test**

Create `tests/organizer/useWorkspaceDraft.test.tsx`:
```tsx
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useWorkspaceDraft } from '../../src/features/organizer/workspace/useWorkspaceDraft';
import type { BoardData, GameState } from '../../types';

const game: GameState = { title: 'Lincoln Softball', meta: '', leftAbbr: 'KC', leftName: 'Kansas City', topAbbr: 'PHI', topName: 'Philadelphia', dates: '', lockTitle: false, lockMeta: false };
const board: BoardData = { topAxis: Array(10).fill(null), leftAxis: Array(10).fill(null), squares: Array.from({ length: 100 }, () => []) };

describe('useWorkspaceDraft', () => {
  it('marks dirty on edit, saves after the debounce, and returns to clean at the new revision', async () => {
    vi.useFakeTimers();
    let revision = 3;
    const onSave = vi.fn(async () => { revision = 4; });
    const onApply = vi.fn();
    const { result, rerender } = renderHook((props: { revision: number }) => useWorkspaceDraft({ game, board, revision: props.revision, isPublished: false, onSave, onApply, debounceMs: 800 }), { initialProps: { revision } });
    act(() => result.current.setGame((g) => ({ ...g, title: 'Lincoln Softball Boosters' })));
    expect(result.current.saveState.status).toBe('dirty');
    expect(onApply).toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(800); });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].game.title).toBe('Lincoln Softball Boosters');
    rerender({ revision });
    await act(async () => {});
    expect(result.current.saveState.status).toBe('clean');
    expect(result.current.saveState.revision).toBe(4);
    vi.useRealTimers();
  });

  it('coalesces rapid edits into one save and flushes on demand', async () => {
    vi.useFakeTimers();
    const onSave = vi.fn(async () => {});
    const { result } = renderHook(() => useWorkspaceDraft({ game, board, revision: 1, isPublished: false, onSave }));
    act(() => { result.current.setBoard((b) => ({ ...b, squares: b.squares.map((s, i) => (i === 0 ? ['Ann'] : s)) })); });
    act(() => { result.current.setBoard((b) => ({ ...b, squares: b.squares.map((s, i) => (i === 1 ? ['Bo'] : s)) })); });
    await act(async () => { await result.current.flush(); });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].board.squares[1]).toEqual(['Bo']);
    vi.useRealTimers();
  });

  it('reports save_failed with retry, and conflicted when the server revision moved', async () => {
    vi.useFakeTimers();
    const onSave = vi.fn().mockRejectedValueOnce(new Error('The board could not be saved.')).mockResolvedValue(undefined);
    const { result, rerender } = renderHook((props: { revision: number }) => useWorkspaceDraft({ game, board, revision: props.revision, isPublished: false, onSave, debounceMs: 10 }), { initialProps: { revision: 1 } });
    act(() => result.current.setGame((g) => ({ ...g, title: 'x' })));
    await act(async () => { vi.advanceTimersByTime(10); });
    expect(result.current.saveState.status).toBe('save_failed');
    await act(async () => { await result.current.retry(); });
    expect(result.current.saveState.status).toBe('clean');

    onSave.mockRejectedValueOnce(new Error('Unable to save the board.'));
    act(() => result.current.setGame((g) => ({ ...g, title: 'y' })));
    const pending = act(async () => { vi.advanceTimersByTime(10); });
    rerender({ revision: 7 });
    await pending;
    expect(result.current.saveState.status).toBe('conflicted');
    vi.useRealTimers();
  });

  it('never autosaves a published board but still applies edits locally', async () => {
    vi.useFakeTimers();
    const onSave = vi.fn(async () => {});
    const onApply = vi.fn();
    const { result } = renderHook(() => useWorkspaceDraft({ game, board, revision: 1, isPublished: true, onSave, onApply }));
    act(() => result.current.setGame((g) => ({ ...g, title: 'z' })));
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(onSave).not.toHaveBeenCalled();
    expect(onApply).toHaveBeenCalled();
    expect(result.current.saveState.status).toBe('clean');
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run --project unit tests/organizer/useWorkspaceDraft.test.tsx` → module not found.

- [ ] **Step 3: Implement**

Create `src/features/organizer/workspace/useWorkspaceDraft.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BoardData, GameState } from '../../../../types';
import { acknowledgeRemoteSave, failDraftSave, markDraftDirty, startDraftSave, type DraftSaveState } from '../draft/draftSaveModel';

export interface UseWorkspaceDraftInput {
  game: GameState;
  board: BoardData;
  revision: number;
  isPublished: boolean;
  onSave: (data: { game: GameState; board: BoardData }) => Promise<unknown>;
  onApply?: (game: GameState, board: BoardData) => void;
  onReload?: () => Promise<void> | void;
  debounceMs?: number;
}

export interface UseWorkspaceDraft {
  game: GameState;
  board: BoardData;
  setGame: (updater: (game: GameState) => GameState) => void;
  setBoard: (updater: (board: BoardData) => BoardData) => void;
  saveState: DraftSaveState;
  flush: () => Promise<void>;
  retry: () => Promise<void>;
  reloadLatest: () => Promise<void>;
}

const clean = (revision: number): DraftSaveState => ({ status: 'clean', revision, canPublish: true });

export function useWorkspaceDraft({ game, board, revision, isPublished, onSave, onApply, onReload, debounceMs = 800 }: UseWorkspaceDraftInput): UseWorkspaceDraft {
  const [localGame, setLocalGame] = useState(game);
  const [localBoard, setLocalBoard] = useState(board);
  const [saveState, setSaveState] = useState<DraftSaveState>(() => clean(revision));
  const latest = useRef({ game, board });
  const saveStateRef = useRef(saveState);
  const revisionRef = useRef(revision);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const editedDuringSave = useRef(false);

  saveStateRef.current = saveState;
  revisionRef.current = revision;

  // Adopt server state when it changes and nothing local is pending.
  useEffect(() => {
    const pending = saveStateRef.current.status === 'dirty' || saveStateRef.current.status === 'saving';
    if (pending) return;
    setLocalGame(game);
    setLocalBoard(board);
    latest.current = { game, board };
    setSaveState(clean(revision));
  }, [game, board, revision]);

  const runSave = useCallback(async () => {
    if (inFlight.current) return inFlight.current;
    const startedAt = revisionRef.current;
    const started = startDraftSave(saveStateRef.current, { expectedRevision: startedAt });
    setSaveState(started);
    if (started.status !== 'saving') return;
    editedDuringSave.current = false;
    const run = (async () => {
      try {
        await onSave(latest.current);
        setSaveState((current) => acknowledgeRemoteSave(current, { serverRevision: Math.max(revisionRef.current, current.localRevision ?? current.revision) }));
      } catch (error) {
        const moved = revisionRef.current !== startedAt;
        setSaveState((current) => (moved
          ? { status: 'conflicted', revision: revisionRef.current, localRevision: current.localRevision, error: 'revision_mismatch', canPublish: false }
          : failDraftSave(current, error instanceof Error ? error.message : 'save_failed')));
      } finally {
        inFlight.current = null;
        if (editedDuringSave.current) {
          editedDuringSave.current = false;
          setSaveState((current) => (current.status === 'clean' ? markDraftDirty(current) : current));
          schedule();
        }
      }
    })();
    inFlight.current = run;
    return run;
  }, [onSave]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; void runSave(); }, debounceMs);
  }, [debounceMs, runSave]);

  const commitLocal = useCallback((nextGame: GameState, nextBoard: BoardData) => {
    latest.current = { game: nextGame, board: nextBoard };
    onApply?.(nextGame, nextBoard);
    if (isPublished) return;
    if (inFlight.current) { editedDuringSave.current = true; return; }
    setSaveState((current) => (current.status === 'saving' ? current : markDraftDirty(current.status === 'dirty' ? current : { ...current, status: current.status === 'clean' ? 'clean' : current.status })));
    schedule();
  }, [isPublished, onApply, schedule]);

  const setGame = useCallback((updater: (g: GameState) => GameState) => {
    const next = updater(latest.current.game);
    setLocalGame(next);
    commitLocal(next, latest.current.board);
  }, [commitLocal]);

  const setBoard = useCallback((updater: (b: BoardData) => BoardData) => {
    const next = updater(latest.current.board);
    setLocalBoard(next);
    commitLocal(latest.current.game, next);
  }, [commitLocal]);

  const flush = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (saveStateRef.current.status === 'dirty') await runSave();
    else if (inFlight.current) await inFlight.current;
  }, [runSave]);

  const retry = useCallback(async () => {
    if (saveStateRef.current.status !== 'save_failed') return;
    setSaveState((current) => ({ status: 'dirty', revision: current.revision, localRevision: current.localRevision ?? current.revision + 1, canPublish: false }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await runSave();
  }, [runSave]);

  const reloadLatest = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    await onReload?.();
    setSaveState(clean(revisionRef.current));
  }, [onReload]);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (saveStateRef.current.status === 'dirty' || saveStateRef.current.status === 'saving') { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { game: localGame, board: localBoard, setGame, setBoard, saveState, flush, retry, reloadLatest };
}
```
Note: `markDraftDirty` rejects when called on a `save_failed`/`conflicted` state with malformed revisions; the implementer must make the test pass and may simplify the `commitLocal` dirty transition to: `setSaveState((current) => (current.status === 'dirty' || current.status === 'saving') ? current : markDraftDirty({ status: 'clean', revision: current.revision }))`.

- [ ] **Step 4: Run tests** — expected 4 passing. If a fake-timer/act interaction fails, adjust the implementation (not the assertions) until the four behaviors hold.

- [ ] **Step 5: Commit** — `organizer: useWorkspaceDraft autosave hook`.

---

### Task 2: Workspace header

**Files:** Create `src/features/organizer/workspace/WorkspaceHeader.tsx`; Test `tests/organizer/workspaceHeader.test.tsx`

**Interfaces:**
```ts
export interface WorkspaceHeaderProps {
  game: GameState;
  saveState: DraftSaveState;
  isPublished: boolean;
  onTitleChange: (title: string) => void;      // called on blur/Enter with the trimmed title (ignored when published)
  onGameChange?: (game: ScheduledGame) => void; // draft only; opens the Change game sheet
  onRetry: () => void;
  onReload: () => void;
  onLogout: () => void;
}
```
Renders: `Eyebrow` `Organizer` (or `Published board`), the title as an `<input aria-label="Board name">` styled like a serif h1 (`font-display text-[34px] md:text-[44px] bg-transparent border-0 focus:outline-none focus-visible:ring-2 ring-action rounded-control`), read-only when published; matchup line `{leftAbbr} at {topAbbr} · {kickoff formatted or 'Kickoff not set'}` with a ghost `Change game` button (draft only) that opens a `Sheet` titled `Pick the game` containing `ScheduledGamePicker` (`value={game.gameExternalId ?? null}`, `onChange` → `onGameChange` then close); a save pill: `Saved` (mono, `text-fg-3`), `Saving…`, `Unsaved changes`, `Save failed` + quiet `Retry`, `This board changed in another session.` + quiet `Reload latest board` (`role="alert"` for conflict, `role="status"` otherwise); a ghost `Log out` at the far right.

- [ ] **Step 1: Test**
```tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WorkspaceHeader from '../../src/features/organizer/workspace/WorkspaceHeader';
import type { GameState } from '../../types';

vi.mock('../../components/ScheduledGamePicker', () => ({ default: () => <div data-testid="picker" /> }));
const game: GameState = { title: 'Lincoln Softball', meta: '', leftAbbr: 'KC', leftName: 'Kansas City', topAbbr: 'PHI', topName: 'Philadelphia', dates: '', kickoffAt: '2026-09-13T17:00:00.000Z', lockTitle: false, lockMeta: false };
const base = { game, isPublished: false, onTitleChange: vi.fn(), onGameChange: vi.fn(), onRetry: vi.fn(), onReload: vi.fn(), onLogout: vi.fn() };

describe('WorkspaceHeader', () => {
  it('edits the title in place and commits on blur', () => {
    const onTitleChange = vi.fn();
    render(<WorkspaceHeader {...base} onTitleChange={onTitleChange} saveState={{ status: 'clean', revision: 1 }} />);
    const input = screen.getByRole('textbox', { name: 'Board name' });
    fireEvent.change(input, { target: { value: '  Lincoln Softball Boosters ' } });
    fireEvent.blur(input);
    expect(onTitleChange).toHaveBeenCalledWith('Lincoln Softball Boosters');
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });
  it('shows conflict as an alert with Reload latest board', () => {
    render(<WorkspaceHeader {...base} saveState={{ status: 'conflicted', revision: 1 }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('This board changed in another session.');
    fireEvent.click(screen.getByRole('button', { name: 'Reload latest board' }));
    expect(base.onReload).toHaveBeenCalled();
  });
  it('shows Retry on save failure', () => {
    render(<WorkspaceHeader {...base} saveState={{ status: 'save_failed', revision: 1 }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(base.onRetry).toHaveBeenCalled();
  });
  it('opens the game sheet in draft and hides it when published', () => {
    const { rerender } = render(<WorkspaceHeader {...base} saveState={{ status: 'clean', revision: 1 }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Change game' }));
    expect(screen.getByRole('dialog', { name: 'Pick the game' })).toBeInTheDocument();
    rerender(<WorkspaceHeader {...base} isPublished saveState={{ status: 'clean', revision: 1 }} />);
    expect(screen.queryByRole('button', { name: 'Change game' })).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Board name' })).toHaveAttribute('readonly');
  });
});
```
- [ ] **Step 2: Fail**, **Step 3: Implement** per the interface (kickoff formatted with `new Date(kickoffAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })`, fallback `game.dates || 'Kickoff not set'`), **Step 4: Pass**, **Step 5: Commit** `organizer: workspace header with in-place title and save state`.

---

### Task 3: Board editor and square sheet

**Files:** Create `BoardEditor.tsx`, `SquareSheet.tsx`, `entryMetaService.ts`; Test `tests/organizer/boardEditor.test.tsx`

**Interfaces:**
```ts
// entryMetaService.ts
export async function saveEntryMeta(poolId: string, meta: EntryMeta): Promise<void>  // upsert contest_entries as AdminPanel did; throws on error
export async function clearEntryMeta(poolId: string): Promise<void>

// SquareSheet.tsx
export interface SquareSheetProps {
  open: boolean; index: number | null; name: string; meta?: EntryMeta; isPublished: boolean; hasNextOpen: boolean;
  onSave: (index: number, name: string, meta: EntryMeta, advance: boolean) => void; onClose: () => void;
}
// Sheet titled `Square {index+1}`; CapsuleInput `Name on the board` (autofocus target via Sheet), `Sold by (optional)`, paid segmented control with two CapsuleTags acting as radio buttons (`Unpaid`, `Paid`, role="radiogroup" aria-label="Payment"); buttons `Save` and, when hasNextOpen and not published, `Save and next`; Enter in the name field = Save and next (or Save). Published: helper text `This board is published. Renaming a square is recorded in the board history and updates the shared link right away.` and only the name is editable (seller/paid still editable — they are private).

// BoardEditor.tsx
export interface BoardEditorProps {
  board: BoardData; game: GameState; entryMeta: Record<number, EntryMeta>;
  drawPreview: { top: number[]; left: number[] } | null;  // digits animating into axes
  highlightOpen: boolean; isPublished: boolean; canAssignOpenSquares: boolean; // published: only OPEN cells selectable when true
  onSelectSquare: (index: number) => void;
  onPasteNames?: (names: string[]) => void;  // draft only: paste a newline list into the first open cells
}
// Grid: 11×11 CSS grid inside a Glass; axis cells show committed digits (gold, mono) or `·`; when drawPreview is present the digits render with a rolling animation (`animate-[digit-roll_var(--g-dur-spring)_var(--g-ease-state)]`, keyframe added to tokens.css: from translateY(-8px) opacity 0 to 0/1) and a `CapsuleTag tone="gold"` `Draft draw` above the grid. Cells are buttons `aria-label="Square {n}, assigned to {name}"` / `"Square {n}, unassigned"`; OPEN cells `border-dashed`; paid cells show a small mono `paid` caption; when highlightOpen, open cells get `ring-2 ring-tone-cardinal`. A `textarea` (`aria-label="Paste names"`, draft only) above the grid: on paste/blur, split by newline, trim, drop empties, call onPasteNames.
```
- [ ] **Step 1: Test**
```tsx
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BoardEditor from '../../src/features/organizer/workspace/BoardEditor';
import SquareSheet from '../../src/features/organizer/workspace/SquareSheet';
import type { BoardData, GameState } from '../../types';

const game: GameState = { title: 'T', meta: '', leftAbbr: 'KC', leftName: 'Kansas City', topAbbr: 'PHI', topName: 'Philadelphia', dates: '', lockTitle: false, lockMeta: false };
const board: BoardData = { topAxis: Array(10).fill(null), leftAxis: Array(10).fill(null), squares: Array.from({ length: 100 }, (_, i) => (i === 0 ? ['Ann'] : [])) };

describe('BoardEditor', () => {
  it('names cells accessibly and opens the selected square', () => {
    const onSelectSquare = vi.fn();
    render(<BoardEditor board={board} game={game} entryMeta={{ 0: { cell_index: 0, paid_status: 'paid', notify_opt_in: false, contact_type: null, contact_value: null } }} drawPreview={null} highlightOpen={false} isPublished={false} canAssignOpenSquares={false} onSelectSquare={onSelectSquare} />);
    fireEvent.click(screen.getByRole('button', { name: 'Square 1, assigned to Ann' }));
    expect(onSelectSquare).toHaveBeenCalledWith(0);
    expect(screen.getByRole('button', { name: 'Square 2, unassigned' })).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
  });
  it('shows draw preview digits in the axes with the draft tag', () => {
    render(<BoardEditor board={board} game={game} entryMeta={{}} drawPreview={{ top: [3,1,4,1,5,9,2,6,5,3], left: [0,1,2,3,4,5,6,7,8,9] }} highlightOpen={false} isPublished={false} canAssignOpenSquares={false} onSelectSquare={vi.fn()} />);
    expect(screen.getByText('Draft draw')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });
  it('pastes a name list into open cells', () => {
    const onPasteNames = vi.fn();
    render(<BoardEditor board={board} game={game} entryMeta={{}} drawPreview={null} highlightOpen={false} isPublished={false} canAssignOpenSquares={false} onSelectSquare={vi.fn()} onPasteNames={onPasteNames} />);
    const area = screen.getByRole('textbox', { name: 'Paste names' });
    fireEvent.change(area, { target: { value: 'Bo\n\n Cy \nDi' } });
    fireEvent.blur(area);
    expect(onPasteNames).toHaveBeenCalledWith(['Bo', 'Cy', 'Di']);
  });
  it('published: only open cells are selectable when late fill is allowed', () => {
    const onSelectSquare = vi.fn();
    render(<BoardEditor board={board} game={game} entryMeta={{}} drawPreview={null} highlightOpen={false} isPublished canAssignOpenSquares onSelectSquare={onSelectSquare} />);
    expect(screen.getByRole('button', { name: 'Square 1, assigned to Ann' })).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Square 2, unassigned' }));
    expect(onSelectSquare).toHaveBeenCalledWith(1);
  });
});

describe('SquareSheet', () => {
  it('saves name, seller, and paid status and advances on Enter', () => {
    const onSave = vi.fn();
    render(<SquareSheet open index={4} name="" isPublished={false} hasNextOpen onSave={onSave} onClose={vi.fn()} />);
    const name = screen.getByRole('textbox', { name: 'Name on the board' });
    fireEvent.change(name, { target: { value: 'Dana P.' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Sold by/ }), { target: { value: 'Coach Lee' } });
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Payment' })).getByRole('radio', { name: 'Paid' }));
    fireEvent.keyDown(name, { key: 'Enter' });
    expect(onSave).toHaveBeenCalledWith(4, 'Dana P.', expect.objectContaining({ cell_index: 4, paid_status: 'paid', seller_label: 'Coach Lee' }), true);
  });
  it('explains renames on a published board', () => {
    render(<SquareSheet open index={0} name="Ann" isPublished hasNextOpen={false} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/recorded in the board history/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save and next' })).toBeNull();
  });
});
```
Note on the published test: assigned cells stay enabled when published so the organizer can open the rename sheet; only the sheet decides what is editable.
- [ ] **Steps 2–5** as usual; add the `digit-roll` keyframe to `src/design/tokens.css`. Commit `organizer: board editor and square sheet`.

---

### Task 4: Side rail cards

**Files:** Create `PayoutRulesCard.tsx`, `ReconcileCard.tsx`, `BoardToolsCard.tsx`; Test `tests/organizer/sideRail.test.tsx`; Modify `tests/payoutEditorContract.test.ts` to read `src/features/organizer/workspace/PayoutRulesCard.tsx` instead of `components/AdminPanel.tsx` (keep every assertion).

**Interfaces:**
```ts
// PayoutRulesCard
{ descriptions: PayoutDescriptions; status: 'idle'|'saving'|'saved'|'error'; disabled?: boolean; onChange: (field: keyof PayoutDescriptions, value: string) => void; onSave: () => void }
// fields: Q1 `Q1`, HALF `Halftime`, Q3 `Q3`, FINAL `Final` (CapsuleInput, maxLength={120}, placeholder `Winner gets bragging rights`), notes `Board rules` (textarea, maxLength={280}); button `Save payout rules`; helper `GridOne never handles the money. Describe prizes in words.`
// ReconcileCard
{ model: OrganizerLifecycleModel; unpaidCount: number; highlightOpen: boolean; onToggleHighlightOpen: () => void }
// Glass: line `{assignedCount} filled · {openCount} open · {unpaidCount} unpaid` as a button (aria-pressed) toggling highlight; then `Before you can publish` list from hardBlockers using ReconcileChecklist's blockerText map (copy it into this file), else `Nothing blocking publish.`; then `Private follow-up` list from advisories using the advisoryText map, else `No private follow-up.`
// BoardToolsCard
{ isPublished: boolean; exporting: boolean; onExport: (mode: 'owners'|'sellers') => void; hasSellers: boolean; onImportPhoto?: (file: File) => void; importing?: boolean; onClearNames?: () => void }
// buttons: `Send board` (owners), `Send seller sheet` when hasSellers, `Import a paper board photo` (file input, draft only), `Clear all names` (draft only; two-step: first click → `Confirm clear` for 5s).
```
- [ ] Test the three cards (fields present with maxLength, save button, reconcile line and lists, tools two-step clear). Commit `organizer: side rail cards`.

---

### Task 5: Island and draw control

**Files:** Create `OrganizerIsland.tsx`, `DrawControl.tsx`; move `secureShuffleDigits` into `src/features/organizer/workspace/secureDraw.ts` (copy from `components/AdminPanel.tsx:43-51`; AdminPanel keeps its own until 5b deletes it); Test `tests/organizer/islandAndDraw.test.tsx`; Modify `tests/openSquaresOrganizerContract.test.ts` to read `DrawControl.tsx` and `OrganizerWorkspace.tsx` (Task 7) for its source-string assertions and import `publishedOpenSquaresAreAssignable` from `src/features/organizer/services/game-day/publishedOpenSquares` (keep the viewer assertions).

**Interfaces:**
```ts
// OrganizerIsland
{ filled: number; paid: number; drawn: boolean; phase: OrganizerLifecyclePhase; primary: { label: string; onClick: () => void; disabled?: boolean } | null; secondary?: Array<{ label: string; onClick: () => void; disabled?: boolean }>; note?: string }
// Island placement="corner" on lg, "top" otherwise → render two Islands? No: Island has one placement prop; use placement="top" (works on both; desktop shows it centered at top).
// collapsed: IslandRings [{value: filled/100, caption: `${filled}%`, label: `${filled} of 100 squares filled`}, {value: filled ? paid/filled : 0, caption: `${Math.round(filled ? paid/filled*100 : 0)}%`, label: `${paid} of ${filled} paid`, tone: 'gold'}, {value: drawn ? 1 : 0, caption: drawn ? 'Drawn' : 'Draw', label: drawn ? 'Numbers drawn' : 'Numbers not drawn', tone: 'gold'}]
// expanded: Eyebrow phase; note (e.g. first blocker text); CapsuleButton primary; ghost secondaries.
// DrawControl
{ openCount: number; acknowledged: boolean; drawn: boolean; preview: boolean; disabled: boolean; onAcknowledge: () => void; onKeepAssigning: () => void; onDraw: () => void; onCommit: () => void; onAgain: () => void; onReplace: () => void; onCancelPreview: () => void }
// Renders nothing until asked (it is the island's action target): when openCount>0 and !acknowledged and a draw was requested → `role="group" aria-label="{n} squares are open. Draw anyway?"` Glass with `Open squares stay marked OPEN on the shared board. You can still assign them before kickoff.` and buttons `Keep assigning`, `Draw with {n} OPEN`. When preview → buttons `Use these numbers`, `Draw again`, ghost `Cancel`. When drawn and !preview → line `Numbers set` + ghost `Replace draft draw` (draft only).
```
`OrganizerWorkspace` (Task 7) owns the state machine: `requestDraw()` → if open squares and not acknowledged → show group; `acknowledge()` sets `allowOpenSquares: true` on the board (persisted by autosave) and proceeds to `preview = secureShuffleDigits()`; `commit()` writes axes into the board (`isDynamic: false`, per-quarter axes cleared) and clears preview.

- [ ] Tests: rings captions and labels; expanded primary/secondary; DrawControl group semantics and button names; `secureShuffleDigits` returns a permutation of 0–9. Commit `organizer: island and draw control`.

---

### Task 6: Preview, publish, upgrade, published sheets

**Files:** Create `PreviewSheet.tsx`, `PublishSheet.tsx`, `UpgradeSheet.tsx`, `PublishedSheet.tsx`, `publishBoard.ts`; Test `tests/organizer/publishSheets.test.tsx`

**Interfaces:**
```ts
// publishBoard.ts
export type PublishResult = { published: true; shareCode: string; viewerUrl: string; revision: number; tier: string; used: number; allowance: number } | { published: false; upgradeTo: 'gameday' | 'org'; message: string };
export async function publishBoard(poolId: string, options: { allowOpenSquares: boolean }): Promise<PublishResult>
// uses supabase.auth.getSession() for the token, POST /api/pools/${poolId}/publish with body {allowOpenSquares:true} only when true else {}; 402 + upgradeTo → {published:false,...}; !ok → throw Error(result.error || 'The board could not be published.')

// PreviewSheet: { open; onClose; canPublish; onReviewPublish; children } → Sheet height="full" title `Private preview — sharing is off`; children in a scroll container; footer CapsuleButton `Review and publish` (disabled when !canPublish).
// PublishSheet: { open; onClose; game; board; allowance?: { tier: string; used: number; allowance: number } | null; pending; error; disabled; onPublish }
//   title `Publish viewer link`; summary rows: board name, `{leftAbbr} at {topAbbr}`, kickoff, `{assigned} assigned · {open} OPEN`, axis digits (mono), open-square rule line when open>0 (`Open squares stay OPEN on the shared board.`), `What becomes public` and `What remains private` paragraphs (copy from PublishReviewDialog), allowance line `{used} of {allowance} published this season · {tierLabel}` when provided; buttons quiet `Cancel` (first focusable), primary `Publish viewer link`.
// UpgradeSheet: { open; tier: 'gameday'|'org'; error; organizationName; onOrganizationNameChange; onClose; onCheckout } — copy from UpgradePaywall verbatim; Sheet; `Not now` + `Continue to $9.99 checkout`/`Continue to $79 checkout`; org name CapsuleInput with maxLength 120 and validity 2–120.
// PublishedSheet: { open; shareUrl; onClose; onOpenViewer; onEnterGameDay } — title `Published`; QRCodeSVG (size 160) in a white Glass; mono link with `Copy link` capsule (copied/error states as ShareModal); buttons `Open public board`, primary `Enter game-day controls`.
```
- [ ] Tests: `publishBoard` (mock fetch: 200 → result; 402 → upgradeTo; 409 → throws message), PublishSheet summary strings and allowance line, UpgradeSheet disabled until org name valid, PublishedSheet copy + buttons. Commit `organizer: preview, publish, upgrade, and published sheets`.

---

### Task 7: `OrganizerWorkspace` composition (draft mode)

**Files:** Create `OrganizerWorkspace.tsx`; Test `tests/organizer/organizerWorkspace.test.tsx`

**Interface** (source-compatible superset of `OrganizerShellProps`, so `BoardView` can swap in stage 5b):
```ts
export interface OrganizerWorkspaceProps extends OrganizerShellProps {
  revision: number;                              // usePoolData revision
  entryMeta: Record<number, EntryMeta>;          // from useContestEntries
  onEntryMetaChange: (meta: EntryMeta) => void;  // updates the hook's map after a save
  onScheduledGameChange?: (game: ScheduledGame) => void;
  billing?: { tier: string; used: number; allowance: number } | null;
  onCheckout?: (tier: 'gameday' | 'org', organizationName?: string) => Promise<void>;
}
```
Composition (unpublished branch only; when `isPublished` render a placeholder `<GameDayPlaceholder/>` section with the text `Game-day controls arrive in stage 5b.` — replaced in 5b):
```
<Base kind="cream">
  <OrganizerIsland … />
  <main aria-label="{title} workspace" class="mx-auto max-w-7xl px-4 pt-6 pb-24 lg:pt-8">
    <WorkspaceHeader … />
    <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section aria-label="Board">
        <DrawControl … />          (only when a draw is requested / previewed / drawn)
        <BoardEditor … />
      </section>
      <aside class="flex flex-col gap-6">
        <ReconcileCard … />
        <PayoutRulesCard … />
        <BoardToolsCard … />
      </aside>
    </div>
  </main>
  <SquareSheet … /> <PreviewSheet … /> <PublishSheet … /> <UpgradeSheet … /> <PublishedSheet … />
</Base>
```
State: `useWorkspaceDraft` (game/board/saveState); lifecycle `model` via `evaluateOrganizerLifecycle` (cells built with real `paidStatus` and `sellerLabel` from `entryMeta`); `drawRequested`, `drawPreview`; `selectedSquare`; `previewOpen`, `publishOpen`, `upgradeTier`, `published: PublishResult | null`; `payoutStatus`. Island primary by phase: no assigned squares → `Fill the board` (scrolls to grid); assigned and not drawn → `Draw numbers` (`disabled` when `!model.canEnterDraw || saveState.status === 'conflicted'`); drawn → `Preview` (opens PreviewSheet after `flush()`); preview reviewed (PreviewSheet's `Review and publish`) → PublishSheet; published result → `Copy link`. Secondary: `Replace draft draw` when drawn. Note: first blocker text when blocked.
Square save: `onSave(index, name, meta, advance)` → `setBoard` writes `[name]` or `[]`; `saveEntryMeta(activePoolId, meta)` then `onEntryMetaChange(meta)`; if `advance`, select the next open index after `index`. Paste: fills open cells in order. Clear names: `setBoard` all `[]` and `clearEntryMeta`. Import photo: `compressImage` + `parseBoardImage` (from `utils/image` and `services/boardImportService`, as `CreateContest` does) then `setBoard(scanned)`. Export: `renderBoardPng`/`shareBoardPng`/`boardImageFilename` as AdminPanel did.
Publish: `await flush()`; if `saveState.status !== 'clean'` show error `Publish blocked. Reload or save the latest clean draft before publishing.`; else `publishBoard(activePoolId, { allowOpenSquares: board.allowOpenSquares === true && openCount > 0 })`; on `upgradeTo` open UpgradeSheet; on success set `published`, open PublishedSheet, and call `onReload?.()` so `BoardView` learns `isPublished`. `Enter game-day controls` closes the sheet (5b routes it).

- [ ] **Test** (mock `../../services/supabase` and the entry service): renders island rings from board + entryMeta; island primary is `Fill the board` on an empty board, `Draw numbers` after one square, `Preview` after a committed draw; open-square acknowledgement flow persists `allowOpenSquares`; committing a draw writes exact permutations and calls `onApply`; publish blocked while dirty; publish success opens `Published` with the share link (mock `fetch`). Keep the old `organizerShell.test.tsx` untouched (deleted in 5b).
- [ ] Commit `organizer: workspace composition for draft boards`.

---

### Task 8: Stage gate

- `npx tsc --noEmit`; `npx vitest run --project unit`; `npm run build`; `npm run design:lint`.
- Browser check via a temporary kitchen entry: add to `src/design/kitchen/DesignKitchen.tsx` (dev-only route) a link `Organizer workspace` that renders `OrganizerWorkspace` with a local demo board (no network; mock `onSave` to resolve; `onPublish` unused). Verify at 375px and desktop: title edits in place, tapping a cell opens the sheet, Enter advances, paste fills, island rings update, draw group → digits roll into axes, Replace draft draw, preview sheet opens the demo viewer, publish sheet summary. Remove nothing yet (5b deletes the kitchen entry with the route).
- Log stage 5a in `docs/REFACTOR_LOG.md`; commit.
