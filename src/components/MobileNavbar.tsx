import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, GitBranch, Library, User, Route, Users, Plus } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

const MobileNavbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const navItems = [
    { name: '首页', path: '/', icon: Home },
    { name: '关注', path: '/follow', icon: Users },
    { name: '分支', path: '/branches', icon: GitBranch },
    { name: '书单', path: '/booklist', icon: Library },
    { name: '我的', path: isAuthenticated ? '/dashboard' : '/login', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-ink-800/90 backdrop-blur-xl border-t border-ink-100 dark:border-ink-700 z-50 pb-safe">
      {/* Floating Create Button (FAB) */}
      {isAuthenticated && (
        <Link
          to="/story/create"
          className="fixed bottom-20 right-5 w-14 h-14 bg-gradient-to-br from-accent-400 to-accent-500 text-white rounded-full shadow-xl hover:shadow-accent-400/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-[60]"
          aria-label="创建新故事"
        >
          <Plus size={26} strokeWidth={3} />
        </Link>
      )}
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
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
