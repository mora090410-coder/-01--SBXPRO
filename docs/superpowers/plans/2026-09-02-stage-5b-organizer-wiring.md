# Broadcast Glass — Stage 5b: Organizer game day, wiring, dashboard, create, legacy deletion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the stage 5a workspace the only organizer surface: add its game-day side, render it from `BoardView`, rebuild the dashboard and the create page on the cream base, delete the legacy admin panel and the flagged shell, remove the last feature flag, and rewrite the organizer Playwright suites.

**Architecture:** `OrganizerWorkspace` gains a published branch composed of small game-day cards under `src/features/organizer/workspace/gameday/`. `BoardView` renders `OrganizerWorkspace` whenever `isCommissionerMode`, feeding it `useContestEntries`, `revision`, billing status, and checkout. `pages/Dashboard.tsx` and `pages/CreateContest.tsx` are rewritten in place (same routes, same data calls). `components/AdminPanel.tsx`, `components/OrganizerDashboard.tsx`, `utils/organizerFlow.ts`, `utils/featureFlags.ts`, and `src/features/organizer/shell/*` are deleted. `ManualScoringPanel` is restyled in place, keeping every string its test pins.

**Tech Stack:** as stage 5a. Supabase RPC `gridone_rename_published_square` for audited renames.

**Spec:** spec §5; `docs/organizer-journey-contract.md` §§5–7 and the correction boundary.

## Global Constraints

