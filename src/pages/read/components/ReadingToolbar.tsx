import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowLeft, Settings, MoreVertical, BookMarked, Save,
  FileEdit, List, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import type { ReadingContextValue } from '../../../hooks/useReadingContext';

interface ReadingToolbarProps {
  chapter: any;
  readingCtx: ReadingContextValue;
  onSettings: () => void;
  onBooklist: () => void;
  onSavepoints: () => void;
  onBranch: () => void;
  onToc: () => void;
}

export const ReadingToolbar: React.FC<ReadingToolbarProps> = ({
  chapter,
  readingCtx,
  onSettings,
  onBooklist,
  onSavepoints,
  onBranch,
  onToc,
}) => {
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMoreOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMoreOpen]);

  // 来源徽章：书单 / 阅读路径 / 阅读轨迹，点击回到来源页
  const ctxBadge =
    readingCtx.type === 'booklist'
      ? { label: '书单阅读', href: readingCtx.exitPath }
      : readingCtx.type === 'path'
        ? { label: '阅读路径', href: readingCtx.exitPath }
        : readingCtx.type === 'trail'
          ? { label: '阅读轨迹', href: readingCtx.exitPath }
          : null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-ink-800/80 backdrop-blur-xl border-b border-ink-100 dark:border-ink-700">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-600 dark:text-ink-300 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            {ctxBadge && ctxBadge.href && (
              <Link
                to={ctxBadge.href}
                className="text-[10px] px-2 py-1 rounded-full bg-accent-100 dark:bg-accent-800/30 text-accent-600 dark:text-accent-400 font-bold hover:bg-accent-200 dark:hover:bg-accent-700/40 transition-colors"
                title={readingCtx.title ?? undefined}
              >
                {ctxBadge.label}
              </Link>
            )}
            {chapter?.story?.title && (
              <Link
                to={`/story/${chapter.story.id}`}
                className="text-sm font-bold text-ink-700 dark:text-ink-200 hover:text-accent-600 transition-colors truncate max-w-[150px]"
              >
                {chapter.story.title}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onSettings}
              className="p-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-600 dark:text-ink-300 transition-colors"
              title="阅读设置"
            >
              <Settings size={18} />
            </button>

            <button
              onClick={onBooklist}
              className="p-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-600 dark:text-ink-300 transition-colors"
              title="加入书单"
            >
              <BookMarked size={18} />
            </button>

            <button
              onClick={onSavepoints}
              className="p-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-600 dark:text-ink-300 transition-colors"
              title="时空存档"
            >
              <Save size={18} />
            </button>

            <button
              onClick={onToc}
              className="p-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-600 dark:text-ink-300 transition-colors"
              title="目录"
            >
              <List size={18} />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className="p-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-600 dark:text-ink-300 transition-colors"
                title="更多选项"
              >
                <MoreVertical size={18} />
              </button>

              {isMoreOpen && (
                <div
                  ref={moreMenuRef}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-ink-800 rounded-xl shadow-xl border border-ink-100 dark:border-ink-700 overflow-hidden z-50"
                >
                  <button
                    onClick={() => { onBranch(); setIsMoreOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors"
                  >
                    <FileEdit size={16} className="text-accent-500" />
                    创建分支
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {chapter && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-ink-400">
              {chapter.author && (
                <span className="font-medium">{chapter.author.username}</span>
              )}
              {chapter.createdAt && (
                <span className="font-medium">
                  {new Date(chapter.createdAt).toLocaleDateString('zh-CN')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {chapter.prevChapter && (
                <button
                  onClick={() => {
                    // 有上下文节点序列时优先用 ctx.prev（保持来源不断链），否则普通翻章
                    if (readingCtx.hasPrev) readingCtx.prev();
                    else navigate(`/read/${chapter.prevChapter.id}`);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-50 dark:bg-ink-700 hover:bg-ink-100 dark:hover:bg-ink-600 text-xs text-ink-600 dark:text-ink-300 transition-colors"
                >
                  <ChevronLeft size={14} />
                  上一章
                </button>
              )}
              {chapter.nextChapter && (
                <button
                  onClick={() => {
                    if (readingCtx.hasNext) readingCtx.next();
                    else navigate(`/read/${chapter.nextChapter.id}`);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-50 text-accent-600 hover:bg-accent-100 text-xs font-bold transition-colors"
                >
                  下一章
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingToolbar;