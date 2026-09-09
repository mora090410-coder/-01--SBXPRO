import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FamilyWorkspace from '../src/features/family/FamilyWorkspace';

const token = 'a'.repeat(64);
const record = { title: 'Baseball board', revision: 3, label: 'Anthony', cells: [{ index: 12, name: 'Anthony', availability: 'unspecified' }, { index: 13, name: 'Bill W', availability: 'available' }] };
afterEach(() => { vi.unstubAllGlobals(); window.location.hash = ''; });
describe('FamilyWorkspace', () => {
  it('loads only assigned squares and saves explicit changes with revision and private bearer token', async () => {
    window.location.hash = token;
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => record }).mockResolvedValueOnce({ ok: true, json: async () => ({ ...record, revision: 4 }) });
    vi.stubGlobal('fetch', fetcher);
    render(<FamilyWorkspace />);
    expect(await screen.findByRole('heading', { name: 'Your 2 squares' })).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('Name on square 13'), { target: { value: 'Bill W' } });
    const leaving = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(leaving);
    expect(leaving.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    expect(fetcher.mock.calls[1][0]).toBe('/api/family');
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBe(`Bearer ${token}`);
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ action: 'edit', revision: 3, changes: [{ index: 12, name: 'Bill W', availability: 'unspecified' }] });
    expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
  });
  it('retains typed names after conflicts and requires an explicit reload', async () => {
    window.location.hash = token;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, json: async () => record }).mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: 'REVISION_CONFLICT' }) }));
    render(<FamilyWorkspace />);
    await screen.findByRole('heading', { name: 'Your 2 squares' });
    fireEvent.change(screen.getByLabelText('Name on square 13'), { target: { value: 'Bill W' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('board changed');
    expect(screen.getByLabelText('Name on square 13')).toHaveValue('Bill W');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reload latest' })).toBeInTheDocument();
  });
  it('retains edits after a network failure and does not automatically retry', async () => {
    window.location.hash = token;
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => record }).mockRejectedValueOnce(new Error('offline'));
    vi.stubGlobal('fetch', fetcher);
    render(<FamilyWorkspace />);
    await screen.findByRole('heading', { name: 'Your 2 squares' });
    fireEvent.change(screen.getByLabelText('Name on square 13'), { target: { value: 'Maria' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save changes');
    expect(screen.getByLabelText('Name on square 13')).toHaveValue('Maria');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  it('rejects malformed responses without rendering editable squares', async () => {
    window.location.hash = token;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...record, cells: [{ index: 200, name: 'Bad', availability: 'unspecified' }] }) }));
    render(<FamilyWorkspace />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not open');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('saves one blank allocation without requiring invented names on other allocations', async () => {
    window.location.hash = token;
    const blank = { ...record, cells: record.cells.map(cell => ({ ...cell, name: '' })) };
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => blank }).mockResolvedValueOnce({ ok: true, json: async () => ({ ...blank, revision: 4, cells: [{ ...blank.cells[0], name: 'Bill W' }, blank.cells[1]] }) });
    vi.stubGlobal('fetch', fetcher);
    render(<FamilyWorkspace />);
    await screen.findByRole('heading', { name: 'Your 2 squares' });
    fireEvent.change(screen.getByLabelText('Name on square 13'), { target: { value: 'Bill W' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetcher.mock.calls[1][1].body).changes).toEqual([{ index: 12, name: 'Bill W', availability: 'unspecified' }]);
  });

  it('does not send invalid links to the API', () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    render(<FamilyWorkspace />);
    expect(screen.getByRole('alert')).toHaveTextContent('Ask your organizer');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
