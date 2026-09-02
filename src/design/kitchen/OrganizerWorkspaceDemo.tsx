import React, { useMemo, useState } from 'react';
import { Glass } from '../primitives';
import OrganizerWorkspace from '../../features/organizer/workspace/OrganizerWorkspace';
import type { BoardData, EntryMeta, GameState, PayoutDescriptions } from '../../../types';

const NAME_ROTATION = ['J. Rivera', 'M. Chen', 'Dana P.', 'S. Okafor', 'Lena K.', 'R. Patel', 'Chris B.', 'A. Nguyen'];
const FILLED_COUNT = 40;

const nextSunday1pm = () => {
  const now = new Date();
  const result = new Date(now);
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  result.setDate(now.getDate() + daysUntilSunday);
  result.setHours(13, 0, 0, 0);
  return result.toISOString();
};

const initialGame: GameState = {
  title: 'Lincoln Softball Booster Board',
  meta: '',
  leftAbbr: 'KC',
  leftName: 'Kansas City Chiefs',
  topAbbr: 'PHI',
  topName: 'Philadelphia Eagles',
  gameExternalId: 'demo',
  kickoffAt: nextSunday1pm(),
  dates: '',
  lockTitle: false,
  lockMeta: false,
  payoutDescriptions: {},
};

const initialBoard = (): BoardData => ({
  topAxis: Array(10).fill(null),
  leftAxis: Array(10).fill(null),
  squares: Array.from({ length: 100 }, (_, index) => (
    index < FILLED_COUNT ? [NAME_ROTATION[index % NAME_ROTATION.length]] : []
  )),
});

const initialEntryMeta = (): Record<number, EntryMeta> => ({
  0: { cell_index: 0, paid_status: 'paid', notify_opt_in: false, contact_type: null, contact_value: null, seller_label: 'Coach Rivera' },
  3: { cell_index: 3, paid_status: 'paid', notify_opt_in: false, contact_type: null, contact_value: null, seller_label: 'Coach Rivera' },
  7: { cell_index: 7, paid_status: 'paid', notify_opt_in: false, contact_type: null, contact_value: null, seller_label: null },
});

/**
 * Dev-only demo of OrganizerWorkspace with in-memory state and no network.
 * `saveEntryMeta` inside the workspace still calls Supabase directly (there
 * is no injection seam for it), so an entry-meta change in this demo will
 * fire a real Supabase request against `activePoolId: 'demo-pool'` and fail;
 * the workspace surfaces that failure as an inline message rather than
 * throwing. Publishing similarly POSTs to `/api/pools/demo-pool/publish`,
 * which has no functions server in dev and will fail the same way.
 */
export default function OrganizerWorkspaceDemo() {
  const [game, setGame] = useState(initialGame);
  const [board, setBoard] = useState(initialBoard);
  const [entryMeta, setEntryMeta] = useState(initialEntryMeta);
  const [revision, setRevision] = useState(1);

  const billing = useMemo(() => ({ tier: 'free', used: 0, allowance: 1 }), []);

  return (
    <OrganizerWorkspace
      game={game}
      board={board}
      activePoolId="demo-pool"
      revision={revision}
      entryMeta={entryMeta}
      isPublished={false}
      isActivated={false}
      shareCode={null}
      liveData={null}
      winnerHistory={[]}
      notificationDeliveryIssues={[]}
      onApply={(nextGame, nextBoard) => {
        setGame(nextGame);
        setBoard(nextBoard);
      }}
      onPublish={async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setRevision((current) => current + 1);
      }}
      onSavePayoutDescriptions={async (descriptions: PayoutDescriptions) => descriptions}
      onAssignOpenSquares={async () => {}}
      onReload={async () => {}}
      onLogout={() => {}}
      onEntryMetaChange={(meta) => {
        setEntryMeta((current) => ({ ...current, [meta.cell_index]: meta }));
      }}
      onCheckout={async () => {}}
      billing={billing}
      renderPreview={() => (
        <Glass>Preview renders the real viewer once wired in BoardView.</Glass>
      )}
    />
  );
}
