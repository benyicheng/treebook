import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { chapterService } from '../../api/storyService';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Quote,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Settings2,
} from 'lucide-react';
import { useNavigationStackStore } from '../../stores/useNavigationStackStore';
import { useBooklistProgress } from '../../hooks/useBooklistProgress';
import AddToBooklistModal from './AddToBooklistModal';
import {
  ReadingSettings,
  loadInitial,
  type ReadingSettingsState,
  type FontMode,
} from '../reading/ReadingSettings';

const FONT_PROSE = {
  serif: '"Noto Serif SC", "Source Han Serif SC", Georgia, serif',
  sans: '-apple-system, BlinkMacSystemFont, "Inter", "Noto Sans SC", sans-serif',
} as const;

const ReadingDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    closeDrawer,
    currentReadingId,
    currentBooklistId,
    currentIndex,
    booklistItems,
    setCurrentIndex,
    setCurrentReadingId,
  } = useNavigationStackStore();

  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const [chapterContent, setChapterContent] = useState<Record<string, string>>({});
  const [isContentLoading, setIsContentLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isPreloadedRef = useRef(false);

  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState<FontMode>('serif');
  const [showSettings, setShowSettings] = useState(false);
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const items = booklistItems;
  const currentItem = items[currentIndex];
  const totalItems = items.length;

  const {
    markCompleted,
    isCompleted,
  } = useBooklistProgress({
    booklistId: currentBooklistId || '',
    totalItems,
  });

  const fetchContent = useCallback(async (chapterId: string): Promise<string | null> => {
    try {
      const data = await chapterService.getById(chapterId);
      return data?.content || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!currentItem) return;

    const chapterId = currentItem.chapterId;
    isPreloadedRef.current = false;

    if (chapterContent[chapterId] || currentItem.chapter?.content) {
      return;
    }

    setIsContentLoading(true);
    fetchContent(chapterId)
      .then(content => {
        if (content) {
          setChapterContent(prev => ({ ...prev, [chapterId]: content }));
        }
      })
      .finally(() => {
        setIsContentLoading(false);
      });
  }, [currentItem?.chapterId, currentItem?.chapter?.content, fetchContent, chapterContent]);

  useEffect(() => {
    if (!currentItem || isPreloadedRef.current) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= totalItems) return;
    const nextItem = items[nextIndex];
    if (!nextItem) return;

    const nextChapterId = nextItem.chapterId;
    if (chapterContent[nextChapterId] || nextItem.chapter?.content) return;

    isPreloadedRef.current = true;
    fetchContent(nextChapterId).then(content => {
      if (content) {
        setChapterContent(prev => ({ ...prev, [nextChapterId]: content }));
      }
    });
  }, [currentItem?.chapterId, currentIndex, items, totalItems, fetchContent, chapterContent]);

  const resolvedContent = currentItem?.chapter?.content || chapterContent[currentItem?.chapterId || ''] || '';

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      const s = loadInitial();
      setFontSize(s.fontSize);
      setFontFamily(s.fontFamily);
    } else {
      document.body.style.overflow = '';
      setChapterContent({});
      setScrollPositions({});
      setHasReadToBottom(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const saveScrollPosition = useCallback(() => {
    if (!contentRef.current || !currentItem) return;
    setScrollPositions(prev => ({
      ...prev,
      [currentItem.id]: contentRef.current!.scrollTop,
    }));
  }, [currentItem]);

  useEffect(() => {
    if (!contentRef.current || !currentItem) return;
    const savedPos = scrollPositions[currentItem.id];
    if (savedPos !== undefined) {
      contentRef.current.scrollTop = savedPos;
    }
  }, [currentIndex, currentItem?.id, scrollPositions]);

  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const scrolled = (scrollTop + clientHeight) / scrollHeight;
    if (scrolled >= 0.85 && !hasReadToBottom) {
      setHasReadToBottom(true);
      if (currentItem) markCompleted(currentItem.chapterId);
    }
  }, [hasReadToBottom, currentItem, markCompleted]);

  const goToPrev = () => {
    if (currentIndex > 0) {
      saveScrollPosition();
      const prevItem = items[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      setCurrentReadingId(prevItem.chapterId);
      setHasReadToBottom(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < totalItems - 1) {
      saveScrollPosition();
      const nextItem = items[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      setCurrentReadingId(nextItem.chapterId);
      setHasReadToBottom(false);
    }
  };

  const handleClose = () => {
    saveScrollPosition();
    closeDrawer();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    if (isDrawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, currentIndex]);

  const wordCount = resolvedContent
    ? Math.round((resolvedContent.length / 2))
    : 0;

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[60] flex">
          {/* Left preview area (desktop) - transparent, shows page behind */}
          <div
            className="hidden md:block w-[27%] min-w-[27%] cursor-pointer"
            onClick={handleClose}
          />

          {/* Right drawer (70% desktop, 100% mobile) */}
          <motion.div
            className="md:w-[73%] w-full h-full bg-ink-50 dark:bg-ink-800 shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {!currentItem ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-ink-400">没有可阅读的内容</p>
              </div>
            ) : (
              <>
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 dark:border-ink-700 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={handleClose}
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
                      onClick={() => setIsAddModalOpen(true)}
                      className="p-2 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-full transition-colors"
                      title="加入我的书单"
                    >
                      <BookOpen size={18} className="text-ink-400 hover:text-accent-500 transition-colors" />
                    </button>

                    <button
                      onClick={() => setShowSettings(!showSettings)}
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
                      onClick={goToPrev}
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
                      onClick={goToNext}
                      disabled={currentIndex === totalItems - 1}
                      className="p-2 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-ink-500"
                      title="下一站"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <button
                      onClick={handleClose}
                      className="ml-2 px-4 py-1.5 text-xs font-bold text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 bg-ink-100 dark:bg-ink-700 rounded-lg transition-colors"
                    >
                      退出路线
                    </button>
                  </div>
                </div>

                {/* Reading Settings Panel */}
                <ReadingSettings
                  variant="inline"
                  isOpen={showSettings}
                  onClose={() => setShowSettings(false)}
                  onChange={(settings: ReadingSettingsState) => {
                    setFontSize(settings.fontSize);
                    setFontFamily(settings.fontFamily);
                  }}
                />

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
                  onScroll={handleScroll}
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

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-ink-100 dark:border-ink-700 bg-ink-50/80 dark:bg-ink-800/50 shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={goToPrev}
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
                        onClick={() => {
                          setHasReadToBottom(true);
                          if (currentItem) markCompleted(currentItem.chapterId);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-xl transition-colors"
                      >
                        <CheckCircle2 size={16} />
                        标记已读
                      </button>
                    )}

                    {currentIndex < totalItems - 1 ? (
                      <button
                        onClick={goToNext}
                        className="flex items-center gap-2 px-6 py-2.5 bg-accent-500 text-ink-50 rounded-xl font-bold text-sm hover:bg-accent-600 transition-colors shadow-sm shadow-accent-500/20 active:scale-[0.97]"
                      >
                        下一站
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={handleClose}
                        className="flex items-center gap-2 px-6 py-2.5 bg-ink-800 dark:bg-ink-50 text-ink-50 dark:text-ink-800 rounded-xl font-bold text-sm hover:bg-ink-700 dark:hover:bg-ink-100 transition-colors active:scale-[0.97]"
                      >
                        <CheckCircle2 size={16} />
                        完成旅程
                      </button>
                    )}
                  </div>
                </div>

                {/* Add-to-booklist modal */}
                {currentItem && (
                  <AddToBooklistModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    chapterId={currentItem.chapterId}
                    chapterTitle={currentItem.chapter?.title}
                  />
                )}
              </>
            )}
          </motion.div>

          {/* Mobile dimmed backdrop */}
          <div className="md:hidden fixed inset-0 z-[-1] bg-black/50" onClick={handleClose} />
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReadingDrawer;
