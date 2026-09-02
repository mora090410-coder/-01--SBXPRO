# GridOne Refactor Log

Append one verified entry per implementation/refactor slice. Do not rewrite prior entries except to correct factual errors.

## 2026-08-21 — Slice 1 safety rails and deterministic design audit

- **Status:** Complete and verified. Root `AGENTS.md` was written only after Anthony temporarily disabled the protected-instruction-file gate, restarted Hermes, and then restored the gate to `true`.
- **Approval:** Anthony explicitly approved Slice 1, including exact `@google/design.md@0.4.0` and `package-lock.json` changes.
- **Behavior intended to remain identical:** No production component, route, API, schema, data, configuration, or deployment behavior changed. This slice adds repository instructions, deterministic audit tooling, tests, and scripts only.
- **Files touched:**
  - `tests/designAudit.test.ts`
  - `scripts/design-audit.mjs`
  - `docs/REFACTOR_LOG.md`
  - `package.json`
  - `package-lock.json`
  - `AGENTS.md`
- **Protected user work:** `.impeccable/`, `docs/gap-remediation-plan-2026-08-01.md`, and both untracked `docs/marketing/` files were not modified, moved, staged, or deleted.

### RED → GREEN evidence

The isolated worker generated the first test/script draft but could not execute commands. Anton did not claim that as TDD evidence.

1. **Recovery RED:** reset `scripts/design-audit.mjs` to an empty module, then ran:
   - `npm run test:unit -- tests/designAudit.test.ts`
   - Result: exit 1; 6/6 tests failed because `auditFiles` was missing.
2. **Recovery GREEN:** restored the minimal audit implementation and reran the focused command.
   - Result: exit 0; 6/6 passed.
3. **False-positive RED:** added characterization tests for canonical GridOne radius variables and comment text.
   - `npm run test:unit -- tests/designAudit.test.ts`
   - Result: exit 1; exactly 2 new tests failed while the prior 6 passed.
4. **False-positive GREEN:** preserved comment line positions while stripping comment content and corrected canonical radius matching.
   - Result: exit 0; 8/8 focused tests passed.
5. **Quality-review RED/GREEN:** independent review identified outside-root reads, symlink traversal, string-literal comment stripping, Tailwind variant misses, and unstable explicit-file ordering. Regression tests were added first; the audit now rejects escaped paths, skips symlinks, preserves comment-like content inside quoted/template strings and URLs, detects variant chains with precise utility locations, normalizes file errors, and sorts deterministic inputs.
   - Intermediate focused result: exit 0; 13/13 tests passed.
6. **Re-review RED/GREEN:** re-review identified prefixed arbitrary Tailwind variants and unquoted CSS URLs as remaining false negatives. Two regression tests failed first; variant-prefix parsing and URL-scheme handling were corrected.
   - Final focused result: exit 0; 15/15 tests passed.

### Dependency and scripts

- Installed exact reviewed dev dependency: `@google/design.md@0.4.0` with `--save-exact`.
- Added:
  - `npm run design:audit` → `node scripts/design-audit.mjs`
  - `npm run design:lint` → locked local `designmd lint DESIGN.md`
- `npm run design:lint`: exit 0; 0 errors, 0 warnings, 1 informational token summary.
- `npm audit --audit-level=moderate`: exit 1; 14 advisories (1 low, 1 moderate, 11 high, 1 critical). `npm audit --omit=dev --json` classifies 2 high advisories as production dependency findings; the remaining 12, including the critical Vitest advisory, are dev/tooling findings. No `npm audit fix` or unrelated package upgrade was run. Remediation requires a separate reviewed slice.

### Verification gates

- `npm run test:unit -- tests/designAudit.test.ts`: **15/15 passed**.
- `npm run test:unit`: **51 files, 322 tests passed**.
- `npm run build`: **passed**; TypeScript and Vite production build completed.
- Rendered QA: not applicable; no product UI changed.

### Deterministic repository audit baseline

`npm run design:audit` exits 1 as intended while baseline violations remain. After false-positive cleanup it reports **75 findings**:

- By rule:
  - `raw-visual-literal`: 45
  - `framework-default-color`: 11
  - `gradient-blur-glow`: 9
  - `forbidden-glass-glow-alias`: 7
  - `arbitrary-shadow-radius`: 3
- By file:
  - `components/filmLanding.css`: 47
  - `src/index.css`: 10
  - `utils/boardImage.ts`: 5
  - `components/seo/ArticleFAQ.tsx`: 3
  - `components/AdminPanel.tsx`: 2
  - `pages/RunYourPoolAlternative.tsx`: 2
  - `components/layout/Layout.tsx`: 1
  - `pages/ArticlesHub.tsx`: 1
  - `pages/DigitalFootballSquaresBoardVsPaper.tsx`: 1
  - `pages/FootballSquaresFundraiser.tsx`: 1
  - `pages/HowToRunSquares.tsx`: 1
  - `pages/OfficeSuperBowlSquares.tsx`: 1

These are recorded debt, not blanket-allowlisted. Production-source remediation is outside Slice 1.

### Rollback

Remove `tests/designAudit.test.ts`, `scripts/design-audit.mjs`, the two package scripts, the exact `@google/design.md` dev dependency/lockfile entries, and this log entry. No domain state is affected.

## 2026-08-22 — Slice 2 accessibility automation

