import React, { useState } from 'react';
import { Eyebrow, CapsuleButton, Sheet } from '../../../design/primitives';
import type { DraftSaveState } from '../draft/draftSaveModel';
import type { ScheduledGame, GameState } from '../../../../types';
import ScheduledGamePicker from '../../../../components/ScheduledGamePicker';

export interface WorkspaceHeaderProps {
  game: GameState;
  saveState: DraftSaveState;
  isPublished: boolean;
  onTitleChange: (title: string) => void;
  onGameChange?: (game: ScheduledGame) => void;
  onRetry: () => void;
  onReload: () => void;
  onLogout: () => void;
}

function formatKickoff(game: GameState): string {
  if (game.kickoffAt) {
    const parsed = new Date(game.kickoffAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }
  return game.dates || 'Kickoff not set';
}

function SavePill({ saveState, onRetry, onReload }: { saveState: DraftSaveState; onRetry: () => void; onReload: () => void }) {
  switch (saveState.status) {
    case 'conflicted':
      return (
        <div role="alert" className="flex items-center gap-2 font-mono text-[12px] text-tone-cardinal">
          <span>This board changed in another session.</span>
          <CapsuleButton variant="quiet" size="md" className="h-8 px-3 text-[12px]" onClick={onReload}>Reload latest board</CapsuleButton>
        </div>
      );
    case 'save_failed':
      return (
        <div role="status" className="flex items-center gap-2 font-mono text-[12px] text-tone-cardinal">
          <span>Save failed</span>
          <CapsuleButton variant="quiet" size="md" className="h-8 px-3 text-[12px]" onClick={onRetry}>Retry</CapsuleButton>
        </div>
      );
    case 'saving':
      return <div role="status" className="font-mono text-[12px] text-fg-3">Saving…</div>;
    case 'dirty':
      return <div role="status" className="font-mono text-[12px] text-fg-3">Unsaved changes</div>;
    case 'clean':
    case 'recovered':
    default:
      return <div role="status" className="font-mono text-[12px] text-fg-3">Saved</div>;
  }
}

export default function WorkspaceHeader({
  game,
  saveState,
  isPublished,
  onTitleChange,
  onGameChange,
  onRetry,
  onReload,
  onLogout,
}: WorkspaceHeaderProps) {
  const [title, setTitle] = useState(game.title);
  const [pickerOpen, setPickerOpen] = useState(false);

  const commitTitle = () => {
    const trimmed = title.trim();
    if (isPublished) return;
    if (trimmed !== game.title) {
      onTitleChange(trimmed);
    }
  };

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Eyebrow>{isPublished ? 'Published board' : 'Organizer'}</Eyebrow>
          <input
            aria-label="Board name"
            className="font-display text-[34px] md:text-[44px] leading-[1.05] bg-transparent border-0 p-0 w-full text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-action rounded-control"
            value={title}
            readOnly={isPublished}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitTitle();
              }
            }}
          />
          <div className="flex items-center gap-3 mt-1">
            <p className="font-ui text-[15px] text-fg-2">
              {game.leftAbbr} at {game.topAbbr} · {formatKickoff(game)}
            </p>
            {!isPublished && (
              <CapsuleButton variant="ghost" size="md" className="h-8 px-2 text-[13px]" onClick={() => setPickerOpen(true)}>
                Change game
              </CapsuleButton>
            )}
          </div>
        </div>
        <CapsuleButton variant="ghost" size="md" onClick={onLogout}>Log out</CapsuleButton>
      </div>
      <SavePill saveState={saveState} onRetry={onRetry} onReload={onReload} />
      {!isPublished && (
        <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Pick the game">
          <ScheduledGamePicker
            value={game.gameExternalId ?? null}
            onChange={(picked) => {
              onGameChange?.(picked);
              setPickerOpen(false);
            }}
          />
        </Sheet>
      )}
    </header>
  );
}
