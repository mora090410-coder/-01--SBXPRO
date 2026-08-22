import React from 'react';
import type { DraftSaveState } from '../draft/draftSaveModel';
import type { OrganizerLifecyclePhase } from '../lifecycle/organizerLifecycle';
import type { GameState } from '../../../types';

const saveLabel = (save: DraftSaveState) => {
  if (save.status === 'clean') return `Saved · rev ${save.revision}`;
  if (save.status === 'saving') return `Saving · rev ${save.revision}`;
  if (save.status === 'dirty') return `Unsaved · rev ${save.revision}`;
  if (save.status === 'conflicted') return `Conflict · rev ${save.revision}`;
  if (save.status === 'save_failed') return `Save failed · rev ${save.revision}`;
  return `Recovered · rev ${save.revision}`;
};

export default function TaskHeader({ game, phase, saveState, isPublished }: { game: GameState; phase: OrganizerLifecyclePhase; saveState: DraftSaveState; isPublished: boolean }) {
  return (
    <header role="banner" aria-label="Organizer task header" className="sticky top-0 z-[85] border-b border-ink bg-broadcast-white px-4 py-3 text-ink">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cardinal">{isPublished ? 'Published board' : 'Organizer'}</p>
          <h1 className="truncate text-xl font-semibold">{game.title || 'Untitled board'}</h1>
          <p className="text-sm text-ink/70">{game.leftAbbr} at {game.topAbbr} · {game.kickoffAt || game.dates || 'Kickoff not set'}</p>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <div><dt className="text-ink/50">Phase</dt><dd className="font-semibold">{phase}</dd></div>
          <div><dt className="text-ink/50">Save</dt><dd className="font-semibold">{saveLabel(saveState)}</dd></div>
          <div><dt className="text-ink/50">Time</dt><dd className="font-semibold">{new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</dd></div>
          <div><dt className="text-ink/50">Conflict</dt><dd className="font-semibold">{saveState.status === 'conflicted' ? 'Conflict blocks progression' : 'No conflict'}</dd></div>
        </dl>
      </div>
    </header>
  );
}
