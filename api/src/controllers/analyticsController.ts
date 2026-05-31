import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { DbInteractionEventSink } from '../observability/events/DbInteractionEventSink';
import type { InteractionEventType } from '../domains/interactions/events';
import type { TargetType } from '../domains/interactions/types';
import { AppError } from '../utils/http';

const MAX_BATCH = 50;

interface AnalyticsEventPayload {
  type: InteractionEventType;
  targetType?: string;
  targetId?: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

const dbSink = new DbInteractionEventSink();

export const recordEvents = catchAsync(async (req: Request, res: Response) => {
  let events: AnalyticsEventPayload[] = req.body.events || req.body;
  if (!Array.isArray(events)) {
    events = [events];
  }

  if (events.length > MAX_BATCH) {
    throw new AppError(400, 'VALIDATION_ERROR', `Batch size exceeds maximum of ${MAX_BATCH}`);
  }

  const ip = req.ip || req.socket.remoteAddress || undefined;
  const userAgent = req.headers['user-agent'] || undefined;
  const userId = (req as any).user?.id;

  const results = await Promise.allSettled(
    events.map((ev) => {
      const timestamp = ev.timestamp || new Date().toISOString();
      const targetType = (ev.targetType || 'system') as TargetType;
      const targetId = ev.targetId || '';

      // Extract extra properties
      const properties = ev.properties || {};
      const score = typeof properties.score === 'number' ? properties.score : undefined;
      const reasonTags = Array.isArray(properties.reasonTags)
        ? properties.reasonTags.map(String).slice(0, 5)
        : undefined;
      const platform = typeof properties.platform === 'string' ? properties.platform.slice(0, 32) : undefined;
      const traceId = typeof properties.traceId === 'string' ? properties.traceId.slice(0, 128) : undefined;

      return dbSink.record({
        type: ev.type,
        targetType,
        targetId,
        userId: userId || undefined,
        platform,
        score,
        reasonTags,
        traceId,
        ip: typeof ip === 'string' ? ip.slice(0, 128) : undefined,
        userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 256) : undefined,
        createdAt: timestamp,
      });
    })
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  res.json({
    success: true,
    data: { accepted: events.length, failed },
  });
});
