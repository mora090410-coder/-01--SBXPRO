import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Homepage from '../../src/features/homepage/Homepage';

const renderPage = () => render(<MemoryRouter><Homepage /></MemoryRouter>);

describe('Static homepage product examples', () => {
  it('makes names, open squares, and preparation state readable without interactive controls', () => {
    renderPage();
    const organizer = screen.getByRole('region', { name: 'Sample organizer workspace' });
    expect(within(organizer).getAllByText('Taylor M.').length).toBeGreaterThan(0);
    expect(within(organizer).getAllByText('OPEN').length).toBeGreaterThan(0);
    expect(within(organizer).getByText('Numbers not drawn')).toBeInTheDocument();
    expect(organizer.querySelector('a, button, input, select, textarea, [tabindex]')).toBeNull();
  });

  it('explains the score digits and current matching participant as ordinary content', () => {
    renderPage();
    const score = screen.getByRole('region', { name: 'How the score matches a square' });
    for (const text of ['17', '14', '7', '4', 'Taylor M.']) {
      expect(within(score).getAllByText(text, { exact: true }).length).toBeGreaterThan(0);
    }
    expect(score).toHaveTextContent('Currently matching');
    expect(score.querySelector('button, input, select, textarea')).toBeNull();
  });

  it('keeps one main, one h1, and unique ids across all examples', () => {
    const { container } = renderPage();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('main')).toHaveAttribute('data-testid', 'homepage');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const ids = Array.from(container.querySelectorAll('[id]')).map(node => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
