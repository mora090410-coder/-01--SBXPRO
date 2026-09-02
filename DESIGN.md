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

Score freshness is information, not decoration: viewer updates arrive about every minute, and the island's expanded state always shows the source and the retrieved time. Never imply realtime delivery.

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
