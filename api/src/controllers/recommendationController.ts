import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { RecommendationService } from '../services/RecommendationService';
import { AppError } from '../utils/http';

/**
 * GET /api/recommendations/for-you
 */
export const getForYou = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const { limit } = req.query;
  const data = await RecommendationService.getForYou(
    userId,
    limit ? parseInt(limit as string) : undefined,
  );
  res.json({ success: true, data });
});
