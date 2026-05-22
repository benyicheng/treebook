import type { Request } from 'express';
import { ModerationConfigService } from './ModerationConfigService';
import { isInModerationRollout } from './rollout';
import { ModerationJobRepository } from './ModerationJobRepository';
import type { ModerationContentType, ModerationTargetType, ModerationRequest } from './types';

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

export class ModerationGateway {
  static async enqueueText(
    req: Request,
    input: {
      businessLine: string;
      targetType: ModerationTargetType;
      targetId: string;
      field?: string;
      text: string;
      userId?: string;
    }
  ) {
    return this.enqueue(req, { ...input, contentType: 'text', text: input.text });
  }

  static async enqueueMediaUrl(
    req: Request,
    input: {
      businessLine: string;
      targetType: ModerationTargetType;
      targetId: string;
      field?: string;
      contentType: Exclude<ModerationContentType, 'text'>;
      mediaUrl: string;
      userId?: string;
    }
  ) {
    return this.enqueue(req, { ...input, contentType: input.contentType, mediaUrl: input.mediaUrl });
  }

  private static async enqueue(
    req: Request,
    input: {
      businessLine: string;
      targetType: ModerationTargetType;
      targetId: string;
      contentType: ModerationContentType;
      field?: string;
      text?: string;
      mediaUrl?: string;
      userId?: string;
    }
  ) {
    try {
      const cfg = await ModerationConfigService.getConfig();
      if (cfg.mode === 'off') return null;
      if (!isInModerationRollout(cfg, input.userId, input.businessLine)) return null;

      const traceId = getTraceId(req);
      const payload: ModerationRequest = {
        businessLine: input.businessLine,
        targetType: input.targetType,
        targetId: input.targetId,
        contentType: input.contentType,
        field: input.field,
        text: input.text,
        mediaUrl: input.mediaUrl,
        userId: input.userId,
        traceId,
        createdAt: new Date().toISOString(),
      };

      const jobId = await ModerationJobRepository.enqueue(payload);
      return jobId;
    } catch {
      return null;
    }
  }
}

