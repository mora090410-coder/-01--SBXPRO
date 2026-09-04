# GridOne Accessibility and Inclusive-Use Contract

**Status:** Product, design, and release authority
**Standard baseline:** WCAG 2.2 Level AA
**Executable half:** `playwright-tests/accessibility-contract.spec.ts`, with the homepage motion and reflow contract in `playwright-tests/homepage.spec.ts` and the automated WCAG sweep in `playwright-tests/axe.spec.ts`
**References:** W3C WCAG 2.2; WAI-ARIA Authoring Practices, grid and modal-dialog patterns

## Conformance posture

GridOne targets WCAG 2.2 Level AA across complete user processes, not isolated components. The product adopts stricter internal requirements where game-day conditions justify them — notably 44×44 CSS-pixel controls, which is above WCAG's minimum target-size criterion.

Automated tooling cannot prove conformance. Release evidence combines the Playwright contract spec, semantic queries in the unit suite, assistive-technology review, and human task testing. Do not claim formal conformance until the complete public and organizer processes have been evaluated and known exceptions documented.

Every requirement below that is written as an assertion is asserted somewhere in `playwright-tests/accessibility-contract.spec.ts`. If a requirement is not testable there, it is marked as a manual gate.

## Complete processes in scope

**Organizer:** sign in and sign up · create draft · fill and edit assignments · block selection and assignment · reconcile and acknowledge open squares · draw and commit axes · preview · publish and checkout · recover a save conflict · operate manual scoring · correct published labels and milestones · review the Final record.

**Viewer:** open a published link · understand score authority and freshness · find my squares · read personal coordinates, current result, and scenarios · inspect the exact grid · verify winner email · understand pending, resolved, corrected, and OPEN results · use the Final record.

**Supporting:** homepage and demo · dashboard · articles, terms, privacy · invalid, unpublished, deleted, offline, and error states.

## Site landmarks

Every site route — homepage, articles hub, guides, legal, login, 404 — renders, via `src/features/site/`:

- one `banner` header carrying the `GridOne` wordmark link and the signed-out `Sign in` control (or the signed-in `Your boards` / `Log out` controls);
- one `main`;
- one `contentinfo` footer listing the guides, `All guides`, `Sign in`, `Privacy`, and `Terms`.

Focused, short-lived routes (the checkout return, 404) may omit the footer but never the header or `main`. The wordmark and the header sign-in control are the first two tab stops and both render a visible focus ring. The homepage `Sign in` link meets the 44×44 target contract.

## Semantic structure

- One descriptive page title and exactly one `h1` per primary route state. The homepage has one `h1`; the viewer's `h1` is carried by `ScoreInstrument` (an `h2` inside organizer preview, where the shell is a `section`, not a `main`).
- The viewer `main` is named `{board title} viewer`; the organizer `main` is named `{board title} workspace`.
- Landmarks are intentional. Heading order reflects hierarchy and never exists only for styling.
- Native semantics before ARIA: lists, tables, forms, `role="status"`, `role="alert"`.
- Visual order matches DOM and reading order.
- Icon-only controls have durable accessible names.
- Demonstration data is identified in visible and accessible text — the `/demo` route announces itself in its `h1` (`Demo: …`) and in body text.

## Keyboard and focus

- Every function available to pointer or touch is available to keyboard.
- No positive `tabindex`.
- Focus order follows task order and is always visible; the app-wide rule is a 3px outline that inverts to gold on dark and cardinal grounds (`src/index.css`), and Broadcast Glass primitives manage their own equivalent ring.
- Route and major state transitions place focus at the new task heading or result.
- Programmatic scroll never moves focus to a hidden or offscreen element. `View on board` and `Center selected square` move the viewport, not focus, until explicitly activated.
- Focus is never trapped outside a true modal dialog.
- Forced-colors mode preserves focus indicators and boundaries; the spec checks a focused field under forced colors.

## Board interaction pattern

The 10×10 viewer and organizer boards are composite interactive grids, not 100 independent page tab stops.

### Common

- `Tab` enters the grid once, at the current, selected, or first meaningful cell. **Exactly one cell is in the page tab sequence at a time** — asserted.
- Arrow keys move one cell. `Home` / `End` move to the first/last cell in the row.
- Moving focus scrolls the cell into view without losing top/side orientation; the axes are sticky.
- Row and column headers name the team and digit.
- A cell's accessible name includes assignment or OPEN state, coordinate, and both digits — e.g. `Ann, coordinate row 1 column 1, top digit 0, side digit 0`.
- Focus, personal selection, current result (`NOW`), and resolved winner remain visually and semantically distinguishable — never by color alone.

