import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, GitBranch, Home, Layout, Library, LogIn, LogOut, Star, User, Shield, ChevronLeft, ChevronRight, Settings2, Bell, Search, Sparkles, BookMarked, Plus, Coins, Globe, Crown } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSiteConfigStore } from '../stores/useSiteConfigStore';
import MobileNavbar from '../components/MobileNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import PermissionGate from '../components/PermissionGate';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { config, fetchConfig } = useSiteConfigStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  // 动态更新 Favicon 和 标题
  useEffect(() => {
    if (config.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) { link.href = config.faviconUrl; }
      else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = config.faviconUrl;
        document.head.appendChild(newLink);
      }
    }
    if (config.siteName) { document.title = config.siteName; }
  }, [config.faviconUrl, config.siteName]);

  // 顶部主要分类入口
  const categoryItems = [
    { name: '全部探索', path: '/', icon: Globe },
    { name: '官方主线', path: '/?filter=official', icon: Crown },
    { name: '平行支线', path: '/spinoff', icon: GitBranch },
    { name: '精选书单', path: '/booklist', icon: BookMarked },
    { name: '完本精选', path: '/?filter=completed', icon: BookOpen },
  ];

  // 左侧管理功能入口
  const managementItems = [
    { name: '创作台', path: '/dashboard', icon: Layout },
    { name: '收益中心', path: '/revenue', icon: Coins },
    { name: '个人资料', path: '/profile', icon: User },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' && !location.search;
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname.startsWith(path);
  };

  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      
      {/* ══════ 顶部主导航 (Fixed Top - Single Row) ══════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-[1600px] mx-auto h-20 flex items-center justify-between px-6 gap-8">
          
          {/* 左侧：Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              {config.logoUrl
                ? <img src={config.logoUrl} alt="logo" className="w-full h-full object-contain" />
                : <Layout size={22} className="text-white" />
              }
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white hidden lg:block">
              {config.siteName || '平行宇宙'}
            </span>
          </Link>

          {/* 中间：分类入口 (一排放置) */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
            {categoryItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all relative whitespace-nowrap
                    ${active 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' 
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                >
                  <item.icon size={16} className={active ? 'text-blue-600' : 'opacity-60'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 右侧：搜索 + 用户操作 */}
          <div className="flex items-center gap-4 shrink-0">
            <form onSubmit={handleSearch} className="relative hidden xl:flex items-center group">
              <Search size={16} className="absolute left-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 h-10 bg-gray-100 dark:bg-gray-800 border-none rounded-full pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-gray-800 focus:w-64 transition-all outline-none"
              />
            </form>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/story/create"
                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-black transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                  >
                    <Plus size={16} strokeWidth={3} />
                    开始创作
                  </Link>
                  <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-all relative">
                    <Bell size={20} />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full" />
                  </button>
                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />
                  <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-sm hover:ring-2 hover:ring-blue-500 transition-all overflow-hidden">
                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-blue-600 font-black text-sm overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        user?.username?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                  </button>
                </>
              ) : (
                <Link to="/login" className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-black hover:opacity-90 transition-all shadow-md">
                  立即登录
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-20">
        {/* ══════ 侧边栏触发区 & 悬浮菜单 (Floating Sidebar) ══════ */}
        <aside 
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          className={`
            fixed left-0 bottom-0 top-20 z-40 transition-all duration-500 ease-in-out group
            ${isSidebarHovered 
              ? 'w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-100 dark:border-gray-800 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.1)]' 
              : 'w-2 bg-transparent hover:bg-blue-500/10'}
            hidden lg:flex flex-col overflow-hidden
          `}
        >
          <div className={`flex-1 flex flex-col px-8 pb-8 overflow-y-auto no-scrollbar transition-all duration-500 transform ${isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
            <div className="space-y-10 pt-4">
              {/* 管理中心 */}
              <div className="space-y-3">
                <p className="px-4 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Workbench</p>
                <div className="space-y-1">
                  {managementItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group/item
                          ${active
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 translate-x-1'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                        <item.icon size={20} className={`transition-transform group-hover/item:scale-110 ${active ? 'text-white' : 'opacity-60'}`} />
                        <span className="text-sm font-black">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* 系统工具 */}
              <PermissionGate permission="role:read">
                <div className="space-y-3">
                  <p className="px-4 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Admin Control</p>
                  <div className="space-y-1">
                    {[
                      { path: '/admin/roles', icon: Shield, name: '角色权限' },
                      { path: '/admin/cms', icon: Settings2, name: '站点管理' },
                    ].map((item) => {
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group/item
                            ${active
                              ? 'bg-violet-600 text-white shadow-xl shadow-violet-500/30 translate-x-1'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                          <item.icon size={20} className={`transition-transform group-hover/item:scale-110 ${active ? 'text-white' : 'opacity-60'}`} />
                          <span className="text-sm font-black">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </PermissionGate>
            </div>

            {/* 底部退出 */}
            {isAuthenticated && (
              <div className="mt-auto pt-8 border-t border-gray-50 dark:border-gray-800/50">
                <button 
                  onClick={() => logout()}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-black text-sm uppercase tracking-widest"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ══════ 主内容区 (Main Scrollable) ══════ */}
        <main className="flex-1 p-8 overflow-hidden transition-all duration-500">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname + location.search}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Navbar */}
      <MobileNavbar />
    </div>
  );
};

export default MainLayout;
