import { describe, expect, it } from 'vitest';
import { readCreateDraft, writeCreateDraft, CREATE_DRAFT_KEY } from '../src/features/organizer/create/createDraft';
import { INITIAL_GAME, EMPTY_BOARD } from '../hooks/usePoolData';

describe('local create draft', () => {
  it('restores the exact preview without consuming it on refresh', () => {
    sessionStorage.clear();
    const draft = { game: { ...INITIAL_GAME, title: 'Team board' }, board: EMPTY_BOARD };
    expect(writeCreateDraft(sessionStorage, draft, 100)).toBe(true);
    expect(readCreateDraft(sessionStorage, 200).draft).toEqual(draft);
    expect(readCreateDraft(sessionStorage, 300).draft).toEqual(draft);
  });
  it('rejects malformed and expired drafts with a recovery reason', () => {
    sessionStorage.setItem(CREATE_DRAFT_KEY, '{');
    expect(readCreateDraft(sessionStorage).issue).toBe('invalid');
    writeCreateDraft(sessionStorage, { game: INITIAL_GAME, board: EMPTY_BOARD }, 1);
    expect(readCreateDraft(sessionStorage, 1000 * 60 * 60 * 25).issue).toBe('expired');
    sessionStorage.setItem(CREATE_DRAFT_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), game: {}, board: { squares: [] } }));
    expect(readCreateDraft(sessionStorage).issue).toBe('invalid');
  });
  it('reports storage failure without discarding the in-memory draft', () => {
    const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
    expect(readCreateDraft(broken).issue).toBe('unavailable');
    expect(writeCreateDraft(broken, { game: INITIAL_GAME, board: EMPTY_BOARD })).toBe(false);
  });
});

it('rejects malformed axes and strips unexpected transport fields', () => {
  const game = { ...INITIAL_GAME, title: 'Safe', ownerId: 'another', scoreSnapshot: null };
  writeCreateDraft(sessionStorage, { game, board: { ...EMPTY_BOARD, leftAxis: [99] } });
  expect(readCreateDraft(sessionStorage).issue).toBe('invalid');
  writeCreateDraft(sessionStorage, { game, board: EMPTY_BOARD });
  expect(readCreateDraft(sessionStorage).draft?.game).not.toHaveProperty('ownerId');
  expect(readCreateDraft(sessionStorage).draft?.game).not.toHaveProperty('scoreSnapshot');
});
