import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { ChapterService } from '../services/ChapterService';
import { AppError } from '../utils/http';

export const createChapter = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const chapter = await ChapterService.createChapter(authorId, userRole, req.body);
  res.status(201).json({ success: true, data: chapter });
});

export const updateChapter = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const updatedChapter = await ChapterService.updateChapter(req.params.id, authorId, userRole, req.body);
  res.json({ success: true, data: updatedChapter });
});

export const deleteChapter = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await ChapterService.deleteChapter(req.params.id, authorId, userRole);
  res.json(result);
});

export const getChapterById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const referralBooklistId = req.query.referralId as string;
  const chapter = await ChapterService.getChapterById(req.params.id, userId, referralBooklistId);
  res.json({ success: true, data: chapter });
});

export const getComments = catchAsync(async (req: Request, res: Response) => {
  const comments = await ChapterService.getComments(req.params.id);
  res.json({ success: true, data: comments });
});

export const createComment = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const comment = await ChapterService.createComment(req.params.id, authorId, req.body.content);
  res.status(201).json({ success: true, data: comment });
});
