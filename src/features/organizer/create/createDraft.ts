import { projectBoardTemplate } from '../repeat/boardTemplateModel';
import type { BoardData, GameState } from '../../../../types';

export const CREATE_DRAFT_KEY = 'gridone_create_preview_v1';
const MAX_AGE = 24 * 60 * 60 * 1000;
export type CreateDraft = { game: GameState; board: BoardData };
type StorageReader = Pick<Storage, 'getItem'>;
type StorageWriter = Pick<Storage, 'setItem'>;
export function readCreateDraft(storage: StorageReader, now = Date.now()): { draft?: CreateDraft; issue?: 'invalid' | 'expired' | 'unavailable' } {
  let raw: string | null;
  try { raw = storage.getItem(CREATE_DRAFT_KEY); } catch { return { issue: 'unavailable' }; }
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    if (value.version !== 1 || !Number.isFinite(value.savedAt) || typeof value.game?.title !== 'string' ||
      value.game.title.length > 100 || !Array.isArray(value.board?.squares) || value.board.squares.length !== 100 ||
      !value.board.squares.every((names: unknown) => Array.isArray(names) && names.length <= 1 && names.every(name => typeof name === 'string' && name.length <= 80)) ||
      !['leftAxis', 'topAxis'].every(key => Array.isArray(value.board[key]) && value.board[key].length === 10 && value.board[key].every((digit: unknown) => digit === null || (Number.isInteger(digit) && Number(digit) >= 0 && Number(digit) <= 9))) ||
      !['leftAbbr', 'leftName', 'topAbbr', 'topName', 'dates'].every(key => typeof value.game[key] === 'string') ||
      (value.game.gameExternalId !== undefined && typeof value.game.gameExternalId !== 'string')) return { issue: 'invalid' };
    if (now - value.savedAt > MAX_AGE || value.savedAt > now + 60000) return { issue: 'expired' };
    const input = value.game;
    const game: GameState = {
      title: input.title, meta: typeof input.meta === 'string' ? input.meta.slice(0, 100) : '',
      leftAbbr: input.leftAbbr.slice(0, 10), leftName: input.leftName.slice(0, 100),
      topAbbr: input.topAbbr.slice(0, 10), topName: input.topName.slice(0, 100), dates: input.dates.slice(0, 100),
      lockTitle: false, lockMeta: false, useManualScores: false, manualLeftScore: 0, manualTopScore: 0,
      coverImage: typeof input.coverImage === 'string' ? input.coverImage : '',
      payoutDescriptions: projectBoardTemplate(input).payoutDescriptions ?? {},
      ...(input.gameExternalId ? { gameExternalId: input.gameExternalId.slice(0, 100) } : {}),
      ...(typeof input.kickoffAt === 'string' && Number.isFinite(Date.parse(input.kickoffAt)) ? { kickoffAt: input.kickoffAt } : {}),
    };
    const board: BoardData = { squares: value.board.squares, leftAxis: value.board.leftAxis, topAxis: value.board.topAxis, isDynamic: false };
    return { draft: { game, board } };
  } catch { return { issue: 'invalid' }; }
}
export function writeCreateDraft(storage: StorageWriter, draft: CreateDraft, now = Date.now()): boolean {
  try { storage.setItem(CREATE_DRAFT_KEY, JSON.stringify({ version: 1, savedAt: now, ...draft })); return true; }
  catch { return false; }
}
export function clearCreateDraft(): void {
  try { sessionStorage.removeItem(CREATE_DRAFT_KEY); } catch { /* A successful server save remains authoritative. */ }
}
