import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScoreExplanation } from '../../src/features/homepage/atmosphere/useScoreExplanation';

const animation = vi.hoisted(() => ({ revert: vi.fn(), context: vi.fn(), timeline: vi.fn() }));
vi.mock('gsap', () => ({ gsap: animation }));

function Probe() {
  const ref = useScoreExplanation();
  return <div ref={ref} data-testid="explanation"><p>KC 17, PHI 14. Taylor M. currently matching.</p></div>;
}

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('score explanation lifecycle', () => {
  it('leaves the complete explanation static with reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    render(<Probe />);
    expect(screen.getByTestId('explanation')).toHaveAttribute('data-animation', 'static');
    expect(screen.getByText(/currently matching/)).toBeVisible();
    expect(animation.context).not.toHaveBeenCalled();
  });

  it('plays once and reverts its animation when the route unmounts', async () => {
    let enter: IntersectionObserverCallback = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { enter = callback; }
      observe() {} disconnect = disconnect;
    });
    animation.context.mockImplementation((callback: () => void) => { callback(); return { revert: animation.revert }; });
    const chain = { fromTo: vi.fn().mockReturnThis() };
    animation.timeline.mockReturnValue(chain);
    const view = render(<Probe />);
    expect(animation.context).not.toHaveBeenCalled();
    await act(async () => {
      enter([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver);
      enter([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver);
    });
    expect(animation.context).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/currently matching/)).toBeVisible();
    view.unmount();
    expect(animation.revert).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalled();
  });
});
