# GridOne Phone-First Viewer Hierarchy

**Status:** Product, design, and release authority for the public viewer
**Implementation:** `src/features/viewer/`, composed by `shell/ViewerShell.tsx`
**Host:** `components/BoardView.tsx` at `/b/:shareCode`, `/demo`, and `/boards/:boardId`
**Browser evidence:** `playwright-tests/viewer.spec.ts`, `playwright-tests/accessibility-contract.spec.ts`

## Product job

A viewer arrives from a text message, on a phone, mid-game, with no account and no instructions. Within the first viewport they must know which board this is, what the score is and how much to trust it, and how to find their own squares. Everything else waits.

## Governing principles

- **Answer before ornament.** Identity, score, authority, `Find my squares`.
- **No "me" language before selection.** Until a viewer picks a name, the product has no idea who they are and says nothing that implies otherwise.
- **Say what the score is worth.** Automatic, manual, refreshing, stale, offline, rejected, or Final — always named, never implied by styling alone.
- **Arithmetic, not prediction.** Scenarios are the outcomes of standard NFL scoring plays. Never odds, advice, or probability.
- **Payouts do not outrank identity.** Rules and payout descriptions live behind disclosure and never displace `Find my squares`.

## Composition

`ViewerShell` renders on a `<Base kind="dark">` ground: a `ViewerIsland` pinned above, then a `main` named `{board title} viewer` in two columns — the first column is the phone stack, the second is the board.

| Order | Component | Accessible name |
|---|---|---|
| — | `shell/ViewerIsland` | island `Score` — collapsed score chyron, always present |
| 1 | `score/ScoreInstrument` | region `Score`; carries the `h1` (an `h2` in organizer preview) |
| 2 | `identity/FindSquaresEntry` | region `Find squares` |
| 3 | `personal/YourSquaresSummary` | region `{name} square summary`, only once a name is selected |
| 4 | `Pending confirmation` block | heading `Pending confirmation`, only when milestones await confirmation |
| 5 | `details/BoardDetailsDisclosure` `FinalRecord` | heading `Final record`, only when the game is `post` |
| 6 | `scenarios/ScenarioDisclosure` | region `Next scores that match your squares` |
| 7 | `notifications/WinnerEmailDisclosure` | form `winner email` |
| — | `board/ViewerBoardGrid` | grid `Football squares board, Top team {away}, Side team {home}`, in the board column under heading `Board` |
| — | `details/BoardDetailsDisclosure` | `Board details` disclosure, after the grid |

The first column carries `data-testid="viewer-first-viewport"`, and the accessibility spec asserts that on a 390×844 phone the `Find my squares` button lands inside it.

## Viewer modes

### Unpersonalized

No name selected. The stack is score, then `Find my squares`, then scenarios, then the board. There is no `Your squares` region, no personal result, and no winner-email form. `ScenarioDisclosure` shows `What score changes the next result?` for the board as a whole.

### Personalized

A name is selected through the `Find my squares` dialog. `YourSquaresSummary` appears directly under `FindSquaresEntry` and shows:

- the count (`1 square`, `{n} squares`),
- each coordinate as `{away team} column {digit} × {home team} row {digit}`,
- `View on board top {n} side {n}` per square, which centers the grid without stealing focus first,
- the current result — `This square matches the current result.` / `Current result: none of the selected squares match now.`,
- and, when nothing upcoming matches, `None of the next scores listed here match this square.`

`FindSquaresEntry` then shows `Selected name` with `Choose another name` and `Clear`. `WinnerEmailDisclosure` (`Get winner emails`) appears **after** the personal answer, never before it.

### Final record

When `live.state === 'post'`, the `Final record` block is promoted into the first column above scenarios, and next-score scenarios are suppressed entirely — no `What score changes the next result?` heading, no `Safety +2` / `Field goal +3` / `Touchdown +6` list.

## Score authority and freshness

`score/viewerScoreModel.ts` is the only place these labels are decided. `ScoreInstrument` renders them in a `role="status"` `aria-live="polite"` region, always alongside the polling disclosure **`Score updates about every minute`**.

| Condition | Label | Detail |
|---|---|---|
| Manual | `Manual score` | `Entered by the organizer` |
| Refreshing | `Refreshing` | `{source} · last known score shown` |
| Offline | `Offline · last known` | `{source}` |
| Stale | `Stale · last known` | `{source}` |
| Rejected | `Source rejected` | `Organizer review needed` |

Any stale-family state prefixes the timestamp line with `Last known · `. When no timestamp is available the line reads `Checked time unavailable`. Before kickoff the instrument reads `Waiting for score`.

## Scenario progressive disclosure

`ScenarioDisclosure` never shows an inert list.

