import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { publishedOpenSquaresAreAssignable } from '../src/features/organizer/services/game-day/publishedOpenSquares';

const drawControlSource = readFileSync(resolve(process.cwd(), 'src/features/organizer/workspace/DrawControl.tsx'), 'utf8');
const viewerShellSource = readFileSync(resolve(process.cwd(), 'src/features/viewer/shell/ViewerShell.tsx'), 'utf8');
const workspacePath = resolve(process.cwd(), 'src/features/organizer/workspace/OrganizerWorkspace.tsx');
const workspaceExists = existsSync(workspacePath);
const workspaceSource = workspaceExists ? readFileSync(workspacePath, 'utf8') : '';

describe('open-square organizer UI contract', () => {
  it('requires an inline confirmation before drawing over open squares', () => {
    expect(drawControlSource).toContain('Draw anyway?');
    expect(drawControlSource).toContain('Draw with ${openCount} OPEN');
    expect(drawControlSource).not.toContain('window.confirm');
  });

  it('persists the open-square opt-in with the committed draw', () => {
    expect(workspaceSource).toContain('allowOpenSquares: true');
  });

  it('keeps published occupied cells immutable and sends late fills through the dedicated callback', () => {
    expect(workspaceSource).toContain('onAssignOpenSquares');
  });

  it('rejects edits to published occupied cells and explains why', () => {
    expect(workspaceSource).toContain('Published assignments cannot be changed. Select OPEN squares only.');
    expect(workspaceSource).toContain('canAssignOpenSquares');
  });

  it('enables late fill only before kickoff on a published board with open inventory', () => {
    const kickoffAt = '2026-09-13T17:00:00.000Z';
    expect(publishedOpenSquaresAreAssignable({
      isPublished: true,
      openSquareCount: 6,
      kickoffAt,
      now: Date.parse('2026-09-13T16:59:59.000Z'),
    })).toBe(true);
    expect(publishedOpenSquaresAreAssignable({
      isPublished: true,
      openSquareCount: 6,
      kickoffAt,
      now: Date.parse(kickoffAt),
    })).toBe(false);
    expect(publishedOpenSquaresAreAssignable({
      isPublished: false,
      openSquareCount: 6,
      kickoffAt,
    })).toBe(false);
  });

  it('uses the persisted board flag for public OPEN rendering even when locked is false', () => {
    expect(viewerShellSource).toContain('board.allowOpenSquares === true');
    expect(viewerShellSource).toContain('showOpenSquares={board.allowOpenSquares === true}');
  });
});
