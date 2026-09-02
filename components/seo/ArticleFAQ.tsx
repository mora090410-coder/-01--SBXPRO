import React from 'react';
import { Glass } from '../../src/design/primitives';

export type FAQItem = {
  question: string;
  answer: string;
};

// Builds the FAQPage JSON-LD from the same items rendered by ArticleFAQ so the
// structured data always matches the visible page content.
export const faqPageSchema = (faqs: FAQItem[]) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
});

export const ArticleFAQ: React.FC<{ faqs: FAQItem[] }> = ({ faqs }) => (
  <>
    <h2 className="font-display text-[28px] leading-[1.1] text-fg mt-12 mb-4">Frequently asked questions</h2>
    <div className="flex flex-col gap-4">
      {faqs.map((faq) => (
        <Glass key={faq.question} padding="lg">
          <h3 className="font-ui text-[19px] font-semibold text-fg mb-3">{faq.question}</h3>
          <p className="font-ui text-[17px] leading-[1.6] text-fg-2">{faq.answer}</p>
        </Glass>
      ))}
    </div>
  </>
);
