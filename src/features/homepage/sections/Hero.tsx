import React from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow, Reveal, SectionTone, Spotlight } from '../../../design/primitives';
import { useParallax } from '../atmosphere/useParallax';
import { DEMO_LABEL } from '../demoData';
import { MONEY_BOUNDARY } from '../pricing';
import { HeroViewer } from '../renders/HeroViewer';
import { SiteHeader } from '../../site/SiteHeader';
import { primaryLink, quietLink } from './cta';

export function Hero() {
  // Vertical travel plus a rotation easing 3deg -> 1deg on desktop. The hook drives
  // the independent `translate` and `rotate` properties, so `rotate` REPLACES the
  // `md:rotate-[3deg]` class rather than composing with it (an inline `transform`
  // would have added to it and rested the artifact at 6deg). The class value is the
  // same 3deg the hook writes at scrollY 0, so there is nothing to snap between.
  // Inert under reduced motion and below md; never writes a horizontal translate.
  const artifact = useParallax<HTMLDivElement>({ maxPx: 40, rotateFromDeg: 3, rotateToDeg: 1 });

  return (
    <section data-testid="homepage-first-viewport" className="relative overflow-x-clip">
      {/* Ambient ground tone. Content below carries `relative z-10` so the tint stays behind it. */}
      <SectionTone tone="cardinal" side="right" />

      {/* Full-bleed section, capped content: the tone clips off-screen, not at a
          1200px column edge. The padding lives inside the cap, exactly as it did
          when the cap was a page-level wrapper, so the column is unchanged. */}
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6 pt-6 pb-16 md:px-12 md:pt-8 md:pb-24">
        <SiteHeader />

        <div className="mt-10 grid gap-12 md:mt-16 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center">
          <div className="flex flex-col gap-6 max-w-[560px]">
            <Reveal><Eyebrow>Football squares fundraiser boards</Eyebrow></Reveal>
            <Reveal delay={60}>
              <h1 className="font-display text-[44px] leading-[1] tracking-[-0.01em] text-fg md:text-[64px]">Build it once. <span className="block">Share one link.</span></h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="font-ui text-[17px] leading-[1.5] text-fg-2">
                Let the board run game day. For youth-sports teams, booster clubs, schools, and community organizers who would rather watch the game than the paper.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/create" className={primaryLink}>Create your free board</Link>
                <Link to="/demo" className={quietLink}>See a live board</Link>
              </div>
            </Reveal>
            <Reveal delay={240}>
              <ul className="flex flex-col gap-1 font-ui text-[14px] text-fg-3">
                <li>First published board free</li>
                <li>Viewers open the link without creating an account</li>
                <li>{MONEY_BOUNDARY}</li>
              </ul>
            </Reveal>
          </div>

          <div className="relative flex flex-col items-center gap-3 md:items-end">
            <Spotlight className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" breathe />
            <div ref={artifact} className="relative z-10 w-fit max-w-full rotate-[-3deg] md:rotate-[3deg] will-change-[translate,rotate]">
              <HeroViewer />
            </div>
            <p className="relative z-10 font-mono text-[12px] text-fg-3">{DEMO_LABEL}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
