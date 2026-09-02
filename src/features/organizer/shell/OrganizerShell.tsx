import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { BoardData, GameState, LiveGameData, NotificationDeliveryIssue, PayoutDescriptions, WinnerResolution } from '../../../../types';
import { secureShuffleDigits } from '../../../../components/AdminPanel';
import { evaluateOrganizerLifecycle } from '../lifecycle/organizerLifecycle';
import type { DraftSaveState } from '../draft/draftSaveModel';
import TaskHeader from './TaskHeader';
import ProgressDisclosure from './ProgressDisclosure';
import AssignmentWorkspace from './AssignmentWorkspace';
import ReconcileChecklist from './ReconcileChecklist';
import DrawWorkspace from './DrawWorkspace';
import ViewerPreviewWorkspace from './ViewerPreviewWorkspace';
import PublishReviewDialog from './PublishReviewDialog';
import GameDayControls from './GameDayControls';
import CorrectionFlow from './CorrectionFlow';
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

export interface OrganizerShellProps {
  game: GameState;
  board: BoardData;
  activePoolId: string | null;
  liveData: LiveGameData | null;
  winnerHistory: WinnerResolution[];
  notificationDeliveryIssues: NotificationDeliveryIssue[];
  onApply: (game: GameState, board: BoardData) => void;
  onPublish: (currentData: { game: GameState, board: BoardData }) => Promise<string | void>;
  onSavePayoutDescriptions: (descriptions: PayoutDescriptions) => Promise<PayoutDescriptions>;
  onAssignOpenSquares: (squares: string[][]) => Promise<void>;
  onReload?: () => Promise<void> | void;
  onOpenViewer?: () => void;
  onLogout: () => void;
  isActivated: boolean;
  isPublished: boolean;
  shareCode: string | null;
  renderPreview?: () => React.ReactNode;
  saveState?: DraftSaveState;
}

const exactAxis = (axis: (number | null)[]) => axis.length === 10 && new Set(axis).size === 10 && axis.every((n) => Number.isInteger(n));
const actionableSaveStatuses = new Set<DraftSaveState['status']>(['dirty', 'saving', 'save_failed', 'conflicted', 'recovered']);

const lifecycleCells = (board: BoardData) => board.squares.map((names) => {
  const label = names[0]?.trim();
  if (!label) return null;
  const participant = board.participants?.find((item) => item.displayName === label || item.publicLabel === label);
  return {
    publicLabel: label,
    participantId: participant?.id,
    paidStatus: 'unknown',
    sellerLabel: undefined,
  };
});

