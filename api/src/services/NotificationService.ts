import { prisma } from '../prisma';
import { AppError } from '../utils/http';

export interface CreateNotificationInput {
  userId: string;
  actorId?: string;
  type: string;
  targetType: string;
  targetId: string;
  message: string;
}

export class NotificationService {
  /**
   * 创建通知
   */
  static async createNotification(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        actorId: input.actorId,
        type: input.type,
        targetType: input.targetType,
        targetId: input.targetId,
        message: input.message,
      },
    });
  }

  /**
   * 获取通知列表（分页）
   */
  static async getNotifications(userId: string, page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = (Math.max(1, page) - 1) * safeLimit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: safeLimit,
        skip,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      items: notifications,
      total,
      page,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * 获取未读通知数量
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * 标记单条通知为已读
   */
  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError(404, 'NOT_FOUND', '通知不存在');
    }
    if (notification.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', '没有权限');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * 标记所有通知为已读
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
