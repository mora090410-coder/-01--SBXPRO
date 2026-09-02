# Broadcast Glass — Stage 1+2: Baseline Cleanup and Design Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove stale worktrees, then build the "Broadcast Glass" design foundation (tokens, fonts, motion, seven primitives, a kitchen-sink route, and a rewritten `DESIGN.md`) so stages 3–7 can rebuild each surface on it.

**Architecture:** Tokens live in one file, `src/design/tokens.css`, exposed to Tailwind v4 through `@theme inline` in `src/index.css`. Two bases (dark, cream) are selected with a `data-base` attribute; semantic variables flip per base so primitives never branch on base in JSX. Primitives are small React components in `src/design/primitives/`, each with a Vitest + Testing Library test. Legacy token aliases stay in `index.css` until stages 3–5 delete the legacy surfaces.

**Tech Stack:** React 19, Vite, Tailwind CSS v4 (`@tailwindcss/postcss`), Vitest + jsdom + Testing Library, GSAP 3 (island spring and draw animation later), Google Fonts (Instrument Serif, Geist, Geist Mono).

**Spec:** `docs/superpowers/specs/2026-09-01-broadcast-glass-redesign-design.md`

## Global Constraints

- Palette values are locked: cardinal `#8F1D2C` / deep `#6E1622`, gold `#FFC72C` / deep `#E0A600`, live `#22C55E`, ink `#0E0F12`, chyron `#16181D`, broadcast white `#EFF0F1`, newsprint `#DEE0E1`.
- Dark ground `#0B0C0F`; cream ground `#F5F1EA`.
- Radii: controls 12px, cards/sheets 20px, capsules 999px, grid cells 4px.
- Motion: state ease 200ms `cubic-bezier(0.2, 0, 0, 1)`; soft spring ~450ms; `prefers-reduced-motion` → 120ms opacity fade.
- Fonts: Instrument Serif (display), Geist (interface, weights 400/500/600), Geist Mono (data, eyebrow).
- Live green only for an in-progress NFL game. Gold is the only action color on dark; cardinal is the action color on cream.
- Essential interface text ≥ 14px.
- Anti-slop rules (spec §2.6) apply to the kitchen route too: no icons, no purple, no corner glows, real team names in samples.
- Do not touch: `supabase/`, `functions/`, `workers/`, `services/`, `hooks/`, `context/`, Stripe, email, API shapes.
- Do not delete branch `fix/cloudflare-espn-transport`.
- Every task ends with `npx tsc --noEmit` and `npx vitest run --project unit` green.
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File map

| Path | Responsibility |
|---|---|
| `src/design/tokens.css` | The only token source. Palette, per-base semantic variables, radii, type, motion. |
| `src/index.css` | Imports tokens, exposes them to Tailwind via `@theme inline`, keeps legacy aliases (temporary). |
| `src/design/primitives/motion.ts` | Curve constants and `useReducedMotion()`. |
| `src/design/primitives/Eyebrow.tsx` | Mono uppercase label. |
| `src/design/primitives/Capsule.tsx` | `CapsuleButton`, `CapsuleTag`, `CapsuleInput`. |
| `src/design/primitives/Glass.tsx` | Translucent panel. |
| `src/design/primitives/Spotlight.tsx` | Single radial glow, positioned behind an artifact. |
| `src/design/primitives/Numeral.tsx` | Tabular mono numeral with dimmed secondary segment. |
| `src/design/primitives/Sheet.tsx` | Bottom sheet dialog with focus trap and Escape. |
| `src/design/primitives/Island.tsx` | Expandable capsule with ring gauges. |
| `src/design/primitives/Ring.tsx` | SVG ring gauge used by Island. |
| `src/design/primitives/index.ts` | Barrel export. |
| `src/design/Base.tsx` | `<Base kind="dark"|"cream">` wrapper that sets `data-base`. |
| `src/design/kitchen/DesignKitchen.tsx` | Temporary `/design-kitchen` route rendering every primitive in both bases. |
| `DESIGN.md` | Rewritten contract with valid `@google/design.md` frontmatter. |
| `docs/DESIGN_TOKENS.md` | Rewritten mapping table. |
| `tests/design/*.test.tsx` | One test file per primitive plus a tokens contract test. |

---

### Task 1: Remove stale worktrees and branches

**Files:**
- Delete: `.worktrees/` (directory), `/private/tmp/gridone-phase4.*` worktree registration
- Branches deleted: `agent/gridone-2026-08-27`, `agent/gridone-2026-08-31`, `wt/t_604c1d6f`, `wt/t_e91e3922`

- [ ] **Step 1: Confirm nothing unique lives in the worktrees**

Run:
```bash
cd /Users/amm13/00-Projects/parkside/gridone-app
for w in .worktrees/*; do echo "== $w"; git -C "$w" status --short; git -C "$w" log --oneline main..HEAD; done
```
Expected: only modified files that are already committed on `main` in `9b800f9`, plus one untracked `docs/audits/launch-blocker-selection-2026-08-31.md` in `t_604c1d6f`. No commits ahead of `main`.

- [ ] **Step 2: Preserve the one untracked audit doc**

Run:
```bash
cp .worktrees/t_604c1d6f/docs/audits/launch-blocker-selection-2026-08-31.md docs/audits/
git add docs/audits/launch-blocker-selection-2026-08-31.md
git commit -m "docs: keep launch-blocker audit from worktree

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 3: Remove worktrees and branches**

Run:
```bash
for w in .worktrees/*; do git worktree remove --force "$w"; done
git worktree prune
git branch -D agent/gridone-2026-08-27 agent/gridone-2026-08-31 wt/t_604c1d6f wt/t_e91e3922
rmdir .worktrees 2>/dev/null; true
git worktree list
git branch
```
Expected: `git worktree list` shows only the main checkout. `git branch` shows `fix/cloudflare-espn-transport` and `main` only.

- [ ] **Step 4: Ignore future `.worktrees`**

Append to `.gitignore`:
```
# Agent worktrees
.worktrees
```
Run:
```bash
git add .gitignore && git commit -m "chore: ignore .worktrees

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Fonts and tokens

**Files:**
- Create: `src/design/tokens.css`
- Modify: `src/index.css` (top of file), `index.html` (font link and inline body style)
- Test: `tests/design/tokens.test.ts`

**Interfaces:**
- Produces CSS variables consumed by every later task. Semantic (flip per base): `--g-ground`, `--g-panel`, `--g-panel-hover`, `--g-hairline`, `--g-text`, `--g-text-2`, `--g-text-3`, `--g-action`, `--g-action-text`, `--g-action-hover`, `--g-shadow`, `--g-glow`. Fixed: `--g-cardinal`, `--g-cardinal-deep`, `--g-gold`, `--g-gold-deep`, `--g-live`, `--g-ink`, `--g-chyron`, `--g-white`, `--g-newsprint`, `--g-radius-control` (12px), `--g-radius-card` (20px), `--g-radius-capsule` (999px), `--g-radius-cell` (4px), `--g-font-display`, `--g-font-ui`, `--g-font-mono`, `--g-ease-state`, `--g-dur-state` (200ms), `--g-dur-spring` (450ms), `--g-dur-reduced` (120ms).
- Tailwind utilities produced by `@theme inline`: `bg-ground`, `bg-panel`, `border-hairline`, `text-fg`, `text-fg-2`, `text-fg-3`, `bg-action`, `text-action-text`, `font-display`, `font-ui`, `font-mono`, `rounded-control`, `rounded-card`, `rounded-capsule`, `rounded-cell`, plus fixed palette `bg-cardinal`, `bg-gold`, `text-gold`, `bg-live`.

- [ ] **Step 1: Write the failing tokens contract test**

Create `tests/design/tokens.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync('src/design/tokens.css', 'utf8');

describe('design tokens', () => {
  it('locks the palette', () => {
    for (const hex of ['#8F1D2C', '#6E1622', '#FFC72C', '#E0A600', '#22C55E', '#0E0F12', '#16181D', '#EFF0F1', '#DEE0E1']) {
      expect(tokens).toContain(hex);
    }
  });

  it('defines both grounds', () => {
    expect(tokens).toContain('#0B0C0F');
    expect(tokens).toContain('#F5F1EA');
  });

  it('defines the radius scale', () => {
    expect(tokens).toMatch(/--g-radius-control:\s*12px/);
    expect(tokens).toMatch(/--g-radius-card:\s*20px/);
    expect(tokens).toMatch(/--g-radius-capsule:\s*999px/);
    expect(tokens).toMatch(/--g-radius-cell:\s*4px/);
  });

  it('defines the two motion curves and reduced-motion override', () => {
    expect(tokens).toMatch(/--g-ease-state:\s*cubic-bezier\(0\.2,\s*0,\s*0,\s*1\)/);
    expect(tokens).toMatch(/--g-dur-state:\s*200ms/);
    expect(tokens).toMatch(/--g-dur-spring:\s*450ms/);
    expect(tokens).toContain('prefers-reduced-motion: reduce');
  });

  it('flips action color per base: gold on dark, cardinal on cream', () => {
    const dark = tokens.slice(tokens.indexOf('[data-base="dark"]'), tokens.indexOf('[data-base="cream"]'));
    const cream = tokens.slice(tokens.indexOf('[data-base="cream"]'));
    expect(dark).toMatch(/--g-action:\s*var\(--g-gold\)/);
    expect(cream).toMatch(/--g-action:\s*var\(--g-cardinal\)/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --project unit tests/design/tokens.test.ts`
Expected: FAIL with `ENOENT: no such file or directory, open 'src/design/tokens.css'`

- [ ] **Step 3: Create the tokens file**

Create `src/design/tokens.css`:
```css
/* Broadcast Glass tokens. Single source of truth. See DESIGN.md. */

