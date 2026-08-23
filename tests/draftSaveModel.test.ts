import { describe, expect, it } from 'vitest';

import {
  acknowledgeRemoteSave,
  failDraftSave,
  markDraftDirty,
  recoverDraftSave,
  resolveDraftConflict,
  startDraftSave,
  type DraftSaveState,
} from '../src/features/organizer/draft/draftSaveModel';

const clean = (revision = 1): DraftSaveState => ({ status: 'clean', revision });

describe('draft save model', () => {
  it('models the exact save states', () => {
    const states: DraftSaveState['status'][] = ['clean', 'dirty', 'saving', 'save_failed', 'conflicted', 'recovered'];
    expect(states).toEqual(['clean', 'dirty', 'saving', 'save_failed', 'conflicted', 'recovered']);
  });

  it('moves through dirty, saving, and clean only when revisions match', () => {
    const dirty = markDraftDirty(clean(3), { localRevision: 4 });
    expect(dirty).toMatchObject({ status: 'dirty', revision: 3, localRevision: 4, canPublish: false });

    const saving = startDraftSave(dirty, { expectedRevision: 3 });
    expect(saving).toMatchObject({ status: 'saving', revision: 3, canPublish: false });

    expect(acknowledgeRemoteSave(saving, { serverRevision: 4 })).toMatchObject({ status: 'clean', revision: 4, canPublish: true });
  });

  it('fails closed for malformed acknowledgements and impossible transitions', () => {
    expect(startDraftSave(clean(2), { expectedRevision: 2 })).toMatchObject({ status: 'clean', error: 'no_local_changes' });
    expect(startDraftSave(markDraftDirty(clean(2)), { expectedRevision: 1 })).toMatchObject({ status: 'conflicted' });
    expect(acknowledgeRemoteSave(clean(2), { serverRevision: 3 })).toMatchObject({ status: 'clean', error: 'not_saving' });
    expect(acknowledgeRemoteSave(startDraftSave(markDraftDirty(clean(2)), { expectedRevision: 2 }), { serverRevision: 1 })).toMatchObject({ status: 'save_failed' });
    expect(markDraftDirty({ status: 'clean', revision: Number.NaN })).toMatchObject({ status: 'save_failed', canPublish: false });
    expect(acknowledgeRemoteSave({ status: 'saving', revision: 3, localRevision: 10 }, { serverRevision: 4 })).toMatchObject({ status: 'save_failed', revision: 3, localRevision: 10, canPublish: false });
    expect(acknowledgeRemoteSave({ status: 'saving', revision: 3, localRevision: Number.NaN }, { serverRevision: 4 })).toMatchObject({ status: 'save_failed', canPublish: false, error: 'malformed_revision' });
  });

  it('keeps save_failed and conflicted non-publishable until explicit recovery', () => {
    const failed = failDraftSave(startDraftSave(markDraftDirty(clean(2)), { expectedRevision: 2 }), 'network');
    expect(failed).toMatchObject({ status: 'save_failed', canPublish: false });
    expect(recoverDraftSave(failed, { serverRevision: 3 })).toMatchObject({ status: 'recovered', revision: 3, canPublish: false });

    const conflict = resolveDraftConflict({ status: 'conflicted', revision: 2, localRevision: 3, canPublish: false }, { serverRevision: 5, keepLocal: true });
    expect(conflict).toMatchObject({ status: 'dirty', revision: 5, localRevision: 6, canPublish: false });

    const accepted = resolveDraftConflict({ status: 'conflicted', revision: 2, localRevision: 3, canPublish: false }, { serverRevision: 5, keepLocal: false });
    expect(accepted).toMatchObject({ status: 'recovered', revision: 5, canPublish: false });

    expect(recoverDraftSave({ status: 'save_failed', revision: 5, localRevision: 6 }, { serverRevision: 1 })).toMatchObject({ status: 'save_failed', revision: 5, canPublish: false, error: 'stale_server_revision' });
    expect(resolveDraftConflict({ status: 'conflicted', revision: 5, localRevision: 6 }, { serverRevision: 1, keepLocal: true })).toMatchObject({ status: 'conflicted', revision: 5, localRevision: 6, canPublish: false, error: 'stale_server_revision' });
  });
});
