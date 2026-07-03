import client from './client';
import type { NotificationItem } from './types';
export type { NotificationItem };

const notificationService = {
  getNotifications: async (page = 1, limit = 20): Promise<{ items: NotificationItem[]; total: number; page: number; limit: number; totalPages: number }> => {
    const { data } = await client.get<any>('/notifications', { params: { page, limit } });
    return data;
  },

  markRead: async (id?: string) => {
    await client.post('/notifications/read', { id });
  },

  markAllRead: async () => {
    await client.post('/notifications/read-all');
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await client.get<any>('/notifications/unread-count');
    return data;
  },
};

export default notificationService;
