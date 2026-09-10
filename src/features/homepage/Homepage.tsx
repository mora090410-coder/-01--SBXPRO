import React from 'react';
import './studio.css';
import { Base, Grain } from '../../design/primitives';
import { Footer } from './sections/Footer';
import { Hero } from './sections/Hero';
import { OrganizerSection } from './sections/OrganizerSection';
import { PriceAndClose } from './sections/PriceAndClose';
import { ScoreSection } from './sections/ScoreSection';

export default function Homepage() {
  return (
    <Base kind="dark" className="overflow-x-clip">
      <Grain />
      <main data-testid="homepage">
        <Hero />
        <OrganizerSection />
        <ScoreSection />
        <PriceAndClose />
      </main>
      <Footer />
    </Base>
  );
}
