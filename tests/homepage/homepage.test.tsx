import React from 'react';
import { render, renderHook, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Spotlight } from '../../src/design/primitives';
import { useParallax } from '../../src/features/homepage/atmosphere/useParallax';
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

  it('exposes main and contentinfo landmarks and a visible FAQ affordance', () => {
    renderPage();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('main')).not.toContainElement(screen.getByRole('contentinfo'));
    expect(screen.getAllByText('+').length).toBe(4);
  });
});

describe('Hero atmosphere', () => {
  const setMatchMedia = (answer: (query: string) => boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: answer(query),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  };

  const original = window.matchMedia;
  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value: original });
    vi.restoreAllMocks();
  });

  it('keeps exactly one h1 and both calls to action inside the first viewport', () => {
    renderPage();
    const hero = screen.getByTestId('homepage-first-viewport');
    expect(within(hero).getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(within(hero).getByRole('link', { name: 'Create your free board' })).toBeInTheDocument();
    expect(within(hero).getByRole('link', { name: 'See a live board' })).toBeInTheDocument();
  });

  it('useParallax attaches no scroll listener and writes nothing under reduced motion', () => {
    setMatchMedia((q) => q.includes('prefers-reduced-motion') || q.includes('min-width'));
    const add = vi.spyOn(window, 'addEventListener');
    const { result } = renderHook(() => useParallax<HTMLDivElement>({ maxPx: 40, rotateFromDeg: -3, rotateToDeg: -1 }));
    const node = document.createElement('div');
    result.current.current = node;
    expect(add.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(0);
    expect(node.style.transform).toBe('');
  });

  it('useParallax is inert below the md breakpoint', () => {
    setMatchMedia(() => false);
    const add = vi.spyOn(window, 'addEventListener');
    renderHook(() => useParallax<HTMLDivElement>({ maxPx: 40 }));
    expect(add.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(0);
  });

  it('useParallax writes a vertical-only transform on desktop and cleans up on unmount', () => {
    setMatchMedia((q) => q.includes('min-width'));
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const Probe = () => {
      const ref = useParallax<HTMLDivElement>({ maxPx: 40, rotateFromDeg: -3, rotateToDeg: -1 });
      return <div ref={ref} data-testid="probe" />;
    };
    const view = render(<Probe />);
    const probe = screen.getByTestId('probe');
    expect(add.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1);
    expect(add.mock.calls.find(([type]) => type === 'scroll')?.[2]).toEqual({ passive: true });
    expect(probe.style.transform).toContain('translate3d(0,');
    expect(probe.style.transform).toContain('rotate(-3.000deg)');
    expect(probe.style.transform).not.toMatch(/translateX|translate3d\((?!0,)/);
    view.unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1);
  });

  it('Spotlight breathes only when motion is allowed', () => {
    setMatchMedia(() => false);
    const { container, unmount } = render(<Spotlight breathe />);
    expect(container.firstElementChild?.className).toContain('spotlight-breathe');
    unmount();

    setMatchMedia((q) => q.includes('prefers-reduced-motion'));
    const reduced = render(<Spotlight breathe />);
    expect(reduced.container.firstElementChild?.className).not.toContain('spotlight-breathe');
    reduced.unmount();

    const plain = render(<Spotlight />);
    expect(plain.container.firstElementChild?.className).not.toContain('spotlight-breathe');
  });
});
