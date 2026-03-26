import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, GitBranch, Home, Layout, Library, LogIn, LogOut, Star, User, Shield, ChevronLeft, ChevronRight, Settings2, Bell, Search, Sparkles, BookMarked } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSiteConfigStore } from '../stores/useSiteConfigStore';
import MobileNavbar from '../components/MobileNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import PermissionGate from '../components/PermissionGate';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const { config, fetchConfig } = useSiteConfigStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const navItems = [
    { name: '首页', path: '/', icon: Home, desc: '发现精彩故事' },
    { name: '精彩番外', path: '/spinoff', icon: Sparkles, desc: '探索平行宇宙' },
    { name: '精选书单', path: '/booklist', icon: BookMarked, desc: '编辑精心挑选' },
  ];

  const handleTestLogin = async (role: 'author' | 'reader') => {
    const email = role === 'author' ? 'author@example.com' : 'reader@example.com';
    await login({ email, password: 'password123' });
    setShowAuthModal(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300">

      {/* ══════ Sidebar ══════ */}
      <aside className={`
        ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}
        bg-white dark:bg-gray-900
        border-r border-gray-100 dark:border-gray-800
        fixed h-full hidden md:flex flex-col z-20
        transition-all duration-300 ease-in-out
      `}>

        {/* Logo 区域 */}
        <div className={`flex items-center h-16 border-b border-gray-100 dark:border-gray-800 shrink-0 ${sidebarCollapsed ? 'justify-center px-4' : 'px-5 gap-3'}`}>
          <Link to="/" className="flex items-center justify-center shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all overflow-hidden">
              {config.logoUrl
                ? <img src={config.logoUrl} alt="logo" className="w-full h-full object-contain" />
                : <Layout size={20} className="text-white" />
              }
            </div>
          </Link>
          {!sidebarCollapsed && (
            <Link to="/" className="flex-1 min-w-0">
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white block truncate">
                {config.siteName || '平行宇宙'}
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wider block">STORY PLATFORM</span>
            </Link>
          )}
        </div>

        {/* 主导航 */}
        <nav className={`flex-1 overflow-y-auto py-4 ${sidebarCollapsed ? 'px-3' : 'px-3'}`}>
          {!sidebarCollapsed && (
            <p className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest px-3 mb-2">探索</p>
          )}
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 rounded-xl transition-all duration-200 group
                    ${sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}
                    ${active
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                    ${active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}
                  >
                    <item.icon size={16} />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="min-w-0">
                      <div className={`text-sm font-bold leading-none mb-0.5 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`}>{item.name}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-600 truncate">{item.desc}</div>
                    </div>
                  )}
                  {active && !sidebarCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* 管理区域 */}
          <PermissionGate permission="role:read">
            <div className="mt-6">
              {!sidebarCollapsed && (
                <p className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest px-3 mb-2">管理</p>
              )}
              <div className="space-y-0.5">
                {[
                  { path: '/admin/roles', icon: Shield, name: '角色权限', desc: '权限管理' },
                  { path: '/admin/cms', icon: Settings2, name: 'CMS 管理', desc: '站点配置' },
                ].map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 rounded-xl transition-all duration-200 group
                        ${sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}
                        ${active
                          ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                        ${active
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-violet-50 dark:group-hover:bg-violet-950/50 group-hover:text-violet-600 dark:group-hover:text-violet-400'
                        }`}
                      >
                        <item.icon size={16} />
                      </div>
                      {!sidebarCollapsed && (
                        <div className="min-w-0">
                          <div className={`text-sm font-bold leading-none mb-0.5 ${active ? 'text-violet-600 dark:text-violet-400' : ''}`}>{item.name}</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-600">{item.desc}</div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </PermissionGate>
        </nav>

        {/* 底部用户区 */}
        <div className={`shrink-0 border-t border-gray-100 dark:border-gray-800 ${sidebarCollapsed ? 'p-3' : 'p-3'}`}>
          {isAuthenticated ? (
            <div className={`flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer group ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate leading-none mb-0.5">{user?.username}</div>
                    <div className="text-[11px] text-gray-400 truncate">
                      {user?.role === 'author' ? '✦ 官方作者' : user?.role === 'admin' ? '⚡ 管理员' : '创作者'}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100"
                    title="退出登录"
                  >
                    <LogOut size={14} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className={sidebarCollapsed ? 'flex justify-center' : 'space-y-1.5'}>
              <Link
                to="/login"
                title={sidebarCollapsed ? '登录' : undefined}
                className={`flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/30
                  ${sidebarCollapsed ? 'w-10 h-10' : 'w-full py-2.5 text-sm'}`}
              >
                <LogIn size={16} />
                {!sidebarCollapsed && '登录'}
              </Link>
              {!sidebarCollapsed && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full py-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium text-center"
                >
                  测试账号体验
                </button>
              )}
            </div>
          )}
        </div>

        {/* 折叠/展开按钮 */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-[72px] w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm hover:shadow-md transition-all z-30"
          title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {sidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {/* ══════ Main ══════ */}
      <main className={`flex-1 ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'} flex flex-col min-h-screen pb-16 md:pb-0 transition-all duration-300 ease-in-out`}>

        {/* Top Header */}
        <header className="hidden md:flex h-14 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 items-center justify-between px-6">
          {/* 左侧：面包屑 / 页面标题 */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-gray-400 font-medium">
              {navItems.find(n => n.path === location.pathname)?.name || '故事空间'}
            </span>
          </div>

          {/* 右侧工具栏 */}
          <div className="flex items-center gap-2">
            {/* 搜索框 */}
            <div className="relative hidden lg:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索故事、作者..."
                className="pl-8 pr-4 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 w-52 transition-all placeholder:text-gray-400 text-gray-700 dark:text-gray-300"
              />
            </div>

            {/* 分隔 */}
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* 通知 */}
            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <Bell size={17} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
            </button>

            {/* 用户 */}
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {user?.username}
                </span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
              >
                <LogIn size={14} />
                登录
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Navbar */}
      <MobileNavbar />

      {/* Test Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl max-w-sm w-full border border-gray-100 dark:border-gray-800">
            <h3 className="text-xl font-black mb-1 text-gray-900 dark:text-white">选择测试账号</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">体验不同角色的功能权限</p>
            <div className="space-y-3">
              <button
                onClick={() => handleTestLogin('author')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <BookOpen size={20} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">官方作者</div>
                  <div className="text-xs text-gray-400 mt-0.5">拥有主线故事管理权</div>
                </div>
              </button>
              <button
                onClick={() => handleTestLogin('reader')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                  <GitBranch size={20} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">社区创作者</div>
                  <div className="text-xs text-gray-400 mt-0.5">参与平行宇宙分支创作</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
