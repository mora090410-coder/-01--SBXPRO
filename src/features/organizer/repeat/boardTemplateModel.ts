import type { PayoutDescriptions } from '../../../../types';

export interface BoardTemplate {
  title: string;
  payoutDescriptions?: PayoutDescriptions;
}

/** Reusable setup only. Never carry a prior board's identity, people, or game state. */
export function projectBoardTemplate(source: unknown): BoardTemplate {
  const value = source && typeof source === 'object' ? source as Record<string, unknown> : {};
  const template: BoardTemplate = { title: typeof value.title === 'string' ? value.title.trim() : '' };
  const descriptions = value.payoutDescriptions;
  if (descriptions && typeof descriptions === 'object' && !Array.isArray(descriptions)) {
    const copy: PayoutDescriptions = {};
    for (const key of ['Q1', 'HALF', 'Q3', 'FINAL', 'notes'] as const) {
      const text = (descriptions as Record<string, unknown>)[key];
      if (typeof text === 'string' && text.trim()) copy[key] = text;
    }
    if (Object.keys(copy).length) template.payoutDescriptions = copy;
  }
  return template;
}
