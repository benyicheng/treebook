import type { Request } from 'express';
import { buildInteractionEvent, type InteractionEvent, type InteractionEventType } from '../../domains/interactions/events';
import type { TargetType } from '../../domains/interactions/types';
import { ConsoleInteractionEventSink } from './ConsoleInteractionEventSink';
import type { InteractionEventSink, ObservedInteractionEvent } from './InteractionEventSink';
import { DbInteractionEventSink } from './DbInteractionEventSink';

type InteractionEventPayload = {
  type: InteractionEventType;
  targetType: TargetType;
  targetId: string;
  userId?: string;
  platform?: string;
  score?: number;
  reasonTags?: string[];
};

const getSinkName = () => {
  const explicit = process.env.INTERACTION_EVENT_SINK;
  if (explicit) return explicit;
  if (process.env.NODE_ENV === 'test') return 'none';
  return 'console';
};

let sink: InteractionEventSink | null = null;

const getSink = (): InteractionEventSink | null => {
  if (sink) return sink;
  const name = getSinkName();
  if (name === 'none') return null;
  if (name === 'console') {
    sink = new ConsoleInteractionEventSink();
    return sink;
  }
  if (name === 'db') {
    sink = new DbInteractionEventSink();
    return sink;
  }
  sink = new ConsoleInteractionEventSink();
  return sink;
};

const safeStr = (v: unknown, max: number) => {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  if (!s) return undefined;
  return s.length > max ? s.slice(0, max) : s;
};

const getTraceId = (req: Request) => {
  const header = req.header('x-trace-id');
  const fromHeader = safeStr(header, 128);
  const fromReq = safeStr((req as any).traceId, 128);
  return fromHeader || fromReq;
};

export const recordInteractionEvent = (req: Request, payload: InteractionEventPayload) => {
  const s = getSink();
  if (!s) return;

  const traceId = getTraceId(req);
  const ip = safeStr(req.ip, 128);
  const userAgent = safeStr(req.header('user-agent'), 256);

  const event: InteractionEvent = buildInteractionEvent({
    ...payload,
    traceId,
  });

  const enriched: InteractionEvent = {
    ...event,
    reasonTags: event.reasonTags?.slice(0, 5),
    platform: safeStr(event.platform, 32),
    userId: safeStr(event.userId, 64),
    targetId: safeStr(event.targetId, 64) || event.targetId,
  };

  const out: ObservedInteractionEvent = {
    ...enriched,
    ...(ip ? { ip } : {}),
    ...(userAgent ? { userAgent } : {}),
  };

  void Promise.resolve()
    .then(() => s.record(out))
    .catch(() => {});
};
