# Pregame selling workflow — local review

Implemented on `codex/pregame-selling` in the isolated `.worktrees/pregame-selling` checkout. Anthony approved committing and pushing this implementation to `main` on September 5. Production migration has not been applied; deployed behavior has not been verified.

## The team workflow

1. Create a board and stay in its organizer workspace.
2. Allocate any selection of permanent squares 1–100 to families, including diagonals. Allocation and buyer names are independent.
3. Share the full board before any sale or game-number draw. The sharing confirmation explains public family/buyer visibility and the existing board allowance.
4. Families view the same link without accounts, filter their squares, and highlight unsold squares. The organizer records buyers and can redistribute remaining allocations.
5. Draw, review, and lock the game numbers near kickoff. The same link becomes the game-day board. Owner navigation returns to Manage board.

## Product boundaries

Only the organizer edits. Public family allocations are explicit new fields; historical private seller, payment, and contact data is never copied into them. Sharing reserves one existing board allowance; finalization cannot count it twice. Pregame axes stay hidden, and scoring stays disabled until finalization. Shared board identity is stable. Legacy dynamic boards fail closed and retain their axes.

## Visual review

The rendered organizer retains the approved cream workspace; participant boards use the dark viewer design. Phone viewing provides a compact full-board overview and full selected-square details, with keyboard navigation and explicit sold/unsold labels.

- [Phone organizer](/tmp/gridone-pregame-review/organizer-selling-390.png)
- [Desktop organizer](/tmp/gridone-pregame-review/organizer-selling-1440.png)
- [Phone selling board](/tmp/gridone-pregame-review/selling-board-390.png)
- [Desktop selling board](/tmp/gridone-pregame-review/selling-board-1440.png)
- [Phone finalized board](/tmp/gridone-pregame-review/finalized-board-390.png)
- [Desktop finalized board](/tmp/gridone-pregame-review/finalized-board-1440.png)

## Verification

Final results are recorded in `REFACTOR_LOG.md`. Browser tests exercise real UI against stateful API fixtures, including a separate signed-out viewer and the same-link transition. SQL integration tests use disposable PostgreSQL with the real migrations. These checks do not establish a deployed end-to-end production result. The optional hosted checkout proof remains skipped.

## Release still required

Review and approve migration `026_pregame_sharing.sql` and the release. Apply the migration before deploying the matching API/frontend, then verify the complete organizer-to-signed-out-viewer journey against the deployed backend. Original checkout changes remain untouched. No new package or paid service was introduced.

Rollback needs to preserve any boards already shared: do not drop sharing data or withdraw functioning links as a routine rollback. Before any real-user rollout, verify a rollback strategy that retains the sharing-aware public endpoint.
