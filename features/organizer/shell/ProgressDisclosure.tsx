import React from 'react';
import type { OrganizerLifecyclePhase } from '../lifecycle/organizerLifecycle';
const phases: OrganizerLifecyclePhase[] = ['Create Draft','Fill','Reconcile','Draw','Preview','Go Live','Game Day','Final Record'];
export default function ProgressDisclosure({ phase }: { phase: OrganizerLifecyclePhase }) {
  return <details data-testid="organizer-progress-disclosure" className="border-b border-newsprint bg-broadcast-white px-4 py-3 text-ink"><summary className="min-h-11 cursor-pointer font-semibold">Progress: {phase}</summary><ol className="mt-3 grid gap-2">{phases.map((item) => <li key={item} aria-current={item === phase ? 'step' : undefined}>{item}</li>)}</ol></details>;
}
