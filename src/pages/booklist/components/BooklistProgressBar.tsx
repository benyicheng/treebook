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
    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span className="font-medium">
            {completedCount}/{totalItems} 站已完成
          </span>
        </div>
        <span className="text-xs font-bold text-emerald-600">
          {percentage}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-gray-400">起点</span>
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <BookOpen size={10} />
          <span>终点</span>
        </div>
      </div>
    </div>
  );
};

export default BooklistProgressBar;