### Viewer grid

- Read-only. The grid never implies editability.
- `Board controls` group: `Zoom in`, `Zoom out`, `Fit`, `Current zoom`, `Center selected square`, `Center current result`.

### Organizer assignment grid

- Every square has a durable name: `Square {n}, unassigned` or `Square {n}, assigned to {name}` — all 100 addressable by name, asserted.
- Activating a square opens the dialog `Square {n}` with initial focus on `Name on the board`, and returns focus to the originating cell on close.
- On a published board, only OPEN squares are editable; sold squares are disabled and the onscreen help says so.

### Organizer selection mode (range assignment)

- One toolbar button toggles the mode, reading `Select squares` / `Done selecting`, with `aria-pressed` reflecting the state.
- Only in selection mode do the squares expose `aria-pressed`; outside it the attribute is absent, so a square is not mistaken for a toggle.
- `Space` or click on a focused square toggles it; `Shift` with click or `Space` extends the rectangular block from the last anchor. A non-selected square in range keeps `aria-pressed="false"`.
- The inline apply bar is a `group` named `Assign selected squares`. It announces `{n} selected` in a polite live region and carries labelled `Name for these squares` and `Sold by (optional)` inputs, a `Payment` radiogroup (`Not asked yet` checked by default / `Unpaid` / `Paid`), `Apply to {n}`, and `Clear selection`. Applying renames every selected square and hides the bar.
- `Escape` on a square or inside the bar leaves selection mode; whenever the selection empties, focus returns to the toggle rather than being stranded.

The implementation may use a semantic table with managed roving focus or a valid ARIA grid. It must not duplicate conflicting table and grid roles.

## Touch and pointer

- Primary controls and board controls are at least 44×44 CSS pixels — asserted on the organizer status toggle, the homepage `Create your free board` / `See a live board` / `Sign in` controls, and the sign-in form's submit.
- Dense grid cells may be smaller because the board is a precision instrument; the selected-detail sheet and the pan/zoom controls carry the accessible touch interaction.
- No essential action depends on hover.
- Tap, drag/pan, and scroll gestures do not conflict with page scrolling.
- Gesture-only behavior has an equivalent visible control.
- Destructive actions never commit on pointer-down.

## Dialogs and sheets

Modal dialogs follow the WAI-ARIA dialog pattern:

- a real `role="dialog"` with `aria-modal="true"` only when outside content is genuinely inert;
- a visible title connected by `aria-labelledby` — `Find my squares`, `Square {n}`, `Private preview — sharing is off`, `Publish viewer link`, `Published`, `Choose a plan`;
- initial focus chosen by task and risk;
- `Tab` / `Shift+Tab` contained — asserted on the find-my-squares dialog, where tabbing past the last name in the browse list reaches `Close`;
- `Escape` closes unless closure would violate an explicitly explained critical process;
- a visible close or cancel action;
- focus returns to the trigger.

For irreversible, payment, publication, deletion, and public-correction dialogs, **initial focus lands on the least destructive safe action.** Asserted: `Publish viewer link` opens with `Cancel` focused; the open-square draw confirmation puts focus on `Keep assigning`.

Ordinary lists of actions stay buttons and links. Do not invent menu roles.

## Forms and validation

- Every input has a persistent visible label.
- Required and optional state is stated in text (`Sold by (optional)`).
- Errors identify the field, explain the problem, and suggest recovery. Asserted on the auth form: a `role="alert"` with `id="auth-error"` reading `No account found or incorrect password. Create one?` or `Passwords do not match`; the offending fields carry `aria-invalid="true"` and `aria-describedby="auth-error"`.
- The error is words, not a wordless icon — the alert contains zero `svg` children.
- Fields render a real boundary (`border-top-style: solid`), not a placeholder-only affordance.
- Submit failure preserves entered values.
- `autocomplete` and password managers are supported. Authentication requires no memory puzzle or transcription challenge.
- Checkout, publication, correction, and deletion provide review appropriate to their consequence — the publish dialog summarizes board name, matchup, kickoff, square counts, both axes, what becomes public, what remains private, and the season entitlement before the confirming button.

