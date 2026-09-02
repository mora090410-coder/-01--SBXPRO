import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync('src/design/tokens.css', 'utf8');

describe('design tokens', () => {
  it('locks the palette', () => {
    for (const hex of ['#8F1D2C', '#6E1622', '#FFC72C', '#E0A600', '#22C55E', '#0E0F12', '#16181D', '#EFF0F1', '#DEE0E1']) {
      expect(tokens).toContain(hex);
    }
  });

  it('defines both grounds', () => {
    expect(tokens).toContain('#0B0C0F');
    expect(tokens).toContain('#F5F1EA');
  });

  it('defines the radius scale', () => {
    expect(tokens).toMatch(/--g-radius-control:\s*12px/);
    expect(tokens).toMatch(/--g-radius-card:\s*20px/);
    expect(tokens).toMatch(/--g-radius-capsule:\s*999px/);
    expect(tokens).toMatch(/--g-radius-cell:\s*4px/);
  });

  it('defines the two motion curves and reduced-motion override', () => {
    expect(tokens).toMatch(/--g-ease-state:\s*cubic-bezier\(0\.2,\s*0,\s*0,\s*1\)/);
    expect(tokens).toMatch(/--g-dur-state:\s*200ms/);
    expect(tokens).toMatch(/--g-dur-spring:\s*450ms/);
    expect(tokens).toContain('prefers-reduced-motion: reduce');
  });

  it('flips action color per base: gold on dark, cardinal on cream', () => {
    const dark = tokens.slice(tokens.indexOf('[data-base="dark"]'), tokens.indexOf('[data-base="cream"]'));
    const cream = tokens.slice(tokens.indexOf('[data-base="cream"]'));
    expect(dark).toMatch(/--g-action:\s*var\(--g-gold\)/);
    expect(cream).toMatch(/--g-action:\s*var\(--g-cardinal\)/);
  });
});
