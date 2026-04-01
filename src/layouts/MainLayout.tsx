import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, GitBranch, Home, Layout, Library, LogIn, LogOut, Star, User, Shield, ChevronLeft, ChevronRight, Settings2, Bell, Search, Sparkles, BookMarked, Plus, Coins } from 'lucide-react';
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
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const navItems = [
    { name: '首页', path: '/', icon: Home, desc: '发现精彩故事' },
    { name: '工作台', path: '/dashboard', icon: Layout, desc: '管理我的作品' },
    { name: '精彩番外', path: '/spinoff', icon: Sparkles, desc: '探索平行宇宙' },
    { name: '精选书单', path: '/booklist', icon: BookMarked, desc: '编辑精心挑选' },
    { name: '收益中心', path: '/revenue', icon: Coins, desc: '查看创作分润' },
  ];

  const categoryItems = [
    { name: '全部', path: '/' },
    { name: '主线故事', path: '/?filter=official' },
    { name: '平行分支', path: '/?filter=community' },
    { name: '完本精选', path: '/?filter=completed' },
    { name: '拉力赛专区', path: '/contest' },
    { name: '出版改编', path: '/publishing' },
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
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          ${isHovered ? 'w-64 shadow-2xl z-40' : 'w-4 z-20'}
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
          border-r border-gray-100 dark:border-gray-800
          fixed h-full hidden md:flex flex-col
          transition-all duration-300 ease-in-out
          overflow-hidden group/sidebar
        `}
      >
        <div className={`absolute top-0 right-0 w-1 h-full bg-blue-500/0 group-hover/sidebar:bg-blue-500/20 transition-colors cursor-pointer`} />

        {/* Logo 区域 */}
        <div className={`flex items-center h-16 border-b border-gray-100 dark:border-gray-800 shrink-0 ${!isHovered ? 'justify-center px-0 opacity-0' : 'px-5 gap-3 opacity-100'} transition-opacity duration-200`}>
          <Link to="/" className="flex items-center justify-center shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
              {config.logoUrl
                ? <img src={config.logoUrl} alt="logo" className="w-full h-full object-contain" />
                : <Layout size={20} className="text-white" />
              }
            </div>
          </Link>
          {isHovered && (
            <Link to="/" className="flex-1 min-w-0">
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white block truncate">
                {config.siteName || '平行宇宙'}
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wider block uppercase">Story Platform</span>
            </Link>
          )}
        </div>

        {/* 主导航 */}
        <nav className={`flex-1 overflow-y-auto py-4 px-3 ${!isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
          <p className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest px-3 mb-2">探索</p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl transition-all duration-200 group px-3 py-2.5
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
                  <div className="min-w-0">
                    <div className={`text-sm font-bold leading-none mb-0.5 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`}>{item.name}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-600 truncate">{item.desc}</div>
                  </div>
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* 管理区域 */}
          <PermissionGate permission="role:read">
            <div className="mt-6">
              <p className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest px-3 mb-2">管理</p>
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
                      className={`flex items-center gap-3 rounded-xl transition-all duration-200 group px-3 py-2.5
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
                      <div className="min-w-0">
                        <div className={`text-sm font-bold leading-none mb-0.5 ${active ? 'text-violet-600 dark:text-violet-400' : ''}`}>{item.name}</div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-600 truncate">{item.desc}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </PermissionGate>
        </nav>

        {/* 底部用户信息 */}
        {isHovered && isAuthenticated && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 transition-opacity duration-200">
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-500 hover:text-red-600 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:text-red-600">
                <LogOut size={16} />
              </div>
              <span className="text-sm font-bold italic uppercase tracking-widest">Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* ══════ Main Content ══════ */}
      <main className="flex-1 transition-all duration-300 ml-4 min-w-0">
        {/* Header - Top Navbar */}
        <header className="h-14 flex items-center justify-between px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1">
            {categoryItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium whitespace-nowrap px-1 transition-colors ${
                  isActive(item.path)
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-0.5'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full" />
            </button>
            <div className="h-6 w-px bg-gray-100 dark:border-gray-800 mx-1" />
            
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all text-xs font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Layout size={14} />
                  工作台
                </Link>
                <div className="hidden sm:block h-6 w-px bg-gray-100 dark:bg-gray-800 mx-1" />
                <button 
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2.5 p-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-sm ring-2 ring-white dark:ring-gray-900">
                    {user?.username?.[0].toUpperCase()}
                  </div>
                  <span className="hidden md:inline text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white mr-2">
                    {user?.username}
                  </span>
                </button>
              </div>
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
        <div className="p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
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
