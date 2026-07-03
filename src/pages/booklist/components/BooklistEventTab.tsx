import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { EmptyState, Button, IconButton, Badge } from '../../../components/ui';
import EventDetailDrawer from './EventDetailDrawer';

interface BooklistEventTabProps {
  booklist: any;
  isCreator: boolean;
  onEditNotes: (item: any) => void;
  onRemove: (itemId: string) => void;
  onAddEvent?: () => void;
  onCreateEvent?: () => void;
}

export const BooklistEventTab: React.FC<BooklistEventTabProps> = ({
  booklist,
  isCreator,
  onEditNotes,
  onRemove,
  onAddEvent,
  onCreateEvent,
}) => {
  const b = booklist || {};
  const events = (b.items || []).filter((item: any) => item.targetType === 'event');
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [openEventStory, setOpenEventStory] = useState<{ storyId?: string; storyAuthorId?: string }>({});

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
            <Calendar size={14} className="text-white" />
          </div>
          <h2 className="text-base font-bold text-ink-800 dark:text-white tracking-tight">
            大事件
            <span className="text-sm font-normal text-ink-400 ml-2">({events.length})</span>
          </h2>
        </div>
        {isCreator && (onAddEvent || onCreateEvent) && (
          <div className="flex gap-2">
            {onCreateEvent && (
              <Button variant="primary" size="sm" onClick={onCreateEvent} className="shadow-lg shadow-accent-400/20">
                + 新建事件
              </Button>
            )}
            {onAddEvent && (
              <Button variant="subtle" size="sm" onClick={onAddEvent}>
                + 添加事件
              </Button>
            )}
          </div>
        )}
      </div>
      {events.length === 0 ? (
        <EmptyState icon={Calendar} title="暂无大事件" compact />
      ) : (
        <div className="space-y-3">
          {events.map((item: any) => {
            const evt = item.event || item;
            const eventId = evt.id || item.targetId;
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!eventId) return;
                  setOpenEventStory({
                    storyId: evt.storyId,
                    storyAuthorId: evt.story?.author?.id ?? evt.story?.authorId,
                  });
                  setOpenEventId(eventId);
                }}
                className="p-4 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-md hover:border-accent-200 dark:hover:border-accent-600 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: evt.color || '#f43f5e' }}
                  >
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-ink-800 dark:text-white">
                        {evt.title || '未命名事件'}
                      </h3>
                      {evt.type && (
                        <Badge tone="danger" size="sm">{evt.type}</Badge>
                      )}
                    </div>
                    {evt.description && (
                      <p className="text-xs text-ink-500 mt-1.5 line-clamp-2">
                        {evt.description}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-ink-400 italic mt-1">
                        点评：{item.notes}
                      </p>
                    )}
                    {evt.timestamp && (
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-ink-400">
                        <Calendar size={10} />
                        {new Date(evt.timestamp).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                  </div>
                  {isCreator && (
                    <div className="flex items-center gap-1 shrink-0">
                      <IconButton
                        variant="ghost"
                        size="sm"
                        aria-label="编辑点评"
                        title="编辑点评"
                        onClick={(e) => { e.stopPropagation(); onEditNotes(item); }}
                        className="h-auto w-auto p-2 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-500/15 text-ink-400 hover:text-accent-600"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                          <path d="m15 5 4 4"/>
                        </svg>
                      </IconButton>
                      <IconButton
                        variant="danger"
                        size="sm"
                        aria-label="移除"
                        title="移除"
                        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                        className="h-auto w-auto p-2 rounded-lg text-ink-400 dark:hover:bg-red-900/30"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"/>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                      </IconButton>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openEventId && (
        <EventDetailDrawer
          eventId={openEventId}
          storyId={openEventStory.storyId}
          storyAuthorId={openEventStory.storyAuthorId}
          onClose={() => setOpenEventId(null)}
        />
      )}
    </div>
  );
};

export default BooklistEventTab;