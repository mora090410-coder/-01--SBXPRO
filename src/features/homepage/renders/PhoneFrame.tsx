import React from 'react';
import { Glass } from '../../../design/primitives';

const SHELL_WIDTH = 300;
const DEVICE_WIDTH = 390;

/**
 * The one hover-lift on this page's artifacts. Exported so every framed
 * artifact (phone frames, the moment fragment, the organizer preview) shares
 * a single definition instead of each growing its own near-copy.
 *
 * The lift is motion, so it sits behind `motion-safe:` and never runs under
 * `prefers-reduced-motion: reduce`; the deeper shadow is a colour change and
 * stays. `HOVER_LIFT_STYLE` is applied inline because `Glass` already declares
 * a `transition-property` and the inline value settles the cascade.
 *
 * The list names `translate`, NOT `transform`: Tailwind v4 compiles
 * `-translate-y-1` to the independent `translate` property, so a list naming
 * `transform` transitions nothing and the lift snaps. Nothing here scales or
 * rotates, so those two properties are left out.
 */
export const HOVER_LIFT =
  'motion-safe:hover:-translate-y-1 hover:shadow-[0_28px_64px_-28px_rgba(0,0,0,0.75)] duration-[var(--g-dur-state)] ease-[var(--g-ease-state)]';

export const HOVER_LIFT_STYLE: React.CSSProperties = {
  transitionProperty: 'background-color, translate, box-shadow',
};

export interface PhoneFrameProps {
  children?: React.ReactNode;
  /** Visually hidden sentence describing the picture for anyone who cannot see it. */
  caption: string;
  className?: string;
  /**
   * `phone` crops a 390x780 device render into a 300px shell.
   * `auto` drops the crop for a single component that should stand at its own height.
   */
  aspect?: 'phone' | 'auto';
}

/**
 * The rim light: a hard, narrow specular highlight along the frame's top-left
 * edge, defined once in `src/design/tokens.css` as `.device-rim`. It is a
 * static decoration — no animation, no hover state — so there is nothing here
 * for `prefers-reduced-motion` to switch off.
 *
 * Exported so every framed artifact on the page carries the same edge from one
 * definition: the two phone aspects here, and the organizer preview's own
 * frame in `OrganizerPreview.tsx`. Sharing the class, not the CSS.
 *
 * `relative` is the rim's containing block and nothing else: `position:
 * relative` with no offsets moves no pixel and changes no box size, and the
 * rim itself is an absolutely positioned pseudo-element inside a frame that
 * already clips, so it can add neither height, width, nor horizontal overflow.
 *
 * It is NOT defensive against a caller who positions the frame. Where a class
 * sits in the `class` attribute has no bearing on the cascade — only the order
 * the rules are emitted in the stylesheet does — and Tailwind emits `.relative`
 * AFTER both `.absolute` and `.fixed`. So a caller passing either would lose to
 * this `relative` at equal specificity, and the frame would not move where the
 * caller asked. No caller does that today (all three pass sizing and spacing
 * only); a future one that needs to position a framed artifact has to wrap it
 * rather than pass a position class down.
 *
 * `isolate` gives the frame its own stacking context, which is what makes the
 * pseudo-element's `z-index: 1` mean "above this frame's contents" instead of
 * quietly joining an ancestor's context. `overflow-hidden` already kept the rim
 * from escaping, so this is scoping made explicit rather than a bug fix.
 */
export const RIM = 'relative isolate device-rim';

/**
 * A real component rendered as a picture: the inner region is `inert` and `aria-hidden`,
 * so nothing inside can be clicked, focused, or read, and the caption carries the meaning.
 *
 * The frame lifts slightly on hover via the shared `HOVER_LIFT` above.
 *
 * The corner radius is `Glass`'s `rounded-card` (20px) and the rim inherits it.
 * A `rounded-[32px]` used to ride along here; it never took effect, because
 * Tailwind emits the theme utility after the arbitrary one and `rounded-card`
 * won, so the frames have shipped at 20px from the start. It is deleted rather
 * than made real: 20px is what was designed against and reviewed, and it is the
 * radius every other artifact on the page already uses.
 */
export function PhoneFrame({ children, caption, className = '', aspect = 'phone' }: PhoneFrameProps) {
  if (aspect === 'auto') {
    return (
      <Glass
        as="figure"
        padding="lg"
        style={HOVER_LIFT_STYLE}
        className={`${RIM} w-full max-w-[390px] min-h-[220px] overflow-hidden ${HOVER_LIFT} ${className}`.trim()}
      >
        {/* `isolate` keeps the picture's own stacking context below the rim.
            Without it a positioned descendant with its own z-index could paint
            over the 1px edge and cut a notch out of it. */}
        <div inert aria-hidden="true" className="isolate min-h-[220px]">{children}</div>
        <figcaption className="sr-only">{caption}</figcaption>
      </Glass>
    );
  }

  return (
    <Glass
      as="figure"
      padding="none"
      style={HOVER_LIFT_STYLE}
      className={`${RIM} w-[300px] max-w-full aspect-[390/780] overflow-hidden ${HOVER_LIFT} ${className}`.trim()}
    >
      {/* The 390 -> 300 downscale is a bare `transform` on purpose: this inner element
          carries no `scale-*`/`translate-*`/`rotate-*` class, so there is nothing for it
          to silently compose with, and the hover lift lives on the frame above, not here.
          The transform already gives this element its own stacking context, which is what
          holds the scaled render underneath the rim light. */}
      <div
        inert
        aria-hidden="true"
        style={{ width: DEVICE_WIDTH, height: 780, transform: `scale(${SHELL_WIDTH / DEVICE_WIDTH})`, transformOrigin: 'top left' }}
      >
        {children}
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
    </Glass>
  );
}
