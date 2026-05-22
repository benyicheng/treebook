import { prisma } from '../../prisma';
import type { InteractionEventSink, ObservedInteractionEvent } from './InteractionEventSink';
import crypto from 'crypto';

export class DbInteractionEventSink implements InteractionEventSink {
  async record(event: ObservedInteractionEvent) {
    const id = crypto.randomUUID();
    const createdAt = event.createdAt;
    const reasonTags = event.reasonTags ? JSON.stringify(event.reasonTags) : null;

    await prisma.$executeRaw`
      INSERT INTO "interaction_events" (
        "id",
        "type",
        "targetType",
        "targetId",
        "userId",
        "platform",
        "score",
        "reasonTags",
        "traceId",
        "ip",
        "userAgent",
        "createdAt"
      ) VALUES (
        ${id},
        ${event.type},
        ${event.targetType},
        ${event.targetId},
        ${event.userId || null},
        ${event.platform || null},
        ${event.score ?? null},
        ${reasonTags},
        ${event.traceId || null},
        ${event.ip || null},
        ${event.userAgent || null},
        ${createdAt}
      )
    `;
  }
}
