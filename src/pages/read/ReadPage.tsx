import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToast } from '../../components/notifications';
import analytics from '../../lib/analytics';
import { useChapter, useChaptersByStory } from '../../hooks/useChapters';
import { useBooklist, useMyBooklists, useAddToBooklist } from '../../hooks/useBooklists';
import { useCreateBranch } from '../../hooks/useBranches';
import { useSavepoints, useCreateSavepoint, useDeleteSavepoint } from '../../hooks/useSavepoints';
import { useNavigationStackStore } from '../../stores/useNavigationStackStore';
import {
  ArrowLeft,
  ArrowRight,
  GitBranch,
  BookMarked,
  Settings,
  MoreVertical,
  CheckCircle2,
  Save,
  Clock,
  Trash2,
  FileEdit,
  Loader2,
  List,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '../../components/ui';
import CommentSection from './CommentSection';
import { InteractionBar, ShareButton } from '../../components/Interaction';
import { FollowButton } from '../../components/Interaction';
import { ReadingSettings, loadInitial } from '../../components/reading';

const ReadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  const { isDrawerOpen } = useNavigationStackStore();

  const queryParams = new URLSearchParams(location.search);
  const referralId = queryParams.get('referralId') || undefined;

  // ─── Data fetching ───
  const { data: chapter, isLoading, error } = useChapter(id!, referralId);
  const { data: tocChapters = [], isLoading: isTocLoading } = useChaptersByStory(
    chapter?.story?.id || '',
    undefined,
  );
  const { data: booklistContext } = useBooklist(referralId || '');
  const { data: myBooklistsRaw } = useMyBooklists();
  const myBooklists = myBooklistsRaw || [];

  // ─── Mutations ───
  const createBranch = useCreateBranch();
  const addToBooklist = useAddToBooklist();
  const createSavepoint = useCreateSavepoint();
  const deleteSavepoint = useDeleteSavepoint();

  // ─── Reading settings — shared with ReadingSettings component ───
  const [readingSettings, setReadingSettings] = useState(loadInitial);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Booklist Modal
  const [isBooklistModalOpen, setIsBooklistModalOpen] = useState(false);
  const [selectedBooklistId, setSelectedBooklistId] = useState('');
  const [booklistNote, setBooklistNote] = useState('');
  const [isAddingToBooklist, setIsAddingToBooklist] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Savepoints
  const [isSavepointsOpen, setIsSavepointsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { data: savepoints = [] } = useSavepoints(
    chapter?.storyId || '',
    isSavepointsOpen && !!chapter?.storyId,
  );

  // Branch creation
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({ title: '', description: '' });
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

  // TOC
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [currentBooklistItemIndex, setCurrentBooklistItemIndex] = useState(-1);

  // ─── Derived state ───
  const items = useMemo(() => booklistContext?.items || [], [booklistContext]);
  useEffect(() => {
    if (items.length > 0 && id) {
      const idx = items.findIndex((item: any) => item.chapterId === id);
      setCurrentBooklistItemIndex(idx);
    } else {
      setCurrentBooklistItemIndex(-1);
    }
  }, [id, items]);

  useEffect(() => {
    if (myBooklists.length > 0 && !selectedBooklistId) {
      setSelectedBooklistId(myBooklists[0].id);
    }
  }, [myBooklists, selectedBooklistId]);

  useEffect(() => {
    if (chapter) {
      analytics.trackReadingProgress(chapter.id, chapter.storyId, 100);
      if (!isDrawerOpen) {
        window.scrollTo(0, 0);
      }
    }
  }, [chapter?.id, isDrawerOpen]);

  // ─── Navigation helpers ───
  const navigateBooklist = (direction: 'prev' | 'next') => {
    if (!booklistContext || currentBooklistItemIndex < 0) return;
    const newIndex = direction === 'prev' ? currentBooklistItemIndex - 1 : currentBooklistItemIndex + 1;
    const targetItem = booklistContext.items[newIndex];
    if (!targetItem) return;
    navigate(`/read/${targetItem.chapterId}?referralId=${booklistContext.id}`);
  };

  // ─── Mutation handlers ───
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapter) return;
    setIsCreatingBranch(true);
    try {
      const newBranch = await createBranch.mutateAsync({
        parentStoryId: chapter.storyId,
        parentChapterId: chapter.id,
        title: branchForm.title,
        description: branchForm.description,
        branchType: 'parallel',
        isOfficial: false,
      });
      setIsBranchModalOpen(false);
      setBranchForm({ title: '', description: '' });
      navigate(`/branch/${newBranch.id}`);
    } catch {
      addToast('error', '创建分支失败');
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const handleCreateSpinoff = () => {
    if (!chapter) return;
    const url = chapter.branchId
      ? `/spinoff/create?storyId=${chapter.storyId}&branchId=${chapter.branchId}`
      : `/spinoff/create?storyId=${chapter.storyId}`;
    navigate(url);
  };

  const handleAddToBooklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooklistId || !id) return;
    setIsAddingToBooklist(true);
    try {
      await addToBooklist.mutateAsync({
        booklistId: selectedBooklistId,
        data: { chapterId: id, notes: booklistNote },
      });
      setAddSuccess(true);
      setTimeout(() => {
        setIsBooklistModalOpen(false);
        setAddSuccess(false);
        setBooklistNote('');
      }, 1500);
    } catch {
      addToast('error', '添加失败，可能已在书单中');
    } finally {
      setIsAddingToBooklist(false);
    }
  };

  const handleCreateSavepoint = async () => {
    if (!chapter) return;
    setIsSaving(true);
    try {
      await createSavepoint.mutateAsync({
        storyId: chapter.storyId,
        branchId: chapter.branchId,
        chapterId: chapter.id,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      // silent
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavepoint = async (savepointId: string) => {
    try {
      await deleteSavepoint.mutateAsync({ id: savepointId });
    } catch {
      // silent
    }
  };

  // ─── Loading & Error ───
  if (isLoading || !chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink-50">
        <div className="text-center">
          <p className="text-xl font-black text-ink-700 mb-2">加载失败</p>
          <p className="text-sm text-ink-400">无法获取章节数据，请稍后再试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-[oklch(12%_0.01_260)] pb-20">
      {/* ── Top Toolbar (semi-transparent, minimal presence) ── */}
      <header className="sticky top-0 z-40 bg-ink-50/85 dark:bg-[oklch(12%_0.01_260)]/85 backdrop-blur-xl border-b border-ink-100 dark:border-[oklch(24%_0.01_260)] h-16 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {booklistContext ? (
            <>
              <button
                onClick={() => navigate(`/booklist/${booklistContext.id}`)}
                className="p-2 hover:bg-ink-100 dark:hover:bg-[oklch(20%_0.01_260)] rounded-lg transition-colors shrink-0"
                title="返回书单"
              >
                <MapPin size={18} className="text-accent-500" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-accent-500 uppercase font-black tracking-widest line-clamp-1">
                  {booklistContext.title}
                </p>
                <h2 className="text-sm font-black text-ink-700 dark:text-ink-100 line-clamp-1 flex items-center gap-2">
                  <span className="text-accent-500 font-mono text-xs">
                    {currentBooklistItemIndex >= 0 ? `#${currentBooklistItemIndex + 1}` : ''}
                  </span>
                  {chapter.title}
                </h2>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => navigateBooklist('prev')}
                  disabled={currentBooklistItemIndex <= 0}
                  className="p-1.5 hover:bg-ink-100 dark:hover:bg-[oklch(20%_0.01_260)] rounded-lg transition-colors disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[10px] font-bold text-ink-400 min-w-[32px] text-center tabular-nums">
                  {currentBooklistItemIndex >= 0
                    ? `${currentBooklistItemIndex + 1}/${booklistContext.items.length}`
                    : ''}
                </span>
                <button
                  onClick={() => navigateBooklist('next')}
                  disabled={currentBooklistItemIndex < 0 || currentBooklistItemIndex >= booklistContext.items.length - 1}
                  className="p-1.5 hover:bg-ink-100 dark:hover:bg-[oklch(20%_0.01_260)] rounded-lg transition-colors disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => navigate(`/booklist/${booklistContext.id}`)}
                  className="ml-1 px-2 py-1 text-[10px] font-bold text-ink-400 hover:text-ink-600 bg-ink-100 dark:bg-[oklch(20%_0.01_260)] rounded-lg transition-colors"
                  title="退出路线"
                >
                  <X size={14} />
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-ink-100 dark:hover:bg-[oklch(20%_0.01_260)] rounded-lg transition-colors shrink-0"
              >
                <ArrowLeft size={20} className="text-ink-500" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-black text-ink-700 dark:text-ink-100 line-clamp-1">
                  {chapter.title}
                </h2>
                <p className="text-[10px] text-ink-400 uppercase font-bold tracking-widest line-clamp-1">
                  {chapter.branch ? `分支：${chapter.branch.title}` : `主线：${chapter.story.title}`}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Toolbar actions */}
        <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
          <button
            onClick={() => setIsBooklistModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium text-ink-500 hover:text-ink-700 hover:bg-ink-100 dark:hover:bg-[oklch(20%_0.01_260)] rounded-lg transition-all"
          >
            <BookMarked size={17} />
            <span className="hidden sm:inline">加入书单</span>
          </button>
          {isAuthenticated && (
            <>
              <button
                onClick={() => setIsBranchModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-800/20 rounded-lg transition-all"
              >
                <GitBranch size={17} />
                <span className="hidden sm:inline">创建分支</span>
              </button>
              <button
                onClick={handleCreateSpinoff}
                className="flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium text-ink-500 hover:text-ink-700 hover:bg-ink-100 dark:hover:bg-[oklch(20%_0.01_260)] rounded-lg transition-all"
              >
                <FileEdit size={17} />
                <span className="hidden sm:inline">番外</span>
              </button>
            </>
          )}
          <ShareButton
            targetType="chapter"
            targetId={chapter.id}
            title={chapter.title}
            description={`阅读《${chapter.story.title}》的章节：${chapter.title}`}
            size="sm"
            variant="ghost"
          />
          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className={`p-2 rounded-lg transition-colors ${isTocOpen ? 'text-accent-500 bg-accent-50' : 'text-ink-400 hover:text-ink-600 hover:bg-ink-100'}`}
            title="目录"
          >
            <List size={20} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-ink-400 hover:text-ink-600 hover:bg-ink-100 rounded-lg transition-colors"
            title="阅读设置"
          >
            <Settings size={20} />
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setIsSavepointsOpen(true)}
              className="p-2 text-ink-400 hover:text-ink-600 hover:bg-ink-100 rounded-lg transition-colors"
              title="时空存档"
            >
              <Save size={20} />
            </button>
          )}
        </div>
      </header>

      {/* ── TOC Panel ── */}
      {isTocOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 md:bg-transparent" onClick={() => setIsTocOpen(false)} />
          <aside className="fixed z-50 bg-ink-50 dark:bg-[oklch(16%_0.01_260)] shadow-lg border-ink-100 dark:border-[oklch(24%_0.01_260)] md:right-6 md:top-24 md:w-80 md:max-h-[calc(100vh-8rem)] md:rounded-xl md:border md:overflow-y-auto inset-x-0 bottom-0 rounded-t-xl border-t max-h-[65vh] overflow-y-auto md:inset-x-auto">
            <div className="sticky top-0 bg-ink-50 dark:bg-[oklch(16%_0.01_260)] px-4 py-3 border-b border-ink-100 dark:border-[oklch(24%_0.01_260)] flex items-center justify-between z-10">
              <h3 className="text-sm font-black text-ink-700 dark:text-ink-100">
                全宇宙目录
                {tocChapters.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-ink-400">{tocChapters.length} 章</span>
                )}
              </h3>
              <button onClick={() => setIsTocOpen(false)} className="p-1 text-ink-400 hover:text-ink-600 rounded-lg hover:bg-ink-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            {isTocLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-ink-300" />
              </div>
            ) : tocChapters.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-ink-400">暂无章节</div>
            ) : (
              (() => {
                const tracks = new Map<string, { title: string; icon: 'main' | 'branch'; chapters: typeof tocChapters }>();
                for (const ch of tocChapters) {
                  const key = ch.branchId || '__main__';
                  if (!tracks.has(key)) {
                    tracks.set(key, {
                      title: ch.branch?.title || '主线',
                      icon: ch.branchId ? 'branch' : 'main',
                      chapters: [],
                    });
                  }
                  tracks.get(key)!.chapters.push(ch);
                }
                return [...tracks.entries()].map(([key, track]) => {
                  const isCurrentTrack = track.chapters.some((ch: any) => ch.id === chapter?.id);
                  return (
                    <div key={key}>
                      <div className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider border-b ${
                        track.icon === 'main'
                          ? 'text-accent-500 border-accent-50'
                          : 'text-accent-400 border-accent-50'
                      } ${isCurrentTrack ? 'bg-accent-50/30' : 'bg-ink-50/30'}`}>
                        {track.icon === 'main' ? <BookMarked size={12} /> : <GitBranch size={12} />}
                        <span>{track.title}</span>
                        <span className="ml-auto text-[10px] font-normal opacity-60">{track.chapters.length} 节</span>
                      </div>
                      <ul>
                        {track.chapters.map((ch: any) => {
                          const isCurrent = ch.id === chapter?.id;
                          return (
                            <li key={ch.id}>
                              <Link
                                to={`/read/${ch.id}`}
                                onClick={() => setIsTocOpen(false)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                                  isCurrent
                                    ? 'bg-accent-50 text-accent-600 font-semibold'
                                    : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700'
                                } ${ch.branchId && !isCurrent ? 'pl-10' : ''}`}
                              >
                                <span className="w-5 text-center text-xs text-ink-400 shrink-0 font-mono tabular-nums">
                                  {ch.orderIndex}
                                </span>
                                <span className="line-clamp-1 flex-1 min-w-0">{ch.title}</span>
                                {ch.isBranchPoint && <GitBranch size={12} className="shrink-0 text-accent-400" />}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                });
              })()
            )}
          </aside>
        </>
      )}

      {/* ── Reading Area ── */}
      <div className="max-w-[65ch] mx-auto px-6 py-12 md:py-20">
        <div className="space-y-8 mb-16">
          <div className="space-y-4 text-center">
            <h1 className="text-3xl md:text-3xl font-black font-display text-ink-800 dark:text-ink-100 tracking-tight">
              {chapter.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-ink-400 text-sm font-medium">
              <span>{chapter.story.author.username}</span>
              {chapter.story.author?.id && <FollowButton targetUserId={chapter.story.author.id} size="sm" />}
              <span className="w-1 h-1 bg-ink-200 dark:bg-[oklch(24%_0.01_260)] rounded-full" />
              <span>约 {(chapter.content.length / 2).toFixed(0)} 字</span>
            </div>
          </div>

          <div
            className="prose max-w-none leading-relaxed"
            style={{
              fontSize: `${readingSettings.fontSize}px`,
              fontFamily: readingSettings.fontFamily === 'serif' ? 'var(--font-reading)' : 'var(--font-ui)',
              lineHeight: 1.75,
            }}
          >
            <ReactMarkdown>{chapter.content}</ReactMarkdown>
          </div>
        </div>

        {/* ── Branch Discovery Section ── */}
        {chapter.branchesFrom?.length > 0 && (
          <div className="my-16">
            {/* Divider with diamond marker */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-ink-200 dark:bg-[oklch(24%_0.01_260)]" />
              <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 text-accent-400">
                <rect x="6" y="0" width="8.485" height="8.485" transform="rotate(45 6 0)" fill="currentColor" opacity="0.4" />
              </svg>
              <span className="text-xs font-black text-ink-400 uppercase tracking-widest whitespace-nowrap">
                故事在此分歧
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 text-accent-400">
                <rect x="6" y="0" width="8.485" height="8.485" transform="rotate(45 6 0)" fill="currentColor" opacity="0.4" />
              </svg>
              <div className="flex-1 h-px bg-ink-200 dark:bg-[oklch(24%_0.01_260)]" />
            </div>

            <div className="p-6 md:p-8 bg-ink-50 dark:bg-[oklch(16%_0.01_260)] rounded-xl border border-ink-100 dark:border-[oklch(24%_0.01_260)] shadow-sm">
              <p className="text-center text-ink-400 text-sm font-medium mb-6">
                在这个时间节点，{chapter.branchesFrom.length} 个平行宇宙从此分叉
              </p>
              <div className="grid grid-cols-1 gap-3">
                {chapter.branchesFrom.map((branch: any, idx: number) => (
                  <Link
                    key={branch.id}
                    to={`/branch/${branch.id}`}
                    className="flex items-center gap-4 p-4 rounded-lg border border-ink-100 dark:border-[oklch(24%_0.01_260)] hover:border-accent-300 hover:shadow-sm transition-all group bg-ink-50/50 dark:bg-transparent"
                  >
                    <div className={`w-9 h-9 flex items-center justify-center rounded-md text-sm font-black shrink-0 ${
                      branch.isOfficial
                        ? 'bg-accent-100 text-accent-600'
                        : 'bg-ink-100 text-ink-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-bold text-ink-700 dark:text-ink-100 group-hover:text-accent-600 transition-colors">
                          {branch.title}
                        </h4>
                        {branch.isOfficial ? (
                          <span className="px-1.5 py-0.5 bg-accent-500 text-white text-[9px] font-black rounded-full uppercase tracking-wide">
                            官方
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-accent-100 text-accent-600 text-[9px] font-black rounded-full uppercase tracking-wide">
                            社区
                          </span>
                        )}
                      </div>
                      {branch.description && (
                        <p className="text-sm text-ink-400 line-clamp-1 mb-1.5">{branch.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-ink-400">
                        {(branch as any)._count?.chapters !== undefined && (
                          <span className="font-medium">{(branch as any)._count.chapters} 章</span>
                        )}
                        {branch.author && (
                          <>
                            <span className="w-1 h-1 bg-ink-200 rounded-full" />
                            <span>{branch.author.username} 著</span>
                          </>
                        )}
                        {(branch as any).viewCount > 0 && (
                          <>
                            <span className="w-1 h-1 bg-ink-200 rounded-full" />
                            <span>{(branch as any).viewCount.toLocaleString()} 读</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-ink-300 group-hover:text-accent-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer Navigation ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-ink-100 dark:border-[oklch(24%_0.01_260)]">
          {chapter.prevChapter ? (
            <Link
              to={`/read/${chapter.prevChapter.id}${referralId ? `?referralId=${referralId}` : ''}`}
              className="w-full sm:w-auto flex items-center gap-4 p-4 rounded-xl bg-ink-50 dark:bg-[oklch(16%_0.01_260)] border border-ink-100 dark:border-[oklch(24%_0.01_260)] hover:border-accent-300 hover:shadow-sm transition-all group"
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

          <button
            onClick={() => navigate(`/story/${chapter.storyId}`)}
            className="p-4 bg-ink-100 dark:bg-[oklch(20%_0.01_260)] text-ink-500 rounded-xl hover:bg-ink-200 transition-all"
            title="查看目录"
          >
            <MoreVertical size={20} />
          </button>

          {chapter.nextChapter ? (
            <Link
              to={`/read/${chapter.nextChapter.id}${referralId ? `?referralId=${referralId}` : ''}`}
              className="w-full sm:w-auto flex items-center justify-end gap-4 p-4 rounded-xl bg-ink-50 dark:bg-[oklch(16%_0.01_260)] border border-ink-100 dark:border-[oklch(24%_0.01_260)] hover:border-accent-300 hover:shadow-sm transition-all group"
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
                onClick={() => navigate(`/story/${chapter.storyId}`)}
                className="text-[10px] font-bold text-accent-500 hover:underline mt-1"
              >
                开启新分支？
              </button>
            </div>
          )}
        </div>

        {/* ── Interaction Section ── */}
        <div className="my-12 p-8 bg-ink-50 dark:bg-[oklch(16%_0.01_260)] rounded-xl border border-ink-100 dark:border-[oklch(24%_0.01_260)]">
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

        {/* ── Comments ── */}
        <CommentSection key={chapter.id} chapterId={chapter.id} />
      </div>

      {/* ── Reading Settings (Modal variant) ── */}
      <ReadingSettings
        variant="modal"
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onChange={setReadingSettings}
      />

      {/* ── Booklist Modal ── */}
      <Modal isOpen={isBooklistModalOpen} onClose={() => setIsBooklistModalOpen(false)} title="加入我的精选书单">
        {addSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-accent-50 text-accent-500 rounded-full flex items-center justify-center">
              <CheckCircle2 size={40} />
            </div>
            <p className="text-xl font-black text-ink-700">成功加入书单！</p>
          </div>
        ) : (
          <form onSubmit={handleAddToBooklist} className="space-y-6 p-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-ink-500">选择书单</label>
              {myBooklists.length > 0 ? (
                <select
                  className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-ink-50 text-sm focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all"
                  value={selectedBooklistId}
                  onChange={(e) => setSelectedBooklistId(e.target.value)}
                >
                  {myBooklists.map((list: any) => (
                    <option key={list.id} value={list.id}>{list.title}</option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-ink-50 rounded-lg text-center">
                  <p className="text-sm text-ink-400 mb-2">你还没有创建过书单</p>
                  <Link to="/booklist" className="text-accent-500 text-xs font-bold hover:underline">
                    去创建一个新书单
                  </Link>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-ink-500">导游点评 (可选)</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-ink-200 bg-ink-50 text-sm focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all resize-none"
                placeholder="为这一站写点推荐语..."
                value={booklistNote}
                onChange={(e) => setBooklistNote(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isAddingToBooklist || !selectedBooklistId}
              className="w-full h-12 bg-accent-500 text-white rounded-lg font-bold hover:bg-accent-600 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isAddingToBooklist ? '正在加入...' : '确认加入书单'}
            </button>
          </form>
        )}
      </Modal>

      {/* ── Savepoints Modal ── */}
      <Modal isOpen={isSavepointsOpen} onClose={() => setIsSavepointsOpen(false)} title="时空存档">
        <div className="space-y-6 p-6">
          <div className="p-4 bg-accent-50 dark:bg-accent-800/10 rounded-lg border border-accent-100 dark:border-accent-800/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-black text-accent-600 uppercase tracking-widest">当前位置</h4>
              {saveSuccess && (
                <span className="text-[10px] font-bold text-accent-500 animate-pulse">存档成功！</span>
              )}
            </div>
            <p className="text-[13px] font-bold text-ink-700 dark:text-ink-200 mb-4">{chapter?.title}</p>
            <button
              onClick={handleCreateSavepoint}
              disabled={isSaving}
              className="w-full h-10 bg-accent-500 text-white rounded-lg text-sm font-bold hover:bg-accent-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={14} />
              {isSaving ? '正在记录时空坐标...' : '立即存档当前进度'}
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-ink-400 uppercase tracking-widest px-1">历史存档点</h4>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {savepoints.length > 0 ? (
                savepoints.map((sp: any) => (
                  <div
                    key={sp.id}
                    className="group flex items-center justify-between p-3 bg-ink-50 dark:bg-[oklch(20%_0.01_260)] rounded-lg border border-ink-100 dark:border-[oklch(24%_0.01_260)] hover:border-accent-200 transition-all"
                  >
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => { navigate(`/read/${sp.chapterId}`); setIsSavepointsOpen(false); }}
                    >
                      <h5 className="text-xs font-black text-ink-700 dark:text-ink-200 truncate group-hover:text-accent-600 transition-colors">
                        {sp.chapter?.title || '未知章节'}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={10} className="text-ink-400" />
                        <span className="text-[10px] text-ink-400 font-bold">
                          {new Date(sp.createdAt).toLocaleString()}
                        </span>
                        {sp.branch && (
                          <>
                            <span className="text-ink-300">·</span>
                            <span className="text-[10px] text-accent-500 font-bold italic">{sp.branch.title}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSavepoint(sp.id)}
                      className="p-2 text-ink-300 hover:text-red-500 transition-colors"
                      title="删除存档"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-ink-400">
                  <Clock size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">暂无历史存档</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Create Branch Modal ── */}
      <Modal isOpen={isBranchModalOpen} onClose={() => setIsBranchModalOpen(false)} title="创建平行宇宙分支">
        <form onSubmit={handleCreateBranch} className="space-y-6 p-6">
          <div className="p-4 bg-accent-50 dark:bg-accent-800/10 rounded-lg border border-accent-100 dark:border-accent-800/20">
            <p className="text-xs font-bold text-accent-600 mb-1">基于当前章节创建分支</p>
            <p className="text-[11px] text-accent-500/70">
              《{chapter?.story?.title}》— {chapter?.title}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">分支标题 <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-ink-50 text-sm focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all"
              placeholder="给你的平行宇宙起个名字..."
              value={branchForm.title}
              onChange={(e) => setBranchForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">分支描述 <span className="text-red-400">*</span></label>
            <textarea
              required
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-ink-200 bg-ink-50 text-sm focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 transition-all resize-none"
              placeholder="描述这个分支的故事走向..."
              value={branchForm.description}
              onChange={(e) => setBranchForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={isCreatingBranch}
            className="w-full h-12 bg-accent-500 text-white rounded-lg font-bold hover:bg-accent-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCreatingBranch ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                正在创建分支...
              </>
            ) : (
              <>
                <GitBranch size={18} />
                创建分支
              </>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ReadPage;
