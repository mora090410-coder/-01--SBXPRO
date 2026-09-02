import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Base } from '../../../design/primitives';
import type {
  BoardData,
  EntryMeta,
  GameState,
  LiveGameData,
  NotificationDeliveryIssue,
  PayoutDescriptions,
  WinnerResolution,
} from '../../../../types';
import { evaluateOrganizerLifecycle, isExactAxis } from '../lifecycle/organizerLifecycle';
import { compressImage } from '../../../../utils/image';
import { parseBoardImage } from '../../../../services/boardImportService';
import { renderBoardPng, shareBoardPng, boardImageFilename } from '../../../../utils/boardImage';
import { useWorkspaceDraft } from './useWorkspaceDraft';
import { applyScheduledGame } from './applyScheduledGame';
import { saveEntryMeta, clearEntryMeta } from './entryMetaService';
import { secureShuffleDigits } from './secureDraw';
import { publishBoard, type PublishResult } from './publishBoard';
import { renamePublishedSquare } from './renamePublishedSquare';
import {
  EMPTY_MANUAL_SCORES,
  manualPeriodForState,
  seedManualScoreFromSnapshot,
  type ManualGameState,
  type ManualQuarterKey,
  type ManualScoreSide,
} from '../game-day/manualScoringModel';
import {
  enableManualScoringOnServer,
  returnAutomaticScoringOnServer,
  saveManualScoreToServer,
} from '../services/game-day/manualScoreService';
import { publishedOpenSquaresAreAssignable } from '../services/game-day/publishedOpenSquares';
import { publishMilestoneCorrectionToServer, type MilestoneCorrectionDraft } from '../services/corrections/milestoneCorrectionService';
import WorkspaceHeader from './WorkspaceHeader';
import BoardEditor from './BoardEditor';
import SquareSheet from './SquareSheet';
import OrganizerIsland from './OrganizerIsland';
import DrawControl from './DrawControl';
import ReconcileCard from './ReconcileCard';
import PayoutRulesCard, { type PayoutRulesStatus } from './PayoutRulesCard';
import BoardToolsCard from './BoardToolsCard';
import PreviewSheet from './PreviewSheet';
import PublishSheet from './PublishSheet';
import UpgradeSheet from './UpgradeSheet';
import PublishedSheet from './PublishedSheet';
import SharePanel from './gameday/SharePanel';
import ScoreAuthorityCard from './gameday/ScoreAuthorityCard';
import CorrectionsCard from './gameday/CorrectionsCard';
import DeliveryIssuesCard from './gameday/DeliveryIssuesCard';
import FinalRecordCard from './gameday/FinalRecordCard';

export interface OrganizerWorkspaceProps {
  game: GameState;
  board: BoardData;
  activePoolId: string | null;
  liveData: LiveGameData | null;
  winnerHistory: WinnerResolution[];
  notificationDeliveryIssues: NotificationDeliveryIssue[];
  onApply: (game: GameState, board: BoardData) => void;
  onPublish: (currentData: { game: GameState; board: BoardData }) => Promise<string | void>;
  onSavePayoutDescriptions: (descriptions: PayoutDescriptions) => Promise<PayoutDescriptions>;
  onAssignOpenSquares: (squares: string[][]) => Promise<void>;
  onReload?: () => Promise<void> | void;
  onOpenViewer?: () => void;
  onLogout: () => void;
  isActivated: boolean;
  isPublished: boolean;
  shareCode: string | null;
  renderPreview?: () => React.ReactNode;
  /** Server revision from usePoolData; drives the autosave conflict check. */
  revision: number;
  entryMeta: Record<number, EntryMeta>;
  onEntryMetaChange: (meta: EntryMeta) => void;
  billing?: { tier: string; used: number; allowance: number } | null;
  onCheckout?: (tier: 'gameday' | 'org', organizationName?: string) => Promise<void>;
}

type PublishedBoard = Extract<PublishResult, { published: true }>;

const PUBLISH_BLOCKED = 'Publish blocked. Reload or save the latest clean draft before publishing.';
const PUBLISHED_IMMUTABLE = 'Published assignments cannot be changed. Select OPEN squares only.';
const LATE_FILL_CLOSED = 'Open squares can only be filled before kickoff.';
const LATE_FILL_FAILED = 'The OPEN squares could not be assigned. Reload and try again.';
const RENAME_FAILED = 'The name could not be changed. The board still shows the previous name.';
const UNTITLED_WORKSPACE = 'Untitled board workspace';
const SQUARE_META_FAILED = 'Square details were not saved. The name is on the board; try saving the details again.';
const CLEAR_META_FAILED = 'The private notes were not cleared. Try again.';
const PAYOUT_FAILED = 'Prize notes were not saved. Try again.';

