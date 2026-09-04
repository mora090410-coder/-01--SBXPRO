import React from 'react';
import { Base } from '../../../design/primitives';
import BoardEditor from '../../organizer/workspace/BoardEditor';
import OrganizerIsland from '../../organizer/workspace/OrganizerIsland';
import { demoGame } from '../demoData';
import { ORGANIZER_FILLED, ORGANIZER_PAID, organizerDemoBoard, organizerDemoEntryMeta } from './organizerDemoData';

const noop = () => {};
const EMPTY_SELECTION: ReadonlySet<number> = new Set<number>();

/** The real board editor and status island with a half-sold demo board, on the cream base they live on. */
export default function OrganizerPreviewInner() {
  return (
    <Base kind="cream">
      <OrganizerIsland
        filled={ORGANIZER_FILLED}
        paid={ORGANIZER_PAID}
        drawn={false}
        phase="Fill"
        growOnEnter
        primary={{ label: 'Draw numbers', onClick: noop, disabled: true }}
      />
      <div className="px-4 pt-20 pb-4">
        <BoardEditor
          board={organizerDemoBoard}
          game={demoGame}
          entryMeta={organizerDemoEntryMeta}
          drawPreview={null}
          highlightOpen={false}
          isPublished={false}
          canAssignOpenSquares={false}
          selectMode={false}
          selection={EMPTY_SELECTION}
          onSelectionChange={noop}
          onToggleSelectMode={noop}
          onSelectSquare={noop}
        />
      </div>
    </Base>
  );
}
