import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { InteractionService, TargetType } from '../services/InteractionService';
import { AppError } from '../utils/http';
import { getCurrentUser } from '../utils/authHelpers';
import { RATING_REASON_TAGS } from '../utils/interaction';
import { recordInteractionEvent } from '../observability/events/interactionEvents';

export const getInteractionStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const { targetType, targetId } = req.params;
  const userId = req.user?.id;

  if (!InteractionService.isTargetType(targetType)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid targetType');
  }

  const data = await InteractionService.getInteractionStats(targetType as TargetType, targetId, userId);
  res.json({ success: true, data });
});

export const toggleLike = catchAsync(async (req: AuthRequest, res: Response) => {
  const { targetType, targetId } = req.params;
  const { id: userId } = getCurrentUser(req);

  if (!InteractionService.isTargetType(targetType)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid targetType');
  }

  const result = await InteractionService.toggleLike(targetType as TargetType, targetId, userId);
  recordInteractionEvent(req, {
    type: result.liked ? 'like' : 'unlike',
    targetType: targetType as TargetType,
    targetId,
    userId,
  });
  res.json({ success: true, data: result });
});

export const updateRating = catchAsync(async (req: AuthRequest, res: Response) => {
  const { targetType, targetId } = req.params;
  const { id: userId } = getCurrentUser(req);
  const { score, reasonTags } = req.body;
  
  if (!InteractionService.isTargetType(targetType)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid targetType');
  }

  const data = await InteractionService.updateRating(targetType as TargetType, targetId, userId, score, reasonTags);
  recordInteractionEvent(req, {
    type: 'rating',
    targetType: targetType as TargetType,
    targetId,
    userId,
    score,
    reasonTags,
  });
  res.json({ success: true, data });
});

export const recordShare = catchAsync(async (req: AuthRequest, res: Response) => {
  const { targetType, targetId } = req.params;
  const { id: userId } = getCurrentUser(req);
  const { platform } = req.body || {};

  if (!InteractionService.isTargetType(targetType)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid targetType');
  }

  const result = await InteractionService.recordShare(targetType as TargetType, targetId, platform);
  recordInteractionEvent(req, {
    type: 'share',
    targetType: targetType as TargetType,
    targetId,
    userId,
    platform,
  });
  res.json({ success: true, data: result });
});

export const getRatingReasonTags = catchAsync(async (req: Request, res: Response) => {
  res.json({ success: true, data: { tags: RATING_REASON_TAGS } });
});
