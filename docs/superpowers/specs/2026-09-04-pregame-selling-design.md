# Pre-game shared selling board

Anthony approved this design through the September 4 conversation: organizer allocates numbered squares to families (including diagonal patterns); families report buyers to organizer; everyone sees the entire board, allocations and unsold squares; numbers are drawn later. One shared link must work through selling and finalization. No participant accounts or editing.

## States and behavior

Private draft remains owner-only. Explicit sharing creates a pregame share record and reserves one existing seasonal board allowance atomically. It leaves buyer assignments and draft axes editable. Public sales data is projected from saved state only, never the full private document. The public sales projection shows no draft axis numbers. Final publication draws/locks through existing atomic publish behavior and takes precedence at the same URL without consuming a second allowance. Scoring and winner notifications remain gated on final publication.

## Data and privacy

`BoardData.allocationLabels?: (string | null)[]` stores exactly 100 explicitly public family labels. Absence means unallocated. This never derives from historic private seller labels. Permanent square IDs are indices + 1. Buyer presence means sold/assigned regardless of private payment tracking. Allocation never marks sold. Clear buyer names keeps allocations. Existing public finalized board labels/corrections/axes retain their contracts.

## API

POST `/api/pools/:id/share`, authenticated owner with verified email and `{revision}`. Response `{shared:true,sharedAt,shareCode,viewerUrl,revision,tier,used,allowance}`. Conflicts fail with 409; allowance issues follow existing 402 upgrade payload. Repeated sharing is idempotent. Owner GET includes `shared_at`. Public GET prefers finalized snapshot then explicitly shared pregame projection, `stage:'selling'`, no scores or private details. Unshared/withdrawn/deleted boards remain unavailable. Direct client writes cannot forge share authorization or expose arbitrary document keys.

## Organizer

The cream board workspace remains the home throughout. Visible action row includes My boards and sharing outside the collapsed status island. Select arbitrary cells, allocate family independently of buyer assignment, or edit both on a single square. Shared labels clearly announce public visibility. Failed/dirty/conflicted saves block sharing with concrete recovery. Share confirmation describes public buyer/family labels and private payment/contact notes and allowance. Image export says Share board image. Published success returns to Manage board.

## Viewer

Dark selling view leads with board identity, selling status, assigned/unsold counts and pending number draw. Family filter and unsold highlight retain full board context. All 100 square IDs and full accessible buyer/family details are reachable; phone gets legible details without 100 tab stops. Refresh keeps the board visible, labels errors/last update, and transitions to finalized viewer when publication arrives. It does not show scenarios or misleading zero scores during selling.

## Verification and rollout

Test-first pure/component/API changes; isolated Postgres tests for RLS, projection, reservation/idempotency and finalization. Whole journey browser test from allocation to same-link viewer and finalization. Verify phone/desktop, keyboard, overflow, reduced motion and release gates. No paid services/packages added. Local migration is a review artifact; no production schema, deployment, commit or push without approval.


## Reference check

The competitor check used primary help pages: https://superbowlpoolsite.com/help and https://www.superbowlsquares.org/faqs. Both describe administration of entries and number assignment as separate activities. GridOne's selected direction prioritizes the approved team-selling workflow over adding participant accounts, pick codes or configuration options. No claim of feature uniqueness or market superiority is made.

## Release boundary

Deploy the additive migration before the dependent API/frontend release. Existing finalized records need no data conversion. Do not deploy this frontend against an unmigrated database: explicit shared_at reads require the column. Verify owner sharing, anonymous viewing, buyer update, final lock, unchanged URL, entitlement count and score polling in a controlled canary before a real-user rollout.

A full rollback to the prior application after boards have been shared needs a preservation plan: old code treats activation as sufficient for scoring and cannot display pregame links. Prefer rolling forward a fix; any rollback must retain new scoring/finalization guards and existing shared records. Do not drop shared_at or erase allocations as a rollback shortcut.
