import React from 'react';
import { ChevronRight, GitBranch, Sparkles, User, BookMarked, Route } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { Chapter, Branch, Spinoff, branchService, spinoffService } from '../../api/storyService';
import { characterService } from '../../api/characterService';
import { useToast } from '../notifications/Toast';
import { Skeleton } from './Skeleton';
import { queryKeys } from '../../lib/queryKeys';
import type { Character } from '../../api/types';

interface ContextPanelContentProps {
  storyId?: string;
  chapterId?: string;
  branchId?: string;
  chapters?: Chapter[];
  branches?: Branch[];
  spinoffs?: Spinoff[];
  onAddToBooklist: () => void;
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
      <Sparkles size={12} className={`shrink-0 ${spinoff.isOfficial ? 'text-amber-500' : 'text-accent-500'}`} />
      <span className="text-xs text-ink-700 dark:text-ink-300 truncate flex-1">{spinoff.title || '番外'}</span>
      <span className="text-[10px] text-ink-400 shrink-0 capitalize">{spinoff.type?.replace('_', ' ')}</span>
    </div>
  );
}

function CharacterItem({ character, onClick }: { character: Character; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700/50 transition-colors text-left">
      <div className="w-6 h-6 rounded-full bg-accent-100 dark:bg-accent-800/30 flex items-center justify-center shrink-0">
        <User size={12} className="text-accent-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink-700 dark:text-ink-300 truncate">{character.name}</p>
        <p className="text-[10px] text-ink-400 capitalize">{character.role}</p>
      </div>
    </button>
  );
}

const ContentPanelContent: React.FC<ContextPanelContentProps> = ({ storyId, chapterId, branchId, chapters, branches: propBranches, spinoffs: propSpinoffs, onAddToBooklist }) => {
  const { addToast } = useToast();

  const shouldFetch = !!storyId;

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
    queryFn: () => characterService.getCharacters(storyId || ''),
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

  if (!storyId) {
    return (
      <div className="text-sm text-ink-500 dark:text-ink-400 text-center py-8">
        当前无关联内容
      </div>
    );
  }

  return (
    <>
      {chapters && chapters.length > 0 && (
        <SectionCard title="章节导航" icon={<ChevronRight size={12} />}>
          <MiniTree chapters={chapters} currentChapterId={chapterId} />
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
          Array.isArray(characters) && characters.length > 0 && characters.slice(0, 5).map((c: Character) => (
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
              if (chapterId) onAddToBooklist();
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
  );
};

export default ContentPanelContent;
