import client from './client';

export interface NotificationItem {
  id: string;
  userId: string;
  actorId?: string;
  type: string;
  targetType: string;
  targetId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const notificationService = {
  getNotifications: async (page = 1, limit = 20): Promise<NotificationListResponse> => {
    const { data } = await client.get<any>('/notifications', { params: { page, limit } });
    return data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await client.get<any>('/notifications/unread-count');
    return data.count;
  },

  markAsRead: async (id: string): Promise<void> => {
    await client.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await client.post('/notifications/read-all');
  },
};

export default notificationService;
