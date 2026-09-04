import React from 'react';
import { Base, Grain } from '../../design/primitives';
import { BoardFillSection } from './sections/BoardFillSection';
import { Footer } from './sections/Footer';
import { Hero } from './sections/Hero';
import { OrganizerSection } from './sections/OrganizerSection';
import { ParentMoments } from './sections/ParentMoments';
import { PriceAndClose } from './sections/PriceAndClose';
import { ScoreSection } from './sections/ScoreSection';

/*
 * `overflow-x-clip` on the page root, NOT `overflow-x-hidden`.
 *
 * `hidden` on one axis forces the other to `auto`, which makes the element a
 * scroll container — and the nearest scroll container is what `position: sticky`
 * resolves against. With `hidden` here, the fill section's board resolved
 * against a box that never itself scrolls and so never pinned at all; measured
 * in Chrome, it tracked the page instead of holding at `top-24`. `clip` gives
 * exactly the same protection against a widened page (which is all this was
 * ever for) while creating no scroll container, so sticky keeps resolving
 * against the viewport. Every section already clips on its own, so this is the
 * second line of defence rather than the only one.
 */
export default function Homepage() {
  return (
    <Base kind="dark" className="overflow-x-clip">
      <Grain />
      {/* No width cap here on purpose. Every section is full-bleed and caps its
          own CONTENT at 1200px, so a toned section's clip takes its SectionTone
          off-screen instead of at a 1200px column edge — which is what made the
          tint read as a lit rectangle. Do not reintroduce a page-level `max-w-*`
          wrapper.

          The tone journey is cardinal (hero), none (the board filling), live
          (score), none (parent moments), gold (organizer), cardinal (pricing),
          none (closing CTA). The
          two `none` sections carry no tone OF THEIR OWN; they are not isolated
          from their neighbours. Toned sections clip on the X axis only, so each
          radial deliberately bleeds vertically into the blocks above and below
          rather than being cut at a hard horizontal seam. Measured, the bleed
          moves an untinted heading from 15.84:1 to 15.69:1 and the strongest
          tinted pixel leaves `--g-text-2` at 5.43:1 — decorative, and nowhere
          near the contrast floor. */}
      <main data-testid="homepage">
        <Hero />
        <BoardFillSection />
        <ScoreSection />
        <ParentMoments />
        <OrganizerSection />
        <PriceAndClose />
      </main>
      <Footer />
    </Base>
  );
}
