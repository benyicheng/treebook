import type { InteractionEventSink, ObservedInteractionEvent } from './InteractionEventSink';

export class ConsoleInteractionEventSink implements InteractionEventSink {
  async record(event: ObservedInteractionEvent) {
    console.log('[interaction_event]', JSON.stringify(event));
  }
}
