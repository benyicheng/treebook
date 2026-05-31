import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Route, Eye, TrendingUp, Clock, User, ChevronRight, Route as RouteIcon, Plus } from 'lucide-react';
import client from '../../api/client';
import { useAuthStore } from '../../stores/useAuthStore';

interface PathListItem {
  id: string;
  title: string;
  description: string | null;
  origin: string;
  creator: { id: string; username: string; avatarUrl: string | null };
  viewCount: number;
  startCount: number;
  completionCount: number;
  nodeCount: number;
  createdAt: string;
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-ink-100 dark:bg-ink-700 rounded ${className || ''}`} />
);

const ReadingPathsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [paths, setPaths] = useState<PathListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'hot' | 'new'>('hot');
  const [showStoryPicker, setShowStoryPicker] = useState(false);
  const [stories, setStories] = useState<{ id: string; title: string; coverImage?: string }[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);

  const openCreate = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Fetch stories to pick from
    setShowStoryPicker(true);
    setStoriesLoading(true);
    try {
      const res = await client.get('/stories', { params: { limit: 50 } });
      const items = res.data?.items || res.data?.data || res.data || [];
      setStories(Array.isArray(items) ? items : []);
    } catch {
      setStories([]);
    } finally {
      setStoriesLoading(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await client.get('/reading-paths', { params: { sortBy, limit: 30 } });
      setPaths(res.data?.items || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch reading paths', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sortBy]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent-500 font-black text-xs uppercase tracking-widest mb-2">
            <Route size={14} />
            阅读路径
          </div>
          <h1 className="text-3xl font-black text-ink-800 dark:text-white tracking-tight">
            探索阅读路径
          </h1>
          <p className="mt-2 text-ink-500 dark:text-ink-400 text-base font-light">
            由用户精心编排的阅读路线，带你领略平行宇宙的魅力
          </p>
        </div>

        {/* Create + Sort toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus size={14} />
            创建阅读路径
          </button>
          <div className="flex items-center gap-1 bg-ink-100 dark:bg-ink-700 rounded-xl p-1">
          <button
            onClick={() => setSortBy('hot')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              sortBy === 'hot'
                ? 'bg-white dark:bg-ink-600 text-accent-600 dark:text-indigo-400 shadow-sm'
                : 'text-ink-500 hover:text-ink-600 dark:hover:text-ink-300'
            }`}
          >
            <TrendingUp size={14} />
            最热门
          </button>
          <button
            onClick={() => setSortBy('new')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              sortBy === 'new'
                ? 'bg-white dark:bg-ink-600 text-accent-600 dark:text-indigo-400 shadow-sm'
                : 'text-ink-500 hover:text-ink-600 dark:hover:text-ink-300'
            }`}
          >
            <Clock size={14} />
            最新
            </button>
          </div>
        </div>
      </div>

      {/* Story Picker Modal */}
      {showStoryPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowStoryPicker(false)}>
          <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-ink-100 dark:border-ink-700">
              <h3 className="text-lg font-black text-ink-800 dark:text-white">选择故事</h3>
              <p className="text-sm text-ink-500 mt-1">为哪个故事创建阅读路径？</p>
            </div>
            <div className="p-2 overflow-y-auto max-h-[60vh]">
              {storiesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : stories.length === 0 ? (
                <div className="py-12 text-center">
                  <Route size={40} className="mx-auto text-ink-200 dark:text-ink-600 mb-3" />
                  <p className="text-ink-400 font-medium">暂无可选故事</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {stories.map((story) => (
                    <button
                      key={story.id}
                      onClick={() => navigate(`/reading-path/create?storyId=${story.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-ink-50 dark:hover:bg-ink-700/50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-accent-400 flex items-center justify-center text-white font-bold shrink-0">
                        {story.title[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink-800 dark:text-white truncate">{story.title}</p>
                        <p className="text-xs text-ink-400">点击为此故事创建阅读路径</p>
                      </div>
                      <ChevronRight size={16} className="text-ink-300 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-ink-100 dark:border-ink-700 p-6 space-y-3 bg-ink-50 dark:bg-ink-800">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : paths.length === 0 ? (
        <div className="py-24 text-center">
          <Route size={64} className="mx-auto text-ink-200 dark:text-ink-600 mb-6" />
          <p className="text-ink-500 font-black text-2xl">暂无阅读路径</p>
          <p className="text-ink-400 mt-2 mb-6">还没有人创建阅读路径，来做第一个吧！</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <Plus size={16} />
            创建第一条阅读路径
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paths.map((p, i) => (
            <Link
              key={p.id}
              to={`/reading-path/${p.id}`}
              className="group block bg-ink-50 dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 p-6 hover:shadow-xl hover:shadow-accent-500/5 hover:border-indigo-200 dark:hover:border-indigo-800 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Gradient top accent */}
              <div className={`h-1.5 -mx-6 -mt-6 mb-5 rounded-t-2xl bg-gradient-to-r ${
                ['from-indigo-400 to-accent-400', 'from-blue-400 to-cyan-500', 'from-fuchsia-400 to-pink-500', 'from-amber-400 to-orange-500'][i % 4]
              }`} />

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-accent-600 dark:text-indigo-400">
                      {p.origin === 'author' ? '作者原创' : '社区精选'}
                    </span>
                    <span className="text-[10px] text-ink-400 flex items-center gap-1">
                      <RouteIcon size={10} />
                      {p.nodeCount} 个节点
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-ink-800 dark:text-white group-hover:text-accent-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-ink-50 dark:border-ink-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-accent-600 dark:text-indigo-400 font-bold text-[10px]">
                      {p.creator.username?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-500 dark:text-ink-300">{p.creator.username}</p>
                      <p className="text-[10px] text-ink-400">
                        {new Date(p.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-400">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {p.viewCount}
                    </span>
                    <span className="flex items-center gap-1 text-accent-500 font-bold group-hover:gap-2 transition-all">
                      查看 <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadingPathsListPage;
