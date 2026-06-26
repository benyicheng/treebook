import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Library, Calendar, Check, type LucideIcon } from 'lucide-react';
import { Modal } from '../../../components/ui';
import { chapterService, storyService } from '../../../api/storyService';
import { storyEventService, StoryEvent } from '../../../api/storyEventService';

type TabType = 'chapter' | 'story' | 'event';

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingChapterIds: Set<string>;
  existingStoryIds: Set<string>;
  existingEventIds: Set<string>;
  onAddChapters: (ids: string[], notes: string) => Promise<void>;
  onAddStories: (ids: string[], notes: string) => Promise<void>;
  onAddEvents: (ids: string[], notes: string) => Promise<void>;
  onOpenCreateEvent?: () => void;
}

const AddItemDialog: React.FC<AddItemDialogProps> = ({
  isOpen, onClose,
  existingChapterIds, existingStoryIds, existingEventIds,
  onAddChapters, onAddStories, onAddEvents,
  onOpenCreateEvent,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('chapter');

  // Chapter search
  const [chapterQuery, setChapterQuery] = useState('');
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const { data: chapterResults = [], isLoading: isChaptersLoading } = useQuery({
    queryKey: ['chapters', 'search', chapterQuery],
    queryFn: () => chapterService.search(chapterQuery),
    enabled: chapterQuery.trim().length > 0,
  });

  // Story search
  const [storyQuery, setStoryQuery] = useState('');
  const [selectedStoryIds, setSelectedStoryIds] = useState<Set<string>>(new Set());
  const { data: storyResults = [], isLoading: isStoriesLoading } = useQuery({
    queryKey: ['stories', 'search', storyQuery],
    queryFn: () => storyService.getAll({ q: storyQuery }),
    enabled: storyQuery.trim().length > 0,
  });

  // Event search
  const [eventQuery, setEventQuery] = useState('');
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const { data: eventResults = [], isLoading: isEventsLoading } = useQuery({
    queryKey: ['events', 'search', eventQuery],
    queryFn: () => storyEventService.search(eventQuery),
    enabled: eventQuery.trim().length > 0,
  });

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setChapterQuery('');
      setStoryQuery('');
      setEventQuery('');
      setSelectedChapterIds(new Set());
      setSelectedStoryIds(new Set());
      setSelectedEventIds(new Set());
      setNotes('');
    }, 200);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (activeTab === 'chapter' && selectedChapterIds.size > 0) {
        await onAddChapters(Array.from(selectedChapterIds), notes);
      } else if (activeTab === 'story' && selectedStoryIds.size > 0) {
        await onAddStories(Array.from(selectedStoryIds), notes);
      } else if (activeTab === 'event' && selectedEventIds.size > 0) {
        await onAddEvents(Array.from(selectedEventIds), notes);
      }
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = activeTab === 'chapter' ? selectedChapterIds.size
    : activeTab === 'story' ? selectedStoryIds.size
    : selectedEventIds.size;

  const tabs: { id: TabType; label: string; icon: LucideIcon }[] = [
    { id: 'chapter', label: '章节', icon: BookOpen },
    { id: 'story', label: '故事', icon: Library },
    { id: 'event', label: '事件', icon: Calendar },
  ];

  const renderChapterTab = () => {
    const groupByStory = (chapters: any[]) => {
      const map = new Map<string, { storyId: string; storyTitle: string; chapters: any[] }>();
      chapters.forEach((ch: any) => {
        const storyId = ch.story?.id || 'unknown';
        if (!map.has(storyId)) map.set(storyId, { storyId, storyTitle: ch.story?.title || '未知故事', chapters: [] });
        map.get(storyId)!.chapters.push(ch);
      });
      return Array.from(map.values());
    };

    const toggleSelection = (id: string) => {
      setSelectedChapterIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    };

    const toggleAll = () => {
      const available = chapterResults.filter((ch: any) => !existingChapterIds.has(ch.id));
      const allSelected = available.every((ch: any) => selectedChapterIds.has(ch.id));
      setSelectedChapterIds(prev => {
        const next = new Set(prev);
        allSelected
          ? available.forEach((ch: any) => next.delete(ch.id))
          : available.forEach((ch: any) => next.add(ch.id));
        return next;
      });
    };

    if (isChaptersLoading) return <p className="text-sm text-ink-400 text-center py-8">搜索中...</p>;
    if (chapterQuery.trim().length === 0) return <p className="text-sm text-ink-400 text-center py-8">输入关键词搜索章节</p>;
    if (chapterResults.length === 0) return <p className="text-sm text-ink-400 text-center py-8">未找到匹配的章节</p>;

    return (
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-400">{selectedChapterIds.size} 个已选</span>
          <button onClick={toggleAll} className="text-xs font-bold text-accent-600 hover:text-accent-700">
            {chapterResults.filter((ch: any) => !existingChapterIds.has(ch.id)).every((ch: any) => selectedChapterIds.has(ch.id)) ? '取消全选' : '全选'}
          </button>
        </div>
        {groupByStory(chapterResults).map((group: any) => (
          <div key={group.storyId}>
            <p className="text-sm font-bold text-ink-500 mb-2">{group.storyTitle}</p>
            {group.chapters.map((ch: any) => {
              const exists = existingChapterIds.has(ch.id);
              const selected = selectedChapterIds.has(ch.id);
              return (
                <div key={ch.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border mb-1 transition-colors ${
                    selected ? 'border-accent-300 bg-accent-50' : 'border-ink-100 hover:bg-ink-50'
                  } ${exists ? 'opacity-50' : 'cursor-pointer'}`}
                  onClick={() => !exists && toggleSelection(ch.id)}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selected ? 'bg-accent-500 border-accent-500' : 'border-ink-300'}`}>
                    {selected && <Check size={12} className="text-white" />}
                  </div>
                  <span className="flex-1 text-sm font-medium">{ch.title || `第${ch.order}章`}</span>
                  {exists && <span className="text-[10px] text-ink-400">已添加</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderStoryTab = () => {
    const toggleSelection = (id: string) => {
      setSelectedStoryIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    };

    if (isStoriesLoading) return <p className="text-sm text-ink-400 text-center py-8">搜索中...</p>;
    if (storyQuery.trim().length === 0) return <p className="text-sm text-ink-400 text-center py-8">输入关键词搜索故事</p>;
    if (storyResults.length === 0) return <p className="text-sm text-ink-400 text-center py-8">未找到匹配的故事</p>;

    return (
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {storyResults.map((story: any) => {
          const exists = existingStoryIds.has(story.id);
          const selected = selectedStoryIds.has(story.id);
          return (
            <div key={story.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                selected ? 'border-indigo-300 bg-indigo-50' : 'border-ink-100 hover:bg-ink-50'
              } ${exists ? 'opacity-50' : 'cursor-pointer'}`}
              onClick={() => !exists && toggleSelection(story.id)}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selected ? 'bg-indigo-500 border-indigo-500' : 'border-ink-300'}`}>
                {selected && <Check size={12} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{story.title}</p>
                {story.author && (
                  <p className="text-xs text-ink-400">作者：{story.author.username || story.author}</p>
                )}
              </div>
              {exists && <span className="text-[10px] text-ink-400 shrink-0">已添加</span>}
            </div>
          );
        })}
      </div>
    );
  };

  const renderEventTab = () => {
    const toggleSelection = (id: string) => {
      setSelectedEventIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    };

    if (isEventsLoading) return <p className="text-sm text-ink-400 text-center py-8">搜索中...</p>;
    if (eventQuery.trim().length === 0) return <p className="text-sm text-ink-400 text-center py-8">输入关键词搜索已有事件</p>;
    if (eventResults.length === 0) return (
      <div className="text-center py-8 space-y-3">
        <p className="text-sm text-ink-400">未找到匹配的事件</p>
        {onOpenCreateEvent && (
          <button onClick={() => { onOpenCreateEvent(); onClose(); }}
            className="text-sm font-bold text-rose-600 hover:text-rose-700 underline underline-offset-2">
            创建新大事件
          </button>
        )}
      </div>
    );

    return (
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {eventResults.map((evt: StoryEvent) => {
          const exists = existingEventIds.has(evt.id);
          const selected = selectedEventIds.has(evt.id);
          return (
            <div key={evt.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                selected ? 'border-rose-300 bg-rose-50' : 'border-ink-100 hover:bg-ink-50'
              } ${exists ? 'opacity-50' : 'cursor-pointer'}`}
              onClick={() => !exists && toggleSelection(evt.id)}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selected ? 'bg-rose-500 border-rose-500' : 'border-ink-300'}`}>
                {selected && <Check size={12} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{evt.title}</p>
                {evt.description && (
                  <p className="text-xs text-ink-400 truncate">{evt.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 font-medium">{evt.type}</span>
                  {evt.nodes && (
                    <span className="text-[10px] text-ink-400">{evt.nodes.length} 个节点</span>
                  )}
                </div>
              </div>
              {exists && <span className="text-[10px] text-ink-400 shrink-0">已添加</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="添加到书单">
      <div className="space-y-4">
        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-ink-50 dark:bg-ink-700 border border-ink-100 dark:border-ink-600 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-ink-600 text-ink-800 dark:text-white shadow-sm'
                  : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none focus:ring-2 focus:ring-accent-500"
            value={activeTab === 'chapter' ? chapterQuery : activeTab === 'story' ? storyQuery : eventQuery}
            onChange={e => {
              const val = e.target.value;
              if (activeTab === 'chapter') {
                setChapterQuery(val);
              } else if (activeTab === 'story') {
                setStoryQuery(val);
              } else {
                setEventQuery(val);
              }
            }}
            placeholder={activeTab === 'chapter' ? '搜索章节...' : activeTab === 'story' ? '搜索故事...' : '搜索事件...'}
          />
        </div>

        {/* Tab content */}
        {activeTab === 'chapter' && renderChapterTab()}
        {activeTab === 'story' && renderStoryTab()}
        {activeTab === 'event' && renderEventTab()}

        {/* Submit */}
        {selectedCount > 0 && (
          <>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none focus:ring-2 focus:ring-accent-500 resize-none"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="批量添加导游点评（可选）"
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 bg-accent-600 text-white rounded-xl font-black disabled:opacity-50 hover:bg-accent-700 transition-colors"
            >
              {isSubmitting ? '添加中...' : `添加 ${selectedCount} 个${activeTab === 'chapter' ? '章节' : activeTab === 'story' ? '故事' : '事件'}`}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default AddItemDialog;
