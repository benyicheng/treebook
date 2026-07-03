import { useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useBooklist } from './useBooklists';
import { useBooklistProgress } from './useBooklistProgress';
import { useTrail, useReadingPath } from './useReadingPaths';
import type { BooklistItem, ReadingPathNode, Booklist, ReadingPath, Trail } from '../api/types';
import client from '../api/client';
import { getCategoryLabel } from '../utils/nodeMeta';

/**
 * 阅读上下文（ReadingContext）
 *
 * 统一书单 / 阅读路径 / 轨迹三种"阅读来源"的上下文契约。
 * 来源由 URL 查询参数表达：
 *   - 结构化：?ctx=booklist:<id> | path:<pathId> | trail:<trailId>
 *   - 兼容旧：?referralId=<booklistId>  → 等价于 ctx=booklist:<id>
 *
 * ReadPage 顶栏与 ContextPanel 都消费本 hook，避免各自实现一套。
 * 阶段 1 已在路径节点 / TrailPage 的"去阅读"链接注入 ctx 参数；本 hook 负责解析。
 */

export type ReadingContextType = 'booklist' | 'path' | 'trail';

export interface ContextNode {
  /** 节点跳转目标 id（章节/分支/番外的内容 id） */
  contentId: string;
  title: string;
  /** 节点类别，决定跳转前缀与图标 */
  category: 'chapter' | 'branch' | 'spinoff' | string;
  /** 阅读路径节点富字段（仅 path/trail 类型有值） */
  introduction?: string | null;
  note?: string | null;
  estimatedMin?: number | null;
  /** 节点类别中文标签，供组件直接用，减少重复计算 */
  categoryLabel?: string;
}

export interface ReadingContextValue {
  /** 上下文类型；无上下文时为 null */
  type: ReadingContextType | null;
  /** 来源 id（书单 id / 路径 id / 轨迹 id） */
  id: string | null;
  /** 来源标题，供顶栏与侧栏显示 */
  title: string | null;
  /** 上下文节点列表（章节序列），供侧栏导航 */
  nodes: ContextNode[];
  /** 当前阅读的 contentId 在 nodes 中的下标；无匹配时为 -1 */
  currentIndex: number;
  /** 是否存在上一/下一节点 */
  hasPrev: boolean;
  hasNext: boolean;
  /** 跳转到上一/下一节点（携带 ctx 参数） */
  prev: () => void;
  next: () => void;
  /**
   * 推进上下文进度。仅 trail 类型有效：标记当前节点完成并前进。
   * booklist 类型由 useBooklistProgress 在滚动到底时自动回写，无需显式调用。
   */
  advance: () => Promise<void>;
  /** 退出上下文返回的路径 */
  exitPath: string | null;
  /** 进度百分比 0-100，用于顶栏/侧栏进度条；无上下文或无法计算时为 null */
  completionPercentage: number | null;
  /** booklist 上下文：标记当前章节已读 */
  markCurrentRead: () => void;
  /** 原始上下文对象，供需要细粒度数据的组件使用 */
  raw: unknown;
}

