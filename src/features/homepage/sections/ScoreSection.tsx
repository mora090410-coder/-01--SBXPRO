import React from 'react';
import { Eyebrow } from '../../../design/primitives';
import { ScoreMoment } from '../artifacts/ScoreMoment';

export function ScoreSection() {
  return (
    <section className="px-6 py-16 md:px-12 md:py-24 flex flex-col gap-8">
      <div className="flex flex-col gap-3 max-w-[560px]">
        <Eyebrow>The score follows the game</Eyebrow>
        <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">Scores update themselves.</h2>
        <p className="font-ui text-[17px] leading-[1.5] text-fg-2">
          You don't refresh, you don't type, you don't argue. Every score on the board shows where it came from and when it was checked, and you can enter a score yourself any time.
        </p>
      </div>
      <ScoreMoment />
    </section>
  );
}
