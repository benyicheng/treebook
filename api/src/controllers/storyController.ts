import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { StoryService } from '../services/StoryService';
import { AppError } from '../utils/http';

export const getAllStories = catchAsync(async (req: Request, res: Response) => {
  const stories = await StoryService.getAllStories(req.query);
  res.json({ success: true, data: stories });
});

export const getStoryById = catchAsync(async (req: Request, res: Response) => {
  const story = await StoryService.getStoryById(req.params.id);
  res.json({ success: true, data: story });
});

export const createStory = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const story = await StoryService.createStory(authorId, req.body);
  res.status(201).json({ success: true, data: story });
});

export const updateStory = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const role = req.user?.role;
  if (!authorId || !role) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const story = await StoryService.updateStory(req.params.id, authorId, role, req.body);
  res.json({ success: true, data: story });
});

export const deleteStory = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const role = req.user?.role;
  if (!authorId || !role) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await StoryService.deleteStory(req.params.id, authorId, role);
  res.json(result);
});

export const getRecentReads = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const recentReads = await StoryService.getRecentReads(userId);
  res.json({ success: true, data: recentReads });
});

export const getMyStories = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const stories = await StoryService.getMyStories(authorId);
  res.json({ success: true, data: stories });
});

export const getStoryCharacters = catchAsync(async (req: Request, res: Response) => {
  const characters = await StoryService.getStoryCharacters(req.params.id);
  res.json({ success: true, data: characters });
});

export const createCharacter = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const role = req.user?.role;
  if (!authorId || !role) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const character = await StoryService.createCharacter(req.params.id, authorId, role, req.body);
  res.status(201).json({ success: true, data: character });
});

export const updateCharacter = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const role = req.user?.role;
  if (!authorId || !role) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const character = await StoryService.updateCharacter(req.params.charId, authorId, role, req.body);
  res.json({ success: true, data: character });
});

export const deleteCharacter = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const role = req.user?.role;
  if (!authorId || !role) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await StoryService.deleteCharacter(req.params.charId, authorId, role);
  res.json(result);
});

export const getTags = catchAsync(async (req: Request, res: Response) => {
  const tags = await StoryService.getTags();
  res.json({ success: true, data: tags });
});

export const certifyBranch = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;
  if (!userId || !role) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const updated = await StoryService.certifyBranch(req.params.branchId, userId, role, req.body);
  res.json({ success: true, data: updated });
});
