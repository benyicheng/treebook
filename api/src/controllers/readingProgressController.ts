import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { prisma } from '../prisma';
import { AppError } from '../utils/http';

/**
 * 批量获取当前用户对指定章节的阅读进度
 * GET /api/reading-progress?chapterIds=id1,id2,id3
 */
export const getReadingProgress = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const chapterIds = (req.query.chapterIds as string)?.split(',').filter(Boolean);

  const where: any = { userId };
  if (chapterIds?.length) {
    where.chapterId = { in: chapterIds };
  }

  const progress = await prisma.readingProgress.findMany({
    where,
    select: {
      chapterId: true,
      status: true,
      progress: true,
      currentPage: true,
      source: true,
      sourceId: true,
      updatedAt: true,
    },
  });

  res.json({ success: true, data: progress });
});

/**
 * 获取阅读统计
 * GET /api/reading-progress/stats
 */
export const getReadingStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const [total, completed, inProgress] = await Promise.all([
    prisma.readingProgress.count({ where: { userId } }),
    prisma.readingProgress.count({ where: { userId, status: 'completed' } }),
    prisma.readingProgress.count({ where: { userId, status: 'reading' } }),
  ]);

  res.json({
    success: true,
    data: { total, completed, inProgress },
  });
});

/**
 * 更新（upsert）阅读进度
 * PUT /api/reading-progress/:chapterId
 * Body: { status?, progress?, currentPage?, source?, sourceId? }
 */
export const upsertReadingProgress = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const { chapterId } = req.params;
  const { status, progress, currentPage, source, sourceId } = req.body;

  // Validate chapter exists
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) throw new AppError(404, 'NOT_FOUND', 'Chapter not found');

  const data = await prisma.readingProgress.upsert({
    where: {
      userId_chapterId: { userId, chapterId },
    },
    create: {
      userId,
      chapterId,
      status: status ?? 'reading',
      progress: progress ?? 0,
      currentPage: currentPage ?? null,
      source: source ?? null,
      sourceId: sourceId ?? null,
    },
    update: {
      ...(status !== undefined && { status }),
      ...(progress !== undefined && { progress }),
      ...(currentPage !== undefined && { currentPage }),
      ...(source !== undefined && { source }),
      ...(sourceId !== undefined && { sourceId }),
    },
  });

  res.json({ success: true, data });
});
