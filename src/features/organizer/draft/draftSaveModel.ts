export type DraftSaveStatus = 'clean' | 'dirty' | 'saving' | 'save_failed' | 'conflicted' | 'recovered';

export interface DraftSaveState {
  status: DraftSaveStatus;
  revision: number;
  localRevision?: number;
  error?: string;
  canPublish?: boolean;
}

const isFiniteRevision = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;

const hasValidStateRevisions = (state: DraftSaveState) => isFiniteRevision(state.revision)
  && (state.localRevision === undefined || isFiniteRevision(state.localRevision));

const withPublishGate = (state: DraftSaveState): DraftSaveState => ({
  ...state,
  canPublish: state.status === 'clean',
});

const malformed = (state: DraftSaveState, error = 'malformed_revision'): DraftSaveState => withPublishGate({
  status: 'save_failed',
  revision: isFiniteRevision(state.revision) ? state.revision : 0,
  localRevision: isFiniteRevision(state.localRevision) ? state.localRevision : undefined,
  error,
});

const minimumRequiredRevision = (state: DraftSaveState) => Math.max(state.revision, state.localRevision ?? state.revision);

const staleRevision = (state: DraftSaveState): DraftSaveState => withPublishGate({
  ...state,
  error: 'stale_server_revision',
});

export const markDraftDirty = (
  state: DraftSaveState,
  options: { localRevision?: number } = {},
): DraftSaveState => {
  if (!hasValidStateRevisions(state)) return malformed(state);
  const localRevision = options.localRevision ?? Math.max(state.localRevision ?? state.revision, state.revision) + 1;
  if (!isFiniteRevision(localRevision) || localRevision <= state.revision) {
    return malformed(state, 'invalid_local_revision');
  }
  return withPublishGate({
    status: 'dirty',
    revision: state.revision,
    localRevision,
  });
};

export const startDraftSave = (
  state: DraftSaveState,
  options: { expectedRevision: number },
): DraftSaveState => {
  if (!hasValidStateRevisions(state) || !isFiniteRevision(options.expectedRevision)) return malformed(state);
  if (state.status !== 'dirty') return withPublishGate({ ...state, error: 'no_local_changes' });
  if (options.expectedRevision !== state.revision) {
    return withPublishGate({
      status: 'conflicted',
      revision: state.revision,
      localRevision: state.localRevision,
      error: 'revision_mismatch',
    });
  }
  return withPublishGate({
    status: 'saving',
    revision: state.revision,
    localRevision: state.localRevision,
  });
};

export const acknowledgeRemoteSave = (
  state: DraftSaveState,
  options: { serverRevision: number },
): DraftSaveState => {
  if (!hasValidStateRevisions(state) || !isFiniteRevision(options.serverRevision)) return malformed(state);
  if (state.status !== 'saving') return withPublishGate({ ...state, error: 'not_saving' });
  if (options.serverRevision < minimumRequiredRevision(state)) {
    return withPublishGate({
      status: 'save_failed',
      revision: state.revision,
      localRevision: state.localRevision,
      error: 'stale_server_revision',
    });
  }
  return withPublishGate({
    status: 'clean',
    revision: options.serverRevision,
  });
};

export const failDraftSave = (state: DraftSaveState, error = 'save_failed'): DraftSaveState => {
  if (!hasValidStateRevisions(state)) return malformed(state);
  if (state.status !== 'saving') return withPublishGate({ ...state, error: 'not_saving' });
  return withPublishGate({
    status: 'save_failed',
    revision: state.revision,
    localRevision: state.localRevision,
    error,
  });
};

export const recoverDraftSave = (
  state: DraftSaveState,
  options: { serverRevision: number },
): DraftSaveState => {
  if (!hasValidStateRevisions(state) || !isFiniteRevision(options.serverRevision)) return malformed(state);
  if (state.status !== 'save_failed' && state.status !== 'conflicted') {
    return withPublishGate({ ...state, error: 'not_recoverable' });
  }
  if (options.serverRevision < minimumRequiredRevision(state)) return staleRevision(state);
  return withPublishGate({
    status: 'recovered',
    revision: options.serverRevision,
  });
};

export const resolveDraftConflict = (
  state: DraftSaveState,
  options: { serverRevision: number; keepLocal: boolean },
): DraftSaveState => {
  if (!hasValidStateRevisions(state) || !isFiniteRevision(options.serverRevision)) return malformed(state);
  if (state.status !== 'conflicted') return withPublishGate({ ...state, error: 'not_conflicted' });
  if (options.serverRevision < minimumRequiredRevision(state)) return staleRevision(state);
  if (options.keepLocal) {
    return withPublishGate({
      status: 'dirty',
      revision: options.serverRevision,
      localRevision: options.serverRevision + 1,
    });
  }
  return withPublishGate({
    status: 'recovered',
    revision: options.serverRevision,
  });
};
