import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Loader2, ExternalLink, Search, X } from 'lucide-react';
import { Spinner } from '../../components/ui';
import ContextPanel from '../../components/ui/ContextPanel';
import CommentSection from './CommentSection';
import { InteractionBar } from '../../components/Interaction';
import { ReadingSettings, loadInitial } from '../../components/reading';
import { ReadingDrawer } from '../../components/Booklist';
import { useReadPage } from './hooks/useReadPage';
import { useWikiLookup } from './hooks/useWikiLookup';
import ReadingToolbar from './components/ReadingToolbar';
import ChapterContent from './components/ChapterContent';
import BranchDiscovery from './components/BranchDiscovery';
import ChapterNavigation from './components/ChapterNavigation';
import TocDrawer from './components/TocDrawer';
import BooklistModal from './components/BooklistModal';
import SavepointsModal from './components/SavepointsModal';
import CreateBranchModal from './components/CreateBranchModal';

const ReadPage: React.FC = () => {
  const {
    chapter,
    isLoading,
    tocChapters,
    readingCtx,
    myBooklists,
    isBooklistModalOpen,
    setIsBooklistModalOpen,
    selectedBooklistId,
    setSelectedBooklistId,
    booklistNote,
    setBooklistNote,
    isAddingToBooklist,
    addSuccess,
    isSavepointsOpen,
    setIsSavepointsOpen,
    isSaving,
    saveSuccess,
    savepoints,
    isBranchModalOpen,
    setIsBranchModalOpen,
    branchForm,
    setBranchForm,
    isCreatingBranch,
    handleAddToBooklist,
    handleCreateSavepoint,
    handleDeleteSavepoint,
    handleCreateBranch,
  } = useReadPage();

  const {
    selectedText,
    results: wikiResults,
    loading: wikiLoading,
    selectionRect,
    showToolbar,
    showPopover,
    handleTextSelect,
    lookupSelected,
    close: closeWikiLookup,
  } = useWikiLookup();

  const [readingSettings, setReadingSettings] = useState(loadInitial);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);

  // B1: booklist 上下文进度回写 —— 进入章节即标记当前章为已读
  useEffect(() => {
    if (chapter && readingCtx.type === 'booklist') {
      readingCtx.markCurrentRead();
    }
  }, [chapter?.id, readingCtx.type]);

  // 滚动时关闭选词工具条/浮窗，避免定位错乱
  useEffect(() => {
    if (!showToolbar && !showPopover) return;
    const handleClose = () => closeWikiLookup();
    window.addEventListener('scroll', handleClose, true);
    return () => window.removeEventListener('scroll', handleClose, true);
  }, [showToolbar, showPopover, closeWikiLookup]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8 text-accent-500" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-ink-500">章节不存在或已被删除</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-900">
      <ReadingToolbar
        chapter={chapter}
        readingCtx={readingCtx}
        onSettings={() => setIsSettingsOpen(true)}
        onBooklist={() => setIsBooklistModalOpen(true)}
        onSavepoints={() => setIsSavepointsOpen(true)}
        onBranch={() => setIsBranchModalOpen(true)}
        onToc={() => setIsTocOpen(true)}
      />

      <div className="max-w-4xl mx-auto px-4 pt-28 pb-24">
        <ChapterContent
          chapter={chapter}
          handleTextSelect={handleTextSelect}
        />

        <BranchDiscovery chapter={chapter} />

        <ChapterNavigation chapter={chapter} />

        <div className="my-12 p-8 bg-ink-50 dark:bg-ink-700 rounded-xl border border-ink-100 dark:border-ink-600">
          <h3 className="text-lg font-black text-ink-700 dark:text-ink-100 mb-6">互动</h3>
          <InteractionBar
            targetType="chapter"
            targetId={chapter.id}
            viewCount={chapter.viewCount || 0}
            commentCount={chapter.commentCount || 0}
            showRating={true}
            showShare={true}
            size="md"
          />
        </div>

        <CommentSection key={chapter.id} chapterId={chapter.id} />
      </div>

      <ContextPanel
        storyId={chapter?.story?.id}
        chapterId={chapter?.id}
        branchId={chapter?.branchId}
        chapters={tocChapters as any}
        readingCtx={readingCtx}
      />

      {/* 选词查百科：浮动工具条 */}
      {showToolbar && selectionRect && (
        <div
          style={{
            position: 'fixed',
            top: selectionRect.top - 44,
            left: Math.max(
              8,
              Math.min(selectionRect.left + selectionRect.width / 2 - 60, window.innerWidth - 128),
            ),
            zIndex: 60,
          }}
          className="flex items-center gap-1 bg-ink-800 dark:bg-ink-700 text-white rounded-lg shadow-xl px-1 py-1 animate-in fade-in slide-in-from-bottom-1 duration-150"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onClick={lookupSelected}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/10 text-xs font-bold transition-colors"
          >
            <Search size={13} />
            查百科
          </button>
          <button
            onClick={closeWikiLookup}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            aria-label="关闭"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* 选词查百科：结果浮窗 */}
      {showPopover && selectionRect && (
        <div
          style={{
            position: 'fixed',
            top: Math.min(selectionRect.bottom + 6, window.innerHeight - 200),
            left: Math.max(8, Math.min(selectionRect.left, window.innerWidth - 296)),
            zIndex: 60,
          }}
          className="w-72 bg-white dark:bg-ink-700 rounded-xl shadow-2xl border border-ink-200 dark:border-ink-600 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-ink-100 dark:border-ink-600">
            <span className="text-xs font-bold text-ink-600 dark:text-ink-300 truncate">
              查询「{selectedText}」
            </span>
            <button
              onClick={closeWikiLookup}
              className="p-1 rounded hover:bg-ink-100 dark:hover:bg-ink-600 text-ink-400"
              aria-label="关闭"
            >
              <X size={14} />
            </button>
          </div>
          {wikiLoading && (
            <div className="flex items-center justify-center gap-2 p-6 text-ink-500">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">查找中...</span>
            </div>
          )}
          {!wikiLoading && wikiResults.length === 0 && (
            <div className="p-4 text-sm text-ink-400">暂无「{selectedText}」的百科条目</div>
          )}
          {!wikiLoading && wikiResults.length > 0 && (
            <div>
              {wikiResults.map((item) => (
                <Link
                  key={item.id}
                  to={`/wiki/${item.id}`}
                  onClick={closeWikiLookup}
                  className="block p-4 hover:bg-ink-50 dark:hover:bg-ink-600 transition-colors border-b border-ink-100 dark:border-ink-600 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-ink-800 dark:text-ink-100 truncate">
                      {item.title}
                    </h4>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-800 text-accent-600 dark:text-accent-300">
                      {item.contentType}
                    </span>
                  </div>
                  {item.summary && (
                    <p className="mt-1 text-xs text-ink-500 dark:text-ink-400 line-clamp-2">
                      {item.summary}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-[10px] text-ink-400">
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {item._count.outgoingLinks + item._count.incomingLinks} 条关联
                    </span>
                    <span className="flex items-center gap-1">
                      <ExternalLink size={12} />
                      查看详情
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <ReadingSettings
        variant="modal"
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onChange={setReadingSettings}
      />

      <BooklistModal
        isOpen={isBooklistModalOpen}
        onClose={() => setIsBooklistModalOpen(false)}
        myBooklists={myBooklists}
        selectedBooklistId={selectedBooklistId}
        onSelectBooklist={setSelectedBooklistId}
        booklistNote={booklistNote}
        onBooklistNoteChange={setBooklistNote}
        isAdding={isAddingToBooklist}
        addSuccess={addSuccess}
        onSubmit={handleAddToBooklist}
      />

      <SavepointsModal
        isOpen={isSavepointsOpen}
        onClose={() => setIsSavepointsOpen(false)}
        chapter={chapter}
        savepoints={savepoints}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        onCreateSavepoint={handleCreateSavepoint}
        onDeleteSavepoint={handleDeleteSavepoint}
      />

      <CreateBranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        chapter={chapter}
        branchForm={branchForm}
        onBranchFormChange={(field, value) => setBranchForm(f => ({ ...f, [field]: value }))}
        isCreating={isCreatingBranch}
        onSubmit={handleCreateBranch}
      />

      <TocDrawer
        isOpen={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        chapters={tocChapters}
        currentChapterId={chapter?.id}
      />

      <ReadingDrawer />
    </div>
  );
};

export default ReadPage;