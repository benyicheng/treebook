import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { ReadingPathService } from '../services/ReadingPathService';
import { AppError } from '../utils/http';

/**
 * GET /api/reading-paths
 */
export const getAllReadingPaths = catchAsync(async (req: Request, res: Response) => {
  const sortBy = (req.query.sortBy as string) === 'new' ? 'new' : 'hot';
  const result = await ReadingPathService.getAllPaths(sortBy, req.query as any);
  res.json({ success: true, data: result });
});

/**
 * GET /api/universes/:id/reading-paths
 */
export const getReadingPaths = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) throw new AppError(400, 'VALIDATION_ERROR', 'Universe ID is required');
  const result = await ReadingPathService.getPathsByStory(id, req.query as any);
  res.json({ success: true, data: result });
});

/**
 * GET /api/reading-paths/:id
 */
export const getReadingPathById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) throw new AppError(400, 'VALIDATION_ERROR', 'Reading path ID is required');
  const data = await ReadingPathService.getPathById(id);
  res.json({ success: true, data });
});

/**
 * POST /api/reading-paths
 */
export const createReadingPath = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const { storyId, booklistId, title, description, origin, nodes } = req.body;
  if (!title || !nodes?.length) {
    throw new AppError(400, 'VALIDATION_ERROR', 'title and nodes are required');
  }

  const data = await ReadingPathService.createPath({
    storyId: storyId || null,
    booklistId: booklistId || null,
    creatorId: userId,
    title,
    description,
    origin,
    nodes: nodes.map((n: any, i: number) => ({
      sortOrder: n.sortOrder ?? i,
      nodeCategory: n.nodeCategory,
      contentId: n.contentId,
      storyId: n.storyId || null,
      storyTitle: n.storyTitle || null,
      note: n.note,
    })),
  });

  res.status(201).json({ success: true, data });
});

/**
 * PUT /api/reading-paths/:id
 */
export const updateReadingPath = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const { id } = req.params;
  if (!id) throw new AppError(400, 'VALIDATION_ERROR', 'Reading path ID is required');

  const { title, description, nodes } = req.body;

  const data = await ReadingPathService.updatePath(id, userId, {
    title,
    description: description !== undefined ? description : undefined,
    nodes: nodes
      ? nodes.map((n: any, i: number) => ({
          sortOrder: n.sortOrder ?? i,
          nodeCategory: n.nodeCategory,
          contentId: n.contentId,
          note: n.note,
        }))
      : undefined,
  });

  res.json({ success: true, data });
});

/**
 * POST /api/reading-paths/:id/view
 */
export const recordPathView = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) throw new AppError(400, 'VALIDATION_ERROR', 'Reading path ID is required');
  await ReadingPathService.incrementViewCount(id);
  res.json({ success: true, data: {} });
});

/**
 * POST /api/reading-paths/:id/start
 */
export const startReading = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const { id } = req.params;
  if (!id) throw new AppError(400, 'VALIDATION_ERROR', 'Reading path ID is required');

  const trail = await ReadingPathService.startReading(id, userId);
  res.status(201).json({ success: true, data: trail });
});

/**
 * GET /api/reading-paths/trails/:trailId
 */
export const getTrail = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const { trailId } = req.params;
  if (!trailId) throw new AppError(400, 'VALIDATION_ERROR', 'Trail ID is required');

  const trail = await ReadingPathService.getTrail(trailId, userId);
  res.json({ success: true, data: trail });
});

/**
 * POST /api/reading-paths/trails/:trailId/advance
 */
/**
 * GET /api/reading-paths/:id/characters
 * 获取阅读路径中所有角色的出场信息
 */
export const getPathCharacters = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) throw new AppError(400, 'VALIDATION_ERROR', 'Reading path ID is required');
  const result = await ReadingPathService.getPathCharacters(id);
  res.json({ success: true, data: result });
});

export const advanceTrail = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const { trailId } = req.params;
  if (!trailId) throw new AppError(400, 'VALIDATION_ERROR', 'Trail ID is required');

  const result = await ReadingPathService.advanceTrail(trailId, userId);
  res.json({ success: true, data: result });
});
