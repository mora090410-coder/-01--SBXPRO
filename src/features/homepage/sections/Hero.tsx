import React from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow, Reveal, SectionTone, Spotlight } from '../../../design/primitives';
import { useParallax } from '../atmosphere/useParallax';
import { DEMO_LABEL, demoBoard, demoGame } from '../demoData';
import { MONEY_BOUNDARY } from '../pricing';
import { HeroViewer } from '../renders/HeroViewer';
import { SiteHeader } from '../../site/SiteHeader';
import { primaryLink, quietLink } from './cta';
import './hero-studio.css';

/** Finished demo board, a far-plane picture rather than a second interactive board. */
function HeroBoard() {
  return (
    <div className="studio-hero-board device-rim" role="img" aria-label="Sample complete board, Chiefs at Eagles, with 100 squares and drawn axis digits">
      <div aria-hidden="true">
        <div className="studio-hero-board-header">
          <span className="font-display">Lincoln Softball</span>
          <span className="font-mono">Chiefs at Eagles</span>
        </div>
        <div className="studio-hero-board-team font-mono">{demoGame.topName}</div>
        <div className="studio-hero-grid">
          <span className="studio-hero-axis">KC</span>
          {demoBoard.topAxis.map((digit) => <span className="studio-hero-axis" key={`top-${digit}`}>{digit}</span>)}
          {demoBoard.leftAxis.map((digit, row) => (
            <React.Fragment key={digit}>
              <span className="studio-hero-axis">{digit}</span>
              {demoBoard.squares.slice(row * 10, row * 10 + 10).map((names, col) => (
                <span key={col} className={`studio-hero-cell${names[0] === 'OPEN' ? ' studio-hero-cell-open' : ''}`}>
                  {names[0]}
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
        <div className="studio-hero-board-footer font-mono">One board. One link. Everyone in the game.</div>
      </div>
    </div>
  );
}

export function Hero() {
  const board = useParallax<HTMLDivElement>({ maxPx: 24, rotateFromDeg: -7, rotateToDeg: -4 });
  const phone = useParallax<HTMLDivElement>({ maxPx: 40, rotateFromDeg: 3, rotateToDeg: 1 });
  const atmosphere = useParallax<HTMLDivElement>({ maxPx: 10 });

  return (
    <section data-sc-act="flow" data-testid="homepage-first-viewport" className="studio-hero relative overflow-x-clip">
      <SectionTone tone="cardinal" side="right" />
      <div className="studio-hero-shell relative z-10 mx-auto w-full">
        <SiteHeader />
        <div className="studio-hero-layout">
          <div className="studio-hero-copy">
            <Reveal><Eyebrow>Football squares fundraiser boards</Eyebrow></Reveal>
            <Reveal delay={60}>
              <h1 className="studio-hero-title font-display text-fg">Build it once. <span className="block">Share one link.</span></h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="studio-hero-description font-ui text-fg-2">
                Let the board run game day. For youth-sports teams, booster clubs, schools, and community organizers who would rather watch the game than the paper.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <div className="studio-hero-actions flex flex-wrap items-center gap-3">
                <Link to="/create" className={primaryLink}>Create your free board</Link>
                <Link to="/demo" className={quietLink}>See a live board</Link>
              </div>
            </Reveal>
            <Reveal delay={240}>
              <ul className="studio-hero-boundary font-ui text-fg-3">
                <li>First published board free</li>
                <li>Viewers open the link without creating an account</li>
                <li>{MONEY_BOUNDARY}</li>
              </ul>
            </Reveal>
          </div>
          <div className="studio-hero-stage">
            <div ref={atmosphere} className="studio-hero-atmosphere">
              <Spotlight className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" breathe />
            </div>
            <div ref={board} className="studio-hero-board-plane"><HeroBoard /></div>
            <div ref={phone} className="studio-hero-phone-plane"><HeroViewer /></div>
            <p className="studio-hero-caption font-mono text-fg-3">{DEMO_LABEL}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
