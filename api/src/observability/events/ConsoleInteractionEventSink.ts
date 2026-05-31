import { logger } from '../../utils/logger';
import type { InteractionEventSink, ObservedInteractionEvent } from './InteractionEventSink';

export class ConsoleInteractionEventSink implements InteractionEventSink {
  async record(event: ObservedInteractionEvent) {
    logger.info('Interaction event', { event });
  }
}
