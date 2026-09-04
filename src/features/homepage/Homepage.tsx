import React from 'react';
import { Base, Grain } from '../../design/primitives';
import { Footer } from './sections/Footer';
import { Hero } from './sections/Hero';
import { OrganizerSection } from './sections/OrganizerSection';
import { ParentMoments } from './sections/ParentMoments';
import { PriceAndClose } from './sections/PriceAndClose';
import { ScoreSection } from './sections/ScoreSection';

export default function Homepage() {
  return (
    <Base kind="dark" className="overflow-x-hidden">
      <Grain />
      {/* No width cap here on purpose. Every section is full-bleed and caps its
          own CONTENT at 1200px, so a toned section's clip takes its SectionTone
          off-screen instead of at a 1200px column edge — which is what made the
          tint read as a lit rectangle. Do not reintroduce a page-level `max-w-*`
          wrapper.

          The tone journey is cardinal (hero), live (score), none (parent
          moments), gold (organizer), cardinal (pricing), none (closing CTA). The
          two `none` sections carry no tone OF THEIR OWN; they are not isolated
          from their neighbours. Toned sections clip on the X axis only, so each
          radial deliberately bleeds vertically into the blocks above and below
          rather than being cut at a hard horizontal seam. Measured, the bleed
          moves an untinted heading from 15.84:1 to 15.69:1 and the strongest
          tinted pixel leaves `--g-text-2` at 5.43:1 — decorative, and nowhere
          near the contrast floor. */}
      <main data-testid="homepage">
        <Hero />
        <ScoreSection />
        <ParentMoments />
        <OrganizerSection />
        <PriceAndClose />
      </main>
      <Footer />
    </Base>
  );
}