- **Status:** Automation contract established, not release-complete. Current update corrects the SPEC gap by enumerating every required representative state in `playwright-tests/accessibility-contract.spec.ts` as either an active route/API-mocked browser contract or a precise owned `test.fixme`.
- **Files touched:** `playwright.config.ts` from the original Slice 2 pass; current gap-correction files were limited to `playwright-tests/accessibility-contract.spec.ts` and `docs/REFACTOR_LOG.md`.
- **Behavior intended to remain identical:** No production UI, package files, schemas, feature flags, protected untracked files, git state, external systems, commits, pushes, deployments, or credentials were modified.
- **Coverage established:** signed-out login/signup errors; empty/partial organizer Fill; Draw open-square confirmation; viewer unpersonalized and personalized modes; stale/offline/manual score authority; pending, corrected, OPEN, and Final viewer records; Find my squares dialog focus trap/Escape/return; board cell naming plus roving-focus contract; 320/390 phone overflow excluding the contained board viewport; reduced-motion content preservation; reliable forced-colors boundary/focus checks; homepage semantic/touch contracts.
- **Owned fixmes remaining until slices:** Slice 6 viewer owns future C1 first-viewport hierarchy semantics where legacy viewer ordering is insufficient; Slice 7 viewer owns exact-grid roving focus and cell-state semantics; Slice 10 organizer owns Reconcile advisories, Preview and Go Live dialogs, and save conflict/error blocking semantics; Slice 12 homepage owns product H1 and signed-out Sign in touch geometry. Each fixme states expected semantics and removal condition. These are not vague placeholders and must not be counted as release conformance.
- **Prior evidence:** original Slice 2 run completed `npx playwright test playwright-tests/accessibility-contract.spec.ts` with **22 passed and 14 skipped** across four projects after isolating verified owned gaps; `npm run test:unit` passed **51 files / 322 tests**; `npm run build` passed; `npm run design:lint` returned 0 errors and 0 warnings.
- **Current verification:** first expanded Chromium run exposed one stale organizer selector; after correcting it to the already-focused assignment state, Chromium passed **12 active / 7 owned skips**. Final four-project run passed **46 active / 30 skips**. The 30 skips are owned future-surface contracts repeated across projects plus the documented WebKit forced-colors compatibility skip; none count as release conformance. Existing unit/build/design-lint gates remain green from this slice.
- **Rollback:** revert the current `playwright-tests/accessibility-contract.spec.ts` and this log entry update. To roll back original Slice 2 entirely, remove `playwright-tests/accessibility-contract.spec.ts`, remove `phone-chromium`/`phone-webkit` projects from `playwright.config.ts`, and remove this log entry.

## 2026-08-22 — Dependency advisory remediation

- **Status:** Complete with one accepted low-severity dev-only residual advisory.
- **Files touched:** `package.json`, `package-lock.json`, `docs/REFACTOR_LOG.md`.
- **Behavior intended to remain identical:** no React, Supabase, Stripe, schema, route contract, or product-source behavior changed; upgrades stay within existing package major versions.
- **Exact direct upgrades:** `react-router-dom@7.18.2`, `@cloudflare/workers-types@5.20260822.1`, `postcss@8.5.26`, `vite@6.4.3`, `vitest@4.1.11`, `wrangler@4.125.0`.
- **Exact transitive overrides:** `picomatch@4.0.4`, `rollup@4.59.0`.
- **Blocked attempt:** initial Wrangler upgrade refused the existing Workers Types v4 peer dependency. No force/legacy-peer bypass was used; the compatible exact v5 peer was installed instead.
- **Audit result:** advisories reduced from 14 total (including 11 high and 1 critical) to one low `@babel/core` dev-only advisory. `npm audit --omit=dev --json` reports **0 production advisories**. No compatible patched Babel 7 exists; Babel 8 would require a separate major toolchain migration.
- **Verification:** `npm run design:lint` passed; `npm run test:unit` passed **51 files / 322 tests** under Vitest 4.1.11; `npm run build` passed under Vite 6.4.3; Chromium accessibility contract passed **12 active / 7 owned skips**.
- **Rollback:** revert the package and lockfile commit. No domain state is affected.

## 2026-08-22 — Slice 3 reversible feature flags

- **Status:** Complete and verified. The pure resolver and route-off smoke are not yet connected to production consumers; every flag therefore remains off by default.
- **Files touched:**
  - `utils/featureFlags.ts`
  - `tests/featureFlags.test.ts`
  - `playwright-tests/feature-flags-off.spec.ts`
  - `docs/REFACTOR_LOG.md`
- **Behavior intended to remain identical:** no production consumers, routes, components, package files, schema, environment/config files, server functions, external systems, git staging, commits, pushes, deployments, or production flags were modified.
- **Contract added:** exactly `viewer_v2`, `organizer_v2`, and `homepage_v2`; absent/malformed config defaults off; only explicit boolean values and `true`/`false` strings parse; account/board allowlists are capped at 100 entries with 128-character identifiers; support/telemetry variants are stable `flag:on|off` labels and exclude account/board identifiers; query parameters may only enable flags for `read_only_preview` and cannot enable production mutation paths.
- **Route-off smoke added:** `playwright-tests/feature-flags-off.spec.ts` covers `/`, `/demo`, `/b/:shareCode`, `/boards/:boardId`, `/create`, and `/dashboard` with all v2 flags off, asserting legacy text and no v2 feature/variant markers. It also asserts query parameters do not enable the unauthenticated `/create` mutation path.
- **RED/GREEN evidence:** focused unit tests passed **7/7**. The first Chromium route smoke exposed two fixture assumptions (split homepage heading text and an unstubbed public-board API); after correcting those fixtures, route smoke passed **7/7**.
- **Review hardening:** review identified malformed nested config fallback, inherited/exotic object acceptance, mutation-route query downgrades, and duplicate query ambiguity. Added failing assertions first; resolver now rejects malformed/exotic config, ignores all mutation-route query overrides, and ignores ambiguous duplicate preview parameters. Focused suite remains **7/7** with expanded assertions.
- **Prototype-pollution hardening:** final review found inherited `Object.prototype` flag/cohort/allowlist reads. A failing regression reproduced the crash/enablement path; all known-key reads now require own properties. Focused suite passes **8/8**.
- **Full gates:** `npm run test:unit` passed **52 files / 330 tests**; route-off Chromium smoke passed **7/7**; `npm run build` passed; `npm run design:lint` returned 0 errors and 0 warnings.
- **Rollback:** remove `utils/featureFlags.ts`, `tests/featureFlags.test.ts`, `playwright-tests/feature-flags-off.spec.ts`, and this log entry. No domain state is affected.

## 2026-08-22 — Slice 4 governed primitives

