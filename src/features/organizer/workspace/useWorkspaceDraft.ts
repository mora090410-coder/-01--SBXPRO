import { useCallback, useEffect, useRef, useState } from 'react';
import type { BoardData, GameState } from '../../../../types';
import { acknowledgeRemoteSave, failDraftSave, markDraftDirty, startDraftSave, type DraftSaveState } from '../draft/draftSaveModel';

export interface UseWorkspaceDraftInput {
  game: GameState;
  board: BoardData;
  revision: number;
  isPublished: boolean;
  onSave: (data: { game: GameState; board: BoardData }) => Promise<unknown>;
  onApply?: (game: GameState, board: BoardData) => void;
  onReload?: () => Promise<void> | void;
  debounceMs?: number;
}

export interface UseWorkspaceDraft {
  game: GameState;
  board: BoardData;
  setGame: (updater: (game: GameState) => GameState) => void;
  setBoard: (updater: (board: BoardData) => BoardData) => void;
  saveState: DraftSaveState;
  flush: () => Promise<void>;
  retry: () => Promise<void>;
  reloadLatest: () => Promise<void>;
}

const clean = (revision: number): DraftSaveState => ({ status: 'clean', revision, canPublish: true });

export function useWorkspaceDraft({
  game,
  board,
  revision,
  isPublished,
  onSave,
  onApply,
  onReload,
  debounceMs = 800,
}: UseWorkspaceDraftInput): UseWorkspaceDraft {
  const [localGame, setLocalGame] = useState(game);
  const [localBoard, setLocalBoard] = useState(board);
  const [saveState, setSaveState] = useState<DraftSaveState>(() => clean(revision));

  // Mutable mirrors so async callbacks (debounced saves, retries) always see
  // the latest values without becoming stale closures.
  const latestData = useRef({ game, board });
  const saveStateRef = useRef(saveState);
  const revisionRef = useRef(revision);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const editedDuringSaveRef = useRef(false);

  saveStateRef.current = saveState;
  revisionRef.current = revision;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Adopt server-provided state whenever nothing local is pending or in flight.
  useEffect(() => {
    const status = saveStateRef.current.status;
    const pending = status === 'dirty' || status === 'saving';
    if (pending) return;
    setLocalGame(game);
    setLocalBoard(board);
    latestData.current = { game, board };
    setSaveState(clean(revision));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, board, revision]);

  const runSave = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) return inFlightRef.current;
    if (saveStateRef.current.status !== 'dirty') return;

    const expectedRevision = saveStateRef.current.revision;
    // The `revision` prop only catches up once the caller re-renders after
    // its own onSave resolves, so our local saveState.revision can already
    // be ahead of the prop. Use the higher of the two as the "known good"
    // baseline: a genuine external conflict is a prop value that overtakes
    // that baseline, not merely a prop that hasn't caught up yet.
    const baselineRevision = Math.max(expectedRevision, revisionRef.current);
    const started = startDraftSave(saveStateRef.current, { expectedRevision });
    setSaveState(started);
    saveStateRef.current = started;
    if (started.status !== 'saving') return;

    editedDuringSaveRef.current = false;
    const payload = latestData.current;

    const run = (async () => {
      try {
        await onSave(payload);
        setSaveState((current) => {
          if (current.status !== 'saving') return current;
          const serverRevision = Math.max(revisionRef.current, current.localRevision ?? current.revision);
          return acknowledgeRemoteSave(current, { serverRevision });
        });
      } catch (error) {
        const revisionMoved = revisionRef.current > baselineRevision;
        const message = error instanceof Error ? error.message : 'save_failed';
        setSaveState((current) => {
          if (current.status !== 'saving') return current;
          if (revisionMoved) {
            return {
              status: 'conflicted',
              revision: revisionRef.current,
              localRevision: current.localRevision,
              error: 'revision_mismatch',
              canPublish: false,
            };
          }
          return failDraftSave(current, message);
        });
      } finally {
        inFlightRef.current = null;
        if (editedDuringSaveRef.current) {
          editedDuringSaveRef.current = false;
          setSaveState((current) => (current.status === 'clean' ? markDraftDirty(current) : current));
          scheduleSave();
        }
      }
    })();

    inFlightRef.current = run;
    return run;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSave]);

  const scheduleSave = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void runSave();
    }, debounceMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimer, debounceMs, runSave]);

  const commitLocal = useCallback((nextGame: GameState, nextBoard: BoardData) => {
    latestData.current = { game: nextGame, board: nextBoard };
    onApply?.(nextGame, nextBoard);

    if (isPublished) return;

    if (inFlightRef.current) {
      editedDuringSaveRef.current = true;
      return;
    }

    setSaveState((current) => (current.status === 'dirty' ? current : markDraftDirty({ status: 'clean', revision: current.revision })));
    scheduleSave();
  }, [isPublished, onApply, scheduleSave]);

  const setGame = useCallback((updater: (g: GameState) => GameState) => {
    const next = updater(latestData.current.game);
    setLocalGame(next);
    commitLocal(next, latestData.current.board);
  }, [commitLocal]);

  const setBoard = useCallback((updater: (b: BoardData) => BoardData) => {
    const next = updater(latestData.current.board);
    setLocalBoard(next);
    commitLocal(latestData.current.game, next);
  }, [commitLocal]);

  const flush = useCallback(async () => {
    clearTimer();
    if (saveStateRef.current.status === 'dirty') {
      await runSave();
    } else if (inFlightRef.current) {
      await inFlightRef.current;
    }
  }, [clearTimer, runSave]);

  const retry = useCallback(async () => {
    if (saveStateRef.current.status !== 'save_failed') return;
    const current = saveStateRef.current;
    const dirty: DraftSaveState = {
      status: 'dirty',
      revision: current.revision,
      localRevision: current.localRevision ?? current.revision + 1,
      canPublish: false,
    };
    setSaveState(dirty);
    saveStateRef.current = dirty;
    await runSave();
  }, [runSave]);

  const reloadLatest = useCallback(async () => {
    clearTimer();
    await onReload?.();
    setSaveState(clean(revisionRef.current));
  }, [clearTimer, onReload]);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      const status = saveStateRef.current.status;
      if (status === 'dirty' || status === 'saving') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    game: localGame,
    board: localBoard,
    setGame,
    setBoard,
    saveState,
    flush,
    retry,
    reloadLatest,
  };
}
