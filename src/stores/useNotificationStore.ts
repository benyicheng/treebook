import { create } from 'zustand';
import notificationService, { NotificationItem } from '../api/notificationService';
import { getToken } from '../lib/tokenStore';

interface NotificationState {
  unreadCount: number;
  notifications: NotificationItem[];
  isLoading: boolean;
  isOpen: boolean;
  error: string | null;

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
  error: null,

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
    set({ isLoading: true, error: null });
    try {
      const result = await notificationService.getNotifications(page, 20);
      set({ notifications: result.items, isLoading: false, error: null });
    } catch {
      set({ isLoading: false, error: '通知加载失败' });
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
      await notificationService.markRead(id);
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
      await notificationService.markAllRead();
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
