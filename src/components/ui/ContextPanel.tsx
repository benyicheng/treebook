import React, { useState, useEffect } from 'react';
import { X, PanelRight } from 'lucide-react';
import { Chapter, Branch, Spinoff } from '../../api/storyService';
import AddToBooklistModal from '../Booklist/AddToBooklistModal';
import ContextPanelContent from './ContextPanelContent';
import type { ReadingContextValue } from '../../hooks/useReadingContext';

const STORAGE_KEY = 'context-panel-open';
const PANEL_WIDTH = 320;

interface ContextPanelProps {
  storyId?: string;
  chapterId?: string;
  branchId?: string;
  chapters?: Chapter[];
  branches?: Branch[];
  spinoffs?: Spinoff[];
  /** 阅读上下文，由 ReadPage 注入以避免重复调用 useReadingContext */
  readingCtx?: ReadingContextValue;
}

const ContextPanel: React.FC<ContextPanelProps> = ({ storyId, chapterId, branchId, chapters, branches, spinoffs, readingCtx }) => {
  const [open, setOpen] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
  const [booklistModalOpen, setBooklistModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(open));
  }, [open]);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, open]);

  const sharedContent = (
    <ContextPanelContent
      storyId={storyId}
      chapterId={chapterId}
      branchId={branchId}
      chapters={chapters}
      branches={branches}
      spinoffs={spinoffs}
      readingCtx={readingCtx}
      onAddToBooklist={() => setBooklistModalOpen(true)}
    />
  );

  return (
    <>
      {/* Mobile: FAB */}
      {isMobile && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-accent-500 text-white rounded-full shadow-xl hover:bg-accent-600 active:scale-95 transition-all flex items-center justify-center"
          aria-label="打开上下文"
        >
          <PanelRight size={22} />
        </button>
      )}

      {/* Mobile: bottom drawer */}
      {isMobile && (
        <>
          {open && (
            <div className="fixed inset-0 scrim z-40" onClick={() => setOpen(false)} />
          )}
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-ink-800 border-t border-ink-200 dark:border-ink-700 shadow-2xl rounded-t-2xl overflow-hidden transition-transform duration-300 ease-out ${
              open ? 'translate-y-0' : 'translate-y-full'
            }`}
            style={{ height: '70vh', maxHeight: '70vh' }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-ink-700 shrink-0 min-h-[48px]">
                <span className="text-sm font-bold text-ink-800 dark:text-white">上下文</span>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-500 hover:text-ink-700 dark:hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="收起面板"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sharedContent}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Desktop: floating open button — 注意：open 为 false 时才可见（translate-x-full 时 side panel 移出屏幕） */}
      {!isMobile && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 border-r-0 rounded-l-lg p-2.5 shadow-lg hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="打开面板"
        >
          <PanelRight size={18} className="text-ink-500" />
        </button>
      )}

      {/* Desktop: backdrop — 右侧面板展开时，点击空白区域收起面板 */}
      {!isMobile && open && (
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
      )}

      {/* Desktop: sidebar panel — 始终渲染，CSS 控制隐藏/显示，避免条件挂载导致事件丢失 */}
      {!isMobile && (
        <aside
          className={`fixed right-0 top-0 h-full w-[320px] bg-white dark:bg-ink-800 border-l border-ink-200 dark:border-ink-700 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-out ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-3 py-3 border-b border-ink-100 dark:border-ink-700 shrink-0">
            <span className="text-sm font-bold text-ink-800 dark:text-white">上下文</span>
            <button
              onClick={() => setOpen(false)}
              className="p-2.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-500 hover:text-ink-700 dark:hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="收起面板"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {sharedContent}
          </div>
        </aside>
      )}

      <AddToBooklistModal
        isOpen={booklistModalOpen}
        onClose={() => setBooklistModalOpen(false)}
        chapterId={chapterId || ''}
      />
    </>
  );
};

export default ContextPanel;