- **Status:** Complete and verified.
- **Files touched:**
  - `components/primitives/ActionButton.tsx`
  - `components/primitives/Field.tsx`
  - `components/primitives/Dialog.tsx`
  - `components/board/FindSquaresModal.tsx`
  - `components/board/ShareModal.tsx`
  - `components/NotificationOptIn.tsx`
  - `tests/primitives.test.tsx`
  - `docs/REFACTOR_LOG.md`
- **Primitives admitted:** `ActionButton`, `Field`, and `Dialog` only.
- **Primitives omitted:** `StatusLabel.tsx` and `Disclosure.tsx`; no current slice substitution had two low-risk concrete consumers without crossing into future C1/B2/A1 feature-surface work.
- **Consumer proof:** `ActionButton` replaces FindSquaresModal submit/close/list/clear actions and ShareModal copy/close actions. `Field` replaces both FindSquaresModal player search and NotificationOptIn viewer email input. `Dialog` replaces FindSquaresModal and ShareModal modal shells.
- **Behavior intended to remain identical:** viewer find-my-squares matching, selection, close/Escape behavior, ShareModal QR/link/copy statuses, and read-only share copy remain unchanged; only primitive shells/actions/field rendering were substituted.
- **TDD evidence:** `tests/primitives.test.tsx` was written first and initially produced TypeScript missing-module diagnostics for the three primitive imports. Primitive implementations followed. Existing `tests/findSquaresModal.test.tsx` already characterizes FindSquaresModal matching behavior before substitution.
- **Static audit evidence available in this runtime:** file search found zero raw hex/RGB/HSL, default framework gray/white color classes, gradient/blur/glow, arbitrary shadow/radius patterns in `components/primitives`. File search confirms only three primitive files exist; `StatusLabel.tsx` and `Disclosure.tsx` do not exist.
- **Review hardening:** review caught a fake consumer ledger, missing Field IDs, caller-overridable busy semantics, ShareModal z-index and mobile-centering loss, ring-to-border drift, and unsafe forwarded-ref casting. Added failing tests first; migrated the second real Field consumer; generated stable IDs; protected busy semantics; preserved consumer layers, placement, and ring treatment; and replaced the ref cast with a safe callback ref.
- **Verification:** focused primitives + FindSquaresModal tests passed **13/13**; full unit suite passed **53 files / 338 tests**; production build passed; design audit stayed at the exact 75-finding baseline so new primitives added zero findings; Chromium phase-5 plus accessibility contracts passed **13 active / 7 owned skips**.
- **Rollback:** remove the three primitive files and `tests/primitives.test.tsx`, revert `FindSquaresModal.tsx`, `ShareModal.tsx`, and `NotificationOptIn.tsx`, and remove this log entry. No domain state is affected.

## 2026-08-22 — Slice 5 C1 viewer domain decomposition

- **Status:** Complete and verified; `viewer_v2` remains off.
- **Files touched:**
  - `features/viewer/score/viewerScoreModel.ts`
  - `features/viewer/identity/viewerIdentityModel.ts`
  - `features/viewer/scenarios/scenarioModel.ts`
  - `features/viewer/milestones/milestoneViewModel.ts`
  - `tests/viewerScoreModel.test.ts`
  - `tests/viewerIdentityModel.test.ts`
  - `tests/scenarioModel.test.ts`
  - `tests/milestoneViewModel.test.ts`
  - `components/GameDayHorizon.tsx`
  - `docs/REFACTOR_LOG.md`
- **Behavior boundary:** `viewer_v2` remains off and no new shell, package, schema, API, env, external-system, git, BoardView, or FindSquaresModal behavior changed. `GameDayHorizon.tsx` preserves hierarchy/copy while consuming extracted score/scenario/milestone computations; the one intentional domain correction is suppressing future-score scenarios after Final, as required by the viewer contract.
- **TDD evidence:** model tests were written before the model files. The first executable state would be RED because all four imports targeted missing files. GREEN implementation now covers score authority labels and minute polling text; durable identity/ambiguity/invalid restore semantics; scenario +2/+3/+6/+7/+8 arithmetic for either team with stale/offline/no-score/final statuses; and OPEN/corrected milestone preservation.
- **Review hardening:** first review found the scenario model extracted but unused while `GameDayHorizon` retained duplicate inline arithmetic. The active viewer now consumes `buildScenarioModel`; duplicate scenario construction was removed, and Final/no-score suppression is active.
- **Verification:** four model suites passed **9/9**; legacy viewer regression suites passed **30/30**; full unit suite passed **57 files / 347 tests**; production build passed; Chromium accessibility contracts passed **12 active / 7 owned skips**; design audit remained at the exact 75-finding baseline.
- **Rollback:** remove the four `features/viewer/**` model files and four matching tests, revert `components/GameDayHorizon.tsx`, and remove this log entry. No domain state is affected.

## 2026-08-22 — Slice 6 C1 viewer shell behind viewer_v2

- **Status:** Complete and verified behind default-off `viewer_v2`; rollback to `GameDayHorizon` is preserved.
- **Files touched:**
  - `features/viewer/shell/ViewerShell.tsx`
  - `features/viewer/score/ScoreInstrument.tsx`
  - `features/viewer/identity/FindSquaresEntry.tsx`
  - `features/viewer/personal/YourSquaresSummary.tsx`
  - `features/viewer/scenarios/ScenarioDisclosure.tsx`
  - `features/viewer/notifications/WinnerEmailDisclosure.tsx`
  - `features/viewer/details/BoardDetailsDisclosure.tsx`
  - `tests/viewerShell.test.tsx`
  - `playwright-tests/viewer-v2.spec.ts`
  - `components/BoardView.tsx`
  - `docs/REFACTOR_LOG.md`
