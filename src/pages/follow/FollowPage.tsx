import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  GitBranch,
  Sparkles,
  BookOpen,
  ArrowLeft,
  Clock,
  User,
  Activity,
  Eye,
  UserPlus,
  UserMinus,
  Compass,
  Route,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToast } from '../../components/Toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followService } from '../../api/followService';
import client from '../../api/client';
import { queryKeys } from '../../lib/queryKeys';

interface Follower {
  id: string;
  username: string;
  avatarUrl: string | null;
  followerCount?: number;
  followingCount?: number;
}

interface ActivityItem {
  id: string;
  type: 'story' | 'branch' | 'spinoff';
  title: string;
  description: string;
  storyId?: string;
  author: { id: string; username: string; avatarUrl: string | null } | null;
  createdAt: string;
  viewCount?: number;
  likeCount?: number;
}

interface SuggestedUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  followerCount: number;
  bio?: string;
}

// ── Constants ──
const TYPE_CONFIG = {
  story: {
    icon: BookOpen,
    label: '故事',
    color: 'from-blue-400 to-cyan-500',
    bg: 'bg-accent-50 dark:bg-accent-500/10',
    text: 'text-accent-500 dark:text-accent-400',
    border: 'border-accent-200 dark:border-accent-600',
    hoverBorder: 'hover:border-accent-300 dark:hover:border-accent-600',
    badgeBg: 'bg-accent-100 dark:bg-accent-500/15',
    badgeText: 'text-accent-600 dark:text-accent-300',
  },
  branch: {
    icon: GitBranch,
    label: '分支',
    color: 'from-emerald-400 to-teal-500',
    bg: 'bg-accent-50 dark:bg-accent-500/10',
    text: 'text-accent-500 dark:text-accent-400',
    border: 'border-emerald-200 dark:border-accent-600',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-accent-600',
    badgeBg: 'bg-accent-100 dark:bg-accent-500/15',
    badgeText: 'text-accent-600 dark:text-accent-300',
  },
  spinoff: {
    icon: Sparkles,
    label: '番外',
    color: 'from-purple-400 to-pink-500',
    bg: 'bg-purple-50 dark:bg-accent-500/10',
    text: 'text-accent-500 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
    badgeBg: 'bg-accent-100 dark:bg-purple-900/30',
    badgeText: 'text-purple-700 dark:text-purple-300',
  },
} as const;

