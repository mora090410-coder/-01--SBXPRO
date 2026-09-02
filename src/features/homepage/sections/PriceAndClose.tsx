import React from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow, Glass, Numeral } from '../../../design/primitives';
import { MONEY_BOUNDARY, PRICING, PRICING_SENTENCE } from '../pricing';
import { primaryLink, quietLink } from './cta';

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
          <p className="font-ui text-[17px] leading-[1.5] text-fg-2">{PRICING_SENTENCE}</p>
          <p className="font-ui text-[15px] text-fg-3">{MONEY_BOUNDARY}</p>
        </div>
        <Glass as="section" aria-label="Plans" padding="none" className="divide-y divide-hairline">
          {PRICING.map((tier) => (
            <div key={tier.id} className="flex flex-col gap-3 p-6 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
              <Numeral
                value={tier.price}
                secondary={tier.priceNote}
                size="md"
                label={`${tier.price} ${tier.priceNote}`}
                className="sm:order-2 sm:justify-self-end"
              />
              <div className="flex flex-col gap-1">
                <h3 className="font-ui text-[17px] font-medium text-fg">{tier.name}</h3>
                <p className="font-ui text-[15px] text-fg-2">{tier.detail}</p>
              </div>
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
    </>
  );
}
