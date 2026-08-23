import { describe, expect, it, vi } from 'vitest';
import {
  FIRST_TEN_BOARD_BASELINE_CONFIG,
  GRIDONE_INSTRUMENTATION_EVENT_NAMES,
  validateInstrumentationEvent,
  type GridOneInstrumentationEvent,
} from '../src/features/instrumentation/eventSchema';
import { createClientEventRecorder } from '../src/features/instrumentation/clientEvents';

describe('GridOne Slice 11 privacy-minimal instrumentation schema', () => {
  it('permits only the approved coarse event names', () => {
    expect(GRIDONE_INSTRUMENTATION_EVENT_NAMES).toEqual([
      'homepage_primary_action',
      'homepage_secondary_action',
      'organizer_phase_entered',
      'organizer_phase_completed',
      'find_my_squares_opened',
      'find_my_squares_resolved',
      'find_my_squares_no_match',
      'personalized_scenario_disclosure',
      'viewer_center_selected_square',
      'viewer_grid_interaction_mode',
      'notification_form_opened',
      'recoverable_ui_failure_code',
      'coarse_performance_timing',
    ]);

    expect(validateInstrumentationEvent({ name: 'square_owner_name_entered' })).toEqual({
      ok: false,
      error: 'unknown_event',
    });
  });

  it('accepts approved events with only enum, bucket, boolean, numeric timing, and feature variant values', () => {
    const allowed: GridOneInstrumentationEvent[] = [
      { name: 'homepage_primary_action', action: 'create_board', surface: 'homepage', featureVariant: 'homepage_v2:on' },
      { name: 'homepage_secondary_action', action: 'view_demo', surface: 'homepage', featureVariant: 'homepage_v2:off' },
      { name: 'organizer_phase_entered', phase: 'fill', featureVariant: 'organizer_v2:on' },
      { name: 'organizer_phase_completed', phase: 'publish', featureVariant: 'organizer_v2:off' },
      { name: 'find_my_squares_opened', surface: 'viewer', featureVariant: 'viewer_v2:on' },
      { name: 'find_my_squares_resolved', matchBucket: 'multiple', featureVariant: 'viewer_v2:off' },
      { name: 'find_my_squares_no_match', queryLengthBucket: '6_10' },
      { name: 'personalized_scenario_disclosure', scenarioBucket: 'close_game', visible: true },
      { name: 'viewer_center_selected_square', squareState: 'assigned', hasWinner: false },
      { name: 'viewer_grid_interaction_mode', mode: 'keyboard' },
      { name: 'notification_form_opened', surface: 'viewer', notificationIntent: 'score_updates' },
      { name: 'recoverable_ui_failure_code', code: 'clipboard_denied', surface: 'organizer' },
      { name: 'coarse_performance_timing', metric: 'route_interactive', durationBucketMs: 1000 },
    ];

    for (const event of allowed) {
      expect(validateInstrumentationEvent(event), JSON.stringify(event)).toEqual({ ok: true, event });
    }
  });

  it('rejects prohibited fields instead of stripping them silently', () => {
    const prohibitedFields = [
      'nameLabel',
      'email',
      'token',
      'payoutText',
      'rulesText',
      'imageData',
      'rawProviderPayload',
      'urlQuery',
      'errorMessage',
      'crossSiteId',
      'fingerprint',
    ];

    for (const field of prohibitedFields) {
      const result = validateInstrumentationEvent({
        name: 'homepage_primary_action',
        action: 'create_board',
        [field]: 'secret-user-data',
      });
      expect(result, field).toEqual({ ok: false, error: 'prohibited_field', field });
    }
  });

  it('rejects unknown fields and free-form or sensitive values', () => {
    Object.defineProperty(Object.prototype, 'name', { value: 'viewer_grid_interaction_mode', configurable: true });
    try {
      expect(validateInstrumentationEvent({ mode: 'touch' })).toEqual({
        ok: false,
        error: 'missing_field',
        field: 'name',
      });
    } finally {
      delete (Object.prototype as Record<string, unknown>).name;
    }
    const symbolKey = Symbol('email');
    expect(validateInstrumentationEvent({ name: 'viewer_grid_interaction_mode', mode: 'touch', [symbolKey]: 'anthony@example.com' })).toEqual({
      ok: false,
      error: 'unknown_field',
      field: 'symbol',
    });
    expect(validateInstrumentationEvent({ name: 'find_my_squares_resolved', matchBucket: 'Anthony M.' })).toEqual({
      ok: false,
      error: 'invalid_value',
      field: 'matchBucket',
    });
    expect(validateInstrumentationEvent({ name: 'recoverable_ui_failure_code', code: 'TypeError: Carrie email failed' })).toEqual({
      ok: false,
      error: 'invalid_value',
      field: 'code',
    });
    expect(validateInstrumentationEvent({ name: 'coarse_performance_timing', metric: 'route_interactive', durationBucketMs: 1234 })).toEqual({
      ok: false,
      error: 'invalid_value',
      field: 'durationBucketMs',
    });
    expect(validateInstrumentationEvent({ name: 'viewer_grid_interaction_mode', mode: 'pointer', boardId: 'board_123' })).toEqual({
      ok: false,
      error: 'unknown_field',
      field: 'boardId',
    });
  });

  it('keeps first-ten-board baseline config targetless and approval-gated', () => {
    expect(FIRST_TEN_BOARD_BASELINE_CONFIG).toEqual({
      slice: 'slice11_first_ten_board_baseline',
      boardLimit: 10,
      targets: [],
      approvalRequiredBeforeOutreachOrAnalytics: true,
      capturesUserData: false,
    });
  });
});

