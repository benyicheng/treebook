import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { RecommendationService } from '../services/RecommendationService';
/**
 * GET /api/recommendations/for-you
 * 已登录用户：个性化推荐（关注网络 → 相似标签 → 热门兜底）
 * 匿名用户：热门内容兜底
 */
export const getForYou = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { limit } = req.query;
  const parsedLimit = limit ? parseInt(limit as string) : undefined;

  if (!userId) {
    // 匿名用户 → 返回热门推荐
    const data = await RecommendationService.getHotRecommendations(parsedLimit ?? 16, new Set());
    return res.json({ success: true, data });
  }

  const data = await RecommendationService.getForYou(
    userId,
    parsedLimit,
  );
  res.json({ success: true, data });
});
