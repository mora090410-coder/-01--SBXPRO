import React from 'react';
import { Link } from 'react-router-dom';
import HomepageProofArtifact from './HomepageProofArtifact';

const minTouch = { minHeight: 44 };

const PriceCard = ({ name, price, detail }: { name: string; price: string; detail: string }) => (
  <article className="rounded-3xl border border-ink/10 bg-broadcast-white p-5 shadow-sm">
    <h3 className="text-xl font-black text-ink">{name}</h3>
    <p className="mt-2 text-lg font-black text-cardinal">{price}</p>
    <p className="mt-2 text-sm leading-relaxed text-ink/70">{detail}</p>
  </article>
);

export default function HomepageV2() {
  return (
    <main data-testid="homepage-v2" className="min-h-[100dvh] overflow-x-hidden bg-ink text-broadcast-white">
      <section data-testid="homepage-v2-first-viewport" className="mx-auto grid min-h-[100dvh] w-full max-w-7xl items-start gap-6 px-4 py-5 md:grid-cols-[minmax(0,0.92fr)_minmax(360px,1fr)] md:px-8 md:py-8">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-gold">GridOne</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.05em] text-broadcast-white md:text-7xl">Football-squares fundraiser boards</h1>
          <p className="mt-5 max-w-2xl text-lg font-semibold leading-relaxed text-broadcast-white/82 md:text-2xl">Build the board, share one link, and let GridOne track game day.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/create" className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 text-base font-black text-ink shadow-lg shadow-gold/20" style={minTouch}>Create your free board</Link>
            <Link to="/demo" className="inline-flex min-h-11 items-center justify-center rounded-full border border-broadcast-white/25 bg-broadcast-white/10 px-6 text-base font-black text-broadcast-white" style={minTouch}>See a live board</Link>
          </div>
          <div className="mt-5 grid gap-3 text-sm font-bold text-broadcast-white/86 sm:grid-cols-2">
            <p className="rounded-2xl border border-live-green/35 bg-live-green/10 p-3 text-live-green">First published board free</p>
            <p className="rounded-2xl border border-broadcast-white/15 bg-broadcast-white/5 p-3">GridOne tracks the board. It does not collect square money, hold funds, or pay winners.</p>
          </div>
        </div>
        <div className="min-w-0">
          <HomepageProofArtifact />
        </div>
      </section>

      <section className="bg-newsprint px-4 py-14 text-ink md:px-8" aria-labelledby="workflow-title">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cardinal">Fundraiser workflow</p>
          <h2 id="workflow-title" className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Replace the poster-board operating mess.</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {['Fill sold squares', 'Reconcile open squares', 'Draw axis digits', 'Preview the viewer link', 'Go Live for game day'].map((item) => (
              <div key={item} className="rounded-3xl border border-ink/10 bg-broadcast-white p-4 text-sm font-bold shadow-sm">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-broadcast-white px-4 py-14 text-ink md:px-8" aria-labelledby="pricing-title">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cardinal">Canonical 2026 pricing</p>
          <h2 id="pricing-title" className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Start free. Upgrade only for more published boards.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <PriceCard name="Free" price="$0" detail="1 published board per account per season" />
            <PriceCard name="Game Day" price="$9.99" detail="$9.99 once for up to 5 published boards in the 2026 season" />
            <PriceCard name="Organization" price="$79" detail="$79 per season for up to 50 published boards" />
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-8" aria-label="Optional story">
        <div className="mx-auto max-w-4xl rounded-3xl border border-broadcast-white/10 bg-broadcast-white/5 p-5">
          <details>
            <summary className="min-h-11 cursor-pointer text-lg font-black text-broadcast-white" style={minTouch}>Optional brand story</summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-broadcast-white/75">A static, skippable story can explain how game day changes after the product is already usable. Reduced-motion users receive this same text without animation runtime or choreography in the homepage critical path.</p>
          </details>
        </div>
      </section>
    </main>
  );
}
