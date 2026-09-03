# GridOne Agent Instructions

GridOne is a production football-squares organizer and game-day viewer. Product truth, public trust, accessibility, and rollback outrank fashionable refactors.

## Read first

1. `PRODUCT.md` — canonical product, people, terminology, commercial model, permissions, and scope.
2. `DESIGN.md` — the normative Broadcast Glass overlay. Do not edit it casually; `npm run design:lint` gates it.
3. `docs/ARCHITECTURE.md` — routes, feature directories, API surface, workers, security boundaries.
4. `docs/TEST_STRATEGY.md` — what each test layer owns and the release command.
5. Read the relevant contract before changing a surface:
   - `docs/organizer-journey-contract.md`
   - `docs/phone-viewer-hierarchy.md`
   - `docs/accessibility-contract.md`
   - `docs/DESIGN_TOKENS.md`

`docs/REFACTOR_LOG.md` is the append-only execution record. Append to it; do not rewrite it.

## Product contracts that may not drift

- Free: 1 published board per account per season.
- Game Day: $9.99 once for up to 5 published boards in the 2026 season.
- Organization: $79 per season for up to 50 published boards plus the documented organization features.
- The ladder is written once, in `src/features/homepage/pricing.ts`. `tests/pricingCopyConsistency.test.ts` enforces it across the customer-facing corpus.
- GridOne never collects square money, holds funds, adjudicates off-platform payment, or pays winners.
- One signed-in organizer owns and edits each board; viewers need no account and cannot edit.
- Manual score authority is canonical until deliberately returned to automatic; stale automatic data never overwrites manual or newer state.
- One fixed 0–9 top/side axis set per board. Do not flatten legacy dynamic boards without an approved preservation plan.
- OPEN outcomes stay OPEN, do not roll over, and send no winner email.
- Public label and milestone corrections are audited and viewer-visible; private payment, seller, and contact metadata stays private.

## Architecture and feature seams

- One app, one design system. `src/design/` owns tokens and primitives; `src/features/{homepage,viewer,organizer,site,instrumentation}` own the surfaces; `pages/` orchestrates routes; `hooks/`, `services/`, and `utils/` are shared.
- Prefer feature-local components, hooks, models, and services. Promote something into `src/design/primitives/` only when two real features share the behavior.
- Business rules belong in pure modules (`*Model.ts`, `lifecycle/`, `utils/`) that test without a browser. Components render; they do not decide.
- Style with the `--g-*` tokens and the Tailwind aliases in `src/index.css`. No one-off colors, fonts, radii, or durations. Do not add `--gridone-*` variables.
- Browser and server are separate security boundaries. Never move service-role, Stripe-secret, scoring-provider, Gemini, email, cron, or notification secrets into browser code.
- There are no feature flags in this app. The `FeatureVariant` union in `src/features/instrumentation/eventSchema.ts` keeps its historical variant literals for analytics continuity only — do not rename them, and do not read them as evidence that a flag still exists.

## Editing discipline

- Use strict RED → GREEN → REFACTOR for behavior changes. Record the commands and their results in `docs/REFACTOR_LOG.md`.
- Touch only the active slice. No unrelated renames, formatting sweeps, dependency upgrades, schema changes, or cleanup.
- Treat existing untracked files as protected user work. Never delete, move, overwrite, format, stage, or commit them without explicit approval — this includes everything under `docs/marketing/`.
- Do not commit, push, deploy, alter production data or configuration, install unapproved packages, or contact users without the applicable Anthony approval.

## Verification

Run the smallest focused test first, then the gates:

```bash
npx tsc --noEmit
npm run test:unit
npm run build
npm run design:lint
npx playwright test --project=chromium
```

`npm run test:integration` starts disposable Postgres containers. If Docker is unavailable, record the blocker and run every non-container gate — do not claim that layer passed.

A passing build is necessary and insufficient. For a UI slice, inspect the rendered phone and desktop states and the accessibility behavior before calling it done.

## Stop and ask

Stop when work discovers a pricing, permission, or public/private ambiguity; a production schema change; destructive migration pressure; a legacy dynamic-axis board; a score-authority risk; a new paid service; a production credential need; inaccessible product behavior; a protected-file collision; a deployment; or a real-user rollout or contact requirement.