describe('GridOne Slice 11 client event recorder', () => {
  it('uses injected async delivery, reports deterministic delivered result, and validates before send', async () => {
    const deliver = vi.fn(async (_event: Readonly<GridOneInstrumentationEvent>, _signal: AbortSignal) => ({ accepted: true as const }));
    const recorder = createClientEventRecorder({ deliver, timeoutMs: 50 });

    await expect(recorder.record({ name: 'viewer_grid_interaction_mode', mode: 'touch' })).resolves.toEqual({
      status: 'delivered',
    });
    expect(deliver).toHaveBeenCalledWith(
      { name: 'viewer_grid_interaction_mode', mode: 'touch' },
      expect.any(AbortSignal),
    );
    expect(Object.isFrozen(deliver.mock.calls[0][0])).toBe(true);

    await expect(recorder.record({ name: 'viewer_grid_interaction_mode', mode: 'touch', email: 'a@b.com' })).resolves.toEqual({
      status: 'rejected',
      reason: 'prohibited_field',
      field: 'email',
    });
    expect(deliver).toHaveBeenCalledTimes(1);
  });

  it('swallows delivery failures and timeout races without blocking product tasks', async () => {
    const rejected = createClientEventRecorder({
      deliver: async () => {
        throw new Error('network leaks are irrelevant here');
      },
      timeoutMs: 50,
    });
    await expect(rejected.record({ name: 'homepage_secondary_action', action: 'view_demo', surface: 'homepage' })).resolves.toEqual({
      status: 'delivery_failed',
    });

    let released = false;
    let aborted = false;
    const timedOut = createClientEventRecorder({
      deliver: (_event, signal) =>
        new Promise((resolve) => {
          signal.addEventListener('abort', () => { aborted = true; });
          setTimeout(() => {
            if (!signal.aborted) released = true;
            resolve({ accepted: true as const });
          }, 25);
        }),
      timeoutMs: 1,
    });

    await expect(timedOut.record({ name: 'coarse_performance_timing', metric: 'route_interactive', durationBucketMs: 250 })).resolves.toEqual({
      status: 'delivery_timeout',
    });
    expect(released).toBe(false);
    expect(aborted).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(released).toBe(false);
  });
});
