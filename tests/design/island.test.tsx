import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Island, IslandRings } from '../../src/design/primitives/Island';
import { Ring } from '../../src/design/primitives/Ring';

describe('Ring', () => {
  it('is an image with a label and mono caption', () => {
    render(<Ring value={0.83} label="83 percent filled" caption="83%" />);
    expect(screen.getByRole('img', { name: '83 percent filled' })).toBeInTheDocument();
    expect(screen.getByText('83%').className).toContain('font-mono');
  });
});

describe('Island', () => {
  const rings = [
    { value: 0.83, label: '83 percent filled', caption: '83%' },
    { value: 0.5, label: '50 percent paid', caption: '50%' },
  ];

  it('starts collapsed and toggles on click', () => {
    render(<Island label="Board status" collapsed={<IslandRings rings={rings} />} expanded={<p>Draw numbers</p>} />);
    const toggle = screen.getByRole('button', { name: /Board status/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Draw numbers')).toBeNull();
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('region', { name: 'Board status' })).toBeInTheDocument();
    expect(screen.getByText('Draw numbers')).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the toggle', () => {
    render(<Island label="Score" defaultOpen collapsed={<span>21–14</span>} expanded={<button>Refresh</button>} />);
    const toggle = screen.getByRole('button', { name: /Score/ });
    screen.getByRole('button', { name: 'Refresh' }).focus();
    fireEvent.keyDown(screen.getByRole('region', { name: 'Score' }), { key: 'Escape' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('supports controlled open state', () => {
    const onOpenChange = vi.fn();
    render(<Island label="Score" open={false} onOpenChange={onOpenChange} collapsed={<span>c</span>} expanded={<span>e</span>} />);
    fireEvent.click(screen.getByRole('button', { name: /Score/ }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByText('e')).toBeNull();
  });

  it('places itself at the top edge or corner', () => {
    const { container, rerender } = render(<Island label="A" collapsed={<span>c</span>} expanded={<span>e</span>} />);
    expect((container.firstElementChild as HTMLElement).className).toContain('top-3');
    rerender(<Island label="A" placement="corner" collapsed={<span>c</span>} expanded={<span>e</span>} />);
    expect((container.firstElementChild as HTMLElement).className).toContain('bottom-6');
  });
});
