# Broadcast Glass Stage 8: Landing Atmosphere — Color, Scroll, Micro-interaction

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The landing page stops reading as one flat dark plane: each section carries its own ambient brand tone, the ground lifts off pure black, and scroll reveals plus control micro-interactions give the page life without adding a single new hue.

**Direction — "Stadium Light":** A board is watched from kickoff into the night. Scrolling travels through that: cardinal at the hero, field green at the live-score moment, neutral rest in the middle, warm gold at the organizer workroom, cardinal again to close. Color arrives as *light* (large, soft, low-alpha ground tints behind content) rather than as chromatic UI. The one `Spotlight` stays where it is, behind the hero artifact.

**Architecture:** Three new primitives — `SectionTone` (a zero-JS ambient ground tint), `Grain` (a fixed procedural noise overlay), and `Reveal` (an IntersectionObserver rise-and-fade wrapper whose resting state is *visible*, so no-JS and reduced-motion users see finished content). Section components opt into a tone and wrap their content in `Reveal`. Ground, panel, and hairline tokens lift; no new palette entries beyond ambient tint aliases derived from existing brand colors.

**Tech Stack:** React 19, Tailwind v4 `@theme inline` over `src/design/tokens.css`, IntersectionObserver, `prefers-reduced-motion`, Vitest (`--project unit`), Playwright chromium + `@axe-core/playwright`.

## Global Constraints

- **Palette discipline.** Only `--g-gold`, `--g-cardinal`, `--g-live` and neutrals. No purple. No multi-color gradients. No gradient text. No corner glows — tints sit along a section's vertical mid-edge, never in a corner. No uniform radius.
- **Reduced motion.** Every transform, transition, parallax, count-up, and ambient drift is disabled under `prefers-reduced-motion: reduce`. Content renders in its final state, immediately.
- **No-JS and no-observer safety.** A `Reveal`'s resting CSS state is fully visible. The hidden start state is applied only in a `useLayoutEffect`, only when JS is running and motion is allowed. `playwright-tests/homepage.spec.ts`'s no-JS test must pass unchanged.
- **No layout shift.** Reveals animate `opacity` and `translateY` only. Nothing reserves or collapses space. `document.documentElement.scrollWidth` must equal `clientWidth` at 390px and 1280px, before and after a full scroll.
- **The phone first viewport is sacred.** At 390×844 the hero must still hold, fully inside the viewport: the `h1`, `Create your free board`, `See a live board`, `First published board free`, and the money-boundary sentence. Do not add vertical padding to the hero on phone.
- **Contrast.** `tests/design/contrast.test.ts` stays green with the new ground. Every ambient tint is capped so text over it still meets WCAG AA; the axe sweep must report zero serious and zero critical on `/` and `/demo`.
- **Product truth.** `MONEY_BOUNDARY`, `PRICING` strings, `Score updates about every minute`, and every heading and body string on the homepage are unchanged. This stage changes color, motion, and shape only — not a word of copy.
- Do not touch `hooks/`, `services/`, `functions/`, `workers/`, `supabase/`, `seo/`, `build/`, `context/`, `*Model.ts`, lifecycle/draft models.
- Commit messages end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

### Task 1: Foundation — lifted ground, ambient tint tokens, Grain, SectionTone, Reveal

**Files:** modify `src/design/tokens.css`, `src/index.css`, `src/design/primitives/index.ts`, `DESIGN.md`, `docs/DESIGN_TOKENS.md`; create `src/design/primitives/SectionTone.tsx`, `src/design/primitives/Grain.tsx`, `src/design/primitives/Reveal.tsx`; test `tests/design/atmosphere.test.tsx`, additions to `tests/design/contrast.test.ts` and `tests/design/tokens.test.ts`.

**Interfaces produced:**
- Tokens on `[data-base="dark"]`: `--g-ground: #111318`, `--g-panel: rgba(255,255,255,0.07)`, `--g-panel-hover: rgba(255,255,255,0.10)`, `--g-hairline: rgba(255,255,255,0.12)`. Leave `[data-base="cream"]` untouched.
- New ambient aliases on `:root`, each a `color-mix` of an existing brand color with transparent, so no new hue enters the system: `--g-tint-cardinal`, `--g-tint-live`, `--g-tint-gold`. Each resolves to roughly 14% of its brand color.
- `SectionTone({ tone: 'cardinal' | 'live' | 'gold', side?: 'left' | 'right', className? })` — an `aria-hidden` absolutely positioned div inside a `relative` section. Renders one large soft radial (`min(1100px, 140vw)` square, `blur-[90px]`, opacity ~0.55) using the matching tint token, vertically centered on the section edge named by `side` (default `right`), never a corner. `pointer-events-none`. No animation.
- `Grain({ opacity? })` — a `fixed inset-0 pointer-events-none z-0 aria-hidden` layer painting an inline SVG `feTurbulence` data URI at `opacity` (default `0.035`), `mix-blend-mode: overlay`. Rendered once by `Homepage`.
- `Reveal({ children, as?, delay?, className? })` — wraps children in an element that is visible by default. On mount, `useLayoutEffect` checks `useReducedMotion()` and observer support; if animation is allowed it sets `data-reveal="pending"` (opacity 0, `translateY(20px)`) before paint, then an `IntersectionObserver` (`rootMargin: '0px 0px -10% 0px'`, `threshold: 0.1`) sets `data-reveal="in"` on first intersection and disconnects. `delay` (ms) becomes `transition-delay`. Transition: `opacity` and `transform`, `var(--g-dur-spring)`, `var(--g-ease-state)`. Server/no-JS/reduced-motion path renders with no `data-reveal` attribute at all and no transition.
- The `data-reveal` transitions live in `src/design/tokens.css` next to the existing keyframes, guarded so `@media (prefers-reduced-motion: reduce)` neutralizes them.

