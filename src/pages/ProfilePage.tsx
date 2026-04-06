import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error, updateMe } = useAuthStore();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user) {
      setUsername(user.username || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [isAuthenticated, navigate, user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMe({ username: username.trim(), avatarUrl: avatarUrl.trim() || undefined });
    if (!useAuthStore.getState().error) {
      alert('资料已更新');
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 space-y-8">
        <div className="space-y-1">
          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">个人资料</div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">编辑资料</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">修改用户名与头像链接。</p>
        </div>

          <div className="flex items-center gap-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-blue-600 font-black text-2xl overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  username?.[0]?.toUpperCase() || '?'
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-black text-gray-900 dark:text-white">头像预览</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">输入下方链接后自动预览</div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">邮箱</label>
            <div className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold">
              {user?.email}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">用户名</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-gray-900 dark:text-white"
              required
              minLength={2}
              maxLength={32}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">头像 URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-gray-900 dark:text-white"
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
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
            >
              返回
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
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

