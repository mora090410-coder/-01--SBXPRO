# Broadcast Glass — Stage 3: Homepage

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace both landing pages (legacy `FilmLanding` and flagged `HomepageV2`) with one dark-base homepage built on the Broadcast Glass primitives, delete the `homepage_v2` flag, the film assets, and Lenis, and rewrite the tests that pin homepage copy.

**Architecture:** `src/features/homepage/Homepage.tsx` composes five section components under `src/features/homepage/sections/`. Demo data and pricing live in two small modules (`demoData.ts`, `pricing.ts`) so copy tests read one source. Hero and section artifacts are built from the primitives with the demo data (real team names, real digits, a true "wins now" state). Stage 6 swaps the artifacts for renders of the redesigned viewer and organizer once those exist. `App.tsx` renders `Homepage` at `/` unconditionally.

**Tech Stack:** React 19, react-router 7, Tailwind v4, Vitest + Testing Library, Playwright. Primitives from `src/design/primitives`.

**Spec:** `docs/superpowers/specs/2026-09-01-broadcast-glass-redesign-design.md` §3 (homepage), §2.6 (anti-slop). Pricing: `docs/pricing-recommendation-2026-09-01.md` (ship the live ladder unchanged).

## Global Constraints

- Dark base only (`<Base kind="dark">`). One `Spotlight` on the page, behind the hero artifact.
- Anti-slop: no icons, no illustrations, no three-up feature card rows, left-anchored asymmetric layout on desktop, single column on phone, real names and numbers, copy without "seamless / effortless / unlock / supercharge / elevate / powerful / robust".
- Marketing copy never contains: beta, synthetic, fallback, read-only, grounded, native, canonical, provenance, freshness, entitlement.
- Exact strings that MUST appear in `src/features/homepage/**` source (tests pin them):
  - `For youth-sports teams, booster clubs, schools, and community organizers`
  - `Viewers open the link without creating an account`
  - `First published board free`
  - `Do viewers need an account?` · `Does GridOne collect square money?` · `When do I pay?` · `Who can edit the board?`
  - `Ready to build the board?`
  - `organization naming, shared dashboard, and one organization receipt`
  - `GridOne tracks the board. It does not collect square money, hold funds, adjudicate off-platform payment, or pay winners.`
  - `1 published board per account per season` · `$9.99 once for up to 5 published boards in the 2026 season` · `$79 per season for up to 50 published boards`
  - `Demo board — sample names and scores` (the demo label required by `PRODUCT.md`)
  - `OPEN`
- Forbidden in the homepage corpus: `4.99`, `14.99`, `20 boards`, `introductory 2026 season pass`, and every phrase in `tests/productionCopy.test.ts` `internalPhrases`.
- Link targets are unchanged: `/create`, `/demo`, `/login?mode=signin`, `/articles`, `/privacy`, `/terms`, plus the twelve `/articles/...` routes.
- Every interactive control ≥ 44px tall (`min-h-11` on links; CapsuleButton md is 44px).
- Do not touch: `supabase/`, `functions/`, `workers/`, `services/`, `hooks/`, `context/`, `components/BoardView.tsx`, `pages/Login.tsx`, `components/auth/RequireAuth.tsx`.
- Viewer and organizer flags (`viewer_v2`, `organizer_v2`) stay this stage. Only `homepage_v2` is removed.
- Every task ends with `npx tsc --noEmit` and `npx vitest run --project unit` green. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File map

| Path | Responsibility |
|---|---|
| `src/features/homepage/pricing.ts` | The three live tiers, exact strings, one place. |
| `src/features/homepage/demoData.ts` | Demo game, live score, board (moved from `HomepageProofArtifact`). |
| `src/features/homepage/artifacts/HeroViewerCard.tsx` | Phone-shaped glass card: island strip, board name, your squares, wins-now line, board fragment. |
| `src/features/homepage/artifacts/ScoreMoment.tsx` | Full-width live score instrument. |
| `src/features/homepage/artifacts/BoardFragment.tsx` | 4×4 slice of the demo board with the winning cell in gold. |
| `src/features/homepage/artifacts/OrganizerCard.tsx` | Cream card: editable-looking name, board fragment, three rings. |
| `src/features/homepage/sections/Hero.tsx` | Section 1. |
| `src/features/homepage/sections/ScoreSection.tsx` | Section 2. |
| `src/features/homepage/sections/ParentMoments.tsx` | Section 3. |
| `src/features/homepage/sections/OrganizerSection.tsx` | Section 4. |
| `src/features/homepage/sections/PriceAndClose.tsx` | Section 5 incl. FAQ and footer index. |
| `src/features/homepage/Homepage.tsx` | Page composition, `data-testid="homepage"`. |
| `App.tsx` | `/` renders `Homepage`; flag branch removed; `HomepageProductFallback` kept as Suspense fallback. |
| `utils/featureFlags.ts` | `homepage_v2` removed. |
| `tests/homepage.test.tsx` | Replaces `tests/homepageV2.test.tsx`. |
| `playwright-tests/homepage.spec.ts` | Replaces `playwright-tests/homepage-v2.spec.ts`. |
| Deleted | `src/features/homepage/HomepageV2.tsx`, `HomepageProofArtifact.tsx`, `components/FilmLanding.tsx`, `components/filmLanding.css`, `lib/scrollRuntime.ts`, `public/film/`, `playwright-tests/hero-motion.spec.ts`, `tests/homepageV2.test.tsx`, `playwright-tests/homepage-v2.spec.ts`. |

---

### Task 1: Pricing and demo data modules

**Files:**
- Create: `src/features/homepage/pricing.ts`, `src/features/homepage/demoData.ts`
- Test: `tests/homepage/pricing.test.ts`

