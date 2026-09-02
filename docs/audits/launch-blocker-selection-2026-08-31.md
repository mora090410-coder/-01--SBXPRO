# Launch blocker selection — 2026-08-31

## Selected blocker

**No approved, privacy-minimal read-only production scorecard exists for server-owned funnel and game-day outcome facts.**

This is the highest-evidence actionable launch blocker. It prevents GridOne from establishing the required baseline, reporting the launch funnel with denominators, detecting failed or ambiguous Final runs, or deciding whether traffic/conversion work is helping. It is not evidence of zero production defects; it is evidence that the team cannot measure them reliably.

## Verified evidence

1. The canonical launch plan records that production analytics storage is unverified and no trustworthy acquisition/activation baseline exists (`/Users/amm13/AMM-OS/04-Parkside/gridone/launch-to-100-users-500-facebook-followers.md:30-37`).
2. Its 2026-08-27/28 checkpoint explicitly identifies this as top blocker #1: durable server records exist, but no approved read-only scorecard path exists for verified accounts, assignments, publication, checkout/revenue, Organization interest, Final qualification, failures, or support burden (`launch-to-100-users-500-facebook-followers.md:161-195`). The production metrics are consequently `TBD`, not zero.
3. The current operational update repeats that production funnel/revenue/Final metrics remain `TBD` because no approved Supabase/Stripe reporting path is accessible (`launch-to-100-users-500-facebook-followers.md:197-202`).
4. The product evidence contract requires the north-star count/rate to derive from durable server-owned facts, excludes not-yet-eligible games from the denominator, and prohibits invented percentages (`docs/product-metrics-and-evidence.md:28-44,90-120,167-175`).
5. Existing code already has a privacy-minimal event schema, but its refactor record confirms it deliberately has no endpoint, storage, UI wiring, deployment, or production collection (`docs/REFACTOR_LOG.md:284-297`). Adding analytics is therefore neither necessary nor authorized to close this blocker.
6. Current worktree verification: `git status --short --branch` returned only `## wt/t_604c1d6f`; `git diff`, `git diff --cached`, and `git diff --stat` were empty. Current source head is `0b6cf85`. There is no local candidate diff to prioritize over this documented production-observability defect.

## Affected product surface

Launch operating control and all organizer/viewer/checkout paths that contribute to:

- verified organizer accounts;
- activated organizers (verified account + board + at least one assigned square);
- published boards;
- eligible boards reaching Final;
- successful, failed, and ambiguous Game-Day Board Runs;
- completed checkouts/revenue and Organization-tier interest where a durable source exists.

This does not alter the public UI, Stripe checkout behavior, score authority, publication semantics, or viewer data boundary.

## Concrete acceptance criteria

1. An Anthony-approved, read-only production reporting path is available for the relevant Supabase project and Stripe account, or Anthony supplies a time-bounded read-only export with the same fields.
2. A version-controlled reporting artifact reads only durable server-owned facts and emits a dated scorecard with the metrics above. Every rate shows its numerator and denominator; unavailable fields remain exactly `TBD` with the unavailable source named.
3. Final eligibility excludes scheduled games that have not reached Final plus the explicitly defined resolution grace period. Successful, failed, and ambiguous runs use the existing qualification contract rather than page views, purchases, or publication alone.
4. Output contains aggregate counts and non-sensitive status/reason categories only: no display names, emails, contact/payment metadata, raw score-provider payloads, URLs with query values, or free-form errors.
5. The reporting query/script has deterministic fixture or local-database coverage for activation, Final eligibility, and success/failure/ambiguous classification, plus a documented read-only production read-back command/result or export checksum/date. Query failure cannot affect organizer or viewer workflows.
6. No production schema migration, analytics-storage activation, third-party SDK, deployment, payment action, or production write is included.

## Risk class

**P1 launch-readiness and trust-observability defect.** No direct P0 integrity failure is evidenced, but the absence of an auditable baseline prevents detection and denominator-correct reporting of zero-tolerance score, publication, payment, privacy, accessibility, and Final-resolution failures. Traffic expansion should remain gated.

## Smallest safe implementation scope

Create one read-only server-side/reporting artifact and one aggregate scorecard output contract. Reuse existing durable domain tables/events and Stripe read-only reporting; do not introduce client instrumentation, tracking, schema changes, or UI changes. Keep the artifact manually run or explicitly scheduled only after its read-only credentials and retention/privacy review are approved.

## Required prerequisite for implementation and verification

**Owner: Anthony.** Provide either (a) approved credentials/access for read-only Supabase and Stripe reporting, or (b) a sanitized, dated export from each source plus the exact fields/time window. Verification must include a read-only production query/export read-back that demonstrates aggregate counts only and confirms no production mutation. Without that prerequisite, implementation must block rather than fabricate a scorecard or add speculative analytics.

## Rejected alternatives

- Reopening the stale/offline viewer timestamp defect: it is already represented in current source (`ScenarioDisclosure.tsx`) and prior verified evidence; selecting it again would duplicate completed work.
- Reconciling an alleged dirty local UX candidate: this assigned worktree has no tracked or staged diff, so no protected local change is present here to reconcile.
- Manual assistive-technology or live payment-path certification: both remain important release gates, but require human/device or financially consequential production access. They are not safe code-only work in this sprint without an explicit owner-provided test identity/access approval.
