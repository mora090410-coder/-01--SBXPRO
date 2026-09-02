# Broadcast Glass Stage 7: Repo Cleanup and Docs Rewrite

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One app, one design system, one set of docs: delete every dead surface, style, script, sketch, and stale document left behind by the redesign, and add an automated accessibility pass so the redesigned surfaces stay honest.

**Architecture:** Deletion is grep-driven: nothing is removed until a repo-wide search shows zero importers/usages, and every deletion is paired with the test that referenced it. Docs are rewritten to describe the shipped app only. An axe-core Playwright spec becomes part of the release command.

**Tech Stack:** Vite, Tailwind v4, Vitest, Playwright, `@axe-core/playwright`.

## Global Constraints

- Do not touch `hooks/`, `services/`, `functions/`, `workers/`, `supabase/`, Stripe, email, API shapes, `*Model.ts`, lifecycle/draft models, `utils/playerNameMatching.ts`, `context/AuthContext`.
- A file is deleted only after `grep -rn "<basename without extension>" --include=*.ts --include=*.tsx --include=*.css --include=*.html --include=*.json --include=*.md . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git` shows no remaining importer or reference outside docs that are themselves being deleted or rewritten.
- `npm run design:lint` stays a gate; `DESIGN.md` keeps its frontmatter.
- `src/features/instrumentation/eventSchema.ts` and `tests/instrumentationSchema.test.ts` keep their `homepage_v2:*` / `viewer_v2:*` / `organizer_v2:*` literals (analytics continuity).
- Owner-authored untracked files under `docs/marketing/` are committed, never deleted.
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

### Task 1: Dead styles, assets, components, and specs

**Files:** modify `src/index.css`, `index.html`, `package.json`, `App.tsx`, `src/features/organizer/game-day/ManualScoringPanel.tsx`; delete `public/premium.css`, `sketches/`, `.impeccable/`, `src/components/primitives/Field.tsx`, `tests/primitives.test.tsx`, `components/empty/EmptyState.tsx`, `playwright-tests/phase5-visual.spec.ts`, `playwright-tests/phase5-accessibility.spec.ts` (only if it is also `PHASE5_CAPTURE`-gated or duplicates `accessibility-contract.spec.ts`; otherwise fold its live assertions into `accessibility-contract.spec.ts` and then delete), `src/design/kitchen/`, `tests/design/kitchen.test.tsx`, `.worktrees/` (after `git worktree list` shows nothing registered there; `git worktree prune`).

- `src/index.css`: delete the whole `.oa-*` block (lines ~155–518) and the whole `.gdh-*` block (~529–1150) once stage 6 has left zero usages (`grep -rn "oa-\|gdh-" --include=*.tsx --include=*.ts . --exclude-dir=node_modules --exclude-dir=dist` must be empty first; `ManualScoringPanel.tsx` is the last known user and is restyled in this task). Remove legacy `@theme` color aliases that no longer appear anywhere (`broadcast-white`, `newsprint`, `ink`, `cardinal-subtle`, `cardinal-deep`, `gold/…` variants, `rounded-surface`) — check each with grep before removal. Remove the legacy `Archivo` / `Chivo Mono` font families from `index.html` and any `font-*` alias for them if unused.
- `ManualScoringPanel.tsx`: replace `oa-slab`/`oa-headline`/`oa-body`/`text-ink/*`/`text-cardinal` with `font-ui`/`font-display`/`text-fg`/`text-fg-2`/`text-tone-cardinal`; strings unchanged (`tests/organizer/gameday.test.tsx` and `tests/manualScoring*.test.*` stay green).
- `App.tsx`: remove the dev-only `/design-kitchen` route and its import.
- `package.json`: remove `lucide-react` if `grep -rn "lucide-react"` is empty after stage 6; remove any other dependency with zero imports (check `gsap` — keep if `src/design/primitives/motion.ts` or any primitive imports it).
- [ ] Verify: `npx tsc --noEmit`, unit suite, `npm run build`, `npm run design:lint`, `npx playwright test --project=chromium`.
- [ ] Commit `cleanup: delete dead styles, kitchen, sketches, and capture specs`.

### Task 2: Docs rewrite and stale docs removal