export default function OrganizerShell({
  game,
  board,
  activePoolId,
  liveData,
  winnerHistory,
  notificationDeliveryIssues,
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
  saveState = { status: 'clean', revision: 0 },
}: OrganizerShellProps) {
  const [draftBoard, setDraftBoard] = useState(board);
  const [localGame, setLocalGame] = useState(game);
  const [drawPreview, setDrawPreview] = useState<{ top: number[]; left: number[] } | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishPending, setPublishPending] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [payoutSaveStatus, setPayoutSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [scoreSaveStatus, setScoreSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [assignmentLabel, setAssignmentLabel] = useState('');
  const [selectedOpenSquare, setSelectedOpenSquare] = useState<number | null>(null);
  const [assigningOpenSquares, setAssigningOpenSquares] = useState(false);
  const [correctionHistory, setCorrectionHistory] = useState(winnerHistory);
  const [correctionDraft, setCorrectionDraft] = useState<MilestoneCorrectionDraft | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const lastSyncedRevision = useRef<number | null>(saveState.revision);
  const lastBoardProp = useRef(board);

  useEffect(() => {
    setLocalGame(game);
  }, [game]);

  useEffect(() => {
    setCorrectionHistory(winnerHistory);
  }, [winnerHistory]);

  useEffect(() => {
    if (!isPublished) return;
    const interval = window.setInterval(() => setClockNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, [isPublished]);

  useEffect(() => {
    const revisionChanged = lastSyncedRevision.current !== saveState.revision;
    const remoteBoardChanged = lastBoardProp.current !== board;
    const dirtyLocalState = actionableSaveStatuses.has(saveState.status) && saveState.status !== 'recovered';

    if (revisionChanged) lastSyncedRevision.current = saveState.revision;
    if (remoteBoardChanged) lastBoardProp.current = board;
    if ((revisionChanged || remoteBoardChanged) && !dirtyLocalState) {
      setDraftBoard(board);
      setDrawPreview(null);
    }
  }, [board, saveState.revision, saveState.status]);

  const model = useMemo(() => evaluateOrganizerLifecycle({
    board: {
      id: activePoolId || '',
      ownerId: activePoolId ? 'server-owner-known' : '',
      title: localGame.title,
      scheduledGame: localGame.gameExternalId && localGame.kickoffAt ? { id: localGame.gameExternalId, kickoffAt: localGame.kickoffAt } : null,
      cells: lifecycleCells(draftBoard),
      topAxis: draftBoard.topAxis,
      sideAxis: draftBoard.leftAxis,
      isDynamic: draftBoard.isDynamic,
      openSquaresAcknowledged: draftBoard.allowOpenSquares === true || draftBoard.squares.every((cell) => cell.length > 0),
      publishedAt: isPublished ? 'server-published' : null,
      gameState: liveData?.state,
      finalResolutionsComplete: liveData?.state === 'post' && winnerHistory.some((w) => w.milestone === 'FINAL'),
    },
    save: saveState,
  }), [activePoolId, draftBoard, localGame, isPublished, liveData?.state, saveState, winnerHistory]);

  const conflictBlocked = saveState.status === 'conflicted';
  const hardBlocked = model.hardBlockers.length > 0;
  const axesCommitted = exactAxis(draftBoard.topAxis) && exactAxis(draftBoard.leftAxis);
  const finalRecord = isPublished && liveData?.state === 'post';
  const drawDisabled = !model.canEnterDraw || conflictBlocked;
  const publishDisabled = !axesCommitted || !model.canPublish || conflictBlocked || publishPending;
  const nextDraw = () => {
    if (drawDisabled) return;
    setDrawPreview({ top: secureShuffleDigits(), left: secureShuffleDigits() });
  };
  const commitDraw = () => {
    if (!drawPreview || drawDisabled) return;
    const nextBoard: BoardData = {
      ...draftBoard,
      topAxis: drawPreview.top,
      leftAxis: drawPreview.left,
      isDynamic: false,
      leftAxisByQuarter: undefined,
      topAxisByQuarter: undefined,
      allowOpenSquares: draftBoard.allowOpenSquares || draftBoard.squares.some((cell) => cell.length === 0),
    };
    setDraftBoard(nextBoard);
    setDrawPreview(null);
    onApply(localGame, nextBoard);
  };
  const publish = async () => {
    setPublishMessage(null);
    setPublishError(null);
    const latestModel = evaluateOrganizerLifecycle({
      board: {
        id: activePoolId || '',
        ownerId: activePoolId ? 'server-owner-known' : '',
        title: localGame.title,
        scheduledGame: localGame.gameExternalId && localGame.kickoffAt ? { id: localGame.gameExternalId, kickoffAt: localGame.kickoffAt } : null,
        cells: lifecycleCells(draftBoard),
        topAxis: draftBoard.topAxis,
        sideAxis: draftBoard.leftAxis,
        isDynamic: draftBoard.isDynamic,
        openSquaresAcknowledged: draftBoard.allowOpenSquares === true || draftBoard.squares.every((cell) => cell.length > 0),
        publishedAt: null,
      },
      save: saveState,
      publishIntent: true,
    });
    if (!latestModel.canPublish || saveState.status !== 'clean') {
      setPublishError('Publish blocked. Reload or save the latest clean draft before publishing.');
      return;
    }
    setPublishPending(true);
    try {
      const result = await onPublish({ game: localGame, board: draftBoard });
      setPublishMessage(result ? `Published: ${result}` : 'Published.');
      setPublishDialogOpen(false);
    } catch (error: any) {
      setPublishError(error.message || 'Publish failed.');
    } finally {
      setPublishPending(false);
    }
  };

  const openSquareCount = draftBoard.squares.filter((names) => !names.length).length;
  const canAssignPublishedOpenSquares = publishedOpenSquaresAreAssignable({
    isPublished,
    openSquareCount,
    kickoffAt: localGame.kickoffAt,
    now: clockNow,
  });

  const updatePayoutDescription = (field: keyof PayoutDescriptions, value: string) => {
    setPayoutSaveStatus('idle');
    setLocalGame((current) => ({
      ...current,
      payoutDescriptions: { ...current.payoutDescriptions, [field]: value },
    }));
  };

  const savePayoutDescriptions = async () => {
    if (!activePoolId) return;
    setActionError(null);
    setActionMessage(null);
    setPayoutSaveStatus('saving');
    try {
      const saved = await onSavePayoutDescriptions(localGame.payoutDescriptions || {});
      const nextGame = { ...localGame, payoutDescriptions: saved };
      setLocalGame(nextGame);
      onApply(nextGame, draftBoard);
      await onReload?.();
      setPayoutSaveStatus('saved');
      setActionMessage('Prize notes saved. Families will see them after they refresh the board.');
    } catch (error: any) {
      setPayoutSaveStatus('error');
      setActionError(error.message || 'Prize notes could not be saved.');
    }
  };

  const assignOpenSquare = async () => {
    const label = assignmentLabel.trim();
    if (!isPublished || !canAssignPublishedOpenSquares || selectedOpenSquare === null || !label) return;
    const nextBoard = { ...draftBoard, squares: [...draftBoard.squares] };
    if (nextBoard.squares[selectedOpenSquare]?.length) {
      setActionError('Published assignments cannot be changed. Select OPEN squares only.');
      return;
    }
    nextBoard.squares[selectedOpenSquare] = [label];
    setAssigningOpenSquares(true);
    setActionError(null);
    try {
      await onAssignOpenSquares(nextBoard.squares);
      await onReload?.();
      setAssignmentLabel('');
      setSelectedOpenSquare(null);
      setActionMessage(`Square ${selectedOpenSquare + 1} assigned before kickoff.`);
    } catch (error: any) {
      setActionError(error.message || 'The OPEN squares could not be assigned. Reload and try again.');
    } finally {
      setAssigningOpenSquares(false);
    }
  };

  const enableManualScoring = async () => {
    if (!activePoolId || localGame.useManualScores) return;
    setScoreSaveStatus('saving');
    setActionError(null);
    try {
      await enableManualScoringOnServer(activePoolId);
      setLocalGame((current) => {
        const seed = seedManualScoreFromSnapshot(current.scoreSnapshot ?? liveData);
        return { ...current, useManualScores: true, scoreSnapshot: null, manualQuarterScores: seed.manualQuarterScores, manualPeriod: seed.manualPeriod, manualGameState: seed.manualGameState };
      });
      await onReload?.();
      setScoreSaveStatus('idle');
      setActionMessage('Manual scoring is on. Enter the score, then publish it.');
    } catch (error: any) {
      setScoreSaveStatus('error');
      setActionError(error.message || 'Manual scoring could not be enabled.');
    }
  };

  const saveManualScore = async () => {
    if (!activePoolId) return;
    setScoreSaveStatus('saving');
    setActionError(null);
    try {
      const result = await saveManualScoreToServer(activePoolId, localGame);
      setLocalGame((current) => ({ ...current, useManualScores: true, scoreSnapshot: result.score }));
      await onReload?.();
      setScoreSaveStatus('saved');
      setActionMessage('Manual score is live. Winners for completed quarters were updated once.');
    } catch (error: any) {
      setScoreSaveStatus('error');
      setActionError(error.message || 'Unable to save the score.');
    }
  };

  const enableAutomaticScoring = async () => {
    if (!activePoolId) return;
    setScoreSaveStatus('saving');
    setActionError(null);
    try {
      await returnAutomaticScoringOnServer(activePoolId);
      setLocalGame((current) => ({ ...current, useManualScores: false, scoreSnapshot: null }));
      await onReload?.();
      setScoreSaveStatus('idle');
      setActionMessage('Automatic score checks are enabled.');
    } catch (error: any) {
      setScoreSaveStatus('error');
      setActionError(error.message || 'Automatic scoring could not be enabled.');
    }
  };

  const updateManualQuarter = (quarter: ManualQuarterKey, side: ManualScoreSide, value: number) => {
    setLocalGame((current) => {
      const base = current.manualQuarterScores ?? EMPTY_MANUAL_SCORES;
      return { ...current, manualQuarterScores: { ...base, [quarter]: { ...base[quarter], [side]: Math.max(0, value) } } };
    });
  };

  const updateManualGameState = (state: ManualGameState) => {
    setLocalGame((current) => ({
      ...current,
      manualGameState: state,
      manualPeriod: manualPeriodForState(state, current.manualPeriod, current.manualQuarterScores),
    }));
  };

  const publishCorrection = async () => {
    if (!activePoolId || !correctionDraft) return;
    setScoreSaveStatus('saving');
    setActionError(null);
    try {
      const result = await publishMilestoneCorrectionToServer(activePoolId, correctionDraft);
      if (Array.isArray(result.winnerHistory)) setCorrectionHistory(result.winnerHistory);
      setCorrectionDraft(null);
      await onReload?.();
      setScoreSaveStatus('saved');
      setActionMessage('Correction published. Everyone can now see the updated history.');
    } catch (error: any) {
      setScoreSaveStatus('error');
      setActionError(error.message || 'The correction could not be published.');
    }
  };

  return (
    <main data-feature-flag="organizer_v2" data-variant="organizer_v2:on" className="min-h-[100dvh] max-w-[100vw] overflow-x-hidden overflow-y-auto bg-broadcast-white text-ink" style={{ contain: 'inline-size paint', overflowX: 'clip' }}>
      <TaskHeader game={localGame} phase={model.phase} saveState={saveState} isPublished={isPublished} />
      <ProgressDisclosure phase={model.phase} />
      <div className="mx-auto grid min-w-0 w-full max-w-7xl gap-5 px-4 py-5">
        {publishMessage && <p role="status" className="border border-newsprint p-3">{publishMessage}</p>}
        {publishError && <p role="alert" className="border border-cardinal p-3 text-cardinal">{publishError}</p>}
        {actionMessage && <p role="status" className="border border-newsprint p-3">{actionMessage}</p>}
        {actionError && <p role="alert" className="border border-cardinal p-3 text-cardinal">{actionError}</p>}
        {conflictBlocked && onReload && <button type="button" className="oa-btn oa-btn-primary justify-self-start" onClick={() => void onReload()}>Reload latest board</button>}
        {finalRecord && (
          <section role="region" aria-label="Completed board" className="border border-gold bg-newsprint p-4 text-ink">
            <p className="oa-slab text-sm uppercase tracking-[0.18em] text-cardinal">Final record</p>
            <h2 className="oa-headline mt-1 text-2xl text-ink">This board is locked as the Final record.</h2>
            <p className="oa-body mt-2 text-sm text-ink/70">Scores, winners, OPEN outcomes, and public corrections stay visible for trust. Regular setup editing is closed; create another board for the next fundraiser or game.</p>
            <a href="/create" className="oa-btn oa-btn-primary mt-3 inline-flex">Create another board</a>
          </section>
        )}
        {isPublished ? (
          <>
            <GameDayControls
              game={localGame}
              liveData={liveData}
              shareCode={shareCode}
              issues={notificationDeliveryIssues}
              payoutSaveStatus={payoutSaveStatus}
              scoreSaveStatus={scoreSaveStatus}
              onOpenViewer={onOpenViewer}
              onUpdatePayoutDescription={updatePayoutDescription}
              onSavePayoutDescriptions={savePayoutDescriptions}
              onEnableAutomaticScoring={enableAutomaticScoring}
              onEnableManualScoring={enableManualScoring}
              onUpdateManualGameState={updateManualGameState}
              onUpdateManualPeriod={(period) => setLocalGame((current) => ({ ...current, manualPeriod: period }))}
              onUpdateManualQuarter={updateManualQuarter}
              onSaveManualScore={saveManualScore}
              disabled={!activePoolId || conflictBlocked || scoreSaveStatus === 'saving'}
              isActivated={isActivated}
            />
            <AssignmentWorkspace
              board={draftBoard}
              game={localGame}
              published
              canAssignOpenSquares={canAssignPublishedOpenSquares && !conflictBlocked}
              selectedOpenSquare={selectedOpenSquare}
              assignmentLabel={assignmentLabel}
              pending={assigningOpenSquares}
              onSelectOpenSquare={setSelectedOpenSquare}
              onAssignmentLabelChange={setAssignmentLabel}
              onAssignOpenSquare={assignOpenSquare}
            />
            <CorrectionFlow
              winnerHistory={correctionHistory}
              draft={correctionDraft}
              pending={scoreSaveStatus === 'saving'}
              onDraftChange={setCorrectionDraft}
              onPublishCorrection={publishCorrection}
            />
          </>
        ) : (
          <>
            {!axesCommitted && <AssignmentWorkspace board={draftBoard} game={localGame} />}
            <ReconcileChecklist model={model} />
            {!axesCommitted && (
              <button type="button" className="oa-btn oa-btn-primary justify-self-start" disabled={hardBlocked} onClick={() => document.getElementById('slice10-draw')?.scrollIntoView()}>
                Continue to draw
              </button>
            )}
            <div id="slice10-draw"><DrawWorkspace topAxis={draftBoard.topAxis} leftAxis={draftBoard.leftAxis} preview={drawPreview} disabled={drawDisabled} onPreview={nextDraw} onRegenerate={nextDraw} onCommit={commitDraw} /></div>
            {(axesCommitted || drawPreview) && <ViewerPreviewWorkspace canPublish={!publishDisabled} onReviewPublish={() => setPublishDialogOpen(true)}>{renderPreview ? renderPreview() : <p>Private preview — sharing is off</p>}</ViewerPreviewWorkspace>}
          </>
        )}
        <button type="button" className="oa-btn justify-self-start" onClick={onLogout}>Log out</button>
      </div>
      <PublishReviewDialog open={publishDialogOpen} game={localGame} board={draftBoard} pending={publishPending} error={publishError} disabled={publishDisabled} onClose={() => setPublishDialogOpen(false)} onPublish={publish} />
    </main>
  );
}
