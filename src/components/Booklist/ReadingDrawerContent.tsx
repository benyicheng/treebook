import React from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle2, Quote, Loader2 } from 'lucide-react';
import { FontMode } from '../reading/ReadingSettings';

const FONT_PROSE = {
  serif: '"Noto Serif SC", "Source Han Serif SC", Georgia, serif',
  sans: '-apple-system, BlinkMacSystemFont, "Inter", "Noto Sans SC", sans-serif',
} as const;

interface ReadingDrawerContentProps {
  currentIndex: number;
  currentItem: any;
  contentRef: React.RefObject<HTMLDivElement>;
  resolvedContent: string;
  isContentLoading: boolean;
  fontSize: number;
  fontFamily: FontMode;
  wordCount: number;
  hasReadToBottom: boolean;
  isCompleted: (chapterId: string) => boolean;
  onScroll: () => void;
}

const ReadingDrawerContent: React.FC<ReadingDrawerContentProps> = ({
  currentIndex,
  currentItem,
  contentRef,
  resolvedContent,
  isContentLoading,
  fontSize,
  fontFamily,
  wordCount,
  hasReadToBottom,
  isCompleted,
  onScroll,
}) => {
  return (
    <>
      {/* Station Info Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-ink-50/80 dark:bg-ink-800/50 border-b border-ink-100 dark:border-ink-700 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-500/15 flex items-center justify-center text-accent-600 dark:text-accent-400 font-black text-lg shrink-0">
            {(currentIndex + 1).toString().padStart(2, '0')}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-ink-800 dark:text-ink-50 line-clamp-1">
              {currentItem.chapter?.title || '加载中...'}
            </h2>
            <div className="flex items-center gap-3 text-xs text-ink-400">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                currentItem.chapter?.branchId
                  ? 'bg-accent-100 text-accent-600'
                  : 'bg-ink-100 text-ink-500'
              }`}>
                {currentItem.chapter?.branchId ? '分支' : '主线'}
              </span>
              <span>{currentItem.chapter?.story?.title}</span>
              <span>约 {wordCount} 字</span>
            </div>
          </div>
        </div>
        {(hasReadToBottom || (currentItem && isCompleted(currentItem.chapterId))) && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-accent-600 bg-accent-50 dark:bg-accent-500/10 px-3 py-1.5 rounded-full shrink-0">
            <CheckCircle2 size={14} />
            已读
          </span>
        )}
      </div>

      {/* Guide Notes */}
      {currentItem.notes && (
        <div className="mx-6 mt-4 p-4 bg-accent-50/80 dark:bg-accent-500/5 rounded-2xl border-l-4 border-accent-400 space-y-1 shrink-0">
          <div className="flex items-center gap-2 text-accent-600 font-black text-xs uppercase tracking-widest">
            <Quote size={12} fill="currentColor" />
            导游点评
          </div>
          <p className="text-ink-600 dark:text-ink-300 text-sm leading-relaxed">
            {currentItem.notes}
          </p>
        </div>
      )}

      {/* Content Area */}
      <div
        ref={contentRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-6 py-6"
      >
        {isContentLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={32} className="animate-spin text-accent-500" />
              <p className="text-sm text-ink-400 font-medium">加载内容中...</p>
            </div>
          </div>
        ) : resolvedContent ? (
          <article
            className={`prose max-w-none ${
              fontFamily === 'serif' ? 'prose-serif' : ''
            }`}
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: FONT_PROSE[fontFamily],
            }}
          >
            <ReactMarkdown>{resolvedContent}</ReactMarkdown>
          </article>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-ink-400">暂无内容</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ReadingDrawerContent;
