import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { RevenueService } from '../services/RevenueService';
import { AppError } from '../utils/http';

export const getWalletInfo = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const wallet = await RevenueService.getWalletInfo(userId);
  res.json({ success: true, data: wallet });
});

export const settleStoryRevenue = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await RevenueService.settleStoryRevenue(req.params.storyId);
  res.json({ success: true, data: result });
});

export const settleSpinoffRevenue = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await RevenueService.settleSpinoffRevenue(req.params.spinoffId);
  res.json({ success: true, data: result });
});
