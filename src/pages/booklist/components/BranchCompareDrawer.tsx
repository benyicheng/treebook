/**
 * Branch Compare Drawer（Phase 4）
 *
 * 双栏 diff 风格的分支对比抽屉：
 *   左：主线轨道  |  右：各分支轨道
 * 每栏显示前 3 章 preview + 总章节数 + 阅读数。
 * 底部提供"加入路径"入口（forkReadingPath）。
 *
 * 触发方式：BooklistEventCard 的 InlineGrid 在 branches 连接器下渲染
 * "对比预览 ⇆" 按钮，点击打开本 Drawer。
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, GitBranch, ChevronRight, Loader2, Check } from 'lucide-react';
import {
  fetchBranchComparison,
  forkReadingPath,
  type BranchComparisonDTO,
  type BranchComparisonTrack,
} from '../../../api/eventConnectorService';
import { useToast } from '../../../components/notifications';

interface BranchCompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  /** 可选：当前书单中已有的阅读路径 ID，用于"加入路径"快捷操作 */
  readingPathId?: string;
}

const BranchCompareDrawer: React.FC<BranchCompareDrawerProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  readingPathId,
}) => {
  const { addToast } = useToast();
  const [data, setData] = useState<BranchComparisonDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fork 状态
  const [forking, setForking] = useState(false);
  const [forkDone, setForkDone] = useState(false);
  // 用户在分支轨道里勾选要加入的分支（最多 5）
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<string>>(new Set());
  const [primaryBranchId, setPrimaryBranchId] = useState<string | null>(null);

  // 打开时拉数据
  React.useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    setForkDone(false);
    setSelectedBranchIds(new Set());
    setPrimaryBranchId(null);
    fetchBranchComparison(eventId)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          // 默认选中前两个分支（若存在），第一个作 primary
          const firstTwo = d.branches.slice(0, 2).map((b) => b.id);
          setSelectedBranchIds(new Set(firstTwo));
          setPrimaryBranchId(firstTwo[0] ?? null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg =
            (e as { response?: { status?: number } })?.response?.status === 503
              ? '事件连接器功能未启用'
              : '加载分支对比失败';
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, eventId]);

  const toggleBranch = (branchId: string) => {
    setSelectedBranchIds((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) {
        next.delete(branchId);
        if (primaryBranchId === branchId) {
          // 取消主选时，把主选移到第一个仍选中的
          setPrimaryBranchId([...next][0] ?? null);
        }
      } else {
        if (next.size >= 5) return prev; // 上限 5
        next.add(branchId);
        if (!primaryBranchId) setPrimaryBranchId(branchId);
      }
      return next;
    });
  };

  const handleFork = async () => {
    if (!readingPathId || !primaryBranchId) return;
    const options = [...selectedBranchIds];
    if (options.length < 2) {
      addToast('warning', '至少选择 2 个分支');
      return;
    }
    setForking(true);
    try {
      await forkReadingPath(readingPathId, {
        atEventId: eventId,
        branchOptions: options,
        primary: primaryBranchId,
      });
      setForkDone(true);
      addToast('success', `已在该事件处添加 ${options.length} 个分支选择点`);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const msg =
        status === 403
          ? '只有路径创建者可以添加叉路'
          : status === 404
            ? '路径或事件不存在'
            : '添加叉路失败';
      addToast('error', msg);
    } finally {
      setForking(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`分支对比 · ${eventTitle}`}
        tabIndex={-1}
        className="bg-white dark:bg-ink-700 rounded-3xl w-full max-w-4xl max-h-[calc(100vh-5rem)] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ink-100 dark:border-ink-600 shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg font-bold truncate">分支对比 · {eventTitle}</h3>
            <p className="text-xs text-ink-400 mt-0.5">
              比较主线与各分支的走向，选择加入阅读路径
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-600 hover:bg-ink-100 dark:hover:bg-ink-600 transition-colors shrink-0"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-12 text-ink-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              加载中…
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-ink-400">
              <p>{error}</p>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-4">
              {/* 主线轨道 */}
              <TrackCard track={data.main} />

              {/* 分支轨道列表 */}
              {data.branches.length === 0 ? (
                <p className="text-center text-sm text-ink-400 py-6">
                  该事件暂无分支
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-ink-500 uppercase tracking-wide">
                    分支（勾选加入路径，最多 5 个）
                  </p>
                  {data.branches.map((b) => (
                    <TrackCard
                      key={b.id}
                      track={b}
                      selectable
                      selected={selectedBranchIds.has(b.id)}
                      isPrimary={primaryBranchId === b.id}
                      onSelect={() => toggleBranch(b.id)}
                      onSetPrimary={() => setPrimaryBranchId(b.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer：加入路径 */}
        {data && readingPathId && !forkDone && (
          <div className="p-4 border-t border-ink-100 dark:border-ink-600 flex items-center justify-between shrink-0">
            <span className="text-xs text-ink-400">
              已选 {selectedBranchIds.size} 个分支
              {primaryBranchId ? '，主选已标记' : ''}
            </span>
            <button
              onClick={handleFork}
              disabled={forking || selectedBranchIds.size < 2 || !primaryBranchId}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {forking ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />}
              加入路径叉路
            </button>
          </div>
        )}
        {forkDone && (
          <div className="p-4 border-t border-ink-100 dark:border-ink-600 flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 shrink-0">
            <Check size={16} />
            叉路已添加，阅读到该事件时会提示选择
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

// ── 单条轨道卡 ───────────────────────────────────────────────────────

interface TrackCardProps {
  track: BranchComparisonTrack;
  selectable?: boolean;
  selected?: boolean;
  isPrimary?: boolean;
  onSelect?: () => void;
  onSetPrimary?: () => void;
}

const TrackCard: React.FC<TrackCardProps> = ({
  track,
  selectable = false,
  selected = false,
  isPrimary = false,
  onSelect,
  onSetPrimary,
}) => {
  const isMain = track.kind === 'main';
  return (
    <div
      className={[
        'rounded-xl border p-3 transition-colors',
        isMain
          ? 'border-sky-200 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-900/10'
          : selectable
            ? selected
              ? 'border-amber-300 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-900/10'
              : 'border-ink-100 dark:border-ink-600'
            : 'border-ink-100 dark:border-ink-600',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 mb-2">
        {isMain ? (
          <BookOpen size={14} className="text-sky-600 dark:text-sky-400 shrink-0" />
        ) : (
          <GitBranch size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
        )}
        <span className="text-sm font-bold truncate flex-1">{track.title}</span>
        {selectable && (
          <label className="flex items-center gap-1.5 text-xs cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              className="rounded"
              aria-label={`选择分支 ${track.title}`}
            />
            主选
            <input
              type="radio"
              checked={isPrimary}
              onChange={onSetPrimary}
              disabled={!selected}
              className="ml-1"
              aria-label={`设为主选 ${track.title}`}
            />
          </label>
        )}
      </div>

      {/* 章节预览 */}
      <div className="space-y-0.5 mb-2">
        {track.previewChapters.length === 0 ? (
          <p className="text-xs text-ink-400">暂无章节</p>
        ) : (
          track.previewChapters.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-xs text-ink-600 dark:text-ink-300">
              <ChevronRight size={10} className="text-ink-300 shrink-0" />
              <span className="truncate">{c.title}</span>
            </div>
          ))
        )}
      </div>

      {/* 统计 */}
      <div className="flex items-center gap-3 text-[11px] text-ink-400">
        <span>{track.totalChapters} 章</span>
        {track.stats.readCount !== null && <span>{track.stats.readCount} 阅读</span>}
        {track.stats.averageRating !== null && <span>⭐ {track.stats.averageRating.toFixed(1)}</span>}
      </div>
    </div>
  );
};

export default BranchCompareDrawer;
