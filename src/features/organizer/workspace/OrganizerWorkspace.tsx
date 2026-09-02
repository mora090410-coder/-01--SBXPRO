import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Base, Eyebrow, Glass } from '../../../design/primitives';
import type { BoardData, EntryMeta, GameState, PayoutDescriptions, ScheduledGame } from '../../../../types';
import type { OrganizerShellProps } from '../shell/OrganizerShell';
import { evaluateOrganizerLifecycle } from '../lifecycle/organizerLifecycle';
import { compressImage } from '../../../../utils/image';
import { parseBoardImage } from '../../../../services/boardImportService';
import { renderBoardPng, shareBoardPng, boardImageFilename } from '../../../../utils/boardImage';
import { useWorkspaceDraft } from './useWorkspaceDraft';
import { saveEntryMeta, clearEntryMeta } from './entryMetaService';
import { secureShuffleDigits } from './secureDraw';
import { publishBoard, type PublishResult } from './publishBoard';
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

export interface OrganizerWorkspaceProps extends OrganizerShellProps {
  /** Server revision from usePoolData; drives the autosave conflict check. */
  revision: number;
  entryMeta: Record<number, EntryMeta>;
  onEntryMetaChange: (meta: EntryMeta) => void;
  onScheduledGameChange?: (game: ScheduledGame) => void;
  billing?: { tier: string; used: number; allowance: number } | null;
  onCheckout?: (tier: 'gameday' | 'org', organizationName?: string) => Promise<void>;
}

type PublishedBoard = Extract<PublishResult, { published: true }>;

const PUBLISH_BLOCKED = 'Publish blocked. Reload or save the latest clean draft before publishing.';
const GAME_DAY_PLACEHOLDER = 'Game-day controls arrive in stage 5b.';

const exactAxis = (axis: (number | null)[]) => axis.length === 10
  && new Set(axis).size === 10
  && axis.every((digit) => Number.isInteger(digit));

const openCountOf = (board: BoardData) => board.squares.filter((names) => !names.length).length;

const blockerNote: Record<string, string> = {
  missing_owner: 'The board owner could not be verified. Reload and try again.',
  missing_board_identity: 'Add a board name before publishing.',
  missing_scheduled_game: 'Choose the scheduled game before publishing.',
  invalid_board_shape: 'This board could not be checked. Reload and try again.',
  duplicate_or_ambiguous_public_identity: 'Make each name unique so families can find the right squares.',
  open_square_acknowledgement_required: 'Confirm that the remaining open squares should stay open.',
  invalid_committed_axes: 'Draw one complete set of numbers before publishing.',
  dynamic_axes_not_supported: 'This older board uses changing number sets and cannot be published in this version.',
  save_dirty: 'Save the latest changes before publishing.',
  save_saving: 'Wait for the board to finish saving.',
  save_save_failed: 'The latest changes did not save. Reload or try again.',
  save_conflicted: 'This board changed in another session. Reload the latest version.',
  save_recovered: 'Review and save the recovered draft before publishing.',
};

/** Lifecycle cells carry the real private notes so the checklist can speak to payment and seller gaps. */
const lifecycleCells = (board: BoardData, entryMeta: Record<number, EntryMeta>) => board.squares.map((names, index) => {
  const label = names[0]?.trim();
  if (!label) return null;
  const participant = board.participants?.find((item) => item.displayName === label || item.publicLabel === label);
  const meta = entryMeta[index];
  return {
    publicLabel: label,
    participantId: participant?.id,
    paidStatus: meta?.paid_status ?? 'unknown',
    sellerLabel: meta?.seller_label ?? undefined,
  };
});

/**
 * The organizer workspace for a board that has not been published yet.
 * Composes the status island, the board editor, and the publish sheets over
 * `useWorkspaceDraft`'s autosaving draft. Published boards render only the
 * header plus a placeholder until stage 5b brings the game-day side.
 */
