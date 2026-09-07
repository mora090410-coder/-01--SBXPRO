# GridOne execution lessons

- When handing off an authenticated browser step, do not claim a tab exists from an earlier binding. Re-list the current tabs, open or reclaim the exact tab, verify its selected URL and rendered title, make the browser visible, and only then tell the owner it is ready.
- When the user distinguishes Safari from the Codex in-app browser, treat them as separate authenticated sessions. Verify the exact project reference in the named browser before concluding that account access is blocked.
- Never emit accessibility text after entering a secret, even when the field is expected to stay masked. Validate secret fields only with internal equality/length checks and return sanitized booleans.
- Treat the organizer-owned 10×10 board as the free core object: it must remain visible, editable, and interactive without activation. Gate GridOne services—published viewer links, automatic live-score refresh, live scenarios/updates, and notifications—at explicit entitlement boundaries instead of dimming or disabling the board.
- Never combine an app-wide smooth-scroll owner with a fixed nested organizer scroller. Keep operational screens in normal document flow, scope cinematic scrolling to the landing route, and prove Page Down plus wheel behavior in WebKit at a phone-sized viewport.
- Do not assume a nested PostgREST relationship is always an array. A foreign key backed by a unique constraint is represented as a to-one object; normalize and test both `{ id }` and `[{ id }]` before using relationship shape as an authorization or lifecycle gate.
- When resuming another assistant's work, inspect all relevant branches before concluding the implementation is missing. A plan on main can have completed implementation commits on a separate branch.
- Landing-page draw copy must allow open squares. Use the owner-approved “Add your names. Then draw the numbers.” instead of claiming the board must be full.

- Pre-game boards are shared while families sell fixed squares 1–100, often allocated diagonally. Everyone may see explicit public family allocation, buyer names, and unsold squares; only the organizer records buyers. Keep seller allocation distinct from purchase and private seller/payment/contact notes. Separate first sharing from final number locking, and preserve the same team link and organizer return route through both stages.

- When Anthony asks whether a design skill can produce a better Mac Studio-style landing page, treat the request as a complete product-story redesign for local review, not a minor motion pass or another generic direction questionnaire. Preserve product contracts while making a visibly different composition.

- During an attended walkthrough, capture evidence quietly and let Anthony finish explaining before proposing changes.
- Allocation identifies who stays responsible for squares. A later public display-name change must preserve that responsibility. Use one selection/name/payment flow, without buyer-versus-family modes or a seller field.
- Verify local main against remote release before editing; consolidate already released local work rather than treating it as a separate unfinished feature.

Historical discovery context (superseded by the September 7 allocation flow above):
- Pre-game organizer discovery must include sharing the board while squares are being sold: families receive squares to sell and need to see their allocations before axis numbers are drawn a day or two before the game. Do not assume viewer access starts only after the draw. Distinguish seller allocation from buyer assignment, and resolve what allocation information is public before changing the existing privacy or publication contracts.
