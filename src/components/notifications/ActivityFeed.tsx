import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { activityService, ActivityItem } from '../../api/activityService';
import { useAuthStore } from '../../stores/useAuthStore';
import { timeAgo } from '../../lib/utils';
import { Avatar } from '../ui';
import {
  Loader2,
  BookOpen,
  GitBranch,
  Sparkles,
  Edit3,
  GitMerge,
  CheckCircle,
  UserPlus,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface ActivityFeedProps {
  mode?: 'feed' | 'user';
  userId?: string; // Required if mode === 'user'
  limit?: number;
  className?: string;
}

const activityConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  story_publish: { icon: BookOpen, label: '发布了新故事', color: 'text-accent-500 bg-accent-50 dark:bg-accent-500/10' },
  branch_create: { icon: GitBranch, label: '创建了分支', color: 'text-accent-500 bg-purple-50 dark:bg-accent-500/10' },
  spinoff_publish: { icon: Sparkles, label: '发布了番外', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  chapter_update: { icon: Edit3, label: '更新了章节', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  merge_request: { icon: GitMerge, label: '发起了合并请求', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  merge_approved: { icon: CheckCircle, label: '合并已通过', color: 'text-accent-500 bg-accent-50 dark:bg-accent-500/10' },
  follow: { icon: UserPlus, label: '关注了用户', color: 'text-accent-600 bg-accent-50 dark:bg-accent-800/20' },
};

const defaultConfig = { icon: FileText, label: '执行了操作', color: 'text-ink-500 bg-ink-50 dark:bg-ink-700' };

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  mode = 'feed',
  userId,
  limit = 30,
  className = '',
}) => {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchActivities = useCallback(async (reset = false) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = mode === 'feed'
        ? await activityService.getFeed(reset ? undefined : cursor ?? undefined, limit)
        : userId
          ? await activityService.getUserActivities(userId, reset ? undefined : cursor ?? undefined, limit)
          : { data: [], nextCursor: null };

      if (reset) {
        setActivities(result.data);
      } else {
        setActivities((prev) => [...prev, ...result.data]);
      }
      setCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null);
    } catch (err: any) {
      setError(err?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [user, mode, userId, cursor, limit]);

  useEffect(() => {
    setActivities([]);
    setCursor(null);
    fetchActivities(true);
  }, [mode, userId]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchActivities();
    }
  };

  const renderActivityContent = (activity: ActivityItem) => {
    const config = activityConfig[activity.type] || defaultConfig;
    const Icon = config.icon;
    const meta = activity.metadata || {};

    switch (activity.type) {
      case 'story_publish':
      case 'branch_create':
      case 'chapter_update':
        return (
          <span>
            {config.label}
            {meta.title && (
              <Link
                to={`/${activity.targetType === 'story' ? 'stories' : activity.targetType + 's'}/${activity.targetId}`}
                className="font-bold text-accent-500 dark:text-accent-400 hover:underline ml-1"
              >
                《{meta.title}》
              </Link>
            )}
          </span>
        );
      case 'spinoff_publish':
        return (
          <span>
            {config.label}
            {meta.title && (
              <Link
                to={`/spinoffs/${activity.targetId}`}
                className="font-bold text-amber-600 dark:text-amber-400 hover:underline ml-1"
              >
                《{meta.title}》
              </Link>
            )}
          </span>
        );
      case 'merge_request':
        return (
          <span>
            {config.label}
            {meta.branchTitle && (
              <span className="font-bold text-orange-600 dark:text-orange-400 ml-1">
                《{meta.branchTitle}》
              </span>
            )}
          </span>
        );
      case 'merge_approved':
        return (
          <span>
            {config.label}
            {meta.branchTitle && (
              <span className="font-bold text-accent-500 dark:text-accent-400 ml-1">
                《{meta.branchTitle}》
              </span>
            )}
            {meta.chaptersMerged && (
              <span className="text-xs text-ink-400 ml-1">
                ({meta.chaptersMerged} 章)
              </span>
            )}
          </span>
        );
      case 'follow':
        return (
          <span>
            {config.label}
            {meta.username && (
              <Link
                to={`/profile/${activity.targetId}`}
                className="font-bold text-accent-600 dark:text-accent-400 hover:underline ml-1"
              >
                {meta.username}
              </Link>
            )}
          </span>
        );
      default:
        return <span>{config.label}</span>;
    }
  };

  if (!user) {
    return (
      <div className={`text-center py-8 text-ink-400 text-sm ${className}`}>
        请先登录查看动态
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-2xl">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {activities.length === 0 && !loading && !error && (
        <div className="text-center py-12 text-ink-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">暂无动态</p>
          <p className="text-xs mt-1">
            {mode === 'feed' ? '关注更多作者以获取动态更新' : '该用户还没有动态'}
          </p>
        </div>
      )}

      <div className="space-y-0.5">
        {activities.map((activity) => {
          const config = activityConfig[activity.type] || defaultConfig;
          const Icon = config.icon;
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 px-4 py-3 hover:bg-ink-50 dark:hover:bg-ink-700/50 rounded-2xl transition-colors"
            >
              {/* Avatar */}
              <Link
                to={`/profile/${activity.actor.id}`}
                className="shrink-0"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <Avatar src={activity.actor.avatarUrl} alt={activity.actor.username} fallback={activity.actor.username?.[0]} size="sm" className="w-full h-full" />
                  </div>
                </div>
              </Link>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <Link
                    to={`/profile/${activity.actor.id}`}
                    className="font-bold text-ink-800 dark:text-white hover:underline"
                  >
                    {activity.actor.username}
                  </Link>
                  {' '}
                  <span className="text-ink-500 dark:text-ink-400">
                    {renderActivityContent(activity)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`p-0.5 rounded ${config.color}`}>
                    <Icon size={12} />
                  </div>
                  <span className="text-xs text-ink-400">{timeAgo(activity.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 text-sm font-bold text-accent-500 hover:text-accent-600 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                加载中...
              </span>
            ) : (
              '加载更多'
            )}
          </button>
        </div>
      )}

      {loading && activities.length === 0 && (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-accent-500" />
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
