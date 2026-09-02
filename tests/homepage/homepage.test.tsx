import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Homepage from '../../src/features/homepage/Homepage';

const renderPage = () => render(<MemoryRouter><Homepage /></MemoryRouter>);

describe('Homepage', () => {
  it('puts identity, promise, one primary action, and the money boundary in the first viewport', () => {
    renderPage();
    const hero = screen.getByTestId('homepage-first-viewport');
    expect(within(hero).getByRole('heading', { level: 1 })).toHaveTextContent('Build it once. Share one link.');
    expect(within(hero).getByText(/For youth-sports teams, booster clubs, schools, and community organizers/)).toBeInTheDocument();
    expect(within(hero).getByRole('link', { name: 'Create your free board' })).toHaveAttribute('href', '/create');
    expect(within(hero).getByRole('link', { name: 'See a live board' })).toHaveAttribute('href', '/demo');
    expect(within(hero).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login?mode=signin');
    expect(within(hero).getByText('First published board free')).toBeInTheDocument();
    expect(within(hero).getByText('Viewers open the link without creating an account')).toBeInTheDocument();
    expect(within(hero).getByText(/does not collect square money, hold funds, adjudicate off-platform payment, or pay winners/)).toBeInTheDocument();
    expect(within(hero).getByText('Demo board — sample names and scores')).toBeInTheDocument();
  });

  it('shows the live score, the three parent answers, and the organizer screen', () => {
    renderPage();
    expect(screen.getByRole('region', { name: 'Live score' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Where are my squares?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Who wins right now?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What score wins next?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'One screen. No wizard.' })).toBeInTheDocument();
  });

  it('uses the exact pricing strings and keeps FAQ closed by default', () => {
    renderPage();
    expect(screen.getByText('1 published board per account per season')).toBeInTheDocument();
    expect(screen.getByText('$9.99 once for up to 5 published boards in the 2026 season')).toBeInTheDocument();
    expect(screen.getByText(/\$79 per season for up to 50 published boards, organization naming, shared dashboard, and one organization receipt/)).toBeInTheDocument();
    for (const q of ['Do viewers need an account?', 'Does GridOne collect square money?', 'When do I pay?', 'Who can edit the board?']) {
      const summary = screen.getByText(q);
      expect(summary.closest('details')?.open).toBe(false);
    }
    expect(screen.getByRole('heading', { name: 'Ready to build the board?' })).toBeInTheDocument();
  });

  it('closes with a footer index of guides and legal links', () => {
    renderPage();
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: /Run Your Pool alternative/i })).toHaveAttribute('href', '/articles/run-your-pool-alternative');
    expect(within(footer).getByRole('link', { name: 'All guides' })).toHaveAttribute('href', '/articles');
    expect(within(footer).getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    expect(within(footer).getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  });

  it('keeps every link and button at least 44px tall', () => {
    renderPage();
    for (const control of [...screen.getAllByRole('link'), ...screen.queryAllByRole('button')]) {
      expect(control.className, control.textContent ?? '').toMatch(/\bh-11\b|\bh-13\b|\bmin-h-11\b/);
    }
  });

  it('never uses banned marketing or system vocabulary', () => {
    const { container } = renderPage();
    expect(container.textContent).not.toMatch(/\b(seamless|effortless|unlock|supercharge|elevate|powerful|robust|beta|synthetic|fallback|read-only|grounded|native|canonical|provenance|freshness|entitlement)\b/i);
  });
});