:root {
  /* Locked palette */
  --g-cardinal: #8F1D2C;
  --g-cardinal-deep: #6E1622;
  --g-gold: #FFC72C;
  --g-gold-deep: #E0A600;
  --g-live: #22C55E;
  --g-ink: #0E0F12;
  --g-chyron: #16181D;
  --g-white: #EFF0F1;
  --g-newsprint: #DEE0E1;

  /* Shape */
  --g-radius-control: 12px;
  --g-radius-card: 20px;
  --g-radius-capsule: 999px;
  --g-radius-cell: 4px;

  /* Type */
  --g-font-display: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --g-font-ui: "Geist", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Helvetica, Arial, sans-serif;
  --g-font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* Motion */
  --g-ease-state: cubic-bezier(0.2, 0, 0, 1);
  --g-dur-state: 200ms;
  --g-dur-spring: 450ms;
  --g-dur-reduced: 120ms;

  /* Glass */
  --g-blur: 20px;
}

/* Dark base: viewer and homepage. Gold is the only action color. */
[data-base="dark"] {
  color-scheme: dark;
  --g-ground: #0B0C0F;
  --g-panel: rgba(255, 255, 255, 0.06);
  --g-panel-hover: rgba(255, 255, 255, 0.08);
  --g-hairline: rgba(255, 255, 255, 0.10);
  --g-text: var(--g-white);
  --g-text-2: rgba(239, 240, 241, 0.60);
  --g-text-3: rgba(239, 240, 241, 0.40);
  --g-action: var(--g-gold);
  --g-action-hover: var(--g-gold-deep);
  --g-action-text: var(--g-ink);
  --g-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
  --g-glow: color-mix(in srgb, var(--g-cardinal) 55%, transparent);
}

/* Cream base: organizer. Cardinal is the action color. */
[data-base="cream"] {
  color-scheme: light;
  --g-ground: #F5F1EA;
  --g-panel: rgba(255, 255, 255, 0.70);
  --g-panel-hover: rgba(255, 255, 255, 0.85);
  --g-hairline: rgba(14, 15, 18, 0.08);
  --g-text: var(--g-ink);
  --g-text-2: rgba(14, 15, 18, 0.60);
  --g-text-3: rgba(14, 15, 18, 0.40);
  --g-action: var(--g-cardinal);
  --g-action-hover: var(--g-cardinal-deep);
  --g-action-text: #FFFFFF;
  --g-shadow: 0 24px 48px rgba(14, 15, 18, 0.06);
  --g-glow: color-mix(in srgb, var(--g-gold) 30%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --g-dur-state: var(--g-dur-reduced);
    --g-dur-spring: var(--g-dur-reduced);
  }
}
```

- [ ] **Step 4: Expose tokens to Tailwind**

In `src/index.css`, replace the first line `@import "tailwindcss";` with:
```css
@import "tailwindcss";
@import "./design/tokens.css";

/* Broadcast Glass semantic utilities. Values resolve per data-base at runtime. */
@theme inline {
  --color-ground: var(--g-ground);
  --color-panel: var(--g-panel);
  --color-panel-hover: var(--g-panel-hover);
  --color-hairline: var(--g-hairline);
  --color-fg: var(--g-text);
  --color-fg-2: var(--g-text-2);
  --color-fg-3: var(--g-text-3);
  --color-action: var(--g-action);
  --color-action-hover: var(--g-action-hover);
  --color-action-text: var(--g-action-text);
  --color-cardinal: var(--g-cardinal);
  --color-cardinal-deep: var(--g-cardinal-deep);
  --color-gold: var(--g-gold);
  --color-gold-deep: var(--g-gold-deep);
  --color-live: var(--g-live);
  --color-ink: var(--g-ink);
  --color-chyron: var(--g-chyron);
  --color-broadcast-white: var(--g-white);
  --color-newsprint: var(--g-newsprint);
  --font-display: var(--g-font-display);
  --font-ui: var(--g-font-ui);
  --font-mono: var(--g-font-mono);
  --radius-control: var(--g-radius-control);
  --radius-card: var(--g-radius-card);
  --radius-capsule: var(--g-radius-capsule);
  --radius-cell: var(--g-radius-cell);
}
```
Then in the existing `@theme { ... }` block delete these eight lines, because `@theme inline` now owns those names:
```
    --color-cardinal: var(--gridone-color-brand-primary);
    --color-gold: var(--gridone-color-brand-accent);
    --color-live: var(--gridone-color-live);
    --color-broadcast-white: var(--gridone-color-broadcast-white);
    --color-newsprint: var(--gridone-color-newsprint);
    --color-ink: var(--gridone-color-ink);
    --color-chyron: var(--gridone-color-chyron);
    --color-cardinal-deep: var(--gridone-color-brand-primary-deep);
    --color-gold-deep: var(--gridone-color-brand-accent-deep);
    --radius-control: var(--gridone-radius-control);
    --radius-surface: var(--gridone-radius-surface);
```
Keep `--radius-surface` out of the delete list only if any legacy file uses `rounded-surface`; check with `grep -rn "rounded-surface" components pages src | head`. If it does, keep the line. Everything else in the legacy `@theme` block stays until stages 3–5.

- [ ] **Step 5: Swap the font link**

In `index.html`, replace the Google Fonts `<link href="https://fonts.googleapis.com/css2?family=Archivo...">` line with:
```html
    <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Archivo:wdth,wght@62.5..125,100..900&family=Chivo+Mono:wght@400;600;700&display=swap"
        rel="stylesheet">
```
(Archivo and Chivo Mono stay loaded until the legacy surfaces are deleted in stages 3–5.) Leave the inline `<style>` body rule alone; the `Base` wrapper in Task 3 sets ground and font for redesigned surfaces.

- [ ] **Step 6: Run the test and the build**

Run:
```bash
npx vitest run --project unit tests/design/tokens.test.ts
npx tsc --noEmit
npm run build 2>&1 | tail -5
```
Expected: test PASS (5 tests); tsc clean; build succeeds with no "unknown utility" warnings.

- [ ] **Step 7: Commit**

```bash
git add src/design/tokens.css src/index.css index.html tests/design/tokens.test.ts
git commit -m "design: broadcast glass tokens, fonts, tailwind theme

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Base wrapper and motion helpers

**Files:**
- Create: `src/design/Base.tsx`, `src/design/primitives/motion.ts`
- Test: `tests/design/base.test.tsx`, `tests/design/motion.test.ts`

