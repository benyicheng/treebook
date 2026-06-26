import type { Request } from 'express';
import { ModerationGateway } from '../domains/moderation/ModerationGateway';
import { ReviewWorkflowService } from '../domains/reviewWorkflow/ReviewWorkflowService';
import type { ModerationTargetType, ModerationContentType } from '../domains/moderation/types';
import { safeFireAndForget } from './catchAsync';

export function moderateText(
  req: Request,
  businessLine: string,
  targetType: ModerationTargetType,
  targetId: string,
  field: string,
  text: string | null | undefined,
  userId?: string,
) {
  if (!text) return;
  safeFireAndForget(
    ModerationGateway.enqueueText(req, { businessLine, targetType, targetId, field, text, userId }),
    { traceId: req.traceId, op: `moderateText:${businessLine}:${targetId}:${field}` },
  );
}

export function moderateMedia(
  req: Request,
  businessLine: string,
  targetType: ModerationTargetType,
  targetId: string,
  field: string,
  url: string | null | undefined,
  userId?: string,
  contentType: 'image' | 'video' = 'image',
) {
  if (!url) return;
  safeFireAndForget(
    ModerationGateway.enqueueMediaUrl(req, { businessLine, targetType, targetId, field, contentType, mediaUrl: url, userId }),
    { traceId: req.traceId, op: `moderateMedia:${businessLine}:${targetId}:${field}` },
  );
}

export function reviewContent(
  actorUserId: string | undefined,
  businessLine: string,
  targetType: ModerationTargetType,
  targetId: string,
  contentType: ModerationContentType,
  field: string,
  snapshot: Record<string, any>,
) {
  if (!actorUserId) return;
  safeFireAndForget(
    ReviewWorkflowService.onContentUpdated({ actorUserId, businessLine, targetType, targetId, contentType, field, snapshot }),
    { op: `reviewContent:${businessLine}:${targetId}:${field}` },
  );
}