- **Behavior boundary:** `viewer_v2` defaults off through `utils/featureFlags.ts`; `BoardView` resolves it from environment config and only permits query overrides for read-only viewer/demo routes. Production mutation routes pass `routeIntent: 'production_mutation'`. `GameDayHorizon` remains the fallback.
- **Flag safety:** no production-exported resolver override exists. Tests enable the shell only through the permitted read-only viewer/demo query path; mutation routes use `production_mutation` and ignore all query overrides.
- **C1 shell coverage:** phone-first score/title/matchup/current result/authority/freshness/polling/Find my squares; personalized name/count/coordinate rows and View on board controls before winner email; pregame scenario suppression; live unselected scenarios collapsed into disclosure; selected matching outcomes first; arithmetic disclaimer; stale/offline last-known timestamp; Final record with no scenarios; winner email only when published services and durable participant identity are present.
- **Review hardening:** duplicate display names now fail closed for durable participant email binding; personalized scenarios use real team abbreviations; randomized-axis focus coordinates are regression-tested; OPEN matching trims whitespace; the production-exported test resolver seam was removed; and mutation-query denial is reverified against the committed flag resolver.
- **RED evidence:** `tests/viewerShell.test.tsx` was written before implementation; the write-time TypeScript diagnostic reported missing `../features/viewer/shell/ViewerShell`.
- **GREEN evidence:** focused viewer shell + flag tests passed **15/15**; full unit suite passed **58 files / 354 tests**; production build passed; Chromium viewer-v2 plus route-off Playwright passed **8/8**; design audit remained at the exact 75-finding baseline. Three ambiguous Testing Library selectors were corrected without changing product code after each rendered state proved the intended duplicate text.
- **Rollback:** remove the seven new viewer shell component files, remove the two new tests, revert `components/BoardView.tsx`, and remove this log entry. No package, schema, API, server, environment file, deployment, or git state is affected.

## 2026-08-22 — Slice 7 exact viewer grid behind viewer_v2

- **Status:** Complete and verified behind the existing `viewer_v2` shell.
- **Files touched:**
  - `features/viewer/board/boardGridModel.ts`
  - `features/viewer/board/ViewerBoardGrid.tsx`
  - `features/viewer/shell/ViewerShell.tsx`
  - `tests/boardGridModel.test.ts`
  - `tests/viewerBoardGrid.test.tsx`
  - `playwright-tests/viewer-v2.spec.ts`
  - `playwright-tests/accessibility-contract.spec.ts`
  - `docs/REFACTOR_LOG.md`
- **Behavior boundary:** `components/BoardGrid.tsx` was not modified. Its dynamic quarter selector/auto-quarter behavior is untouched. The new viewer board is feature-local under `features/viewer/board` and is only consumed by the existing `viewer_v2` shell.
- **Contract implemented:** exact 10x10 viewer grid using Slice 5 `getAxisForQuarter`; randomized axes remain source-of-truth from the board; top axis is labeled/sticky as Top team and side axis as Side team; one-tab-stop roving `role=grid` cells support Arrow keys, Home, End, Ctrl+Home, and Ctrl+End; controls Zoom out, Center current result, Zoom in, Fit board, Find, and Center selected plus a live Current zoom status all carry explicit 44px minimum geometry; cell names include assignment/OPEN, coordinate row/column, top digit, side digit, current result, milestone/pending/resolved/corrected semantics; selected/current/resolved/OPEN/correction states are exposed through distinct ARIA/data attributes and visual token classes.
- **TDD evidence:** tests were written before implementation. RED evidence available in this sandbox: initial write produced missing-module diagnostics for `../features/viewer/board/ViewerBoardGrid`; `boardGridModel` import targeted a then-missing file. GREEN implementation was then added and wired into `ViewerShell`.
- **Playwright contract:** `viewer-v2.spec.ts` now exercises the exact grid path; `accessibility-contract.spec.ts` removed the Slice 7 board-keyboard `fixme` and activates the one-tab-stop/cell-semantics test on `/b/ABCDEFGH?viewer_v2=true`.
- **Review hardening:** focus navigation derives from the actually focused gridcell rather than potentially stale React state; ARIA counts/indexes now match the rendered header/data structure; zoom changes layout dimensions inside the scroll viewport; current-result and selected-player centering are separate actions; sticky axis columns have deterministic widths/offsets; selected/current/resolved/OPEN/corrected visuals remain distinct in combined states; internal correction reasons are not exposed in public cell names. Unit and Playwright harnesses dispatch keys from the focused cell and scope controls to the complete board instrument.
- **Verification:** focused model/grid suites passed **8/8**; full unit suite passed **60 files / 362 tests**; Chromium viewer-v2 plus accessibility contracts passed **15 active / 6 owned skips** with the board keyboard contract active; production build passed; design audit remained at the exact 75-finding baseline.
- **Rollback:** remove the two new viewer board files and two new tests, revert `ViewerShell.tsx`, `playwright-tests/viewer-v2.spec.ts`, `playwright-tests/accessibility-contract.spec.ts`, and this log entry. No package, schema, API, environment, deploy, git, or production data state is affected.

## 2026-08-22 — Slice 8 manual scoring extraction

- **Status:** Complete and verified under the requested extraction seam.
- **Files touched:**
  - `features/organizer/game-day/manualScoringModel.ts`
  - `features/organizer/game-day/ManualScoringPanel.tsx`
  - `tests/manualScoringPanel.test.tsx`
  - `components/AdminPanel.tsx`
  - `docs/REFACTOR_LOG.md`
- **Behavior boundary:** existing `functions/api/pools/[id]/score/manual.ts` was not modified. No package, schema, API payload, flag, environment, external system, deploy, or git state was changed. `AdminPanel.tsx` now delegates only the existing live-scoring/manual-scoring UI rendering to the feature-local panel while retaining its existing state handlers, action messages, fetch payloads, revision/autosave boundaries, and callback ownership.
- **Contract preserved/extracted:** manual authority toggle, latest snapshot seeding, period/state derivation, non-negative quarter-score input, manual score publish action, organizer-entered score copy, deliberate return to automatic scoring, and stale automatic overwrite protections remain on the pre-existing server/model path. The panel preserves existing copy, button labels, disabled/loading behavior, CSS token classes, and handler callback shape.
- **RED evidence:** `tests/manualScoringPanel.test.tsx` was written before implementation; write-time TypeScript diagnostic reported missing `../features/organizer/game-day/ManualScoringPanel`.
- **GREEN evidence:** focused manual scoring model/UI/panel suites passed **16/16**; full unit suite passed **61 files / 365 tests**; production build passed; design audit remained at the exact 75-finding baseline.
- **Rollback:** remove the two new feature files and `tests/manualScoringPanel.test.tsx`, restore the live-scoring JSX and local manual-scoring helpers in `components/AdminPanel.tsx`, and remove this log entry. No domain state is affected.

