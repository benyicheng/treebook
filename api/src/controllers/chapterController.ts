import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { ChapterService } from '../services/ChapterService';
import { AppError } from '../utils/http';
import { moderateText, reviewContent } from '../utils/contentModeration';
import { ModerationVisibilityService } from '../domains/moderation/ModerationVisibilityService';

export const createChapter = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const chapter = await ChapterService.createChapter(authorId, userRole, req.body);
  moderateText(req, 'chapters', 'chapter', chapter.id, 'title', chapter.title, authorId);
  moderateText(req, 'chapters', 'chapter', chapter.id, 'content', chapter.content, authorId);
  res.status(201).json({ success: true, data: chapter });
});

export const updateChapter = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const updatedChapter = await ChapterService.updateChapter(req.params.id, authorId, userRole, req.body);
  reviewContent(authorId, 'chapters', 'chapter', updatedChapter.id, 'text', 'title', { text: updatedChapter.title, field: 'title' });
  reviewContent(authorId, 'chapters', 'chapter', updatedChapter.id, 'text', 'content', { text: updatedChapter.content, field: 'content' });
  moderateText(req, 'chapters', 'chapter', updatedChapter.id, 'title', updatedChapter.title, authorId);
  moderateText(req, 'chapters', 'chapter', updatedChapter.id, 'content', updatedChapter.content, authorId);
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
  if (chapter && chapter.id && await ModerationVisibilityService.shouldMask('chapter', chapter.id)) {
    chapter.title = ModerationVisibilityService.maskText(chapter.title);
    chapter.content = ModerationVisibilityService.maskText(chapter.content);
  }
  res.json({ success: true, data: chapter });
});

export const searchChapters = catchAsync(async (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const chapters = await ChapterService.searchChapters(query);
  res.json({ success: true, data: chapters });
});

export const getChaptersByStory = catchAsync(async (req: Request, res: Response) => {
  const { storyId } = req.params;
  const branchId = req.query.branchId as string | undefined;
  const includeBranches = req.query.includeBranches === 'true';
  const chapters = await ChapterService.getByStory(storyId, branchId ?? null, includeBranches);
  res.json({ success: true, data: chapters });
});

export const getComments = catchAsync(async (req: Request, res: Response) => {
  const comments = await ChapterService.getComments(req.params.id);
  res.json({ success: true, data: comments });
});

export const createComment = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const comment = await ChapterService.createComment(req.params.id, authorId, req.body.content);
  moderateText(req, 'comments', 'comment', comment.id, 'content', comment.content, authorId);
  res.status(201).json({ success: true, data: comment });
});

export const updateComment = catchAsync(async (req: AuthRequest, res: Response) => {
  const actorId = req.user?.id;
  const role = req.user?.role;
  if (!actorId || !role) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const updated = await ChapterService.updateComment(req.params.commentId, actorId, role, req.body.content);
  reviewContent(actorId, 'comments', 'comment', updated.id, 'text', 'content', { text: updated.content, field: 'content' });
  moderateText(req, 'comments', 'comment', updated.id, 'content', updated.content, actorId);
  res.json({ success: true, data: updated });
});
