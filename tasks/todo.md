# Pre-game shared selling board — September 4

Approved journey: Create → Allocate → Share and sell → Draw and lock → Follow the game.

- [x] Confirm team-wide visibility, fixed square IDs 1–100, arbitrary family allocation, organizer-only buyer entry.
- [x] Inspect publication, routing, privacy and existing user changes; isolate implementation on codex/pregame-selling.
- [x] Implement explicit pregame share state and safe public projection; preserve existing finalization and scoring boundaries.
- [x] Implement public family allocations separately from private seller/payment/contact metadata.
- [x] Build organizer allocation and visible progression, sharing confirmation, and return navigation.
- [x] Build phone/desktop selling viewer with full board, family filter, unsold highlighting and freshness.
- [x] Wire share persistence, recovery, same-link transition and dashboard status.
- [x] Verify focused RED/GREEN tests, SQL integration and full release gates.
- [x] Inspect rendered phone/desktop and keyboard interactions; independently review changed boundaries.
- [x] Document results, migration and release requirements. No commit/push/deployment or production migration is authorized.

## Implementation decisions

- A square's permanent ID is index + 1; game axes are separate. Allocation does not create a buyer or mark a square paid.
- Public `board.allocationLabels` is an optional 100-element array. Never copy historical private `seller_label` into it.
- Explicit first sharing consumes/reserves the same existing 1/5/50 board allowance; drawing/finalizing that board cannot count twice. Prices and limits stay unchanged.
- Public pregame projection always hides unfinalized axes and all private metadata. Existing finalized public snapshots take precedence at the same share URL.
- Existing final publication remains the atomic draw-lock operation, retaining score authority, audit and OPEN-result semantics.
- Fresh public sales data is read from saved board state; failed saves never masquerade as team-visible updates.
- Local migration and test databases only. Production rollout requires final approval.

## Review

Implemented and locally verified. See `docs/pregame-selling-review.md` and the appended execution record in `docs/REFACTOR_LOG.md`. Production migration and deployment remain approval-gated release work, not completed work.

# Scroll-craft Studio landing — September 5

- [x] Confirm corrected scope: a complete Mac Studio-inspired professional landing experience for local review.
- [x] Read product/design contracts and research reference.
- [x] Author journey, feeling curve, grammar, and layer contract.
- [x] Implement dimensional product hero, board chapter, score payoff, interactive viewer chapter, organizer and close.
- [x] Run focused regression tests then repository gates.
- [x] Inspect desktop, phone, intermediate scroll and reduced-motion states; open local preview.
- [x] Append verification review. No commit, push or deploy authorized.

Review: full landing redesign delivered locally at http://127.0.0.1:5181/.737 unit tests,74 existing+6 new Chromium,17 WebKit,6 built-package tests passed; tsc/build/design lint passed (5 existing warnings). Screenshot review and tablet clipping repair complete. Detailed evidence in scrollcraft/builds/gridone-studio/REPORT.md.

## Studio landing release approval

Anthony approved commit, push and deployment after reviewing the built preview. Release is isolated on codex/studio-landing-release, based on production main8941c53. Only the landing slice and its documentation/tests are included; unrelated original-checkout work stays in place.

- [x] Integrate the approved landing slice on current production main.
- [x] Verify combined release candidate: 782 unit, 82 Chromium, 6 WebKit; TypeScript/build/design lint passed.
- [ ] Commit and push the approved candidate to main.
- [ ] Confirm Cloudflare build SHA and inspect live desktop/phone behavior.

# September 7 — organizer production readiness

Owner-approved design: one allocation flow (select squares, name, payment, apply), no seller input or sequential paste, preserved responsible allocation when public names change, no selection-induced scrolling. Compact game selection; honest deletion results. Integrate existing landing/legacy-axis work, commit verified result, and prepare a clearly labeled dummy board for the first game with $100 Q1/Halftime/Q3/Final.

- [x] Observe signed-in Safari workflow and identify current released baseline.
- [x] Preserve existing changes and isolate from current release.
- [x] Implement game picker and truthful deletion with focused RED/GREEN tests.
- [x] Implement unified allocation and stable responsive editor with focused RED/GREEN tests.
- [x] Integrate legacy-axis preservation and reconcile prior local changes.
- [x] Run type, unit, build, design, browser and available integration gates.
- [x] Inspect desktop/phone keyboard, saved/reopened state, and public/private boundaries.
- [x] Commit/reconcile main and release verified changes.
- [x] Finish payout-saving regression found during live setup and verify (796 unit tests, browser payout save/reload, build, TypeScript, design).
- [x] Deploy payout repair and verify canonical payout save/reload on live demo.
- [x] Set up and reload-verify clearly labeled dummy first-game board with $100 at all four milestones and private viewer preview.
- [ ] Publish demo and verify public viewer — blocked by free allowance already used by Test1; owner decision on $9.99 Game Day purchase required.

Review: 788 unit tests passed; 66 integration passed / 1 existing skip; TypeScript, production-configured build, design lint passed (5 existing token warnings); all 84 Chromium tests passed. WebKit organizer/accessibility/picker coverage passed across runs (29 passed / 1 platform skip, then all 7 picker tests passed after correcting native keyboard assumptions). Desktop and phone images inspected. Failed payment-note saves retain names and responsibility. Live release and dummy-board verification pending; signed-in account already uses its one free publication. No production schema changes needed or authorized.

