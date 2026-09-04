# Broadcast Glass Stage 9: The Board Fills

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A second beat right after the hero where an empty 10×10 board fills with real names as you scroll, then the numbers draw and one square lights — the product telling its own story, with no video and no 3D.

**Direction:** The owner reviewed apple.com/mac-studio and approved four techniques: a held visual with stat lines accumulating beside it, meters that grow on entry, rim lighting on the device artifact, and — the centrepiece — an empty grid that fills in. The dark aesthetic stays; there is **no** cream full-bleed flip and no gradient text (still banned). Apple's version leans on rendered film; ours leans on the real board, which is the stronger asset and the one anti-slop rule 1 demands.

**Architecture:** One new artifact, `BoardFill`, renders a complete 10×10 board in its final filled state and animates *backwards* from it. Fill progress is a single CSS custom property on the container; each cell carries a threshold and resolves its own opacity in pure CSS, so a scroll frame costs one style write, not a hundred. The section holds the board sticky on desktop while three fact lines accumulate beside it. Reduced motion, no-JS, and no-observer all render the finished board immediately.

**Tech Stack:** React 19, Tailwind v4 over `src/design/tokens.css`, IntersectionObserver + a rAF-throttled scroll listener, Vitest (`--project unit`), Playwright chromium + `@axe-core/playwright`.

## Global Constraints

- **The resting state is the finished board.** With no JS, no `IntersectionObserver`, or `prefers-reduced-motion: reduce`, `BoardFill` renders every name, both axes, and the lit winning square immediately, with no transition. The empty start state is applied only in a `useLayoutEffect`, only when animation is allowed. This is the same contract `Reveal` already holds — read `src/design/primitives/Reveal.tsx` before writing it.
- **One style write per frame.** Do not toggle classes or attributes on 100 cells. The container carries `--fill-progress` (unitless 0→1); each cell carries a `--fill-threshold` (unitless 0→1) set once at render; the cell resolves its own state with `clamp(0, calc((var(--fill-progress) - var(--fill-threshold)) * 12), 1)`. Both custom properties must be registered with `@property` (`syntax: '<number>'`, `inherits: false`, `initial-value: 0`) so they interpolate and so a missing value cannot break the clamp.
- **Real names and real numbers.** Reuse `src/features/homepage/demoData.ts`. No `Player 1`, no lorem, no invented payouts. OPEN squares stay legible and labelled.
- **Anti-slop:** no purple, no multi-color gradient, no gradient text, no corner-anchored glow, no new hue, no three-up feature grid. Gold marks the winning square; the live green and cardinal tones stay as they are.
- **Tailwind v4 transform rule:** `rotate-*`/`translate-*`/`scale-*` compile to the independent `rotate`/`translate`/`scale` properties, which compose with `transform` and are **not** covered by a `transition-[…transform]` list. Name the property you actually animate. See `src/features/homepage/atmosphere/useParallax.ts` and `src/design/primitives/Capsule.tsx` for the corrected pattern.
- **The phone first viewport is sacred.** `playwright-tests/homepage.spec.ts` asserts that at 390×844 the hero's `h1`, both CTAs, `First published board free`, and the money-boundary sentence sit fully inside 844px. This stage adds a section *below* the hero and must not touch that.
- **No horizontal overflow** at 390px or 1280px, before or after a full scroll. Sticky positioning must not create it.
- **Copy:** any new line is short, specific, and dry. Never `pool`, `contest`, `league`, `player`, or `guest`. No invented payout, fundraising, or guarantee claims.
- Do not touch `hooks/`, `services/`, `functions/`, `workers/`, `supabase/`, `seo/`, `build/`, `context/`, `*Model.ts`, lifecycle/draft models.
- **Do not touch `docs/REFACTOR_LOG.md`, `hooks/usePoolData.ts`, or `tests/organizerPersistence.test.tsx`** — they carry another session's uncommitted work.
- Commit messages end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

### Task 1: `BoardFill` — the grid that fills

**Files:** create `src/features/homepage/artifacts/BoardFill.tsx`, `src/features/homepage/artifacts/fillOrder.ts`; modify `src/design/tokens.css` (the two `@property` registrations and the cell rules); test `tests/homepage/boardFill.test.tsx`.

**Interfaces produced:**
- `fillOrder(seed?: number): number[]` — a deterministic shuffle of `0..99`. Deterministic so the render is stable across reloads and testable; shuffled so the board fills the way a real one does, in scattered claims rather than a row-by-row sweep. Use a small seeded PRNG (mulberry32 or xorshift) written inline; do not add a dependency.
- `BoardFill({ progress?: number, className? })` — renders `demoBoard`'s 10×10 with its axis digits and the winning square. Cells are `aria-hidden` and the whole grid is one `role="img"` with a label naming the board, the matchup, and the winning square, so the animation is never the only carrier of meaning. Each cell sets `--fill-threshold` from its position in `fillOrder`. When `progress` is omitted the component is fully filled and static.
- Cell states, all resolved in CSS from the two custom properties: an unfilled cell shows the hairline outline only; a filled cell fades its name in and lifts to `bg-panel`; the winning cell additionally takes the gold treatment once progress passes its threshold.
- Axis digits use the existing `digit-roll` keyframe and appear only in the last 15% of progress, so numbers draw *after* the squares fill — which is the real order of operations on a board, and the thing organizers most often get wrong.

