import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BoardFragment } from '../../src/features/homepage/artifacts/BoardFragment';
import { ScoreMoment } from '../../src/features/homepage/artifacts/ScoreMoment';

describe('BoardFragment', () => {
  it('is one picture with the winning cell in gold and no readable cells', () => {
    render(<BoardFragment highlight={{ left: 7, top: 4 }} />);
    const grid = screen.getByRole('img', { name: 'Board fragment with the winning square at PHI 4, KC 7' });
    expect(grid).toBeInTheDocument();
    const gold = grid.querySelector('[data-cell="7-4"]');
    expect(gold?.className).toContain('bg-gold');
    expect(gold).toHaveAttribute('aria-hidden', 'true');
    expect(grid.textContent).toContain('OPEN');
  });
});

describe('ScoreMoment', () => {
  it('renders both scores with accessible labels and the live tag', () => {
    render(<ScoreMoment />);
    expect(screen.getByRole('img', { name: 'Kansas City 17' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Philadelphia 14' })).toBeInTheDocument();
    expect(screen.getByText('Live · Q3')).toBeInTheDocument();
    expect(screen.getByText(/Sample score/)).toBeInTheDocument();
  });
});
