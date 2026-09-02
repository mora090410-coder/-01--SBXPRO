import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Eyebrow } from '../../src/design/primitives/Eyebrow';

describe('Eyebrow', () => {
  it('renders mono uppercase muted text', () => {
    render(<Eyebrow>Native computer use</Eyebrow>);
    const el = screen.getByText('Native computer use');
    expect(el.className).toContain('font-mono');
    expect(el.className).toContain('uppercase');
    expect(el.className).toContain('text-fg-3');
  });
});
