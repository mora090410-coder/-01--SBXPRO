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
          <div className="flex min-h-11 items-center justify-between gap-4">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-gold">GridOne</p>
            <Link to="/login?mode=signin" className="inline-flex min-h-11 items-center border-b border-broadcast-white/35 text-sm font-bold text-broadcast-white hover:border-gold hover:text-gold" style={minTouch}>Sign in to existing account</Link>
          </div>
          <h1 className="mt-1 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.05em] text-broadcast-white md:text-7xl">Football-squares fundraiser boards</h1>
          <p className="mt-4 max-w-2xl text-lg font-semibold leading-relaxed text-broadcast-white/82 md:text-2xl">For youth-sports teams, booster clubs, schools, and community organizers: build the board, share one viewer link, and let GridOne track game day.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link to="/create" className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 text-base font-black text-ink shadow-lg shadow-gold/20" style={minTouch}>Create your free board</Link>
            <Link to="/demo" className="inline-flex min-h-11 items-center justify-center rounded-full border border-broadcast-white/25 bg-broadcast-white/10 px-6 text-base font-black text-broadcast-white" style={minTouch}>See a live board</Link>
          </div>
          <div className="mt-3 grid gap-3 text-sm font-bold text-broadcast-white/86 sm:grid-cols-3">
            <p className="rounded-2xl border border-live-green/35 bg-live-green/10 p-3 text-live-green">First published board free</p>
            <p className="rounded-2xl border border-broadcast-white/15 bg-broadcast-white/5 p-3">Viewers open the link without creating an account</p>
            <p className="rounded-2xl border border-broadcast-white/15 bg-broadcast-white/5 p-3">GridOne tracks the board. It does not collect square money, hold funds, adjudicate off-platform payment, or pay winners.</p>
          </div>
        </div>
        <div className="min-w-0">
          <HomepageProofArtifact />
        </div>
      </section>

      <section className="bg-newsprint px-4 py-14 text-ink md:px-8" aria-labelledby="workflow-title">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cardinal">How it works</p>
          <h2 id="workflow-title" className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Run the board without chasing paper, texts, and screenshots.</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {['Add names to sold squares', 'Check OPEN squares', 'Draw the numbers', 'Preview the share link', 'Publish for game day'].map((item) => (
              <div key={item} className="rounded-3xl border border-ink/10 bg-broadcast-white p-4 text-sm font-bold shadow-sm">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-broadcast-white px-4 py-14 text-ink md:px-8" aria-labelledby="pricing-title">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cardinal">2026 pricing</p>
          <h2 id="pricing-title" className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Start free. Upgrade only for more published boards.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <PriceCard name="Free" price="$0" detail="1 published board per account per season" />
            <PriceCard name="Game Day" price="$9.99" detail="$9.99 once for up to 5 published boards in the 2026 season" />
            <PriceCard name="Organization" price="$79" detail="$79 per season for up to 50 published boards, organization naming, shared dashboard, and one organization receipt" />
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-8" aria-label="Game day with GridOne">
        <div className="mx-auto max-w-4xl rounded-3xl border border-broadcast-white/10 bg-broadcast-white/5 p-5">
          <details>
            <summary className="min-h-11 cursor-pointer text-lg font-black text-broadcast-white" style={minTouch}>What changes on game day</summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-broadcast-white/75">Once the board is published, everyone opens one link to find their squares, follow the score, and see which squares match each scoring moment. There is no app to download, and GridOne never collects square money.</p>
          </details>
        </div>
      </section>

      <section className="bg-newsprint px-4 py-14 text-ink md:px-8" aria-labelledby="homepage-faq-title">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cardinal">Questions organizers ask</p>
          <h2 id="homepage-faq-title" className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Know what happens before you publish.</h2>
          <div className="mt-8 grid gap-3">
            {[
              ['Do viewers need an account?', 'No. Viewers open the shared board link without signing in.'],
              ['Does GridOne collect square money?', 'No. GridOne tracks the board. It does not collect square money, hold funds, adjudicate off-platform payment, or pay winners.'],
              ['When do I pay?', 'Your first published board is free. Upgrades only increase how many boards you can publish in the 2026 season.'],
              ['Who can edit the board?', 'One signed-in organizer owns and edits each board. Viewers have read-only access.'],
            ].map(([question, answer]) => (
              <details key={question} className="rounded-2xl border border-ink/10 bg-broadcast-white p-4">
                <summary className="min-h-11 cursor-pointer font-black" style={minTouch}>{question}</summary>
                <p className="mt-2 max-w-3xl text-ink/70">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 text-center md:px-8" aria-labelledby="homepage-final-cta-title">
        <div className="mx-auto max-w-3xl">
          <h2 id="homepage-final-cta-title" className="text-3xl font-black md:text-5xl">Ready to build the board?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-broadcast-white/75">Create the organizer account, set the game, and publish when the board is ready. Your first published board is free.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/create" className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 text-base font-black text-ink" style={minTouch}>Create your free board</Link>
            <Link to="/demo" className="inline-flex min-h-11 items-center justify-center rounded-full border border-broadcast-white/25 px-6 text-base font-black text-broadcast-white" style={minTouch}>See the live board demo</Link>
          </div>
          <nav className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-broadcast-white/70" aria-label="GridOne links">
            <Link to="/login?mode=signin" className="inline-flex min-h-11 items-center" style={minTouch}>Sign in</Link>
            <Link to="/articles" className="inline-flex min-h-11 items-center" style={minTouch}>Guides</Link>
            <Link to="/privacy" className="inline-flex min-h-11 items-center" style={minTouch}>Privacy</Link>
            <Link to="/terms" className="inline-flex min-h-11 items-center" style={minTouch}>Terms</Link>
          </nav>
        </div>
      </section>
    </main>
  );
}
