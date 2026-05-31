import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { GitBranch, Home, Layout, LogOut, Star, User, Users, Shield, ShieldCheck, Settings2, Search, BookMarked, Plus, Coins, Crown, Zap, Edit3, ClipboardCheck, Compass, Route } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSiteConfigStore } from '../stores/useSiteConfigStore';
import MobileNavbar from '../components/MobileNavbar';
import NotificationDropdown from '../components/NotificationDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import PermissionGate from '../components/PermissionGate';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, hasPermission } = useAuthStore();
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
    { name: '首页', path: '/', icon: Home },
    { name: '主线', path: '/stories', icon: Crown },
    { name: '分支', path: '/branches', icon: GitBranch },
    { name: '编辑精选', path: '/recommendations', icon: Star },
    { name: '关注', path: '/follow', icon: Users },
    { name: '路径', path: '/reading-paths', icon: Route },
    { name: '探索', path: '/discover', icon: Compass },
    { name: '新书', path: '/new', icon: Zap },
    { name: '书单', path: '/booklist', icon: BookMarked },
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
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
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
  const showAdmin =
    hasPermission('role:read') || hasPermission('review:case:view') || hasPermission('editorial:view');

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-800 flex flex-col transition-colors duration-page">
      
      {/* ══════ 顶部主导航 (Fixed Top - Single Row) ══════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink-50 dark:bg-ink-800 backdrop-blur-xl border-b border-ink-100 dark:border-ink-700 shadow-sm">
        <div className="max-w-[1600px] mx-auto h-20 flex items-center justify-between px-6 gap-8">
          
          {/* 左侧：Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center shadow-md shadow-accent-500/20 group-hover:scale-110 transition-transform duration-fast ease-out-expo">
              {config.logoUrl
                ? <img src={config.logoUrl} alt="logo" className="w-full h-full object-contain" />
                : <Layout size={22} className="text-ink-50" />
              }
            </div>
            <span className="text-xl font-black tracking-tight text-ink-800 dark:text-ink-50 hidden lg:block font-display">
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all duration-fast ease-out-expo relative whitespace-nowrap
                    ${active 
                      ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400' 
                      : 'text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-700/50'
                    }`}
                >
                  <item.icon size={16} className={active ? 'text-accent-600 dark:text-accent-400' : 'opacity-60'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 右侧：搜索 + 用户操作 */}
          <div className="flex items-center gap-4 shrink-0">
            <form onSubmit={handleSearch} className="relative hidden xl:flex items-center group">
              <button type="submit" className="absolute left-4 text-ink-400 group-focus-within:text-accent-500 transition-colors duration-instant" aria-label="搜索">
                <Search size={16} />
              </button>
              <input 
                type="text" 
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 h-10 bg-ink-100 dark:bg-ink-700 border-none rounded-full pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-accent-500/20 focus:bg-ink-50 dark:focus:bg-ink-700 focus:w-64 transition-all duration-normal ease-out-expo outline-none text-ink-700 dark:text-ink-200 placeholder:text-ink-400"
              />
            </form>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <NotificationDropdown />
                  <div className="w-px h-8 bg-ink-200 dark:bg-ink-600 mx-1" />
                  <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 p-0.5 shadow-sm hover:ring-2 hover:ring-accent-500 transition-all duration-fast overflow-hidden">
                    <div className="w-full h-full rounded-full bg-ink-50 dark:bg-ink-800 flex items-center justify-center text-accent-600 font-black text-sm overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        user?.username?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/register" className="text-sm font-black text-ink-400 hover:text-accent-600 transition-colors duration-instant hidden sm:block">
                    注册账号
                  </Link>
                  <Link to="/login" className="px-6 py-2.5 bg-ink-800 dark:bg-ink-50 text-ink-50 dark:text-ink-800 rounded-full text-sm font-black hover:opacity-90 transition-all duration-instant shadow-md">
                    立即登录
                  </Link>
                </div>
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
            fixed left-0 bottom-0 top-20 z-40 transition-all duration-slow ease-out-expo group
            ${isSidebarHovered 
              ? 'w-72 bg-ink-50/95 dark:bg-ink-800/95 backdrop-blur-xl border-r border-ink-100 dark:border-ink-700 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.1)]' 
              : 'w-3 bg-transparent hover:bg-accent-500/20 hover:border-r hover:border-accent-200 dark:hover:border-accent-800/30'}
            hidden lg:flex flex-col overflow-hidden
            ${!isSidebarHovered ? 'cursor-pointer' : ''}
          `}
        >
          <div className={`flex-1 flex flex-col px-8 pb-8 overflow-y-auto no-scrollbar transition-all duration-slow ease-out-expo transform ${isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
            <div className="space-y-10 pt-4">
              {/* 管理中心 */}
              <div className="space-y-3">
                <p className="px-4 text-[10px] font-black text-ink-400 dark:text-ink-500 uppercase tracking-widest">Workbench</p>
                <div className="space-y-1">
                  {managementItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-normal group/item
                          ${active
                            ? 'bg-accent-500 text-ink-50 shadow-md shadow-accent-500/20 translate-x-1'
                            : 'text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700/50 hover:text-ink-700 dark:hover:text-ink-200'
                          }`}
                      >
                        <item.icon size={20} className={`transition-transform duration-fast group-hover/item:scale-110 ${active ? 'text-ink-50' : 'opacity-60'}`} />
                        <span className="text-sm font-black">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* 系统工具 */}
              {showAdmin && (
                <div className="space-y-3">
                  <p className="px-4 text-[10px] font-black text-ink-400 dark:text-ink-500 uppercase tracking-widest">Admin Control</p>
                  <div className="space-y-1">
                    {[
                      ...(hasPermission('role:read') ? [{ path: '/admin/roles', icon: Shield, name: '角色权限' }] : []),
                      ...(hasPermission('user:role:assign') ? [{ path: '/admin/users', icon: Users, name: '用户管理' }] : []),
                      ...(hasPermission('cms:manage') ? [{ path: '/admin/cms', icon: Settings2, name: '站点管理' }] : []),
                      ...(hasPermission('moderation:view') ? [{ path: '/admin/moderation', icon: ShieldCheck, name: '内容审核' }] : []),
                      ...(hasPermission('review:case:view') ? [{ path: '/admin/review-cases', icon: ClipboardCheck, name: '人工复核' }] : []),
                      ...(hasPermission('editorial:view') ? [{ path: '/admin/editorial', icon: Edit3, name: '编辑改稿' }] : []),
                    ].map((item) => {
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-normal group/item
                            ${active
                              ? 'bg-accent-600 text-ink-50 shadow-md shadow-accent-600/20 translate-x-1'
                              : 'text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700/50 hover:text-ink-700 dark:hover:text-ink-200'
                            }`}
                        >
                          <item.icon size={20} className={`transition-transform duration-fast group-hover/item:scale-110 ${active ? 'text-ink-50' : 'opacity-60'}`} />
                          <span className="text-sm font-black">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 底部退出 */}
            {isAuthenticated && (
              <div className="mt-auto pt-8 border-t border-ink-100 dark:border-ink-700/50">
                <button 
                  onClick={() => logout()}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-ink-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-instant font-black text-sm uppercase tracking-widest"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ══════ 主内容区 (Main Scrollable) ══════ */}
        <main className="flex-1 p-8 transition-all duration-slow">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname + location.search}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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
