import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';
import { EventCommentService } from '../services/EventCommentService';
import { getCurrentUser } from '../utils/authHelpers';
import { commentSchema } from '../utils/validation';

export const getEventComments = catchAsync(async (req: Request, res: Response) => {
  const comments = await EventCommentService.getByEvent(req.params.eventId);
  res.json({ success: true, data: comments });
});

export const createEventComment = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId } = getCurrentUser(req);
  const { content } = commentSchema.parse(req.body);

  const comment = await EventCommentService.create(req.params.eventId, authorId, content);
  res.status(201).json({ success: true, data: comment });
});

export const deleteEventComment = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: actorId, role: actorRole } = getCurrentUser(req);
  const result = await EventCommentService.delete(req.params.commentId, actorId, actorRole);
  res.json({ success: true, data: result });
});
