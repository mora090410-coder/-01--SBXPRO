# GridOne "Broadcast Glass" redesign — design spec

**Date:** 2026-09-01
**Status:** Approved by owner in brainstorming session; awaiting written-spec review
**Goal:** Ship a go-to-market redesign of GridOne for the opening weeks of the 2026 NFL season. The app must feel Apple-grade: quiet, physical, few clicks, no rework. Live score tracking is the product's differentiator and must not regress.

## 1. Decisions made

| Question | Decision |
|---|---|
| Base | Dark spotlight base for the phone viewer and public homepage. Warm cream base for the organizer workspace and dashboard. |
| Design contract | Rewrite. The "Game-Day Horizon" direction in root `DESIGN.md` is replaced. The color palette (cardinal, gold, live green, ink, broadcast white) is locked. Fonts, radii, surfaces, and motion are open. |
| Scope | All three surfaces (homepage, viewer, organizer) plus SEO article pages, in one coherent pass. Nothing ships half-migrated. |
| Friction to fix | Too many steps, abrupt transitions, too much per screen. Concretely: repeated board renaming, painful back-navigation to edit, linear wizard. |
| Deadline | Opening weeks of the season. Owner will test live game tracking on real boards during those weeks. |
| Approach | B: new presentation layer on a small new design system; domain layer (data hooks, Supabase, workers, publish and correction rules, scoring) untouched. |
| Baseline | Commit the uncommitted 2026-08-24 friction pass as the starting point. Delete all worktrees. Cut legacy v1 surfaces and feature flags. |

## 2. Design contract: "Broadcast Glass"

### 2.1 Typography

Three families, one job each.

| Role | Family | Rules |
|---|---|---|
| Display | Instrument Serif | Hero headlines on the homepage, board name on the viewer and organizer header. Light weight, tight leading, 48–72px desktop, 34–44px phone. Nowhere else. |
| Interface | Geist | All labels, buttons, body, fields. Weights 400 and 500; 600 only on the single primary action. Body 15–17px. |
| Data | Geist Mono, tabular | Scores, digits, coordinates, counts, prices, timestamps. Large numerals render a dimmed secondary segment (cents, quarter label). |
| Eyebrow | Geist Mono, uppercase, 0.12em tracking, 12–13px, muted | One per section, above the headline. |

Essential interface text stays at or above 14px. Grid-cell labels remain the precision-instrument exception with accessible full labels.

### 2.2 Color behavior

Palette values are unchanged from the current token set: cardinal `#8F1D2C` / deep `#6E1622`, gold `#FFC72C` / deep `#E0A600`, live `#22C55E`, ink `#0E0F12`, chyron `#16181D`, broadcast white `#EFF0F1`, newsprint `#DEE0E1`.

**Dark base (viewer, homepage)**
- Ground: near-black (`#0B0C0F`), not pure black.
- One radial spotlight per page, cardinal-tinted, positioned behind the hero artifact. Never in margins or corners.
- Glass panel: white at 6% fill, 1px hairline white at 10%, `backdrop-filter: blur(20px)`. Hover raises fill to 8%.
- Primary action: gold capsule, ink text. Gold is the only action color on dark.
- Cardinal appears only in the glow, brand mark, and destructive confirmations with explicit text.
- Text: broadcast white primary, 60% white secondary, 40% white muted.

**Cream base (organizer)**
- Ground: warm off-white (`#F5F1EA`).
- Card: white at 70% fill, 1px hairline ink at 8%, soft 24px blur shadow at 6%.
- Primary action: cardinal capsule, white text.
- Gold marks committed and settled states only (drawn digits, published, final).
- Text: ink primary, 60% ink secondary.

**Both bases**
- Live green means only an in-progress NFL game. No other use.
- No state relies on color alone. Paid/unpaid, selected, open, corrected, stale all carry a text or shape signal.

### 2.3 Shape

| Element | Radius |
|---|---|
| Controls, inputs | 12px |
| Cards, sheets, glass panels | 20px |
| Buttons, tags, chips, island | capsule (999px) |
| Grid cells | 4px |

The 0px grid rule and the pill prohibition from the previous contract are removed.

### 2.4 Motion

Two curves only.
- **State ease:** 200ms, `cubic-bezier(0.2, 0, 0, 1)`. Hover, focus, toggles, text swaps.
- **Soft spring:** ~450ms, overshoot-free spring for island expand/collapse, sheet presentation, shared-element moves (draw digits rolling into axes, a selected cell centering).
- Route changes never hard-swap. The next surface fades or slides in place.
- `prefers-reduced-motion` converts both curves to a 120ms opacity fade.
- Implementation: CSS transitions and the View Transitions API where supported; GSAP (already a dependency) for the draw animation and island spring. Lenis is removed; the homepage uses native scroll.

### 2.5 The Island

A capsule component that hugs the top edge on phone and sits bottom-right on desktop.

