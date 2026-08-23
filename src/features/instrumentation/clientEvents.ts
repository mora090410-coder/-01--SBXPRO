import { validateInstrumentationEvent, type GridOneInstrumentationEvent } from './eventSchema';

export type ClientEventDelivery = (event: Readonly<GridOneInstrumentationEvent>, signal: AbortSignal) => Promise<unknown>;

export type ClientEventRecorder = {
  record(event: unknown): Promise<ClientEventRecordResult>;
};

export type ClientEventRecordResult =
  | { status: 'delivered' }
  | { status: 'delivery_failed' }
  | { status: 'delivery_timeout' }
  | { status: 'rejected'; reason: 'unknown_event' | 'not_object' }
  | { status: 'rejected'; reason: 'prohibited_field' | 'unknown_field' | 'invalid_value' | 'missing_field'; field: string };

export type ClientEventRecorderConfig = {
  deliver: ClientEventDelivery;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 750;
const MIN_TIMEOUT_MS = 1;
const MAX_TIMEOUT_MS = 5_000;

function normalizeTimeout(timeoutMs: number | undefined): number {
  if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs)) return DEFAULT_TIMEOUT_MS;
  return Math.max(MIN_TIMEOUT_MS, Math.min(MAX_TIMEOUT_MS, Math.floor(timeoutMs)));
}

export function createClientEventRecorder(config: ClientEventRecorderConfig): ClientEventRecorder {
  const timeoutMs = normalizeTimeout(config.timeoutMs);

  return {
    async record(event: unknown): Promise<ClientEventRecordResult> {
      const validation = validateInstrumentationEvent(event);
      if (!validation.ok) {
        if (validation.error === 'unknown_event' || validation.error === 'not_object') {
          return { status: 'rejected', reason: validation.error };
        }
        return { status: 'rejected', reason: validation.error, field: validation.field };
      }

      const controller = new AbortController();
      const deliveryEvent = Object.freeze({ ...validation.event }) as Readonly<GridOneInstrumentationEvent>;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        const outcome = await Promise.race([
          config.deliver(deliveryEvent, controller.signal).then(() => 'delivered' as const),
          new Promise<'delivery_timeout'>((resolve) => {
            timeoutId = setTimeout(() => {
              controller.abort();
              resolve('delivery_timeout');
            }, timeoutMs);
          }),
        ]);
        return outcome === 'delivered' ? { status: 'delivered' } : { status: 'delivery_timeout' };
      } catch {
        return { status: 'delivery_failed' };
      } finally {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
      }
    },
  };
}