- [ ] Tests (`tests/design/atmosphere.test.tsx`): `Reveal` renders its children visible with no `data-reveal` attribute when `matchMedia` reports reduced motion; sets `pending` then `in` when an observer fires (stub `IntersectionObserver`); `SectionTone` is `aria-hidden` and carries `pointer-events-none`; `Grain` is `aria-hidden` and `fixed`. Contrast test: assert the new ground against `--g-text`, `--g-text-2`, `--g-text-3` at AA. Tokens test: assert the three tint aliases exist and are `color-mix` of brand colors, and that no token literal introduces a hue outside gold/cardinal/live/neutral.
- [ ] `DESIGN.md`: under Color, add the ambient-tone paragraph naming the five-section journey; amend anti-slop rule 3 to read that a page has one spotlight behind its artifact and that a section may carry one ambient ground tint, which is not a spotlight; under Motion, document `Reveal`'s visible-by-default contract and the parallax cap.
- [ ] Commit `design: lifted ground, ambient tone tokens, grain, and reveal`.

### Task 2: Hero — parallax, breathing spotlight, reveal, CTA feel

**Files:** modify `src/features/homepage/sections/Hero.tsx`, `src/features/homepage/sections/cta.ts`, `src/features/homepage/renders/PhoneFrame.tsx`, `src/design/primitives/Spotlight.tsx`, `src/features/homepage/Homepage.tsx`; create `src/features/homepage/atmosphere/useParallax.ts`; test additions in `tests/homepage/homepage.test.tsx`.

- `Homepage` renders `<Grain />` once inside `Base`, and each section is wrapped so tones can position against it.
- Hero gets `<SectionTone tone="cardinal" side="right" />` behind the artifact column, replacing nothing — the existing `<Spotlight />` stays.
- `Spotlight` gains an optional `breathe` prop: a 12s `ease-in-out` `scale(1 → 1.04)` alternate-infinite ambient drift, off under reduced motion (a CSS `@keyframes spotlight-breathe` in `tokens.css`, applied by class, neutralized in the reduced-motion block).
- `useParallax({ maxPx, disabled })` returns a ref and drives `transform: translate3d(0, Npx, 0)` from scroll position via `requestAnimationFrame`, clamped to `maxPx` (hero uses 40), `passive: true` listener, disconnected on unmount, and inert under reduced motion or below `md` (use `matchMedia('(min-width: 768px)')`). It must never write a horizontal transform, so overflow cannot change.
- The hero phone's rotation eases from `-3deg` toward `-1deg` across the same scroll range, applied in the same transform string. On phone the artifact keeps its current static rotation.
- Hero copy column wraps its eyebrow, `h1`, lede, CTA row, and proof list in `Reveal` with delays `0, 60, 120, 180, 240`. **Because the phone first-viewport test requires all of it inside 844px, the reveal must not delay visibility past the observer firing on load — these elements are above the fold, so they intersect immediately.**
- `cta.ts`: `primaryLink` and `quietLink` gain `hover:-translate-y-px`, a shadow bloom on hover (`hover:shadow-[0_8px_24px_-8px_var(--g-gold)]` for primary; a neutral bloom for quiet), and `active:translate-y-0 active:scale-[0.98]`, all on the existing `transition` with `var(--g-dur-state)`. `ghostLink` gains a left-to-right underline wipe using `background-image` + `background-size` transition rather than `text-decoration`.
- `PhoneFrame` gains a hover lift: `hover:-translate-y-1` and a deeper shadow, `transition-transform`, reduced-motion safe.

- [ ] Tests: hero still renders one `h1` and both CTAs; `useParallax` returns an inert ref and attaches no listener when reduced motion is on (stub `matchMedia`); `Spotlight` renders without the breathe class when reduced.
- [ ] Commit `homepage: hero parallax, breathing light, and control feel`.

### Task 3: Score section — field-green ambience and rolling numerals

**Files:** modify `src/features/homepage/sections/ScoreSection.tsx`, `src/features/homepage/artifacts/ScoreMoment.tsx`; create `src/features/homepage/atmosphere/useCountUp.ts`; test additions in `tests/homepage/artifacts.test.tsx`.

