import React from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow, Glass, Numeral } from '../../../design/primitives';
import { MONEY_BOUNDARY, PRICING } from '../pricing';
import { ghostLink, primaryLink, quietLink } from './cta';

const guides: Array<{ path: string; label: string }> = [
  { path: '/articles/how-football-squares-work', label: 'How football squares work' },
  { path: '/articles/how-to-run-super-bowl-squares', label: 'How to run Super Bowl squares' },
  { path: '/articles/football-squares-fundraiser', label: 'Football squares fundraiser' },
  { path: '/articles/youth-sports-football-squares-fundraiser', label: 'Youth sports fundraiser squares' },
  { path: '/articles/booster-club-football-squares', label: 'Booster club squares' },
  { path: '/articles/church-school-football-squares-fundraiser', label: 'Church and school fundraiser squares' },
  { path: '/articles/office-super-bowl-squares', label: 'Office Super Bowl squares' },
  { path: '/articles/super-bowl-squares-ideas', label: 'Super Bowl squares ideas' },
  { path: '/articles/digital-football-squares-board-vs-paper', label: 'Digital board vs paper' },
  { path: '/articles/nfl-opening-week-squares-pool', label: 'NFL opening week squares' },
  { path: '/articles/football-squares-app', label: 'Football squares app' },
  { path: '/articles/run-your-pool-alternative', label: 'Run Your Pool alternative' },
];

const faq = [
  { q: 'Do viewers need an account?', a: 'No. Viewers open the link without creating an account. Only the organizer signs in.' },
  { q: 'Does GridOne collect square money?', a: `No. ${MONEY_BOUNDARY} Squares and payouts stay between you and your group.` },
  { q: 'When do I pay?', a: 'Building, editing, and previewing are free on every plan. Your first published board is free. You pay only when you publish a second board.' },
  { q: 'Who can edit the board?', a: 'Only the signed-in organizer. Everyone else sees the same live board. Published names change only through a visible, dated correction.' },
];

export function PriceAndClose() {
  return (
    <>
      <section className="px-6 py-16 md:px-12 md:py-24 grid gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
        <div className="flex flex-col gap-3 max-w-[460px]">
          <Eyebrow>2026 pricing</Eyebrow>
          <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">Free to start. Pay when you publish another.</h2>
          <p className="font-ui text-[15px] text-fg-3">{MONEY_BOUNDARY}</p>
        </div>
        <Glass as="section" aria-label="Plans" padding="none" className="divide-y divide-hairline">
          {PRICING.map((tier) => (
            <div key={tier.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 p-6 items-start">
              <div className="flex flex-col gap-1">
                <h3 className="font-ui text-[17px] font-medium text-fg">{tier.name}</h3>
                <p className="font-ui text-[15px] text-fg-2">{tier.detail}</p>
              </div>
              <Numeral value={tier.price} secondary={tier.priceNote} size="md" label={`${tier.price} ${tier.priceNote}`} />
            </div>
          ))}
        </Glass>
      </section>

      <section className="px-6 py-16 md:px-12 md:py-24 flex flex-col gap-8 max-w-[720px]">
        <h2 className="font-display text-[34px] leading-[1.05] text-fg md:text-[44px]">Ready to build the board?</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/create" className={primaryLink}>Create your free board</Link>
          <Link to="/demo" className={quietLink}>See a live board</Link>
        </div>
        <div className="flex flex-col divide-y divide-hairline border-y border-hairline">
          {faq.map((item) => (
            <details key={item.q} className="group py-2">
              <summary className="min-h-11 flex items-center justify-between gap-4 cursor-pointer font-ui text-[17px] text-fg list-none [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span aria-hidden="true" className="font-mono text-[17px] text-fg-3 group-open:hidden">+</span>
                <span aria-hidden="true" className="font-mono text-[17px] text-fg-3 hidden group-open:inline">−</span>
              </summary>
              <p className="pb-4 font-ui text-[15px] leading-[1.5] text-fg-2">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="px-6 py-12 md:px-12 border-t border-hairline flex flex-col gap-8" role="contentinfo">
        <div className="flex flex-col gap-3">
          <Eyebrow>Guides</Eyebrow>
          <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2 md:grid-cols-3">
            {guides.map((g) => (
              <li key={g.path}><Link to={g.path} className={ghostLink}>{g.label}</Link></li>
            ))}
            <li><Link to="/articles" className={ghostLink}>All guides</Link></li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="font-display text-[18px] text-fg">GridOne</span>
          <Link to="/login?mode=signin" className={ghostLink}>Sign in</Link>
          <Link to="/privacy" className={ghostLink}>Privacy</Link>
          <Link to="/terms" className={ghostLink}>Terms</Link>
        </div>
      </footer>
    </>
  );
}
