import React from 'react';
import { MapPin, Plus, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

  return (
    <div className="space-y-12 px-4 relative">
      {/* Connecting line */}
      <div className="absolute left-10 md:left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-emerald-500/20 to-transparent rounded-full -z-10"></div>

      <div className="ml-20 md:ml-24 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <MapPin className="text-emerald-600" />
            阅读路线详情
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {completedCount > 0 && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
              已完成 {completedCount}/{totalItems} 站
            </span>
          )}
          {isCreator && (
            <button
              onClick={onAddChapter}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all"
            >
              <Plus size={16} />
              添加章节
            </button>
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

      {/* Chapter Cards */}
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

      {/* Journey End */}
      <div className="ml-20 md:ml-24 pt-12 pb-20">
        <div className="flex flex-col items-center justify-center text-center p-12 bg-gray-100 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 space-y-4">
          <div className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-500 ${
            completedCount === totalItems && totalItems > 0
              ? 'bg-emerald-500 text-white scale-110'
              : 'bg-white dark:bg-gray-800 text-emerald-600'
          }`}>
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              {completedCount === totalItems && totalItems > 0 ? '旅程完成！' : '旅程终点'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {completedCount === totalItems && totalItems > 0
                ? '恭喜你走完了这条阅读路线的所有内容！'
                : '这就是本条阅读路线的所有推荐内容。'}
            </p>
          </div>
          <button
            onClick={() => navigate('/booklist')}
            className="mt-4 px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl font-black text-sm hover:shadow-lg transition-all active:scale-95"
          >
            探索更多路线
          </button>
        </div>
      </div>
    </div>
  );
};

export default BooklistTimeline;