## 2026-08-22 — Slice 9 organizer lifecycle and draft save models

- **Status:** Complete and verified in feature-local model files under the requested file-surface limit.
- **Files touched:**
  - `features/organizer/lifecycle/organizerLifecycle.ts`
  - `features/organizer/draft/draftSaveModel.ts`
  - `tests/organizerLifecycle.test.ts`
  - `tests/draftSaveModel.test.ts`
  - `docs/REFACTOR_LOG.md`
- **Behavior boundary:** no UI shell, `AdminPanel`, package, schema, API, feature flag, environment, external-system, deploy, or git state was modified. Legacy `utils/organizerFlow.ts` was inspected and left untouched to preserve existing adapter behavior.
- **Contract implemented:** exact phases `Create Draft`, `Fill`, `Reconcile`, `Draw`, `Preview`, `Go Live`, `Game Day`, `Final Record`; exact save states `clean`, `dirty`, `saving`, `save_failed`, `conflicted`, `recovered`; duplicate/ambiguous public identity is a hard blocker; unpaid/unknown and seller gaps are advisories; open-square acknowledgement is required; publish fails closed for dirty/saving/save_failed/conflicted saves; Go Live is modeled as one-time; Game Day persists until final durable resolution; malformed board/save input and impossible transitions fail closed; public snapshots expose public labels/OPEN only and omit payment, seller, contact, participant id, and notes.
- **RED evidence:** both model test files were written before implementation. Write-time TypeScript diagnostics reported missing imports for `../features/organizer/lifecycle/organizerLifecycle` and `../features/organizer/draft/draftSaveModel`.
- **Review hardening:** malformed revisions and malformed local revisions force `save_failed`; remote acknowledgements/recovery/conflict resolution require monotonic server revisions relative to local work; only a valid-revision `clean` state is publishable; malformed or partial committed axes cannot enter Draw; Preview cannot skip Go Live; public scheduled-game snapshots whitelist and clone public fields instead of copying private/internal metadata.
- **GREEN evidence:** lifecycle/draft/legacy adapter suites passed **19/19**; full unit suite passed **63 files / 376 tests**; production build passed; design audit remained at the exact 75-finding baseline.
- **Rollback:** remove the two new feature model files, the two new test files, and this log entry. No domain state is affected.

## 2026-08-22 — Slice 10 B2 organizer shell behind organizer_v2

- **Status:** Complete and verified behind default-off `organizer_v2`; AdminPanel remains rollback.
- **Files touched:**
  - `features/organizer/shell/OrganizerShell.tsx`
  - `features/organizer/shell/TaskHeader.tsx`
  - `features/organizer/shell/ProgressDisclosure.tsx`
  - `features/organizer/shell/AssignmentWorkspace.tsx`
  - `features/organizer/shell/ReconcileChecklist.tsx`
  - `features/organizer/shell/DrawWorkspace.tsx`
  - `features/organizer/shell/ViewerPreviewWorkspace.tsx`
  - `features/organizer/shell/PublishReviewDialog.tsx`
  - `features/organizer/shell/GameDayControls.tsx`
  - `features/organizer/shell/CorrectionFlow.tsx`
  - `tests/organizerShell.test.tsx`
  - `playwright-tests/organizer-v2.spec.ts`
  - `components/BoardView.tsx`
  - `docs/REFACTOR_LOG.md`
- **Behavior boundary:** `AdminPanel` remains intact as rollback. No package, schema, API, server, env-file, deployment, git, or commit action was performed. `BoardView` still selects `OrganizerShell` only in owner commissioner mode when resolved `organizer_v2` is true; production mutation query overrides remain ignored by the existing feature-flag resolver.
- **Review correction:** removed the Slice 10 `Math.random` draw and reused the existing `secureShuffleDigits` durable browser-crypto draw path; shell lifecycle input no longer synthesizes participant IDs and fails closed through the existing lifecycle ambiguity blocker when private participant metadata is unavailable; draw/progression/publish are blocked by lifecycle and save blockers; publish rechecks at click, disables while pending/blocked, surfaces errors, and closes only on success; draft board state syncs on prop/revision changes without clobbering dirty local state; decorative manual-authority button was deleted; Open viewer and Reload latest board now require real callbacks from `BoardView`.
- **Server-backed completion:** payout editing, late OPEN-square assignment before kickoff, manual score enable/save/return-auto, audited milestone correction, and durable Final Record are wired through extracted feature-local services or existing BoardView callbacks. No decorative mutation controls remain.
- **Coverage added/updated:** unit coverage for conflict/reload, lifecycle draw blockers, private-metadata fail-closed behavior, draft sync, publish payload/pending/error/disabled/close-on-success, focus on the publish dialog, and absence of fake manual buttons; browser coverage now requires explicit `VITE_GRIDONE_ORGANIZER_V2=true` process env rather than a query parameter and checks owner shell phone overflow.
- **Verification:** organizer/server-backed contracts passed **35/35**; full unit suite passed **64 files / 389 tests**; env-enabled owner-shell Chromium Playwright passed **2/2** including actual `window.scrollX=0` at 390px; production build passed; design audit remained at the exact 75-finding baseline.
- **Rollback:** revert the listed Slice 10 files to the previous Slice 10 state. No domain state is affected.

## 2026-08-22 — Slice 10 server-backed organizer seams