## Status, live regions, and score updates

Use live regions sparingly.

**Announce:** save failed, recovered, or conflicted; publication succeeded or failed; score authority changed; a material score or period change while the viewer is open; milestone pending, resolved, or corrected; notification verification and delivery results.

**Do not announce:** every background poll; an unchanged freshness timestamp; every autosave cycle; decorative animation.

Asserted: the viewer score region is `role="status"` and names its authority (`Offline · last known`, `Stale · last known`, `Refreshing`, `Manual score · Entered by the organizer`, `Final`) alongside the standing disclosure `Score updates about every minute`. The organizer save state announces `Save failed` as a `status`, and the revision conflict `This board changed in another session.` as an `alert` carrying `Reload latest board`.

## Blockers versus advisories

A blocker and an advisory must never look or sound alike. The organizer's `Before you can publish` region contains only hard blockers; `Private follow-up` contains only advisories. Asserted: OPEN-square and payment/seller follow-up text appears in the advisory region and **not** in the blocker region, and the island's `Draw numbers` stays enabled while only advisories remain.

## Color and contrast

- Normal text meets 4.5:1; large text 3:1; essential boundaries, focus, and meaningful graphics 3:1 against adjacent colors. `tests/design/contrast.test.ts` checks the token pairs in `src/design/tokens.css`.
- Disabled meaning is never expressed by low opacity alone.
- Live, selected, current winner, resolved winner, OPEN, stale, error, and corrected states all carry text or state semantics in addition to color.
- Forced-colors mode preserves boundaries, focus, and state.
- Ambient section tints (`SectionTone`, one large soft radial per section in cardinal, live green, or gold) are **light, not UI**. Each is capped so that text over it still meets its normal ratio: the tint token resolves to roughly 14% of its brand color, the layer renders at about 0.55 opacity behind content that carries its own stacking context, and no tint may raise or lower the effective ground past the pairs checked in `tests/design/contrast.test.ts`. A tint carries no meaning — removing every tint must change nothing a reader needs. The axe sweep over `/` and `/demo` reports zero serious and zero critical with the tints in place; a tint that drops any text below AA is a tint that must be reduced, not an exception to be filed.
- `npm run design:lint` supplements rendered contrast testing; it does not replace it.

## Reflow, zoom, and text

- At 320 and 390 CSS pixels the page has no horizontal overflow outside the intentional board viewport — asserted at both widths.
- Scroll-driven motion never widens the document. `document.documentElement.scrollWidth` equals `clientWidth` on the homepage at **390 and 1280 CSS pixels, both before and after a full scroll to the bottom** — asserted at both widths in `playwright-tests/homepage.spec.ts`. Reveals and parallax animate `opacity`, `translate`, and `rotate` on the vertical axis only, and reserve or collapse no space.
- At 400% browser zoom, content reflows without loss of information or function; the board stays in its controlled viewport.
- At 200% text scaling, controls, errors, dialogs, and sticky regions remain usable (manual gate).
- Long participant, organization, board, team, and correction text wraps or truncates with an accessible path to the full value.
- Sticky headers and the status islands never obscure focused content.

## Motion and sensory safety

- `prefers-reduced-motion` removes non-essential transforms, parallax, score rolls, and cinematic choreography; `src/design/primitives/motion.ts` collapses every duration to `--g-dur-reduced`.
- Reduced motion preserves all content and state — asserted: with reduced motion forced, the homepage `Scores update themselves.` heading and `Create your free board` link and the viewer's `Find my squares` button all remain reachable.
- No content flashes above safe thresholds. Motion is interruptible and never required to progress. No autoplaying sound.

### The reveal contract

Scroll reveals (`src/design/primitives/Reveal.tsx`, with the `[data-reveal]` rules in `src/design/tokens.css`) are decoration laid over finished content. They are bound by three rules, in this order:

1. **The resting state is visible.** Markup that carries no `data-reveal` attribute has no transition, no transform, and no opacity change. That is what a server render, a browser with JavaScript off, and a browser without `IntersectionObserver` all receive: the finished section, immediately. The hidden state is an attribute that only running JavaScript can add.
2. **The hidden state is motion-gated.** `Reveal` applies `data-reveal="pending"` from a `useLayoutEffect` — before paint, so there is no flash in either direction — and only when `prefers-reduced-motion` is not `reduce`. Under reduced motion the element carries no `data-reveal` attribute at all, and the reduced-motion CSS block neutralizes `pending` a second time in case the preference flips after mount.
3. **The observer is optional.** No content depends on an intersection ever being reported. If `IntersectionObserver` is absent the attribute is never set; if it is present but never fires, the element it governs was never scrolled to.

