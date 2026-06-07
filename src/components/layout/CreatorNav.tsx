import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, FileEdit, GitBranch, Coins, BarChart3 } from 'lucide-react';
import { useModeStore } from '../../stores/useModeStore';
import { useAuthStore } from '../../stores/useAuthStore';

const creatorItems = [
  { name: '我的作品', path: '/dashboard', icon: Layout },
  { name: '写新章', path: '/story/create', icon: FileEdit },
  { name: '分支管理', path: '/branches?mine=true', icon: GitBranch },
  { name: '收益', path: '/revenue', icon: Coins },
  { name: '数据分析', path: '/dashboard?tab=analytics', icon: BarChart3 },
];

const CreatorNav: React.FC = () => {
  const { mode } = useModeStore();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        mode === 'create' ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="bg-ink-50/80 dark:bg-ink-800/80 backdrop-blur-sm border-b border-ink-100 dark:border-ink-700">
        <div className="max-w-[1600px] mx-auto flex items-center gap-1 px-4 md:px-6 py-2 overflow-x-auto no-scrollbar">
          {creatorItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={(e) => {
                  if (!isAuthenticated) {
                    e.preventDefault();
                    navigate('/login');
                  }
                }}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full md:rounded-xl text-xs md:text-sm font-black transition-all duration-fast whitespace-nowrap shrink-0 min-h-[44px]
                  ${active
                    ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400'
                    : 'text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-700/50'
                  }`}
              >
                <item.icon size={16} className={active ? 'text-accent-600 dark:text-accent-400' : 'opacity-60'} />
                <span className="hidden md:inline">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CreatorNav;
