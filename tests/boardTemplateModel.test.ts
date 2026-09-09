import { describe, expect, it } from 'vitest';
import { projectBoardTemplate } from '../src/features/organizer/repeat/boardTemplateModel';

describe('repeat-board setup projection', () => {
  it('copies only reusable title and rules from a completed board', () => {
    const source = {
      title: '  Lincoln Baseball  ', gameExternalId: 'old-game', kickoffAt: 'old-date',
      organizationDisplayName: 'Old organization', scoreSnapshot: { leftScore: 20 },
      payoutDescriptions: { Q1: '$100', notes: 'Final includes overtime', secret: 'private' },
      board: { squares: [['Bill W']], allocationLabels: ['Mora'], leftAxis: [1] },
      id: 'old-id', shareCode: 'old-link', paid_status: 'paid', familyAccess: 'secret',
    };
    const original = JSON.stringify(source);

    const template = projectBoardTemplate(source);

    expect(template).toEqual({ title: 'Lincoln Baseball', payoutDescriptions: { Q1: '$100', notes: 'Final includes overtime' } });
    expect(JSON.stringify(source)).toBe(original);
    expect(template.payoutDescriptions).not.toBe(source.payoutDescriptions);
  });

  it('accepts missing legacy setup without copying malformed fields', () => {
    expect(projectBoardTemplate(null)).toEqual({ title: '' });
    expect(projectBoardTemplate({ title: 4, payoutDescriptions: { Q1: 20, FINAL: null } })).toEqual({ title: '' });
    expect(projectBoardTemplate({ title: 'Next', payoutDescriptions: ['private'] })).toEqual({ title: 'Next' });
  });
});
