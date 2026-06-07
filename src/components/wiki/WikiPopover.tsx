import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BookOpen, Loader2, ExternalLink } from 'lucide-react';
import { wikiService, WikiLookupResult } from '../../api/wikiService';

interface WikiPopoverProps {
  /** 实体名称 */
  entityName: string;
  /** 百科条目ID（已知时直接使用，减少一次 lookup 请求） */
  wikiId?: string | null;
  /** 子元素 —— 触发 popover 显示的元素 */
  children: React.ReactNode;
  /** 是否可见（由外部控制，可选） */
  visible?: boolean;
  /** 当 popover 内容加载完成时触发 */
  onLoaded?: (result: WikiLookupResult) => void;
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
 * 用户悬停/点击带有 `[[实体名称]]` 标记的文本时，
 * 显示对应百科条目的摘要信息。
 *
 * 用法：
 * ```tsx
 * <WikiPopover entityName="张三">
 *   <span>张三</span>
 * </WikiPopover>
 * ```
 */
const WikiPopover: React.FC<WikiPopoverProps> = ({
  entityName,
  wikiId: knownWikiId,
  children,
  visible: controlledVisible,
  onLoaded,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<WikiLookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const visible = controlledVisible !== undefined ? controlledVisible : isOpen;

  const fetchWikiData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wikiService.lookup(entityName, 3);
      setResults(data);
      if (data.length > 0 && onLoaded) {
        onLoaded(data[0]);
      }
    } catch (err) {
      setError('查找失败');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [entityName, onLoaded]);

  // 如果已知 wikiId，可以直接用 lookup 确认
  const handleMouseEnter = useCallback(() => {
    // 防抖：150ms 后再请求，避免快速划过时频繁请求
    debounceTimer.current = setTimeout(() => {
      setIsOpen(true);
      fetchWikiData();
    }, 150);
  }, [fetchWikiData]);

  const handleMouseLeave = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setIsOpen(false);
  }, []);

  // 点击 popover 外部关闭
  useEffect(() => {
    if (!visible) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visible]);

  // 清理 debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // 获取 popover 位置逻辑
  const getPopoverPosition = () => {
    if (!triggerRef.current) return {};
    const rect = triggerRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 320)),
    };
  };

  const position = getPopoverPosition();

  return (
    <>
      {/* 触发元素 */}
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          if (!visible) {
            setIsOpen(true);
            fetchWikiData();
          } else {
            setIsOpen(false);
          }
        }}
        className="cursor-help border-b border-dashed border-indigo-300 dark:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        {children}
      </span>

      {/* Popover */}
      {visible && (
        <div
          ref={popoverRef}
          onMouseEnter={() => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
          }}
          onMouseLeave={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: position.top ?? 0,
            left: position.left ?? 0,
            zIndex: 1000,
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
          {error && (
            <div className="p-4 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Results */}
          {!loading && !error && results.length === 0 && (
            <div className="p-4 text-sm text-ink-400">
              暂无「{entityName}」的百科条目
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div>
              {results.map((item) => (
                <a
                  key={item.id}
                  href={`/wiki/${item.id}`}
                  onClick={(e) => {
                    // 如果使用客户端路由，这里可以改为 navigate
                  }}
                  className="block p-4 hover:bg-ink-50 dark:hover:bg-ink-600 transition-colors border-b border-ink-100 dark:border-ink-600 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-ink-800 dark:text-ink-100 truncate">
                      {item.title}
                    </h4>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
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
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default WikiPopover;
