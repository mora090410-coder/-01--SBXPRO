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
    expect(tokens).toContain('#111318');
    expect(tokens).toContain('#F5F1EA');
  });

  it('lifts the dark ground, panel, and hairline off pure black', () => {
    const dark = tokens.slice(tokens.indexOf('[data-base="dark"]'), tokens.indexOf('[data-base="cream"]'));
    expect(dark).toMatch(/--g-ground:\s*#111318/);
    expect(dark).toMatch(/--g-panel:\s*rgba\(255,\s*255,\s*255,\s*0\.07\)/);
    expect(dark).toMatch(/--g-panel-hover:\s*rgba\(255,\s*255,\s*255,\s*0\.10\)/);
    expect(dark).toMatch(/--g-hairline:\s*rgba\(255,\s*255,\s*255,\s*0\.12\)/);
  });

  it('leaves the cream base untouched', () => {
    const cream = tokens.slice(tokens.indexOf('[data-base="cream"]'));
    expect(cream).toMatch(/--g-ground:\s*#F5F1EA/);
    expect(cream).toMatch(/--g-panel:\s*rgba\(255,\s*255,\s*255,\s*0\.70\)/);
    expect(cream).toMatch(/--g-panel-hover:\s*rgba\(255,\s*255,\s*255,\s*0\.85\)/);
    expect(cream).toMatch(/--g-hairline:\s*rgba\(14,\s*15,\s*18,\s*0\.08\)/);
  });

  it('derives the three ambient tints from brand colors with color-mix, at 14%', () => {
    for (const [name, brand] of [
      ['--g-tint-cardinal', '--g-cardinal'],
      ['--g-tint-live', '--g-live'],
      ['--g-tint-gold', '--g-gold'],
    ] as const) {
      const re = new RegExp(`${name}:\\s*color-mix\\(in srgb, transparent 86%, var\\(${brand}\\)\\);`);
      expect(tokens, name).toMatch(re);
    }
  });

  it('introduces no hue outside gold, cardinal, live, and neutral', () => {
    const BRAND_HUES = [44.1, 142.1, 352.1]; // gold, live, cardinal
    const literals: [number, number, number][] = [];
    for (const m of tokens.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
      const h = m[1];
      literals.push([parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]);
    }
    for (const m of tokens.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
      literals.push([Number(m[1]), Number(m[2]), Number(m[3])]);
    }
    expect(literals.length).toBeGreaterThan(0);

    for (const [r, g, b] of literals) {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = max - min;
      if (chroma <= 12) continue; // neutral: no hue to police
      let hue: number;
      if (max === r) hue = 60 * (((g - b) / chroma + 6) % 6);
      else if (max === g) hue = 60 * ((b - r) / chroma + 2);
      else hue = 60 * ((r - g) / chroma + 4);
      const nearest = Math.min(...BRAND_HUES.map((h) => {
        const d = Math.abs(hue - h);
        return Math.min(d, 360 - d);
      }));
      expect(nearest, `rgb(${r}, ${g}, ${b}) hue ${hue.toFixed(1)} is outside the locked palette`).toBeLessThanOrEqual(10);
    }
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
