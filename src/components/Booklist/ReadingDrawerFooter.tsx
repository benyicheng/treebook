import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui';

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
        <Button
          variant="ghost"
          onClick={onPrev}
          disabled={currentIndex === 0}
          leftIcon={<ArrowLeft size={16} />}
          className="text-ink-500 dark:text-ink-300"
        >
          上一站
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {!hasReadToBottom && !(currentItem && isCompleted(currentItem.chapterId)) && (
          <Button
            variant="ghost"
            onClick={onMarkRead}
            leftIcon={<CheckCircle2 size={16} />}
            className="text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-500/10"
          >
            标记已读
          </Button>
        )}

        {currentIndex < totalItems - 1 ? (
          <Button
            variant="primary"
            onClick={onNext}
            rightIcon={<ArrowRight size={16} />}
            className="shadow-sm shadow-accent-500/20"
          >
            下一站
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={onClose}
            leftIcon={<CheckCircle2 size={16} />}
          >
            完成旅程
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReadingDrawerFooter;
