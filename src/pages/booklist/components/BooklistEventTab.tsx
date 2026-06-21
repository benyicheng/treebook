import React, { useMemo, useState } from 'react';
import { Calendar, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import BooklistEventCard from './BooklistEventCard';
import { EventConnectorsProvider } from './EventConnectorsContext';

interface BooklistEventTabProps {
  itemsByStory: any[];
  isCreator: boolean;
  onRemoveItem: (itemId: string) => void;
  onEditNotes: (item: any) => void;
  onOpenCreateEvent: () => void;
  onOpenAddEvent: () => void;
}

const BooklistEventTab: React.FC<BooklistEventTabProps> = ({
  itemsByStory,
  isCreator,
  onRemoveItem,
  onEditNotes,
  onOpenCreateEvent,
  onOpenAddEvent,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (storyId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(storyId) ? next.delete(storyId) : next.add(storyId);
      return next;
    });
  };

  const totalEvents = itemsByStory.reduce((acc: number, g: any) => acc + (g.events?.length || 0), 0);
  const hasEvents = itemsByStory.some((g: any) => g.events?.length > 0);

  // 收集所有事件 ID 给 EventConnectorsProvider 批量预拉。
  // Provider 内部按 flag 决定是否真正发请求；flag off 则等同未渲染。
  const allEventIds = useMemo(() => {
    const ids: string[] = [];
    for (const group of itemsByStory) {
      for (const item of group.events || []) {
        const evt = item.event || item;
        if (evt?.id) ids.push(evt.id);
      }
    }
    return ids;
  }, [itemsByStory]);

  return (
    <EventConnectorsProvider eventIds={allEventIds}>
      <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink-800 dark:text-white flex items-center gap-2">
          <Calendar size={18} className="text-rose-500" />
          大事件
          <span className="text-sm font-normal text-ink-400">({totalEvents})</span>
        </h2>
        {isCreator && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCreateEvent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              <Plus size={14} /> 创建大事件
            </button>
            <button
              onClick={onOpenAddEvent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
            >
              添加已有
            </button>
          </div>
        )}
      </div>

      {!hasEvents ? (
        <p className="text-sm text-ink-400 py-8 text-center">暂未添加大事件</p>
      ) : (
        <div className="space-y-4">
          {itemsByStory.filter((g: any) => g.events?.length > 0).map((group: any) => {
            const isCollapsed = collapsedGroups.has(group.storyId);
            return (
              <div
                key={group.storyId}
                className="rounded-2xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 overflow-hidden"
              >
                <button
                  onClick={() => toggleGroup(group.storyId)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-rose-50 to-transparent dark:from-rose-900/20 border-b border-ink-100 dark:border-ink-600 flex items-center gap-3 hover:from-rose-100 dark:hover:from-rose-900/30 transition-colors text-left"
                >
                  {isCollapsed ? <ChevronRight size={16} className="text-rose-500 shrink-0" /> : <ChevronDown size={16} className="text-rose-500 shrink-0" />}
                  <Calendar size={16} className="text-rose-500 shrink-0" />
                  <p className="text-sm font-bold text-ink-700 dark:text-ink-300">{group.story?.title || '未知故事'}</p>
                  <span className="text-xs text-ink-400">({group.events.length} 个事件)</span>
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-ink-100 dark:divide-ink-600">
                    {group.events.map((item: any) => (
                      <BooklistEventCard
                        key={item.id}
                        item={item}
                        isCreator={isCreator}
                        onRemove={onRemoveItem}
                        onEditNotes={onEditNotes}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </EventConnectorsProvider>
  );
};

export default BooklistEventTab;