**Files:** rewrite `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, `docs/TEST_STRATEGY.md`, `docs/organizer-journey-contract.md` (full pass: every control name matches the workspace; remove `AdminPanel`, wizard, and flag references), `docs/phone-viewer-hierarchy.md` (describe `ViewerShell` composition; remove `GameDayHorizon`), `docs/accessibility-contract.md` (island, sheet, capsule, selection mode; remove legacy selectors), `README.md`, `AGENTS.md` (remove flag lines; describe the release command `npx playwright test` and `npm run design:lint`); delete `docs/design-system-governance.md`, `docs/gap-remediation-plan-2026-08-01.md`, `docs/instrumentation-rollout-feedback.md`, `docs/launch-review-plan.md`, `docs/wayfinder-gridone-production-quality.md`, `docs/vision-code-gap.md`, `docs/prototype-homepage-decision.md`, `docs/prototype-organizer-decision.md`, `docs/prototype-phone-viewer-decision.md`, `docs/prototype-strategy.md`, `docs/execution-spec-2026-07-29.md`, `docs/pricing-gating-copy-2026-07-29.md`, `docs/landing-product-boundary.md`, `docs/universal-interface-foundation.md`; keep `docs/greenfield-product-spec.md` only if it still describes the shipped product (read it; delete otherwise and say so); keep `docs/REFACTOR_LOG.md`, `docs/DESIGN_TOKENS.md`, `docs/pricing-recommendation-2026-09-01.md`, `docs/product-metrics-and-evidence.md`, `docs/superpowers/**`, `docs/marketing/**`; `git add docs/marketing/` (owner files).

- Rewritten docs describe only what exists: routes from `App.tsx`, feature directories under `src/features/`, primitives under `src/design/primitives/`, tokens in `src/design/tokens.css`, data hooks and services by name, the Cloudflare Pages + Functions + workers topology, the test layers and the release command. No `_v2`, no flags, no `AdminPanel`, `GameDayHorizon`, `FilmLanding`, `BoardHeader`, `OrganizerShell`, `season pass` / `$14.99` (pricing comes from `src/features/homepage/pricing.ts`).
- [ ] Verify: `grep -rn "AdminPanel\|GameDayHorizon\|FilmLanding\|BoardHeader\|OrganizerShell\|organizer_v2\|viewer_v2\|homepage_v2\|design-kitchen" docs README.md AGENTS.md DESIGN.md --exclude-dir=superpowers` returns only `docs/REFACTOR_LOG.md` lines. Any test that reads a doc (`tests/pollingDisclosure*`, `tests/design/*`, `tests/staticSeo.test.ts`) stays green.
- [ ] Commit `docs: describe one app`.

### Task 3: Automated accessibility pass

**Files:** `package.json` (add `@axe-core/playwright` dev dependency, pinned), create `playwright-tests/axe.spec.ts`, modify `docs/TEST_STRATEGY.md` (one paragraph).

- Routes: `/`, `/demo`, `/articles`, `/articles/how-football-squares-work`, `/login`, `/privacy`, an unknown path (404), `/dashboard` and `/create` and `/boards/:id` draft workspace with the route mocks already used in `playwright-tests/organizer.spec.ts` (import or copy `installOrganizerBoard`/`installOrganizerSupport`). For each: `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()`; assert zero `critical` and zero `serious` violations; print `moderate`/`minor` counts as a report annotation. Disable only rules with a documented false positive in this app, each with a comment naming the element and reason.
- [ ] Fix every serious/critical violation found in application code (these are real defects; list them in the report). Do not weaken assertions.
- [ ] Commit `a11y: axe pass over redesigned surfaces`.

### Task 4: Gate, log, merge, push, deploy (controller)

- `npx tsc --noEmit`, unit, `npm run build`, `npm run design:lint`, `npx playwright test --project=chromium`; log stage 7 in `docs/REFACTOR_LOG.md`; final whole-branch review; merge to `main`.
- Push `main` to `origin` (Cloudflare Pages project `grid-one` builds production from `main`); watch `npx wrangler pages deployment list --project-name grid-one` until the new deployment for the pushed commit reports success; open `https://www.getgridone.com/`, `/demo`, `/articles`, `/login` in the browser pane and confirm the redesigned pages are live with no console errors.
