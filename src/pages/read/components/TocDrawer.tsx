import React from 'react';
import { X, ChevronRight, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Chapter } from '../../../api/storyService';

interface TocDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  currentChapterId?: string;
}

export const TocDrawer: React.FC<TocDrawerProps> = ({
  isOpen,
  onClose,
  chapters,
  currentChapterId,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const ctxQuery = location.search;

  const sortedChapters = [...(chapters || [])].sort((a, b) => a.orderIndex - b.orderIndex);

  const getChapterUrl = (chapterId: string) => {
    return `/read/${chapterId}${ctxQuery}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      <div
        className={`fixed left-0 top-0 h-full w-[320px] bg-white dark:bg-ink-800 border-r border-ink-200 dark:border-ink-700 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-ink-100 dark:border-ink-700">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-accent-500" />
            <span className="text-lg font-bold text-ink-800 dark:text-white">目录</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-500 transition-colors"
            aria-label="关闭目录"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {sortedChapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-ink-400">
              <BookOpen size={48} className="mb-4 opacity-30" />
              <p className="text-sm">暂无章节</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedChapters.map((chapter) => {
                const isCurrent = chapter.id === currentChapterId;
                return (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      navigate(getChapterUrl(chapter.id));
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isCurrent
                        ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400 font-bold'
                        : 'text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-700'
                    }`}
                  >
                    <span className={`text-xs font-bold shrink-0 w-6 text-center ${
                      isCurrent ? 'text-accent-500' : 'text-ink-400'
                    }`}>
                      {chapter.orderIndex}
                    </span>
                    <span className="flex-1 truncate text-sm">{chapter.title}</span>
                    <ChevronRight size={14} className={`transition-transform ${
                      isCurrent ? 'opacity-100' : 'opacity-0'
                    }`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TocDrawer;