- **Status:** Complete and verified.
- **Files touched:**
  - `features/organizer/services/game-day/manualScoreService.ts`
  - `features/organizer/services/game-day/publishedOpenSquares.ts`
  - `features/organizer/services/corrections/milestoneCorrectionService.ts`
  - `features/organizer/shell/OrganizerShell.tsx`
  - `features/organizer/shell/GameDayControls.tsx`
  - `features/organizer/shell/AssignmentWorkspace.tsx`
  - `features/organizer/shell/CorrectionFlow.tsx`
  - `components/AdminPanel.tsx`
  - `tests/organizerShell.test.tsx`
  - `docs/REFACTOR_LOG.md`
- **Behavior boundary:** no package, schema, API endpoint, env, deploy, git, or commit changes. Existing `/score/manual`, `/milestones/:milestone/correct`, payout callback, and published OPEN-square callback payload shapes were preserved.
- **RED evidence:** focused organizer shell tests were added/updated first for payout save/reload, late OPEN assignment/reload, manual enable/save/auto return, milestone correction expected revision/reason, and read-only Final Record.
- **GREEN evidence:** focused server-backed organizer contracts passed **35/35**; full unit suite passed **389/389**; env-enabled owner-shell Playwright passed **2/2**; build passed; audit remained at baseline. Phone overflow required shell-level inline-size/paint containment around the intentionally scrollable 640px board; browser verification confirms `document` overflow and `window.scrollX` are zero while `boardScrollWidth > boardClientWidth` remains true. Final review removed the stale optimistic board write after authoritative OPEN-square reload so server state always wins.
- **Rollback:** remove the three service files, restore the previous Slice 10 shell component stubs, restore `AdminPanel` inline service calls if desired, and revert the organizer shell test changes.

## 2026-08-22 — Slice 11 privacy-minimal instrumentation schema/client

- **Status:** Complete and verified in the approved schema/client/test surface.
- **Files touched:**
  - `features/instrumentation/eventSchema.ts`
  - `features/instrumentation/clientEvents.ts`
  - `tests/instrumentationSchema.test.ts`
  - `docs/REFACTOR_LOG.md`
- **Behavior boundary:** no events endpoint, storage, external analytics, Terms/Privacy, UI wiring, package/schema/env/deploy/git, or commit changes. Client delivery is dependency-injected only.
- **RED evidence:** `tests/instrumentationSchema.test.ts` was written first. Write-time TypeScript diagnostics failed on missing imports for `../features/instrumentation/eventSchema` and `../features/instrumentation/clientEvents`.
- **GREEN implementation:** schema permits only the 13 approved coarse event names; rejects unknown events, prohibited fields, unknown fields, missing required fields, and invalid/free-form values; first-ten-board baseline config is targetless, user-data-free, and gated by explicit outreach/analytics approval; client recorder validates before delivery, uses injected async delivery, bounded timeout, deterministic result statuses, and swallows delivery failures.
- **Review hardening:** delivery receives a frozen explicit own-key clone plus `AbortSignal`; timeout aborts the delivery contract, clears its timer, and deterministic tests prove late delivery cannot mutate/send after timeout when the injected transport honors cancellation. Validation uses `Reflect.ownKeys`, rejects symbol/unknown/prohibited keys, requires `name` and every required field as own properties, and reconstructs only validated fields before delivery.
- **GREEN evidence:** focused instrumentation tests passed **7/7**; full unit suite passed **65 files / 396 tests**; production build passed; design audit remained at the exact 75-finding baseline.
- **Rollback:** remove the two instrumentation files, the instrumentation test file, and this log entry. No domain state is affected.

## 2026-08-22 — Slice 12 A1 product-first homepage

- **Status:** Complete and verified in the constrained default-off surface.
- **Files touched:**
  - `features/homepage/HomepageV2.tsx`
  - `features/homepage/HomepageProofArtifact.tsx`
  - `tests/homepageV2.test.tsx`
  - `playwright-tests/homepage-v2.spec.ts`
  - `App.tsx`
  - `index.html`
  - `index.tsx`
  - `tests/pricingCopyConsistency.test.ts`
  - `docs/REFACTOR_LOG.md`
- **Behavior boundary:** root keeps `FilmLanding` by default and selects `HomepageV2` only when resolved `VITE_GRIDONE_HOMEPAGE_V2` is true. Root uses production-mutation route intent so query parameters cannot enable the production homepage. FilmLanding and film CSS remain untouched rollback/optional story surfaces. No package, schema, API, server, env-file, deploy, git, or commit changes.
- **RED evidence:** `tests/homepageV2.test.tsx` was written first and write-time diagnostics failed because `../features/homepage/HomepageV2` did not exist.
- **GREEN implementation:** A1 first viewport contains GridOne identity, exact `Football-squares fundraiser boards`, outcome copy, `Create your free board`, `See a live board`, `First published board free`, and the no-money boundary. Product proof defaults to clearly labeled synthetic B2 organizer artifact and switches in place to a C1 viewer proof adapter using existing viewer shell hierarchy with feature-local fixture data. Canonical 2026 pricing is rendered, optional story is native disclosure/static/skippable, and no GSAP/Lenis/film gate/loader/scroll instruction was added.
- **Review hardening:** `/demo` CTA validity, exact 390×844 and 1280×720 first-viewport geometry, organizer/viewer proof overflow on phone and desktop, static SEO, and no-JavaScript product truth/actions are browser-tested. The global splash loader/dead teardown were removed from the critical path and replaced with a crawlable `<noscript>` product fallback. `HomepageV2` is lazy-isolated into its own 10.62 kB build chunk with a product-truth fallback instead of a loader; viewer proof loads only after its switch.
- **GREEN evidence:** homepage/pricing/static suites passed **15/15**; full unit suite passed **66 files / 402 tests**; non-env query-denial Playwright passed **1/1**; env-enabled desktop/phone homepage Playwright passed **10/10**; production build passed. Initial audit found 16 framework-white/arbitrary-radius violations in the new homepage; all were replaced with governed `broadcast-white` and surface-radius tokens, returning the audit to the exact 75-finding baseline.
- **Rollback:** remove the two homepage feature files and two new test files, restore `App.tsx`, `index.html`, `index.tsx`, and `tests/pricingCopyConsistency.test.ts`, and remove this log entry. No domain state is affected.

