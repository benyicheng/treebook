import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Route, Eye, TrendingUp, Users, Plus } from 'lucide-react';
import client from '../../../api/client';
import { useAuthStore } from '../../../stores/useAuthStore';

interface HotPathItem {
  id: string;
  title: string;
  description: string | null;
  creatorName: string;
  viewCount: number;
  startCount: number;
  completionCount: number;
  nodeCount: number;
}

interface HotPathsSidebarProps {
  storyId: string;
}

const HotPathsSidebar: React.FC<HotPathsSidebarProps> = ({ storyId }) => {
  const [paths, setPaths] = useState<HotPathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!storyId) return;
    setLoading(true);
    client
      .get(`/stories/${storyId}/map`)
      .then((res) => {
        const data = res.data;
        setPaths(data.hotPaths || []);
      })
      .catch(() => {
        setPaths([]);
      })
      .finally(() => setLoading(false));
  }, [storyId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-ink-100 dark:bg-ink-700 rounded w-1/2" />
          <div className="h-16 bg-ink-100 dark:bg-ink-700 rounded" />
          <div className="h-16 bg-ink-100 dark:bg-ink-700 rounded" />
        </div>
      </div>
    );
  }

  if (paths.length === 0) return null;

  return (
    <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-ink-100 dark:border-ink-700">
        <Route size={18} className="text-accent-400" />
        <h3 className="text-sm font-bold text-ink-800 dark:text-white">热门阅读路径</h3>
        <span className="ml-auto text-[10px] font-bold text-ink-400 bg-ink-100 dark:bg-ink-700 px-2 py-1 rounded-full">
          {paths.length}
        </span>
      </div>
      <div className="divide-y divide-ink-50 dark:divide-ink-700/50">
        {paths.map((path) => (
          <Link
            key={path.id}
            to={`/reading-path/${path.id}`}
            className="block px-5 py-4 hover:bg-ink-50 dark:hover:bg-ink-700/30 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-ink-800 dark:text-white group-hover:text-accent-500 dark:group-hover:text-accent-400 transition-colors truncate">
                  {path.title}
                </h4>
                {path.description && (
                  <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400 line-clamp-1">
                    {path.description}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-ink-400 dark:text-ink-500">
                  {path.nodeCount} 个节点 · by {path.creatorName}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1 text-[10px] text-ink-400">
                  <Eye size={11} />
                  {path.viewCount}
                </span>
                {path.completionCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-green-500">
                    <TrendingUp size={11} />
                    {Math.round((path.completionCount / Math.max(path.startCount, 1)) * 100)}%
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Create button */}
      {user && (
        <button
          onClick={() => navigate(`/reading-path/create?storyId=${storyId}`)}
          className="flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-bold text-accent-500 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 transition-colors border-t border-ink-100 dark:border-ink-700"
        >
          <Plus size={16} />
          创建阅读路径
        </button>
      )}
    </div>
  );
};

export default HotPathsSidebar;
