import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { BooklistService } from '../services/BooklistService';
import { AppError } from '../utils/http';

export const createBooklist = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  if (!creatorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const booklist = await BooklistService.createBooklist(creatorId, req.body);
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
  res.json({ success: true, data: booklist });
});

export const updateBooklist = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  const userRole = req.user?.role;
  if (!creatorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const booklist = await BooklistService.updateBooklist(req.params.id, creatorId, userRole, req.body);
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
  res.status(201).json({ success: true, data: item });
});

export const removeItemFromBooklist = catchAsync(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user?.id;
  const userRole = req.user?.role;
  if (!creatorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await BooklistService.removeItemFromBooklist(req.params.itemId, creatorId, userRole);
  res.json(result);
});
