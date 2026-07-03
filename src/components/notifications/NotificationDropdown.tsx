import React, { useEffect, useRef } from 'react';
import { Bell, CheckCheck, MessageSquare, GitBranch, GitPullRequest, CheckCircle, XCircle, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Spinner } from '../ui';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  comment_reply: {
    icon: <MessageSquare size={14} />,
    color: 'text-accent-500 dark:text-accent-400',
    bg: 'bg-accent-50 dark:bg-accent-500/15',
  },
  branch_created: {
    icon: <GitBranch size={14} />,
    color: 'text-accent-500 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
  },
  merge_requested: {
    icon: <GitPullRequest size={14} />,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/30',
  },
  merge_approved: {
    icon: <CheckCircle size={14} />,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/30',
  },
  merge_rejected: {
    icon: <XCircle size={14} />,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/30',
  },
  booklist_added: {
    icon: <BookOpen size={14} />,
    color: 'text-accent-500 dark:text-accent-400',
    bg: 'bg-accent-50 dark:bg-accent-500/15',
  },
  spinoff_published: {
    icon: <BookOpen size={14} />,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-900/30',
  },
  follow: {
    icon: <CheckCircle size={14} />,
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-900/30',
  },
};

const getTypeConfig = (type: string) => {
  return typeConfig[type] || {
    icon: <Bell size={14} />,
    color: 'text-ink-500 dark:text-ink-400',
    bg: 'bg-ink-50 dark:bg-ink-700',
  };
};

const NotificationDropdown: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const {
    notifications, unreadCount, isLoading, error, isOpen,
    fetchNotifications, markAsRead, markAllAsRead,
    toggleOpen, close, startPolling,
  } = useNotificationStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 轮询
  useEffect(() => {
    if (!isAuthenticated) return;
    const cleanup = startPolling();
    return cleanup;
  }, [isAuthenticated]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        close();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Escape 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: zhCN });
    } catch {
      return dateStr;
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={toggleOpen}
        className="p-2.5 text-ink-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/15 rounded-full transition-all relative"
        aria-label="通知"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 border-2 border-white dark:border-ink-800">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-ink-50 dark:bg-ink-800 rounded-2xl shadow-2xl border border-ink-100 dark:border-ink-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50 dark:border-ink-700">
            <h3 className="text-sm font-bold text-ink-800 dark:text-white">
              通知
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-bold text-red-500">({unreadCount} 未读)</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 text-xs font-bold text-ink-400 hover:text-accent-500 dark:hover:text-accent-400 transition-colors"
              >
                <CheckCheck size={14} />
                全部已读
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[420px] overflow-y-auto overscroll-contain">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size={28} />
              </div>
            ) : error && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3">
                  <AlertCircle size={20} className="text-red-500" />
                </div>
                <p className="text-sm font-medium text-ink-500 dark:text-ink-400 mb-1">
                  {error}
                </p>
                <p className="text-xs text-ink-400 mb-3">网络异常，请稍后重试</p>
                <button
                  onClick={() => fetchNotifications()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 transition-colors"
                >
                  <RefreshCw size={12} />
                  重试
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-ink-400 dark:text-ink-500">
                <Bell size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">暂无通知</p>
                <p className="text-xs mt-1">当有人评论、创建分支或审核合并时会收到通知</p>
              </div>
            ) : (
              <div className="divide-y divide-ink-50 dark:divide-ink-700/50">
                {notifications.map((n) => {
                  const cfg = getTypeConfig(n.type);
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n.id)}
                      className={`w-full flex items-start gap-3 px-5 py-3.5 hover:bg-ink-50 dark:hover:bg-ink-700/50 transition-colors text-left ${
                        !n.isRead ? 'bg-accent-50/30 dark:bg-accent-500/5' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <span className={cfg.color}>{cfg.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed line-clamp-2 ${
                          !n.isRead
                            ? 'font-bold text-ink-800 dark:text-white'
                            : 'font-medium text-ink-500 dark:text-ink-400'
                        }`}>
                          {n.message}
                        </p>
                        <p className="text-[11px] text-ink-400 dark:text-ink-500 mt-1">
                          {formatTime(n.createdAt)}
                        </p>
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 bg-accent-400 rounded-full shrink-0 mt-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