- [ ] Tests: renders 100 cells plus both axes with no `progress` prop and no custom property set; the `role="img"` label names the winning square; `fillOrder` is a permutation of 0..99, is stable for a given seed, and is not the identity; the winning square's index appears in the last quarter of the order so the payoff lands at the end; every cell carries a `--fill-threshold` between 0 and 1.
- [ ] Commit `homepage: a board that fills`.

### Task 2: The section — sticky board, accumulating facts

**Files:** create `src/features/homepage/sections/BoardFillSection.tsx`, `src/features/homepage/atmosphere/useScrollProgress.ts`; modify `src/features/homepage/Homepage.tsx`; test additions in `tests/homepage/homepage.test.tsx`.

- `useScrollProgress({ ref, disabled })` returns nothing and instead writes `--fill-progress` directly onto the element via `el.style.setProperty`, rAF-throttled, `{ passive: true }`, cleaned up on unmount, and completely inert under reduced motion or when `disabled`. Progress is the section's travel through the viewport clamped to 0→1. Follow `useParallax.ts` for the shape, including the `matchMedia` change subscription.
- `BoardFillSection`: `relative overflow-x-clip`, content capped at 1200px like every other section (see `Hero.tsx`). Two columns on `md`: the board sticky at `top-24` on the left, the copy on the right. Below `md` the board is **not** sticky and renders filled — a phone should not fight a pinned element.
- Three fact lines accumulate as progress advances, each preceded by a short vertical rule in `text-fg-3` (the tick device from the reference). Each is a real fact about the product, not a claim: the number of squares, that OPEN stays visible, and that numbers are drawn only after the board is full. Draft copy — the implementer may tighten wording but not add claims:
  - `100 squares. Your group fills them.`
  - `OPEN stays visible, so nobody argues about who had what.`
  - `Numbers are drawn only once the board is full.`
- Section heading and eyebrow in the established scale (`Eyebrow`, `font-display text-[34px] md:text-[44px]`).
- Placed in `Homepage.tsx` directly after `<Hero />` and before `<ScoreSection />`.
- Under reduced motion the section renders the filled board and all three facts, with no sticky behaviour and no progress writes.

- [ ] Tests: the section renders the filled board and all three fact lines when reduced motion is on; `useScrollProgress` attaches no listener and writes nothing when reduced or disabled; the section is `overflow-x-clip` with capped content.
- [ ] Commit `homepage: the board fills as you scroll`.

### Task 3: Meters that grow, and rim light on the device

**Files:** modify `src/design/primitives/Ring.tsx`, `src/features/homepage/renders/PhoneFrame.tsx`, `src/design/tokens.css`; test additions in `tests/design/atmosphere.test.tsx`.

- `Ring` gains an optional `growOnEnter` prop: when set, and when motion is allowed and an observer exists, the ring animates its `stroke-dashoffset` from empty to its value once on first intersection, over `var(--g-dur-spring)`. Default off, so no existing caller changes. The organizer preview's `IslandRings` on the homepage opt in. The accessible label always states the real value, never the animating one.
- `PhoneFrame` gains a rim light: a hard, narrow specular highlight along the frame's top-left edge, built from a single-hue `linear-gradient` on a pseudo-element or an inset `box-shadow` — **not** a multi-color gradient, and not a corner glow. It is static, decorative, and must not change the frame's box size or introduce overflow. This is the detail that separates the reference's renders from flat panels.
- Verify against the tone bleed: the rim highlight must still read on all four toned sections.

- [ ] Tests: `Ring` with no `growOnEnter` renders its final `stroke-dashoffset` immediately; with `growOnEnter` under reduced motion it also renders the final value; the accessible label is the real value in both cases.
- [ ] Commit `homepage: meters grow on entry, device catches a rim light`.

### Task 4: Playwright, a11y, and the gate (controller)

- Extend `playwright-tests/homepage.spec.ts`: with `reducedMotion: 'reduce'`, the fill section shows a filled board (assert a known name is visible) and all three fact lines, without scrolling to it; at 1280px, scrolling through the section drives `--fill-progress` above 0 and the board ends filled; `scrollWidth === clientWidth` at 390px and 1280px after a full scroll; the existing phone first-viewport and no-JS tests are unchanged and still pass.
- `playwright-tests/axe.spec.ts` reports zero serious and zero critical on `/`, with the new section in place.
- Browser verification at 1440px and 390px: screenshots of the fill section at roughly 0%, 50%, and 100% progress, plus a reduced-motion pass; console and network error check.
- `npx tsc --noEmit`, full unit suite, `npm run build`, `npm run design:lint`, full Playwright twice for stability.
- Final whole-branch review; merge to `main`; push (this deploys). Screenshots to the owner.