/** The draw gate ignores the acknowledgement: DrawControl asks that question inline. */
const ACKNOWLEDGEMENT_BLOCKER = 'open_square_acknowledgement_required';

const openCountOf = (board: BoardData) => board.squares.filter((names) => !names.length).length;

const blockerNote: Record<string, string> = {
  missing_owner: 'The board owner could not be verified. Reload and try again.',
  missing_board_identity: 'Add a board name before publishing.',
  missing_scheduled_game: 'Choose the scheduled game before publishing.',
  invalid_board_shape: 'This board could not be checked. Reload and try again.',
  duplicate_or_ambiguous_public_identity: 'Make each public name unique so families can find the right squares.',
  open_square_acknowledgement_required: 'Confirm that the remaining open squares should stay open.',
  invalid_committed_axes: 'Draw one complete set of numbers before publishing.',
  dynamic_axes_not_supported: 'This older board uses changing number sets and cannot be published in this version.',
  save_dirty: 'Save the latest changes before publishing.',
  save_saving: 'Wait for the board to finish saving.',
  save_save_failed: 'The latest changes did not save. Reload or try again.',
  save_conflicted: 'This board changed in another session. Reload the latest version.',
  save_recovered: 'Review and save the recovered draft before publishing.',
};

/**
 * Collapse a display label to the identity a viewer would search by, so one
 * person holding several squares reads as one participant.
 */
const normalizedIdentity = (label: string) => label
  .trim()
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '');

/**
 * Lifecycle cells carry the real private notes so the checklist can speak to
 * payment and seller gaps, and a durable participant id for every assigned
 * cell. Drafts routinely have no `participants` array yet, so an id is
 * synthesized from the normalized label: same person -> one id, different
 * people -> different ids. Two *different* labels that collapse to the same
 * identity (`Jose` / `Jose\u0301`) cannot be told apart, so their id is dropped and
 * the lifecycle reports them as ambiguous.
 */
const lifecycleCells = (board: BoardData, entryMeta: Record<number, EntryMeta>) => {
  const labelsById = new Map<string, Set<string>>();
  const cells = board.squares.map((names, index) => {
    const label = names[0]?.trim();
    if (!label) return null;
    const participant = board.participants?.find((item) => item.displayName === label || item.publicLabel === label);
    const participantId = participant?.id ?? `label:${normalizedIdentity(label)}`;
    const byId = labelsById.get(participantId) ?? new Set<string>();
    byId.add(label.toLocaleLowerCase());
    labelsById.set(participantId, byId);
    const meta = entryMeta[index];
    return {
      publicLabel: label,
      participantId,
      paidStatus: meta?.paid_status ?? 'unknown',
      sellerLabel: meta?.seller_label ?? undefined,
    };
  });
  return cells.map((cell) => (
    cell && (labelsById.get(cell.participantId)?.size ?? 0) > 1
      ? { ...cell, participantId: undefined }
      : cell
  ));
};

/**
 * The organizer workspace. Before publishing it composes the status island,
 * the board editor, and the publish sheets over `useWorkspaceDraft`'s
 * autosaving draft. After publishing the same shell hosts the game-day side:
 * the public link, score authority, corrections, and the locked final record.
 */
