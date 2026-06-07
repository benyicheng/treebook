import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { StoryService } from '../services/StoryService';
import { AppError } from '../utils/http';
import { moderateText, moderateMedia, reviewContent } from '../utils/contentModeration';
import { ModerationVisibilityService } from '../domains/moderation/ModerationVisibilityService';

export const getAllStories = catchAsync(async (req: Request, res: Response) => {
  const result = await StoryService.getAllStories(req.query as any);
  res.json({ success: true, ...result });
});

export const getStoryById = catchAsync(async (req: Request, res: Response) => {
  const story = await StoryService.getStoryById(req.params.id);
  if (story && story.id && await ModerationVisibilityService.shouldMask('story', story.id)) {
    story.title = ModerationVisibilityService.maskText(story.title);
    story.description = ModerationVisibilityService.maskText(story.description || '');
  }
  res.json({ success: true, data: story });
});

export const createStory = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const story = await StoryService.createStory(authorId, req.body);
  moderateText(req, 'stories', 'story', story.id, 'title', story.title, authorId);
  moderateText(req, 'stories', 'story', story.id, 'description', story.description, authorId);
  moderateMedia(req, 'stories', 'story', story.id, 'coverImage', story.coverImage, authorId);
  res.status(201).json({ success: true, data: story });
});

export const updateStory = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const role = req.user?.role;
  if (!authorId || !role) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const story = await StoryService.updateStory(req.params.id, authorId, role, req.body);
  reviewContent(authorId, 'stories', 'story', story.id, 'text', 'title', { text: story.title, field: 'title' });
  reviewContent(authorId, 'stories', 'story', story.id, 'text', 'description', { text: story.description, field: 'description' });
  reviewContent(authorId, 'stories', 'story', story.id, 'image', 'coverImage', { mediaUrl: story.coverImage, field: 'coverImage' });
  moderateText(req, 'stories', 'story', story.id, 'title', story.title, authorId);
  moderateText(req, 'stories', 'story', story.id, 'description', story.description, authorId);
  moderateMedia(req, 'stories', 'story', story.id, 'coverImage', story.coverImage, authorId);
  res.json({ success: true, data: story });
});

export const deleteStory = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const role = req.user?.role;
  if (!authorId || !role) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await StoryService.deleteStory(req.params.id, authorId, role);
  res.json({ success: true, data: result });
});

export const getRecentReads = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.json({ success: true, data: [] });

  const recentReads = await StoryService.getRecentReads(userId);
  res.json({ success: true, data: recentReads });
});

export const getMyStories = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await StoryService.getMyStories(authorId, req.query as any);
  res.json({ success: true, ...result });
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
  moderateText(req, 'stories', 'character', character.id, 'name', character.name, authorId);
  moderateText(req, 'stories', 'character', character.id, 'description', character.description, authorId);
  moderateMedia(req, 'stories', 'character', character.id, 'avatarUrl', character.avatarUrl, authorId);
  res.status(201).json({ success: true, data: character });
});

export const updateCharacter = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const role = req.user?.role;
  if (!authorId || !role) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const character = await StoryService.updateCharacter(req.params.charId, authorId, role, req.body);
  moderateText(req, 'stories', 'character', character.id, 'name', character.name, authorId);
  moderateText(req, 'stories', 'character', character.id, 'description', character.description, authorId);
  moderateMedia(req, 'stories', 'character', character.id, 'avatarUrl', character.avatarUrl, authorId);
  res.json({ success: true, data: character });
});

export const deleteCharacter = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const role = req.user?.role;
  if (!authorId || !role) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await StoryService.deleteCharacter(req.params.charId, authorId, role);
  res.json({ success: true, data: result });
});

export const getTags = catchAsync(async (req: Request, res: Response) => {
  const tags = await StoryService.getTags();
  res.json({ success: true, data: tags });
});

export const getStoryCharacterAppearances = catchAsync(async (req: Request, res: Response) => {
  const appearances = await StoryService.getStoryCharacterAppearances(req.params.id);
  res.json({ success: true, data: appearances });
});

export const batchCharacterAppearances = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const role = req.user?.role;
  if (!authorId || !role) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await StoryService.batchUpdateCharacterAppearances(
    req.params.id,
    authorId,
    role,
    req.body.appearances
  );
  res.json({ success: true, data: result });
});

export const certifyBranch = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;
  if (!userId || !role) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const updated = await StoryService.certifyBranch(req.params.branchId, userId, role, req.body);
  res.json({ success: true, data: updated });
});
