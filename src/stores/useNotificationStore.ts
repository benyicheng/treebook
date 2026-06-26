import { create } from 'zustand';
import notificationService, { NotificationItem } from '../api/notificationService';
import { getToken } from '../lib/tokenStore';

interface NotificationState {
  unreadCount: number;
  notifications: NotificationItem[];
  isLoading: boolean;
  isOpen: boolean;

  fetchUnreadCount: () => Promise<void>;
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  toggleOpen: () => void;
  close: () => void;
  startPolling: () => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  notifications: [],
  isLoading: false,
  isOpen: false,

  fetchUnreadCount: async () => {
    if (!getToken()) return;
    try {
      const count = await notificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // 静默失败
    }
  },

  fetchNotifications: async (page = 1) => {
    if (!getToken()) return;
    set({ isLoading: true });
    try {
      const result = await notificationService.getNotifications(page, 20);
      set({ notifications: result.items, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    // 乐观更新
    const { notifications, unreadCount } = get();
    set({
      notifications: notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, unreadCount - 1),
    });
    try {
      await notificationService.markAsRead(id);
    } catch {
      // 回滚
      get().fetchUnreadCount();
      get().fetchNotifications();
    }
  },

  markAllAsRead: async () => {
    const prevUnread = get().unreadCount;
    set({ unreadCount: 0, notifications: get().notifications.map((n) => ({ ...n, isRead: true })) });
    try {
      await notificationService.markAllAsRead();
    } catch {
      set({ unreadCount: prevUnread });
      get().fetchUnreadCount();
    }
  },

  toggleOpen: () => {
    const { isOpen } = get();
    set({ isOpen: !isOpen });
    if (!isOpen && getToken()) {
      get().fetchNotifications();
    }
  },

  close: () => {
    set({ isOpen: false });
    if (getToken()) {
      get().fetchUnreadCount();
    }
  },

  startPolling: () => {
    get().fetchUnreadCount();
    const interval = setInterval(() => {
      get().fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  },
}));
