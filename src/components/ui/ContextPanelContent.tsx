import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, GitBranch, Sparkles, User, BookMarked, Route, CheckCircle, Play, BookOpen, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { Chapter, Branch, Spinoff, branchService, spinoffService } from '../../api/storyService';
import { characterService } from '../../api/characterService';
import { wikiService } from '../../api/wikiService';
import { useToast } from '../notifications/Toast';
import { Skeleton } from './Skeleton';
import { queryKeys } from '../../lib/queryKeys';
import type { Character } from '../../api/types';
import { useReadingContext, buildNodeUrl, type ReadingContextValue } from '../../hooks/useReadingContext';
import { getNodeIcon, getNodeColor, getCategoryLabel } from '../../utils/nodeMeta';

interface ContextPanelContentProps {
  storyId?: string;
  chapterId?: string;
  branchId?: string;
  chapters?: Chapter[];
  branches?: Branch[];
  spinoffs?: Spinoff[];
  /** 阅读上下文，由 ReadPage 注入以避免重复调用 useReadingContext */
  readingCtx?: ReadingContextValue;
  onAddToBooklist: () => void;
}

/**
 * 阅读上下文感知区
 *
 * 当阅读来自书单 / 阅读路径 / 轨迹时，在面板顶部显示来源、节点序列与进度，
 * 让读者在侧栏即可上下章切换、查看已读状态，无需回到来源页。
 * 无上下文时不渲染。
 */
