import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Loader2, ExternalLink } from 'lucide-react';
import { wikiService, WikiLookupResult } from '../../api/wikiService';

interface WikiPopoverProps {
  /** 实体名称 */
  entityName: string;
  /** 百科条目ID（已知时直接用 getById，减少一次 lookup） */
  wikiId?: string | null;
  /** 子元素 —— 触发 popover 显示的元素（行内实体模式） */
  children: React.ReactNode;
}

const contentTypeLabels: Record<string, string> = {
  character: '角色',
  setting: '设定',
  event: '事件',
  concept: '概念',
  faction: '势力',
  item: '物品',
};

/**
 * WikiPopover — 百科条目浮窗
 *
 * 行内 `[[实体]]` 悬停时显示对应百科条目摘要，点击条目跳转详情页。
 *
 * 改进点：
 * - 用 react-router `<Link>` 替代 `<a href>`，避免整页刷新；
 * - 已知 wikiId 时走 getById，否则才 lookup；
 * - 浮窗位置监听 scroll/resize 重算，避免滚动后错位；
 * - 桥接区消除「触发元素 → 浮窗」缝隙误关。
 */
const WikiPopover: React.FC<WikiPopoverProps> = ({
  entityName,
  wikiId: knownWikiId,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<WikiLookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchWikiData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: WikiLookupResult[] = [];
      if (knownWikiId) {
        // 已知 id 直接取详情，命中即只展示该条
        const page = await wikiService.getById(knownWikiId);
        if (page) {
          data = [{
            id: page.id,
            title: page.title,
            slug: page.slug,
            summary: page.summary ?? null,
            contentType: page.contentType,
            storyId: page.storyId ?? null,
            _count: page._count ?? { outgoingLinks: 0, incomingLinks: 0 },
          }];
        }
      }
      if (data.length === 0) {
        data = await wikiService.lookup(entityName, 3);
      }
      setResults(data);
    } catch {
      setError('查找失败');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [entityName, knownWikiId]);

  // 更新浮窗位置：基于触发元素的 bounding rect
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 296)),
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    debounceTimer.current = setTimeout(() => {
      setIsOpen(true);
      fetchWikiData();
    }, 150);
  }, [fetchWikiData]);

  const handleMouseLeave = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setIsOpen(false), 100);
  }, []);

  // 进入 popover：取消关闭定时器
  const handlePopoverEnter = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  // 滚动/缩放时重算位置；卸载时清理
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleScroll = () => updatePosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen, updatePosition]);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return (
    <>
      {/* 触发元素 */}
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          if (!isOpen) {
            setIsOpen(true);
            fetchWikiData();
          } else {
            setIsOpen(false);
          }
        }}
        className="cursor-help border-b border-dashed border-accent-300 dark:border-accent-600 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
      >
        {children}
      </span>

      {/* Popover + 桥接区（消除缝隙误关） */}
      {isOpen && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000, width: 0, height: 0 }}
        >
          {/* 触发元素与浮窗间的透明桥接区，鼠标经过不触发关闭 */}
          <div
            style={{
              position: 'fixed',
              top: position.top - 4,
              left: position.left,
              width: 288,
              height: 8,
            }}
            onMouseEnter={handlePopoverEnter}
            onMouseLeave={handleMouseLeave}
          />
          <div
            ref={popoverRef}
            onMouseEnter={handlePopoverEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
            }}
            className="w-72 bg-white dark:bg-ink-700 rounded-xl shadow-2xl border border-ink-200 dark:border-ink-600 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center gap-2 p-6 text-ink-500">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">查找中...</span>
              </div>
            )}

            {/* Error */}
            {error && <div className="p-4 text-sm text-red-500">{error}</div>}

            {/* Empty */}
            {!loading && !error && results.length === 0 && (
              <div className="p-4 text-sm text-ink-400">
                暂无「{entityName}」的百科条目
              </div>
            )}

            {/* Results */}
            {!loading && !error && results.length > 0 && (
              <div>
                {results.map((item) => (
                  <Link
                    key={item.id}
                    to={`/wiki/${item.id}`}
                    onClick={() => setIsOpen(false)}
                    className="block p-4 hover:bg-ink-50 dark:hover:bg-ink-600 transition-colors border-b border-ink-100 dark:border-ink-600 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-ink-800 dark:text-ink-100 truncate">
                        {item.title}
                      </h4>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-800 text-accent-600 dark:text-accent-300">
                        {contentTypeLabels[item.contentType] || item.contentType}
                      </span>
                    </div>
                    {item.summary && (
                      <p className="mt-1 text-xs text-ink-500 dark:text-ink-400 line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-ink-400">
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} />
                        {item._count.outgoingLinks + item._count.incomingLinks} 条关联
                      </span>
                      <span className="flex items-center gap-1">
                        <ExternalLink size={12} />
                        查看详情
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default WikiPopover;
