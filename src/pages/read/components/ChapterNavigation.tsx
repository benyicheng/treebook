import React from 'react';
import { ArrowLeft, ArrowRight, MoreVertical } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { IconButton } from '../../../components/ui';

interface ChapterNavigationProps {
  chapter: any;
}

export const ChapterNavigation: React.FC<ChapterNavigationProps> = ({ chapter }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const ctxQuery = location.search;
  const withCtx = (chapterId: string) => `/read/${chapterId}${ctxQuery}`;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-ink-100 dark:border-ink-600">
      {chapter?.prevChapter ? (
        <Link
          to={withCtx(chapter.prevChapter.id)}
          className="w-full sm:w-auto flex items-center gap-4 p-4 rounded-xl bg-ink-50 dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:border-accent-300 hover:shadow-sm transition-all group"
        >
          <ArrowLeft className="text-ink-300 group-hover:text-accent-500 transition-colors" />
          <div className="text-left">
            <p className="text-[10px] text-ink-400 font-black uppercase tracking-widest">上一章</p>
            <p className="text-sm font-bold text-ink-700 dark:text-ink-100 group-hover:text-accent-600 line-clamp-1">
              {chapter.prevChapter.title}
            </p>
          </div>
        </Link>
      ) : <div className="hidden sm:block w-48" />}

      <IconButton
        variant="subtle"
        size="lg"
        onClick={() => navigate(`/story/${chapter?.storyId}`)}
        aria-label="查看目录"
        title="查看目录"
      >
        <MoreVertical size={20} />
      </IconButton>

      {chapter?.nextChapter ? (
        <Link
          to={withCtx(chapter.nextChapter.id)}
          className="w-full sm:w-auto flex items-center justify-end gap-4 p-4 rounded-xl bg-ink-50 dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:border-accent-300 hover:shadow-sm transition-all group"
        >
          <div className="text-right">
            <p className="text-[10px] text-ink-400 font-black uppercase tracking-widest">下一章</p>
            <p className="text-sm font-bold text-ink-700 dark:text-ink-100 group-hover:text-accent-600 line-clamp-1">
              {chapter.nextChapter.title}
            </p>
          </div>
          <ArrowRight className="text-ink-300 group-hover:text-accent-500 transition-colors" />
        </Link>
      ) : (
        <div className="w-full sm:w-48 p-4 rounded-xl bg-accent-50 dark:bg-accent-800/10 border border-accent-100 dark:border-accent-800/30 text-center">
          <p className="text-xs font-black text-accent-600">本系列暂无后续</p>
          <button
            onClick={() => navigate(`/story/${chapter?.storyId}`)}
            className="text-[10px] font-bold text-accent-500 hover:underline mt-1"
          >
            开启新分支？
          </button>
        </div>
      )}
    </div>
  );
};

export default ChapterNavigation;