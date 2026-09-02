import React, { useMemo, useState } from 'react';
import type { BoardData, GameState, LiveGameData, PendingMilestone, WinnerHighlights, WinnerResolution } from '../../../../types';
import { Base, CapsuleButton, Eyebrow, Glass } from '../../../design/primitives';
import ViewerBoardGrid from '../board/ViewerBoardGrid';
import ScoreInstrument from '../score/ScoreInstrument';
import ViewerIsland from './ViewerIsland';
import FindSquaresEntry from '../identity/FindSquaresEntry';
import YourSquaresSummary from '../personal/YourSquaresSummary';
import ScenarioDisclosure from '../scenarios/ScenarioDisclosure';
import WinnerEmailDisclosure from '../notifications/WinnerEmailDisclosure';
import BoardDetailsDisclosure, { FinalRecord } from '../details/BoardDetailsDisclosure';
import { playersForDigits, quarterForLive } from '../scenarios/scenarioModel';

export interface ViewerShellProps {
  game: GameState;
  board: BoardData;
  live: LiveGameData | null;
  liveStatus: string;
  isSynced: boolean;
  highlights: WinnerHighlights;
  winnerHistory: WinnerResolution[];
  pendingMilestones: PendingMilestone[];
  selectedPlayer: string;
  onClearPlayer: () => void;
  onFindSquares: () => void;
  highlightedCoords: { left: number; top: number } | null;
  onScenarioFocus: (coords: { left: number; top: number } | null) => void;
  locked?: boolean;
  shareCode?: string | null;
  servicesEnabled?: boolean;
  organizerPreview?: boolean;
  onShare?: () => void;
}

const ViewerShell: React.FC<ViewerShellProps> = ({
  game, board, live, liveStatus, isSynced, highlights, winnerHistory, pendingMilestones, selectedPlayer,
  onClearPlayer, onFindSquares, highlightedCoords, onScenarioFocus, locked = false, shareCode, servicesEnabled = true, organizerPreview = false, onShare,
}) => {
  const [boardFocus, setBoardFocus] = useState(highlightedCoords);
  const selectedParticipant = useMemo(() => {
    const matches = board.participants?.filter((participant) => participant.displayName === selectedPlayer) || [];
    return matches.length === 1 ? matches[0] : undefined;
  }, [board.participants, selectedPlayer]);
  const isFinal = live?.state === 'post';
  const isEmpty = !board.squares.some((names) => names.length > 0);
  const showNotification = Boolean(servicesEnabled && !organizerPreview && shareCode && selectedParticipant?.id);
  const yourSquares = useMemo(() => (selectedPlayer ? board.squares.filter((names) => names.includes(selectedPlayer)).length : 0), [board.squares, selectedPlayer]);
  const winsNow = useMemo(() => {
    if (!live || !selectedPlayer) return false;
    return playersForDigits(board, live.topScore % 10, live.leftScore % 10, quarterForLive(live)).includes(selectedPlayer);
  }, [board, live, selectedPlayer]);

  const setFocus = (coords: { left: number; top: number } | null) => {
    setBoardFocus(coords);
    onScenarioFocus(coords);
  };

  const MainTag: 'section' | 'main' = organizerPreview ? 'section' : 'main';

  return (
    <Base kind="dark">
      <ViewerIsland game={game} board={board} live={live} liveStatus={liveStatus} isSynced={isSynced} selectedPlayer={selectedPlayer} yourSquares={yourSquares} winsNow={winsNow} />
      <MainTag
        className={`mx-auto grid w-full max-w-6xl gap-10 px-4 ${live ? 'pt-20' : 'pt-6'} pb-16 md:px-6 lg:grid-cols-[minmax(320px,440px)_1fr]`}
        aria-label={`${game.title || 'GridOne board'} viewer`}
      >
        <div data-testid="viewer-first-viewport" className="flex min-w-0 flex-col gap-8">
          <ScoreInstrument game={game} board={board} live={live} liveStatus={liveStatus} isSynced={isSynced} />
          <FindSquaresEntry selectedPlayer={selectedPlayer} onFindSquares={onFindSquares} onClearPlayer={onClearPlayer} />
          <YourSquaresSummary board={board} game={game} live={live} selectedPlayer={selectedPlayer} onViewSquare={setFocus} />
          {pendingMilestones.length > 0 && servicesEnabled && (
            <Glass as="section" padding="md" className="flex flex-col gap-2" aria-labelledby="pending-results-title">
              <h2 id="pending-results-title" className="font-ui text-[15px] font-medium text-fg">Pending confirmation</h2>
              <ul className="flex flex-col gap-1 font-mono tabular-nums text-[14px] text-fg-2">
                {pendingMilestones.map((pending) => (
                  <li key={pending.milestone}>{pending.milestone} · {pending.topScore}-{pending.sideScore} · digits {pending.topDigit}/{pending.sideDigit}</li>
                ))}
              </ul>
            </Glass>
          )}
          {isFinal && <FinalRecord winnerHistory={winnerHistory} game={game} />}
          <ScenarioDisclosure board={board} game={game} live={live} selectedPlayer={selectedPlayer} servicesEnabled={servicesEnabled} onScenarioFocus={setFocus} />
          <WinnerEmailDisclosure shareCode={shareCode} participantId={selectedParticipant?.id} displayName={selectedPlayer} enabled={showNotification} />
        </div>

        <section className="flex min-w-0 flex-col gap-4" aria-labelledby="viewer-board-title" data-board-locked={locked}>
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Eyebrow>Published board</Eyebrow>
              <h2 id="viewer-board-title" className="font-display text-[26px] leading-[1.1] text-fg">Board</h2>
            </div>
            <div className="flex items-center gap-2">
              {onShare ? <CapsuleButton variant="quiet" onClick={onShare}>Share</CapsuleButton> : null}
              <CapsuleButton variant="quiet" onClick={onFindSquares}>Find</CapsuleButton>
            </div>
          </div>
          {isEmpty && !organizerPreview ? (
            <Glass padding="lg" className="text-center font-ui text-[15px] text-fg-2">This board has no assignments yet.</Glass>
          ) : (
            <ViewerBoardGrid board={board} game={game} highlights={highlights} winnerHistory={winnerHistory} pendingMilestones={pendingMilestones} live={live} selectedPlayer={selectedPlayer} highlightedCoords={boardFocus} showOpenSquares={board.allowOpenSquares === true} />
          )}
          <BoardDetailsDisclosure game={game} board={board} winnerHistory={winnerHistory} final={false} />
        </section>
      </MainTag>
    </Base>
  );
};

export default ViewerShell;
