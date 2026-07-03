import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Plus, Star } from 'lucide-react';
import { storyEventService, StoryEvent } from '../../../api/storyEventService';
import { EmptyState } from '../../../components/ui';
import { EVENT_TYPE_LABELS } from '../../booklist/components/eventConstants';
import EventDetailDrawer from '../../booklist/components/EventDetailDrawer';
import CreateEventModal from '../../booklist/components/CreateEventModal';
import { useToast } from '../../../components/notifications';

interface StoryEventsTabProps {
  storyId: string;
  storyAuthorId?: string;
  isAuthor: boolean;
  storyTitle: string;
}

/**
 * 故事详情页的「大事件」Tab。
 * 展示该故事的全部事件（按 sortOrder 时间线排列），支持创建/查看。
 */
const StoryEventsTab: React.FC<StoryEventsTabProps> = ({ storyId, storyAuthorId, isAuthor, storyTitle }) => {
  const { addToast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const eventIdFromUrl = searchParams.get('eventId');
    if (eventIdFromUrl) {
      setDetailEventId(eventIdFromUrl);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('eventId');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['story-events', storyId],
    queryFn: () => storyEventService.getByStory(storyId),
    enabled: !!storyId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-2xl font-black flex items-center gap-3">
          <Calendar className="text-rose-500" />
          大事件时间线
        </h3>
        {isAuthor && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition-all"
          >
            <Plus size={16} />
            创建大事件
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-rose-500 border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="暂无大事件"
          description={isAuthor ? '点击「创建大事件」为这个故事标记关键情节节点' : '这个故事还没有标记任何大事件'}
          action={isAuthor ? { label: '创建大事件', onClick: () => setIsCreateOpen(true) } : undefined}
        />
      ) : (
        /* 垂直时间线 */
        <div className="relative px-4">
          {/* 连接线 */}
          <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-gradient-to-b from-rose-400 via-rose-200 to-transparent rounded-full" />

          <div className="space-y-4">
            {(events as StoryEvent[]).map((evt, idx) => {
              const color = evt.color || '#f43f5e';
              const typeLabel = EVENT_TYPE_LABELS[evt.type] || evt.type || '主线';
              return (
                <div key={evt.id} className="relative flex items-start gap-4 pl-0">
                  {/* 节点圆点 */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white dark:ring-ink-800 relative z-10"
                    style={{ backgroundColor: color }}
                  >
                    <span className="text-white text-xs font-black">{idx + 1}</span>
                  </div>

                  {/* 事件卡片 */}
                  <button
                    onClick={() => setDetailEventId(evt.id)}
                    className="flex-1 text-left p-4 rounded-2xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:border-rose-200 dark:hover:border-rose-700 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-ink-800 dark:text-white group-hover:text-rose-500 transition-colors">
                          {evt.title}
                        </h4>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star
                              key={n}
                              size={10}
                              className={n <= (evt.importance || 1) ? 'text-amber-400 fill-amber-400' : 'text-ink-200 dark:text-ink-500'}
                            />
                          ))}
                        </div>
                      </div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{ backgroundColor: color + '20', color }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                    {evt.description && (
                      <p className="text-xs text-ink-500 dark:text-ink-400 mt-2 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    )}
                    {evt.nodes && evt.nodes.length > 0 && (
                      <p className="text-[10px] text-ink-400 mt-2">
                        {evt.nodes.length} 个关联内容
                      </p>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 事件详情抽屉 */}
      {detailEventId && (
        <EventDetailDrawer
          eventId={detailEventId}
          onClose={() => setDetailEventId(null)}
          storyAuthorId={storyAuthorId}
          storyId={storyId}
        />
      )}

      {/* 创建事件弹窗（预设 storyId，跳过选故事步骤）*/}
      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(eventId) => {
          setIsCreateOpen(false);
          addToast('success', '大事件已创建');
          setDetailEventId(eventId);
        }}
        presetStoryId={storyId}
        presetStoryTitle={storyTitle}
      />
    </div>
  );
};

export default StoryEventsTab;
