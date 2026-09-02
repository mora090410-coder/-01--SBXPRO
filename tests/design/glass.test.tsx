import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Glass } from '../../src/design/primitives/Glass';
import { Spotlight } from '../../src/design/primitives/Spotlight';

describe('Glass', () => {
  it('renders a translucent card with hairline and card radius', () => {
    render(<Glass data-testid="g">content</Glass>);
    const el = screen.getByTestId('g');
    expect(el.className).toContain('bg-panel');
    expect(el.className).toContain('border-hairline');
    expect(el.className).toContain('rounded-card');
    expect(el.className).toContain('backdrop-blur');
  });

  it('supports a semantic tag', () => {
    render(<Glass as="section" aria-label="Score">x</Glass>);
    expect(screen.getByRole('region', { name: 'Score' }).tagName).toBe('SECTION');
  });
});

describe('Spotlight', () => {
  it('is decorative and non-interactive', () => {
    const { container } = render(<Spotlight />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.className).toContain('pointer-events-none');
    expect(el.className).toContain('absolute');
  });
});
