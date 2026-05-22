import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { SpinoffService } from '../services/SpinoffService';
import { AppError } from '../utils/http';
import { moderateText, reviewContent } from '../utils/contentModeration';
import { ModerationVisibilityService } from '../domains/moderation/ModerationVisibilityService';

export const createSpinoff = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const spinoff = await SpinoffService.createSpinoff(authorId, req.body);
  moderateText(req, 'spinoffs', 'spinoff', spinoff.id, 'title', spinoff.title, authorId);
  moderateText(req, 'spinoffs', 'spinoff', spinoff.id, 'summary', spinoff.summary, authorId);
  moderateText(req, 'spinoffs', 'spinoff', spinoff.id, 'content', spinoff.content, authorId);
  res.status(201).json({ success: true, data: spinoff });
});

export const getSpinoffById = catchAsync(async (req: Request, res: Response) => {
  const spinoff = await SpinoffService.getSpinoffById(req.params.id);
  if (spinoff && spinoff.id && await ModerationVisibilityService.shouldMask('spinoff', spinoff.id)) {
    spinoff.title = ModerationVisibilityService.maskText(spinoff.title);
    spinoff.summary = ModerationVisibilityService.maskText(spinoff.summary);
    spinoff.content = ModerationVisibilityService.maskText(spinoff.content);
  }
  res.json({ success: true, data: spinoff });
});

export const getAllSpinoffs = catchAsync(async (req: Request, res: Response) => {
  const spinoffs = await SpinoffService.getAllSpinoffs(req.query);
  res.json({ success: true, data: spinoffs });
});

export const updateSpinoff = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const spinoff = await SpinoffService.updateSpinoff(req.params.id, authorId, userRole, req.body);
  reviewContent(authorId, 'spinoffs', 'spinoff', spinoff.id, 'text', 'title', { text: spinoff.title, field: 'title' });
  reviewContent(authorId, 'spinoffs', 'spinoff', spinoff.id, 'text', 'summary', { text: spinoff.summary, field: 'summary' });
  reviewContent(authorId, 'spinoffs', 'spinoff', spinoff.id, 'text', 'content', { text: spinoff.content, field: 'content' });
  moderateText(req, 'spinoffs', 'spinoff', spinoff.id, 'title', spinoff.title, authorId);
  moderateText(req, 'spinoffs', 'spinoff', spinoff.id, 'summary', spinoff.summary, authorId);
  moderateText(req, 'spinoffs', 'spinoff', spinoff.id, 'content', spinoff.content, authorId);
  res.json({ success: true, data: spinoff });
});

export const getMySpinoffs = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const spinoffs = await SpinoffService.getMySpinoffs(authorId);
  res.json({ success: true, data: spinoffs });
});

export const deleteSpinoff = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await SpinoffService.deleteSpinoff(req.params.id, authorId, userRole);
  res.json(result);
});
