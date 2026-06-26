import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { ActivityService } from '../services/ActivityService';
import { AppError } from '../utils/http';
import { getCurrentUser } from '../utils/authHelpers';

export const getFeed = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const { cursor, limit } = req.query;
  const result = await ActivityService.getFeed(
    userId,
    cursor as string,
    limit ? parseInt(limit as string) : undefined,
  );
  res.json({ success: true, data: result });
});

export const getUserActivities = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const { cursor, limit } = req.query;
  const result = await ActivityService.getUserActivities(
    req.params.userId,
    cursor as string,
    limit ? parseInt(limit as string) : undefined,
  );
  res.json({ success: true, data: result });
});
