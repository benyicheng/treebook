import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { RevenueService } from '../services/RevenueService';
import { AppError } from '../utils/http';
import { getCurrentUser } from '../utils/authHelpers';

export const getWalletInfo = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const wallet = await RevenueService.getWalletInfo(userId);
  res.json({ success: true, data: wallet });
});

export const settleStoryRevenue = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const result = await RevenueService.settleStoryRevenue(req.params.storyId);
  res.json({ success: true, data: result });
});

export const settleSpinoffRevenue = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const result = await RevenueService.settleSpinoffRevenue(req.params.spinoffId);
  res.json({ success: true, data: result });
});
