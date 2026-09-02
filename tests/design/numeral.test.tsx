import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Numeral } from '../../src/design/primitives/Numeral';

describe('Numeral', () => {
  it('renders value and dimmed secondary with one accessible label', () => {
    render(<Numeral value="$14" secondary=".99" label="14 dollars and 99 cents" />);
    const el = screen.getByLabelText('14 dollars and 99 cents');
    expect(el.className).toContain('font-mono');
    expect(el.className).toContain('tabular-nums');
    expect(screen.getByText('.99').className).toContain('text-fg-3');
  });

  it('scales', () => {
    render(<Numeral value={21} size="xl" />);
    expect(screen.getByText('21').className).toContain('text-[72px]');
  });
});