const TIME_LABELS: [number, number, string][] = [
  [60, 1, '分钟前'],
  [3600, 60, '分钟前'],
  [86400, 3600, '小时前'],
  [2592000, 86400, '天前'],
  [31104000, 2592000, '月前'],
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return '刚刚';
  for (const [threshold, divisor, suffix] of TIME_LABELS) {
    if (diff < threshold * 1000) return `${Math.floor(diff / (divisor * 1000))}${suffix}`;
  }
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

function getItemLink(item: ActivityItem): string {
  switch (item.type) {
    case 'story': return `/story/${item.id}`;
    case 'branch': return `/branch/${item.id}`;
    case 'spinoff': return `/spinoff/${item.id}`;
    default: return '#';
  }
}

// ── Component ──
const FollowPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'activity';
  const [tab, setTab] = useState<'activity' | 'followers' | 'following'>(
    (['activity', 'followers', 'following'].includes(tabParam) ? tabParam : 'activity') as any
  );
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const qc = useQueryClient();

  // ── Activity feed (tab: activity) ──
  const {
    data: activities = [],
    isLoading: activityLoading,
  } = useQuery({
    queryKey: queryKeys.follow.activity,
    queryFn: () => followService.getActivity(undefined, 30).then(r => r.data || []),
    enabled: tab === 'activity' && !!user,
  });

  // ── Followers / Following (tab: followers/following) ──
  const {
    data: userList = [],
    isLoading: listLoading,
  } = useQuery({
    queryKey: tab === 'followers'
      ? queryKeys.follow.followers(user?.id || '')
      : queryKeys.follow.following(user?.id || ''),
    queryFn: () => {
      if (!user) return [] as any;
      if (tab === 'followers') return followService.getFollowers(user.id).then(r => r.data || []);
      return followService.getFollowing(user.id).then(r => r.data || []);
    },
    enabled: !!user && (tab === 'followers' || tab === 'following'),
  });

  // ── Batch follow status (for followers tab) ──
  const { data: followingMap = {} } = useQuery({
    queryKey: ['follow', 'batch-status', userList.map((u: any) => u.id).join(',')],
    queryFn: () => followService.batchFollowStatus(userList.map((u: any) => u.id)).then(r => r),
    enabled: userList.length > 0 && tab === 'followers',
  });

  // ── Suggested users (when activity is empty) ──
  const { data: suggestedUsers = [] } = useQuery({
    queryKey: ['users', 'suggested'],
    queryFn: () => client.get('/users', { params: { sortBy: 'popular', limit: 5 } }).then(r => r.data?.data || r.data || []),
    enabled: tab === 'activity' && activities.length === 0,
  });

  // ── Follow / Unfollow mutation ──
  const followMutation = useMutation({
    mutationFn: ({ targetId, action }: { targetId: string; action: 'follow' | 'unfollow' }) =>
      action === 'follow'
        ? followService.follow(targetId)
        : followService.unfollow(targetId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.follow.all });
      if (tab === 'following') {
        // Remove from list if unfollowed
        if (vars.action === 'unfollow') {
          // The list will be refetched automatically
        }
      }
    },
    onError: (err: any) => {
      addToast('error', err?.response?.data?.error?.message || '操作失败');
    },
  });

  const switchTab = useCallback((t: 'activity' | 'followers' | 'following') => {
    setTab(t);
    setSearchParams({ tab: t });
  }, [setSearchParams]);

  const handleFollow = (targetId: string) => {
    if (!user) { navigate('/login'); return; }
    followMutation.mutate({ targetId, action: 'follow' });
  };

  const handleUnfollow = (targetId: string) => {
    followMutation.mutate({ targetId, action: 'unfollow' });
  };

  const followLoading = followMutation.isPending;

  // ── Stats ──
  const stats = {
    following: tab === 'following' ? userList.length : undefined,
    followers: tab === 'followers' ? userList.length : undefined,
    unread: activities.length,
  };

  // ── Not logged in ──
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-xl shadow-pink-500/20">
            <Users size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-ink-800 dark:text-white mb-3">登录后查看关注</h1>
          <p className="text-ink-500 dark:text-ink-400 mb-8 leading-relaxed">
            登录后可以关注作者、查看他们的最新作品动态，打造属于你的阅读时间线。
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-black shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            <User size={18} />
            立即登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
          >
            <ArrowLeft size={18} className="text-ink-400" />
          </button>
          <h1 className="text-xl font-black text-ink-800 dark:text-white">关注</h1>
        </div>
        <Link
          to="/discover"
          className="flex items-center gap-1.5 text-xs font-bold text-ink-400 hover:text-ink-500 dark:hover:text-ink-300 transition-colors"
        >
          <Compass size={14} />
          发现作者
        </Link>
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-ink-100 dark:bg-ink-700 rounded-2xl p-1.5 gap-1">
        {([
          { key: 'activity', label: '动态' },
          { key: 'following', label: '正在关注' },
          { key: 'followers', label: '关注者' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              tab === key
                ? 'bg-white dark:bg-ink-600 text-ink-800 dark:text-white shadow-sm'
                : 'text-ink-500 dark:text-ink-400 hover:text-ink-600 dark:hover:text-ink-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Activity Tab ── */}
      {tab === 'activity' && (
        <>
          {activityLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 p-4 rounded-2xl bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-700">
                  <div className="w-10 h-10 rounded-full bg-ink-100 dark:bg-ink-700 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-ink-100 dark:bg-ink-700 rounded animate-pulse w-1/3" />
                    <div className="h-4 bg-ink-100 dark:bg-ink-700 rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-ink-100 dark:bg-ink-700 rounded animate-pulse w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            /* ── Empty state with suggestions ── */
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-ink-100 to-ink-200 dark:from-ink-700 dark:to-ink-600 flex items-center justify-center">
                <Activity size={28} className="text-ink-400" />
              </div>
              <div>
                <p className="text-base font-bold text-ink-600 dark:text-ink-300 mb-1">还没有动态</p>
                <p className="text-sm text-ink-400 max-w-xs mx-auto leading-relaxed">
                  关注你喜欢的作者，他们的新作品会出现在这里
                </p>
              </div>

              {/* Suggested users */}
              {suggestedUsers.length > 0 && (
                <div className="max-w-md mx-auto">
                  <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">推荐关注</p>
                  <div className="space-y-2">
                    {(suggestedUsers as SuggestedUser[]).map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-700"
                      >
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shrink-0">
                            <User size={16} className="text-white" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-ink-800 dark:text-white">{u.username}</p>
                          <p className="text-xs text-ink-400">{u.followerCount || 0} 关注者{u.bio ? ` · ${u.bio}` : ''}</p>
                        </div>
                        <button
                          onClick={() => handleFollow(u.id)}
                          disabled={followMutation.isPending}
                          className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 text-xs font-bold border border-pink-200 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/30 disabled:opacity-50 transition-colors shrink-0"
                        >
                          <UserPlus size={13} />
                          {followMutation.isPending ? '...' : '关注'}
                        </button>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/discover"
                    className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-ink-400 hover:text-ink-500 dark:hover:text-ink-300 transition-colors"
                  >
                    <Compass size={13} />
                    发现更多作者
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((item) => {
                const config = TYPE_CONFIG[item.type];
                const Icon = config.icon;
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={getItemLink(item)}
                    className={`group block p-4 rounded-2xl bg-ink-50 dark:bg-ink-800 border ${config.border} ${config.hoverBorder} hover:shadow-md transition-all duration-300`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Author avatar */}
                      <div className="relative shrink-0">
                        {item.author?.avatarUrl ? (
                          <img src={item.author.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-ink-800" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                            <User size={16} className="text-white" />
                          </div>
                        )}
                        {/* Type icon badge */}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${config.badgeBg} border-2 border-white dark:border-ink-800 flex items-center justify-center`}>
                          <Icon size={10} className={config.badgeText} />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Header row */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-ink-800 dark:text-white">
                            {item.author?.username || '未知'}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${config.badgeBg} ${config.badgeText}`}>
                            <Icon size={10} />
                            {config.label}
                          </span>
                        </div>

                        {/* Title */}
                        <p className="text-sm font-semibold text-ink-700 dark:text-ink-200 group-hover:text-ink-800 dark:group-hover:text-white transition-colors line-clamp-1 mb-1">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-xs text-ink-400 dark:text-ink-500 line-clamp-1 mb-2">{item.description}</p>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center gap-3 text-[10px] text-ink-400">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {timeAgo(item.createdAt)}
                          </span>
                          {item.viewCount !== undefined && (
                            <span className="flex items-center gap-1">
                              <Eye size={10} />
                              {item.viewCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Followers / Following Tabs ── */}
      {(tab === 'followers' || tab === 'following') && (
        <div className="space-y-3">
          {listLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-700">
                  <div className="w-12 h-12 rounded-full bg-ink-100 dark:bg-ink-700 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-ink-100 dark:bg-ink-700 rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-ink-100 dark:bg-ink-700 rounded animate-pulse w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            userList.map((u: any) => {
              const isFollowing = !!followingMap[u.id];
              return (
                <div key={u.id} className="flex items-center gap-3 p-4 rounded-2xl bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-700">
                  <Link to={`/user/${u.id}`} className="shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                        <User size={18} className="text-white" />
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/user/${u.id}`} className="text-sm font-bold text-ink-800 dark:text-white hover:text-pink-600 transition-colors">
                      {u.username}
                    </Link>
                    <p className="text-xs text-ink-400">{u.followerCount || 0} 关注者</p>
                  </div>
                  {tab === 'followers' && (
                    <button
                      onClick={() => isFollowing ? handleUnfollow(u.id) : handleFollow(u.id)}
                      disabled={followMutation.isPending}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        isFollowing
                          ? 'bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
                          : 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/30'
                      }`}
                    >
                      {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
                      {followMutation.isPending ? '...' : (isFollowing ? '取消关注' : '关注')}
                    </button>
                  )}
                  {tab === 'following' && (
                    <button
                      onClick={() => handleUnfollow(u.id)}
                      disabled={followMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all shrink-0"
                    >
                      <UserMinus size={14} />
                      {followMutation.isPending ? '...' : '取消关注'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default FollowPage;
