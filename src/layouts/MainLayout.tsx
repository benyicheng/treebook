import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { GitBranch, Home, Layout, LogOut, Star, User, Users, Shield, ShieldCheck, Settings2, Search, BookMarked, Plus, Coins, Crown, Zap, Edit3, ClipboardCheck, Compass, ChevronDown, BookOpen, FileText, FileEdit, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSiteConfigStore } from '../stores/useSiteConfigStore';
import { useModeStore } from '../stores/useModeStore';
import { MobileNavbar } from '../components/layout';
import MobileSearchOverlay from '../components/layout/MobileSearchOverlay';
import { ReadingDrawer } from '../components/Booklist';
import { NotificationDropdown } from '../components/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { PermissionGate } from '../components/auth';
import { Avatar } from '../components/ui';
import searchService, { type SearchSuggestItem } from '../api/searchService';


const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, hasPermission } = useAuthStore();
  const { config, fetchConfig } = useSiteConfigStore();
  const { mode, setMode } = useModeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestItem[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Position the fixed dropdown when opened
  useEffect(() => {
    if (openDropdown && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: 160,
      });
    }
  }, [openDropdown]);

  // Cleanup hide timer
  useEffect(() => {
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, []);

  const showMenu = (name: string) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setOpenDropdown(name);
  };

  const hideMenu = () => {
    hideTimerRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 100);
  };

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const items = await searchService.searchSuggest(searchQuery.trim(), 5);
        setSuggestions(items);
        setSuggestOpen(items.length > 0);
        setSelectedIndex(-1);
      } catch {
        setSuggestions([]);
        setSuggestOpen(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function getItemLink(item: SearchSuggestItem): string {
    switch (item.type) {
      case 'story': return `/story/${item.sourceId}`;
      case 'chapter': return `/read/${item.sourceId}`;
      case 'branch': return `/branch/${item.sourceId}`;
      case 'spinoff': return `/spinoff/${item.sourceId}`;
      case 'author': return `/profile/${item.sourceId}`;
      default: return '/';
    }
  }

  // 浏览导航
  const browseItems = [
    { name: '首页', path: '/', icon: Home },
    {
      name: '发现',
      path: '/discover',
      icon: Compass,
      children: [
        { name: '主线', path: '/stories', icon: Crown },
        { name: '分支', path: '/branches', icon: GitBranch },
        { name: '番外', path: '/spinoff', icon: FileText },
        { name: '发现', path: '/discover', icon: Compass },
      ],
    },
    {
      name: '社区',
      path: '/follow',
      icon: Users,
      children: [
        { name: '关注', path: '/follow', icon: Users },
        { name: '书单', path: '/booklist', icon: BookMarked },
      ],
    },
    { name: '推荐', path: '/recommendations', icon: Star },
    { name: '新书', path: '/new', icon: Zap },
    { name: '百科', path: '/wiki', icon: BookOpen },
  ];

  // 检查任意子项是否活跃（用于二级菜单高亮）
  const isChildActive = (children: { path: string }[]) =>
    children.some((c) => isActive(c.path));

  // 创作导航
  const creatorItems = [
    { name: '我的作品', path: '/dashboard', icon: Layout },
    { name: '写新章', path: '/story/create', icon: FileEdit },
    { name: '分支管理', path: '/branches?mine=true', icon: GitBranch },
    { name: '收益', path: '/revenue', icon: Coins },
    { name: '数据分析', path: '/dashboard?tab=analytics', icon: BarChart3 },
  ];

  // 左侧管理功能入口
  const managementItems = [
    { name: '创作台', path: '/dashboard', icon: Layout },
    { name: '收益中心', path: '/revenue', icon: Coins },
    { name: '个人资料', path: '/profile', icon: User },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestOpen(false);
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
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-ink-50/95 dark:bg-ink-800/95 backdrop-blur-xl border-b border-ink-100 dark:border-ink-700 shadow-sm">
        <div className="max-w-[1600px] mx-auto h-20 flex items-center justify-between px-6 gap-8">
          
          {/* 左侧：Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="flex items-center gap-2">
              {config.logoUrl && <img src={config.logoUrl} alt="logo" className="h-8 w-auto rounded-lg" />}
              <span className="text-xl font-black tracking-tight font-display text-ink-800 dark:text-ink-50">
                {config.siteName || '平行宇宙'}
              </span>
            </div>
          </Link>

          {/* 中间：主导航（浏览项） */}
          <nav className="hidden md:flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
            {browseItems.map((item) => {
              // 有 children 的 item → 渲染为 hover 展开 + Link 可点击导航
              if ('children' in item) {
                const typed = item as typeof item & { path?: string; children: { name: string; path: string; icon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> }[] };
                const groupActive = isChildActive(typed.children) || (typed.path ? isActive(typed.path) : false);
                const isOpen = openDropdown === item.name;
                return (
                  <div
                    key={item.name}
                    className="relative"
                    ref={isOpen ? triggerRef : undefined}
                    onMouseEnter={() => showMenu(item.name)}
                    onMouseLeave={hideMenu}
                  >
                        <Link
                          to={typed.path || '#'}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-fast whitespace-nowrap shrink-0
                            ${groupActive
                              ? 'text-ink-900 dark:text-ink-50 font-semibold'
                              : 'text-ink-900 hover:text-black dark:text-ink-50 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-ink-700/50 font-medium'
                            }`}
                        >
                          <item.icon size={16} className={groupActive ? '' : 'opacity-70'} />
                      {item.name}
                      <ChevronDown size={12} className={`transition-transform duration-fast ${isOpen ? 'rotate-180' : ''} ${groupActive ? '' : 'opacity-40'}`} />
                    </Link>
                  </div>
                );
              }

              // 普通链接项
              const regItem = item as { name: string; path: string; icon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> };
              const active = isActive(regItem.path);
              return (
                <Link
                  key={regItem.name}
                  to={regItem.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-fast whitespace-nowrap shrink-0
                    ${active
                      ? 'text-ink-900 dark:text-ink-50 font-semibold'
                      : 'text-ink-900 hover:text-black dark:text-ink-50 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-ink-700/50 font-medium'
                    }`}
                >
                  <regItem.icon size={16} className={active ? '' : 'opacity-70'} />
                  {regItem.name}
                </Link>
              );
            })}
          </nav>

          {/* 固定定位的下拉菜单 (不受父级 overflow 影响) */}
          {openDropdown && (() => {
            const parent = browseItems.find(i => i.name === openDropdown) as typeof browseItems[0] & { children?: { name: string; path: string; icon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> }[] };
            if (!parent || !('children' in parent) || !parent.children) return null;
            return (
              <div
                style={dropdownStyle}
                onMouseEnter={() => showMenu(openDropdown)}
                onMouseLeave={hideMenu}
                className="bg-ink-50 dark:bg-ink-800 rounded-2xl shadow-xl border border-ink-100 dark:border-ink-700 py-1 z-[100]"
              >
                {parent.children.map((child) => {
                  const childActive = isActive(child.path);
                  return (
                    <Link
                      key={child.path}
                      to={child.path}
                      onClick={() => setOpenDropdown(null)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors whitespace-nowrap
                        ${childActive
                          ? 'text-ink-900 dark:text-ink-50 font-semibold'
                          : 'text-ink-900 hover:text-black dark:text-ink-50 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-ink-700/50 font-medium'
                        }`}
                    >
                      <child.icon size={16} className={childActive ? '' : 'opacity-70'} />
                      {child.name}
                    </Link>
                  );
                })}
              </div>
            );
          })()}

          {/* 右侧：搜索 + 用户操作 */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Mobile search icon */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="flex xl:hidden p-2.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] items-center justify-center text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-700"
              aria-label="搜索"
            >
              <Search size={20} />
            </button>
            <form onSubmit={handleSearch} ref={searchRef} className="relative hidden xl:flex items-center group">
              <button type="submit" className="absolute left-4 transition-colors duration-instant z-10 text-ink-400 group-focus-within:text-accent-500" aria-label="搜索">
                <Search size={16} />
              </button>
              <input 
                type="text" 
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (!suggestOpen) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                  } else if (e.key === 'Enter' && selectedIndex >= 0) {
                    e.preventDefault();
                    const item = suggestions[selectedIndex];
                    navigate(getItemLink(item));
                    setSuggestOpen(false);
                    setSearchQuery('');
                  } else if (e.key === 'Escape') {
                    setSuggestOpen(false);
                  }
                }}
                className="w-48 h-10 border-none rounded-full pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-accent-500/20 focus:w-64 transition-all duration-normal ease-out-expo outline-none bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-200 placeholder:text-ink-400 focus:bg-ink-50 dark:focus:bg-ink-700"
              />
              <AnimatePresence>
                {suggestOpen && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-ink-50 dark:bg-ink-800 rounded-2xl shadow-xl border border-ink-100 dark:border-ink-700 overflow-hidden z-50"
                  >
                    {suggestions.map((item, i) => (
                      <button
                        key={`${item.type}-${item.sourceId}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          navigate(getItemLink(item));
                          setSuggestOpen(false);
                          setSearchQuery('');
                        }}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-fast ${
                          i === selectedIndex
                            ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400'
                            : 'text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-700/50'
                        }`}
                      >
                        <span className="shrink-0 w-6 h-6 rounded-lg bg-ink-100 dark:bg-ink-700 flex items-center justify-center">
                          {item.type === 'story' && <BookOpen size={14} />}
                          {item.type === 'chapter' && <FileText size={14} />}
                          {item.type === 'branch' && <GitBranch size={14} />}
                          {item.type === 'spinoff' && <FileText size={14} />}
                          {item.type === 'author' && <User size={14} />}
                        </span>
                        <span className="flex-1 text-left truncate font-medium">{item.title}</span>
                        <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold text-ink-500 dark:text-ink-400 bg-ink-100 dark:bg-ink-700">
                          {item.type === 'story' ? '故事' : item.type === 'chapter' ? '章节' : item.type === 'branch' ? '分支' : item.type === 'spinoff' ? '番外' : '作者'}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <NotificationDropdown />
                  <div className="w-px h-8 mx-1 bg-ink-200 dark:bg-ink-600" />
                  <button onClick={() => navigate('/profile')} className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 p-0.5 shadow-sm hover:ring-2 hover:ring-accent-500 transition-all duration-fast overflow-hidden min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0">
                    <Avatar src={user?.avatarUrl} alt={user?.username} fallback={user?.username?.[0]} size="sm" className="w-full h-full" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/register" className={`text-sm font-semibold transition-colors duration-instant hidden sm:block text-ink-900 hover:text-accent-600 dark:text-ink-50`}>
                    注册账号
                  </Link>
                   <Link to="/login" className="px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all duration-instant shadow-md min-h-[44px] flex items-center bg-ink-800 dark:bg-ink-50 text-ink-50 dark:text-ink-800">
                    立即登录
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col flex-1 pt-20 bg-ink-50/50 dark:bg-ink-800/50">
        {/* ══════ 主内容区：侧边栏 + 内容 (flex row) ══════ */}
        <div className="flex flex-1">
        <aside 
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          className={`
            fixed left-0 bottom-0 top-20 z-40 transition-all duration-300 ease-out-expo
            ${isSidebarHovered 
              ? 'w-64 bg-ink-50/95 dark:bg-ink-800/95 backdrop-blur-xl border-r border-ink-100 dark:border-ink-700 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.1)]' 
              : 'w-3 bg-transparent hover:bg-accent-500/20 hover:border-r hover:border-accent-200 dark:hover:border-accent-800/30'}
            hidden lg:flex flex-col overflow-hidden
            ${!isSidebarHovered ? 'cursor-pointer' : ''}
          `}
        >
          <div className={`flex-1 flex flex-col overflow-y-auto no-scrollbar transition-all duration-300 ease-out-expo ${isSidebarHovered ? 'px-4 pb-6' : 'px-3 pb-3'}`}>
            <div className={`flex-1 space-y-1 ${isSidebarHovered ? 'pt-4' : 'pt-4'}`}>
              {/* 模式切换 */}
              <div className={isSidebarHovered ? 'px-2 pb-4 space-y-1' : 'flex flex-col items-center gap-1 pb-4'}>
                <button
                  onClick={() => { setMode('browse'); navigate('/discover'); }}
                  className={`flex items-center gap-3 rounded-xl transition-all duration-200
                    ${isSidebarHovered ? 'px-3 py-2.5 w-full' : 'justify-center p-2.5'}
                    ${mode === 'browse'
                      ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400'
                      : 'text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700/50 hover:text-ink-700 dark:hover:text-ink-200'
                    }`}
                  title={!isSidebarHovered ? '浏览' : undefined}
                >
                  <Compass size={20} className={mode === 'browse' ? 'text-accent-600 dark:text-accent-400' : 'opacity-60'} />
                  {isSidebarHovered && <span className="text-sm font-semibold whitespace-nowrap">浏览</span>}
                </button>
                <button
                  onClick={() => { setMode('create'); navigate('/dashboard'); }}
                  className={`flex items-center gap-3 rounded-xl transition-all duration-200
                    ${isSidebarHovered ? 'px-3 py-2.5 w-full' : 'justify-center p-2.5'}
                    ${mode === 'create'
                      ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400'
                      : 'text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700/50 hover:text-ink-700 dark:hover:text-ink-200'
                    }`}
                  title={!isSidebarHovered ? '创作台' : undefined}
                >
                  <Layout size={20} className={mode === 'create' ? 'text-accent-600 dark:text-accent-400' : 'opacity-60'} />
                  {isSidebarHovered && <span className="text-sm font-semibold whitespace-nowrap">创作台</span>}
                </button>
              </div>

              {/* 创作台导航项 */}
              {mode === 'create' && (
                <>
                  <div className={`${isSidebarHovered ? 'mx-2 pb-1 eyebrow text-ink-400 dark:text-ink-500' : 'flex justify-center'}`}>
                    {isSidebarHovered ? '创作' : <Layout size={14} className="text-ink-400" />}
                  </div>
                  {creatorItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center gap-3 rounded-xl transition-all duration-200 group/item
                          ${isSidebarHovered ? 'px-3 py-2.5' : 'justify-center p-2.5'}
                          ${active
                            ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400'
                            : 'text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700/50 hover:text-ink-700 dark:hover:text-ink-200'
                          }`}
                        title={!isSidebarHovered ? item.name : undefined}
                      >
                        <item.icon size={20} className={`shrink-0 transition-transform duration-150 group-hover/item:scale-110 ${active ? 'text-accent-600 dark:text-accent-400' : 'opacity-60'}`} />
                        {isSidebarHovered && <span className="text-sm font-semibold whitespace-nowrap">{item.name}</span>}
                      </Link>
                    );
                  })}
                  <div className={`${isSidebarHovered ? 'mx-2 my-3' : 'mx-1 my-2'} border-t border-ink-100 dark:border-ink-700/50`} />
                </>
              )}

              {/* 工作台（浏览模式下） */}
              {mode !== 'create' && (
                <>
                  <div className={`${isSidebarHovered ? 'mx-2 my-4' : 'mx-1 my-3'} border-t border-ink-100 dark:border-ink-700/50`} />
                  <div className={isSidebarHovered ? 'px-2 pb-1 eyebrow text-ink-400 dark:text-ink-500' : 'flex justify-center'}>
                    {isSidebarHovered ? 'Workbench' : <Layout size={14} className="text-ink-400" />}
                  </div>
                  <div className="space-y-0.5">
                    {managementItems.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          className={`flex items-center gap-3 rounded-xl transition-all duration-200 group/item
                            ${isSidebarHovered ? 'px-3 py-2.5' : 'justify-center p-2.5'}
                            ${active
                              ? 'bg-accent-500 text-ink-50 shadow-md shadow-accent-500/20'
                              : 'text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700/50 hover:text-ink-700 dark:hover:text-ink-200'
                            }`}
                          title={!isSidebarHovered ? item.name : undefined}
                        >
                          <item.icon size={20} className={`shrink-0 transition-transform duration-150 group-hover/item:scale-110 ${active ? 'text-ink-50' : 'opacity-60'}`} />
                          {isSidebarHovered && <span className="text-sm font-semibold whitespace-nowrap">{item.name}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}

              {/* 管理工具 */}
              {showAdmin && (
                <>
                  <div className={`${isSidebarHovered ? 'mx-2 my-3' : 'mx-1 my-2'} border-t border-ink-100 dark:border-ink-700/50`} />
                  <div className={isSidebarHovered ? 'px-2 pb-1 eyebrow text-ink-400 dark:text-ink-500' : 'flex justify-center'}>
                    {isSidebarHovered ? 'Admin' : <Shield size={14} className="text-ink-400" />}
                  </div>
                  <div className="space-y-0.5">
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
                          key={item.name}
                          to={item.path}
                          className={`flex items-center gap-3 rounded-xl transition-all duration-200 group/item
                            ${isSidebarHovered ? 'px-3 py-2.5' : 'justify-center p-2.5'}
                            ${active
                              ? 'bg-accent-600 text-ink-50 shadow-md shadow-accent-600/20'
                              : 'text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700/50 hover:text-ink-700 dark:hover:text-ink-200'
                            }`}
                          title={!isSidebarHovered ? item.name : undefined}
                        >
                          <item.icon size={20} className={`shrink-0 transition-transform duration-150 group-hover/item:scale-110 ${active ? 'text-ink-50' : 'opacity-60'}`} />
                          {isSidebarHovered && <span className="text-sm font-semibold whitespace-nowrap">{item.name}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* 底部退出 */}
            {isAuthenticated && (
              <div className={`${isSidebarHovered ? 'pt-4 mt-2 border-t border-ink-100 dark:border-ink-700/50' : 'pt-2'}`}>
                <button 
                  onClick={() => logout()}
                  className={`flex items-center gap-3 rounded-xl transition-all duration-150
                    ${isSidebarHovered ? 'px-3 py-2.5 w-full text-ink-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 eyebrow text-sm' : 'justify-center p-2.5 text-ink-400 hover:text-red-500'}
                    `}
                  title={!isSidebarHovered ? '退出' : undefined}
                >
                  <LogOut size={20} />
                  {isSidebarHovered && <span>Sign Out</span>}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ══════ 主内容区 (Main Scrollable) ══════ */}
        <main className={`flex-1 p-4 lg:p-8 transition-all duration-300 ease-out-expo ${isSidebarHovered ? 'lg:ml-64' : 'lg:ml-0'}`}>
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
      </div>{/* end inner flex row */}
      </div>{/* end outer flex-col */}

      {/* Reading Drawer (right-sliding overlay) */}
      <ReadingDrawer />

      {/* Mobile Navbar */}
      <MobileNavbar />

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
      />
    </div>
  );
};

export default MainLayout;
