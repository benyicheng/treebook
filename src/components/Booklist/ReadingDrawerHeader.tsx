import React from 'react';
import { X, BookOpen, Settings2, ChevronLeft, ChevronRight } from 'lucide-react';

interface ReadingDrawerHeaderProps {
  currentIndex: number;
  totalItems: number;
  currentBooklistId: string | null;
  currentItem: any;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleSettings: () => void;
  onAddToBooklist: () => void;
  showSettings: boolean;
}

const ReadingDrawerHeader: React.FC<ReadingDrawerHeaderProps> = ({
  currentIndex,
  totalItems,
  currentBooklistId,
  onClose,
  onPrev,
  onNext,
  onToggleSettings,
  onAddToBooklist,
  showSettings,
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 dark:border-ink-700 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onClose}
          className="p-2 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-full transition-colors text-ink-500"
        >
          <X size={20} />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-bold text-accent-500 uppercase tracking-widest line-clamp-1">
            {currentBooklistId ? '书单路线' : '阅读'}
          </p>
          <p className="text-xs font-medium text-ink-400">
            第 {currentIndex + 1}/{totalItems} 站
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onAddToBooklist}
          className="p-2 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-full transition-colors"
          title="加入我的书单"
        >
          <BookOpen size={18} className="text-ink-400 hover:text-accent-500 transition-colors" />
        </button>

        <button
          onClick={onToggleSettings}
          className={`p-2 rounded-full transition-colors ${
            showSettings
              ? 'bg-accent-100 dark:bg-accent-500/20 text-accent-500'
              : 'hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-400'
          }`}
          title="阅读设置"
        >
          <Settings2 size={18} />
        </button>

        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="p-2 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-ink-500"
          title="上一站"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-bold text-ink-400 min-w-[60px] text-center tabular-nums">
          {currentIndex + 1}/{totalItems}
        </span>
        <button
          onClick={onNext}
          disabled={currentIndex === totalItems - 1}
          className="p-2 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-ink-500"
          title="下一站"
        >
          <ChevronRight size={20} />
        </button>
        <button
          onClick={onClose}
          className="ml-2 px-4 py-1.5 text-xs font-bold text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 bg-ink-100 dark:bg-ink-700 rounded-lg transition-colors"
        >
          退出路线
        </button>
      </div>
    </div>
  );
};

export default ReadingDrawerHeader;
