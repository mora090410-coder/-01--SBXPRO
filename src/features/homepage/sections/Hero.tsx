import React from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow, Spotlight } from '../../../design/primitives';
import { HeroViewerCard } from '../artifacts/HeroViewerCard';
import { MONEY_BOUNDARY } from '../pricing';
import { ghostLink, primaryLink, quietLink } from './cta';

export function Hero() {
  return (
    <section data-testid="homepage-first-viewport" className="relative overflow-hidden px-6 pt-6 pb-16 md:px-12 md:pt-8 md:pb-24">
      <header className="flex items-center justify-between h-11">
        <span className="font-display text-[22px] text-fg">GridOne</span>
        <Link to="/login?mode=signin" className={ghostLink}>Sign in</Link>
      </header>

      <div className="relative mt-10 grid gap-12 md:mt-16 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center">
        <div className="flex flex-col gap-6 max-w-[560px]">
          <Eyebrow>Football squares fundraiser boards</Eyebrow>
          <h1 className="font-display text-[44px] leading-[1] tracking-[-0.01em] text-fg md:text-[64px]">Build it once. <span className="block">Share one link.</span></h1>
          <p className="font-ui text-[17px] leading-[1.5] text-fg-2">
            Let the board run game day. For youth-sports teams, booster clubs, schools, and community organizers who would rather watch the game than the paper.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/create" className={primaryLink}>Create your free board</Link>
            <Link to="/demo" className={quietLink}>See a live board</Link>
          </div>
          <ul className="flex flex-col gap-1 font-ui text-[14px] text-fg-3">
            <li>First published board free</li>
            <li>Viewers open the link without creating an account</li>
            <li>{MONEY_BOUNDARY}</li>
          </ul>
        </div>

        <div className="relative flex justify-center md:justify-end">
          <Spotlight className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          <HeroViewerCard className="relative rotate-[-3deg] md:rotate-[3deg]" />
        </div>
      </div>
    </section>
  );
}
