import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { BranchService } from '../services/BranchService';
import { AppError } from '../utils/http';

export const createBranch = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const branch = await BranchService.createBranch(authorId, userRole, req.body);
  res.status(201).json({ success: true, data: branch });
});

export const getBranches = catchAsync(async (req: Request, res: Response) => {
  const limitParam = req.query.limit;
  const limit = limitParam ? parseInt(limitParam as string) : undefined;

  const branches = await BranchService.getBranches(limit);
  res.json({ success: true, data: branches });
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

  const branches = await BranchService.getMyBranches(authorId);
  res.json({ success: true, data: branches });
});

export const deleteBranch = catchAsync(async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const userRole = req.user?.role;
  if (!authorId || !userRole) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await BranchService.deleteBranch(req.params.id, authorId, userRole);
  res.json(result);
});
