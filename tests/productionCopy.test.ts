import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const liveCopyFiles = [
  'src/features/homepage/HomepageV2.tsx',
  'src/features/homepage/HomepageProofArtifact.tsx',
  'src/features/viewer/notifications/WinnerEmailDisclosure.tsx',
  'src/features/viewer/scenarios/ScenarioDisclosure.tsx',
  'src/features/viewer/personal/YourSquaresSummary.tsx',
  'src/features/organizer/shell/AssignmentWorkspace.tsx',
  'src/features/organizer/shell/DrawWorkspace.tsx',
  'src/features/organizer/shell/ViewerPreviewWorkspace.tsx',
  'src/features/organizer/shell/CorrectionFlow.tsx',
  'src/features/organizer/shell/TaskHeader.tsx',
  'src/features/organizer/shell/ProgressDisclosure.tsx',
  'src/features/organizer/shell/ReconcileChecklist.tsx',
  'src/features/organizer/shell/GameDayControls.tsx',
  'src/features/organizer/shell/OrganizerShell.tsx',
  'src/features/organizer/game-day/ManualScoringPanel.tsx',
] as const;

const corpus = liveCopyFiles
  .map((path) => readFileSync(resolve(process.cwd(), path), 'utf8'))
  .join('\n');

const internalPhrases = [
  'Optional brand story',
  'static, skippable story',
  'homepage critical path',
  'B2 organizer artifact',
  'Synthetic organizer board preview',
  'Organizer proof',
  'C1 viewer hierarchy',
  'Viewer proof',
  'GridOne product proof',
  'Proof mode',
  'Dominant artifact',
  'Assignment workspace',
  'Viewer preview workspace',
  'Draw workspace',
  'Correction flow',
  'read-only durable history',
  'Fundraiser workflow',
  'poster-board operating mess',
  'Reconcile open squares',
  'Draw axis digits',
  'Preview the viewer link',
  'Go Live for game day',
  'Canonical 2026 pricing',
  'Payout descriptions',
  'Payout notes',
  'payout descriptions',
  'Hard blockers',
  'Private advisories',
  'Conflict blocks progression',
  'No conflict',
  'Draft draw preview',
  'secure draw before commitment',
  'Winner email disclosure',
  'standard next-score outcome',
  'All next-score outcomes',
  "'Unassigned'",
  'beta convenience',
  'organizer to be authoritative',
  'settled period',
  'queues verified winner notifications',
] as const;

describe('production-facing copy', () => {
  it('does not expose internal component, design, or implementation language', () => {
    for (const phrase of internalPhrases) {
      expect(corpus, phrase).not.toContain(phrase);
    }
    expect(corpus).not.toMatch(/· rev \$\{save\.revision\}/);
  });

  it('keeps pricing, no-money, OPEN, and score-trust language exact', () => {
    expect(corpus).toContain('1 published board per account per season');
    expect(corpus).toContain('$9.99 once for up to 5 published boards in the 2026 season');
    expect(corpus).toContain('$79 per season for up to 50 published boards');
    expect(corpus).toContain('does not collect square money, hold funds, adjudicate off-platform payment, or pay winners');
    expect(corpus).toContain('OPEN');
    expect(corpus).toContain('source and freshness');
  });
});