- **Collapsed:** up to three ring gauges, each with a short mono percent or value beneath. On the viewer: score numerals plus quarter, and a "your squares" ring once an identity is selected. On the organizer: filled, paid, drawn rings.
- **Expanded (tap on touch, hover on pointer):** unfolds with the soft spring to show the full state and exactly one primary action. On the viewer: the full score instrument, freshness stamp, source, and "you win now" in gold when true. On the organizer: the current phase action (see §5).
- Stays pinned while content scrolls beneath.
- Fully keyboard operable: focusable, Enter/Space toggles, Escape collapses, contents are a labelled region.

### 2.6 Anti-slop rules (lint list)

These are part of the contract. Any later design pass must satisfy them.

1. The product is the hero image. Board, numerals, island. No illustrations, stock imagery, or abstract 3D shapes.
2. Asymmetric, left-anchored layouts on desktop. Centered layouts only on single-column phone viewer.
3. One spotlight glow per page, behind the artifact.
4. Hierarchy comes from scale contrast (serif 64px against 15px body), not from card count. No three-up feature card rows.
5. Real numbers and real team names in every mockup, demo, and empty state. Never "Team A."
6. Icons almost never. Text labels and numerals instead. When required: single stroke weight, 16px, muted, one icon set.
7. Copy is short, specific, occasionally dry. Banned words: seamless, effortless, unlock, supercharge, elevate, powerful, robust.
8. No purple, no multi-color gradients, no glow in corners, no uniform radius on every element.

## 3. Homepage

Dark base. One long page, five moments, in order.

1. **Hero.** Left column: eyebrow `FOOTBALL SQUARES, RUN LIVE`; serif headline "Build it once. Share one link. Let the board run game day."; one gold capsule `Create your board`; a quiet text link `Sign in`. Right column: a real phone viewer render at Q3 with a live score and a gold winning square, rotated 3–4°, one cardinal spotlight behind it. On phone the artifact stacks below the copy.
2. **The differentiator.** Full-width live score instrument in glass: big mono numerals, quarter, freshness stamp, source line. Copy: "Scores update themselves. You don't refresh, you don't type, you don't argue."
3. **Three things a parent sees.** Three stacked, side-alternating rows, each a single phone screenshot with two lines of copy: your squares; who wins now; what score wins next.
4. **Organizer in one screen.** The cream workspace screenshot with the island and a half-filled board. Copy about no wizard, editing anything in place, one link.
5. **Price and close.** $14.99 season pass, twenty boards, one line stating GridOne never collects square money, holds a pot, or pays winners. Gold capsule again. Footer: article links as a quiet text index, legal links.

The existing `/demo` handoff, sign-in utility action, and conversion tests carry forward.

## 4. Viewer

Dark base, phone first, one column. Follows the existing hierarchy contract in `docs/phone-viewer-hierarchy.md`, restyled and tightened.

- **Island** at the top edge replaces the separate score header (§2.5).
- **Board identity:** serif board name; teams and kickoff as a mono eyebrow. Nothing else precedes Find My Squares.
- **Find My Squares:** one capsule field. Typing filters names live inside a glass sheet that springs up from the bottom. Selecting a name dismisses the sheet and restructures the page into the personal view with the state ease. Existing tiered name matching, human-resolved ambiguity, and per-share-code persistence are unchanged.
- **Personal view:** your squares as a row of mono coordinate chips, each centering that cell on the board when tapped; "wins now" as one line, gold when true; "what wins next" as a short mono list, matching scenarios first, remainder behind a disclosure.
- **Winner email:** one capsule input with one button. Verified state replaces it with a quiet confirmation line.
- **Exact grid:** 4px cells, sticky team axes naming actual teams, selected cell in gold with an animated highlight. Pan and pinch unchanged. Reset and Fit collapse into a single `Fit` capsule.
- **Winners and details:** last during live play; promoted above the grid at Final. Final suppresses next-score scenarios. Pregame shows no inert scenario list. Stale/offline scenarios are labelled with last-known data.

No change to the score path, scenario model, identity persistence, or notification opt-in behavior. Before identity selection the surface never uses "me" language.

## 5. Organizer

Cream base. The six-step wizard (Draft → Fill → Reconcile → Draw → Preview → Go Live) becomes one board workspace. The phases survive as states; the navigation between them disappears.

### 5.1 Dashboard (`/dashboard`)
A list of boards. Each row shows the board name, game, and the island's three rings in miniature. One cardinal capsule `New board` creates a draft and opens the workspace with the name field already selected for typing.

### 5.2 Workspace (`/boards/:boardId`)
The only organizer screen for a board.

