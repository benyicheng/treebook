import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { FollowService } from '../services/FollowService';
import { AppError } from '../utils/http';
import { getCurrentUser } from '../utils/authHelpers';

export const followUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const { followingId } = req.body;
  if (!followingId) throw new AppError(400, 'BAD_REQUEST', '缺少 followingId');

  const follow = await FollowService.followUser(userId, followingId);
  res.status(201).json({ success: true, data: follow });
});

export const unfollowUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const { followingId } = req.body;
  if (!followingId) throw new AppError(400, 'BAD_REQUEST', '缺少 followingId');

  const result = await FollowService.unfollowUser(userId, followingId);
  res.json({ success: true, data: result });
});

export const getFollowers = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const { cursor, limit } = req.query;
  const result = await FollowService.getFollowers(
    req.params.userId,
    cursor as string,
    limit ? parseInt(limit as string) : undefined,
  );
  res.json({ success: true, data: result });
});

export const getFollowing = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const { cursor, limit } = req.query;
  const result = await FollowService.getFollowing(
    req.params.userId,
    cursor as string,
    limit ? parseInt(limit as string) : undefined,
  );
  res.json({ success: true, data: result });
});

export const checkFollowStatus = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const { targetId } = req.query;
  if (!targetId) throw new AppError(400, 'BAD_REQUEST', '缺少 targetId');

  const isFollowing = await FollowService.isFollowing(userId, targetId as string);
  res.json({ success: true, data: { isFollowing } });
});

export const batchFollowStatus = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const { targetIds } = req.body;
  if (!Array.isArray(targetIds)) {
    throw new AppError(400, 'BAD_REQUEST', 'targetIds 必须是数组');
  }

  const status = await FollowService.getFollowStatus(userId, targetIds);
  res.json({ success: true, data: status });
});

/**
 * GET /api/follows/activity — 关注动态 Feed
 */
export const getFollowActivity = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const { cursor, limit } = req.query;
  const result = await FollowService.getFollowActivity(
    userId,
    cursor as string,
    limit ? parseInt(limit as string) : undefined,
  );
  res.json({ success: true, data: result });
});