# September 5 — phone board-unavailable incident

- [x] Trace `contests.shared_at` to the authenticated board-read query in pregame-selling.
- [x] Verify remote main is `8941c53`; configured GridOne database lacks the column and sharing functions. Prerequisite tables and delete policy exist.
- [x] Identify existing repair: full `026_pregame_sharing.sql`, including sharing protections and allowance RPC.
- [x] Re-run focused disposable-Postgres migration tests: `npx vitest run --project integration tests/pregameSharing.integration.test.ts` — 10 passed.
- [x] Obtain production-schema approval, apply migration 026 through Supabase migration tooling, and verify live organizer board loading in signed-in Safari.

Review: Anthony approved the production migration in this task. Supabase reported success; verified the column, four functions, two triggers, and service-only sharing RPC permissions. Production owner-column query succeeds. Signed-in Safari opened existing draft Test (`24574672-31bc-4c76-b421-b7ed27f0a798`) and rendered Saved, the selling workspace, and all 100 square buttons. The anonymous REST probe returns the expected table permission denial and is not an owner-path test. No board creation, editing, sharing, or deletion performed during verification. Existing unrelated changes preserved.

# Landing continuation — September 4

Starting point: Claude's `redesign/stage-9-board-fill`, commit `12c34aa`, preserved on `codex/landing-continuation` in its own worktree.

- [x] Recover the actual implementation and preserve existing work.
- [x] Confirm owner direction: keep the dark feel, use Apple-inspired product presentation, use “Add your names. Then draw the numbers.”
- [x] Review the existing fill, copy, motion, and responsive behavior.
- [x] Apply focused refinements and regression fixes.
- [x] Run TypeScript, unit, build, design lint, Chromium and targeted WebKit/phone checks.
- [x] Inspect rendered desktop, phone, and reduced-motion states; provide a local preview.

## Boundaries and decisions

- Owner approved committing and pushing this reviewed landing work to main on September 4. No package additions or production data/configuration changes are included.
- Original checkout and its three modified files stay untouched. REFACTOR_LOG in this isolated checkout may receive a new appended continuation record without copying the other session's uncommitted entry.
- Existing Stage 9 tasks 1–3 are implemented in Claude's seven commits; review them rather than recreate them.
- Product truth overrides stale plan copy: open squares are supported. Approved replacement: “Add your names. Then draw the numbers.”
- Preserve typography, palette, hero first viewport, no-motion fallback, and existing customer flows.

## Review

Continuation source review: clean; existing branch preserved. Updated the section heading to the exact approved phrase, shortened OPEN/draw facts, labeled the example visibly and accessibly, put the heading first on phones, and compacted non-animated layouts.

Verification:
- Baseline: 98 focused unit tests and 11 homepage Chromium tests passed.
- Regression RED: 5 intended failures before source edits; focused GREEN: 55 passed.
- Final full unit: 101 files, 733 tests passed.
- TypeScript and production build passed.
- Design lint: zero errors, five existing orphan-token warnings.
- Full Chromium: 74 passed; all axe surfaces passed serious/critical gates.
- Homepage WebKit + phone-WebKit: 22 passed.
- Integration: initial run 8 suites passed, 1 failed during disposable PostgreSQL startup (database shutting down). Failed suite rerun passed all 7 tests. Combined: 56 passed, 1 skipped.
- First full browser attempt interrupted after diagnosing local mock-auth storage-key mismatch; no source fix needed. Server restarted with reserved .test URL matching fixture storage-key prefix and dummy anon key; complete rerun passed. No production credentials used.
- Rendered phone 390x844, desktop 1440x1000, reduced-motion desktop inspected. At progress 0: 0 cells/0 digits; ~0.51: 56 cells/0 digits; 1: 100 cells/20 digits. Figure stayed at y=96 through mid-scroll; overflow zero, console/page errors zero.
- Final read-only review found no actionable defects.

Local preview: http://127.0.0.1:5194/ (landing/demo preview with dummy auth configuration).
Original checkout remains on main with its three original modified files. No commits, merge, push, deployment, or production data changes.

Live verification follow-up: first release ed4910e deployed successfully to Cloudflare Pages grid-one and getgridone.com. Signed-in Safari verified compact creation, 100 dummy allocations, 100 paid demo statuses, fixed number draw, and an individual display-name change retaining Demo Family responsibility. Payout Save exposed a genuine overlap with draft autosave; addressing before final release. Existing Test1 consumes the free account publication allowance; no paid upgrade or allowance override performed.

Final live check: payout repair 5eaa70d deployed successfully; production bundle matches locally verified build. Safari saved canonical Q1/HALF/Q3/FINAL at $100 and demo notice, reloaded without a conflict, then rendered the full private viewer with all four amounts. Number draw, 100 assigned/paid demo entries, and renamed first square retaining family responsibility persisted. Publish returned the existing Game Day allowance gate (free 1 of 1 used by Test1); checkout was not entered and no charge or entitlement change was made. Code review and automated gates complete; public demo verification awaits the owner purchase decision.