**Interfaces:**
- `PRICING: readonly Tier[]` where `Tier = { id: 'free' | 'gameday' | 'org'; name: string; price: string; priceNote: string; detail: string }`.
- `PRICING_SENTENCE` = `'Your first published board is free. Game Day is $9.99 once for up to 5 published boards in the 2026 season. Organization is $79 per season for up to 50 published boards.'`
- `MONEY_BOUNDARY` = `'GridOne tracks the board. It does not collect square money, hold funds, adjudicate off-platform payment, or pay winners.'`
- `demoGame: GameState`, `demoLive: LiveGameData`, `demoBoard: BoardData`, `DEMO_LABEL = 'Demo board — sample names and scores'`, `demoWinnerNow = 'Taylor M.'`, `demoWinnerSquares: Array<{ left: number; top: number }>` (Taylor's three squares as digit pairs).

- [ ] **Step 1: Write the failing test**

Create `tests/homepage/pricing.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { MONEY_BOUNDARY, PRICING, PRICING_SENTENCE } from '../../src/features/homepage/pricing';
import { DEMO_LABEL, demoBoard, demoLive, demoWinnerNow, demoWinnerSquares } from '../../src/features/homepage/demoData';

describe('pricing', () => {
  it('carries the three live tiers with exact detail strings', () => {
    expect(PRICING.map((t) => t.id)).toEqual(['free', 'gameday', 'org']);
    expect(PRICING[0].detail).toBe('1 published board per account per season');
    expect(PRICING[1].detail).toBe('$9.99 once for up to 5 published boards in the 2026 season');
    expect(PRICING[2].detail).toContain('$79 per season for up to 50 published boards');
    expect(PRICING[2].detail).toContain('organization naming, shared dashboard, and one organization receipt');
    expect(PRICING_SENTENCE).toBe('Your first published board is free. Game Day is $9.99 once for up to 5 published boards in the 2026 season. Organization is $79 per season for up to 50 published boards.');
    expect(MONEY_BOUNDARY).toBe('GridOne tracks the board. It does not collect square money, hold funds, adjudicate off-platform payment, or pay winners.');
  });
});

describe('demo data', () => {
  it('is labeled as a demo and the named winner really holds the current digits', () => {
    expect(DEMO_LABEL).toBe('Demo board — sample names and scores');
    const leftDigit = demoLive.leftScore % 10;
    const topDigit = demoLive.topScore % 10;
    const row = demoBoard.leftAxis.indexOf(leftDigit);
    const col = demoBoard.topAxis.indexOf(topDigit);
    expect(demoBoard.squares[row * 10 + col]).toEqual([demoWinnerNow]);
    expect(demoWinnerSquares).toContainEqual({ left: leftDigit, top: topDigit });
    expect(demoWinnerSquares.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --project unit tests/homepage/pricing.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `src/features/homepage/pricing.ts`**

```ts
export type TierId = 'free' | 'gameday' | 'org';

export interface Tier {
  id: TierId;
  name: string;
  price: string;
  priceNote: string;
  detail: string;
}

/** The live 2026 ladder. Change here, in Stripe, and nowhere else. */
export const PRICING: readonly Tier[] = [
  { id: 'free', name: 'Free', price: '$0', priceNote: 'per season', detail: '1 published board per account per season' },
  { id: 'gameday', name: 'Game Day', price: '$9.99', priceNote: 'once', detail: '$9.99 once for up to 5 published boards in the 2026 season' },
  { id: 'org', name: 'Organization', price: '$79', priceNote: 'per season', detail: '$79 per season for up to 50 published boards, organization naming, shared dashboard, and one organization receipt' },
];

export const PRICING_SENTENCE = 'Your first published board is free. Game Day is $9.99 once for up to 5 published boards in the 2026 season. Organization is $79 per season for up to 50 published boards.';

export const MONEY_BOUNDARY = 'GridOne tracks the board. It does not collect square money, hold funds, adjudicate off-platform payment, or pay winners.';
```

- [ ] **Step 4: Create `src/features/homepage/demoData.ts`**

Move the three objects from `src/features/homepage/HomepageProofArtifact.tsx` lines 6–53 verbatim (`demoGame`, `demoLive`, `demoBoard`; keep the `squares` mapping exactly, including `['Taylor M.']` at indexes 0, 27, 64, `['Ava R.']` at 12, 45, 88, `['OPEN']` at 9, 71, and `[]` elsewhere). Change `sourceName: 'Demo score'` to `sourceName: 'Sample score'`. Then append:

```ts
export const DEMO_LABEL = 'Demo board — sample names and scores';

export const demoWinnerNow = 'Taylor M.';

/** Taylor M.'s squares as (left digit, top digit) pairs, derived so copy can never drift from the board. */
export const demoWinnerSquares: Array<{ left: number; top: number }> = demoBoard.squares
  .map((names, index) => ({ names, index }))
  .filter(({ names }) => names[0] === demoWinnerNow)
  .map(({ index }) => ({ left: demoBoard.leftAxis[Math.floor(index / 10)], top: demoBoard.topAxis[index % 10] }));
```
Export `demoGame`, `demoLive`, `demoBoard` with `export const`.

- [ ] **Step 5: Run the test**

Run: `npx vitest run --project unit tests/homepage/pricing.test.ts`
Expected: PASS (2 tests). If the winner assertion fails, the `squares` mapping was not copied exactly; re-copy it.

- [ ] **Step 6: Commit**

```bash
git add src/features/homepage/pricing.ts src/features/homepage/demoData.ts tests/homepage/pricing.test.ts
git commit -m "homepage: pricing and demo data modules

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Artifacts

**Files:**
- Create: `src/features/homepage/artifacts/BoardFragment.tsx`, `ScoreMoment.tsx`, `HeroViewerCard.tsx`, `OrganizerCard.tsx`
- Test: `tests/homepage/artifacts.test.tsx`

**Interfaces:**
- `BoardFragment({ size?: 4 | 5; highlight: { left: number; top: number } })` renders a `size×size` slice of `demoBoard` whose rows/cols are chosen so the highlighted digit pair is inside; cells show the first name or `OPEN`; the highlighted cell is gold; axes labelled with the team abbreviations and digits. `aria-label="Board fragment, {name} holds {topAbbr} {top} across, {leftAbbr} {left} down"`.
- `ScoreMoment()` renders `Glass` with `Eyebrow` team names, two `Numeral` size xl, `CapsuleTag tone="live"` "Live · Q3", clock, and a mono line `Sample score · updated 6:42 PM` from `demoLive`.
- `HeroViewerCard()` renders a phone-shaped `Glass` (`w-[300px] aspect-[9/18.5]`), containing: a chyron capsule strip "KC 17 · PHI 14 · Q3", serif board name, `Eyebrow` "Your squares · Taylor M. · 3", three mono chips (`{topAbbr} {top} · {leftAbbr} {left}`), a gold line "Taylor M. wins right now", and a `BoardFragment` highlight on the winning pair. Bottom: `DEMO_LABEL` in mono 12px.
- `OrganizerCard()` renders `<div data-base="cream">` with a `Glass` containing the serif board name with a small mono "Saved" tick, the line "83 filled · 17 open · 6 unpaid", a `BoardFragment`, and `IslandRings` (83%, 50% gold, Drawn gold).

- [ ] **Step 1: Write the failing test**

Create `tests/homepage/artifacts.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BoardFragment } from '../../src/features/homepage/artifacts/BoardFragment';
import { HeroViewerCard } from '../../src/features/homepage/artifacts/HeroViewerCard';
import { OrganizerCard } from '../../src/features/homepage/artifacts/OrganizerCard';
import { ScoreMoment } from '../../src/features/homepage/artifacts/ScoreMoment';

describe('BoardFragment', () => {
  it('shows the winning cell in gold with a descriptive label', () => {
    render(<BoardFragment highlight={{ left: 7, top: 4 }} />);
    const grid = screen.getByRole('img', { name: /Taylor M\. holds PHI 4 across, KC 7 down/ });
    expect(grid).toBeInTheDocument();
    const gold = grid.querySelector('[data-cell="7-4"]');
    expect(gold?.className).toContain('bg-gold');
    expect(grid.textContent).toContain('OPEN');
  });
});

describe('ScoreMoment', () => {
  it('renders both scores with accessible labels and the live tag', () => {
    render(<ScoreMoment />);
    expect(screen.getByRole('img', { name: 'Kansas City 17' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Philadelphia 14' })).toBeInTheDocument();
    expect(screen.getByText('Live · Q3')).toBeInTheDocument();
    expect(screen.getByText(/Sample score/)).toBeInTheDocument();
  });
});

describe('HeroViewerCard', () => {
  it('shows the demo label, your squares, and the true wins-now line', () => {
    render(<HeroViewerCard />);
    expect(screen.getByText('Demo board — sample names and scores')).toBeInTheDocument();
    expect(screen.getByText('Your squares · Taylor M. · 3')).toBeInTheDocument();
    expect(screen.getByText('Taylor M. wins right now')).toBeInTheDocument();
    expect(screen.getByText('Lincoln Softball Booster Board')).toBeInTheDocument();
  });
});

describe('OrganizerCard', () => {
  it('is on the cream base with the reconcile line and three rings', () => {
    const { container } = render(<OrganizerCard />);
    expect(container.querySelector('[data-base="cream"]')).not.toBeNull();
    expect(screen.getByText('83 filled · 17 open · 6 unpaid')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /percent|drawn/i }).length).toBe(3);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --project unit tests/homepage/artifacts.test.tsx`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `src/features/homepage/artifacts/BoardFragment.tsx`**

```tsx
import React from 'react';
import { demoBoard, demoGame } from '../demoData';

interface BoardFragmentProps {
  highlight: { left: number; top: number };
  size?: 4 | 5;
  className?: string;
}

/** A slice of the demo board with one cell lit. Axes carry the real digits. */
export function BoardFragment({ highlight, size = 4, className = '' }: BoardFragmentProps) {
  const row = demoBoard.leftAxis.indexOf(highlight.left);
  const col = demoBoard.topAxis.indexOf(highlight.top);
  const rowStart = Math.max(0, Math.min(row - 1, 10 - size));
  const colStart = Math.max(0, Math.min(col - 1, 10 - size));
  const rows = Array.from({ length: size }, (_, i) => rowStart + i);
  const cols = Array.from({ length: size }, (_, i) => colStart + i);
  const holder = demoBoard.squares[row * 10 + col][0] ?? 'OPEN';
  const label = `Board fragment, ${holder} holds ${demoGame.topAbbr} ${highlight.top} across, ${demoGame.leftAbbr} ${highlight.left} down`;

  return (
    <div role="img" aria-label={label} className={`inline-grid gap-px bg-hairline rounded-cell overflow-hidden ${className}`.trim()} style={{ gridTemplateColumns: `28px repeat(${size}, minmax(0, 1fr))` }}>
      <div className="bg-ground" />
      {cols.map((c) => (
        <div key={`t${c}`} className="bg-ground h-7 flex items-center justify-center font-mono text-[12px] text-fg-3">{demoBoard.topAxis[c]}</div>
      ))}
      {rows.map((r) => (
        <React.Fragment key={`r${r}`}>
          <div className="bg-ground w-7 flex items-center justify-center font-mono text-[12px] text-fg-3">{demoBoard.leftAxis[r]}</div>
          {cols.map((c) => {
            const names = demoBoard.squares[r * 10 + c];
            const name = names[0] ?? '';
            const isOpen = name === 'OPEN' || name === '';
            const isHit = r === row && c === col;
            return (
              <div
                key={`c${r}-${c}`}
                data-cell={`${demoBoard.leftAxis[r]}-${demoBoard.topAxis[c]}`}
                className={`h-12 px-1 flex items-center justify-center text-center font-ui text-[12px] leading-tight rounded-cell ${isHit ? 'bg-gold text-ink font-medium' : isOpen ? 'bg-panel text-fg-3' : 'bg-ground text-fg'}`}
              >
                {isOpen ? 'OPEN' : name}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/features/homepage/artifacts/ScoreMoment.tsx`**

```tsx
import React from 'react';
import { CapsuleTag, Eyebrow, Glass, Numeral } from '../../../design/primitives';
import { demoGame, demoLive } from '../demoData';

const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).format(new Date(demoLive.retrievedAt));

/** Full-width live score instrument. The differentiator, shown as the product shows it. */
export function ScoreMoment() {
  return (
    <Glass as="section" aria-label="Live score" padding="lg" className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <Eyebrow>{demoGame.leftName}</Eyebrow>
          <Numeral value={demoLive.leftScore} size="xl" label={`${demoGame.leftName} ${demoLive.leftScore}`} />
        </div>
        <div className="flex flex-col items-center gap-2 pb-2">
          <CapsuleTag tone="live">Live · Q{demoLive.period}</CapsuleTag>
          <span className="font-mono tabular-nums text-[14px] text-fg-2">{demoLive.clock}</span>
        </div>
        <div className="flex flex-col items-end gap-3 text-right">
          <Eyebrow>{demoGame.topName}</Eyebrow>
          <Numeral value={demoLive.topScore} size="xl" label={`${demoGame.topName} ${demoLive.topScore}`} />
        </div>
      </div>
      <p className="font-mono text-[13px] text-fg-3">{demoLive.sourceName} · updated {time}</p>
    </Glass>
  );
}
```

- [ ] **Step 5: Create `src/features/homepage/artifacts/HeroViewerCard.tsx`**

```tsx
import React from 'react';
import { Eyebrow, Glass } from '../../../design/primitives';
import { BoardFragment } from './BoardFragment';
import { DEMO_LABEL, demoGame, demoLive, demoWinnerNow, demoWinnerSquares } from '../demoData';

const winning = { left: demoLive.leftScore % 10, top: demoLive.topScore % 10 };

/** Phone-shaped card showing what a parent sees at Q3. Built from primitives; stage 6 swaps in the real viewer. */
export function HeroViewerCard({ className = '' }: { className?: string }) {
  return (
    <Glass as="figure" aria-label="Sample game-day view" padding="none" className={`w-[300px] max-w-full flex flex-col gap-5 p-5 ${className}`.trim()}>
      <div className="self-center inline-flex items-center gap-3 h-10 px-4 rounded-capsule bg-chyron text-broadcast-white font-mono tabular-nums text-[14px]">
        <span>{demoGame.leftAbbr} {demoLive.leftScore}</span>
        <span className="text-broadcast-white/40">·</span>
        <span>{demoGame.topAbbr} {demoLive.topScore}</span>
        <span className="text-broadcast-white/40">·</span>
        <span className="text-live">Q{demoLive.period}</span>
      </div>
      <h3 className="font-display text-[26px] leading-[1.05] text-fg">{demoGame.title}</h3>
      <div className="flex flex-col gap-2">
        <Eyebrow>Your squares · {demoWinnerNow} · {demoWinnerSquares.length}</Eyebrow>
        <ul className="flex flex-wrap gap-2" aria-label="Your squares">
          {demoWinnerSquares.map((s) => (
            <li key={`${s.left}-${s.top}`} className="inline-flex items-center h-8 px-3 rounded-capsule border border-hairline font-mono tabular-nums text-[13px] text-fg">
              {demoGame.topAbbr} {s.top} · {demoGame.leftAbbr} {s.left}
            </li>
          ))}
        </ul>
      </div>
      <p className="font-ui text-[15px] font-medium text-gold">{demoWinnerNow} wins right now</p>
      <BoardFragment highlight={winning} className="self-start" />
      <figcaption className="font-mono text-[12px] text-fg-3">{DEMO_LABEL}</figcaption>
    </Glass>
  );
}
```

- [ ] **Step 6: Create `src/features/homepage/artifacts/OrganizerCard.tsx`**

```tsx
import React from 'react';
import { Glass, IslandRings } from '../../../design/primitives';
import { BoardFragment } from './BoardFragment';
import { demoGame } from '../demoData';

const rings = [
  { value: 0.83, label: '83 percent filled', caption: '83%' },
  { value: 0.5, label: '50 percent paid', caption: '50%', tone: 'gold' as const },
  { value: 1, label: 'Numbers drawn', caption: 'Drawn', tone: 'gold' as const },
];

/** The organizer workspace at a glance, on the cream base. Stage 6 swaps in the real workspace. */
export function OrganizerCard({ className = '' }: { className?: string }) {
  return (
    <div data-base="cream" className={`bg-ground text-fg font-ui rounded-card p-4 ${className}`.trim()}>
      <Glass as="figure" aria-label="Sample organizer workspace" padding="lg" className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-[28px] leading-none text-fg">{demoGame.title}</h3>
          <span className="font-mono text-[12px] text-fg-3">Saved</span>
        </div>
        <p className="font-mono text-[13px] text-fg-2">83 filled · 17 open · 6 unpaid</p>
        <BoardFragment highlight={{ left: 7, top: 4 }} size={5} />
        <div className="self-end inline-flex items-center h-14 px-5 rounded-capsule bg-chyron" data-base="dark">
          <IslandRings rings={rings} />
        </div>
      </Glass>
    </div>
  );
}
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run --project unit tests/homepage/artifacts.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add src/features/homepage/artifacts tests/homepage/artifacts.test.tsx
git commit -m "homepage: primitive-built artifacts for hero, score, organizer

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Sections and page

**Files:**
- Create: `src/features/homepage/sections/Hero.tsx`, `ScoreSection.tsx`, `ParentMoments.tsx`, `OrganizerSection.tsx`, `PriceAndClose.tsx`, `src/features/homepage/Homepage.tsx`
- Test: `tests/homepage/homepage.test.tsx`

**Interfaces:**
- `Homepage()` default export; root `<Base kind="dark">` with `data-testid="homepage"`; hero wrapper has `data-testid="homepage-first-viewport"`.
- A shared `ctaClass` for `Link`s styled as capsules lives in `sections/cta.ts`: `export const primaryLink = 'inline-flex items-center justify-center h-11 px-6 rounded-capsule bg-action text-action-text font-ui font-semibold text-[15px] hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-ground'` and `quietLink` = same geometry with `bg-panel border border-hairline text-fg hover:bg-panel-hover`, and `ghostLink` = `inline-flex items-center h-11 px-2 font-ui text-[15px] text-fg-2 hover:text-fg underline-offset-4 hover:underline`.

- [ ] **Step 1: Write the failing test**

Create `tests/homepage/homepage.test.tsx`:
```tsx
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Homepage from '../../src/features/homepage/Homepage';

const renderPage = () => render(<MemoryRouter><Homepage /></MemoryRouter>);

describe('Homepage', () => {
  it('puts identity, promise, one primary action, and the money boundary in the first viewport', () => {
    renderPage();
    const hero = screen.getByTestId('homepage-first-viewport');
    expect(within(hero).getByRole('heading', { level: 1 })).toHaveTextContent('Build it once. Share one link.');
    expect(within(hero).getByText(/For youth-sports teams, booster clubs, schools, and community organizers/)).toBeInTheDocument();
    expect(within(hero).getByRole('link', { name: 'Create your free board' })).toHaveAttribute('href', '/create');
    expect(within(hero).getByRole('link', { name: 'See a live board' })).toHaveAttribute('href', '/demo');
    expect(within(hero).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login?mode=signin');
    expect(within(hero).getByText('First published board free')).toBeInTheDocument();
    expect(within(hero).getByText('Viewers open the link without creating an account')).toBeInTheDocument();
    expect(within(hero).getByText(/does not collect square money, hold funds, adjudicate off-platform payment, or pay winners/)).toBeInTheDocument();
    expect(within(hero).getByText('Demo board — sample names and scores')).toBeInTheDocument();
  });

  it('shows the live score, the three parent answers, and the organizer screen', () => {
    renderPage();
    expect(screen.getByRole('region', { name: 'Live score' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Where are my squares?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Who wins right now?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What score wins next?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'One screen. No wizard.' })).toBeInTheDocument();
  });

  it('uses the exact pricing strings and keeps FAQ closed by default', () => {
    renderPage();
    expect(screen.getByText('1 published board per account per season')).toBeInTheDocument();
    expect(screen.getByText('$9.99 once for up to 5 published boards in the 2026 season')).toBeInTheDocument();
    expect(screen.getByText(/\$79 per season for up to 50 published boards, organization naming, shared dashboard, and one organization receipt/)).toBeInTheDocument();
    for (const q of ['Do viewers need an account?', 'Does GridOne collect square money?', 'When do I pay?', 'Who can edit the board?']) {
      const summary = screen.getByText(q);
      expect(summary.closest('details')?.open).toBe(false);
    }
    expect(screen.getByRole('heading', { name: 'Ready to build the board?' })).toBeInTheDocument();
  });

  it('closes with a footer index of guides and legal links', () => {
    renderPage();
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: /Run Your Pool alternative/i })).toHaveAttribute('href', '/articles/run-your-pool-alternative');
    expect(within(footer).getByRole('link', { name: 'All guides' })).toHaveAttribute('href', '/articles');
    expect(within(footer).getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    expect(within(footer).getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  });

  it('keeps every link and button at least 44px tall', () => {
    renderPage();
    for (const control of [...screen.getAllByRole('link'), ...screen.getAllByRole('button')]) {
      expect(control.className, control.textContent ?? '').toMatch(/\bh-11\b|\bh-13\b|\bmin-h-11\b/);
    }
  });

  it('never uses banned marketing or system vocabulary', () => {
    const { container } = renderPage();
    expect(container.textContent).not.toMatch(/\b(seamless|effortless|unlock|supercharge|elevate|powerful|robust|beta|synthetic|fallback|read-only|grounded|native|canonical|provenance|freshness|entitlement)\b/i);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --project unit tests/homepage/homepage.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Create `src/features/homepage/sections/cta.ts`**

```ts
const geometry = 'inline-flex items-center justify-center h-11 px-6 rounded-capsule font-ui text-[15px] transition-[background-color,color] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-ground';

export const primaryLink = `${geometry} bg-action text-action-text font-semibold hover:bg-action-hover`;
export const quietLink = `${geometry} bg-panel border border-hairline text-fg hover:bg-panel-hover`;
export const ghostLink = 'inline-flex items-center h-11 px-2 font-ui text-[15px] text-fg-2 hover:text-fg underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action rounded-control';
```

- [ ] **Step 4: Create `src/features/homepage/sections/Hero.tsx`**

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow, Spotlight } from '../../../design/primitives';
import { HeroViewerCard } from '../artifacts/HeroViewerCard';
import { MONEY_BOUNDARY } from '../pricing';
import { ghostLink, primaryLink, quietLink } from './cta';

export function Hero() {
  return (
    <section data-testid="homepage-first-viewport" className="relative overflow-hidden px-6 pt-6 pb-16 md:px-12 md:pt-8 md:pb-24">
      <header className="flex items-center justify-between h-11">
        <span className="font-display text-[22px] text-fg">GridOne</span>
        <Link to="/login?mode=signin" className={ghostLink}>Sign in</Link>
      </header>

      <div className="relative mt-10 grid gap-12 md:mt-16 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center">
        <div className="flex flex-col gap-6 max-w-[560px]">
          <Eyebrow>Football squares fundraiser boards</Eyebrow>
          <h1 className="font-display text-[44px] leading-[1] tracking-[-0.01em] text-fg md:text-[64px]">Build it once. Share one link.</h1>
          <p className="font-ui text-[17px] leading-[1.5] text-fg-2">
            Let the board run game day. For youth-sports teams, booster clubs, schools, and community organizers who would rather watch the game than the paper.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/create" className={primaryLink}>Create your free board</Link>
            <Link to="/demo" className={quietLink}>See a live board</Link>
          </div>
          <ul className="flex flex-col gap-1 font-ui text-[14px] text-fg-3">
            <li>First published board free</li>
            <li>Viewers open the link without creating an account</li>
            <li>{MONEY_BOUNDARY}</li>
          </ul>
        </div>

        <div className="relative flex justify-center md:justify-end">
          <Spotlight className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          <HeroViewerCard className="relative rotate-[-3deg] md:rotate-[3deg]" />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `src/features/homepage/sections/ScoreSection.tsx`**

```tsx
import React from 'react';
import { Eyebrow } from '../../../design/primitives';
import { ScoreMoment } from '../artifacts/ScoreMoment';

export function ScoreSection() {
  return (
    <section className="px-6 py-16 md:px-12 md:py-24 flex flex-col gap-8">
      <div className="flex flex-col gap-3 max-w-[560px]">
        <Eyebrow>The score follows the game</Eyebrow>
        <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">Scores update themselves.</h2>
        <p className="font-ui text-[17px] leading-[1.5] text-fg-2">
          You don't refresh, you don't type, you don't argue. Every score on the board shows where it came from and when it was checked, and you can enter a score yourself any time.
        </p>
      </div>
      <ScoreMoment />
    </section>
  );
}
```

- [ ] **Step 6: Create `src/features/homepage/sections/ParentMoments.tsx`**

```tsx
import React from 'react';
import { Eyebrow, Glass } from '../../../design/primitives';
import { BoardFragment } from '../artifacts/BoardFragment';
import { demoGame, demoLive, demoWinnerNow, demoWinnerSquares } from '../demoData';

const winning = { left: demoLive.leftScore % 10, top: demoLive.topScore % 10 };

const moments = [
  {
    heading: 'Where are my squares?',
    body: 'Type a name once. The board remembers it on that phone and lists every square as digits, with a tap to jump to the cell.',
    artifact: (
      <Glass padding="lg" className="flex flex-col gap-3">
        <Eyebrow>Your squares · {demoWinnerNow} · {demoWinnerSquares.length}</Eyebrow>
        <ul className="flex flex-wrap gap-2" aria-label="Your squares">
          {demoWinnerSquares.map((s) => (
            <li key={`${s.left}-${s.top}`} className="inline-flex items-center h-9 px-3 rounded-capsule border border-hairline font-mono tabular-nums text-[14px] text-fg">
              {demoGame.topAbbr} {s.top} · {demoGame.leftAbbr} {s.left}
            </li>
          ))}
        </ul>
      </Glass>
    ),
  },
  {
    heading: 'Who wins right now?',
    body: 'The current digits light one square. If it is yours, the board says so in one line, in gold.',
    artifact: (
      <Glass padding="lg" className="flex flex-col gap-4">
        <p className="font-ui text-[17px] font-medium text-gold">{demoWinnerNow} wins right now</p>
        <BoardFragment highlight={winning} />
      </Glass>
    ),
  },
  {
    heading: 'What score wins next?',
    body: 'A short list of scores that would put you on the winning square this quarter. Arithmetic, not odds or predictions.',
    artifact: (
      <Glass padding="lg" className="flex flex-col gap-3">
        <Eyebrow>Scores that make {demoWinnerNow} win Q{demoLive.period}</Eyebrow>
        <ul className="flex flex-col gap-2 font-mono tabular-nums text-[15px] text-fg">
          <li>{demoGame.leftAbbr} 20 · {demoGame.topAbbr} 14 <span className="text-fg-3">field goal</span></li>
          <li>{demoGame.leftAbbr} 17 · {demoGame.topAbbr} 21 <span className="text-fg-3">touchdown, extra point</span></li>
          <li>{demoGame.leftAbbr} 24 · {demoGame.topAbbr} 14 <span className="text-fg-3">touchdown, extra point</span></li>
        </ul>
      </Glass>
    ),
  },
];

export function ParentMoments() {
  return (
    <section className="px-6 py-16 md:px-12 md:py-24 flex flex-col gap-16">
      <div className="flex flex-col gap-3 max-w-[560px]">
        <Eyebrow>What a parent sees</Eyebrow>
        <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">Three answers, no scrolling.</h2>
      </div>
      {moments.map((m, i) => (
        <div key={m.heading} className={`grid gap-8 md:grid-cols-2 md:items-center ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
          <div className="flex flex-col gap-3 max-w-[460px]">
            <h3 className="font-display text-[28px] leading-[1.1] text-fg">{m.heading}</h3>
            <p className="font-ui text-[17px] leading-[1.5] text-fg-2">{m.body}</p>
          </div>
          <div className="max-w-[420px] md:justify-self-end">{m.artifact}</div>
        </div>
      ))}
    </section>
  );
}
```
The three "next score" rows must be true for the demo data: with KC 17 / PHI 14 and Taylor's digit pairs from `demoWinnerSquares`, compute which of the listed scores map to one of Taylor's pairs and adjust the three rows until each row's `(leftScore % 10, topScore % 10)` is in `demoWinnerSquares`. Write a unit assertion for that in Task 3 Step 8.

- [ ] **Step 7: Create `src/features/homepage/sections/OrganizerSection.tsx`**

```tsx
import React from 'react';
import { Eyebrow } from '../../../design/primitives';
import { OrganizerCard } from '../artifacts/OrganizerCard';

export function OrganizerSection() {
  return (
    <section className="px-6 py-16 md:px-12 md:py-24 grid gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
      <div className="flex flex-col gap-3 max-w-[460px]">
        <Eyebrow>For the organizer</Eyebrow>
        <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">One screen. No wizard.</h2>
        <p className="font-ui text-[17px] leading-[1.5] text-fg-2">
          Name the board, pick the game, tap squares to add names. Draw the numbers, preview the exact link your group will open, go live. Everything stays editable in place until kickoff, and only you can change it.
        </p>
        <p className="font-ui text-[15px] text-fg-3">OPEN squares stay visible so nobody argues about who had what.</p>
      </div>
      <OrganizerCard />
    </section>
  );
}
```

- [ ] **Step 8: Create `src/features/homepage/sections/PriceAndClose.tsx`**

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow, Glass, Numeral } from '../../../design/primitives';
import { MONEY_BOUNDARY, PRICING } from '../pricing';
import { ghostLink, primaryLink, quietLink } from './cta';

const guides: Array<{ path: string; label: string }> = [
  { path: '/articles/how-football-squares-work', label: 'How football squares work' },
  { path: '/articles/how-to-run-super-bowl-squares', label: 'How to run Super Bowl squares' },
  { path: '/articles/football-squares-fundraiser', label: 'Football squares fundraiser' },
  { path: '/articles/youth-sports-football-squares-fundraiser', label: 'Youth sports fundraiser squares' },
  { path: '/articles/booster-club-football-squares', label: 'Booster club squares' },
  { path: '/articles/church-school-football-squares-fundraiser', label: 'Church and school fundraiser squares' },
  { path: '/articles/office-super-bowl-squares', label: 'Office Super Bowl squares' },
  { path: '/articles/super-bowl-squares-ideas', label: 'Super Bowl squares ideas' },
  { path: '/articles/digital-football-squares-board-vs-paper', label: 'Digital board vs paper' },
  { path: '/articles/nfl-opening-week-squares-pool', label: 'NFL opening week squares' },
  { path: '/articles/football-squares-app', label: 'Football squares app' },
  { path: '/articles/run-your-pool-alternative', label: 'Run Your Pool alternative' },
];

const faq = [
  { q: 'Do viewers need an account?', a: 'No. Viewers open the link without creating an account. Only the organizer signs in.' },
  { q: 'Does GridOne collect square money?', a: `No. ${MONEY_BOUNDARY} Squares and payouts stay between you and your group.` },
  { q: 'When do I pay?', a: 'Building, editing, and previewing are free on every plan. Your first published board is free. You pay only when you publish a second board.' },
  { q: 'Who can edit the board?', a: 'Only the signed-in organizer. Everyone else sees the same live board. Published names change only through a visible, dated correction.' },
];

export function PriceAndClose() {
  return (
    <>
      <section className="px-6 py-16 md:px-12 md:py-24 grid gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
        <div className="flex flex-col gap-3 max-w-[460px]">
          <Eyebrow>2026 pricing</Eyebrow>
          <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">Free to start. Pay when you publish another.</h2>
          <p className="font-ui text-[15px] text-fg-3">{MONEY_BOUNDARY}</p>
        </div>
        <Glass as="section" aria-label="Plans" padding="none" className="divide-y divide-hairline">
          {PRICING.map((tier) => (
            <div key={tier.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 p-6 items-start">
              <div className="flex flex-col gap-1">
                <h3 className="font-ui text-[17px] font-medium text-fg">{tier.name}</h3>
                <p className="font-ui text-[15px] text-fg-2">{tier.detail}</p>
              </div>
              <Numeral value={tier.price} secondary={tier.priceNote} size="md" label={`${tier.price} ${tier.priceNote}`} />
            </div>
          ))}
        </Glass>
      </section>

      <section className="px-6 py-16 md:px-12 md:py-24 flex flex-col gap-8 max-w-[720px]">
        <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">Ready to build the board?</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/create" className={primaryLink}>Create your free board</Link>
          <Link to="/demo" className={quietLink}>See a live board</Link>
        </div>
        <div className="flex flex-col divide-y divide-hairline border-y border-hairline">
          {faq.map((item) => (
            <details key={item.q} className="group py-2">
              <summary className="min-h-11 flex items-center cursor-pointer font-ui text-[17px] text-fg list-none">{item.q}</summary>
              <p className="pb-4 font-ui text-[15px] leading-[1.5] text-fg-2">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="px-6 py-12 md:px-12 border-t border-hairline flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Eyebrow>Guides</Eyebrow>
          <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2 md:grid-cols-3">
            {guides.map((g) => (
              <li key={g.path}><Link to={g.path} className={ghostLink}>{g.label}</Link></li>
            ))}
            <li><Link to="/articles" className={ghostLink}>All guides</Link></li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="font-display text-[18px] text-fg">GridOne</span>
          <Link to="/login?mode=signin" className={ghostLink}>Sign in</Link>
          <Link to="/privacy" className={ghostLink}>Privacy</Link>
          <Link to="/terms" className={ghostLink}>Terms</Link>
        </div>
      </footer>
    </>
  );
}
```

- [ ] **Step 9: Create `src/features/homepage/Homepage.tsx`**

```tsx
import React from 'react';
import { Base } from '../../design/primitives';
import { Hero } from './sections/Hero';
import { OrganizerSection } from './sections/OrganizerSection';
import { ParentMoments } from './sections/ParentMoments';
import { PriceAndClose } from './sections/PriceAndClose';
import { ScoreSection } from './sections/ScoreSection';

export default function Homepage() {
  return (
    <Base kind="dark" className="overflow-x-hidden">
      <div data-testid="homepage" className="mx-auto max-w-[1200px]">
        <Hero />
        <ScoreSection />
        <ParentMoments />
        <OrganizerSection />
        <PriceAndClose />
      </div>
    </Base>
  );
}
```

- [ ] **Step 10: Add the next-score truth assertion**

Append to `tests/homepage/artifacts.test.tsx`:
```tsx
import { demoLive, demoWinnerSquares } from '../../src/features/homepage/demoData';
import { ParentMoments } from '../../src/features/homepage/sections/ParentMoments';
import { MemoryRouter } from 'react-router-dom';

describe('ParentMoments next scores', () => {
  it('lists only scores that land on the named winner\'s squares', () => {
    render(<MemoryRouter><ParentMoments /></MemoryRouter>);
    const list = screen.getByRole('heading', { name: 'What score wins next?' }).parentElement!.parentElement!.querySelector('ul')!;
    const rows = Array.from(list.querySelectorAll('li')).map((li) => li.textContent ?? '');
    expect(rows.length).toBe(3);
    for (const row of rows) {
      const [, left, top] = row.match(/KC (\d+) · PHI (\d+)/) ?? [];
      expect(demoWinnerSquares).toContainEqual({ left: Number(left) % 10, top: Number(top) % 10 });
    }
    expect(demoLive.period).toBe(3);
  });
});
```
Then adjust the three rows in `ParentMoments.tsx` until this passes. Taylor's pairs are derived from indexes 0, 27, 64 of `demoBoard`; compute them by hand from `leftAxis`/`topAxis` in `demoData.ts` and pick three realistic scores whose last digits match (touchdown = +7, field goal = +3, safety = +2).

- [ ] **Step 11: Run tests and type check**

Run: `npx vitest run --project unit tests/homepage && npx tsc --noEmit`
Expected: all pass.

- [ ] **Step 12: Commit**

```bash
git add src/features/homepage/sections src/features/homepage/Homepage.tsx tests/homepage
git commit -m "homepage: five-moment page on the dark base

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Wire `/`, remove the flag, delete the legacy landing

**Files:**
- Modify: `App.tsx`, `utils/featureFlags.ts`, `src/features/instrumentation/eventSchema.ts` (type only, see below), `.env.example`, `.env.production`, `vite.config.ts`, `package.json`, `index.html` (noscript copy), `global.d.ts` if it declares `__lenis`
- Delete: `src/features/homepage/HomepageV2.tsx`, `src/features/homepage/HomepageProofArtifact.tsx`, `components/FilmLanding.tsx`, `components/filmLanding.css`, `lib/scrollRuntime.ts`, `public/film/` (301 frames, 13 MB)
- Tests modified: `tests/featureFlags.test.ts`, `tests/homepageV2.test.tsx` (deleted), `tests/conversionPath.test.ts`, `tests/pricingCopyConsistency.test.ts`, `tests/productionCopy.test.ts`, `tests/instrumentationSchema.test.ts` (only if the type change forces it)

- [ ] **Step 1: Wire the route**

In `App.tsx`:
- Replace `const HomepageV2 = React.lazy(() => import('./src/features/homepage/HomepageV2'));` with `const Homepage = React.lazy(() => import('./src/features/homepage/Homepage'));`
- Delete `import FilmLanding from './components/FilmLanding';` and `import { resolveFeatureFlags } from './utils/featureFlags';` **only if** no other code in `App.tsx` uses `resolveFeatureFlags` (grep first; `BoardView` uses it, `App.tsx` may not).
- Replace the body of `Root` after the `poolId` early return with:
```tsx
  return <React.Suspense fallback={<HomepageProductFallback />}><Homepage /></React.Suspense>;
```
and remove the `featureFlags`, `navigate`, and `user` locals if now unused (keep `useSearchParams` for `poolId`).

- [ ] **Step 2: Remove the flag**

In `utils/featureFlags.ts`: `FEATURE_FLAG_NAMES = ['viewer_v2', 'organizer_v2'] as const`; remove `homepage_v2` from `DEFAULT_FLAGS` and from the `variants` object in `resolveFeatureFlags`. In `tests/featureFlags.test.ts` remove every `homepage_v2` key and expectation (the `FEATURE_FLAG_NAMES` equality, `isFeatureFlagName('homepage_v2')`, and each `.flags` object literal).

In `src/features/instrumentation/eventSchema.ts`, `FeatureVariant` is a literal union and line 79 lists the variants for validation. Keep both **unchanged**: recorded events from before this change may carry `homepage_v2:*` and the schema must keep accepting them. Add a one-line comment above the union: `// homepage_v2 variants are retained for historical events; the flag no longer exists.`

`.env.example` and `.env.production`: delete the `VITE_GRIDONE_HOMEPAGE_V2` lines.

- [ ] **Step 3: Delete the legacy landing and Lenis**

```bash
git rm -r components/FilmLanding.tsx components/filmLanding.css lib/scrollRuntime.ts public/film src/features/homepage/HomepageV2.tsx src/features/homepage/HomepageProofArtifact.tsx
npm uninstall lenis
```
In `vite.config.ts` `manualChunks`, change `if (id.includes('/gsap/') || id.includes('/lenis/')) return 'motion';` to `if (id.includes('/gsap/')) return 'motion';`.
If `global.d.ts` declares `__lenis` on `Window`, remove that declaration. In `playwright-tests/user-workflows.spec.ts:260` replace `window.__lenis` with `(window as unknown as { __lenis?: unknown }).__lenis`.
Check `public/llms.txt`, `public/sitemap.xml`, `README.md` for references to `/film/`; remove any.
Update `index.html` `<noscript>`: replace `<h1>Football-squares fundraiser boards</h1>` with `<h1>Build it once. Share one link.</h1>` and keep the rest.

- [ ] **Step 4: Update copy-pinning tests**

- `tests/conversionPath.test.ts`: change `source('src/features/homepage/HomepageV2.tsx')` to read and join `src/features/homepage/Homepage.tsx`, every file in `src/features/homepage/sections/`, and `src/features/homepage/pricing.ts`:
```ts
import { readdirSync } from 'node:fs';
const homepageCorpus = () => [
  'src/features/homepage/Homepage.tsx',
  'src/features/homepage/pricing.ts',
  ...readdirSync(resolve(process.cwd(), 'src/features/homepage/sections')).map((f) => `src/features/homepage/sections/${f}`),
].map(source).join('\n');
```
and use `homepageCorpus()` where `homepage` was.
- `tests/pricingCopyConsistency.test.ts`: in `currentPricingCopyFiles` replace the two `src/features/homepage/*` entries and `components/FilmLanding.tsx` with `src/features/homepage/pricing.ts`, `src/features/homepage/Homepage.tsx`, `src/features/homepage/sections/PriceAndClose.tsx`, `src/features/homepage/sections/Hero.tsx`. Delete the `FilmLanding` assertion (`Your first published board is free. Upgrade only when you need another.`). Rewrite the second test to read the homepage corpus instead of `FilmLanding`: assert it does not match the system-vocabulary regex, contains `See a live board`, and contains `First published board free`.
- `tests/productionCopy.test.ts`: in `liveCopyFiles` replace the two homepage entries with `src/features/homepage/Homepage.tsx`, `src/features/homepage/pricing.ts`, `src/features/homepage/demoData.ts`, `src/features/homepage/sections/Hero.tsx`, `src/features/homepage/sections/ScoreSection.tsx`, `src/features/homepage/sections/ParentMoments.tsx`, `src/features/homepage/sections/OrganizerSection.tsx`, `src/features/homepage/sections/PriceAndClose.tsx`, `src/features/homepage/artifacts/HeroViewerCard.tsx`, `src/features/homepage/artifacts/OrganizerCard.tsx`, `src/features/homepage/artifacts/ScoreMoment.tsx`, `src/features/homepage/artifacts/BoardFragment.tsx`.
- `git rm tests/homepageV2.test.tsx`.

- [ ] **Step 5: Full verification**

```bash
npx tsc --noEmit
npx vitest run --project unit
npm run build 2>&1 | tail -3
grep -rn "FilmLanding\|HomepageV2\|HomepageProofArtifact\|homepage_v2\|scrollRuntime\|lenis" --include='*.ts' --include='*.tsx' --include='*.json' --include='*.toml' . | grep -vE "node_modules|dist|docs/|eventSchema|instrumentationSchema"
```
Expected: tsc clean, suite green, build passes, and the grep returns nothing except the two instrumentation files.

- [ ] **Step 6: Commit**

```bash
git add -A App.tsx utils/featureFlags.ts src/features/instrumentation/eventSchema.ts .env.example .env.production vite.config.ts package.json package-lock.json index.html global.d.ts playwright-tests/user-workflows.spec.ts tests components lib public src/features/homepage
git commit -m "homepage: route / to the new page; remove homepage_v2 flag, FilmLanding, film frames, lenis

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Playwright and SEO

**Files:**
- Create: `playwright-tests/homepage.spec.ts`
- Delete: `playwright-tests/homepage-v2.spec.ts`, `playwright-tests/hero-motion.spec.ts`
- Modify: `playwright-tests/feature-flags-off.spec.ts` (drop the `/` route entry), `playwright-tests/accessibility-contract.spec.ts:236-262` (replace the two `fixme`s and the control names), `seo/publicRouteMetadata.ts` (`/` schema gets the three offers from `PRICING`)
- Test: existing `tests/staticSeo.test.ts` must stay green.

- [ ] **Step 1: Rewrite the homepage spec**

Create `playwright-tests/homepage.spec.ts`:
```ts
import { expect, test, type Locator } from '@playwright/test';

const firstViewport = async (page: import('@playwright/test').Page, height: number) => {
  const hero = page.getByTestId('homepage-first-viewport');
  await expect(hero).toBeVisible();
  const required: Array<[string, Locator]> = [
    ['heading', hero.getByRole('heading', { level: 1 })],
    ['create', hero.getByRole('link', { name: 'Create your free board' })],
    ['demo', hero.getByRole('link', { name: 'See a live board' })],
    ['free', hero.getByText('First published board free')],
    ['boundary', hero.getByText(/does not collect square money, hold funds, adjudicate off-platform payment, or pay winners/i)],
  ];
  for (const [label, locator] of required) {
    const box = await locator.boundingBox();
    expect(box?.y, label).toBeGreaterThanOrEqual(0);
    expect((box?.y || 0) + (box?.height || 0), label).toBeLessThanOrEqual(height);
  }
};

const overflow = (page: import('@playwright/test').Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('phone first viewport holds identity, actions, and the money boundary', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await firstViewport(page, 844);
  expect(await overflow(page)).toBe(0);
});

test('desktop first viewport holds the same and the demo card', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await firstViewport(page, 720);
  await expect(page.getByTestId('homepage-first-viewport').getByText('Demo board — sample names and scores')).toBeVisible();
  expect(await overflow(page)).toBe(0);
});

