export const GRIDONE_INSTRUMENTATION_EVENT_NAMES = [
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
] as const;

export type GridOneInstrumentationEventName = (typeof GRIDONE_INSTRUMENTATION_EVENT_NAMES)[number];

export type FeatureVariant = 'viewer_v2:on' | 'viewer_v2:off' | 'organizer_v2:on' | 'organizer_v2:off' | 'homepage_v2:on' | 'homepage_v2:off';

type Surface = 'homepage' | 'organizer' | 'viewer';
type HomepageAction = 'create_board' | 'view_demo' | 'learn_more';
type OrganizerPhase = 'create' | 'fill' | 'draw' | 'publish' | 'share';
type MatchBucket = 'one' | 'multiple';
type QueryLengthBucket = '0' | '1_2' | '3_5' | '6_10' | '11_plus';
type ScenarioBucket = 'close_game' | 'decided_game' | 'lead_change' | 'unknown';
type SquareState = 'open' | 'assigned' | 'winning' | 'not_winning';
type InteractionMode = 'touch' | 'keyboard' | 'mouse';
type NotificationIntent = 'score_updates' | 'winner_updates';
type RecoverableUiFailureCode =
  | 'clipboard_denied'
  | 'qr_render_failed'
  | 'score_refresh_failed'
  | 'notification_submit_failed'
  | 'image_export_failed';
type PerformanceMetric = 'route_interactive' | 'grid_render' | 'dialog_open' | 'score_refresh';
type DurationBucketMs = 100 | 250 | 500 | 1000 | 2500 | 5000 | 10000;

type BaseEvent = {
  featureVariant?: FeatureVariant;
};

export type GridOneInstrumentationEvent =
  | (BaseEvent & { name: 'homepage_primary_action'; action: HomepageAction; surface: 'homepage' })
  | (BaseEvent & { name: 'homepage_secondary_action'; action: HomepageAction; surface: 'homepage' })
  | (BaseEvent & { name: 'organizer_phase_entered'; phase: OrganizerPhase })
  | (BaseEvent & { name: 'organizer_phase_completed'; phase: OrganizerPhase })
  | (BaseEvent & { name: 'find_my_squares_opened'; surface: 'viewer' })
  | (BaseEvent & { name: 'find_my_squares_resolved'; matchBucket: MatchBucket })
  | (BaseEvent & { name: 'find_my_squares_no_match'; queryLengthBucket: QueryLengthBucket })
  | (BaseEvent & { name: 'personalized_scenario_disclosure'; scenarioBucket: ScenarioBucket; visible: boolean })
  | (BaseEvent & { name: 'viewer_center_selected_square'; squareState: SquareState; hasWinner: boolean })
  | (BaseEvent & { name: 'viewer_grid_interaction_mode'; mode: InteractionMode })
  | (BaseEvent & { name: 'notification_form_opened'; surface: Surface; notificationIntent: NotificationIntent })
  | (BaseEvent & { name: 'recoverable_ui_failure_code'; code: RecoverableUiFailureCode; surface: Surface })
  | (BaseEvent & { name: 'coarse_performance_timing'; metric: PerformanceMetric; durationBucketMs: DurationBucketMs });

export type FirstTenBoardBaselineConfig = {
  slice: 'slice11_first_ten_board_baseline';
  boardLimit: 10;
  targets: [];
  approvalRequiredBeforeOutreachOrAnalytics: true;
  capturesUserData: false;
};

export const FIRST_TEN_BOARD_BASELINE_CONFIG: FirstTenBoardBaselineConfig = {
  slice: 'slice11_first_ten_board_baseline',
  boardLimit: 10,
  targets: [],
  approvalRequiredBeforeOutreachOrAnalytics: true,
  capturesUserData: false,
};

type EventSpec = {
  fields: Record<string, readonly unknown[]>;
};

const commonFields = {
  featureVariant: ['viewer_v2:on', 'viewer_v2:off', 'organizer_v2:on', 'organizer_v2:off', 'homepage_v2:on', 'homepage_v2:off'],
} as const;

