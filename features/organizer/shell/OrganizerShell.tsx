import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { BoardData, GameState, LiveGameData, NotificationDeliveryIssue, PayoutDescriptions, WinnerResolution } from '../../../types';
import { secureShuffleDigits } from '../../../components/AdminPanel';
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
  onSavePayoutDescriptions: _onSavePayoutDescriptions,
  onAssignOpenSquares: _onAssignOpenSquares,
  onReload,
  onOpenViewer,
  onLogout,
  isActivated: _isActivated,
  isPublished,
  shareCode,
  renderPreview,
  saveState = { status: 'clean', revision: 0 },
}: OrganizerShellProps) {
  const [draftBoard, setDraftBoard] = useState(board);
  const [drawPreview, setDrawPreview] = useState<{ top: number[]; left: number[] } | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishPending, setPublishPending] = useState(false);
  const lastSyncedRevision = useRef<number | null>(saveState.revision);
  const lastBoardProp = useRef(board);

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
      title: game.title,
      scheduledGame: game.gameExternalId && game.kickoffAt ? { id: game.gameExternalId, kickoffAt: game.kickoffAt } : null,
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
  }), [activePoolId, draftBoard, game, isPublished, liveData?.state, saveState, winnerHistory]);

  const conflictBlocked = saveState.status === 'conflicted';
  const hardBlocked = model.hardBlockers.length > 0;
  const axesCommitted = exactAxis(draftBoard.topAxis) && exactAxis(draftBoard.leftAxis);
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
    onApply(game, nextBoard);
  };
  const publish = async () => {
    setPublishMessage(null);
    setPublishError(null);
    const latestModel = evaluateOrganizerLifecycle({
      board: {
        id: activePoolId || '',
        ownerId: activePoolId ? 'server-owner-known' : '',
        title: game.title,
        scheduledGame: game.gameExternalId && game.kickoffAt ? { id: game.gameExternalId, kickoffAt: game.kickoffAt } : null,
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
      const result = await onPublish({ game, board: draftBoard });
      setPublishMessage(result ? `Published: ${result}` : 'Published.');
      setPublishDialogOpen(false);
    } catch (error: any) {
      setPublishError(error.message || 'Publish failed.');
    } finally {
      setPublishPending(false);
    }
  };

  return (
    <main data-feature-flag="organizer_v2" data-variant="organizer_v2:on" className="min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-broadcast-white text-ink">
      <TaskHeader game={game} phase={model.phase} saveState={saveState} isPublished={isPublished} />
      <ProgressDisclosure phase={model.phase} />
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5">
        {publishMessage && <p role="status" className="border border-newsprint p-3">{publishMessage}</p>}
        {publishError && <p role="alert" className="border border-cardinal p-3 text-cardinal">{publishError}</p>}
        {conflictBlocked && onReload && <button type="button" className="oa-btn oa-btn-primary justify-self-start" onClick={() => void onReload()}>Reload latest board</button>}
        {isPublished ? (
          <>
            <GameDayControls liveData={liveData} shareCode={shareCode} issues={notificationDeliveryIssues} onOpenViewer={onOpenViewer} />
            <CorrectionFlow winnerHistory={winnerHistory} />
          </>
        ) : (
          <>
            {!axesCommitted && <AssignmentWorkspace board={draftBoard} game={game} />}
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
      <PublishReviewDialog open={publishDialogOpen} game={game} board={draftBoard} pending={publishPending} error={publishError} disabled={publishDisabled} onClose={() => setPublishDialogOpen(false)} onPublish={publish} />
    </main>
  );
}
