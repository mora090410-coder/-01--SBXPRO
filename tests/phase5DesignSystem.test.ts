import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 5 visual system', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
  const componentPaths = execFileSync(
    'rg',
    ['--files', 'components', 'pages', '-g', '*.tsx'],
    { cwd: process.cwd(), encoding: 'utf8' },
  ).trim().split('\n').filter(Boolean);
  const componentCorpus = componentPaths.map(
    (path) => readFileSync(resolve(process.cwd(), path), 'utf8'),
  ).join('\n');

  it('keeps one 8/12/0 radius system and a deliberately sharp board', () => {
    expect(css).toContain('--gridone-radius-control: 8px');
    expect(css).toContain('--gridone-radius-surface: 12px');
    expect(css).toContain('--gridone-radius-grid: 0px');
    expect(css).toContain('.gridone-board-grid td');
    expect(`${css}\n${componentCorpus}`).not.toContain('rounded-none');
    expect(css).not.toMatch(/border-radius:\s*0(?:px)?\s*;/);
    expect(css).not.toMatch(/border-radius:\s*(?:999px|50%)/);
  });

  it('uses the single elevation token in exactly two allowed rule blocks', () => {
    expect(css.match(/var\(--gridone-elevation-raised\)/g)).toHaveLength(2);
    expect(css).toMatch(/role="dialog"[\s\S]*var\(--gridone-elevation-raised\)/);
    expect(css).toMatch(/\.gridone-organizer-header[\s\S]*var\(--gridone-elevation-raised\)/);
  });

  it('does not reintroduce gradients, blur, or arbitrary shadow utilities', () => {
    expect(css).not.toMatch(/(?:linear|radial|conic)-gradient\(/);
    expect(css).not.toMatch(/backdrop-filter|filter:\s*blur/);
    expect(componentCorpus).not.toMatch(/shadow-\[/);
  });
});
