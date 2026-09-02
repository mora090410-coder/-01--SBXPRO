import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/index.css', 'utf8');

describe('index.css cascade', () => {
  it('resets the legacy unlayered focus outline inside redesigned bases', () => {
    expect(css).toMatch(/\[data-base\] button:focus-visible[\s\S]*?\{\s*outline:\s*none;?\s*\}/);
  });
});