interface ParsedContext {
  type: ReadingContextType;
  id: string;
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/** 解析 ?ctx= 与 ?referralId=，返回结构化上下文或 null */
function parseContext(search: string): ParsedContext | null {
  const params = new URLSearchParams(search);

  const ctx = params.get('ctx');
  if (ctx) {
    const idx = ctx.indexOf(':');
    if (idx > 0) {
      const type = ctx.slice(0, idx) as ReadingContextType;
      const id = ctx.slice(idx + 1);
      if (id && isValidUUID(id) && (type === 'booklist' || type === 'path' || type === 'trail')) {
        return { type, id };
      }
    }
  }

  // 兼容旧 ?referralId=<booklistId>
  const referralId = params.get('referralId');
  if (referralId && isValidUUID(referralId)) {
    return { type: 'booklist', id: referralId };
  }

  return null;
}

/** 根据节点类别生成阅读链接（带 ctx 参数，保持上下文不丢） */
export function buildNodeUrl(
  category: string,
  contentId: string,
  ctx?: string | null,
): string {
  const base =
    category === 'chapter'
      ? `/read/${contentId}`
      : category === 'branch'
        ? `/branch/${contentId}`
        : category === 'spinoff'
          ? `/spinoff/${contentId}`
          : `/read/${contentId}`;
  return ctx ? `${base}?ctx=${ctx}` : base;
}

export function useReadingContext(currentChapterId?: string): ReadingContextValue {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const parsed = useMemo(() => parseContext(location.search), [location.search]);
  const type = parsed?.type ?? null;
  const id = parsed?.id ?? null;
  const ctxToken = parsed ? `${parsed.type}:${parsed.id}` : null;

  // ── booklist / path / trail 上下文 ──
  const { data: booklist } = useBooklist(type === 'booklist' ? id! : '');
  const { data: readingPath } = useReadingPath(type === 'path' ? id! : '');
  const { data: trail } = useTrail(type === 'trail' ? id! : '');

  const booklistItems = useMemo(() => {
    if (type !== 'booklist' || !booklist) return [];
    const bl = booklist as Booklist;
    const items = bl.itemsBySection?.mainline || bl.items || [];
    return items
      .filter((it: BooklistItem) => it.chapterId || (it.targetType === 'chapter' && it.targetId))
      .sort((a: BooklistItem, b: BooklistItem) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [type, booklist]);

  // booklist 进度回写
  const progress = useBooklistProgress({
    booklistId: type === 'booklist' ? (id ?? '') : '',
    totalItems: booklistItems.length,
  });

  // ── 统一的节点列表 ──
  const nodes: ContextNode[] = useMemo(() => {
    if (type === 'booklist') {
      return booklistItems.map((it: BooklistItem) => ({
        contentId: it.chapterId || it.targetId,
        title: it.chapter?.title || `第 ${it.chapter?.orderIndex || '?'} 章`,
        category: 'chapter' as const,
        categoryLabel: getCategoryLabel('chapter'),
      }));
    }
    if (type === 'path' && readingPath) {
      const rp = readingPath as ReadingPath;
      return rp.nodes.map((n: ReadingPathNode) => ({
        contentId: n.contentId,
        title: (n as any).contentTitle || n.title,
        category: n.nodeCategory,
        introduction: (n as any).introduction ?? null,
        note: (n as any).note ?? null,
        estimatedMin: (n as any).estimatedMin ?? null,
        categoryLabel: getCategoryLabel(n.nodeCategory),
      }));
    }
    if (type === 'trail' && trail) {
      return trail.path.nodes.map((n: ReadingPathNode) => ({
        contentId: n.contentId,
        title: n.title,
        category: n.nodeCategory,
        introduction: (n as any).introduction ?? null,
        note: (n as any).note ?? null,
        estimatedMin: (n as any).estimatedMin ?? null,
        categoryLabel: getCategoryLabel(n.nodeCategory),
      }));
    }
    return [];
  }, [type, booklistItems, readingPath, trail]);

  // ── 当前下标 ──
  const currentIndex = useMemo(() => {
    if (!currentChapterId || nodes.length === 0) return -1;
    return nodes.findIndex((n) => n.contentId === currentChapterId);
  }, [nodes, currentChapterId]);

  // ── 标题 ──
  const title = useMemo(() => {
    if (type === 'booklist' && booklist) return booklist.title;
    if (type === 'path' && readingPath) return (readingPath as ReadingPath).title ?? null;
    if (type === 'trail' && trail) return trail.path.title ?? null;
    return null;
  }, [type, booklist, readingPath, trail]);

  // ── 进度百分比 ──
  const completionPercentage = useMemo(() => {
    if (type === 'booklist') {
      return booklistItems.length > 0 ? progress.completionPercentage : null;
    }
    if (type === 'trail' && trail) {
      const total = trail.path.nodes?.length ?? 0;
      if (total === 0) return null;
      const done = trail.currentNodeIndex + 1;
      return Math.min(100, Math.round((done / total) * 100));
    }
    return null;
  }, [type, booklistItems.length, progress.completionPercentage, trail]);

  // ── 导航 ──
  const goToIndex = useCallback(
    (index: number) => {
      const node = nodes[index];
      if (!node) return;
      // 进入相邻章节时延续同一上下文
      navigate(buildNodeUrl(node.category, node.contentId, ctxToken));
    },
    [nodes, ctxToken, navigate],
  );

  const prev = useCallback(() => {
    if (currentIndex > 0) goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const next = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < nodes.length - 1) goToIndex(currentIndex + 1);
  }, [currentIndex, nodes.length, goToIndex]);

  // ── 推进（仅 trail）──
  const advance = useCallback(async () => {
    if (type !== 'trail' || !id) return;
    try {
      await client.post(`/reading-paths/trails/${id}/advance`);
      qc.invalidateQueries({ queryKey: ['reading-paths', 'trails', id] });
    } catch {
      console.error('[ReadingContext] Failed to advance trail');
    }
  }, [type, id, qc]);

  // ── 退出路径 ──
  const exitPath = useMemo(() => {
    if (type === 'booklist' && id) return `/booklist/${id}`;
    if (type === 'trail' && trail?.pathId) return `/reading-path/trail/${trail.pathId}`;
    if (type === 'path' && id) return `/reading-path/${id}`;
    return null;
  }, [type, id, trail]);

  // ── booklist 已读标记 ──
  const markCurrentRead = useCallback(() => {
    if (type !== 'booklist' || !currentChapterId) return;
    progress.markCompleted(currentChapterId);
    if (currentIndex >= 0) progress.setCurrentItem(currentIndex);
  }, [type, currentChapterId, currentIndex, progress]);

  return {
    type,
    id,
    title,
    nodes,
    currentIndex,
    hasPrev: currentIndex > 0,
    hasNext: currentIndex >= 0 && currentIndex < nodes.length - 1,
    prev,
    next,
    advance,
    exitPath,
    completionPercentage,
    markCurrentRead,
    raw: type === 'booklist' ? booklist : type === 'path' ? readingPath : type === 'trail' ? trail : null,
  };
}
