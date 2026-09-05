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
