import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, GitBranch, ShieldCheck, Sparkles, ArrowRight, PlusCircle, XCircle } from 'lucide-react';
import HotPathsSidebar from './HotPathsSidebar';
import { FollowButton } from '../../../components/Interaction';

interface StoryOverviewProps {
  currentStory: any;
  isAuthenticated: boolean;
  setActiveTab: (tab: any) => void;
  handleCreateSpinoff: (branchId?: string) => void;
  setIsBranchModalOpen?: (open: boolean) => void;
  storyId?: string;
  selectedChapterId?: string | null;
  onSelectChapter?: (chapterId: string | null) => void;
}

const StoryOverview: React.FC<StoryOverviewProps> = ({
  currentStory,
  isAuthenticated,
  setActiveTab,
  handleCreateSpinoff,
  setIsBranchModalOpen,
  storyId,
  selectedChapterId,
  onSelectChapter,
}) => {
  const navigate = useNavigate();

  // ─── Filtered data based on selected chapter ───
  const selectedChapter = useMemo(() => {
    if (!selectedChapterId) return null;
    return (currentStory.chapters || []).find((c: any) => c.id === selectedChapterId) || null;
  }, [selectedChapterId, currentStory.chapters]);

  const filteredBranches = useMemo(() => {
    if (!selectedChapterId) return currentStory.branches || [];
    return (currentStory.branches || []).filter((b: any) => b.parentChapterId === selectedChapterId);
  }, [selectedChapterId, currentStory.branches]);

  const filteredSpinoffs = useMemo(() => {
    if (!selectedChapterId) return currentStory.spinoffs || [];
    const branchIds = new Set(
      (currentStory.branches || [])
        .filter((b: any) => b.parentChapterId === selectedChapterId)
        .map((b: any) => b.id)
    );
    // Show spinoffs linked directly to this chapter OR via its branches
    return (currentStory.spinoffs || []).filter(
      (s: any) => s.originalChapterId === selectedChapterId || branchIds.has(s.originalBranchId)
    );
  }, [selectedChapterId, currentStory.branches, currentStory.spinoffs]);

  const handleChapterClick = (chapterId: string) => {
    if (!onSelectChapter) return;
    if (selectedChapterId === chapterId) {
      onSelectChapter(null); // deselect
    } else {
      onSelectChapter(chapterId); // select
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white dark:bg-ink-700 p-8 rounded-3xl shadow-sm border border-ink-100 dark:border-ink-600">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-accent-500 rounded-full"></span>
            故事简介
          </h3>
          <p className="text-ink-500 dark:text-ink-300 leading-relaxed text-lg whitespace-pre-wrap font-light">
            {currentStory.description || '暂无描述'}
          </p>
        </div>

        <div className="bg-white dark:bg-ink-700 p-8 rounded-3xl shadow-sm border border-ink-100 dark:border-ink-600">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black flex items-center gap-2">
              <span className="w-1.5 h-6 bg-accent-500 rounded-full"></span>
              {selectedChapter ? `第${selectedChapter.orderIndex}章 ${selectedChapter.title}` : '最新章节'}
            </h3>
            <div className="flex items-center gap-2">
              {selectedChapterId && (
                <button 
                  onClick={() => onSelectChapter?.(null)}
                  className="text-ink-400 hover:text-accent-500 font-bold text-sm hover:underline flex items-center gap-1 mr-2"
                >
                  <XCircle size={14} />
                  显示全部
                </button>
              )}
              <button onClick={() => setActiveTab('chapters')} className="text-accent-500 font-bold text-sm hover:underline flex items-center gap-1">
                查看全部
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(selectedChapterId ? (currentStory.chapters || []).filter((c: any) => c.id === selectedChapterId) : (currentStory.chapters || []).slice(-6).reverse()).map((chapter: any, index: number) => {
              const isSelected = selectedChapterId === chapter.id;
              return (
                <div
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter.id)}
                  className={`flex flex-col p-5 rounded-2xl transition-all border group cursor-pointer ${
                    isSelected
                      ? 'bg-accent-50 dark:bg-accent-500/10 border-accent-400 dark:border-accent-500 ring-2 ring-accent-400/30' 
                      : index === 0 && !selectedChapterId
                        ? 'bg-accent-50/50 dark:bg-accent-500/5 border-accent-200 dark:border-accent-600/40 ring-1 ring-accent-400/10' 
                        : 'bg-ink-50 dark:bg-ink-800/50 border-transparent hover:border-accent-200 dark:hover:border-accent-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black border transition-colors ${
                        isSelected
                          ? 'bg-accent-500 text-white border-accent-400 shadow-lg shadow-accent-400/20'
                          : index === 0 && !selectedChapterId
                            ? 'bg-accent-500 text-white border-accent-400 shadow-lg shadow-accent-400/20'
                            : 'bg-white dark:bg-ink-700 text-ink-400 border-ink-100 dark:border-ink-600 group-hover:border-accent-200 group-hover:text-accent-500'
                      }`}>
                        {chapter.orderIndex}
                      </span>
                      {index === 0 && !selectedChapterId && (
                        <div className="flex flex-col">
                          <span className="px-1.5 py-0.5 bg-accent-500 text-white text-[9px] font-black rounded uppercase tracking-tight w-fit">NEW</span>
                          <span className="text-[10px] text-accent-500 font-bold mt-0.5">最新更新</span>
                        </div>
                      )}
                      {isSelected && (
                        <div className="flex flex-col">
                          <span className="px-1.5 py-0.5 bg-accent-500 text-white text-[9px] font-black rounded uppercase tracking-tight w-fit">已选</span>
                          <span className="text-[10px] text-accent-500 font-bold mt-0.5">查看分支和番外</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/read/${chapter.id}`);
                      }}
                      className={`p-2 rounded-xl transition-all ${
                        isSelected
                          ? 'text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-500/20'
                          : 'text-ink-300 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10'
                      }`}
                      title="阅读章节"
                    >
                      <BookOpen size={18} />
                    </button>
                  </div>
                  <h4 className="font-black text-ink-800 dark:text-white text-lg group-hover:text-accent-500 transition-colors mb-2 line-clamp-1">
                    {chapter.title}
                  </h4>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-ink-100 dark:border-ink-600/50">
                    <div className="flex items-center gap-2 text-xs text-ink-400 font-medium">
                      <Sparkles size={12} className="text-amber-400" />
                      <span>约 {((chapter.content || '').length / 2).toFixed(0)} 字</span>
                    </div>
                    <span className="text-[10px] text-ink-400 font-bold bg-ink-100 dark:bg-ink-700 px-2 py-1 rounded-md">{new Date(chapter.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
            {(currentStory.chapters || []).length === 0 && (
              <div className="col-span-full py-16 text-center bg-ink-50 dark:bg-ink-800/50 rounded-3xl border-2 border-dashed border-ink-200 dark:border-ink-600">
                <BookOpen size={48} className="mx-auto text-ink-300 mb-4 opacity-50" />
                <p className="text-ink-400 font-black text-lg">开启宇宙的第一章吧</p>
                <p className="text-ink-400 text-sm mt-1">目前还没有任何章节内容</p>
              </div>
            )}
          </div>
        </div>

        {/* 平行宇宙分支列表 */}
        {filteredBranches.length > 0 && (
          <div className="bg-white dark:bg-ink-700 p-8 rounded-3xl shadow-sm border border-ink-100 dark:border-ink-600">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black flex items-center gap-2">
                <span className="w-1.5 h-6 bg-accent-500 rounded-full"></span>
                {selectedChapter ? `第${selectedChapter.orderIndex}章 的平行宇宙` : '平行宇宙'}
                <span className="ml-1 px-2 py-0.5 bg-accent-100 dark:bg-purple-900/30 text-accent-500 dark:text-purple-400 text-xs font-black rounded-full">
                  {filteredBranches.length}
                </span>
              </h3>
              <button
                onClick={() => setActiveTab('tree')}
                className="text-accent-500 font-bold text-sm hover:underline"
              >
                查看宇宙树
              </button>
            </div>
            <div className="space-y-3">
              {filteredBranches.slice(0, 5).map((branch: any) => (
                <Link
                  key={branch.id}
                  to={`/branch/${branch.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-ink-50 dark:bg-ink-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/10 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all group"
                >
                  <div className={`p-2 rounded-xl shrink-0 ${branch.isOfficial ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-accent-100 dark:bg-purple-900/30 text-accent-500'}`}>
                    {branch.isOfficial ? <ShieldCheck size={16} /> : <GitBranch size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-ink-800 dark:text-white group-hover:text-accent-500 transition-colors text-sm line-clamp-1">{branch.title}</h4>
                      {branch.isOfficial && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full uppercase shrink-0">官方</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-400">
                      {branch.parentChapter && (
                        <span>从第 {branch.parentChapter.orderIndex} 章分歧</span>
                      )}
                      {branch.parentChapter && branch._count && (
                        <span className="w-1 h-1 bg-ink-300 rounded-full"></span>
                      )}
                      {branch._count !== undefined && (
                        <span>{branch._count.chapters} 章</span>
                      )}
                      {branch.author && (
                        <>
                          <span className="w-1 h-1 bg-ink-300 rounded-full"></span>
                          <span>{branch.author.username}</span>
                          <FollowButton targetUserId={branch.author.id} size="sm" />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isAuthenticated && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCreateSpinoff(branch.id);
                        }}
                        title="基于此分支创作番外"
                        className="p-2 text-ink-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all"
                      >
                        <Sparkles size={16} />
                      </button>
                    )}
                    <ArrowRight size={16} className="text-ink-300 group-hover:text-purple-500 transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
              {filteredBranches.length > 5 && (
                <button
                  onClick={() => setActiveTab('tree')}
                  className="w-full py-3 text-sm font-bold text-accent-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-2xl transition-all"
                >
                  查看全部 {filteredBranches.length} 个平行宇宙 →
                </button>
              )}
            </div>
          </div>
        )}

        {/* 番外作品展示 */}
        <div className="bg-white dark:bg-ink-700 p-8 rounded-3xl shadow-sm border border-ink-100 dark:border-ink-600">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
              {selectedChapter ? `第${selectedChapter.orderIndex}章 相关番外` : '番外作品'}
              {filteredSpinoffs.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-black rounded-full">
                  {filteredSpinoffs.length}
                </span>
              )}
            </h3>
            {isAuthenticated && (
              <button
                onClick={() => handleCreateSpinoff()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-all"
              >
                <PlusCircle size={16} />
                发布番外
              </button>
            )}
          </div>
          {filteredSpinoffs.length > 0 ? (
            <div className="space-y-3">
              {filteredSpinoffs.slice(0, 5).map((spinoff: any) => (
                <Link
                  key={spinoff.id}
                  to={`/spinoff/${spinoff.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-ink-50 dark:bg-ink-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/10 border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all group"
                >
                  <div className={`p-2 rounded-xl shrink-0 ${spinoff.isOfficial ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-ink-100 dark:bg-ink-700 text-ink-400'}`}>
                    {spinoff.isOfficial ? <ShieldCheck size={18} /> : <Sparkles size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-ink-800 dark:text-white group-hover:text-amber-600 transition-colors text-sm line-clamp-1">{spinoff.title}</h4>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${
                        spinoff.type === 'biography' ? 'bg-accent-100 text-accent-500' :
                        spinoff.type === 'world_expansion' ? 'bg-accent-100 text-accent-500' :
                        'bg-indigo-100 text-accent-600'
                      }`}>
                        {spinoff.type === 'biography' ? '传记' : spinoff.type === 'world_expansion' ? '设定' : '平行线'}
                      </span>
                      {spinoff.isOfficial && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full uppercase shrink-0">官方认证</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-400">
                      <span>{spinoff.author?.username}</span>
                      {spinoff.author?.id && (
                        <FollowButton targetUserId={spinoff.author.id} size="sm" />
                      )}
                      <span className="w-1 h-1 bg-ink-300 rounded-full"></span>
                      <span>{new Date(spinoff.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-ink-300 group-hover:text-amber-500 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Sparkles size={48} className="mx-auto text-ink-300 mb-3" />
              <p className="text-ink-400 text-sm">{selectedChapter ? '该章节还没有相关番外作品' : '暂无番外作品'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-gradient-to-br from-accent-500 to-accent-700 p-8 rounded-3xl shadow-xl text-white">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2">
            <GitBranch size={24} />
            参与创作
          </h3>
          <p className="text-accent-100 mb-8 font-light leading-relaxed">
            觉得故事结局不尽如人意？在任何章节创建你的平行宇宙分支，开启全新的故事线。
          </p>
          <button 
            onClick={() => setIsBranchModalOpen?.(true)}
            className="w-full py-4 bg-ink-50 text-accent-500 rounded-2xl font-black hover:bg-accent-50 transition-all shadow-lg active:scale-95"
          >
            开启新分支
          </button>
        </div>

        {storyId && <HotPathsSidebar storyId={storyId} />}

        <div className="bg-white dark:bg-ink-700 p-8 rounded-3xl shadow-sm border border-ink-100 dark:border-ink-600">
          <h3 className="text-xl font-black mb-6">故事统计</h3>
          <div className="space-y-6">
            {[
              { label: '总阅读量', value: '12,504', color: 'text-accent-400' },
              { label: '活跃分支', value: currentStory.branches.length, color: 'text-purple-500' },
              { label: '收藏人数', value: '892', color: 'text-amber-500' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-ink-500 dark:text-ink-400 font-medium">{stat.label}</span>
                <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryOverview;
