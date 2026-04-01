import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { MergeService } from '../services/MergeService';
import { AppError } from '../utils/http';

export const createMergeRequest = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const mergeRequest = await MergeService.createMergeRequest(userId, req.body);
  res.status(201).json({ success: true, data: mergeRequest });
});

export const getMergeRequests = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const requests = await MergeService.getMergeRequests(req.params.storyId, userId);
  res.json({ success: true, data: requests });
});

export const handleMergeRequest = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await MergeService.handleMergeRequest(req.params.requestId, userId, req.body);
  res.json(result);
});