test('page has no horizontal overflow after full scroll on phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await overflow(page)).toBe(0);
});

test('demo handoff still leads to signup with create intent', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'See a live board' }).first().click();
  await expect(page.getByText('This is a sample board. Ready to run yours?')).toBeVisible();
  await page.getByRole('button', { name: 'Create your free board' }).click();
  await expect(page).toHaveURL(/\/login\?mode=signup&returnTo=%2Fcreate/);
});

test('no-JS fallback keeps the promise, the actions, and the boundary', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Build it once. Share one link.');
  await expect(page.getByRole('link', { name: /Create your free board/i })).toBeVisible();
  await expect(page.getByText(/does not collect square money/i)).toBeVisible();
  await context.close();
});
```
Check `playwright.config.ts` for a project or env that scoped `homepage-v2.spec.ts` (search `homepage`); if a project sets `VITE_GRIDONE_HOMEPAGE_V2`, remove that env entry so the new spec runs under the default project.

- [ ] **Step 2: Retire the other two specs and edit feature-flags-off**

```bash
git rm playwright-tests/homepage-v2.spec.ts playwright-tests/hero-motion.spec.ts
```
In `playwright-tests/feature-flags-off.spec.ts` delete the `{ path: '/', legacyText: ... }` entry and the `&homepage_v2=false` / `&homepage_v2=true` query fragments.

- [ ] **Step 3: Accessibility contract**

In `playwright-tests/accessibility-contract.spec.ts` lines 236–262:
- First test: delete the `test.fixme(...)` line; after the existing assertion add `await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);`.
- Second test: replace `page.getByRole('button', { name: 'Build your board — free' })` with `page.getByRole('link', { name: 'Create your free board' }).first()`.
- Third test: delete the `test.fixme(...)` line and replace the target with `page.getByRole('link', { name: 'Sign in' }).first()`.

- [ ] **Step 4: SEO offers**

In `seo/publicRouteMetadata.ts`, import `PRICING` from `../src/features/homepage/pricing` and, inside the `/` entry's `SoftwareApplication` object, set:
```ts
        offers: PRICING.map((tier) => ({
          '@type': 'Offer',
          name: tier.name,
          price: tier.price.replace('$', ''),
          priceCurrency: 'USD',
          description: tier.detail,
        })),
