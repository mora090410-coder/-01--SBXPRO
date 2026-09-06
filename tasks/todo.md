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
