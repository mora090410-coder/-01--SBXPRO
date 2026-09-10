import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const currentPricingCopyFiles = [
  'src/features/homepage/pricing.ts',
  'src/features/homepage/Homepage.tsx',
  'src/features/homepage/sections/PriceAndClose.tsx',
  'src/features/homepage/sections/Hero.tsx',
  'pages/Terms.tsx',
  'pages/HowToRunSquares.tsx',
  'pages/RunYourPoolAlternative.tsx',
  'seo/publicRouteMetadata.ts',
  'index.html',
  'public/llms.txt',
  'README.md',
  'PRODUCT.md',
  'docs/marketing/gridone-launch-social-pack-2026-04-19.md',
];

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('launch pricing copy', () => {
  it('keeps current customer copy on the approved three-tier ladder', () => {
    const corpus = currentPricingCopyFiles
      .map((path) => `${path}\n${read(path)}`)
      .join('\n');

    expect(corpus).not.toMatch(/(?:^|[^\d])4\.99(?:[^\d]|$)/i);
    expect(corpus).not.toMatch(/(?:^|[^\d])14\.99(?:[^\d]|$)/i);
    expect(corpus).not.toMatch(/\b20\s+boards?\b/i);
    expect(corpus).not.toMatch(/introductory\s+2026\s+season\s+pass/i);

    expect(read('PRODUCT.md')).toContain('The Free tier includes **1 published board per account per season**.');
    expect(read('PRODUCT.md')).toContain('The **Game Day** tier is **$9.99 once** for up to 5 published boards');
    expect(read('PRODUCT.md')).toContain('The **Organization** tier is **$79 per season** for up to 50 published boards');
  });

  it('keeps system vocabulary out of the landing-page sales copy', () => {
    const landing = currentPricingCopyFiles
      .filter((path) => path.startsWith('src/features/homepage/'))
      .map(read)
      .join('\n');

    expect(landing).not.toMatch(/\b(?:beta|synthetic|fallback|read-only|grounded|native|canonical|provenance|freshness|entitlement)\b/i);
    expect(landing).toContain('Explore a sample board');
    expect(landing).toContain('First published board free');
  });

  it('does not ship invented payout amounts in live board surfaces', () => {
    const payoutSurfaces = [
      read('src/features/organizer/workspace/OrganizerWorkspace.tsx'),
      read('src/features/organizer/workspace/PayoutRulesCard.tsx'),
      read('src/features/viewer/shell/ViewerShell.tsx'),
      read('src/features/viewer/details/BoardDetailsDisclosure.tsx'),
      read('hooks/usePoolData.ts'),
    ].join('\n');

    expect(payoutSurfaces).not.toMatch(/\$(?:125|250)\b/);
    expect(payoutSurfaces).not.toMatch(/payout[^\n]*(?:\?\?|:)\s*(?:125|250)\b/i);
  });
});