export default function OrganizerWorkspace({
  game: gameProp,
  board: boardProp,
  activePoolId,
  liveData,
  winnerHistory,
  notificationDeliveryIssues,
  revision,
  entryMeta,
  onEntryMetaChange,
  billing,
  onCheckout,
  onApply,
  onPublish,
  onSavePayoutDescriptions,
  onAssignOpenSquares,
  onReload,
  onOpenViewer,
  onLogout,
  isActivated,
  isPublished,
  shareCode,
  renderPreview,
}: OrganizerWorkspaceProps) {
  const { game, board, setGame, setBoard, saveState, flush, retry, reloadLatest } = useWorkspaceDraft({
    game: gameProp,
    board: boardProp,
    revision,
    isPublished,
    onSave: (data) => onPublish(data),
    onApply,
    onReload,
  });

  const [drawRequested, setDrawRequested] = useState(false);
  const [drawPreview, setDrawPreview] = useState<{ top: number[]; left: number[] } | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishPending, setPublishPending] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [upgradeTier, setUpgradeTier] = useState<'gameday' | 'org' | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [published, setPublished] = useState<PublishedBoard | null>(null);
  const [publishedOpen, setPublishedOpen] = useState(false);
  const [payoutStatus, setPayoutStatus] = useState<PayoutRulesStatus>('idle');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [scoreSaveStatus, setScoreSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [correctionHistory, setCorrectionHistory] = useState(winnerHistory);
  const [correctionDraft, setCorrectionDraft] = useState<MilestoneCorrectionDraft | null>(null);
  // Late fill closes at kickoff, so the gate has to re-evaluate while the
  // organizer sits on the page rather than only on the next render.
  const [clockNow, setClockNow] = useState(() => Date.now());
  // Failures get their own live region so a blocker note never hides them and
  // a stale failure never outlives the next successful action.
  const [alert, setAlert] = useState<string | null>(null);

  useEffect(() => {
    setCorrectionHistory(winnerHistory);
  }, [winnerHistory]);

  useEffect(() => {
    if (!isPublished) return;
    const interval = window.setInterval(() => setClockNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, [isPublished]);

  const openCount = openCountOf(board);
  const assignedCount = 100 - openCount;
  const paidCount = board.squares.reduce(
    (total, names, index) => (names.length && entryMeta[index]?.paid_status === 'paid' ? total + 1 : total),
    0,
  );
  const unpaidCount = assignedCount - paidCount;
  const axesCommitted = isExactAxis(board.topAxis) && isExactAxis(board.leftAxis);
  const conflicted = saveState.status === 'conflicted';

  const model = useMemo(() => evaluateOrganizerLifecycle({
    board: {
      id: activePoolId || '',
      ownerId: activePoolId ? 'server-owner-known' : '',
      title: game.title,
      scheduledGame: game.gameExternalId && game.kickoffAt ? { id: game.gameExternalId, kickoffAt: game.kickoffAt } : null,
      cells: lifecycleCells(board, entryMeta),
      topAxis: board.topAxis,
      sideAxis: board.leftAxis,
      isDynamic: board.isDynamic,
      // Report the honest state; the draw gate below is what excuses it,
      // because DrawControl asks the question inline right before the draw.
      openSquaresAcknowledged: board.allowOpenSquares === true || openCount === 0,
      publishedAt: isPublished ? 'server-published' : null,
    },
    save: saveState,
  }), [activePoolId, board, entryMeta, game, isPublished, saveState]);

  const viewerPath = published ? published.viewerUrl : shareCode ? `/b/${shareCode}` : null;
  const shareUrl = viewerPath ? `${window.location.origin}${viewerPath}` : '';

  const canAssignOpenSquares = publishedOpenSquaresAreAssignable({
    isPublished,
    openSquareCount: openCount,
    kickoffAt: game.kickoffAt,
    now: clockNow,
  }) && !conflicted;
  const finalRecord = isPublished && liveData?.state === 'post';

  // Everything except the acknowledgement, which the draw itself collects.
  const DRAW_TOLERATED = new Set<string>([ACKNOWLEDGEMENT_BLOCKER, 'save_dirty', 'save_saving']);
  const canEnterDraw = !conflicted
    && model.hardBlockers.every((blocker) => DRAW_TOLERATED.has(blocker));
  const publishBlocked = model.hardBlockers.some((blocker) => !String(blocker).startsWith('save_'));

  const startPreview = useCallback(() => {
    setDrawPreview({ top: secureShuffleDigits(), left: secureShuffleDigits() });
  }, []);

  const requestDraw = () => {
    setDrawRequested(true);
    setNote(null);
    setAlert(null);
    if (openCount > 0 && board.allowOpenSquares !== true) return;
    startPreview();
  };

  const acknowledgeOpenSquares = () => {
    setBoard((current) => ({ ...current, allowOpenSquares: true }));
    startPreview();
  };

  // A square blanked after the draw reopens the open-square question. The
  // organizer answers it in place: no new digits are staged, only the
  // acknowledgement the publish gate is waiting on.
  const acknowledgeOpenSquaresOnly = () => {
    setBoard((current) => ({ ...current, allowOpenSquares: true }));
  };

  const cancelDraw = () => {
    setDrawPreview(null);
    setDrawRequested(false);
  };

  const commitDraw = () => {
    if (!drawPreview) return;
    const { top, left } = drawPreview;
    setBoard((current) => ({
      ...current,
      topAxis: top,
      leftAxis: left,
      isDynamic: false,
      allowOpenSquares: openCount > 0,
      leftAxisByQuarter: undefined,
      topAxisByQuarter: undefined,
    }));
    setDrawPreview(null);
    setDrawRequested(false);
  };

  // A replacement draw runs the same gate, so a board that still has open
  // squares gets the acknowledgement question instead of a silent redraw.
  const replaceDraw = requestDraw;

  // Deliberately does not wrap: past the last open square there is nowhere
  // forward to go, so the sheet closes instead of looping to the top.
  const nextOpenAfter = (squares: string[][], index: number) => {
    for (let cursor = index + 1; cursor < squares.length; cursor += 1) {
      if (!squares[cursor]?.length) return cursor;
    }
    return null;
  };

  const saveSquare = async (index: number, name: string, meta: EntryMeta, advance: boolean) => {
    const trimmed = name.trim();
    let nextSquares: string[][] = board.squares;
    setBoard((current) => {
      const squares = [...current.squares];
      squares[index] = trimmed ? [trimmed] : [];
      nextSquares = squares;
      return { ...current, squares };
    });
    setSelectedSquare(advance ? nextOpenAfter(nextSquares, index) : null);

    if (!activePoolId) return;
    try {
      await saveEntryMeta(activePoolId, meta);
      onEntryMetaChange(meta);
      setNote(null);
      setAlert(null);
    } catch {
      setAlert(SQUARE_META_FAILED);
    }
  };

  const pasteNames = (names: string[]) => {
    setBoard((current) => {
      const squares = [...current.squares];
      let cursor = 0;
      for (let index = 0; index < squares.length && cursor < names.length; index += 1) {
        if (!squares[index]?.length) {
          squares[index] = [names[cursor]];
          cursor += 1;
        }
      }
      return { ...current, squares };
    });
  };

  const clearNames = async () => {
    setBoard((current) => ({ ...current, squares: current.squares.map(() => []) }));
    if (!activePoolId) return;
    try {
      await clearEntryMeta(activePoolId);
      setAlert(null);
    } catch {
      setAlert(CLEAR_META_FAILED);
    }
  };

  const importPhoto = async (file: File) => {
    setImporting(true);
    setNote(null);
    setAlert(null);
    try {
      const raw = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = () => reject(new Error('The photo could not be read.'));
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(raw);
      const scanned = await parseBoardImage(compressed);
      setBoard((current) => ({ ...current, squares: scanned.squares }));
      setNote('Names read from the photo. Check every square before you draw.');
    } catch (error: any) {
      setAlert(error?.message || 'The photo could not be read.');
    } finally {
      setImporting(false);
    }
  };

  const exportBoard = async (mode: 'owners' | 'sellers') => {
    setExporting(true);
    setNote(null);
    setAlert(null);
    try {
      const sellersByIndex: Record<number, string | null | undefined> = {};
      Object.entries(entryMeta).forEach(([index, meta]) => {
        sellersByIndex[Number(index)] = meta?.seller_label;
      });
      const blob = await renderBoardPng({
        board,
        game,
        sellersByIndex,
        mode,
        shareUrl: published ? shareUrl : undefined,
      });
      const outcome = await shareBoardPng(
        blob,
        boardImageFilename(game, mode),
        `${game.title || 'Squares board'} — ${game.dates || ''}`.trim(),
      );
      if (outcome === 'downloaded') setNote('Board image saved to your downloads.');
    } catch (error: any) {
      setAlert(error?.message || 'The board image could not be created.');
    } finally {
      setExporting(false);
    }
  };

  const updatePayoutDescription = (field: keyof PayoutDescriptions, value: string) => {
    setPayoutStatus('idle');
    setGame((current) => ({ ...current, payoutDescriptions: { ...current.payoutDescriptions, [field]: value } }));
  };

  const savePayoutDescriptions = async () => {
    if (!activePoolId) return;
    setPayoutStatus('saving');
    try {
      const saved = await onSavePayoutDescriptions(game.payoutDescriptions || {});
      setGame((current) => ({ ...current, payoutDescriptions: saved }));
      setPayoutStatus('saved');
      setNote(null);
      setAlert(null);
    } catch {
      setPayoutStatus('error');
      setAlert(PAYOUT_FAILED);
    }
  };

  const openPreview = async () => {
    setPublishError(null);
    setAlert(null);
    await flush();
    setPreviewOpen(true);
  };

  const publish = async () => {
    if (!activePoolId) return;
    setPublishError(null);
    setPublishPending(true);
    try {
      // Gate on the state the flush actually left behind, not the one this
      // render captured before the save ran.
      const flushed = await flush();
      if (flushed.status !== 'clean') {
        setPublishError(PUBLISH_BLOCKED);
        return;
      }
      const result = await publishBoard(activePoolId, {
        allowOpenSquares: board.allowOpenSquares === true && openCount > 0,
      });
      if (!result.published) {
        setPublishOpen(false);
        setUpgradeError(result.message || null);
        setUpgradeTier(result.upgradeTo);
        return;
      }
      setPublished(result);
      setPublishOpen(false);
      setPublishedOpen(true);
      setAlert(null);
      // The reload is deferred: it flips this board to published and swaps the
      // surface underneath, which would tear the success sheet off the screen.
    } catch (error: any) {
      const message = error?.message || 'The board could not be published.';
      setPublishError(message);
      setAlert(message);
    } finally {
      setPublishPending(false);
    }
  };

  const copyShareLink = async () => {
    setPublishedOpen(true);
    try {
      await navigator.clipboard?.writeText(shareUrl);
    } catch {
      // The published sheet shows the link and its own copy control.
    }
  };

  const checkout = async () => {
    if (!upgradeTier) return;
    setUpgradeError(null);
    try {
      await onCheckout?.(upgradeTier, upgradeTier === 'org' ? organizationName.trim() : undefined);
    } catch (error: any) {
      setUpgradeError(error?.message || 'Checkout could not be started.');
    }
  };

  /**
   * Published boards take one of two routes out of the square sheet: a late
   * fill on an OPEN cell through the dedicated callback, or an audited rename
   * on an assigned cell. Clearing or overwriting an assignment any other way
   * is refused — the published board is the record families are reading.
   */
  const lateFillOpenSquare = async (index: number, name: string) => {
    const squares = [...board.squares];
    // Never let a late fill touch an occupied cell, whatever route got here.
    if (squares[index]?.length) {
      setAlert(PUBLISHED_IMMUTABLE);
      return;
    }
    if (!canAssignOpenSquares) {
      setAlert(LATE_FILL_CLOSED);
      return;
    }
    squares[index] = [name];
    try {
      await onAssignOpenSquares(squares);
      await onReload?.();
      setAlert(null);
      setNote(`Square ${index + 1} assigned before kickoff.`);
    } catch (error: any) {
      setAlert(error?.message || LATE_FILL_FAILED);
    }
  };

  const renameSquare = async (index: number, previous: string, next: string) => {
    if (!activePoolId) return;
    setBoard((current) => {
      const squares = [...current.squares];
      squares[index] = [next];
      return { ...current, squares };
    });
    try {
      await renamePublishedSquare(activePoolId, index, next);
      setAlert(null);
      setNote(`Square ${index + 1} changed from ${previous} to ${next}. The change is in the board history.`);
    } catch (error: any) {
      setBoard((current) => {
        const squares = [...current.squares];
        squares[index] = [previous];
        return { ...current, squares };
      });
      setAlert(error?.message || RENAME_FAILED);
    }
  };

  const savePublishedSquare = async (index: number, name: string, meta: EntryMeta) => {
    const previous = board.squares[index]?.[0]?.trim() ?? '';
    const next = name.trim();
    setSelectedSquare(null);

    if (!previous) {
      if (next) await lateFillOpenSquare(index, next);
    } else if (!next) {
      setAlert(PUBLISHED_IMMUTABLE);
      return;
    } else if (next !== previous) {
      await renameSquare(index, previous, next);
    }

    if (!activePoolId) return;
    try {
      await saveEntryMeta(activePoolId, meta);
      onEntryMetaChange(meta);
    } catch {
      setAlert(SQUARE_META_FAILED);
    }
  };

  const enableManualScoring = async () => {
    if (!activePoolId || game.useManualScores) return;
    setScoreSaveStatus('saving');
    setAlert(null);
    try {
      await enableManualScoringOnServer(activePoolId);
      setGame((current) => {
        const seed = seedManualScoreFromSnapshot(current.scoreSnapshot ?? liveData);
        return { ...current, useManualScores: true, scoreSnapshot: null, manualQuarterScores: seed.manualQuarterScores, manualPeriod: seed.manualPeriod, manualGameState: seed.manualGameState };
      });
      // Deliberately no reload: the seeded quarters live only in the local
      // draft until they are published, and a published board never goes
      // dirty, so re-adopting the server game here would wipe them back to 0.
      setScoreSaveStatus('idle');
      setNote('Manual scoring is on. Enter the score, then publish it.');
    } catch (error: any) {
      setScoreSaveStatus('error');
      setAlert(error?.message || 'Manual scoring could not be enabled.');
    }
  };

  const saveManualScore = async () => {
    if (!activePoolId) return;
    setScoreSaveStatus('saving');
    setAlert(null);
    try {
      const result = await saveManualScoreToServer(activePoolId, game);
      setGame((current) => ({ ...current, useManualScores: true, scoreSnapshot: result.score }));
      await onReload?.();
      setScoreSaveStatus('saved');
      setNote('Manual score is live. Winners for completed quarters were updated once.');
    } catch (error: any) {
      setScoreSaveStatus('error');
      setAlert(error?.message || 'Unable to save the score.');
    }
  };

  const enableAutomaticScoring = async () => {
    if (!activePoolId) return;
    setScoreSaveStatus('saving');
    setAlert(null);
    try {
      await returnAutomaticScoringOnServer(activePoolId);
      setGame((current) => ({ ...current, useManualScores: false, scoreSnapshot: null }));
      await onReload?.();
      setScoreSaveStatus('idle');
      setNote('Automatic score checks are enabled.');
    } catch (error: any) {
      setScoreSaveStatus('error');
      setAlert(error?.message || 'Automatic scoring could not be enabled.');
    }
  };

  const updateManualQuarter = (quarter: ManualQuarterKey, side: ManualScoreSide, value: number) => {
    setGame((current) => {
      const base = current.manualQuarterScores ?? EMPTY_MANUAL_SCORES;
      return { ...current, manualQuarterScores: { ...base, [quarter]: { ...base[quarter], [side]: Math.max(0, value) } } };
    });
  };

  const updateManualGameState = (state: ManualGameState) => {
    setGame((current) => ({
      ...current,
      manualGameState: state,
      manualPeriod: manualPeriodForState(state, current.manualPeriod, current.manualQuarterScores),
    }));
  };

  const publishCorrection = async () => {
    if (!activePoolId || !correctionDraft) return;
    setScoreSaveStatus('saving');
    setAlert(null);
    try {
      const result = await publishMilestoneCorrectionToServer(activePoolId, correctionDraft);
      if (Array.isArray(result.winnerHistory)) setCorrectionHistory(result.winnerHistory);
      setCorrectionDraft(null);
      await onReload?.();
      setScoreSaveStatus('saved');
      setNote('Correction published. Everyone can now see the updated history.');
    } catch (error: any) {
      setScoreSaveStatus('error');
      setAlert(error?.message || 'The correction could not be published.');
    }
  };

  const copyViewerLink = async () => {
    try {
      await navigator.clipboard?.writeText(shareUrl);
      setAlert(null);
      setNote('Viewer link copied.');
    } catch {
      setAlert('The link could not be copied. Open the public board panel and copy the address there.');
    }
  };

  const scrollToBoard = () => {
    document.getElementById('workspace-board')?.scrollIntoView({ block: 'start' });
  };

  const firstBlocker = model.hardBlockers[0];
  const islandNote = firstBlocker ? blockerNote[firstBlocker] || 'Review this board before publishing.' : note || undefined;

  const primary = published
    ? { label: 'Copy link', onClick: () => void copyShareLink() }
    : assignedCount === 0
      ? { label: 'Fill the board', onClick: scrollToBoard }
      : axesCommitted
        ? { label: 'Preview', onClick: () => void openPreview() }
        : { label: 'Draw numbers', onClick: requestDraw, disabled: !canEnterDraw };

  const secondary = axesCommitted && !published && !isPublished
    ? [{ label: 'Replace draft draw', onClick: replaceDraw, disabled: conflicted }]
    : undefined;

  const leavePublishedSheet = () => {
    setPublishedOpen(false);
    void onReload?.();
  };

  const mainLabel = game.title?.trim() ? `${game.title} workspace` : UNTITLED_WORKSPACE;

  const alertRegion = alert ? (
    <p role="alert" className="mt-4 font-ui text-[15px] text-tone-cardinal">{alert}</p>
  ) : null;

  const header = (
    <WorkspaceHeader
      game={game}
      saveState={saveState}
      isPublished={isPublished}
      onTitleChange={(title) => setGame((current) => ({ ...current, title }))}
      onGameChange={(scheduled) => setGame((current) => applyScheduledGame(current, scheduled))}
      onRetry={() => void retry()}
      onReload={() => void reloadLatest()}
      onLogout={onLogout}
    />
  );

  // The sheets live outside the published/unpublished branch: publishing flips
  // `isPublished` under our feet, and the success sheet has to survive it.
  const sheets = (
    <>
      <SquareSheet
        open={selectedSquare !== null}
        index={selectedSquare}
        name={selectedSquare === null ? '' : board.squares[selectedSquare]?.[0] ?? ''}
        meta={selectedSquare === null ? undefined : entryMeta[selectedSquare]}
        isPublished={isPublished}
        hasNextOpen={openCount > 0}
        onSave={(index, name, meta, advance) => void (isPublished
          ? savePublishedSquare(index, name, meta)
          : saveSquare(index, name, meta, advance))}
        onClose={() => setSelectedSquare(null)}
      />

      <PreviewSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        canPublish={axesCommitted && !conflicted}
        onReviewPublish={() => {
          setPreviewOpen(false);
          setPublishOpen(true);
        }}
      >
        {renderPreview ? renderPreview() : <p className="font-ui text-[15px] text-fg-2">Private preview — sharing is off</p>}
      </PreviewSheet>

      <PublishSheet
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        game={game}
        board={board}
        allowance={billing}
        pending={publishPending}
        error={publishError ?? (publishBlocked && firstBlocker ? (blockerNote[firstBlocker] || 'Review this board before publishing.') : null)}
        disabled={!axesCommitted || conflicted || publishPending || publishBlocked}
        onPublish={() => void publish()}
      />

      <UpgradeSheet
        open={upgradeTier !== null}
        tier={upgradeTier ?? 'gameday'}
        error={upgradeError}
        organizationName={organizationName}
        onOrganizationNameChange={setOrganizationName}
        onClose={() => setUpgradeTier(null)}
        onCheckout={() => void checkout()}
      />

      <PublishedSheet
        open={publishedOpen && published !== null}
        shareUrl={shareUrl}
        onClose={leavePublishedSheet}
        onOpenViewer={() => onOpenViewer?.()}
        onEnterGameDay={leavePublishedSheet}
      />
    </>
  );

  if (isPublished) {
    const gameDayPrimary = finalRecord
      ? { label: 'Create another board', onClick: () => window.location.assign('/create') }
      : { label: 'Copy link', onClick: () => void copyViewerLink() };

    return (
      <Base kind="cream">
        <OrganizerIsland
          filled={assignedCount}
          paid={paidCount}
          drawn
          phase={model.phase}
          primary={gameDayPrimary}
          secondary={onOpenViewer ? [{ label: 'Open public board', onClick: () => onOpenViewer() }] : undefined}
        />
        <main aria-label={mainLabel} className="mx-auto max-w-7xl px-4 pt-6 pb-24 lg:pt-8">
          {header}
          {alertRegion}
          {/* Game-day confirmations stay in the flow: the island collapses, and
              a rename or a late fill is worth reading without expanding it. */}
          {note ? <p role="status" className="mt-4 font-ui text-[15px] text-fg-2">{note}</p> : null}
          <div className="mt-8 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] [&>*]:min-w-0">
            <section id="workspace-board" aria-label="Board" className="flex min-w-0 max-w-full flex-col gap-6">
              {finalRecord && <FinalRecordCard winnerHistory={correctionHistory} />}
              <SharePanel shareUrl={shareUrl} onOpenViewer={() => onOpenViewer?.()} />
              <ScoreAuthorityCard
                game={game}
                liveData={liveData}
                scoreSaveStatus={scoreSaveStatus}
                isActivated={isActivated}
                onEnableAutomaticScoring={() => void enableAutomaticScoring()}
                onEnableManualScoring={() => void enableManualScoring()}
                onUpdateManualGameState={updateManualGameState}
                onUpdateManualPeriod={(period) => setGame((current) => ({ ...current, manualPeriod: period }))}
                onUpdateManualQuarter={updateManualQuarter}
                onSaveManualScore={() => void saveManualScore()}
              />
              <BoardEditor
                board={board}
                game={game}
                entryMeta={entryMeta}
                drawPreview={null}
                highlightOpen={false}
                isPublished
                canAssignOpenSquares={canAssignOpenSquares}
                onSelectSquare={setSelectedSquare}
              />
            </section>
            <aside className="flex flex-col gap-6">
              <PayoutRulesCard
                descriptions={game.payoutDescriptions || {}}
                status={payoutStatus}
                disabled={!activePoolId}
                onChange={updatePayoutDescription}
                onSavePayoutDescriptions={() => void savePayoutDescriptions()}
              />
              <CorrectionsCard
                winnerHistory={correctionHistory}
                draft={correctionDraft}
                pending={scoreSaveStatus === 'saving'}
                onDraftChange={setCorrectionDraft}
                onPublishCorrection={() => void publishCorrection()}
              />
              <DeliveryIssuesCard issues={notificationDeliveryIssues} />
              <BoardToolsCard
                isPublished
                exporting={exporting}
                onExport={(mode) => void exportBoard(mode)}
                hasSellers={Object.values(entryMeta).some((meta) => Boolean(meta?.seller_label))}
              />
            </aside>
          </div>
        </main>
        {sheets}
      </Base>
    );
  }

  return (
    <Base kind="cream">
      <OrganizerIsland
        filled={assignedCount}
        paid={paidCount}
        drawn={axesCommitted}
        phase={model.phase}
        primary={primary}
        secondary={secondary}
        note={islandNote}
      />
      <main aria-label={mainLabel} className="mx-auto max-w-7xl px-4 pt-6 pb-24 lg:pt-8">
        {header}
        {alertRegion}
        <div className="mt-8 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] [&>*]:min-w-0">
          <section id="workspace-board" aria-label="Board" className="flex min-w-0 max-w-full flex-col gap-4">
            {(drawRequested || drawPreview || axesCommitted) && (
              <DrawControl
                openCount={openCount}
                requested={drawRequested}
                acknowledged={board.allowOpenSquares === true}
                drawn={axesCommitted}
                preview={Boolean(drawPreview)}
                disabled={conflicted}
                onAcknowledge={acknowledgeOpenSquares}
                onAcknowledgeWithoutDraw={acknowledgeOpenSquaresOnly}
                onKeepAssigning={() => { cancelDraw(); scrollToBoard(); }}
                onDraw={startPreview}
                onCommit={commitDraw}
                onAgain={startPreview}
                onReplace={replaceDraw}
                onCancelPreview={cancelDraw}
              />
            )}
            <BoardEditor
              board={board}
              game={game}
              entryMeta={entryMeta}
              drawPreview={drawPreview}
              highlightOpen={highlightOpen}
              isPublished={false}
              canAssignOpenSquares={false}
              onSelectSquare={setSelectedSquare}
              onPasteNames={pasteNames}
            />
          </section>
          <aside className="flex flex-col gap-6">
            <ReconcileCard
              model={model}
              unpaidCount={unpaidCount}
              highlightOpen={highlightOpen}
              onToggleHighlightOpen={() => setHighlightOpen((current) => !current)}
            />
            <PayoutRulesCard
              descriptions={game.payoutDescriptions || {}}
              status={payoutStatus}
              disabled={!activePoolId}
              onChange={updatePayoutDescription}
              onSavePayoutDescriptions={() => void savePayoutDescriptions()}
            />
            <BoardToolsCard
              isPublished={false}
              exporting={exporting}
              onExport={(mode) => void exportBoard(mode)}
              hasSellers={Object.values(entryMeta).some((meta) => Boolean(meta?.seller_label))}
              onImportPhoto={(file) => void importPhoto(file)}
              importing={importing}
              onClearNames={() => void clearNames()}
            />
          </aside>
        </div>
      </main>
      {sheets}
    </Base>
  );
}
