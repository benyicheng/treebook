import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ReadingDrawerFooterProps {
  currentIndex: number;
  totalItems: number;
  hasReadToBottom: boolean;
  currentItem: any;
  isCompleted: (chapterId: string) => boolean;
  onPrev: () => void;
  onNext: () => void;
  onMarkRead: () => void;
  onClose: () => void;
}

const ReadingDrawerFooter: React.FC<ReadingDrawerFooterProps> = ({
  currentIndex,
  totalItems,
  hasReadToBottom,
  currentItem,
  isCompleted,
  onPrev,
  onNext,
  onMarkRead,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-ink-100 dark:border-ink-700 bg-ink-50/80 dark:bg-ink-800/50 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-ink-500 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} />
          上一站
        </button>
      </div>

      <div className="flex items-center gap-3">
        {!hasReadToBottom && !(currentItem && isCompleted(currentItem.chapterId)) && (
          <button
            onClick={onMarkRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-xl transition-colors"
          >
            <CheckCircle2 size={16} />
            标记已读
          </button>
        )}

        {currentIndex < totalItems - 1 ? (
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent-500 text-ink-50 rounded-xl font-bold text-sm hover:bg-accent-600 transition-colors shadow-sm shadow-accent-500/20 active:scale-[0.97]"
          >
            下一站
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 bg-ink-800 dark:bg-ink-50 text-ink-50 dark:text-ink-800 rounded-xl font-bold text-sm hover:bg-ink-700 dark:hover:bg-ink-100 transition-colors active:scale-[0.97]"
          >
            <CheckCircle2 size={16} />
            完成旅程
          </button>
        )}
      </div>
    </div>
  );
};

export default ReadingDrawerFooter;