```
(If an `offers` array already exists there, replace it.) Confirm `index.html`'s static JSON-LD offers already match Free 0 / Game Day 9.99 / Organization 79; leave it.

- [ ] **Step 5: Run Playwright for the touched specs**

```bash
npx tsc --noEmit
npx vitest run --project unit tests/staticSeo.test.ts
npx playwright test playwright-tests/homepage.spec.ts playwright-tests/feature-flags-off.spec.ts playwright-tests/accessibility-contract.spec.ts --project=chromium 2>&1 | tail -20
```
Expected: all pass. If the Playwright config requires a running dev server it starts it itself (check `webServer` in `playwright.config.ts`); if a test fails because of copy, fix the page, not the test, unless the test asserts a legacy string.

- [ ] **Step 6: Commit**

```bash
git add -A playwright-tests seo/publicRouteMetadata.ts playwright.config.ts
git commit -m "homepage: playwright contract for the new page; offers in route schema

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Browser verification and stage gate

- [ ] **Step 1: Visual verification** (controller runs this)

Start `vite-dev`, open `/`, and check: console has no errors; fonts resolve (`h1` font-family starts with Instrument Serif); exactly one `Spotlight` element; the hero card is rotated; screenshots at desktop and 390px; Tab from the top reaches "Sign in" then "Create your free board" with a visible ring; the FAQ `details` open on click; the footer index lists twelve guides.

