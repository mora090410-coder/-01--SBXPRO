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
      <main data-testid="homepage" className="mx-auto max-w-[1200px]">
        <Hero />
        <ScoreSection />
        <ParentMoments />
        <OrganizerSection />
        <PriceAndClose />
      </main>
    </Base>
  );
}
