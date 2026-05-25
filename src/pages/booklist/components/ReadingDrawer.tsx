import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { chapterService } from '../../../api/storyService';
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
  Sun,
  Moon,
  Type,
  Settings2,
} from 'lucide-react';
import AddToBooklistModal from '../../../components/AddToBooklistModal';

interface ChapterItem {
  id: string;
  chapterId: string;
  notes?: string;
  chapter: {
    id: string;
    title: string;
    content?: string;
    branchId?: string | null;
    story: {
      id: string;
      title: string;
      author?: {
        username: string;
      };
    };
  };
}

interface ReadingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: ChapterItem[];
  initialIndex: number;
  booklistTitle: string;
  onProgressUpdate: (index: number, completed: boolean) => void;
}

// ─── Reading Settings ────────────────────────────────────────────────
// Matches ReadPage localStorage keys for cross-page consistency
type ThemeMode = 'light' | 'dark' | 'auto';
type FontFamily = 'serif' | 'sans';

function loadSettings() {
  let fontSize = 18;
  let themeMode: ThemeMode = 'auto';
  let fontFamily: FontFamily = 'serif';
  try {
    const savedFontSize = localStorage.getItem('readFontSize');
    const savedTheme = localStorage.getItem('readTheme');
    const savedFont = localStorage.getItem('readFont');
    if (savedFontSize) fontSize = parseInt(savedFontSize, 10);
    if (savedTheme) themeMode = savedTheme as ThemeMode;
    if (savedFont) fontFamily = savedFont as FontFamily;
  } catch { /* ignore */ }
  return { fontSize, themeMode, fontFamily };
}

function saveSettings(fontSize: number, themeMode: ThemeMode, fontFamily: FontFamily) {
  try {
    localStorage.setItem('readFontSize', fontSize.toString());
    localStorage.setItem('readTheme', themeMode);
    localStorage.setItem('readFont', fontFamily);
  } catch { /* ignore */ }
}

// ─── Component ──────────────────────────────────────────────────────

