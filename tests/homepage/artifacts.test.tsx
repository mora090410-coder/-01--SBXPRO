import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BoardFragment } from '../../src/features/homepage/artifacts/BoardFragment';
import { HeroViewerCard } from '../../src/features/homepage/artifacts/HeroViewerCard';
import { OrganizerCard } from '../../src/features/homepage/artifacts/OrganizerCard';
import { ScoreMoment } from '../../src/features/homepage/artifacts/ScoreMoment';

describe('BoardFragment', () => {
  it('shows the winning cell in gold with a descriptive label', () => {
    render(<BoardFragment highlight={{ left: 7, top: 4 }} />);
    const grid = screen.getByRole('img', { name: /Taylor M\. holds PHI 4 across, KC 7 down/ });
    expect(grid).toBeInTheDocument();
    const gold = grid.querySelector('[data-cell="7-4"]');
    expect(gold?.className).toContain('bg-gold');
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

describe('HeroViewerCard', () => {
  it('shows the demo label, your squares, and the true wins-now line', () => {
    render(<HeroViewerCard />);
    expect(screen.getByText('Demo board — sample names and scores')).toBeInTheDocument();
    expect(screen.getByText('Your squares · Taylor M. · 3')).toBeInTheDocument();
    expect(screen.getByText('Taylor M. wins right now')).toBeInTheDocument();
    expect(screen.getByText('Lincoln Softball Booster Board')).toBeInTheDocument();
  });
});

describe('OrganizerCard', () => {
  it('is on the cream base with the reconcile line and three rings', () => {
    const { container } = render(<OrganizerCard />);
    expect(container.querySelector('[data-base="cream"]')).not.toBeNull();
    expect(screen.getByText('83 filled · 17 open · 6 unpaid')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /percent|drawn/i }).length).toBe(3);
  });
});
