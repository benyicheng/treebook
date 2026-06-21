/**
 * Event Connector Inline Grid — 单连接器展开面板
 *
 * 用户点击 Bar 中的某格徽标后，在卡片底部展开此面板，
 * 显示该连接器的 top-3 preview 项。
 *
 * MVP 简化：每次只展开 1 格（不是同时 3×2 全展），降低视觉拥挤。
 * 更大尺寸的 3×2 全展留给 Phase 4 的 Drawer。
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, GitCompare } from 'lucide-react';
import { CONNECTOR_META } from './eventConnectorMeta';
import { useNavigationStackStore } from '../../../stores/useNavigationStackStore';
import type {
  EventConnectors,
  ConnectorKey,
  ChapterPreview,
  CharacterPreview,
  WikiPreview,
  BranchPreview,
  SpinoffPreview,
  ReadingPathPreview,
} from '../../../api/eventConnectorService';

interface EventConnectorInlineGridProps {
  connectors: EventConnectors;
  activeKey: ConnectorKey;
  /** Phase 4：当前事件 ID + 标题，供分支对比入口使用 */
  eventId?: string;
  eventTitle?: string;
  /** Phase 4：点击"对比预览"时回调，由父组件打开 Drawer */
  onCompareBranches?: (eventId: string, eventTitle: string) => void;
}

const EventConnectorInlineGrid: React.FC<EventConnectorInlineGridProps> = ({
  connectors,
  activeKey,
  eventId,
  eventTitle,
  onCompareBranches,
}) => {
  const navigate = useNavigate();
  const { openDrawer } = useNavigationStackStore();
  const meta = CONNECTOR_META.find((m) => m.key === activeKey);
  if (!meta) return null;

  const summary = connectors[activeKey];
  const renderItems = (): React.ReactNode => {
    if (summary.count === 0) {
      return <p className="text-xs text-ink-400 px-2">暂无关联</p>;
    }
    switch (activeKey) {
      case 'chapters':
        return (summary.preview as ChapterPreview[]).map((c) => (
          <ItemRow
            key={c.id}
            primary={c.title}
            secondary={c.orderIndex !== null ? `第 ${c.orderIndex + 1} 章` : null}
            onClick={() => openDrawer({ path: '/read/' + c.id, title: c.title })}
          />
        ));
      case 'characters':
        return (summary.preview as CharacterPreview[]).map((ch) => (
          <ItemRow
            key={ch.id}
            primary={ch.name}
            secondary={ch.role}
            onClick={() => navigate('/character/' + ch.id)}
          />
        ));
      case 'wiki':
        return (summary.preview as WikiPreview[]).map((w) => (
          <ItemRow
            key={w.id}
            primary={w.title}
            secondary={w.contentType}
            onClick={() => navigate('/wiki/' + w.id)}
          />
        ));
      case 'branches':
        return (
          <>
            {(summary.preview as BranchPreview[]).map((b) => (
              <ItemRow
                key={b.id}
                primary={b.title}
                secondary={`${b.chapterCount} 章 · ${b.branchType}`}
                onClick={() => navigate('/branch/' + b.id)}
              />
            ))}
            {/*
              Phase 4：分支对比入口。
              仅当父组件提供了 onCompareBranches 回调 + eventId 时显示。
              点击打开 BranchCompareDrawer 双栏对比。
            */}
            {onCompareBranches && eventId && eventTitle && (
              <button
                type="button"
                onClick={() => onCompareBranches(eventId, eventTitle)}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 mt-1
                  rounded text-xs font-medium text-amber-600 dark:text-amber-400
                  hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              >
                <GitCompare size={12} />
                对比预览 ⇆
              </button>
            )}
          </>
        );
      case 'spinoffs':
        return (summary.preview as SpinoffPreview[]).map((s) => (
          <ItemRow
            key={s.id}
            primary={s.title}
            secondary={s.isOfficial ? '官方 · ' + s.type : s.type}
            onClick={() => navigate('/spinoff/' + s.id)}
          />
        ));
      case 'readingPaths':
        return (summary.preview as ReadingPathPreview[]).map((p) => (
          <ItemRow
            key={p.id}
            primary={p.title}
            secondary={p.origin}
            onClick={() => navigate('/reading-path/' + p.id)}
          />
        ));
      default:
        return null;
    }
  };

  return (
    <div
      className="rounded-lg bg-ink-50 dark:bg-ink-800/50 border border-ink-100 dark:border-ink-600 px-2 py-2 space-y-1"
      role="region"
      aria-label={`${meta.label}详情`}
    >
      <div className={'flex items-center gap-1.5 px-1 text-[11px] font-bold ' + meta.accentClass}>
        {meta.icon}
        <span>
          {meta.label}（{summary.count}）
        </span>
        {summary.count > summary.preview.length && (
          <span className="text-ink-400 font-normal ml-auto">
            显示前 {summary.preview.length} 项
          </span>
        )}
      </div>
      <div className="space-y-0.5">{renderItems()}</div>
    </div>
  );
};

// ── 单条预览行 ───────────────────────────────────────────────────────

interface ItemRowProps {
  primary: string;
  secondary: string | null;
  onClick: () => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ primary, secondary, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs
      hover:bg-white dark:hover:bg-ink-700 transition-colors text-left"
  >
    <span className="text-ink-700 dark:text-ink-200 font-medium truncate">{primary}</span>
    {secondary && <span className="text-ink-400 truncate">— {secondary}</span>}
    <ChevronRight size={10} className="ml-auto text-ink-300 shrink-0" />
  </button>
);

export default EventConnectorInlineGrid;
