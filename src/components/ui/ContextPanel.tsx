import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { X, PanelRight, ChevronRight, ChevronLeft, GitBranch, Sparkles, User, BookMarked, Route, ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { Chapter, Branch, Spinoff, branchService, spinoffService, storyService } from '../../api/storyService';
import { useToast } from '../notifications/Toast';
import { Skeleton } from '../ui/Skeleton';
import { queryKeys } from '../../lib/queryKeys';
import AddToBooklistModal from '../Booklist/AddToBooklistModal';

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

function MiniTree({ chapters, currentChapterId }: { chapters: Chapter[]; currentChapterId?: string }) {
  const mainline = chapters.filter(c => !c.branchId).sort((a, b) => a.orderIndex - b.orderIndex);
  if (mainline.length === 0) return null;

  return (
    <div className="flex items-center overflow-x-auto py-2 px-1">
      {mainline.map((ch, i) => (
        <React.Fragment key={ch.id}>
          {i > 0 && <div className="w-3 h-0.5 bg-ink-200 dark:bg-ink-600 shrink-0" />}
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
            ch.id === currentChapterId
              ? 'bg-accent-500 ring-2 ring-accent-200 dark:ring-accent-700 scale-110'
              : 'bg-ink-200 dark:bg-ink-600'
          }`}>
            <span className="text-[8px] font-bold text-white">{ch.orderIndex}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function SectionCard({ title, icon, children, empty }: { title: string; icon: React.ReactNode; children: React.ReactNode; empty?: string }) {
  return (
    <div className="bg-ink-50/50 dark:bg-ink-700/30 rounded-xl p-3 space-y-2">
      <h4 className="flex items-center gap-1.5 text-xs font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
        {icon}
        {title}
      </h4>
      {children || (
        <p className="text-xs text-ink-400 dark:text-ink-500 text-center py-2">{empty || '暂无数据'}</p>
      )}
    </div>
  );
}

function BranchItem({ branch }: { branch: Branch }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700/50 transition-colors cursor-pointer">
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${branch.isOfficial ? 'bg-amber-500' : 'bg-purple-500'}`} />
      <span className="text-xs text-ink-700 dark:text-ink-300 truncate flex-1">{branch.title}</span>
      {branch._count?.chapters && (
        <span className="text-[10px] text-ink-400 shrink-0">{branch._count.chapters}章</span>
      )}
    </div>
  );
}

function SpinoffItem({ spinoff }: { spinoff: Spinoff }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700/50 transition-colors cursor-pointer">
      <Sparkles size={12} className={`shrink-0 ${spinoff.isOfficial ? 'text-amber-500' : 'text-indigo-500'}`} />
      <span className="text-xs text-ink-700 dark:text-ink-300 truncate flex-1">{spinoff.title || '番外'}</span>
      <span className="text-[10px] text-ink-400 shrink-0 capitalize">{spinoff.type?.replace('_', ' ')}</span>
    </div>
  );
}

function CharacterItem({ character, onClick }: { character: any; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700/50 transition-colors text-left">
      <div className="w-6 h-6 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
        <User size={12} className="text-accent-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink-700 dark:text-ink-300 truncate">{character.name}</p>
        <p className="text-[10px] text-ink-400 capitalize">{character.role}</p>
      </div>
      <ExternalLink size={10} className="text-ink-300 shrink-0" />
    </button>
  );
}

const ContextPanel: React.FC<ContextPanelProps> = ({ storyId, chapterId, branchId, chapters: propChapters, branches: propBranches, spinoffs: propSpinoffs }) => {
  const location = useLocation();
  const isReadingPage = location.pathname.startsWith('/read/');
  const [state, setState] = useState<PanelState>(() => {
    return isReadingPage ? 'expanded' : getInitialState();
  });
  const { addToast } = useToast();
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

  const shouldFetch = state === 'expanded' && !!storyId;

  const { data: fetchedBranches, isLoading: branchesLoading, isError: branchesError } = useQuery({
    queryKey: queryKeys.branches.list({}),
    queryFn: () => branchService.getAll(),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: shouldFetch,
  });
  const { data: fetchedSpinoffs, isLoading: spinoffsLoading, isError: spinoffsError } = useQuery({
    queryKey: queryKeys.spinoffs.list(storyId ? { originalStoryId: storyId } : {}),
    queryFn: () => spinoffService.getAll(storyId ? { originalStoryId: storyId } : undefined),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: shouldFetch,
  });
  const { data: characters, isLoading: charsLoading, isError: charsError } = useQuery({
    queryKey: queryKeys.characters.byStory(storyId || ''),
    queryFn: () => storyService.getCharacters(storyId || ''),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: shouldFetch && !!storyId,
  });

  const branches = propBranches || fetchedBranches || [];
  const spinoffs = propSpinoffs || fetchedSpinoffs || [];

  const siblingBranches = chapterId
    ? branches.filter((b: Branch) => b.parentChapterId === chapterId)
    : branchId
    ? branches.filter((b: Branch) => b.parentBranchId === branchId)
    : [];

  const relatedSpinoffs = chapterId
    ? spinoffs.filter((s: Spinoff) => s.originalChapterId === chapterId)
    : branchId
    ? spinoffs.filter((s: Spinoff) => s.originalBranchId === branchId)
    : spinoffs;

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
              {!storyId ? (
                <div className="text-sm text-ink-500 dark:text-ink-400 text-center py-8">
                  当前无关联内容
                </div>
              ) : (
                <>
                  {propChapters && propChapters.length > 0 && (
                    <SectionCard title="章节导航" icon={<ChevronRight size={12} />}>
                      <MiniTree chapters={propChapters} currentChapterId={chapterId} />
                    </SectionCard>
                  )}
                  <SectionCard title="同级分支" icon={<GitBranch size={12} />} empty="当前无同级分支">
                    {branchesLoading ? (
                      <div className="space-y-2">
                        <Skeleton variant="text" className="h-6" />
                        <Skeleton variant="text" className="h-6 w-3/4" />
                      </div>
                    ) : branchesError ? (
                      <p className="text-xs text-red-500">加载失败</p>
                    ) : (
                      siblingBranches.length > 0 && siblingBranches.slice(0, 5).map((b: Branch) => (
                        <BranchItem key={b.id} branch={b} />
                      ))
                    )}
                  </SectionCard>
                  <SectionCard title="相关番外" icon={<Sparkles size={12} />} empty="当前无相关番外">
                    {spinoffsLoading ? (
                      <div className="space-y-2">
                        <Skeleton variant="text" className="h-6" />
                        <Skeleton variant="text" className="h-6 w-2/3" />
                      </div>
                    ) : spinoffsError ? (
                      <p className="text-xs text-red-500">加载失败</p>
                    ) : (
                      relatedSpinoffs.length > 0 && relatedSpinoffs.slice(0, 5).map((s: Spinoff) => (
                        <SpinoffItem key={s.id} spinoff={s} />
                      ))
                    )}
                  </SectionCard>
                  <SectionCard title="角色出场" icon={<User size={12} />} empty="暂无角色出场记录">
                    {charsLoading ? (
                      <div className="space-y-2">
                        <Skeleton variant="text" className="h-6" />
                        <Skeleton variant="text" className="h-6 w-1/2" />
                      </div>
                    ) : charsError ? (
                      <p className="text-xs text-red-500">加载失败</p>
                    ) : (
                      Array.isArray(characters) && characters.length > 0 && characters.slice(0, 5).map((c: any) => (
                        <CharacterItem
                          key={c.id}
                          character={c}
                          onClick={() => {
                            addToast('info', `对 ${c.name} 的 Wiki 链接尚未启用`);
                          }}
                        />
                      ))
                    )}
                  </SectionCard>
                  <SectionCard title="操作" icon={<BookMarked size={12} />}>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => {
                          if (chapterId) setBooklistModalOpen(true);
                          else addToast('info', '请先选择章节再添加到书单');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-accent-500/10 hover:bg-accent-500/20 text-accent-600 dark:text-accent-400 text-sm font-bold transition-colors min-h-[44px]"
                      >
                        <BookMarked size={18} />
                        加入书单
                      </button>
                      <button
                        onClick={() => addToast('info', '阅读路径功能即将开放')}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-ink-100 dark:bg-ink-700 hover:bg-ink-200 dark:hover:bg-ink-600 text-ink-600 dark:text-ink-400 text-sm font-bold transition-colors min-h-[44px]"
                      >
                        <Route size={18} />
                        添加到阅读路径
                      </button>
                    </div>
                  </SectionCard>
                </>
              )}
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
                {!storyId ? (
                  <div className="text-sm text-ink-500 dark:text-ink-400 text-center py-8">
                    当前无关联内容
                  </div>
                ) : (
                  <>
                    {propChapters && propChapters.length > 0 && (
                      <SectionCard title="章节导航" icon={<ChevronRight size={12} />}>
                        <MiniTree chapters={propChapters} currentChapterId={chapterId} />
                      </SectionCard>
                    )}
                    <SectionCard title="同级分支" icon={<GitBranch size={12} />} empty="当前无同级分支">
                      {branchesLoading ? (
                        <div className="space-y-2">
                          <Skeleton variant="text" className="h-6" />
                          <Skeleton variant="text" className="h-6 w-3/4" />
                        </div>
                      ) : branchesError ? (
                        <p className="text-xs text-red-500">加载失败</p>
                      ) : (
                        siblingBranches.length > 0 && siblingBranches.slice(0, 5).map((b: Branch) => (
                          <BranchItem key={b.id} branch={b} />
                        ))
                      )}
                    </SectionCard>
                    <SectionCard title="相关番外" icon={<Sparkles size={12} />} empty="当前无相关番外">
                      {spinoffsLoading ? (
                        <div className="space-y-2">
                          <Skeleton variant="text" className="h-6" />
                          <Skeleton variant="text" className="h-6 w-2/3" />
                        </div>
                      ) : spinoffsError ? (
                        <p className="text-xs text-red-500">加载失败</p>
                      ) : (
                        relatedSpinoffs.length > 0 && relatedSpinoffs.slice(0, 5).map((s: Spinoff) => (
                          <SpinoffItem key={s.id} spinoff={s} />
                        ))
                      )}
                    </SectionCard>
                    <SectionCard title="角色出场" icon={<User size={12} />} empty="暂无角色出场记录">
                      {charsLoading ? (
                        <div className="space-y-2">
                          <Skeleton variant="text" className="h-6" />
                          <Skeleton variant="text" className="h-6 w-1/2" />
                        </div>
                      ) : charsError ? (
                        <p className="text-xs text-red-500">加载失败</p>
                      ) : (
                        Array.isArray(characters) && characters.length > 0 && characters.slice(0, 5).map((c: any) => (
                          <CharacterItem
                            key={c.id}
                            character={c}
                            onClick={() => {
                              addToast('info', `对 ${c.name} 的 Wiki 链接尚未启用`);
                            }}
                          />
                        ))
                      )}
                    </SectionCard>
                    <SectionCard title="操作" icon={<BookMarked size={12} />}>
                      <div className="space-y-1.5">
                        <button
                          onClick={() => {
                            if (chapterId) setBooklistModalOpen(true);
                            else addToast('info', '请先选择章节再添加到书单');
                          }}
                          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg bg-accent-500/10 hover:bg-accent-500/20 text-accent-600 dark:text-accent-400 text-xs font-bold transition-colors"
                        >
                          <BookMarked size={14} />
                          加入书单
                        </button>
                        <button
                          onClick={() => addToast('info', '阅读路径功能即将开放')}
                          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg bg-ink-100 dark:bg-ink-700 hover:bg-ink-200 dark:hover:bg-ink-600 text-ink-600 dark:text-ink-400 text-xs font-bold transition-colors"
                        >
                          <Route size={14} />
                          添加到阅读路径
                        </button>
                      </div>
                    </SectionCard>
                  </>
                )}
              </div>
            )}

            {effectiveState === 'mini' && (
              <div className="flex-1 flex flex-col items-center gap-4 py-4">
                <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
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
