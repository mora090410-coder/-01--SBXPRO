import React from 'react';
import { Reveal, SectionTone } from '../../../design/primitives';
import { ScoreMoment } from '../artifacts/ScoreMoment';
import { demoGame, demoLive, demoWinnerNow } from '../demoData';

/** A score becomes a coordinate. All values come from the same sample game. */
export function ScoreSection() {
  return (
    <section data-sc-act="flow" className="studio-score relative overflow-x-clip" aria-labelledby="studio-score-title">
      <SectionTone tone="live" side="left" />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-16 md:px-12 md:py-24">
        <Reveal className="max-w-[760px]">
          <h2 id="studio-score-title" className="font-ui font-medium tracking-[-0.05em] text-[40px] leading-[1.02] text-fg md:text-[68px]">Scores update themselves.</h2>
          <p className="mt-6 max-w-[560px] font-ui text-[18px] leading-[1.5] text-fg-2">
            The game moves. Your board follows. The last digit of each score points to one square, so everyone knows who wins right now.
          </p>
        </Reveal>
        <div className="studio-score-layout mt-12">
          <ScoreMoment />
          <Reveal className="studio-score-connection">
            <div className="studio-coordinate" aria-label={`Current digits: ${demoGame.leftAbbr} ${demoLive.leftScore % 10}, ${demoGame.topAbbr} ${demoLive.topScore % 10}`}>
              <span><span className="studio-coordinate-team">{demoGame.leftAbbr}</span>{demoLive.leftScore % 10}</span>
              <span className="studio-coordinate-times" aria-hidden="true">×</span>
              <span><span className="studio-coordinate-team">{demoGame.topAbbr}</span>{demoLive.topScore % 10}</span>
            </div>
            <svg className="studio-score-trace" viewBox="0 0 240 56" fill="none" aria-hidden="true">
              <path d="M60 1 V18 Q60 28 72 28 H168 Q180 28 180 18 V1 M120 28 V55" pathLength="1" />
            </svg>
            <div className="studio-winning-name">
              <span className="font-ui text-[24px] font-medium">{demoWinnerNow}</span>
              <span className="font-ui text-[14px]">wins right now</span>
            </div>
          </Reveal>
        </div>
        <p className="mt-6 max-w-[640px] font-ui text-[15px] leading-[1.5] text-fg-3">Example game. Every score shows its source and when it was checked. You can enter a score yourself any time.</p>
      </div>
    </section>
  );
}
