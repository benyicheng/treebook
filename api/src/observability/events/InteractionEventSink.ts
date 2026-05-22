import type { InteractionEvent } from '../../domains/interactions/events';

export type ObservedInteractionEvent = InteractionEvent & {
  ip?: string;
  userAgent?: string;
};

export interface InteractionEventSink {
  record: (event: ObservedInteractionEvent) => Promise<void>;
}
