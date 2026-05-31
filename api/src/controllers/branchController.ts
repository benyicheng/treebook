import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { BranchService } from '../services/BranchService';
import { NotificationService } from '../services/NotificationService';
import { prisma } from '../prisma';
import { AppError } from '../utils/http';

export const createBranch = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const branch = await BranchService.createBranch(authorId, userRole, req.body);

  // 通知故事原作者：有人为你的故事创建了分支
  try {
    const story = await prisma.story.findUnique({
      where: { id: branch.parentStoryId },
      select: { authorId: true, title: true },
    });
    if (story && story.authorId !== authorId) {
      await NotificationService.createNotification({
        userId: story.authorId,
        actorId: authorId,
        type: 'branch_created',
        targetType: 'branch',
        targetId: branch.id,
        message: `有人为你的故事「${story.title}」创建了分支「${branch.title}」`,
      });
    }
  } catch (err) {
    console.error('Failed to create branch notification:', err);
  }

  res.status(201).json({ success: true, data: branch });
});

export const getBranches = catchAsync(async (req: Request, res: Response) => {
  const result = await BranchService.getBranches(req.query as any);
  res.json({ success: true, ...result });
});

export const getBranchById = catchAsync(async (req: Request, res: Response) => {
  const branch = await BranchService.getBranchById(req.params.id);
  res.json({ success: true, data: branch });
});

export const updateBranch = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const updatedBranch = await BranchService.updateBranch(req.params.id, authorId, userRole, req.body);
  res.json({ success: true, data: updatedBranch });
});

export const getMyBranches = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  if (!authorId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await BranchService.getMyBranches(authorId, req.query as any);
  res.json({ success: true, ...result });
});

export const deleteBranch = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await BranchService.deleteBranch(req.params.id, authorId, userRole);
  res.json({ success: true, data: result });
});
