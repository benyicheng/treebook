import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Star, Library, User } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

const MobileNavbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const navItems = [
    { name: '首页', path: '/', icon: Home },
    { name: '番外', path: '/spinoff', icon: Star },
    { name: '书单', path: '/booklist', icon: Library },
    { name: '我的', path: isAuthenticated ? '/dashboard' : '/login', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
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
