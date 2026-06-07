import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { WikiService } from '../services/WikiService';
import { AppError } from '../utils/http';

// ── WikiPage CRUD ────────────────────────────────────

export const createWikiPage = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const page = await WikiService.createWikiPage(authorId, req.body);
  res.status(201).json({ success: true, data: page });
});

export const listWikiPages = catchAsync(async (req: Request, res: Response) => {
  const result = await WikiService.getWikiPages(req.query as any);
  res.json({ success: true, ...result });
});

export const getWikiPage = catchAsync(async (req: Request, res: Response) => {
  const page = await WikiService.getWikiPage(req.params.id);
  res.json({ success: true, data: page });
});

export const updateWikiPage = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const updatedPage = await WikiService.updateWikiPage(req.params.id, authorId, userRole, req.body);
  res.json({ success: true, data: updatedPage });
});

export const deleteWikiPage = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await WikiService.deleteWikiPage(req.params.id, authorId, userRole);
  res.json({ success: true, data: result });
});

// ── Lookup (for WikiPopover) ────────────────────────

export const lookupWikis = catchAsync(async (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 5, 1), 20);
  const results = await WikiService.lookupWikis(q, limit);
  res.json({ success: true, data: results });
});

// ── Alias Management ─────────────────────────────────

export const addAlias = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const alias = await WikiService.addAlias(req.params.id, req.body);
  res.status(201).json({ success: true, data: alias });
});

export const removeAlias = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await WikiService.removeAlias(req.params.id, req.params.aliasId);
  res.json({ success: true, data: result });
});

// ── Link Management ──────────────────────────────────

export const getLinks = catchAsync(async (req: Request, res: Response) => {
  const links = await WikiService.getLinks(req.params.id);
  res.json({ success: true, data: links });
});

export const createLink = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const link = await WikiService.createLink(req.params.id, req.body);
  res.status(201).json({ success: true, data: link });
});

export const removeLink = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await WikiService.removeLink(req.params.id, req.params.linkId);
  res.json({ success: true, data: result });
});
