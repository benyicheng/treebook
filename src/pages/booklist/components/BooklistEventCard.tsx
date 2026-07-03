import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, BookOpen, GitBranch, Sparkles, Star, ChevronDown, ChevronRight, X, Edit3, MessageCircle
} from 'lucide-react';
import { useNavigationStackStore } from '../../../stores/useNavigationStackStore';
import { useEventConnector } from './EventConnectorsContext';
import EventConnectorBar from './EventConnectorBar';
import EventConnectorInlineGrid from './EventConnectorInlineGrid';
import BranchCompareDrawer from './BranchCompareDrawer';
import EventDetailDrawer from './EventDetailDrawer';
import { LikeButton } from '../../../components/Interaction/LikeButton';
import { ShareButton } from '../../../components/Interaction/ShareButton';
import { IconButton, Button } from '../../../components/ui';
import { EVENT_TYPE_LABELS } from './eventConstants';
import type { ConnectorKey } from '../../../api/eventConnectorService';

const NODE_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  chapter: { icon: <BookOpen size={12} />, label: '章节' },
  branch: { icon: <GitBranch size={12} />, label: '分支' },
  spinoff: { icon: <Sparkles size={12} />, label: '番外' },
};

interface BooklistEventCardProps {
  item: any;
  isCreator: boolean;
  onRemove: (itemId: string) => void;
  onEditNotes: (item: any) => void;
}

