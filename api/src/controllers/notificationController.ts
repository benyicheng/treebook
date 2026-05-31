import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/NotificationService';

/**
 * 获取当前用户的通知列表（分页，按时间倒序）
 */
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const result = await NotificationService.getNotifications(userId, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Notification] getNotifications error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch notifications' });
  }
};

/**
 * 获取当前用户的未读通知数量
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const count = await NotificationService.getUnreadCount(userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('[Notification] getUnreadCount error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to get unread count' });
  }
};

/**
 * 将单条通知标记为已读
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const updated = await NotificationService.markAsRead(req.params.id, userId);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    if (error?.message === 'NOTIFICATION_NOT_FOUND') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found' });
    }
    if (error?.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }
    console.error('[Notification] markAsRead error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to mark as read' });
  }
};

/**
 * 将所有通知标记为已读
 */
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await NotificationService.markAllAsRead(userId);
    res.json({ success: true, data: { count: result.count } });
  } catch (error) {
    console.error('[Notification] markAllAsRead error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to mark all as read' });
  }
};
