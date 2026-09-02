import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Sheet } from '../../src/design/primitives/Sheet';

describe('Sheet', () => {
  it('renders nothing when closed', () => {
    render(<Sheet open={false} onClose={() => {}} title="Find my squares">x</Sheet>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is a labelled modal dialog that focuses itself and closes on Escape', () => {
    const onClose = vi.fn();
    render(<Sheet open onClose={onClose} title="Find my squares"><input aria-label="Name" /></Sheet>);
    const dialog = screen.getByRole('dialog', { name: 'Find my squares' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement === dialog || dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click but not on panel click', () => {
    const onClose = vi.fn();
    render(<Sheet open onClose={onClose} title="Preview"><p>body</p></Sheet>);
    fireEvent.click(screen.getByText('body'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while open and restores it', () => {
    const { unmount } = render(<Sheet open onClose={() => {}} title="Preview">x</Sheet>);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
