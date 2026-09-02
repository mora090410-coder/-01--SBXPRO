import React from 'react';
import { Base } from '../../design/primitives';
import { Footer } from './sections/Footer';
import { Hero } from './sections/Hero';
import { OrganizerSection } from './sections/OrganizerSection';
import { ParentMoments } from './sections/ParentMoments';
import { PriceAndClose } from './sections/PriceAndClose';
import { ScoreSection } from './sections/ScoreSection';

export default function Homepage() {
  return (
    <Base kind="dark" className="overflow-x-hidden">
      <div className="mx-auto max-w-[1200px]">
        <main data-testid="homepage">
          <Hero />
          <ScoreSection />
          <ParentMoments />
          <OrganizerSection />
          <PriceAndClose />
        </main>
        <Footer />
      </div>
    </Base>
  );
}
