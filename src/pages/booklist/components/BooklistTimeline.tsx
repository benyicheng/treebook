import React, { useState, useCallback } from 'react';
import { MapPin, Plus, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import BooklistChapterCard from './BooklistChapterCard';
import BooklistProgressBar from './BooklistProgressBar';
import { useBooklistProgress } from '../../../hooks/useBooklistProgress';

interface ChapterItem {
  id: string;
  chapterId: string;
  notes?: string;
  chapter: {
    id: string;
    title: string;
    content?: string;
    branchId?: string | null;
    story: {
      id: string;
      title: string;
      author?: {
        username: string;
      };
    };
  };
}

interface BooklistTimelineProps {
  items: ChapterItem[];
  booklistId: string;
  isCreator: boolean;
  onAddChapter: () => void;
  onRead: (item: ChapterItem, index: number) => void;
  onEditNotes: (item: ChapterItem) => void;
  onMoveItem: (itemId: string, direction: 'up' | 'down') => void;
  onRemoveItem: (itemId: string) => void;
  onReorder: (items: ChapterItem[]) => void;
}

const BooklistTimeline: React.FC<BooklistTimelineProps> = ({
  items,
  booklistId,
  isCreator,
  onAddChapter,
  onRead,
  onEditNotes,
  onMoveItem,
  onRemoveItem,
  onReorder,
}) => {
  const navigate = useNavigate();

  const {
    isCompleted,
    continueReading,
    completionPercentage,
    completedCount,
    totalItems,
  } = useBooklistProgress({
    booklistId,
    totalItems: items.length,
  });

  const currentIndex = continueReading();

  // ─── DnD Sensors ──────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // 8px threshold prevents accidental drag
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered);
  }, [items, onReorder]);

  return (
    <div className="space-y-12 px-4 relative">
      {/* Connecting line */}
      <div className="absolute left-10 md:left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-400 via-accent-400/20 to-transparent rounded-full -z-10"></div>

      <div className="ml-20 md:ml-24 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-ink-800 dark:text-white flex items-center gap-3">
            <MapPin className="text-accent-500" />
            阅读路线详情
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {completedCount > 0 && (
            <span className="text-xs font-bold text-accent-500 bg-accent-50 dark:bg-accent-500/10 px-3 py-1.5 rounded-full">
              已完成 {completedCount}/{totalItems} 站
            </span>
          )}
          {isCreator && (
            <button
              onClick={onAddChapter}
              className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-xl font-bold text-sm hover:bg-accent-600 transition-all"
            >
              <Plus size={16} />
              添加章节
            </button>
          )}
          {isCreator && items.length > 1 && (
            <span className="text-[10px] text-ink-400 font-medium hidden md:inline">
              💡 拖拽卡片可调整顺序
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {items.length > 0 && (
        <div className="ml-20 md:ml-24">
          <BooklistProgressBar
            completedCount={completedCount}
            totalItems={totalItems}
            percentage={completionPercentage}
          />
        </div>
      )}

      {/* Chapter Cards (DnD context) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-12">
            {items.map((item, index) => (
              <BooklistChapterCard
                key={item.id}
                item={item}
                index={index}
                totalItems={items.length}
                booklistId={booklistId}
                isCreator={isCreator}
                isCompleted={isCompleted(item.id)}
                isCurrent={index === currentIndex && !isCompleted(item.id)}
                onRead={onRead}
                onEditNotes={onEditNotes}
                onMoveUp={(id) => onMoveItem(id, 'up')}
                onMoveDown={(id) => onMoveItem(id, 'down')}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Journey End */}
      <div className="ml-20 md:ml-24 pt-12 pb-20">
        <div className="flex flex-col items-center justify-center text-center p-12 bg-ink-100 dark:bg-ink-800/30 rounded-3xl border-2 border-dashed border-ink-200 dark:border-ink-700 space-y-4">
          <div className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-500 ${
            completedCount === totalItems && totalItems > 0
              ? 'bg-accent-400 text-white scale-110'
              : 'bg-white dark:bg-ink-700 text-accent-500'
          }`}>
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-ink-800 dark:text-white">
              {completedCount === totalItems && totalItems > 0 ? '旅程完成！' : '旅程终点'}
            </h3>
            <p className="text-ink-500 dark:text-ink-400 font-medium">
              {completedCount === totalItems && totalItems > 0
                ? '恭喜你走完了这条阅读路线的所有内容！'
                : '这就是本条阅读路线的所有推荐内容。'}
            </p>
          </div>
          <button
            onClick={() => navigate('/booklist')}
            className="mt-4 px-8 py-3 bg-ink-50 dark:bg-ink-700 text-ink-800 dark:text-white border border-ink-200 dark:border-ink-600 rounded-xl font-black text-sm hover:shadow-lg transition-all active:scale-95"
          >
            探索更多路线
          </button>
        </div>
      </div>
    </div>
  );
};

export default BooklistTimeline;