const ReadingDrawer: React.FC<ReadingDrawerProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex,
  booklistTitle,
  onProgressUpdate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const [chapterContent, setChapterContent] = useState<Record<string, string>>({});
  const [isContentLoading, setIsContentLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isPreloadedRef = useRef(false);

  // Reading settings
  const initialSettings = loadSettings();
  const [fontSize, setFontSize] = useState(initialSettings.fontSize);
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialSettings.themeMode);
  const [fontFamily, setFontFamily] = useState<FontFamily>(initialSettings.fontFamily);
  const [showSettings, setShowSettings] = useState(false);

  // Scroll position persistence
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({});

  // Add-to-booklist modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const currentItem = items[currentIndex];
  const totalItems = items.length;

  // ─── Content Fetching + Preloading (D2) ──────────────────────────

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

    // Already have content in cache or embedded
    if (chapterContent[chapterId] || currentItem.chapter.content) {
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
  }, [currentItem?.chapterId, chapterContent, currentItem?.chapter.content, fetchContent]);

  // Preload next chapter (D2)
  useEffect(() => {
    if (!currentItem || isPreloadedRef.current) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= totalItems) return;
    const nextItem = items[nextIndex];
    if (!nextItem) return;

    const nextChapterId = nextItem.chapterId;
    // Skip if already loaded or embedded
    if (chapterContent[nextChapterId] || nextItem.chapter.content) return;

    isPreloadedRef.current = true;
    fetchContent(nextChapterId).then(content => {
      if (content) {
        setChapterContent(prev => ({ ...prev, [nextChapterId]: content }));
      }
    });
  }, [currentItem?.chapterId, currentIndex, items, totalItems, chapterContent, fetchContent]);

  const resolvedContent = currentItem?.chapter.content || chapterContent[currentItem?.chapterId || ''] || '';

  // ─── Drawer Open/Close ───────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setHasReadToBottom(false);
      document.body.style.overflow = 'hidden';

      // Restore settings from localStorage on open
      const s = loadSettings();
      setFontSize(s.fontSize);
      setThemeMode(s.themeMode);
      setFontFamily(s.fontFamily);
    } else {
      document.body.style.overflow = '';
      saveSettings(fontSize, themeMode, fontFamily);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  // ─── Scroll Tracking + Restoration ───────────────────────────────

  // Save scroll position when navigating away from a station
  const saveScrollPosition = useCallback(() => {
    if (!contentRef.current || !currentItem) return;
    setScrollPositions(prev => ({
      ...prev,
      [currentItem.id]: contentRef.current!.scrollTop,
    }));
  }, [currentItem]);

  // Restore scroll position when switching to a station
  useEffect(() => {
    if (!contentRef.current || !currentItem) return;
    const savedPos = scrollPositions[currentItem.id];
    if (savedPos !== undefined) {
      contentRef.current.scrollTop = savedPos;
    }
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const scrolled = (scrollTop + clientHeight) / scrollHeight;
    if (scrolled >= 0.85 && !hasReadToBottom) {
      setHasReadToBottom(true);
      onProgressUpdate(currentIndex, true);
    }
  }, [hasReadToBottom, currentIndex, onProgressUpdate]);

  const goToPrev = () => {
    if (currentIndex > 0) {
      saveScrollPosition();
      setCurrentIndex(prev => prev - 1);
      setHasReadToBottom(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < totalItems - 1) {
      saveScrollPosition();
      setCurrentIndex(prev => prev + 1);
      setHasReadToBottom(false);
    }
  };

  // ─── Keyboard ────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Theme application ───────────────────────────────────────────

  useEffect(() => {
    const applyTheme = () => {
      const isDark = themeMode === 'dark' ||
        (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    };
    applyTheme();
  }, [themeMode]);

  if (!isOpen) return null;

  if (!currentItem) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
          <p className="text-gray-500">没有可阅读的内容</p>
          <button onClick={onClose} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm">
            关闭
          </button>
        </div>
      </div>
    );
  }

  const wordCount = resolvedContent
    ? Math.round((resolvedContent.length / 2))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl flex flex-col"
        style={{ height: '85vh' }}
      >
        {/* ── Drawer Header ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest line-clamp-1">
                {booklistTitle}
              </p>
              <p className="text-xs font-medium text-gray-400">
                第 {currentIndex + 1}/{totalItems} 站
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* D3 trigger: Add to my booklist */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="加入我的书单"
            >
              <BookOpen size={18} className="text-gray-500 hover:text-emerald-600 transition-colors" />
            </button>

            {/* Settings toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors ${
                showSettings
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
              }`}
              title="阅读设置"
            >
              <Settings2 size={18} />
            </button>

            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="上一站"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-gray-500 min-w-[60px] text-center">
              {currentIndex + 1}/{totalItems}
            </span>
            <button
              onClick={goToNext}
              disabled={currentIndex === totalItems - 1}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="下一站"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={onClose}
              className="ml-2 px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
            >
              退出路线
            </button>
          </div>
        </div>

        {/* ── Reading Settings Panel (D1) ─────────────────────── */}
        {showSettings && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 shrink-0 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-wrap items-center gap-6">
              {/* Font size */}
              <div className="flex items-center gap-2">
                <Type size={14} className="text-gray-400" />
                <button
                  onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                  className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all text-sm"
                >
                  A-
                </button>
                <span className="w-10 text-center text-sm font-bold text-gray-800 dark:text-gray-200">{fontSize}</span>
                <button
                  onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                  className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all text-sm"
                >
                  A+
                </button>
              </div>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

              {/* Theme */}
              <div className="flex items-center gap-2">
                <Sun size={14} className="text-gray-400" />
                {(['light', 'dark', 'auto'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setThemeMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      themeMode === mode
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {mode === 'light' ? '浅色' : mode === 'dark' ? '深色' : '自动'}
                  </button>
                ))}
              </div>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

              {/* Font family */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontFamily('serif')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    fontFamily === 'serif'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 shadow-sm'
                      : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  衬线
                </button>
                <button
                  onClick={() => setFontFamily('sans')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    fontFamily === 'sans'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 shadow-sm'
                      : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  无衬线
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Station Info Bar ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-black text-lg shrink-0">
              {(currentIndex + 1).toString().padStart(2, '0')}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-gray-900 dark:text-white line-clamp-1">
                {currentItem.chapter.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                  currentItem.chapter.branchId ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {currentItem.chapter.branchId ? '分支' : '主线'}
                </span>
                <span>{currentItem.chapter.story.title}</span>
                <span>约 {wordCount} 字</span>
              </div>
            </div>
          </div>
          {hasReadToBottom && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full shrink-0">
              <CheckCircle2 size={14} />
              已读
            </span>
          )}
        </div>

        {/* ── Guide Notes ──────────────────────────────────────── */}
        {currentItem.notes && (
          <div className="mx-6 mt-4 p-4 bg-emerald-50/80 dark:bg-emerald-900/10 rounded-2xl border-l-4 border-emerald-500 space-y-1 shrink-0">
            <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
              <Quote size={12} fill="currentColor" />
              导游点评
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {currentItem.notes}
            </p>
          </div>
        )}

        {/* ── Content Area (D1: dynamic fontSize + fontFamily) ── */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          {isContentLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <Loader2 size={32} className="animate-spin text-emerald-600" />
                <p className="text-sm text-gray-400 font-medium">加载内容中...</p>
              </div>
            </div>
          ) : resolvedContent ? (
            <article
              className={`prose max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300 ${
                fontFamily === 'serif' ? 'prose-serif' : ''
              }`}
              style={{
                fontSize: `${fontSize}px`,
                fontFamily: fontFamily === 'serif' ? 'Georgia, "Noto Serif SC", serif' : '-apple-system, BlinkMacSystemFont, "Inter", "Noto Sans SC", sans-serif',
              }}
            >
              <ReactMarkdown>
                {resolvedContent}
              </ReactMarkdown>
            </article>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">暂无内容</p>
            </div>
          )}
        </div>

        {/* ── Bottom Navigation ────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} />
              上一站
            </button>
          </div>

          <div className="flex items-center gap-3">
            {!hasReadToBottom && (
              <button
                onClick={() => {
                  setHasReadToBottom(true);
                  onProgressUpdate(currentIndex, true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
              >
                <CheckCircle2 size={16} />
                标记已读
              </button>
            )}

            {currentIndex < totalItems - 1 ? (
              <button
                onClick={goToNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              >
                下一站
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-95"
              >
                <CheckCircle2 size={16} />
                完成旅程
              </button>
            )}
          </div>
        </div>
      </div>

      {/* D3: Add-to-booklist modal (inline) */}
      {currentItem && (
        <AddToBooklistModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          chapterId={currentItem.chapterId}
          chapterTitle={currentItem.chapter.title}
        />
      )}
    </div>
  );
};

export default ReadingDrawer;
