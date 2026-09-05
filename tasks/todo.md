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