export default function OrganizerWorkspace({
  game: gameProp,
  board: boardProp,
  activePoolId,
  revision,
  entryMeta,
  onEntryMetaChange,
  onScheduledGameChange,
  billing,
  onCheckout,
  onApply,
  onPublish,
  onSavePayoutDescriptions,
  onAssignOpenSquares,
  onReload,
  onOpenViewer,
  onLogout,
  isPublished,
  shareCode,
  renderPreview,
}: OrganizerWorkspaceProps) {
  // `onAssignOpenSquares` stays on the props so BoardView can keep one call
  // site; stage 5b's game-day surface is what actually routes late fills.
  void onAssignOpenSquares;
  void shareCode;

  const { game, board, setGame, setBoard, saveState, flush, retry, reloadLatest } = useWorkspaceDraft({
    game: gameProp,
    board: boardProp,
    revision,
    isPublished,
    onSave: (data) => onPublish(data),
    onApply,
    onReload,
  });

  // Mirrors the committed save state so async handlers see the value after an
  // awaited flush instead of the one captured when the click started.
  const saveStateRef = useRef(saveState);
  saveStateRef.current = saveState;

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

  const openCount = openCountOf(board);
  const assignedCount = 100 - openCount;
  const paidCount = board.squares.reduce(
    (total, names, index) => (names.length && entryMeta[index]?.paid_status === 'paid' ? total + 1 : total),
    0,
  );
  const unpaidCount = assignedCount - paidCount;
  const axesCommitted = exactAxis(board.topAxis) && exactAxis(board.leftAxis);
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
      // The open-square opt-in is asked for inline by DrawControl right before
      // the draw, so it is never a gate on entering the draw itself.
      openSquaresAcknowledged: true,
      publishedAt: isPublished ? 'server-published' : null,
    },
    save: saveState,
  }), [activePoolId, board, entryMeta, game, isPublished, saveState]);

  const shareUrl = published ? `${window.location.origin}${published.viewerUrl}` : '';

  const startPreview = useCallback(() => {
    setDrawPreview({ top: secureShuffleDigits(), left: secureShuffleDigits() });
  }, []);

  const requestDraw = () => {
    setDrawRequested(true);
    setNote(null);
    if (openCount > 0 && board.allowOpenSquares !== true) return;
    startPreview();
  };

  const acknowledgeOpenSquares = () => {
    setBoard((current) => ({ ...current, allowOpenSquares: true }));
    startPreview();
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
      leftAxisByQuarter: undefined,
      topAxisByQuarter: undefined,
    }));
    setDrawPreview(null);
    setDrawRequested(false);
  };

  const replaceDraw = () => {
    setDrawRequested(true);
    startPreview();
  };

  const nextOpenAfter = (squares: string[][], index: number) => {
    for (let cursor = index + 1; cursor < squares.length; cursor += 1) {
      if (!squares[cursor]?.length) return cursor;
    }
    for (let cursor = 0; cursor < index; cursor += 1) {
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
    } catch (error: any) {
      setNote(error?.message || 'The private note could not be saved.');
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
    } catch (error: any) {
      setNote(error?.message || 'The private notes could not be cleared.');
    }
  };

  const importPhoto = async (file: File) => {
    setImporting(true);
    setNote(null);
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
      setNote(error?.message || 'The photo could not be read.');
    } finally {
      setImporting(false);
    }
  };

  const exportBoard = async (mode: 'owners' | 'sellers') => {
    setExporting(true);
    setNote(null);
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
      setNote(error?.message || 'The board image could not be created.');
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
    } catch (error: any) {
      setPayoutStatus('error');
      setNote(error?.message || 'Prize notes could not be saved.');
    }
  };

  const openPreview = async () => {
    setPublishError(null);
    await flush();
    setPreviewOpen(true);
  };

  const publish = async () => {
    if (!activePoolId) return;
    setPublishError(null);
    setPublishPending(true);
    try {
      await flush();
      if (saveStateRef.current.status !== 'clean') {
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
      await onReload?.();
    } catch (error: any) {
      setPublishError(error?.message || 'The board could not be published.');
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
        : { label: 'Draw numbers', onClick: requestDraw, disabled: !model.canEnterDraw || conflicted };

  const secondary = axesCommitted && !published && !isPublished
    ? [{ label: 'Replace draft draw', onClick: replaceDraw, disabled: conflicted }]
    : undefined;

  const header = (
    <WorkspaceHeader
      game={game}
      saveState={saveState}
      isPublished={isPublished}
      onTitleChange={(title) => setGame((current) => ({ ...current, title }))}
      onGameChange={onScheduledGameChange}
      onRetry={() => void retry()}
      onReload={() => void reloadLatest()}
      onLogout={onLogout}
    />
  );

  if (isPublished) {
    return (
      <Base kind="cream">
        <main aria-label={`${game.title} workspace`} className="mx-auto max-w-7xl px-4 pt-6 pb-24 lg:pt-8">
          {header}
          <section aria-label="Game day" className="mt-8">
            <Glass padding="lg" className="flex flex-col gap-2">
              <Eyebrow>Game day</Eyebrow>
              <p className="font-ui text-[15px] text-fg-2">{GAME_DAY_PLACEHOLDER}</p>
            </Glass>
          </section>
        </main>
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
      <main aria-label={`${game.title} workspace`} className="mx-auto max-w-7xl px-4 pt-6 pb-24 lg:pt-8">
        {header}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section id="workspace-board" aria-label="Board" className="flex flex-col gap-4">
            {(drawRequested || drawPreview || axesCommitted) && (
              <DrawControl
                openCount={openCount}
                acknowledged={board.allowOpenSquares === true}
                drawn={axesCommitted}
                preview={Boolean(drawPreview)}
                disabled={conflicted}
                onAcknowledge={acknowledgeOpenSquares}
                onKeepAssigning={cancelDraw}
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

      <SquareSheet
        open={selectedSquare !== null}
        index={selectedSquare}
        name={selectedSquare === null ? '' : board.squares[selectedSquare]?.[0] ?? ''}
        meta={selectedSquare === null ? undefined : entryMeta[selectedSquare]}
        isPublished={false}
        hasNextOpen={openCount > 0}
        onSave={(index, name, meta, advance) => void saveSquare(index, name, meta, advance)}
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
        error={publishError}
        disabled={!axesCommitted || conflicted}
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
        onClose={() => setPublishedOpen(false)}
        onOpenViewer={() => onOpenViewer?.()}
        onEnterGameDay={() => setPublishedOpen(false)}
      />
    </Base>
  );
}