const BooklistEventCard: React.FC<BooklistEventCardProps> = ({
  item,
  isCreator,
  onRemove,
  onEditNotes,
}) => {
  const navigate = useNavigate();
  const { openDrawer } = useNavigationStackStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const evt = item.event || item;
  const color = evt.color || '#f43f5e';
  const typeLabel = EVENT_TYPE_LABELS[evt.type] || evt.type || '主线';
  const nodes = evt.nodes || [];
  const hasNodes = nodes.length > 0;

  // ── 事件详情弹窗 ──
  const [detailOpen, setDetailOpen] = useState(false);

  // ── 六向连接器（feature flag 守护）────────────────────────────
  // hook 在 flag off / 加载中 / 失败时返回 { active: false }，等价于不存在
  const connectorState = useEventConnector(evt.id);
  const [activeConnectorKey, setActiveConnectorKey] = useState<ConnectorKey | null>(null);
  // Phase 4：分支对比 Drawer 状态
  const [compareDrawer, setCompareDrawer] = useState<{
    open: boolean;
    eventId: string;
    eventTitle: string;
  }>({ open: false, eventId: '', eventTitle: '' });

  const handleNodeClick = (node: any) => {
    if (node.targetType === 'chapter') {
      openDrawer(
        { path: '/read/' + node.targetId, title: evt.title + ' — 关联章节' },
      );
    } else if (node.targetType === 'branch') {
      navigate('/branch/' + node.targetId);
    } else if (node.targetType === 'spinoff') {
      navigate('/spinoff/' + node.targetId);
    }
  };

  return (
    <div
      className="group relative flex overflow-hidden transition-all duration-200 hover:shadow-md rounded-xl
        bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600
        hover:border-ink-200 dark:hover:border-ink-500"
    >
      <div className="w-1 shrink-0" style={{ backgroundColor: color }} />

      <div className="flex-1 min-w-0 px-4 py-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: color }}
            >
              <Calendar size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <button
                onClick={() => setDetailOpen(true)}
                className="text-sm font-bold text-ink-800 dark:text-white truncate block w-full text-left hover:text-accent-500 transition-colors"
              >
                {evt.title}
              </button>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    size={10}
                    className={n <= (evt.importance || 1) ? 'text-amber-400 fill-amber-400' : 'text-ink-200 dark:text-ink-500'}
                  />
                ))}
              </div>
            </div>
          </div>

          {isCreator && (
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="从书单移除"
              title="从书单移除"
              onClick={() => onRemove(item.id)}
              className="h-auto w-auto p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-ink-400 hover:text-red-500 shrink-0"
            >
              <X size={14} />
            </IconButton>
          )}
        </div>

        {evt.description && (
          <p className="text-xs text-ink-500 leading-relaxed line-clamp-2">{evt.description}</p>
        )}

        {(evt.id) && (
          <div className="flex items-center gap-2">
            <LikeButton targetType="event" targetId={evt.id} size="sm" showCount={true} />
            <ShareButton
              targetType="event"
              targetId={evt.id}
              title={evt.title}
              description={evt.description || ''}
              size="sm"
              showCount={false}
            />
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: color + '20', color }}
          >
            {typeLabel}
          </span>
          {hasNodes && (
            <span className="text-[10px] text-ink-400">
              {nodes.length} 个关联{nodes.length > 1 ? '内容' : '内容'}
            </span>
          )}
        </div>

        {item.notes && (
          <div className="flex items-start gap-1.5 text-xs text-ink-400 italic bg-ink-50 dark:bg-ink-800/50 rounded-lg px-2.5 py-1.5">
            <MessageCircle size={12} className="shrink-0 mt-0.5 text-ink-300" />
            <span className="flex-1">{item.notes}</span>
            {isCreator && (
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="编辑点评"
                onClick={() => onEditNotes(item)}
                className="h-auto w-auto p-0 shrink-0 text-ink-300 hover:text-accent-500"
              >
                <Edit3 size={10} />
              </IconButton>
            )}
          </div>
        )}

        {/*
          六向连接器（flag on 时展示）：
          - Bar: 6 格徽标
          - InlineGrid: 点击徽标后展开对应面板
          flag off / 加载中 / 失败时 connectorState.active === false，整块不渲染，
          UI 与未启用 feature 时逐字节相同（零回归）。
        */}
        {connectorState.active && (
          <div className="space-y-1.5 pt-1 border-t border-ink-100 dark:border-ink-600">
            <EventConnectorBar
              connectors={connectorState.connectors}
              activeKey={activeConnectorKey}
              onSelect={setActiveConnectorKey}
            />
            {activeConnectorKey && (
              <EventConnectorInlineGrid
                connectors={connectorState.connectors}
                activeKey={activeConnectorKey}
                eventId={evt.id}
                eventTitle={evt.title}
                onCompareBranches={(eId, eTitle) =>
                  setCompareDrawer({ open: true, eventId: eId, eventTitle: eTitle })
                }
              />
            )}
          </div>
        )}

        {/*
          Phase 4：分支对比 Drawer。
          仅在用户从 branches 连接器点击"对比预览"时打开。
          flag off 时 connectorState.active=false，对比入口根本不渲染，Drawer 永不触发。
        */}
        <BranchCompareDrawer
          isOpen={compareDrawer.open}
          onClose={() => setCompareDrawer((s) => ({ ...s, open: false }))}
          eventId={compareDrawer.eventId}
          eventTitle={compareDrawer.eventTitle}
        />

        {detailOpen && (
          <EventDetailDrawer
            eventId={evt.id}
            onClose={() => setDetailOpen(false)}
            storyId={evt.storyId}
          />
        )}

        {hasNodes && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              leftIcon={isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              className="h-auto gap-1 text-[10px] text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 px-0 py-0"
            >
              关联内容 ({nodes.length})
            </Button>

            {isExpanded && (
              <div className="space-y-0.5 pl-1">
                {nodes.map((node: any) => {
                  const cfg = NODE_CONFIG[node.targetType] || { icon: null, label: node.targetType };
                  return (
                    <button
                      key={node.id}
                      onClick={() => handleNodeClick(node)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs
                        hover:bg-ink-50 dark:hover:bg-ink-600/50 transition-colors text-left"
                    >
                      <span className="text-ink-400 shrink-0">{cfg.icon}</span>
                      <span className="text-ink-600 dark:text-ink-300 font-medium">{cfg.label}</span>
                      {node.note && (
                        <span className="text-ink-400 truncate">— {node.note}</span>
                      )}
                      <ChevronRight size={10} className="ml-auto text-ink-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BooklistEventCard;