- Cream base. No icons (the dashboard's Lucide icons go away). Controls ≥ 44px.
- Do NOT edit: `hooks/**`, `services/**`, `functions/**`, `workers/**`, `supabase/**`, `src/features/organizer/{lifecycle,draft,services,game-day/manualScoringModel.ts}`, `pages/Login.tsx`, `components/auth/RequireAuth.tsx`, `pages/Paid.tsx`, `src/features/instrumentation/**`.
- Strings that stay (tests pin them): `Live Scoring`; `Auto`; `Manual`; `Game Status`; `Current Period`; `Automatic score checks show their source and freshness. Switch to Manual any time you want your entered score to be the official board score.`; `Enter each quarter's points, not running totals. Publishing a completed period confirms its result and prepares winner emails.`; `Publish manual score`; `Publishing score…`; `Ready when the board goes live`; `Every published board gets the full game-day experience.`; `Correct a published result`; `Publish correction`; `Publishing correction…`; `Why this changed (shown publicly)`; `Published assignments cannot be changed. Select OPEN squares only.`; `Create another board`; `This board is locked as the Final record.`; `Unsaved Board Found`; `Save to Account`; `Discard`; `Board Saved!`; `Sign in to save your draft` (Login, untouched); `Completed-game score test`; `five most recent final games`; `Board name`; `Pick the game`; `This is a sample board. Ready to run yours?` (BoardView); `Create your free board`.
- Renamed on purpose: `Create blank 10×10 board` → `Create board`; the create interstitial (`Your board is ready to fill`) is removed, creation lands on `/boards/:id`; `Change scheduled game` → `Change game`; `Preview` tab → island `Preview`; `Grid Editor` heading → none; `More options` menu → none; `Board Name` label → `Board name`.
- Vocabulary from the contract: `publishPool`/`handlePublish` names stay in the hooks (not editable); new code calls its own functions `saveDraft`, `publishBoard`, `copyViewerLink`.
- `productionCopy` banned phrases apply to all organizer workspace files (update its file list to the new tree).
- Every task ends with `npx tsc --noEmit` and `npx vitest run --project unit` green. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File map

| Path | Change |
|---|---|
| `src/features/organizer/workspace/gameday/SharePanel.tsx` | Link, `Copy link`, QR, `Open public board`. |
| `src/features/organizer/workspace/gameday/ScoreAuthorityCard.tsx` | Authority line + restyled `ManualScoringPanel` (in place). |
| `src/features/organizer/game-day/ManualScoringPanel.tsx` | Restyle only; strings/labels unchanged. |
| `src/features/organizer/workspace/gameday/CorrectionsCard.tsx` | Milestone correction form + history (from `CorrectionFlow`). |
| `src/features/organizer/workspace/gameday/DeliveryIssuesCard.tsx` | Notification delivery issues list. |
| `src/features/organizer/workspace/gameday/FinalRecordCard.tsx` | Locked final record + `Create another board`. |
| `src/features/organizer/workspace/renamePublishedSquare.ts` | RPC wrapper (from `AdminPanel.renamePublishedSquare`). |
| `src/features/organizer/workspace/OrganizerWorkspace.tsx` | Published branch composed; late fill + rename via `SquareSheet`. |
| `components/BoardView.tsx` | Renders `OrganizerWorkspace`; flag gone. |
| `pages/Dashboard.tsx`, `pages/CreateContest.tsx` | Rewritten on the cream base. |
| `App.tsx` | `/dashboard` and `/create` no longer wrapped in `Layout`. |
| Deleted | `components/AdminPanel.tsx`, `components/OrganizerDashboard.tsx`, `utils/organizerFlow.ts`, `utils/featureFlags.ts`, `src/features/organizer/shell/*`, `src/design/kitchen/OrganizerWorkspaceDemo.tsx` (and its kitchen toggle), `tests/organizerShell.test.tsx`, `tests/organizerFlow.test.ts`, `tests/featureFlags.test.ts`, `playwright-tests/organizer-v2.spec.ts`, `playwright-tests/feature-flags-off.spec.ts`. |
| Tests | `tests/organizer/gameday.test.tsx` (new), `tests/organizer/organizerWorkspace.test.tsx` (published cases), `tests/dashboard.test.tsx` (new), `tests/createContest.test.tsx` (new), `tests/createContestScanFallback.test.tsx` (updated selectors), `tests/productionCopy.test.ts`, `tests/pricingCopyConsistency.test.ts`, `tests/openSquaresOrganizerContract.test.ts` (skips enabled), `playwright-tests/organizer.spec.ts` (new), `user-workflows.spec.ts`, `scheduled-game-picker.spec.ts`, `accessibility-contract.spec.ts`. |

---

### Task 1: Game-day cards

**Files:** create the five `gameday/*.tsx` cards and `renamePublishedSquare.ts`; restyle `ManualScoringPanel.tsx`; Test `tests/organizer/gameday.test.tsx`; keep `tests/manualScoringPanel.test.tsx` green unchanged.

**Interfaces:**
```ts
// SharePanel
{ shareUrl: string; onOpenViewer: () => void }  // Glass: Eyebrow `Public board`, mono link, `Copy link` (copied/error states as PublishedSheet), quiet `Open public board`, QR (QRCodeSVG 128) on sm+
// ScoreAuthorityCard
{ game: GameState; liveData: LiveGameData | null; scoreSaveStatus; isActivated; onEnableAutomaticScoring; onEnableManualScoring; onUpdateManualGameState; onUpdateManualPeriod; onUpdateManualQuarter; onSaveManualScore }
// Glass: Eyebrow `Score authority`; line `Manual scoring authority` | `Automatic scoring authority` (existing copy); current score numerals when liveData; then <ManualScoringPanel …/>.
// ManualScoringPanel restyle: selects get `rounded-control bg-panel border border-hairline h-11 px-4 font-ui text-[16px]`; number inputs same at `text-center`; Auto/Manual becomes two CapsuleButtons (quiet/primary by state) — keep the exact button names `Auto`/`Manual` and the `disabled` behaviors; headings keep their text; the not-activated block becomes a Glass with the same two sentences.
// CorrectionsCard
{ winnerHistory: WinnerResolution[]; draft: MilestoneCorrectionDraft | null; pending: boolean; onDraftChange; onPublishCorrection }
// Same fields/strings as CorrectionFlow (`Result to correct` select, `Side score`, `Top score`, `Why this changed (shown publicly)`, `Current winner: …`, `Publish correction`), restyled; history list uses milestoneLabel.
// DeliveryIssuesCard
{ issues: NotificationDeliveryIssue[] }  // nothing when empty; else Glass `Review delivery issue` heading + one line per issue (read the type in types.ts for fields)
// FinalRecordCard
{ winnerHistory: WinnerResolution[] }  // Glass border-gold/40: Eyebrow `Final record`, h2 `This board is locked as the Final record.`, the explanatory sentence from OrganizerShell, list of milestones (milestoneLabel · participant or `Open square` · digits), CapsuleButton link `Create another board` → `/create`.
// renamePublishedSquare(poolId, cellIndex, nextName): Promise<void>  // supabase.rpc('gridone_rename_published_square', { p_contest_id, p_cell_index, p_new_name }); throws on error
```
- [ ] Tests: SharePanel copy states; ScoreAuthorityCard renders authority line and the panel; CorrectionsCard selects a milestone and enables `Publish correction` only with a reason; FinalRecordCard link; `renamePublishedSquare` calls rpc with the exact args (mock supabase). Run `tests/manualScoringPanel.test.tsx` too. Commit `organizer: game-day cards`.

---

### Task 2: Published branch of the workspace

**Files:** `OrganizerWorkspace.tsx`; `tests/organizer/organizerWorkspace.test.tsx`; `tests/openSquaresOrganizerContract.test.ts` (enable the two skips).

Behavior when `isPublished`:
- Header read-only title; matchup; save pill hidden (no autosave) — show `Published` CapsuleTag gold instead; `Log out`.
- Island rings filled/paid/(drawn=true); primary `Copy link` (writes `shareUrl` to clipboard; note `Viewer link copied.`), secondary `Open public board`; when `liveData?.state === 'post'` primary becomes `Create another board`.
- Alert region as in draft.
- Main column: `SharePanel`; `ScoreAuthorityCard` wired to the existing manual-score handlers (port `enableManualScoring`, `saveManualScore`, `enableAutomaticScoring`, `updateManualQuarter`, `updateManualGameState` verbatim from `OrganizerShell.tsx`, using `setGame`); `BoardEditor` in published mode with `canAssignOpenSquares = publishedOpenSquaresAreAssignable({ isPublished, openSquareCount, kickoffAt, now })` (a 30s clock effect as before); `SquareSheet` for: an OPEN cell → late fill through `onAssignOpenSquares(nextSquares)` then `onReload`; an assigned cell → name change through `renamePublishedSquare` (optimistic update, revert on error, message `Square {n} changed from {a} to {b}. The change is in the board history.`), and private meta through `saveEntryMeta`. If the sheet is used on an occupied cell to assign over it (name non-empty → different) that is a rename; attempting to late-fill an occupied cell must never call `onAssignOpenSquares` — guard with the exact message `Published assignments cannot be changed. Select OPEN squares only.`
- Side rail: `PayoutRulesCard` (PATCH still allowed), `CorrectionsCard` wired to `publishMilestoneCorrectionToServer`, `DeliveryIssuesCard`, `BoardToolsCard` with `isPublished` (export only).
- Final: `FinalRecordCard` at the top of the main column when `liveData?.state === 'post'`.
- [ ] Tests: published header shows `Published` and no save pill; `Copy link` writes the URL; late fill calls `onAssignOpenSquares` with the new squares array and `onReload`; occupied-cell late-fill attempt shows the exact message and does not call it; rename calls the RPC and updates the cell; manual scoring `Manual` → `enableManualScoringOnServer` (mock the service module); Final shows `This board is locked as the Final record.` Enable the two contract skips (they read the workspace source for `onAssignOpenSquares`, `canAssignOpenSquares`, and the message). Commit `organizer: game-day side of the workspace`.

---

### Task 3: `BoardView` wiring and legacy deletion

**Files:** `components/BoardView.tsx`; delete `components/AdminPanel.tsx`, `components/OrganizerDashboard.tsx`, `utils/organizerFlow.ts`, `utils/featureFlags.ts`, `src/features/organizer/shell/*`, `src/design/kitchen/OrganizerWorkspaceDemo.tsx` (+ its toggle in `DesignKitchen.tsx`), `tests/organizerShell.test.tsx`, `tests/organizerFlow.test.ts`, `tests/featureFlags.test.ts`; update `.env.example`, `.env.production` (remove `VITE_GRIDONE_ORGANIZER_V2`), `tests/productionCopy.test.ts` (file list → workspace tree + gameday + `ManualScoringPanel`), `tests/pricingCopyConsistency.test.ts` (payout-surface list → `OrganizerWorkspace.tsx`, `PayoutRulesCard.tsx`, `hooks/usePoolData.ts`).

In `BoardView.tsx`: replace the `isCommissionerMode` block with `<OrganizerWorkspace …/>` passing the existing props plus `revision`, `entryMeta`/`onEntryMetaChange` from `useContestEntries(activePoolId)`, `billing` (fetch `/api/billing/status` once per `activePoolId` with the bearer token; null on failure), `onCheckout={(tier, org) => createCheckoutSession(activePoolId, tier, org)}` from `services/stripe`, `onScheduledGameChange` (copy `handleGameChange` from `CreateContest`: sets `gameExternalId`, `kickoffAt`, abbreviations, names, `dates`), `onShare`. Remove `envFlagConfig`, `resolveFeatureFlags`, `organizerV2Enabled`, `adminStartTab`, `isPreviewMode` plumbing that only served the legacy panel (keep `renderPreview`, the `gridone_preview_mode` cleanup, and everything viewer/data related). `OrganizerWorkspace`'s wrapper replaces the `oa-root` div.
- [ ] Verify: `npx tsc --noEmit`; unit suite; `npm run build`; `grep -rn "AdminPanel\|OrganizerDashboard\|organizerFlow\|featureFlags\|organizer_v2\|VITE_GRIDONE_ORGANIZER_V2\|organizer/shell" --include='*.ts' --include='*.tsx' --include='*.json' . | grep -vE "node_modules|dist|docs/|eventSchema|instrumentationSchema"` returns only Playwright files (fixed in Task 6). Commit `organizer: BoardView renders the workspace; delete AdminPanel, legacy shell, and the last feature flag`.

---

### Task 4: Dashboard

**Files:** `pages/Dashboard.tsx` rewrite; `App.tsx` (`/dashboard` without `Layout`); Test `tests/dashboard.test.tsx` (mock `services/supabase` and `hooks/usePoolData`).

Design: `<Base kind="cream">`, `main aria-label="Your boards"`, header row: `Eyebrow` `Organizer`, serif h1 `Your boards`, billing line as `CapsuleTag` (`{used} of {allowance} published · {tier}`), primary link `New board` → `/create`, ghost `Log out`. Board list as Glass rows (`role="list"`): title (serif 22px, link to `/boards/:id`), `{leftAbbr} at {topAbbr}`, `Published`/`Draft` tag (from `board_activations.length > 0` or `published_at`), mini rings (`IslandRings` needs board data: extend the select to `id, title, created_at, settings, board_data, published_at, board_activations(id)` and compute filled from `board_data.squares`; paid ring omitted on the dashboard), a quiet `Delete` with the existing two-step confirm (`Confirm?` within 3s, same `aria-label`s). Empty state: Glass with `No boards yet.` and the `New board` link. Guest-draft banner and the migrated toast keep their strings and behavior; loading state text `Loading your boards…`; load error alert with `Retry`.
- [ ] Tests: renders rows from mocked contests; published tag; delete two-step; empty state; billing line. Commit `dashboard: cream base with board rows`.

---

### Task 5: Create page

**Files:** `pages/CreateContest.tsx` rewrite; `App.tsx` (`/create` without `Layout`); Test `tests/createContest.test.tsx`; update `tests/createContestScanFallback.test.tsx` selectors.

Design: one screen. `Eyebrow` `New board`, serif h1 `Name your board`, `CapsuleInput` labelled `Board name` (maxLength 100, autofocus target), then h2 `Pick the game` with `ScheduledGamePicker` (scope/limit/accessToken logic and the `Completed-game score test` banner exactly as today), then a primary `Create board` (disabled until name and game; posts `{ scoreTestMode, game: {...game, title}, board: EMPTY_BOARD }` to `/api/pools` exactly as today) and, below a hairline, `Import a paper board photo` (file input; on scan success the same POST with the scanned board; on scan failure the alert text `Image processed, but grid scan failed: …` and `Create board` stays enabled with the blank board — this is what `createContestScanFallback.test.tsx` checks; read it and keep its assertions, adjusting only selectors). Unauthenticated: same sessionStorage stash and `/login?mode=signup&returnTo=…` redirect. Success: `navigate(`/boards/${poolId}`)` (no interstitial). Error alert with `Retry` when the message includes `overloaded`.
- [ ] Tests: disabled until both fields; POST body; navigation on success; scan-fallback test green. Commit `create: one-screen board creation`.

---

### Task 6: Playwright

**Files:** create `playwright-tests/organizer.spec.ts`; delete `organizer-v2.spec.ts` and `feature-flags-off.spec.ts` (keep its one auth-redirect assertion by moving it into `organizer.spec.ts`: `/create` unauthenticated → `/login`); rewrite the organizer tests in `user-workflows.spec.ts` (create from a scheduled event: fill `Board name`, check the `DAL … at … WAS` radio, click `Create board`, expect URL `/boards/…` and the workspace `main[aria-label$="workspace"]`; draft preview: island `Preview` → `dialog` named `Private preview — sharing is off` containing the viewer `region`; flush-before-publish: edit the title, `Preview`, `Review and publish`, `Publish viewer link`, assert the mocked publish request carried the latest title after the PUT); rewrite `scheduled-game-picker.spec.ts` for one screen (no `Continue`; `Create board` disabled until a game is checked; keyboard selection; scoreTest banner); un-skip the three organizer `test.fixme`s in `accessibility-contract.spec.ts` with real assertions (advisories vs blockers in `ReconcileCard`; publish `dialog` named `Publish viewer link` with summary rows and focus on `Cancel`; conflict `alert` with `Reload latest board` disabling `Preview`), and update the existing organizer draw test to the new names (`Draw numbers`, group `… Draw anyway?`, `Keep assigning`, `Draw with N OPEN`).
- [ ] Run: `npx playwright test playwright-tests/organizer.spec.ts playwright-tests/user-workflows.spec.ts playwright-tests/scheduled-game-picker.spec.ts playwright-tests/accessibility-contract.spec.ts playwright-tests/smoke.spec.ts --project=chromium`. The organizer NFL-event creation test previously needed the functions server; keep the route mocks the existing spec installs (`installOrganizerBoard`) and add mocks for `/api/pools` POST, `/api/billing/status`, and `/api/nfl/games` where the spec hits them so the suite is self-contained. Commit `organizer: playwright contract for the workspace`.

---

### Task 7: Gate (controller)

- Browser: `/dashboard`, `/create`, and the workspace on a mocked board are exercised by Playwright; additionally open `/design-kitchen` to confirm the demo toggle is gone and `/demo` still renders.
- `npx tsc --noEmit`, unit, build, design lint; log stage 5b in `docs/REFACTOR_LOG.md`; final whole-branch review; merge.
