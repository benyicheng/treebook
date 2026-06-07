import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Crown, GitBranch, Compass, BookMarked, Route, BookOpen, Star, Zap, Users, ChevronDown } from 'lucide-react';
import { useModeStore } from '../../stores/useModeStore';

const browseItems = [
  { name: '首页', path: '/', icon: Home },
  { name: '主线', path: '/stories', icon: Crown },
  { name: '分支', path: '/branches', icon: GitBranch },
  {
    name: '发现',
    path: '/discover',
    icon: Compass,
    children: [
      { name: '发现', path: '/discover', icon: Compass },
      { name: '关注', path: '/follow', icon: Users },
      { name: '书单', path: '/booklist', icon: BookMarked },
      { name: '阅读路径', path: '/reading-paths', icon: Route },
    ],
  },
  { name: '百科', path: '/wiki', icon: BookOpen },
  { name: '推荐', path: '/recommendations', icon: Star },
  { name: '新书', path: '/new', icon: Zap },
];

const BrowseNav: React.FC = () => {
  const { mode } = useModeStore();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Position the fixed dropdown
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

  // Cleanup timer on unmount
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

  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        mode === 'browse' ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="bg-ink-50/80 dark:bg-ink-800/80 backdrop-blur-sm border-b border-ink-100 dark:border-ink-700">
        <div className="max-w-[1600px] mx-auto flex items-center gap-1 px-4 md:px-6 py-2 overflow-x-auto no-scrollbar">
          {browseItems.map((item) => {
            // 二级下拉菜单
            const itemAny = item as typeof item & { path?: string; children?: { name: string; path: string; icon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> }[] };
            if (itemAny.children) {
              const groupActive = itemAny.children.some(
                (c) => location.pathname === c.path || location.pathname.startsWith(c.path + '/')
              ) || (itemAny.path !== undefined && (location.pathname === itemAny.path || location.pathname.startsWith(itemAny.path + '/')));
              return (
                <div
                  key={item.name}
                  className="relative"
                  ref={openDropdown === item.name ? triggerRef : undefined}
                  onMouseEnter={() => showMenu(item.name)}
                  onMouseLeave={hideMenu}
                >
                  <Link
                    to={itemAny.path || '#'}
                    className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full md:rounded-xl text-xs md:text-sm font-black transition-all duration-fast whitespace-nowrap shrink-0 min-h-[44px]
                      ${groupActive
                        ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400'
                        : 'text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-700/50'
                      }`}
                  >
                    <item.icon size={16} className={groupActive ? 'text-accent-600 dark:text-accent-400' : 'opacity-60'} />
                    <span className="hidden md:inline">{item.name}</span>
                    <ChevronDown size={12} className={`transition-transform duration-fast ${openDropdown === item.name ? 'rotate-180' : ''} ${groupActive ? 'text-accent-600 dark:text-accent-400' : 'opacity-40'}`} />
                  </Link>
                </div>
              );
            }

            const regItem = item as typeof item & { path: string };
            const active = location.pathname === regItem.path || location.pathname.startsWith(regItem.path + '/');
            return (
              <Link
                key={regItem.name}
                to={regItem.path}
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

      {/* 固定定位的下拉菜单 (不受父级 overflow 影响) */}
      {openDropdown && (() => {
        const parent = browseItems.find(i => i.name === openDropdown) as typeof browseItems[0] & { children?: typeof browseItems };
        if (!parent || !('children' in parent)) return null;
        return (
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            onMouseEnter={() => showMenu(openDropdown)}
            onMouseLeave={hideMenu}
            className="bg-ink-50 dark:bg-ink-800 rounded-2xl shadow-xl border border-ink-100 dark:border-ink-700 py-1 z-[100]"
          >
            {parent.children!.map((child) => {
              const childActive = location.pathname === child.path || location.pathname.startsWith(child.path + '/');
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  onClick={() => setOpenDropdown(null)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-xs md:text-sm font-black transition-colors whitespace-nowrap
                    ${childActive
                      ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400'
                      : 'text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-700/50'
                    }`}
                >
                  <child.icon size={16} className={childActive ? 'text-accent-600 dark:text-accent-400' : 'opacity-60'} />
                  <span className="hidden md:inline">{child.name}</span>
                </Link>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

export default BrowseNav;