function ReadingContextSection({ chapterId, ctx: injectedCtx }: { chapterId?: string; ctx?: ReadingContextValue }) {
  // 优先使用注入的 ctx，避免重复调用 useReadingContext；无注入时回退自行调用
  const fallbackCtx = useReadingContext(chapterId);
  const ctx = injectedCtx ?? fallbackCtx;
  if (!ctx.type || ctx.nodes.length === 0) return null;

  const ctxLabel =
    ctx.type === 'booklist' ? '书单' : ctx.type === 'trail' ? '阅读轨迹' : '阅读路径';

  return (
    <SectionCard title={ctxLabel} icon={<Route size={12} />}>
      {/* 来源标题 + 进度 */}
      {ctx.title && (
        <p className="text-xs font-bold text-ink-700 dark:text-ink-200 truncate mb-1.5">
          {ctx.title}
        </p>
      )}
      {ctx.completionPercentage !== null && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-[10px] text-ink-400 mb-1">
            <span>进度</span>
            <span>{ctx.completionPercentage}%</span>
          </div>
          <div className="w-full bg-ink-200 dark:bg-ink-600 rounded-full h-1 overflow-hidden">
            <div
              className="bg-accent-500 h-1 rounded-full transition-all duration-500"
              style={{ width: `${ctx.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* 节点序列：当前高亮，已读打勾，可点击跳转（延续 ctx） */}
      <div className="space-y-0.5 max-h-56 overflow-y-auto -mx-1 px-1">
        {ctx.nodes.slice(0, 30).map((node, idx) => {
          const Icon = getNodeIcon(node.category);
          const isCurrent = idx === ctx.currentIndex;
          const isDone =
            ctx.type === 'trail'
              ? idx < (ctx.raw as any)?.currentNodeIndex
              : ctx.type === 'booklist'
                ? (ctx.raw as any)?.completedItemIds?.includes(node.contentId)
                : false;
          const hasRichData = !!(node.introduction || node.note || node.estimatedMin);
          const ctxToken = ctx.id && ctx.type ? `${ctx.type}:${ctx.id}` : null;
          const href = buildNodeUrl(node.category, node.contentId, ctxToken);
          const colorClass = getNodeColor(node.category);
          const label = getCategoryLabel(node.category);
          return (
            <Link
              key={node.contentId + idx}
              to={href}
              className={`flex items-start gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                isCurrent
                  ? 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400 font-bold'
                  : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700/50'
              }`}
            >
              {isDone ? (
                <CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <span className="w-3 text-center text-[9px] font-bold text-ink-400 shrink-0 mt-0.5">
                  {idx + 1}
                </span>
              )}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-1">
                  {hasRichData && (
                    <span className={`inline-flex items-center gap-0.5 px-1 py-[1px] rounded text-[8px] font-bold border ${colorClass} leading-tight shrink-0`}>
                      <Icon size={8} />
                      {label}
                    </span>
                  )}
                  <span className="truncate">{node.title}</span>
                </div>
                {(node.introduction || node.estimatedMin) && (
                  <div className="flex items-center gap-1.5">
                    {node.introduction && (
                      <span className="text-[10px] text-ink-400 dark:text-ink-500 line-clamp-1 italic">
                        {node.introduction}
                      </span>
                    )}
                    {node.estimatedMin && (
                      <span className="text-[9px] text-ink-300 dark:text-ink-500 shrink-0">
                        {node.estimatedMin}分钟
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
        {ctx.nodes.length > 30 && (
          <p className="text-[10px] text-ink-400 text-center py-1">
            还有 {ctx.nodes.length - 30} 个节点
          </p>
        )}
      </div>

      {/* 上下章快捷切换 */}
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-ink-100 dark:border-ink-700">
        <button
          onClick={ctx.prev}
          disabled={!ctx.hasPrev}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-ink-100 dark:bg-ink-700 text-[11px] font-bold text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-600 disabled:opacity-30 transition-colors"
        >
          上一章
        </button>
        {ctx.type === 'trail' && (
          <button
            onClick={() => ctx.advance().then(() => ctx.next())}
            disabled={!ctx.hasNext}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-500 text-white text-[11px] font-bold hover:bg-accent-600 disabled:opacity-40 transition-colors"
            title="完成本节点并继续"
          >
            <Play size={10} /> 完成
          </button>
        )}
        <button
          onClick={ctx.next}
          disabled={!ctx.hasNext}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-ink-100 dark:bg-ink-700 text-[11px] font-bold text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-600 disabled:opacity-30 transition-colors"
        >
          下一章
        </button>
      </div>

      {/* path 与 trail 的差异说明 */}
      {ctx.type === 'path' && (
        <p className="text-[10px] text-ink-400 dark:text-ink-500 mt-2 leading-relaxed">
          阅读路径为导览型，可按顺序阅读但不记录进度。如需记录阅读进度，请
          <Link to={ctx.exitPath ?? '#'} className="text-accent-500 hover:underline mx-0.5">
            从路径详情页「开始阅读」
          </Link>
          生成阅读轨迹。
        </p>
      )}
    </SectionCard>
  );
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

function SectionCard({ title, icon, children, empty, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; empty?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-ink-50/50 dark:bg-ink-700/30 rounded-xl p-3 space-y-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 text-xs font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider"
      >
        {icon}
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (children || (
        <p className="text-xs text-ink-400 dark:text-ink-500 text-center py-2">{empty || '暂无数据'}</p>
      ))}
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

function CharacterItem({ character }: { character: Character }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // 点击角色：按名称查百科，命中跳详情页，否则提示
  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const results = await wikiService.lookup(character.name, 1);
      if (results.length > 0) {
        navigate(`/wiki/${results[0].id}`);
      } else {
        addToast('info', `暂无「${character.name}」的百科词条`);
      }
    } catch {
      addToast('error', '查询百科失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700/50 transition-colors text-left disabled:opacity-60">
      <div className="w-6 h-6 rounded-full bg-accent-100 dark:bg-accent-800/30 flex items-center justify-center shrink-0">
        {loading ? (
          <Loader2 size={12} className="text-accent-500 animate-spin" />
        ) : (
          <User size={12} className="text-accent-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink-700 dark:text-ink-300 truncate">{character.name}</p>
        <p className="text-[10px] text-ink-400 capitalize">{character.role}</p>
      </div>
    </button>
  );
}

const ContentPanelContent: React.FC<ContextPanelContentProps> = ({ storyId, chapterId, branchId, chapters, branches: propBranches, spinoffs: propSpinoffs, readingCtx, onAddToBooklist }) => {
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
      {/* 阅读上下文感知区：书单 / 路径 / 轨迹来源时显示节点序列与进度 */}
      <ReadingContextSection chapterId={chapterId} ctx={readingCtx} />
      {chapters && chapters.length > 0 && (
        <SectionCard title="章节导航" icon={<BookOpen size={12} />}>
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
            <CharacterItem key={c.id} character={c} />
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
