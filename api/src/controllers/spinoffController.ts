import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { SpinoffService } from '../services/SpinoffService';
import { AppError } from '../utils/http';
import { getCurrentUser } from '../utils/authHelpers';
import { notifyStoryAuthor } from '../utils/notifications';
import { qsFlat } from '../utils/pagination';
import { moderateText, reviewContent } from '../utils/contentModeration';
import { ModerationVisibilityService } from '../domains/moderation/ModerationVisibilityService';

export const createSpinoff = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId } = getCurrentUser(req);

  const spinoff = await SpinoffService.createSpinoff(authorId, req.body);

  // 通知故事原作者：有人为你的故事发布了番外
  await notifyStoryAuthor(
    spinoff.originalStoryId,
    authorId,
    'spinoff_published',
    'spinoff',
    spinoff.id,
    (title) => `有人为你的故事「${title}」发布了番外「${spinoff.title}」`,
  );

  moderateText(req, 'spinoffs', 'spinoff', spinoff.id, 'title', spinoff.title, authorId);
  moderateText(req, 'spinoffs', 'spinoff', spinoff.id, 'summary', spinoff.summary, authorId);
  moderateText(req, 'spinoffs', 'spinoff', spinoff.id, 'content', spinoff.content, authorId);
  res.status(201).json({ success: true, data: spinoff });
});

export const getSpinoffById = catchAsync(async (req: Request, res: Response) => {
  const spinoff = await SpinoffService.getSpinoffById(req.params.id);
  if (spinoff && spinoff.id && await ModerationVisibilityService.shouldMask('spinoff', spinoff.id)) {
    spinoff.title = ModerationVisibilityService.maskText(spinoff.title);
    spinoff.summary = ModerationVisibilityService.maskText(spinoff.summary || '');
    spinoff.content = ModerationVisibilityService.maskText(spinoff.content || '');
  }
  res.json({ success: true, data: spinoff });
});

export const getAllSpinoffs = catchAsync(async (req: Request, res: Response) => {
  const result = await SpinoffService.getAllSpinoffs(req.query);
  res.json({ success: true, ...result });
});

export const updateSpinoff = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId, role: userRole } = getCurrentUser(req);

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
  const { id: authorId } = getCurrentUser(req);

  const result = await SpinoffService.getMySpinoffs(authorId, qsFlat(req.query));
  res.json({ success: true, ...result });
});

export const deleteSpinoff = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId, role: userRole } = getCurrentUser(req);

  const result = await SpinoffService.deleteSpinoff(req.params.id, authorId, userRole);
  res.json({ success: true, data: result });
});