## 2026-08-22 — Slice 13 mechanical source migration

- **Status:** Complete and verified as a behavior-free path/import migration.
- **Moves:** `features/` → `src/features/`; `components/primitives/` → `src/components/primitives/` using `git mv`. No route file, API, schema, package, environment, or product behavior changed.
- **Import codemod:** deterministic resolver processed **231** TypeScript/TSX files and rewrote **109** relative imports from resolved old targets to resolved new targets. Four non-import path literals (`vi.mock` and pricing file reads) were corrected after full tests exposed them.
- **Protected files:** existing untracked `.impeccable/`, gap-remediation plan, and marketing documents were not touched or moved.
- **Verification:** TypeScript/Vite production build passed immediately after the move; full unit suite passed **66 files / 402 tests** after correcting the four test-only literals; design audit remained at the exact 75-finding baseline. Old active source directories and runtime/test import references under `features/` and `components/primitives/` are absent; historical planning/log mentions remain intentionally unchanged.
- **Rollback:** revert this single mechanical move commit. No domain state is affected.

## 2026-08-22 — Final integration and independent readiness review

- **Status:** Refactor implementation complete and verified for default-off delivery; not a production rollout or full release certification.
- **Deterministic gates:** unit **66 files / 402 tests**; production build passed; design lint **0 errors / 0 warnings**; design audit stayed at the documented **75-finding baseline**; production dependency audit reported **0 vulnerabilities**; one low-severity dev-only Babel advisory remains.
- **Browser gates:** default-off/accessibility Chromium **21 passed / 6 explicitly owned skips**; `viewer_v2` **2/2**; `organizer_v2` **2/2**; homepage query denial **1/1**; homepage desktop/phone Chromium plus WebKit **15/15**. Numeric and rendered QA confirmed zero page overflow at required phone/desktop states and intentional local board scrolling only.
- **Independent correction:** final review found winner-email disclosure before personalized scenarios. A RED document-order regression reproduced the defect; `WinnerEmailDisclosure` now follows `ScenarioDisclosure`. Focused viewer tests **7/7**, full unit **402/402**, build, and viewer Playwright **2/2** passed after correction.
- **Integration gate:** after OrbStack/Docker was started, `npm run test:integration` passed **9/9 suites** with **56 passed / 1 intentional skip** across 57 PostgreSQL integration tests.
- **Known limits:** code-level v2 defaults remain off, while the approved production build enables all three through explicit configuration; no production analytics storage or manual assistive-technology certification occurred. Existing accessibility fixmes and 75 baseline design findings remain documented debt.
- **Rollback:** disable the relevant v2 flag; legacy FilmLanding, GameDayHorizon, and AdminPanel paths remain available.

## 2026-08-23 — Staged production v2 rollout

- **Approval:** Anthony approved sequential rollout through all three v2 surfaces after the default-off production smoke passed.
- **Stage 1:** `homepage_v2` on, viewer/organizer off — deployment `2b99107b`; production DOM confirmed A1 identity/actions and zero phone page overflow while the viewer stayed legacy.
- **Stage 2:** homepage + `viewer_v2` on, organizer off — deployment `4d94ac3c`; deployment URL and custom-domain extraction confirmed the C1 score/Find My Squares/scenario/exact-grid hierarchy. Headless custom-domain DOM automation was blocked by Cloudflare challenge/background timing, so it was not treated as a passing browser assertion.
- **Stage 3:** all three v2 surfaces on — deployment `3eecf9ca`; Cloudflare marked it Production on `main` at commit `456f8ba`. Deployment/custom-domain A1 and C1 content matched; `/create` preserved signed-out authentication safety. Authenticated organizer production testing remains Anthony's real-account smoke check.
- **Durability:** tracked non-secret `.env.production` now sets the three public Vite rollout flags to `true`; `.env.example` keeps safe `false` examples. An ordinary `npm run build` reproduced the exact stage-3 main asset `index-BBI6uMDR.js`, preventing future Git builds from silently reverting the approved rollout.
- **Rollback:** set one or more values in `.env.production` to `false`, rebuild, and deploy; legacy components remain in the codebase.

## 2026-08-23 — Production copy cleanup

- **Reason:** Anthony found implementation language exposed on the live homepage, including `Optional brand story` and copy about animation runtime/choreography. Roman completed a read-only production-copy audit; Anton reconciled it against product trust contracts.
- **Scope:** rewrote user-visible and screen-reader copy across the A1 homepage/demo, C1 viewer scenarios/email/grid controls, and B2 organizer fill/draw/preview/status/reconcile/game-day/scoring/correction surfaces. Internal labels such as `B2`, `C1`, `proof`, `artifact`, `workspace`, `canonical`, raw blocker enums, revision metadata, and payout-oriented field labels no longer appear to customers.
- **Preserved truth:** exact 2026 pricing, no-money custody/collection/payment boundary, demo/sample disclosure, score source/freshness, OPEN-square semantics, correction visibility, and notification gating remain unchanged.
- **RED:** new `tests/productionCopy.test.ts` failed on the exposed implementation phrases before source edits.
- **GREEN:** production-copy/component suites passed **39/39**; full unit passed **67 files / 404 tests**; PostgreSQL integration passed **9 suites / 56 passed / 1 skip**; homepage query denial **1/1**, homepage Chromium/phone/WebKit **15/15**, viewer **2/2**, organizer **2/2**; build and design lint passed; design audit remained at the documented 75-finding baseline.
- **Rollback:** revert this copy-only commit. No schema, API, pricing, permission, payment, score-authority, or data behavior changed.

## 2026-08-24 — Full-site conversion coherence pass

