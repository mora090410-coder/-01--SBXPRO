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

The remaining `--gridone-*` variables in `src/index.css` back the unlayered cascade guards there: `--gridone-color-background`, `--gridone-color-brand-primary-deep` (button fill re-assertion), `--gridone-color-text-primary`, `--gridone-radius-surface`, `--gridone-radius-grid` (sharp board radius), and `--gridone-elevation-raised` (dialog and organizer-header elevation). The `Archivo` / `Chivo Mono` families and their `font-condensed` / `font-data` aliases are gone. Do not add new `--gridone-*` variables; use the `--g-*` tokens above.
