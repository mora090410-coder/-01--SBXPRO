import React, { useMemo, useState } from 'react';
import { BoardData } from '../../types';
import { distinctAssignedNames, matchPlayerNames } from '../../utils/playerNameMatching';
import { CapsuleButton, CapsuleInput, Eyebrow, Sheet } from '../../src/design/primitives';

interface FindSquaresModalProps {
    board: BoardData;
    selectedPlayer: string;
    onSelectPlayer: (player: string) => void;
    onClose: () => void;
}

const rowClass = 'w-full min-h-11 px-3 text-left font-ui text-[16px] text-fg rounded-control hover:bg-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action';

const FindSquaresModal: React.FC<FindSquaresModalProps> = ({ board, selectedPlayer, onSelectPlayer, onClose }) => {
    const [query, setQuery] = useState('');

    const assignedNames = useMemo(() => distinctAssignedNames(board.squares), [board.squares]);
    const result = useMemo(() => matchPlayerNames(query, assignedNames), [assignedNames, query]);
    const hasQuery = query.trim().length > 0;
    const showBrowseList = !hasQuery || result.tier === 'none';

    const selectPlayer = (player: string) => {
        onSelectPlayer(player);
        onClose();
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (result.autoSelect) selectPlayer(result.autoSelect);
    };

    return (
        <div data-base="dark">
            <Sheet open onClose={onClose} title="Find my squares">
                <form onSubmit={submit} className="flex items-end gap-2">
                    <CapsuleInput
                        id="viewer-player-search"
                        label="Name used on board"
                        hideLabel
                        type="search"
                        autoComplete="off"
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Type your name"
                        className="flex-1"
                        trailing={<CapsuleButton type="submit" disabled={!result.autoSelect}>Find</CapsuleButton>}
                    />
                </form>

                <div className="mt-5 flex flex-col gap-2" aria-live="polite">
                    {!assignedNames.length ? (
                        <p className="font-ui text-[15px] text-fg-3">No names have been assigned on this board yet.</p>
                    ) : showBrowseList ? (
                        <>
                            <Eyebrow>{hasQuery ? 'No close match. Browse every name' : 'Browse every name'}</Eyebrow>
                            <div className="max-h-[50dvh] overflow-y-auto flex flex-col" data-testid="browse-name-list">
                                {assignedNames.map((name) => (
                                    <button type="button" key={name} onClick={() => selectPlayer(name)} className={rowClass}>{name}</button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <Eyebrow>{result.tier === 'exact' ? 'Choose the organizer-entered name' : 'Did you mean…'}</Eyebrow>
                            <div className="flex flex-col" data-testid="name-suggestions">
                                {result.candidates.map((name) => (
                                    <button type="button" key={name} onClick={() => selectPlayer(name)} className={rowClass}>{name}</button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {selectedPlayer && (
                    <CapsuleButton variant="ghost" className="mt-4 w-full" onClick={() => { onSelectPlayer(''); onClose(); }}>Clear selection</CapsuleButton>
                )}
            </Sheet>
        </div>
    );
};

export default FindSquaresModal;