**Interfaces:**
- Produces `Base`: `({ kind: 'dark' | 'cream'; className?: string; children }) => JSX` rendering `<div data-base={kind} class="min-h-screen bg-ground text-fg font-ui ...">`.
- Produces `motion.ts`: `EASE_STATE = 'cubic-bezier(0.2, 0, 0, 1)'`, `DUR_STATE = 200`, `DUR_SPRING = 450`, `DUR_REDUCED = 120`, `SPRING = { duration: 0.45, ease: 'power3.out' }` (GSAP config, overshoot-free), `useReducedMotion(): boolean`, `durations(reduced: boolean): { state: number; spring: number }`.

- [ ] **Step 1: Write failing tests**

Create `tests/design/base.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Base } from '../../src/design/Base';

describe('Base', () => {
  it('sets data-base and ground classes', () => {
    const { container } = render(<Base kind="cream"><p>hi</p></Base>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.base).toBe('cream');
    expect(root.className).toContain('bg-ground');
    expect(root.className).toContain('text-fg');
    expect(root.className).toContain('font-ui');
  });
});
```

Create `tests/design/motion.test.ts`:
```ts
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DUR_REDUCED, DUR_SPRING, DUR_STATE, EASE_STATE, durations, useReducedMotion } from '../../src/design/primitives/motion';

describe('motion', () => {
  it('exports the two curves', () => {
    expect(EASE_STATE).toBe('cubic-bezier(0.2, 0, 0, 1)');
    expect(DUR_STATE).toBe(200);
    expect(DUR_SPRING).toBe(450);
  });

  it('collapses both durations to the reduced value', () => {
    expect(durations(false)).toEqual({ state: 200, spring: 450 });
    expect(durations(true)).toEqual({ state: DUR_REDUCED, spring: DUR_REDUCED });
  });

  it('reads prefers-reduced-motion', () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduce'), media: q, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
    window.matchMedia = original;
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --project unit tests/design/base.test.tsx tests/design/motion.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

Create `src/design/Base.tsx`:
```tsx
import React from 'react';

export type BaseKind = 'dark' | 'cream';

interface BaseProps {
  kind: BaseKind;
  className?: string;
  children: React.ReactNode;
}

/** Root wrapper for a redesigned surface. Sets the base so semantic tokens resolve. */
export function Base({ kind, className = '', children }: BaseProps) {
  return (
    <div data-base={kind} className={`min-h-screen bg-ground text-fg font-ui antialiased ${className}`.trim()}>
      {children}
    </div>
  );
}
```

Create `src/design/primitives/motion.ts`:
```ts
import { useEffect, useState } from 'react';

export const EASE_STATE = 'cubic-bezier(0.2, 0, 0, 1)';
export const DUR_STATE = 200;
export const DUR_SPRING = 450;
export const DUR_REDUCED = 120;

/** GSAP config for the soft spring. power3.out has no overshoot. */
export const SPRING = { duration: DUR_SPRING / 1000, ease: 'power3.out' } as const;

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => (
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(QUERY).matches : false
  ));
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

export function durations(reduced: boolean): { state: number; spring: number } {
  return reduced ? { state: DUR_REDUCED, spring: DUR_REDUCED } : { state: DUR_STATE, spring: DUR_SPRING };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run --project unit tests/design/base.test.tsx tests/design/motion.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/design/Base.tsx src/design/primitives/motion.ts tests/design/base.test.tsx tests/design/motion.test.ts
git commit -m "design: Base wrapper and motion helpers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Eyebrow and Capsule primitives

**Files:**
- Create: `src/design/primitives/Eyebrow.tsx`, `src/design/primitives/Capsule.tsx`
- Test: `tests/design/eyebrow.test.tsx`, `tests/design/capsule.test.tsx`

**Interfaces:**
- `Eyebrow`: `({ children, className?, as?: 'p'|'span'|'div' }) => JSX`. Mono, uppercase, 12px, 0.12em tracking, `text-fg-3`.
- `CapsuleButton`: `React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'ghost'; size?: 'md' | 'lg' }`. Primary: `bg-action text-action-text font-medium`. Quiet: `bg-panel border border-hairline text-fg`. Ghost: transparent, `text-fg-2`, underline on hover. Renders `<button type="button">` unless `type` given.
- `CapsuleTag`: `({ children, tone?: 'neutral' | 'gold' | 'live' | 'cardinal'; className? })`. Mono 12px uppercase inside a hairline capsule. `live` tone is `bg-live/15 text-live` and must only be used for in-progress games (documented in JSDoc).
- `CapsuleInput`: `React.InputHTMLAttributes<HTMLInputElement> & { label: string; trailing?: React.ReactNode }`. Renders a visually associated `<label>` (visible unless `hideLabel`), capsule `<input>` 16px text, optional trailing slot.

- [ ] **Step 1: Write failing tests**

Create `tests/design/eyebrow.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Eyebrow } from '../../src/design/primitives/Eyebrow';

describe('Eyebrow', () => {
  it('renders mono uppercase muted text', () => {
    render(<Eyebrow>Native computer use</Eyebrow>);
    const el = screen.getByText('Native computer use');
    expect(el.className).toContain('font-mono');
    expect(el.className).toContain('uppercase');
    expect(el.className).toContain('text-fg-3');
  });
});
```

Create `tests/design/capsule.test.tsx`:
```tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CapsuleButton, CapsuleInput, CapsuleTag } from '../../src/design/primitives/Capsule';

describe('CapsuleButton', () => {
  it('defaults to type=button and primary action styling', () => {
    const onClick = vi.fn();
    render(<CapsuleButton onClick={onClick}>Create your board</CapsuleButton>);
    const btn = screen.getByRole('button', { name: 'Create your board' });
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.className).toContain('bg-action');
    expect(btn.className).toContain('rounded-capsule');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports quiet and ghost variants', () => {
    render(<><CapsuleButton variant="quiet">Sign in</CapsuleButton><CapsuleButton variant="ghost">Skip</CapsuleButton></>);
    expect(screen.getByRole('button', { name: 'Sign in' }).className).toContain('border-hairline');
    expect(screen.getByRole('button', { name: 'Skip' }).className).toContain('bg-transparent');
  });

  it('is disabled when disabled', () => {
    render(<CapsuleButton disabled>Go live</CapsuleButton>);
    expect(screen.getByRole('button', { name: 'Go live' })).toBeDisabled();
  });
});

describe('CapsuleTag', () => {
  it('renders tones', () => {
    render(<><CapsuleTag>Draft</CapsuleTag><CapsuleTag tone="live">Live</CapsuleTag><CapsuleTag tone="gold">Final</CapsuleTag></>);
    expect(screen.getByText('Live').className).toContain('text-live');
    expect(screen.getByText('Final').className).toContain('text-gold');
    expect(screen.getByText('Draft').className).toContain('border-hairline');
  });
});

describe('CapsuleInput', () => {
  it('associates the label and forwards value changes', () => {
    const onChange = vi.fn();
    render(<CapsuleInput label="Find my squares" value="" onChange={onChange} placeholder="Your name" />);
    const input = screen.getByLabelText('Find my squares');
    fireEvent.change(input, { target: { value: 'Carrie' } });
    expect(onChange).toHaveBeenCalled();
    expect(input.className).toContain('rounded-capsule');
  });

  it('renders a trailing slot', () => {
    render(<CapsuleInput label="Email" trailing={<CapsuleButton>Notify me</CapsuleButton>} />);
    expect(screen.getByRole('button', { name: 'Notify me' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --project unit tests/design/eyebrow.test.tsx tests/design/capsule.test.tsx`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

Create `src/design/primitives/Eyebrow.tsx`:
```tsx
import React from 'react';

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

/** One per section, above the headline. Mono, uppercase, letterspaced, muted. */
export function Eyebrow({ children, className = '', as: Tag = 'p' }: EyebrowProps) {
  return (
    <Tag className={`font-mono uppercase text-[12px] leading-none tracking-[0.12em] text-fg-3 ${className}`.trim()}>
      {children}
    </Tag>
  );
}
```

Create `src/design/primitives/Capsule.tsx`:
```tsx
import React, { useId } from 'react';

type Variant = 'primary' | 'quiet' | 'ghost';
type Size = 'md' | 'lg';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-action text-action-text font-medium hover:bg-action-hover',
  quiet: 'bg-panel border border-hairline text-fg hover:bg-panel-hover',
  ghost: 'bg-transparent text-fg-2 hover:text-fg hover:underline underline-offset-4',
};

const SIZE: Record<Size, string> = {
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-13 px-7 text-[17px]',
};

const BASE = 'inline-flex items-center justify-center gap-2 rounded-capsule font-ui leading-none select-none transition-[background-color,color,transform] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-ground';

export interface CapsuleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function CapsuleButton({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: CapsuleButtonProps) {
  return <button type={type} className={`${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`.trim()} {...rest} />;
}

type Tone = 'neutral' | 'gold' | 'live' | 'cardinal';

const TONE: Record<Tone, string> = {
  neutral: 'border border-hairline text-fg-2',
  gold: 'bg-gold/15 text-gold',
  /** Only for an in-progress NFL game. Never for generic emphasis. */
  live: 'bg-live/15 text-live',
  cardinal: 'bg-cardinal/15 text-cardinal',
};

interface CapsuleTagProps {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}

export function CapsuleTag({ children, tone = 'neutral', className = '' }: CapsuleTagProps) {
  return (
    <span className={`inline-flex items-center h-6 px-2.5 rounded-capsule font-mono uppercase text-[12px] leading-none tracking-[0.08em] ${TONE[tone]} ${className}`.trim()}>
      {children}
    </span>
  );
}

export interface CapsuleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hideLabel?: boolean;
  trailing?: React.ReactNode;
}

export function CapsuleInput({ label, hideLabel = false, trailing, className = '', id, ...rest }: CapsuleInputProps) {
  const autoId = useId();
  const inputId = id ?? `capsule-input-${autoId}`;
  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      <label htmlFor={inputId} className={hideLabel ? 'sr-only' : 'font-ui text-[14px] text-fg-2'}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          className="flex-1 h-12 px-5 rounded-capsule bg-panel border border-hairline text-fg text-[16px] font-ui placeholder:text-fg-3 outline-none transition-[border-color,background-color] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] focus:border-action focus:bg-panel-hover"
          {...rest}
        />
        {trailing}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run --project unit tests/design/eyebrow.test.tsx tests/design/capsule.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/design/primitives/Eyebrow.tsx src/design/primitives/Capsule.tsx tests/design/eyebrow.test.tsx tests/design/capsule.test.tsx
git commit -m "design: Eyebrow and Capsule primitives

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Glass, Spotlight, and Numeral primitives

**Files:**
- Create: `src/design/primitives/Glass.tsx`, `src/design/primitives/Spotlight.tsx`, `src/design/primitives/Numeral.tsx`
- Test: `tests/design/glass.test.tsx`, `tests/design/numeral.test.tsx`

**Interfaces:**
- `Glass`: `React.HTMLAttributes<HTMLDivElement> & { as?: 'div'|'section'|'article'; padding?: 'none'|'md'|'lg' }`. `bg-panel border border-hairline rounded-card backdrop-blur-[var(--g-blur)] shadow-[var(--g-shadow)]`.
- `Spotlight`: `({ className? })`. Absolutely positioned, `aria-hidden`, `pointer-events-none`, radial gradient from `--g-glow` to transparent, 720px, blur. The parent must be `relative`. One per page.
- `Numeral`: `({ value: string | number; secondary?: string; size?: 'sm'|'md'|'lg'|'xl'; className?; label?: string })`. Mono tabular. `secondary` renders in `text-fg-3` at the same baseline. `label` sets `aria-label` on the wrapper so screen readers read "Kansas City 21" rather than two fragments.

- [ ] **Step 1: Write failing tests**

Create `tests/design/glass.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Glass } from '../../src/design/primitives/Glass';
import { Spotlight } from '../../src/design/primitives/Spotlight';

describe('Glass', () => {
  it('renders a translucent card with hairline and card radius', () => {
    render(<Glass data-testid="g">content</Glass>);
    const el = screen.getByTestId('g');
    expect(el.className).toContain('bg-panel');
    expect(el.className).toContain('border-hairline');
    expect(el.className).toContain('rounded-card');
    expect(el.className).toContain('backdrop-blur');
  });

  it('supports a semantic tag', () => {
    render(<Glass as="section" aria-label="Score">x</Glass>);
    expect(screen.getByRole('region', { name: 'Score' }).tagName).toBe('SECTION');
  });
});

describe('Spotlight', () => {
  it('is decorative and non-interactive', () => {
    const { container } = render(<Spotlight />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.className).toContain('pointer-events-none');
    expect(el.className).toContain('absolute');
  });
});
```

Create `tests/design/numeral.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Numeral } from '../../src/design/primitives/Numeral';

