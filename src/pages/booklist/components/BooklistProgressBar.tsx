import React from 'react';
import { CheckCircle2, BookOpen } from 'lucide-react';

interface BooklistProgressBarProps {
  completedCount: number;
  totalItems: number;
  percentage: number;
}

const BooklistProgressBar: React.FC<BooklistProgressBarProps> = ({
  completedCount,
  totalItems,
  percentage,
}) => {
  if (totalItems === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-ink-100 dark:border-ink-600">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
          <CheckCircle2 size={16} className="text-accent-400" />
          <span className="font-medium">
            {completedCount}/{totalItems} 站已完成
          </span>
        </div>
        <span className="text-xs font-bold text-accent-500">
          {percentage}%
        </span>
      </div>
      <div className="w-full h-2 bg-ink-100 dark:bg-ink-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-400 to-emerald-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-ink-400">起点</span>
        <div className="flex items-center gap-1 text-[10px] text-ink-400">
          <BookOpen size={10} />
          <span>终点</span>
        </div>
      </div>
    </div>
  );
};

export default BooklistProgressBar;
