import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import HomepageV2 from '../src/features/homepage/HomepageV2';

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: null, loading: false }),
}));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock('../components/BoardView', () => ({ default: () => <div>legacy board view</div> }));
vi.mock('../components/FilmLanding', () => ({ default: () => <main data-testid="film-landing">film landing</main> }));
vi.mock('../components/layout/Layout', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('../pages/Login', () => ({ default: () => <div>login page</div> }));
vi.mock('../pages/CreateContest', () => ({ default: () => <div>create page</div> }));
vi.mock('../pages/Dashboard', () => ({ default: () => <div>dashboard page</div> }));
vi.mock('../pages/NotFound', () => ({ default: () => <div>not found</div> }));
vi.mock('../pages/Paid', () => ({ default: () => <div>paid</div> }));
vi.mock('../pages/Privacy', () => ({ default: () => <div>privacy</div> }));
vi.mock('../pages/Terms', () => ({ default: () => <div>terms</div> }));

afterEach(() => {
  vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
});

const renderHomepage = () => render(
  <MemoryRouter>
    <HomepageV2 />
  </MemoryRouter>,
);

describe('HomepageV2 Slice12 A1', () => {
  it('puts product identity, outcome, actions, pricing truth, and money boundary in the first viewport', () => {
    renderHomepage();

    const hero = screen.getByTestId('homepage-v2-first-viewport');
    expect(within(hero).getByRole('heading', { name: /Football-squares fundraiser boards/i })).toBeVisible();
    expect(within(hero).getByText(/Build the board, share one link, and let GridOne track game day/i)).toBeVisible();
    expect(within(hero).getByRole('link', { name: 'Create your free board' })).toHaveAttribute('href', '/create');
    expect(within(hero).getByRole('link', { name: 'See a live board' })).toHaveAttribute('href', '/demo');
    expect(within(hero).getByText('First published board free')).toBeVisible();
    expect(within(hero).getByText('GridOne tracks the board. It does not collect square money, hold funds, or pay winners.')).toBeVisible();
    expect(hero).not.toHaveTextContent(/loader|scroll|bet|wager|odds|testimonial|customer|raised \$/i);
  });

  it('shows clearly synthetic B2 organizer proof by default and switches to accepted C1 viewer hierarchy in place', async () => {
    renderHomepage();

    const proof = screen.getByTestId('homepage-proof-artifact');
    expect(within(proof).getByText('Demonstration board — synthetic data')).toBeVisible();
    expect(within(proof).getByRole('heading', { name: /Organizer proof/i })).toBeVisible();
    expect(within(proof).getByText(/Fill → Reconcile → Draw → Preview → Go Live/i)).toBeVisible();

    fireEvent.click(within(proof).getByRole('button', { name: 'Viewer proof' }));

    expect(within(proof).getByRole('heading', { name: /Viewer proof/i })).toBeVisible();
    expect(await within(proof).findByRole('button', { name: 'Find my squares' })).toBeVisible();
    expect(within(proof).getByText(/Your squares · Taylor M\. · 3/i)).toBeVisible();
    expect(within(proof).getByText(/What makes Taylor M\. win next\?/i)).toBeVisible();
    expect(within(proof).getByText(/These are arithmetic score outcomes, not odds or predictions\./i)).toBeVisible();
    expect(within(proof).queryByText(/synthetic total|customers|funds collected/i)).toBeNull();
  });

  it('uses canonical 2026 pricing and optional story disclosure without critical-path effects', () => {
    renderHomepage();

    expect(screen.getByText('Free')).toBeVisible();
    expect(screen.getByText('1 published board per account per season')).toBeVisible();
    expect(screen.getByText('Game Day')).toBeVisible();
    expect(screen.getByText('$9.99 once for up to 5 published boards in the 2026 season')).toBeVisible();
    expect(screen.getByText('Organization')).toBeVisible();
    expect(screen.getByText('$79 per season for up to 50 published boards')).toBeVisible();
    expect(screen.getByText(/Optional brand story/i).closest('details')).not.toHaveAttribute('open');
  });

  it('keeps all interactive controls at least 44px tall', () => {
    renderHomepage();
    for (const control of screen.getAllByRole('button').concat(screen.getAllByRole('link'))) {
      expect(control).toHaveStyle({ minHeight: '44px' });
    }
  });
});

describe('homepage_v2 root flag', () => {
  it('keeps production root on FilmLanding when only the query asks for homepage_v2', () => {
    window.history.replaceState({}, '', '/?homepage_v2=true');
    render(<App />);
    expect(screen.getByTestId('film-landing')).toBeVisible();
    expect(screen.queryByTestId('homepage-v2')).toBeNull();
  });

  it('uses HomepageV2 when the explicit env flag resolves true', async () => {
    vi.stubEnv('VITE_GRIDONE_HOMEPAGE_V2', 'true');
    render(<App />);
    expect(await screen.findByTestId('homepage-v2')).toBeVisible();
    expect(screen.queryByTestId('film-landing')).toBeNull();
  });
});