- [ ] **Step 2: Gate**

```bash
npx tsc --noEmit
npx vitest run --project unit
npm run build 2>&1 | tail -3
npm run design:lint 2>&1 | grep '"errors"'
du -sh dist
```
Expected: green; `dist` noticeably smaller than before (film frames gone).

- [ ] **Step 3: Log**

Append to `docs/REFACTOR_LOG.md`:
```markdown

## 2026-09-01 — Broadcast Glass stage 3: homepage

- **Scope:** one homepage at `/` built on the Broadcast Glass primitives (hero with a primitive-built Q3 viewer card, live score moment, three parent answers, organizer screen, pricing rows, FAQ, footer guide index). Removed `FilmLanding`, its 301 film frames, `lib/scrollRuntime.ts`, the `lenis` dependency, `HomepageV2`, `HomepageProofArtifact`, and the `homepage_v2` flag. Pricing and demo data now live in `src/features/homepage/pricing.ts` and `demoData.ts`.
- **Pricing:** live ladder unchanged per `docs/pricing-recommendation-2026-09-01.md`; route schema offers now derive from `PRICING`.
- **Deferred to stage 6:** replace the primitive-built hero and organizer artifacts with renders of the redesigned viewer and organizer.
- **Evidence:** unit suite, strict TypeScript, production build, design lint, Playwright homepage / feature-flags-off / accessibility-contract on Chromium, desktop and 390px screenshots reviewed.
- **Rollback:** revert this stage's commits; restores the flagged pair of landings and the film assets.
```
Commit: `docs: log broadcast glass stage 3`.