A reveal may therefore hide only what a reader has not yet reached. It may never gate a landmark, a heading a reader can already see, an error, a status message, or anything focusable that is reachable by `Tab` before the reveal fires.

Asserted in `playwright-tests/homepage.spec.ts`: in a `reducedMotion: 'reduce'` context and **without scrolling at all**, one heading from each of the homepage's six blocks is present at computed `opacity: 1`, and no element in the document carries `data-reveal` in any state. Separately, at 1280 pixels a below-fold section heading sits at `pending` with `opacity: 0` and reaches a computed `opacity: 1` once scrolled into view — polled to a timeout, never slept past. The no-JS test asserts the same headline, actions, and money boundary with JavaScript disabled.

Count-ups, the score pulse, the winning-cell pulse, the spotlight drift, and hero parallax follow the same shape: each renders its true final value when motion is reduced, when JavaScript is off, or when the observer never fires. A number that animates is never the only place that number appears.

## Loading, stale, offline, and recovery

- A loading state never presents stale data as current.
- A valid last-known score stays visible with its stale or offline label and timestamp, and states `Using the last-known score checked … until scoring reconnects.`
- Errors are specific to the affected object and retain recoverable work.
- Save conflicts block progression until resolved — `Review and publish` is disabled while the conflict stands, and the organizer's typed value survives.
- Invalid, unpublished, or deleted public states never render a plausible empty board.

## Content and cognition

- Canonical vocabulary: Board, Organizer, Viewer, Purchaser, Square, Axis digits, Publish. One concept, one name.
- Phase and status labels use plain language before technical explanation.
- A primary action describes its result (`Publish viewer link`, `Publish manual score`, `Publish correction and email both people`, `Draw with {n} OPEN`).
- Advisories do not masquerade as blockers.
- Error and recovery copy avoids blame.
- Time, price, allowance, score authority, and irreversible consequences are explicit.
- The viewer uses no "me" language before a name is selected.

## Automated gate

Required on every release:

- semantic queries in the unit suite — role, label, and text, never class names or test ids where a role exists;
- `npx playwright test --project=chromium`, which runs `accessibility-contract.spec.ts` over the signed-out auth errors, homepage, demo, published viewer, organizer draft workspace, selection mode, Reconcile, Draw, Preview and Publish, save conflict, viewer authority states, the find-my-squares dialog, board keyboard navigation, 320/390 reflow, reduced motion, and forced colors;
- `playwright-tests/homepage.spec.ts`, which carries the homepage reveal and reduced-motion contract, the no-JS fallback, the 390-pixel first viewport, and the 390/1280 overflow-after-scroll checks;
- zero critical or serious violations from the axe pass over every public route, including `/` and `/demo` with the ambient tints and scroll reveals in place, unless an explicit, time-bounded, documented exception is approved. Suppressing an axe rule to pass is not an exception; it is a removal of the check;
- `npm run design:lint`.

Add Firefox and WebKit runs before a whole-app release unless a documented environment blocker remains.

## Manual and assistive-technology gate

Before a whole-app release:

- VoiceOver with Safari on macOS and iOS;
- NVDA with Chrome or Firefox on Windows where available;
- keyboard-only completion of the organizer and viewer processes end to end;
- the touch phone process at a representative narrow viewport;
- 200% text and 400% zoom;
- reduced motion;
- forced colors / high contrast.

If a platform cannot be tested, disclose the gap. Do not imply coverage.

## Usability evidence

The moderated baseline includes inclusive-use scenarios where practical: keyboard-only organizer assignment, low-vision zoom and reflow, screen-reader viewer identity and board navigation, motor-control touch targets, and cognitive clarity for score authority and recovery. Do not recruit token participants to claim inclusion. Record the actual tasks, barriers, and fixes.

## Per-slice definition of done

A UI slice is not complete until semantics and accessible names are correct; keyboard, touch, and pointer paths work; focus and dialogs recover correctly; phone, zoom, long-content, loading, error, stale/offline, and success states are checked as applicable; the automated gates pass; the rendered result is inspected; any new exception is documented with an owner and a removal condition; and the complete journey still works.
