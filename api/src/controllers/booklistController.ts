import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { BooklistService } from '../services/BooklistService';
import { AppError } from '../utils/http';
import { moderateText, moderateMedia, reviewContent } from '../utils/contentModeration';
import { ModerationVisibilityService } from '../domains/moderation/ModerationVisibilityService';

export const createBooklist = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  if (!creatorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const booklist = await BooklistService.createBooklist(creatorId, req.body);
  moderateText(req, 'booklists', 'booklist', booklist.id, 'title', booklist.title, creatorId);
  moderateText(req, 'booklists', 'booklist', booklist.id, 'description', booklist.description, creatorId);
  moderateMedia(req, 'booklists', 'booklist', booklist.id, 'coverImage', booklist.coverImage, creatorId);
  res.status(201).json({ success: true, data: booklist });
});

export const getBooklists = catchAsync(async (req: Request, res: Response) => {
  const { creatorId, isPublic, limit, type, tag, sortBy } = req.query;
  const booklists = await BooklistService.getBooklists({
    creatorId: creatorId as string,
    isPublic: isPublic === 'false' ? false : true,
    limit: limit ? parseInt(limit as string) : undefined,
    type: type as string,
    tag: tag as string,
    sortBy: sortBy as any
  });
  res.json({ success: true, data: booklists });
});

export const getMyBooklists = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  if (!creatorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const booklists = await BooklistService.getMyBooklists(creatorId);
  res.json({ success: true, data: booklists });
});

export const getBooklistById = catchAsync(async (req: Request, res: Response) => {
  const booklist = await BooklistService.getBooklistById(req.params.id);
  if (booklist && booklist.id && await ModerationVisibilityService.shouldMask('booklist', booklist.id)) {
    booklist.title = ModerationVisibilityService.maskText(booklist.title);
    booklist.description = ModerationVisibilityService.maskText(booklist.description);
  }
  res.json({ success: true, data: booklist });
});

export const updateBooklist = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  const userRole = req.user?.role;
  if (!creatorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const booklist = await BooklistService.updateBooklist(req.params.id, creatorId, userRole, req.body);
  reviewContent(creatorId, 'booklists', 'booklist', booklist.id, 'text', 'title', { text: booklist.title, field: 'title' });
  reviewContent(creatorId, 'booklists', 'booklist', booklist.id, 'text', 'description', { text: booklist.description, field: 'description' });
  reviewContent(creatorId, 'booklists', 'booklist', booklist.id, 'image', 'coverImage', { mediaUrl: booklist.coverImage, field: 'coverImage' });
  moderateText(req, 'booklists', 'booklist', booklist.id, 'title', booklist.title, creatorId);
  moderateText(req, 'booklists', 'booklist', booklist.id, 'description', booklist.description, creatorId);
  moderateMedia(req, 'booklists', 'booklist', booklist.id, 'coverImage', booklist.coverImage, creatorId);
  res.json({ success: true, data: booklist });
});

export const deleteBooklist = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  const userRole = req.user?.role;
  if (!creatorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await BooklistService.deleteBooklist(req.params.id, creatorId, userRole);
  res.json(result);
});

export const addItemToBooklist = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  const userRole = req.user?.role;
  if (!creatorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const item = await BooklistService.addItemToBooklist(req.params.id, creatorId, userRole, req.body);
  reviewContent(creatorId, 'booklists', 'booklist_item', item.id, 'text', 'notes', { text: item.notes, field: 'notes' });
  moderateText(req, 'booklists', 'booklist_item', item.id, 'notes', item.notes, creatorId);
  res.status(201).json({ success: true, data: item });
});

export const updateBooklistItemNotes = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  const userRole = req.user?.role;
  if (!creatorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const item = await BooklistService.updateBooklistItemNotes(req.params.itemId, creatorId, userRole, req.body);
  reviewContent(creatorId, 'booklists', 'booklist_item', item.id, 'text', 'notes', { text: item.notes, field: 'notes' });
  moderateText(req, 'booklists', 'booklist_item', item.id, 'notes', item.notes, creatorId);
  res.json({ success: true, data: item });
});

export const upsertProgress = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const progress = await BooklistService.upsertProgress(req.params.id, userId, req.body);
  res.json({ success: true, data: progress });
});

export const getProgress = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const progress = await BooklistService.getProgress(req.params.id, userId);
  res.json({ success: true, data: progress });
});

export const removeItemFromBooklist = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  const userRole = req.user?.role;
  if (!creatorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await BooklistService.removeItemFromBooklist(req.params.itemId, creatorId, userRole);
  res.json(result);
});