- **Unpublished:** `Publish this board to show live scenarios.`
- **Pregame or no score:** `Scenarios appear after kickoff.`
- **Live, no identity:** `What score changes the next result?` with the standard outcomes and the square each would make the current-quarter winner.
- **Live, identity selected:** matching scenarios first under `Next scores that match your squares`; when none match, `None of the next scores listed here match your squares right now.` Everything else stays behind `All possible next scores`.
- **Stale or offline:** the same content with `Using last-known score until scoring reconnects.` stated locally.
- **Final:** nothing.

## Exact grid contract

`ViewerBoardGrid` is a real `role="grid"` named `Football squares board, Top team {away}, Side team {home}` — a precision instrument in a controlled viewport, not a page-width table. Column and row headers name the team and digit (`{team} top digit {n}`, `{team} side digit {n}`).

- **One tab stop.** Exactly one `gridcell` is in the page tab sequence at a time; `Tab` enters at the selected or first meaningful cell.
- **Arrow keys** move one cell. `Home` / `End` move within the row.
- **Cell names** carry assignment state, coordinate, and both digits: `Ann, coordinate row 1 column 1, top digit 0, side digit 0`, or `OPEN, coordinate row 1 column 2, top digit 1, side digit 0`.
- **Controls** live in a group named `Board controls`: `Zoom in`, `Zoom out`, `Fit`, `Current zoom`, `Center selected square`, and `Center current result`. Centering moves the viewport on explicit activation only.
- **Axes are sticky.** Top and side digits stay oriented while the board pans.
- **State is never color alone.** The current result is marked `NOW`; open squares read `OPEN`; resolved winners and corrections carry text.
- The grid is read-only and never implies editability.

## Board details and payouts

`BoardDetailsDisclosure` sits **after** the grid: `Board details` (`Teams`, `Digits`, `Squares assigned`), `Payouts`, and `Board rules`, with `Top axis and side axis use organizer-published digits.` Where a payout is not published the viewer is pointed to `see board rules`. This block never rises above `Find my squares`.

`FinalRecord` lists resolved milestones — `Halftime`, `Final`, and the rest — with `Open square` for an unassigned result and `No resolved winner records have been published yet.` when there are none.

## Find my squares

`components/board/FindSquaresModal.tsx` opens the `Sheet` titled **`Find my squares`** (`aria-modal="true"`).

- Initial focus lands on the `Name used on board` field.
- Focus is contained; `Tab` from the last name in `browse-name-list` returns to `Close`.
- `Escape` closes and returns focus to the trigger.
- The browse list offers every public label so a viewer who cannot recall the exact spelling can pick.
- Selection is durable across reloads, so the phone stays personalized for the rest of the game.

## State-specific hierarchy

| State | Behavior |
|---|---|
| Loading | Never renders stale data as current. |
| Invalid, unpublished, or deleted link | Never renders a plausible empty board. |
| Published but empty | `This board has no assignments yet.` in place of the grid. |
| Pregame | Identity and board are shown; `Waiting for score`; no scenarios. |
| Refreshing / stale / offline / rejected | Last-known score stays visible with its label, timestamp, and the polling disclosure. |
| Manual | `Manual score · Entered by the organizer`. |
| Pending milestone | `Pending confirmation`, listing `{milestone} · {top}-{side} · digits {top}/{side}`. |
| Final | `Final record` promoted; scenarios suppressed. |

## Fixed-axis guard

The viewer renders one fixed set of 0–9 digits per axis for all quarters. Legacy dynamic boards are not supported and must not be silently flattened.

## Architecture seams

Every rule above is decided in a pure model and rendered by a thin component:

- `score/viewerScoreModel.ts` — authority, freshness, polling text.
- `identity/viewerIdentityModel.ts` — name matching and durable selection.
- `scenarios/scenarioModel.ts` — the +2/+3/+6/+7/+8 outcomes, `playersForDigits`, `quarterForLive`.
- `personal/YourSquaresSummary` — reads from the board and the score model, holds no fetching.
- `milestones/milestoneViewModel.ts` — pending, resolved, corrected, OPEN.
- `board/boardGridModel.ts` — cell names, coordinates, focus and selection state.

Data arrives from `hooks/usePoolData`, `hooks/useContestEntries`, and `hooks/useLiveScoring`; `ViewerShell` takes it as props and fetches nothing itself.

## Acceptance checks

- **390×844 unpersonalized:** board title, score, authority label, the polling disclosure, and the `Find my squares` button all above 844px.
- **Personalized order:** `{name} square summary` renders before the `winner email` form.
- **Stale copy:** `Using the last-known score checked … until scoring reconnects.` appears in the first viewport.
- **Final:** `Final record` visible; zero `What score changes the next result?` headings; zero scenario rows.
- **Grid keyboard:** exactly one tabbable `gridcell`; arrow keys and `Home`/`End` move focus; names carry coordinate and digits.
- **Dialog:** focus starts in `Name used on board`, is contained, and returns to the trigger on close.
- **320 and 390 widths:** no page-level horizontal overflow outside the board viewport.
- **Reduced motion:** all content and state remain reachable.
