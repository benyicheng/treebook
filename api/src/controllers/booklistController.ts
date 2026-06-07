import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import {
  BooklistCrudService,
  BooklistItemService,
  BooklistProgressService,
  BooklistGraphService,
  BooklistLinksService,
} from '../services/booklist';
import { AppError } from '../utils/http';
import { moderateText, moderateMedia, reviewContent } from '../utils/contentModeration';
import { ModerationVisibilityService } from '../domains/moderation/ModerationVisibilityService';

export const createBooklist = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  if (!creatorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const booklist = await BooklistCrudService.createBooklist(creatorId, req.body);
  moderateText(req, 'booklists', 'booklist', booklist.id, 'title', booklist.title, creatorId);
  moderateText(req, 'booklists', 'booklist', booklist.id, 'description', booklist.description, creatorId);
  moderateMedia(req, 'booklists', 'booklist', booklist.id, 'coverImage', booklist.coverImage, creatorId);
  res.status(201).json({ success: true, data: booklist });
});

export const getBooklists = catchAsync(async (req: Request, res: Response) => {
  const { creatorId, isPublic, limit, type, tag, sortBy, page } = req.query;
  const result = await BooklistCrudService.getBooklists({
    creatorId: creatorId as string,
    isPublic: isPublic === 'false' ? false : true,
    limit: limit ? parseInt(limit as string) : undefined,
    type: type as string,
    tag: tag as string,
    sortBy: sortBy as any,
    page: page as string,
  });
  res.json({ success: true, ...result });
});

export const getMyBooklists = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  if (!creatorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await BooklistCrudService.getMyBooklists(creatorId, req.query as any);
  res.json({ success: true, ...result });
});

export const getBooklistById = catchAsync(async (req: Request, res: Response) => {
  const booklist = await BooklistCrudService.getBooklistById(req.params.id);
  if (booklist && booklist.id && await ModerationVisibilityService.shouldMask('booklist', booklist.id)) {
    booklist.title = ModerationVisibilityService.maskText(booklist.title);
    booklist.description = ModerationVisibilityService.maskText(booklist.description || '');
  }
  res.json({ success: true, data: booklist });
});

export const updateBooklist = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  const userRole = req.user?.role;
  if (!creatorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const booklist = await BooklistCrudService.updateBooklist(req.params.id, creatorId, userRole, req.body);
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

  const result = await BooklistCrudService.deleteBooklist(req.params.id, creatorId, userRole);
  res.json({ success: true, data: result });
});

export const addItemToBooklist = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  const userRole = req.user?.role;
  if (!creatorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const item = await BooklistItemService.addItemToBooklist(req.params.id, creatorId, userRole, req.body);
  reviewContent(creatorId, 'booklists', 'booklist_item', item.id, 'text', 'notes', { text: item.notes, field: 'notes' });
  moderateText(req, 'booklists', 'booklist_item', item.id, 'notes', item.notes, creatorId);
  res.status(201).json({ success: true, data: item });
});

export const updateBooklistItemNotes = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  const userRole = req.user?.role;
  if (!creatorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const item = await BooklistItemService.updateBooklistItemNotes(req.params.itemId, creatorId, userRole, req.body);
  reviewContent(creatorId, 'booklists', 'booklist_item', item.id, 'text', 'notes', { text: item.notes, field: 'notes' });
  moderateText(req, 'booklists', 'booklist_item', item.id, 'notes', item.notes, creatorId);
  res.json({ success: true, data: item });
});

export const upsertProgress = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const progress = await BooklistProgressService.upsertProgress(req.params.id, userId, req.body);
  res.json({ success: true, data: progress });
});

export const toggleProgress = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const { itemId } = req.body;
  if (!itemId) throw new AppError(400, 'BAD_REQUEST', '缺少 itemId');

  const progress = await BooklistProgressService.toggleProgressItem(req.params.id, userId, itemId);
  res.json({ success: true, data: progress });
});

export const getProgress = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const progress = await BooklistProgressService.getProgress(req.params.id, userId);
  res.json({ success: true, data: progress });
});

export const removeItemFromBooklist = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  const userRole = req.user?.role;
  if (!creatorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await BooklistItemService.removeItemFromBooklist(req.params.itemId, creatorId, userRole);
  res.json({ success: true, data: result });
});

// ── Graph: Relations ──────────────────────────────────

export const createRelation = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  const userRole = req.user?.role;
  if (!creatorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const relation = await BooklistGraphService.createRelation(req.params.id, creatorId, userRole, req.body);
  res.status(201).json({ success: true, data: relation });
});

export const deleteRelation = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  const userRole = req.user?.role;
  if (!creatorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await BooklistGraphService.deleteRelation(req.params.id, req.params.relationId, creatorId, userRole);
  res.json({ success: true, data: result });
});

export const getGraph = catchAsync(async (req: Request, res: Response) => {
  const graph = await BooklistGraphService.getGraph(req.params.id);
  res.json({ success: true, data: graph });
});

export const syncStoryLinks = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await BooklistLinksService.syncStoryLinks(req.params.id);
  res.json({ success: true, data: result });
});

export const getStoryLinks = catchAsync(async (req: Request, res: Response) => {
  const links = await BooklistLinksService.getStoryLinks(req.params.id);
  res.json({ success: true, data: links });
});
