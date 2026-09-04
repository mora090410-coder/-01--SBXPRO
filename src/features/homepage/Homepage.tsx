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
          own CONTENT at 1200px, so a toned section's `overflow-hidden` clips its
          SectionTone off-screen instead of at a 1200px column edge — which is
          what made the tint read as a lit rectangle. Do not reintroduce a
          page-level `max-w-*` wrapper. */}
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
