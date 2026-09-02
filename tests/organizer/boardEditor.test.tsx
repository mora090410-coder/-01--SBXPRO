import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BoardEditor from '../../src/features/organizer/workspace/BoardEditor';
import SquareSheet from '../../src/features/organizer/workspace/SquareSheet';
import type { BoardData, GameState } from '../../types';

const game: GameState = { title: 'T', meta: '', leftAbbr: 'KC', leftName: 'Kansas City', topAbbr: 'PHI', topName: 'Philadelphia', dates: '', lockTitle: false, lockMeta: false };
const board: BoardData = { topAxis: Array(10).fill(null), leftAxis: Array(10).fill(null), squares: Array.from({ length: 100 }, (_, i) => (i === 0 ? ['Ann'] : [])) };

describe('BoardEditor', () => {
  it('names cells accessibly and opens the selected square', () => {
    const onSelectSquare = vi.fn();
    render(<BoardEditor board={board} game={game} entryMeta={{ 0: { cell_index: 0, paid_status: 'paid', notify_opt_in: false, contact_type: null, contact_value: null } }} drawPreview={null} highlightOpen={false} isPublished={false} canAssignOpenSquares={false} onSelectSquare={onSelectSquare} />);
    fireEvent.click(screen.getByRole('button', { name: 'Square 1, assigned to Ann' }));
    expect(onSelectSquare).toHaveBeenCalledWith(0);
    expect(screen.getByRole('button', { name: 'Square 2, unassigned' })).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
  });
  it('shows draw preview digits in the axes with the draft tag', () => {
    render(<BoardEditor board={board} game={game} entryMeta={{}} drawPreview={{ top: [3,1,4,1,5,9,2,6,5,3], left: [0,1,2,3,4,5,6,7,8,9] }} highlightOpen={false} isPublished={false} canAssignOpenSquares={false} onSelectSquare={vi.fn()} />);
    expect(screen.getByText('Draft draw')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });
  it('pastes a name list into open cells', () => {
    const onPasteNames = vi.fn();
    render(<BoardEditor board={board} game={game} entryMeta={{}} drawPreview={null} highlightOpen={false} isPublished={false} canAssignOpenSquares={false} onSelectSquare={vi.fn()} onPasteNames={onPasteNames} />);
    const area = screen.getByRole('textbox', { name: 'Paste names' });
    fireEvent.change(area, { target: { value: 'Bo\n\n Cy \nDi' } });
    fireEvent.blur(area);
    expect(onPasteNames).toHaveBeenCalledWith(['Bo', 'Cy', 'Di']);
  });
  it('published: only open cells are selectable when late fill is allowed', () => {
    const onSelectSquare = vi.fn();
    render(<BoardEditor board={board} game={game} entryMeta={{}} drawPreview={null} highlightOpen={false} isPublished canAssignOpenSquares onSelectSquare={onSelectSquare} />);
    expect(screen.getByRole('button', { name: 'Square 1, assigned to Ann' })).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Square 2, unassigned' }));
    expect(onSelectSquare).toHaveBeenCalledWith(1);
  });
});

describe('SquareSheet', () => {
  it('saves name, seller, and paid status and advances on Enter', () => {
    const onSave = vi.fn();
    render(<SquareSheet open index={4} name="" isPublished={false} hasNextOpen onSave={onSave} onClose={vi.fn()} />);
    const name = screen.getByRole('textbox', { name: 'Name on the board' });
    fireEvent.change(name, { target: { value: 'Dana P.' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Sold by/ }), { target: { value: 'Coach Lee' } });
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Payment' })).getByRole('radio', { name: 'Paid' }));
    fireEvent.keyDown(name, { key: 'Enter' });
    expect(onSave).toHaveBeenCalledWith(4, 'Dana P.', expect.objectContaining({ cell_index: 4, paid_status: 'paid', seller_label: 'Coach Lee' }), true);
  });
  it('explains renames on a published board', () => {
    render(<SquareSheet open index={0} name="Ann" isPublished hasNextOpen={false} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/recorded in the board history/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save and next' })).toBeNull();
  });
});
