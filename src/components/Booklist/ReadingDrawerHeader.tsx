import React from 'react';
import { X, BookOpen, Settings2, ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton, Button } from '../ui';

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
        <IconButton aria-label="关闭" onClick={onClose} className="text-ink-500">
          <X size={20} />
        </IconButton>
        <div className="min-w-0">
          <p className="eyebrow text-accent-500 line-clamp-1">
            {currentBooklistId ? '书单路线' : '阅读'}
          </p>
          <p className="text-xs font-medium text-ink-400">
            第 {currentIndex + 1}/{totalItems} 站
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IconButton
          aria-label="加入我的书单"
          onClick={onAddToBooklist}
          title="加入我的书单"
          className="text-ink-400 hover:text-accent-500"
        >
          <BookOpen size={18} />
        </IconButton>

        <IconButton
          aria-label="阅读设置"
          onClick={onToggleSettings}
          title="阅读设置"
          className={
            showSettings
              ? 'bg-accent-100 dark:bg-accent-500/20 text-accent-500'
              : 'text-ink-400'
          }
        >
          <Settings2 size={18} />
        </IconButton>

        <IconButton
          aria-label="上一站"
          onClick={onPrev}
          disabled={currentIndex === 0}
          title="上一站"
          className="text-ink-500"
        >
          <ChevronLeft size={20} />
        </IconButton>
        <span className="text-sm font-bold text-ink-400 min-w-[60px] text-center tabular-nums">
          {currentIndex + 1}/{totalItems}
        </span>
        <IconButton
          aria-label="下一站"
          onClick={onNext}
          disabled={currentIndex === totalItems - 1}
          title="下一站"
          className="text-ink-500"
        >
          <ChevronRight size={20} />
        </IconButton>
        <Button
          variant="subtle"
          size="sm"
          onClick={onClose}
          className="ml-2 text-xs"
        >
          退出路线
        </Button>
      </div>
    </div>
  );
};

export default ReadingDrawerHeader;
