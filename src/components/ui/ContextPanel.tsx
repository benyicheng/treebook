import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, PanelRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Chapter, Branch, Spinoff } from '../../api/storyService';
import AddToBooklistModal from '../Booklist/AddToBooklistModal';
import ContextPanelContent from './ContextPanelContent';

type PanelState = 'expanded' | 'mini' | 'collapsed';

const STORAGE_KEY = 'context-panel-state';
const EXPANDED_WIDTH = 320;
const MINI_WIDTH = 64;

interface ContextPanelProps {
  storyId?: string;
  chapterId?: string;
  branchId?: string;
  chapters?: Chapter[];
  branches?: Branch[];
  spinoffs?: Spinoff[];
}

function getInitialState(): PanelState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'expanded' || stored === 'mini') return stored;
  return 'collapsed';
}

const ContextPanel: React.FC<ContextPanelProps> = ({ storyId, chapterId, branchId, chapters, branches, spinoffs }) => {
  const location = useLocation();
  const isReadingPage = location.pathname.startsWith('/read/');
  const [state, setState] = useState<PanelState>(() => {
    return isReadingPage ? 'expanded' : getInitialState();
  });
  const [booklistModalOpen, setBooklistModalOpen] = useState(false);

  useEffect(() => {
    if (isReadingPage && state === 'collapsed') {
      setState('expanded');
    }
  }, [isReadingPage]);

  const persistAndSet = useCallback((newState: PanelState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY, newState);
  }, []);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveState = isMobile && state === 'mini' ? 'expanded' : state;
  const width = effectiveState === 'expanded' ? EXPANDED_WIDTH : effectiveState === 'mini' ? MINI_WIDTH : 0;

  const sharedContent = (
    <ContextPanelContent
      storyId={storyId}
      chapterId={chapterId}
      branchId={branchId}
      chapters={chapters}
      branches={branches}
      spinoffs={spinoffs}
      onAddToBooklist={() => setBooklistModalOpen(true)}
    />
  );

  return (
    <>
      {/* Mobile: bottom drawer */}
      {isMobile && effectiveState === 'expanded' && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => persistAndSet('collapsed')}
        />
      )}
      {isMobile ? (
        <motion.div
          animate={{
            y: effectiveState === 'collapsed' ? 'calc(100% - 60px)' : '0%',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-ink-800 border-t border-ink-200 dark:border-ink-700 shadow-2xl rounded-t-2xl overflow-hidden"
          style={{ height: '70vh', maxHeight: '70vh' }}
        >
          {effectiveState === 'collapsed' && (
            <button
              onClick={() => persistAndSet('expanded')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-ink-500 hover:text-ink-700 dark:hover:text-ink-200 transition-colors min-h-[48px]"
              aria-label="展开面板"
            >
              <PanelRight size={18} />
              打开上下文
            </button>
          )}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-ink-700 shrink-0 min-h-[48px]">
              <span className="text-sm font-bold text-ink-800 dark:text-white">上下文</span>
              <button
                onClick={() => persistAndSet('collapsed')}
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
        </motion.div>
      ) : (
        /* Desktop: right sidebar */
        <motion.aside
          animate={{ width }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 h-full bg-white dark:bg-ink-800 border-l border-ink-200 dark:border-ink-700 shadow-2xl z-40 overflow-hidden"
        >
          <div style={{ width: EXPANDED_WIDTH }} className="flex flex-col h-full">
            <div className="flex items-center justify-between px-3 py-3 border-b border-ink-100 dark:border-ink-700 shrink-0">
              {effectiveState === 'expanded' && (
                <span className="text-sm font-bold text-ink-800 dark:text-white">上下文</span>
              )}
              <div className="flex items-center gap-1 ml-auto">
                {effectiveState === 'expanded' && (
                  <button
                    onClick={() => persistAndSet('mini')}
                    className="p-2.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-500 hover:text-ink-700 dark:hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="切换到迷你模式"
                  >
                    <ChevronRight size={18} />
                  </button>
                )}
                {effectiveState !== 'collapsed' && (
                  <button
                    onClick={() => persistAndSet('collapsed')}
                    className="p-2.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-500 hover:text-ink-700 dark:hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="收起面板"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {effectiveState === 'expanded' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {sharedContent}
              </div>
            )}

            {effectiveState === 'mini' && (
              <div className="flex-1 flex flex-col items-center gap-4 py-4">
                <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-800/30 flex items-center justify-center">
                  <PanelRight size={16} className="text-accent-500" />
                </div>
                <button
                  onClick={() => persistAndSet('expanded')}
                  className="p-2.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-500 hover:text-ink-700 dark:hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="展开面板"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            )}
          </div>

          {effectiveState === 'collapsed' && (
            <button
              onClick={() => persistAndSet('mini')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 border-r-0 rounded-l-lg p-2.5 shadow-lg hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="打开面板"
            >
              <PanelRight size={18} className="text-ink-500" />
            </button>
          )}
        </motion.aside>
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
