import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { BranchService } from '../services/BranchService';
import { AppError } from '../utils/http';
import { getCurrentUser } from '../utils/authHelpers';
import { notifyStoryAuthor } from '../utils/notifications';
import { qsFlat } from '../utils/pagination';

export const createBranch = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId, role: userRole } = getCurrentUser(req);

  const branch = await BranchService.createBranch(authorId, userRole, req.body);

  // 通知故事原作者：有人为你的故事创建了分支
  await notifyStoryAuthor(
    branch.parentStoryId,
    authorId,
    'branch_created',
    'branch',
    branch.id,
    (title) => `有人为你的故事「${title}」创建了分支「${branch.title}」`,
  );

  res.status(201).json({ success: true, data: branch });
});

export const getBranches = catchAsync(async (req: Request, res: Response) => {
  const result = await BranchService.getBranches(qsFlat(req.query));
  res.json({ success: true, ...result });
});

export const getBranchById = catchAsync(async (req: Request, res: Response) => {
  const branch = await BranchService.getBranchById(req.params.id);
  res.json({ success: true, data: branch });
});

export const updateBranch = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId, role: userRole } = getCurrentUser(req);

  const updatedBranch = await BranchService.updateBranch(req.params.id, authorId, userRole, req.body);
  res.json({ success: true, data: updatedBranch });
});

export const getMyBranches = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId } = getCurrentUser(req);

  const result = await BranchService.getMyBranches(authorId, qsFlat(req.query));
  res.json({ success: true, ...result });
});

export const deleteBranch = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId, role: userRole } = getCurrentUser(req);

  const result = await BranchService.deleteBranch(req.params.id, authorId, userRole);
  res.json({ success: true, data: result });
});

export const createSubBranch = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: authorId, role: userRole } = getCurrentUser(req);

  const branch = await BranchService.createSubBranch(authorId, userRole, {
    ...req.body,
    parentBranchId: req.params.id,
  });
  res.status(201).json({ success: true, data: branch });
});
