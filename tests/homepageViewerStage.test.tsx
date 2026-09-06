import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ParentMoments } from '../src/features/homepage/sections/ParentMoments';

vi.mock('../src/features/homepage/renders/MomentRenders', () => ({
  YourSquaresRender: () => <figure>Square summary preview</figure>,
  ScenariosRender: () => <figure>Scenario preview</figure>,
}));
afterEach(cleanup);

describe('homepage viewer question stage', () => {
  it('lets native buttons select one complete answer and declares the selected state', () => {
    render(<ParentMoments />);
    const squares = screen.getByRole('button', { name: 'Where are my squares?' });
    const next = screen.getByRole('button', { name: 'What score wins next?' });
    expect(squares).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: 'Where are my squares?' })).toBeVisible();
    fireEvent.click(next);
    expect(next).toHaveAttribute('aria-pressed', 'true');
    expect(squares).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('region', { name: 'Where are my squares?' })).toBeNull();
    expect(screen.getByRole('region', { name: 'What score wins next?' })).toHaveTextContent('Arithmetic, not odds or predictions.');
    fireEvent.click(screen.getByRole('button', { name: 'Who wins right now?' }));
    expect(screen.getByRole('region', { name: 'Who wins right now?' })).toHaveTextContent('wins right now');
  });

  it('renders all answers before enhancement, with no hidden essential answer', () => {
    const host = document.createElement('div');
    host.innerHTML = renderToString(<ParentMoments />);
    const answers = host.querySelectorAll('[data-viewer-answer]');
    expect(answers).toHaveLength(3);
    for (const answer of answers) expect(answer).not.toHaveAttribute('hidden');
  });
});
