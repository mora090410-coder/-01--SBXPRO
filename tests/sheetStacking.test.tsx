import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sheet } from '../src/design/primitives';

/**
 * The viewer's Share sheet is mounted before the organizer preview sheet, so it
 * can only open on top of it by way of its stacking layer. These assertions
 * cover the two behaviours a stacked pair has to preserve: the body stays
 * scroll-locked until the last sheet closes, and each sheet returns focus to
 * its own opener.
 */
function StackedSheets() {
  const [baseOpen, setBaseOpen] = useState(false);
  const [raisedOpen, setRaisedOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setBaseOpen(true)}>Preview</button>
      <Sheet open={raisedOpen} onClose={() => setRaisedOpen(false)} title="Share link" layer="raised">
        <button type="button">Copy</button>
      </Sheet>
      <Sheet open={baseOpen} onClose={() => setBaseOpen(false)} title="Private preview">
        <button type="button" onClick={() => setRaisedOpen(true)}>Share</button>
      </Sheet>
    </div>
  );
}

describe('stacked sheets', () => {
  it('keeps the body scroll-locked until the last sheet closes and restores each opener', () => {
    render(<StackedSheets />);
    const preview = screen.getByRole('button', { name: 'Preview' });

    // jsdom's click does not move focus the way a real pointer does, and the
    // sheet restores focus to whatever was focused when it opened.
    preview.focus();
    fireEvent.click(preview);
    expect(document.body.style.overflow).toBe('hidden');

    const share = screen.getByRole('button', { name: 'Share' });
    fireEvent.click(share);
    expect(screen.getByRole('dialog', { name: 'Share link' })).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');

    // Escape on the share sheet closes only the share sheet.
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Share link' }), { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Share link' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Private preview' })).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Share' }));

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Private preview' }), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(preview);
  });
});