describe('Numeral', () => {
  it('renders value and dimmed secondary with one accessible label', () => {
    render(<Numeral value="$14" secondary=".99" label="14 dollars and 99 cents" />);
    const el = screen.getByLabelText('14 dollars and 99 cents');
    expect(el.className).toContain('font-mono');
    expect(el.className).toContain('tabular-nums');
    expect(screen.getByText('.99').className).toContain('text-fg-3');
  });

  it('scales', () => {
    render(<Numeral value={21} size="xl" />);
    expect(screen.getByText('21').className).toContain('text-[72px]');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --project unit tests/design/glass.test.tsx tests/design/numeral.test.tsx`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

Create `src/design/primitives/Glass.tsx`:
```tsx
import React from 'react';

type Padding = 'none' | 'md' | 'lg';
const PAD: Record<Padding, string> = { none: '', md: 'p-5', lg: 'p-7' };

export interface GlassProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article';
  padding?: Padding;
}

/** Translucent panel. Fill, hairline, and shadow come from the active base. */
export function Glass({ as: Tag = 'div', padding = 'md', className = '', ...rest }: GlassProps) {
  return (
    <Tag
      className={`bg-panel border border-hairline rounded-card backdrop-blur-[var(--g-blur)] shadow-[var(--g-shadow)] transition-[background-color] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] ${PAD[padding]} ${className}`.trim()}
      {...rest}
    />
  );
}
```

Create `src/design/primitives/Spotlight.tsx`:
```tsx
import React from 'react';

interface SpotlightProps {
  className?: string;
}

/**
 * The one glow a page is allowed. Place it behind the hero artifact inside a `relative` parent.
 * Default position is centered; override with className (e.g. `right-[-10%] top-[-20%]`).
 */
export function Spotlight({ className = 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' }: SpotlightProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none w-[720px] h-[720px] rounded-full blur-[80px] opacity-80 ${className}`.trim()}
      style={{ background: 'radial-gradient(circle at center, var(--g-glow) 0%, transparent 65%)' }}
    />
  );
}
```

Create `src/design/primitives/Numeral.tsx`:
```tsx
import React from 'react';

type Size = 'sm' | 'md' | 'lg' | 'xl';
const SIZE: Record<Size, string> = {
  sm: 'text-[17px]',
  md: 'text-[28px]',
  lg: 'text-[44px]',
  xl: 'text-[72px]',
};
const SECONDARY: Record<Size, string> = {
  sm: 'text-[13px]',
  md: 'text-[17px]',
  lg: 'text-[24px]',
  xl: 'text-[36px]',
};

interface NumeralProps {
  value: string | number;
  secondary?: string;
  size?: Size;
  className?: string;
  /** Full spoken form, e.g. "Kansas City 21". Required when secondary is present. */
  label?: string;
}

/** Tabular mono figure with an optional dimmed secondary segment on the same baseline. */
export function Numeral({ value, secondary, size = 'md', className = '', label }: NumeralProps) {
  return (
    <span
      aria-label={label}
      className={`inline-flex items-baseline gap-0.5 font-mono tabular-nums leading-none text-fg ${SIZE[size]} ${className}`.trim()}
    >
      <span aria-hidden={label ? 'true' : undefined} className={SIZE[size]}>{value}</span>
      {secondary ? <span aria-hidden={label ? 'true' : undefined} className={`text-fg-3 ${SECONDARY[size]}`}>{secondary}</span> : null}
    </span>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run --project unit tests/design/glass.test.tsx tests/design/numeral.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/design/primitives/Glass.tsx src/design/primitives/Spotlight.tsx src/design/primitives/Numeral.tsx tests/design/glass.test.tsx tests/design/numeral.test.tsx
git commit -m "design: Glass, Spotlight, Numeral primitives

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Sheet primitive

**Files:**
- Create: `src/design/primitives/Sheet.tsx`
- Test: `tests/design/sheet.test.tsx`

**Interfaces:**
- `Sheet`: `({ open: boolean; onClose: () => void; title: string; children; height?: 'auto' | 'full' })`. Renders nothing when closed. When open: a fixed backdrop (`bg-ink/60`), a bottom-anchored `Glass` panel with `role="dialog" aria-modal="true" aria-labelledby`, focus moves to the panel on open, Escape and backdrop click call `onClose`, focus returns to the previously focused element on close, body scroll locked while open. Slide-up uses `--g-dur-spring`. `height="full"` makes it 100dvh minus 24px top inset (used for organizer Preview).

- [ ] **Step 1: Write failing test**

Create `tests/design/sheet.test.tsx`:
```tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Sheet } from '../../src/design/primitives/Sheet';

describe('Sheet', () => {
  it('renders nothing when closed', () => {
    render(<Sheet open={false} onClose={() => {}} title="Find my squares">x</Sheet>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is a labelled modal dialog that focuses itself and closes on Escape', () => {
    const onClose = vi.fn();
    render(<Sheet open onClose={onClose} title="Find my squares"><input aria-label="Name" /></Sheet>);
    const dialog = screen.getByRole('dialog', { name: 'Find my squares' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement === dialog || dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click but not on panel click', () => {
    const onClose = vi.fn();
    render(<Sheet open onClose={onClose} title="Preview"><p>body</p></Sheet>);
    fireEvent.click(screen.getByText('body'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while open and restores it', () => {
    const { unmount } = render(<Sheet open onClose={() => {}} title="Preview">x</Sheet>);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --project unit tests/design/sheet.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

Create `src/design/primitives/Sheet.tsx`:
```tsx
import React, { useEffect, useId, useRef } from 'react';
import { Glass } from './Glass';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: 'auto' | 'full';
}

/** Bottom sheet dialog. Springs up from the bottom edge; Escape or backdrop closes it. */
export function Sheet({ open, onClose, title, children, height = 'auto' }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>('input, button, [href], textarea, select, [tabindex]:not([tabindex="-1"])');
    (firstFocusable ?? panel)?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'Tab' && panelRef.current) {
      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>('input, button, [href], textarea, select, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  const heightClass = height === 'full' ? 'h-[calc(100dvh-24px)]' : 'max-h-[85dvh]';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onKeyDown={onKeyDown}>
      <div
        data-testid="sheet-backdrop"
        className="absolute inset-0 bg-ink/60 animate-[sheet-fade_var(--g-dur-state)_var(--g-ease-state)]"
        onClick={onClose}
      />
      <Glass
        as="div"
        padding="none"
        // Glass renders a div; cast the ref through the DOM node
        ref={panelRef as unknown as React.Ref<HTMLElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative w-full max-w-[640px] ${heightClass} overflow-y-auto rounded-b-none animate-[sheet-rise_var(--g-dur-spring)_var(--g-ease-state)] outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between px-6 pt-4 pb-3 bg-transparent">
          <h2 id={titleId} className="font-ui text-[17px] font-medium text-fg">{title}</h2>
          <button type="button" onClick={onClose} className="font-ui text-[15px] text-fg-2 hover:text-fg rounded-capsule px-3 h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action">Close</button>
        </div>
        <div className="px-6 pb-8">{children}</div>
      </Glass>
    </div>
  );
}
```

`Glass` must forward refs for this to work. Update `src/design/primitives/Glass.tsx` to:
```tsx
import React from 'react';

type Padding = 'none' | 'md' | 'lg';
const PAD: Record<Padding, string> = { none: '', md: 'p-5', lg: 'p-7' };

export interface GlassProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article';
  padding?: Padding;
}

/** Translucent panel. Fill, hairline, and shadow come from the active base. */
export const Glass = React.forwardRef<HTMLElement, GlassProps>(function Glass(
  { as: Tag = 'div', padding = 'md', className = '', ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={`bg-panel border border-hairline rounded-card backdrop-blur-[var(--g-blur)] shadow-[var(--g-shadow)] transition-[background-color] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)] ${PAD[padding]} ${className}`.trim()}
      {...rest}
    />
  );
});
```

Add the two keyframes to `src/design/tokens.css` at the end:
```css
@keyframes sheet-rise {
  from { transform: translateY(24px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes sheet-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run --project unit tests/design/sheet.test.tsx tests/design/glass.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/design/primitives/Sheet.tsx src/design/primitives/Glass.tsx src/design/tokens.css tests/design/sheet.test.tsx
git commit -m "design: Sheet primitive with focus trap and scroll lock

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Ring and Island primitives

**Files:**
- Create: `src/design/primitives/Ring.tsx`, `src/design/primitives/Island.tsx`
- Test: `tests/design/island.test.tsx`

**Interfaces:**
- `Ring`: `({ value: number /* 0–1 */; label: string; caption: string; tone?: 'fg'|'gold'|'live'|'cardinal'; size?: number /* px, default 28 */ })`. SVG circle with stroke-dashoffset, `role="img" aria-label={label}`, caption in mono 12px under it.
- `Island`: `({ collapsed: React.ReactNode; expanded: React.ReactNode; label: string; placement?: 'top' | 'corner'; defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void })`. Renders a `<section aria-label={label}>` containing a toggle `<button aria-expanded>` that shows `collapsed`, and when open a region `role="region"` showing `expanded`. Tap toggles; hover (pointer: fine) opens and mouseleave closes when uncontrolled; Escape closes and returns focus to the toggle. `placement="top"` → `fixed top-3 left-1/2 -translate-x-1/2`; `corner` → `fixed bottom-6 right-6`. Expand animation uses `--g-dur-spring`.
- Exported `IslandRings`: `({ rings: Array<{ value: number; label: string; caption: string; tone? }> })` convenience row for the collapsed slot.

- [ ] **Step 1: Write failing test**

Create `tests/design/island.test.tsx`:
```tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Island, IslandRings } from '../../src/design/primitives/Island';
import { Ring } from '../../src/design/primitives/Ring';

describe('Ring', () => {
  it('is an image with a label and mono caption', () => {
    render(<Ring value={0.83} label="83 percent filled" caption="83%" />);
    expect(screen.getByRole('img', { name: '83 percent filled' })).toBeInTheDocument();
    expect(screen.getByText('83%').className).toContain('font-mono');
  });
});

describe('Island', () => {
  const rings = [
    { value: 0.83, label: '83 percent filled', caption: '83%' },
    { value: 0.5, label: '50 percent paid', caption: '50%' },
  ];

  it('starts collapsed and toggles on click', () => {
    render(<Island label="Board status" collapsed={<IslandRings rings={rings} />} expanded={<p>Draw numbers</p>} />);
    const toggle = screen.getByRole('button', { name: /Board status/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Draw numbers')).toBeNull();
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('region', { name: 'Board status' })).toBeInTheDocument();
    expect(screen.getByText('Draw numbers')).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the toggle', () => {
    render(<Island label="Score" defaultOpen collapsed={<span>21–14</span>} expanded={<button>Refresh</button>} />);
    const toggle = screen.getByRole('button', { name: /Score/ });
    screen.getByRole('button', { name: 'Refresh' }).focus();
    fireEvent.keyDown(screen.getByRole('region', { name: 'Score' }), { key: 'Escape' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('supports controlled open state', () => {
    const onOpenChange = vi.fn();
    render(<Island label="Score" open={false} onOpenChange={onOpenChange} collapsed={<span>c</span>} expanded={<span>e</span>} />);
    fireEvent.click(screen.getByRole('button', { name: /Score/ }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByText('e')).toBeNull();
  });

  it('places itself at the top edge or corner', () => {
    const { container, rerender } = render(<Island label="A" collapsed={<span>c</span>} expanded={<span>e</span>} />);
    expect((container.firstElementChild as HTMLElement).className).toContain('top-3');
    rerender(<Island label="A" placement="corner" collapsed={<span>c</span>} expanded={<span>e</span>} />);
    expect((container.firstElementChild as HTMLElement).className).toContain('bottom-6');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --project unit tests/design/island.test.tsx`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

Create `src/design/primitives/Ring.tsx`:
```tsx
import React from 'react';

type Tone = 'fg' | 'gold' | 'live' | 'cardinal';
const STROKE: Record<Tone, string> = {
  fg: 'var(--g-text)',
  gold: 'var(--g-gold)',
  live: 'var(--g-live)',
  cardinal: 'var(--g-cardinal)',
};

export interface RingProps {
  /** 0 to 1 */
  value: number;
  label: string;
  caption: string;
  tone?: Tone;
  size?: number;
}

/** Small SVG ring gauge with a mono caption beneath. */
export function Ring({ value, label, caption, tone = 'fg', size = 28 }: RingProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <svg role="img" aria-label={label} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--g-hairline)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={STROKE[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset var(--g-dur-spring) var(--g-ease-state)' }}
        />
      </svg>
      <span className="font-mono tabular-nums text-[12px] leading-none text-fg-2">{caption}</span>
    </span>
  );
}
```

Create `src/design/primitives/Island.tsx`:
```tsx
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Ring, type RingProps } from './Ring';

interface IslandProps {
  label: string;
  collapsed: React.ReactNode;
  expanded: React.ReactNode;
  placement?: 'top' | 'corner';
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PLACEMENT = {
  top: 'fixed top-3 left-1/2 -translate-x-1/2',
  corner: 'fixed bottom-6 right-6',
} as const;

/**
 * Expandable capsule that hugs the screen edge. Collapsed shows rings or a score;
 * expanded shows full state and exactly one primary action. Tap toggles, hover opens on pointer devices.
 */
export function Island({ label, collapsed, expanded, placement = 'top', defaultOpen = false, open, onOpenChange }: IslandProps) {
  const controlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlled ? open : internalOpen;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const hoverCapable = useRef(false);
  const regionId = useId();

  useEffect(() => {
    hoverCapable.current = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  const setOpen = useCallback((next: boolean) => {
    if (!controlled) setInternalOpen(next);
    onOpenChange?.(next);
  }, [controlled, onOpenChange]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      setOpen(false);
      toggleRef.current?.focus();
    }
  };

  return (
    <section
      aria-label={label}
      className={`${PLACEMENT[placement]} z-40 max-w-[calc(100vw-24px)]`}
      onKeyDown={onKeyDown}
      onMouseEnter={() => { if (hoverCapable.current && !controlled) setOpen(true); }}
      onMouseLeave={() => { if (hoverCapable.current && !controlled) setOpen(false); }}
    >
      <div
        className="bg-chyron text-broadcast-white rounded-capsule shadow-[var(--g-shadow)] border border-white/10 overflow-hidden transition-[border-radius] duration-[var(--g-dur-spring)] ease-[var(--g-ease-state)]"
        style={{ borderRadius: isOpen ? 'var(--g-radius-card)' : 'var(--g-radius-capsule)' }}
        data-base="dark"
      >
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls={regionId}
          onClick={() => setOpen(!isOpen)}
          className="flex items-center gap-4 h-14 px-5 w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset"
        >
          <span className="sr-only">{label}</span>
          {collapsed}
        </button>
        {isOpen ? (
          <div
            id={regionId}
            role="region"
            aria-label={label}
            className="px-5 pb-5 pt-1 animate-[sheet-rise_var(--g-dur-spring)_var(--g-ease-state)]"
          >
            {expanded}
          </div>
        ) : null}
      </div>
    </section>
  );
}

interface IslandRingsProps {
  rings: Array<Pick<RingProps, 'value' | 'label' | 'caption' | 'tone'>>;
}

/** Convenience row of up to three rings for the collapsed slot. */
export function IslandRings({ rings }: IslandRingsProps) {
  return (
    <span className="flex items-center gap-5">
      {rings.slice(0, 3).map((r) => <Ring key={r.label} {...r} />)}
    </span>
  );
}
```

Note: the island is always rendered in dark styling (chyron ground, white text) regardless of the page base, matching the reference notch. It sets `data-base="dark"` on its own container so gold ring tones resolve. The `sheet-rise` keyframe from Task 6 is reused.

- [ ] **Step 4: Run tests**

Run: `npx vitest run --project unit tests/design/island.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Add the barrel export**

Create `src/design/primitives/index.ts`:
```ts
export { Base } from '../Base';
export type { BaseKind } from '../Base';
export { Eyebrow } from './Eyebrow';
export { CapsuleButton, CapsuleTag, CapsuleInput } from './Capsule';
export type { CapsuleButtonProps, CapsuleInputProps } from './Capsule';
export { Glass } from './Glass';
export type { GlassProps } from './Glass';
export { Spotlight } from './Spotlight';
export { Numeral } from './Numeral';
export { Sheet } from './Sheet';
export { Ring } from './Ring';
export type { RingProps } from './Ring';
export { Island, IslandRings } from './Island';
export { EASE_STATE, DUR_STATE, DUR_SPRING, DUR_REDUCED, SPRING, useReducedMotion, durations } from './motion';
```

- [ ] **Step 6: Full unit run and commit**

Run: `npx tsc --noEmit && npx vitest run --project unit`
Expected: all green.

```bash
git add src/design/primitives/Ring.tsx src/design/primitives/Island.tsx src/design/primitives/index.ts tests/design/island.test.tsx
git commit -m "design: Ring and Island primitives, barrel export

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Kitchen route and visual verification

**Files:**
- Create: `src/design/kitchen/DesignKitchen.tsx`
- Modify: `App.tsx` (add lazy import and route)
- Test: `tests/design/kitchen.test.tsx`

**Interfaces:**
- Route `/design-kitchen` renders `DesignKitchen`, which shows every primitive in both bases side by side with real sample data (Kansas City 21, Philadelphia 14, Q3; a 10×10 fragment). No icons. This route is deleted in stage 7.

- [ ] **Step 1: Write failing test**

Create `tests/design/kitchen.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DesignKitchen from '../../src/design/kitchen/DesignKitchen';

describe('DesignKitchen', () => {
  it('renders both bases with every primitive present', () => {
    const { container } = render(<DesignKitchen />);
    expect(container.querySelectorAll('[data-base="dark"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-base="cream"]').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Create your board' }).length).toBe(2);
    expect(screen.getAllByRole('img', { name: /percent/ }).length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('Kansas City').length).toBeGreaterThan(0);
  });

  it('uses no icon components', () => {
    const { container } = render(<DesignKitchen />);
    expect(container.querySelectorAll('svg.lucide').length).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run --project unit tests/design/kitchen.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

Create `src/design/kitchen/DesignKitchen.tsx`:
```tsx
import React, { useState } from 'react';
import {
  Base, type BaseKind, CapsuleButton, CapsuleInput, CapsuleTag, Eyebrow, Glass, Island, IslandRings, Numeral, Ring, Sheet, Spotlight,
} from '../primitives';

const RINGS = [
  { value: 0.83, label: '83 percent filled', caption: '83%' },
  { value: 0.5, label: '50 percent paid', caption: '50%', tone: 'gold' as const },
  { value: 1, label: '100 percent drawn', caption: 'Drawn', tone: 'gold' as const },
];

function Panel({ kind }: { kind: BaseKind }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState('');
  return (
    <Base kind={kind} className="relative overflow-hidden p-8 flex flex-col gap-10">
      <Spotlight className="right-[-160px] top-[-200px]" />

      <header className="relative flex flex-col gap-3 max-w-[560px]">
        <Eyebrow>Football squares, run live</Eyebrow>
        <h1 className="font-display text-[56px] leading-[1] tracking-[-0.01em] text-fg">Build it once. Share one link.</h1>
        <p className="font-ui text-[17px] text-fg-2">Let the board run game day.</p>
        <div className="flex items-center gap-3 pt-2">
          <CapsuleButton size="lg">Create your board</CapsuleButton>
          <CapsuleButton variant="ghost">Sign in</CapsuleButton>
        </div>
      </header>

      <Glass as="section" aria-label="Live score" className="relative flex items-end justify-between gap-6 max-w-[560px]">
        <div className="flex flex-col gap-2">
          <Eyebrow>Kansas City</Eyebrow>
          <Numeral value={21} size="xl" label="Kansas City 21" />
        </div>
        <div className="flex flex-col items-center gap-2 pb-2">
          <CapsuleTag tone="live">Live · Q3</CapsuleTag>
          <span className="font-mono text-[13px] text-fg-3">8:12</span>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Eyebrow>Philadelphia</Eyebrow>
          <Numeral value={14} size="xl" label="Philadelphia 14" />
        </div>
      </Glass>

      <div className="relative flex flex-wrap items-center gap-3">
        <CapsuleTag>Draft</CapsuleTag>
        <CapsuleTag tone="gold">Final</CapsuleTag>
        <CapsuleTag tone="cardinal">Corrected</CapsuleTag>
        <Numeral value="$14" secondary=".99" size="lg" label="14 dollars and 99 cents" />
        <Numeral value="3" secondary="squares" size="md" label="3 squares" />
      </div>

      <div className="relative flex items-center gap-8">
        {RINGS.map((r) => <Ring key={r.label} {...r} size={40} />)}
      </div>

      <div className="relative max-w-[420px] flex flex-col gap-4">
        <CapsuleInput label="Find my squares" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <CapsuleInput label="Winner email" placeholder="you@example.com" trailing={<CapsuleButton>Notify me</CapsuleButton>} />
        <CapsuleButton variant="quiet" onClick={() => setSheetOpen(true)}>Open sheet</CapsuleButton>
      </div>

      <Glass as="section" aria-label="Board fragment" padding="none" className="relative w-fit overflow-hidden">
        <div className="grid grid-cols-5 gap-px bg-hairline">
          {['Carrie Moss', 'Open', 'Alex Kim', 'Dana Ortiz', 'Open', 'Sam Lee', 'Open', 'Carrie Moss', 'Pat Nguyen', 'Jo Baker'].map((n, i) => (
            <div key={i} className={`w-20 h-16 flex items-center justify-center rounded-cell text-[13px] font-ui px-1 text-center ${n === 'Open' ? 'bg-panel text-fg-3' : i === 7 ? 'bg-gold text-ink font-medium' : 'bg-ground text-fg'}`}>{n}</div>
          ))}
        </div>
      </Glass>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Find my squares">
        <CapsuleInput label="Name" hideLabel placeholder="Start typing a name" autoFocus />
        <ul className="mt-4 flex flex-col gap-1 font-ui text-[16px]">
          {['Carrie Moss', 'Carrie M.', 'Carl Mosley'].map((n) => <li key={n} className="h-12 flex items-center px-3 rounded-control hover:bg-panel-hover">{n}</li>)}
        </ul>
      </Sheet>
    </Base>
  );
}

export default function DesignKitchen() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      <Panel kind="dark" />
      <Panel kind="cream" />
      <Island
        label="Board status"
        placement="corner"
        collapsed={<IslandRings rings={RINGS} />}
        expanded={(
          <div className="flex flex-col gap-3 min-w-[260px]">
            <p className="font-ui text-[15px] text-broadcast-white/70">83 filled · 17 open · 6 unpaid</p>
            <CapsuleButton>Draw numbers</CapsuleButton>
          </div>
        )}
      />
    </div>
  );
}
```

Add to `App.tsx` after the `HomepageV2` lazy import:
```tsx
const DesignKitchen = React.lazy(() => import('./src/design/kitchen/DesignKitchen'));
```
And add a route next to `/privacy`:
```tsx
              <Route path="/design-kitchen" element={<DesignKitchen />} />
```

- [ ] **Step 4: Run test and type check**

Run: `npx vitest run --project unit tests/design/kitchen.test.tsx && npx tsc --noEmit`
Expected: PASS (2 tests); tsc clean.

- [ ] **Step 5: Visual verification in the browser pane**

Create `.claude/launch.json` if missing:
```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "gridone-dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 5173 }
  ]
}
```
Start `gridone-dev` with `preview_start`, navigate to `http://localhost:5173/design-kitchen`, then:
1. `read_console_messages` with `onlyErrors: true` — expected: none.
2. Screenshot at desktop; `resize_window` preset `mobile`, screenshot again.
3. Click the island toggle and screenshot the expanded state.
4. Click "Open sheet", screenshot, press Escape, confirm it closes.
5. Check computed font on the `h1` with `javascript_tool`: `getComputedStyle(document.querySelector('h1')).fontFamily` — expected to start with `"Instrument Serif"`.
Send the desktop and mobile screenshots to the owner with `SendUserFile`.

Anything that looks wrong (fonts not loading, glass not blurring, ring not drawing) is fixed in source before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/design/kitchen/DesignKitchen.tsx App.tsx tests/design/kitchen.test.tsx .claude/launch.json
git commit -m "design: kitchen route rendering every primitive in both bases

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Rewrite DESIGN.md and DESIGN_TOKENS.md; retire the old design audit

**Files:**
- Modify: `DESIGN.md` (full rewrite), `docs/DESIGN_TOKENS.md` (full rewrite)
- Delete: `tests/designAudit.test.ts`, `scripts/design-audit.mjs`, `docs/DESIGN.incumbent.md`
- Modify: `package.json` (remove `design:audit` script)

- [ ] **Step 1: Confirm what the audit test asserts**

Run: `sed -n 1,40p tests/designAudit.test.ts`
Expected: it asserts the old "On Air" invariants (no pills, no blur, 8/12px radii). Those are now wrong by contract, so the test is deleted rather than rewritten.

- [ ] **Step 2: Delete the audit and its script**

```bash
git rm tests/designAudit.test.ts scripts/design-audit.mjs docs/DESIGN.incumbent.md
```
In `package.json` remove the line `"design:audit": "node scripts/design-audit.mjs",`.

- [ ] **Step 3: Rewrite `DESIGN.md`**

Replace the whole file with:
```markdown
---
version: alpha
name: GridOne
description: Broadcast Glass — quiet, physical, few clicks. Dark spotlight for game day, warm cream for setup.
colors:
  primary: "#8F1D2C"
  primary-deep: "#6E1622"
  accent: "#FFC72C"
  accent-deep: "#E0A600"
  neutral: "#EFF0F1"
  neutral-quiet: "#DEE0E1"
  ink: "#0E0F12"
  surface-dark: "#16181D"
  ground-dark: "#0B0C0F"
  ground-cream: "#F5F1EA"
  live: "#22C55E"
typography:
  display:
    fontFamily: Instrument Serif
    fontSize: 3.5rem
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.01em"
  heading:
    fontFamily: Geist
    fontSize: 1.5rem
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: Geist
    fontSize: 1.0625rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  label:
    fontFamily: Geist Mono
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0.12em
  data:
    fontFamily: Geist Mono
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0em
rounded:
  control: 12px
  surface: 20px
  capsule: 999px
  grid: 4px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
components:
  button-primary-dark:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.capsule}"
    padding: 14px
  button-primary-cream:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.body}"
    rounded: "{rounded.capsule}"
    padding: 14px
  glass-panel:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.surface}"
    padding: 20px
  island:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.capsule}"
    padding: 16px
  status-live:
    backgroundColor: "{colors.live}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.capsule}"
    padding: 8px
  input:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.neutral}"
    typography: "{typography.body}"
    rounded: "{rounded.capsule}"
    padding: 14px
---

# GridOne Design System — Broadcast Glass

Normative contract. Implementation lives in `src/design/tokens.css` and `src/design/primitives/`. Mapping in `docs/DESIGN_TOKENS.md`. Full rationale in `docs/superpowers/specs/2026-09-01-broadcast-glass-redesign-design.md`.

## Thesis

Game day should feel like a broadcast graphic on a quiet phone: one number that matters, glass over a dark field, nothing to click twice. Setup should feel like a sheet of warm paper: everything editable in place, progress visible in one glance.

## Two bases, one palette

- **Dark** (viewer, homepage, article pages): ground `#0B0C0F`, one cardinal spotlight behind the hero artifact, glass panels (white 6%, hairline white 10%, blur 20px). Gold is the only action color. Cardinal appears in the glow, the brand mark, and destructive confirmations with explicit text.
- **Cream** (organizer workspace, dashboard): ground `#F5F1EA`, cards white 70% with ink hairline 8%. Cardinal is the action color. Gold marks committed and settled states only.
- Live green means an in-progress NFL game and nothing else.
- No state relies on color alone.

## Type

- Display: Instrument Serif. Hero headlines and board names only.
- Interface: Geist 400/500; 600 only for the single primary action.
- Data and eyebrow: Geist Mono, tabular. Large numerals dim their secondary segment.
- Essential text ≥ 14px. Grid-cell labels are the precision exception and carry accessible full labels.

## Shape

Controls 12px. Cards, sheets, glass 20px. Buttons, tags, chips, island: capsule. Grid cells 4px.

## Motion

State ease 200ms `cubic-bezier(0.2, 0, 0, 1)`. Soft spring ~450ms, no overshoot, for island, sheet, shared-element moves, and the draw. Reduced motion collapses both to a 120ms fade. Routes never hard-swap.

## The Island

Capsule hugging the top edge on phone, bottom-right on desktop. Collapsed: rings or score. Expanded on tap or hover: full state and exactly one primary action. Always dark. Keyboard operable; Escape collapses.

## Anti-slop rules

1. The product is the hero image. No illustrations, stock, or abstract 3D.
2. Asymmetric, left-anchored layouts on desktop. Centered only on single-column phone.
3. One spotlight per page, behind the artifact.
4. Hierarchy from scale contrast, not card count. No three-up feature rows.
5. Real numbers and real team names everywhere, including empty states.
6. Icons almost never. When required: one set, one stroke weight, 16px, muted.
7. Copy is short, specific, occasionally dry. Banned: seamless, effortless, unlock, supercharge, elevate, powerful, robust.
8. No purple, no multi-color gradients, no corner glows, no uniform radius on every element.

## Deliberate exceptions

- The island renders dark on the cream base; it is a broadcast object.
- Pills are the default for actions, tags, and inputs. The former pill prohibition is withdrawn.
```

- [ ] **Step 4: Rewrite `docs/DESIGN_TOKENS.md`**

Replace the whole file with:
```markdown
# GridOne Design Tokens

**Status:** Production mapping reference
**Normative overlay:** root `DESIGN.md`
**Implementation:** `src/design/tokens.css`, exposed to Tailwind through `@theme inline` in `src/index.css`
**Primitives:** `src/design/primitives/`

`DESIGN.md` owns meaning. This file records the CSS variable and Tailwind utility for each token. If values disagree, fix the mapping.

## Fixed palette

| Meaning | CSS variable | Tailwind | Value |
|---|---|---|---|
| Brand, cream action, destructive | `--g-cardinal` | `cardinal` | `#8F1D2C` |
| Cardinal pressed | `--g-cardinal-deep` | `cardinal-deep` | `#6E1622` |
| Dark action, committed, settled | `--g-gold` | `gold` | `#FFC72C` |
| Gold pressed | `--g-gold-deep` | `gold-deep` | `#E0A600` |
| In-progress NFL game only | `--g-live` | `live` | `#22C55E` |
| Ink | `--g-ink` | `ink` | `#0E0F12` |
| Island and chyron ground | `--g-chyron` | `chyron` | `#16181D` |
| Broadcast white | `--g-white` | `broadcast-white` | `#EFF0F1` |
| Newsprint | `--g-newsprint` | `newsprint` | `#DEE0E1` |

## Semantic tokens (flip per `data-base`)

| Meaning | CSS variable | Tailwind | Dark | Cream |
|---|---|---|---|---|
| Page ground | `--g-ground` | `bg-ground` | `#0B0C0F` | `#F5F1EA` |
| Panel fill | `--g-panel` | `bg-panel` | white 6% | white 70% |
| Panel hover | `--g-panel-hover` | `bg-panel-hover` | white 8% | white 85% |
| Hairline | `--g-hairline` | `border-hairline` | white 10% | ink 8% |
| Text primary | `--g-text` | `text-fg` | broadcast white | ink |
| Text secondary | `--g-text-2` | `text-fg-2` | 60% | 60% |
| Text muted | `--g-text-3` | `text-fg-3` | 40% | 40% |
| Action fill | `--g-action` | `bg-action` | gold | cardinal |
| Action hover | `--g-action-hover` | `bg-action-hover` | gold deep | cardinal deep |
| Action text | `--g-action-text` | `text-action-text` | ink | white |
| Shadow | `--g-shadow` | `shadow-[var(--g-shadow)]` | 45% black | 6% ink |
| Spotlight | `--g-glow` | used by `Spotlight` | cardinal 55% | gold 30% |

The base is set by `<Base kind="dark" | "cream">` from `src/design/Base.tsx`.

## Type

| Role | CSS variable | Tailwind | Family |
|---|---|---|---|
| Display | `--g-font-display` | `font-display` | Instrument Serif |
| Interface | `--g-font-ui` | `font-ui` | Geist |
| Data, eyebrow | `--g-font-mono` | `font-mono` | Geist Mono |

## Shape

| Role | CSS variable | Tailwind | Value |
|---|---|---|---|
| Control | `--g-radius-control` | `rounded-control` | 12px |
| Card, sheet, glass | `--g-radius-card` | `rounded-card` | 20px |
| Button, tag, input, island | `--g-radius-capsule` | `rounded-capsule` | 999px |
| Grid cell | `--g-radius-cell` | `rounded-cell` | 4px |

## Motion

| Role | CSS variable | Value |
|---|---|---|
| State ease | `--g-ease-state` | `cubic-bezier(0.2, 0, 0, 1)` |
| State duration | `--g-dur-state` | 200ms |
| Spring duration | `--g-dur-spring` | 450ms |
| Reduced motion | `--g-dur-reduced` | 120ms, replaces both under `prefers-reduced-motion` |

JS constants and `useReducedMotion()` live in `src/design/primitives/motion.ts`.

## Legacy

The `--gridone-*` variables and `font-condensed` / `font-data` aliases in `src/index.css` support surfaces scheduled for deletion in stages 3–5 of the redesign. Do not use them in new code.
```

- [ ] **Step 5: Lint, test, build**

Run:
```bash
npm run design:lint
npx tsc --noEmit
npx vitest run --project unit
npm run build 2>&1 | tail -3
```
Expected: design lint passes; tsc clean; unit suite green (the audit test is gone); build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A DESIGN.md docs/DESIGN_TOKENS.md package.json tests/designAudit.test.ts scripts/design-audit.mjs docs/DESIGN.incumbent.md
git commit -m "design: rewrite DESIGN.md for Broadcast Glass, retire old audit

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Stage gate

- [ ] **Step 1: Full verification**

Run:
```bash
npx tsc --noEmit
npx vitest run --project unit
npm run build 2>&1 | tail -3
npm run design:lint
git status --short
```
Expected: everything green, working tree clean apart from the untracked `.impeccable/`, `docs/gap-remediation-plan-2026-08-01.md`, and the two marketing docs (those are stage 7 decisions).

- [ ] **Step 2: Record the stage in the refactor log**

Append to `docs/REFACTOR_LOG.md`:
```markdown

## 2026-09-01 — Broadcast Glass stage 1+2: baseline and design foundation

- **Scope:** removed stale agent worktrees and branches; added `src/design/tokens.css`, `Base`, motion helpers, and the Eyebrow, Capsule, Glass, Spotlight, Numeral, Sheet, Ring, and Island primitives with unit coverage; added the temporary `/design-kitchen` route; rewrote `DESIGN.md` and `docs/DESIGN_TOKENS.md`; retired the old design audit.
- **Not touched:** schema, functions, workers, services, hooks, legacy surfaces (deleted in stages 3–5).
- **Evidence:** unit suite green, strict TypeScript, production build, design lint, desktop and 390px kitchen screenshots reviewed.
- **Rollback:** revert the commits of this stage; no domain state affected.
```

```bash
git add docs/REFACTOR_LOG.md
git commit -m "docs: log broadcast glass stage 1+2

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 3: Hand off**

Report to the owner: what shipped, the two screenshots, and that stage 3 (homepage) planning starts next. Note for stage 3: `index.html` JSON-LD still advertises Free / $9.99 / $79 tiers while the spec says a $14.99 season pass with twenty boards. The homepage plan must reconcile that with the owner before touching SEO markup.
