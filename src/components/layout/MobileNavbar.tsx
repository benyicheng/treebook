import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Edit3, BookOpen, User } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

const MobileNavbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const navItems = [
    { name: '首页', path: '/', icon: Home },
    { name: '搜索', path: '/search', icon: Search },
    {
      name: '创作',
      path: isAuthenticated ? '/story/create' : '/login',
      icon: Edit3,
    },
    {
      name: '最近阅读',
      path: '/reading-paths',
      icon: BookOpen,
    },
    {
      name: '我的',
      path: isAuthenticated ? '/dashboard' : '/login',
      icon: User,
    },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-ink-800/90 backdrop-blur-xl border-t border-ink-100 dark:border-ink-700 z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = isActivePath(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
                isActive
                  ? 'text-accent-500 dark:text-accent-400'
                  : 'text-ink-400 hover:text-ink-500 dark:hover:text-ink-300'
              }`}
            >
              <item.icon size={24} className={isActive ? 'fill-current' : ''} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavbar;
