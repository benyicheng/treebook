import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { authService } from '../api/authService';
import { useQuery } from '@tanstack/react-query';
import FollowButton from '../components/FollowButton';
import { useToast } from '../components/Toast';
import ActivityFeed from '../components/ActivityFeed';
import {
  Users, BookOpen, GitBranch, Sparkles, Calendar,
  Loader2, ArrowLeft, Settings, AlertCircle,
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const { user, isAuthenticated, isLoading, error, updateMe } = useAuthStore();

  // Edit mode state
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const { addToast } = useToast();

  // Determine if this is own profile or someone else's
  const isOwnProfile = !userId || (user && user.id === userId);
  const targetUserId = userId || user?.id;

  // React Query: fetch public profile for view mode
  const {
    data: publicProfile = null,
    isLoading: profileLoading,
    error: profileErrorRaw,
  } = useQuery({
    queryKey: ['profile', targetUserId],
    queryFn: () => authService.getPublicProfile(targetUserId!),
    enabled: !isOwnProfile && !!targetUserId,
  });
  const profileError = profileErrorRaw ? '加载用户资料失败' : null;

  // Edit mode: populate form from user data
  useEffect(() => {
    if (!isOwnProfile) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user) {
      setUsername(user.username || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [isAuthenticated, navigate, user, isOwnProfile]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMe({ username: username.trim(), avatarUrl: avatarUrl.trim() || undefined });
    if (!useAuthStore.getState().error) {
      addToast('success', '资料已更新');
      navigate('/dashboard');
    }
  };

  // ===== View Mode: Other user's public profile =====
  if (!isOwnProfile) {
    if (profileLoading) {
      return (
        <div className="max-w-3xl mx-auto py-10 px-6">
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-accent-500" />
          </div>
        </div>
      );
    }

    if (profileError || !publicProfile) {
      return (
        <div className="max-w-3xl mx-auto py-10 px-6">
          <div className="flex flex-col items-center justify-center py-20 text-ink-400">
            <AlertCircle size={48} className="mb-4 opacity-30" />
            <p className="font-bold text-lg">{profileError || '用户不存在'}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-6 py-2 bg-ink-100 dark:bg-ink-700 rounded-xl font-bold hover:bg-ink-200 dark:hover:bg-ink-600 transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>

        {/* Profile header */}
        <div className="bg-white dark:bg-ink-800 rounded-3xl border border-ink-100 dark:border-ink-700 shadow-sm overflow-hidden">
          {/* Cover banner */}
          <div className="h-32 bg-gradient-to-r from-accent-400 via-accent-500 to-accent-500" />

          <div className="px-8 pb-8">
            {/* Avatar + Follow */}
            <div className="flex items-end justify-between -mt-12 mb-6">
              <div className="w-24 h-24 rounded-full ring-4 ring-white dark:ring-ink-800 bg-gradient-to-br from-accent-400 to-accent-600 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-full bg-ink-50 dark:bg-ink-800 flex items-center justify-center text-accent-500 font-black text-3xl overflow-hidden">
                  {publicProfile.avatarUrl ? (
                    <img src={publicProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    publicProfile.username?.[0]?.toUpperCase() || '?'
                  )}
                </div>
              </div>
              <div className="mb-1">
                <FollowButton targetUserId={publicProfile.id} size="md" />
              </div>
            </div>

            {/* Name + Role */}
            <div className="mb-6">
              <h1 className="text-2xl font-black text-ink-800 dark:text-white">
                {publicProfile.username}
              </h1>
              <span className="inline-block mt-1 px-3 py-1 bg-ink-100 dark:bg-ink-700 rounded-full text-xs font-bold text-ink-500 dark:text-ink-400">
                {publicProfile.role === 'admin' ? '管理员' :
                 publicProfile.role === 'author' ? '作者' :
                 publicProfile.role === 'editor' ? '编辑' : '读者'}
              </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-ink-50 dark:bg-ink-700/50 rounded-2xl">
                <Users size={20} className="mx-auto mb-1 text-accent-400" />
                <div className="text-xl font-black text-ink-800 dark:text-white">{publicProfile.followerCount}</div>
                <div className="text-xs text-ink-400 font-bold">粉丝</div>
              </div>
              <div className="text-center p-4 bg-ink-50 dark:bg-ink-700/50 rounded-2xl">
                <Users size={20} className="mx-auto mb-1 text-accent-500" />
                <div className="text-xl font-black text-ink-800 dark:text-white">{publicProfile.followingCount}</div>
                <div className="text-xs text-ink-400 font-bold">关注</div>
              </div>
              <div className="text-center p-4 bg-ink-50 dark:bg-ink-700/50 rounded-2xl">
                <BookOpen size={20} className="mx-auto mb-1 text-accent-400" />
                <div className="text-xl font-black text-ink-800 dark:text-white">{publicProfile.storyCount}</div>
                <div className="text-xs text-ink-400 font-bold">故事</div>
              </div>
              <div className="text-center p-4 bg-ink-50 dark:bg-ink-700/50 rounded-2xl">
                <GitBranch size={20} className="mx-auto mb-1 text-purple-500" />
                <div className="text-xl font-black text-ink-800 dark:text-white">{publicProfile.branchCount}</div>
                <div className="text-xs text-ink-400 font-bold">分支</div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-ink-400">
              <Calendar size={12} />
              <span>{new Date(publicProfile.createdAt).toLocaleDateString()} 加入</span>
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="mt-8">
          <h2 className="text-lg font-black text-ink-800 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            动态
          </h2>
          <div className="bg-white dark:bg-ink-800 rounded-3xl border border-ink-100 dark:border-ink-700 shadow-sm">
            <ActivityFeed mode="user" userId={publicProfile.id} limit={20} />
          </div>
        </div>
      </div>
    );
  }

  // ===== Edit Mode: Own profile =====
  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="bg-white dark:bg-ink-800 rounded-3xl border border-ink-100 dark:border-ink-700 shadow-sm p-8 space-y-8">
        <div className="space-y-1">
          <div className="text-xs font-black text-ink-400 uppercase tracking-widest">个人资料</div>
          <h1 className="text-3xl font-black text-ink-800 dark:text-white">编辑资料</h1>
          <p className="text-ink-500 dark:text-ink-400 text-sm">修改用户名与头像链接。</p>
        </div>

        <div className="flex items-center gap-6 p-6 bg-ink-50 dark:bg-ink-700/50 rounded-3xl border border-ink-100 dark:border-ink-700">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 p-0.5 shadow-lg">
            <div className="w-full h-full rounded-full bg-ink-50 dark:bg-ink-800 flex items-center justify-center text-accent-500 font-black text-2xl overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                username?.[0]?.toUpperCase() || '?'
              )}
            </div>
          </div>
          <div>
            <div className="text-sm font-black text-ink-800 dark:text-white">头像预览</div>
            <div className="text-xs text-ink-500 dark:text-ink-400 mt-1">输入下方链接后自动预览</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-ink-400 uppercase tracking-widest">邮箱</label>
            <div className="px-4 py-3 rounded-2xl bg-ink-50 dark:bg-ink-700 text-ink-600 dark:text-ink-200 font-bold">
              {user?.email}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-ink-400 uppercase tracking-widest">用户名</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-ink-50 dark:bg-ink-700 border border-transparent focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none font-bold text-ink-800 dark:text-white"
              required
              minLength={2}
              maxLength={32}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-ink-400 uppercase tracking-widest">头像 URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-ink-50 dark:bg-ink-700 border border-transparent focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none font-bold text-ink-800 dark:text-white"
              placeholder="https://..."
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 font-bold text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 bg-ink-100 dark:bg-ink-700 text-ink-800 dark:text-white rounded-2xl font-black hover:bg-ink-200 dark:hover:bg-ink-600 transition-all active:scale-95"
            >
              返回
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-accent-500 text-white rounded-2xl font-black hover:bg-accent-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
