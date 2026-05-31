import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { DiscoverService, DiscoverTab } from '../services/DiscoverService';
import { AppError } from '../utils/http';

const VALID_TABS: DiscoverTab[] = ['hot', 'latest'];

export const getUniverseFeed = catchAsync(async (req: Request, res: Response) => {
  const tab = (req.query.tab as string) || 'hot';
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

  if (!VALID_TABS.includes(tab as DiscoverTab)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `Invalid tab. Must be one of: ${VALID_TABS.join(', ')}`,
    );
  }

  const data = await DiscoverService.getUniverseFeed(tab as DiscoverTab, page, limit);
  res.json({ success: true, data });
});
