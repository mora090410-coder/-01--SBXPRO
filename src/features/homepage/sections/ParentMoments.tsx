import React, { useEffect, useId, useState } from 'react';
import { Glass, Reveal } from '../../../design/primitives';
import { BoardFragment } from '../artifacts/BoardFragment';
import { demoLive, demoWinnerNow } from '../demoData';
import { ScenariosRender, YourSquaresRender } from '../renders/MomentRenders';
import './studioChapters.css';

const winning = { left: demoLive.leftScore % 10, top: demoLive.topScore % 10 };
const moments = [
  {
    heading: 'Where are my squares?',
    body: 'Find your name. See every square you hold, then jump straight to it on the board.',
    artifact: <YourSquaresRender />,
  },
  {
    heading: 'Who wins right now?',
    body: 'Two last digits. One matching square. The current result is always right there.',
    artifact: (
      <Glass padding="lg" className="studio-viewer-winner">
        <p className="font-ui text-[20px] font-medium text-gold">{demoWinnerNow} wins right now</p>
        <BoardFragment highlight={winning} />
      </Glass>
    ),
  },
  {
    heading: 'What score wins next?',
    body: 'See the next scores that would put your name on the winning square this quarter. Arithmetic, not odds or predictions.',
    artifact: <ScenariosRender />,
  },
];

/** The quiet, user-controlled chapter between score and organizer. No ambient tone. */
export function ParentMoments() {
  const [selected, setSelected] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  const id = useId();
  // Server/no-JS content contains every answer. Interaction is progressive enhancement,
  // independent of motion preference and IntersectionObserver availability.
  useEffect(() => setEnhanced(true), []);
  return (
    <section data-sc-act="flow" className="studio-viewer studio-chapter" aria-labelledby={`${id}-heading`}>
      <Reveal className="studio-chapter-intro">
        <h2 id={`${id}-heading`}>Three answers, no scrolling.</h2>
        <p>Your group opens one link. No account needed.</p>
      </Reveal>
      <div className="studio-viewer-controls" role="group" aria-label="Explore the viewer" hidden={!enhanced}>
        {moments.map((moment, index) => (
          <button key={moment.heading} type="button" className="min-h-11" aria-pressed={selected === index}
            aria-controls={`${id}-answer-${index}`} onClick={() => setSelected(index)}>
            {moment.heading}
          </button>
        ))}
      </div>
      <div className="studio-viewer-stage" data-enhanced={enhanced || undefined}>
        {moments.map((moment, index) => (
          <section key={moment.heading} id={`${id}-answer-${index}`} data-viewer-answer
            className="studio-viewer-answer" aria-labelledby={`${id}-question-${index}`}
            hidden={enhanced && selected !== index}>
            <div className="studio-viewer-copy">
              <h3 id={`${id}-question-${index}`}>{moment.heading}</h3>
              <p>{moment.body}</p>
              <span className="studio-demo-label">Sample board</span>
            </div>
            <div className="studio-viewer-artifact">{moment.artifact}</div>
          </section>
        ))}
      </div>
    </section>
  );
}
