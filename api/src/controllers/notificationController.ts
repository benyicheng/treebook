import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/NotificationService';
import { catchAsync } from '../utils/catchAsync';
import { parsePagination } from '../utils/pagination';

export const getNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { page, limit: parsedLimit } = parsePagination(req.query);
  const limit = Math.min(parsedLimit, 50);
  const result = await NotificationService.getNotifications(userId, page, limit);
  res.json({ success: true, data: result });
});

export const getUnreadCount = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const count = await NotificationService.getUnreadCount(userId);
  res.json({ success: true, data: { count } });
});

export const markAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const updated = await NotificationService.markAsRead(req.params.id, userId);
  res.json({ success: true, data: updated });
});

export const markAllAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const result = await NotificationService.markAllAsRead(userId);
  res.json({ success: true, data: { count: result.count } });
});