- Section becomes `relative` and carries `<SectionTone tone="live" side="left" />`. This is the broadcast moment; the green ambience is the point.
- Copy block and artifact each wrap in `Reveal` (delays `0` and `120`).
- `useCountUp(target: number, { durationMs = 900, disabled })` returns the current value; it starts only when a passed-in `started` flag flips true, eases with the same `power3.out` shape, and returns `target` immediately when `disabled` (reduced motion) or when the observer never fires. `ScoreMoment`'s two team scores use it, keyed off a `Reveal`-adjacent IntersectionObserver so the roll happens on entry, once.
- The quarter/clock line and the freshness stamp do **not** animate — they are truth, not decoration, and must be readable the instant they appear.
- The live dot in the score artifact gains a slow 2.4s opacity pulse in `--g-live`, off under reduced motion. It is decorative only; the word `Live` already carries the meaning.

- [ ] Tests: `useCountUp` returns the target immediately when disabled; `ScoreMoment` renders the true final scores in the DOM after the observer fires; the source and checked-time line is present and unanimated.
- [ ] Commit `homepage: score section ambience and rolling numerals`.

### Task 4: Parent moments and organizer — rest, warmth, artifact lift

**Files:** modify `src/features/homepage/sections/ParentMoments.tsx`, `src/features/homepage/sections/OrganizerSection.tsx`, `src/features/homepage/artifacts/BoardFragment.tsx`, `src/features/homepage/renders/OrganizerPreview.tsx`.

- `ParentMoments` carries no tone — it is the deliberate rest between the green and gold moments. Each of the three rows wraps in `Reveal` with a `120ms` stagger, and the row artifacts get the same hover lift as `PhoneFrame`.
- `OrganizerSection` becomes `relative` with `<SectionTone tone="gold" side="right" />`, copy and artifact each in `Reveal`.
- `BoardFragment`: the highlighted winning cell gets a single gold pulse when the fragment enters view (a 900ms `box-shadow`/`background` pulse, once, then rest). Decorative only — the `role="img"` label already names the winning square. Off under reduced motion.
- `OrganizerPreview` keeps its inert render untouched; only the wrapper gains the hover lift.

- [ ] Tests: existing `tests/homepage/renders.test.tsx` and `artifacts.test.tsx` stay green; add one asserting `BoardFragment` still exposes its `role="img"` label and that the pulse is class-driven, not a content change.
- [ ] Commit `homepage: moment reveals and organizer warmth`.

### Task 5: Price, close, footer — cardinal bookend and list feel

**Files:** modify `src/features/homepage/sections/PriceAndClose.tsx`, `src/features/site/SiteFooter.tsx`.

- The pricing section becomes `relative` with `<SectionTone tone="cardinal" side="left" />`, closing the loop the hero opened. The final CTA section stays untinted so the last thing on screen is the action, not the atmosphere.
- Pricing rows: hairline warms toward gold and the row background lifts to `bg-panel-hover` on hover and on `focus-within`, `var(--g-dur-state)`.
- The tier `Numeral` for the free tier picks up `text-tone-gold` so the free plan reads as the offer rather than as a row of equals.
- FAQ `<details>`: the `+`/`−` marker rotates 90° on open (transform, reduced-motion safe) and the answer fades in. Keep the two-glyph markup exactly as it is so the open/closed state is never conveyed by motion alone.
- Copy blocks, the plan list, and the FAQ each wrap in `Reveal`.
- `SiteFooter` guide links get the same left-to-right underline wipe as `ghostLink`.

- [ ] Tests: `tests/homepage/pricing.test.ts` and `tests/pricingCopyConsistency.test.ts` stay green; add an assertion that all four FAQ questions and both markers are present in the DOM regardless of open state.
- [ ] Commit `homepage: pricing bookend and list interactions`.

### Task 6: Playwright, reduced motion, and the a11y sweep

**Files:** modify `playwright-tests/homepage.spec.ts`, `playwright-tests/axe.spec.ts`; `docs/accessibility-contract.md`.

- Add to `homepage.spec.ts`: with `reducedMotion: 'reduce'` context, every section's content is visible without scrolling to it (query one heading per section directly after `goto`, no scroll) and no element carries `data-reveal="pending"`; after a full scroll at 390px and 1280px, `scrollWidth === clientWidth`; the existing no-JS test is unchanged and must pass.
- Add a scroll-reveal test: at 1280px, a below-fold section heading reaches `opacity: 1` after being scrolled into view.
- `axe.spec.ts`: its `settle()` already scrolls the page, which now also triggers every reveal; confirm `/` still reports zero serious and zero critical, and that the tinted sections do not drop any text below AA.
- `docs/accessibility-contract.md`: document the reveal contract (visible resting state, motion-gated) and the ambient tint contrast cap.

- [ ] Run `npx playwright test --project=chromium --reporter=line` twice for stability.
- [ ] Commit `homepage: reveal and reduced-motion contract`.

### Task 7: Gate (controller)

- Browser verification at 1280px and 390px: full-page screenshots of every section, a reduced-motion pass, console and network error check, and confirmation that the phone hero still holds the five required elements inside 844px.
- `npx tsc --noEmit`, full unit suite, `npm run build`, `npm run design:lint`, full Playwright.
- Log stage 8 in `docs/REFACTOR_LOG.md`; final whole-branch review; merge to `main`. **Do not push or deploy** — the owner sees the screenshots and calls it.