- **Audit:** Roman reviewed the full public route set and Anton inspected production desktop/phone landing, demo, article hub, signup, checkout recovery, legal, and 404 surfaces. The landing foundation was sound; the main leak was broken promise continuity and missing conversion close, not visual redesign.
- **Homepage:** audience-specific subhead now names youth-sports teams, booster clubs, schools, and community organizers; first viewport adds the no-viewer-account trust point and the full no-money boundary; Organization explains naming/shared dashboard/receipt value; four canonical FAQs handle account, money, payment timing, and edit permissions; a final create/demo CTA plus sign-in/guides/privacy/terms closes the page.
- **First-click path:** signed-out `/create` now opens signup mode and preserves the return URL. Signup repeats first-board-free and no-viewer-account reassurance and uses `Create account and start board`.
- **Demo/content handoff:** demo-only sample notice links to board creation and the homepage. Articles hub removes internal SEO language and adds a product CTA. Five high-intent fundraiser/category articles make `/create` primary. Youth-sports GTM language and unsupported RunYourPool claims/style jargon were replaced with neutral fit-based comparison copy and exact pricing.
- **Recovery/trust:** create-flow copy clarifies recognizable board naming and build-before-publish/free-first-board behavior; checkout ready state always has a next action; 404 adds create/demo recovery; Privacy adds a plain-language data-use introduction; no-JavaScript homepage copy matches the acquisition promise.
- **RED/GREEN:** new `tests/conversionPath.test.ts` and updated redirect/browser assertions failed before implementation, then passed. Full unit **68 files / 410 tests**; PostgreSQL integration **9 suites / 56 passed / 1 skip**; homepage query denial **1/1**, homepage Chromium/phone/WebKit **18/18**, viewer **2/2**, organizer **2/2**; production build and design lint passed; design audit improved from 75 to **74** documented findings. Rendered desktop/390px review found no conversion or overflow blocker.
- **Boundaries:** no fake proof, urgency, guarantees, price change, permission change, money handling, schema/API behavior, analytics storage, or checkout behavior was added.
- **Rollback:** revert this conversion-copy/coherence commit. Existing feature flags and legacy component rollback remain unchanged.

## 2026-08-24 — Organizer/viewer friction and comprehension pass

- **Scope:** high-confidence P1/P2 UX clarifications only: existing-account sign-in on the product-first landing hero, viewer score/axis/result-digit mapping, board Reset/Fit behavior, and completed-board/final-record organizer guidance.
- **Files touched:** `src/features/homepage/HomepageV2.tsx`, `src/features/viewer/score/ScoreInstrument.tsx`, `src/features/viewer/scenarios/ScenarioDisclosure.tsx`, `src/features/viewer/personal/YourSquaresSummary.tsx`, `src/features/viewer/board/ViewerBoardGrid.tsx`, `src/features/viewer/shell/ViewerShell.tsx`, `src/features/organizer/shell/OrganizerShell.tsx`, `tests/homepageV2.test.tsx`, `tests/viewerShell.test.tsx`, `tests/viewerBoardGrid.test.tsx`, `tests/organizerShell.test.tsx`, `playwright-tests/viewer-v2.spec.ts`, `docs/phone-viewer-hierarchy.md`, and `docs/REFACTOR_LOG.md`.
- **Product decisions:** the landing now exposes `Sign in to existing account` as a quiet first-viewport utility action while preserving create/demo as the two hero choices; score/current-result surfaces express the winning square as the top team’s digit `across` and the side team’s digit `down`; scenario and personal-square rows use named team columns/rows; the exact board names the actual teams in its sticky axes; duplicate Find and irrelevant Center-selected controls were removed; `Reset/Fit` now performs real cross-browser layout scaling from 50%–100%; completed published boards show a Final-record lock explanation and a `Create another board` route.
- **Boundaries preserved:** no pricing, schema, permission, scoring-authority, money-handling, package, environment, production-data, live-board, deploy, commit, or push change was made. Existing protected untracked `.impeccable/` and prior protected docs were not edited.
- **RED evidence:** focused expectations were added first in `tests/homepageV2.test.tsx`, `tests/viewerShell.test.tsx`, `tests/viewerBoardGrid.test.tsx`, and `tests/organizerShell.test.tsx` for the missing sign-in link, missing winning-digit explanation, ambiguous top/side orientation, missing Reset/Fit behavior, and absent completed-board lock guidance. In this sandbox those assertions target code that did not yet render the required text/control, so the intended RED state is deterministic by inspection.
- **GREEN evidence:** full unit **68 files / 411 tests**; PostgreSQL integration **9 suites / 56 passed / 1 skip**; homepage-v2 contract **28/28** across Chromium/WebKit and phone variants (24 in the homepage-only run plus the 4 demo-handoff cases rerun with viewer-v2 enabled); viewer-v2 **8/8**; organizer-v2 **8/8**; production build and design lint passed. The broad unscoped `npx playwright test` command is not a valid release matrix because v2 suites require mutually different feature-flag environments; its failures were reproduced as flag/legacy expectation conflicts rather than reported as green. Design audit remains at the pre-existing **74 documented findings**. Fresh desktop and 390px screenshots had no page overflow or console errors; the full 10-column board now actually fits at 50% on mobile and keeps the current square and team orientation visible.
- **Rollback:** revert the listed files from this entry. No domain state is affected.

## 2026-09-01 — Broadcast Glass stage 1+2: baseline and design foundation

- **Scope:** removed stale agent worktrees and branches; added `src/design/tokens.css`, `Base`, motion helpers, and the Eyebrow, Capsule, Glass, Spotlight, Numeral, Sheet, Ring, and Island primitives with unit coverage; added the temporary `/design-kitchen` route; rewrote `DESIGN.md` and `docs/DESIGN_TOKENS.md`; retired the old design audit.
- **Known transient effect:** legacy surfaces that use `rounded-control` render 12px corners instead of 8px until they are deleted in stages 3–5.
- **Not touched:** schema, functions, workers, services, hooks, legacy surfaces (deleted in stages 3–5).
- **Evidence:** unit suite 77 files / 431 tests green, strict TypeScript, production build, design lint 0 errors, kitchen route verified in the browser at desktop and 375px (fonts loaded, glass blur, both grounds, sheet focus trap and scroll lock, island expand, no horizontal overflow).
- **Rollback:** revert the commits of this stage; no domain state affected.