- **Header.** Board name as a serif heading, editable in place: click, type, save on blur, small `Saved` tick with the state ease. Linked game beneath it opens the schedule picker as a sheet.
- **The board** dominates. Tap a cell to assign; the name field autofocuses and Enter advances to the next open cell. Paste a newline list to bulk-fill from the first open cell. Duplicate names get an inline soft flag. Open cells render distinctly.
- **Side rail** on desktop, stacked below the board on phone: payout description, public rules, private notes, seller and paid tracking. Each is a card with its field open, autosaving. There is no Reconcile page; reconcile is a live summary line ("83 filled · 17 open · 6 unpaid") that highlights the relevant cells on the board when tapped.
- **The island** carries the phase (rings: filled, paid, drawn). Expanded, it holds the single primary action, which changes as the board matures: `Draw numbers` → `Preview` → `Go live` → `Copy link`. Redraw is a secondary action inside the island until publication.
- **Draw** animates digits rolling into the board's axes in place with the soft spring. No separate screen.
- **Preview** slides the real viewer in as a full-height sheet over the workspace; dismissing it is a swipe or Escape.
- **Go live** confirms inside the island, including the explicit open-square acknowledgement when open cells remain. Publishing is the public trust boundary, unchanged.
- **After publish** the page is the same. Locked fields show a lock affordance and the audited correction path for names (before/after, timestamp, reason). Late assignment of previously open cells before kickoff remains available. The completed-board Final-record lock explanation and `Create another board` route from the 2026-08-24 pass are preserved.

### 5.3 Rules that survive unchanged
At least one assigned square before publish; open squares require acknowledgement; draft redraws allowed before publication; publication is immutable except through audited corrections; kickoff freezes edits; off-platform payment status never blocks progression; GridOne never handles money.

## 6. Article pages and remaining routes

The SEO article pages, `/paid`, `/privacy`, `/terms`, `/login`, and `/404` are restyled with the same primitives on the dark base. Content and URLs unchanged. `Layout` gains the new header and footer.

## 7. Architecture

### 7.1 New
- `src/design/tokens.css` — the only token source, consumed by Tailwind `@theme` in `src/index.css`.
- `src/design/primitives/` — `Glass`, `Island`, `Capsule` (button, tag, input variants), `Numeral`, `Sheet`, `Spotlight`, `Eyebrow`, `motion.ts` (the two curves, reduced-motion helper).
- `src/features/homepage/`, `src/features/viewer/`, `src/features/organizer/` rebuilt on the primitives. Feature directories keep their existing internal seams (board, scenarios, score, personal, identity, notifications, lifecycle, draft, game-day).
- A temporary `/design-kitchen` route rendering every primitive in both bases, deleted in the final cleanup stage.

### 7.2 Removed
- Legacy v1 surfaces: `components/FilmLanding.tsx`, `components/GameDayHorizon.tsx`, `components/BoardView.tsx`, `components/OrganizerDashboard.tsx`, `components/AdminPanel.tsx`, `components/BoardGrid.tsx`, `components/PlayerFilter.tsx`, `pages/CreateContest.tsx`, and any component that becomes import-free.
- Feature flags `homepage_v2`, `viewer_v2`, `organizer_v2` and `utils/featureFlags.ts`; `_V2` suffixes in file and component names.
- `sketches/`, `.impeccable/`, `scripts/design-audit.mjs`, `docs/DESIGN.incumbent.md`, prototype decision docs that describe the old direction. The `@google/design.md` lint stays and the new `DESIGN.md` keeps a valid frontmatter block so `npm run design:lint` remains a gate.
- All `.worktrees/*` and the prunable `/private/tmp/gridone-phase4.*` worktree, plus their branches.

### 7.3 Untouched
Supabase schema and migrations, Supabase functions, Cloudflare Pages Functions in `functions/`, score and retry workers in `workers/`, Stripe checkout, transactional email, public API response shapes, `services/`, `hooks/usePoolData` and other data hooks, `context/AuthContext`. If a UI change appears to require any of these, work stops and the owner decides.

## 8. Testing and verification

- Existing Vitest unit and integration suites stay green at every stage. Suites covering score ingestion, scenario model, publish, open-square rules, corrections, and name matching are the regression floor.
- Component tests are rewritten alongside each surface; tests asserting legacy markup are deleted with the legacy code, not skipped.
- Playwright suites are rewritten per surface on the new markup. The mutually exclusive flag-environment matrix goes away; one `npx playwright test` is the release command.
- Accessibility contract (`docs/accessibility-contract.md`) is updated for the island, sheet, and capsule controls and enforced by the rewritten accessibility spec.
- Every stage ends with phone (390px) and desktop screenshots captured in the browser pane and shown to the owner, plus a console and network error check.
- `npm run build` and strict TypeScript pass before any stage merges.

## 9. Delivery order

Each stage is its own branch, verified, then merged to `main`. Nothing is deployed by the agent.

1. Baseline: commit the 2026-08-24 friction pass; delete worktrees and branches.
2. Design foundation: new `DESIGN.md`, tokens, primitives, kitchen route.
3. Homepage; delete legacy landing and its flag.
4. Viewer; delete legacy `BoardView` and its flag.
5. Organizer workspace and dashboard; delete legacy organizer and wizard and its flag.
6. Article pages and remaining routes.
7. Repo cleanup and docs rewrite so every doc describes one app. `DESIGN_TOKENS.md`, `ARCHITECTURE.md`, `PRODUCT.md`, `organizer-journey-contract.md`, `phone-viewer-hierarchy.md`, and `accessibility-contract.md` updated; stale prototype and decision docs removed.

## 10. Out of scope

Schema or API changes, new pricing or entitlement rules, new notification channels, native apps, dark mode for the organizer or light mode for the viewer, multi-organizer boards, any change to how scores are sourced or scheduled.