const EVENT_SPECS: Record<GridOneInstrumentationEventName, EventSpec> = {
  homepage_primary_action: {
    fields: { action: ['create_board', 'view_demo', 'learn_more'], surface: ['homepage'], ...commonFields },
  },
  homepage_secondary_action: {
    fields: { action: ['create_board', 'view_demo', 'learn_more'], surface: ['homepage'], ...commonFields },
  },
  organizer_phase_entered: {
    fields: { phase: ['create', 'fill', 'draw', 'publish', 'share'], ...commonFields },
  },
  organizer_phase_completed: {
    fields: { phase: ['create', 'fill', 'draw', 'publish', 'share'], ...commonFields },
  },
  find_my_squares_opened: {
    fields: { surface: ['viewer'], ...commonFields },
  },
  find_my_squares_resolved: {
    fields: { matchBucket: ['one', 'multiple'], ...commonFields },
  },
  find_my_squares_no_match: {
    fields: { queryLengthBucket: ['0', '1_2', '3_5', '6_10', '11_plus'], ...commonFields },
  },
  personalized_scenario_disclosure: {
    fields: { scenarioBucket: ['close_game', 'decided_game', 'lead_change', 'unknown'], visible: [true, false], ...commonFields },
  },
  viewer_center_selected_square: {
    fields: { squareState: ['open', 'assigned', 'winning', 'not_winning'], hasWinner: [true, false], ...commonFields },
  },
  viewer_grid_interaction_mode: {
    fields: { mode: ['touch', 'keyboard', 'mouse'], ...commonFields },
  },
  notification_form_opened: {
    fields: { surface: ['homepage', 'organizer', 'viewer'], notificationIntent: ['score_updates', 'winner_updates'], ...commonFields },
  },
  recoverable_ui_failure_code: {
    fields: {
      code: ['clipboard_denied', 'qr_render_failed', 'score_refresh_failed', 'notification_submit_failed', 'image_export_failed'],
      surface: ['homepage', 'organizer', 'viewer'],
      ...commonFields,
    },
  },
  coarse_performance_timing: {
    fields: { metric: ['route_interactive', 'grid_render', 'dialog_open', 'score_refresh'], durationBucketMs: [100, 250, 500, 1000, 2500, 5000, 10000], ...commonFields },
  },
};

const PROHIBITED_FIELDS = new Set([
  'nameLabel',
  'label',
  'nameText',
  'email',
  'token',
  'authToken',
  'payout',
  'payoutText',
  'rules',
  'rulesText',
  'image',
  'imageData',
  'rawProviderPayload',
  'providerPayload',
  'url',
  'urlQuery',
  'queryString',
  'error',
  'errorMessage',
  'crossSiteId',
  'fingerprint',
]);

export type InstrumentationValidationResult =
  | { ok: true; event: GridOneInstrumentationEvent }
  | { ok: false; error: 'unknown_event' }
  | { ok: false; error: 'not_object' }
  | { ok: false; error: 'prohibited_field' | 'unknown_field' | 'invalid_value' | 'missing_field'; field: string };

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

function isEventName(value: unknown): value is GridOneInstrumentationEventName {
  return typeof value === 'string' && GRIDONE_INSTRUMENTATION_EVENT_NAMES.includes(value as GridOneInstrumentationEventName);
}

export function validateInstrumentationEvent(input: unknown): InstrumentationValidationResult {
  if (!isPlainRecord(input)) return { ok: false, error: 'not_object' };
  const ownKeys = Reflect.ownKeys(input);
  if (ownKeys.some((key) => typeof key === 'symbol')) return { ok: false, error: 'unknown_field', field: 'symbol' };
  const fields = ownKeys as string[];
  if (!Object.prototype.hasOwnProperty.call(input, 'name')) return { ok: false, error: 'missing_field', field: 'name' };
  if (!isEventName(input.name)) return { ok: false, error: 'unknown_event' };

  for (const field of fields) {
    if (PROHIBITED_FIELDS.has(field)) return { ok: false, error: 'prohibited_field', field };
  }

  const spec = EVENT_SPECS[input.name];
  const allowedFields = new Set(['name', ...Object.keys(spec.fields)]);

  for (const field of fields) {
    if (!allowedFields.has(field)) return { ok: false, error: 'unknown_field', field };
  }

  for (const [field, allowedValues] of Object.entries(spec.fields)) {
    const isOptional = field === 'featureVariant';
    if (!Object.prototype.hasOwnProperty.call(input, field)) {
      if (isOptional) continue;
      return { ok: false, error: 'missing_field', field };
    }
    if (!allowedValues.includes(input[field])) return { ok: false, error: 'invalid_value', field };
  }

  const event = Object.fromEntries(fields.map((field) => [field, input[field]])) as GridOneInstrumentationEvent;
  return { ok: true, event };
}
