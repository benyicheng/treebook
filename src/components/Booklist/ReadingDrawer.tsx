import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chapterService } from '../../api/storyService';
import { useNavigationStackStore } from '../../stores/useNavigationStackStore';
import { useBooklistProgress } from '../../hooks/useBooklistProgress';
import AddToBooklistModal from './AddToBooklistModal';
import ReadingDrawerHeader from './ReadingDrawerHeader';
import ReadingDrawerContent from './ReadingDrawerContent';
import ReadingDrawerFooter from './ReadingDrawerFooter';
import {
  ReadingSettings,
  loadInitial,
  type ReadingSettingsState,
  type FontMode,
} from '../reading/ReadingSettings';

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
                <ReadingDrawerHeader
                  currentIndex={currentIndex}
                  totalItems={totalItems}
                  currentBooklistId={currentBooklistId}
                  currentItem={currentItem}
                  onClose={handleClose}
                  onPrev={goToPrev}
                  onNext={goToNext}
                  onToggleSettings={() => setShowSettings(!showSettings)}
                  onAddToBooklist={() => setIsAddModalOpen(true)}
                  showSettings={showSettings}
                />

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

                <ReadingDrawerContent
                  currentIndex={currentIndex}
                  currentItem={currentItem}
                  contentRef={contentRef}
                  resolvedContent={resolvedContent}
                  isContentLoading={isContentLoading}
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  wordCount={wordCount}
                  hasReadToBottom={hasReadToBottom}
                  isCompleted={isCompleted}
                  onScroll={handleScroll}
                />

                <ReadingDrawerFooter
                  currentIndex={currentIndex}
                  totalItems={totalItems}
                  hasReadToBottom={hasReadToBottom}
                  currentItem={currentItem}
                  isCompleted={isCompleted}
                  onPrev={goToPrev}
                  onNext={goToNext}
                  onMarkRead={() => {
                    setHasReadToBottom(true);
                    if (currentItem) markCompleted(currentItem.chapterId);
                  }}
                  onClose={handleClose}
                />

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
