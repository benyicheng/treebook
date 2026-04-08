import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GitBranch, ShieldCheck, Sparkles, ArrowRight, PlusCircle } from 'lucide-react';

interface StoryOverviewProps {
  currentStory: any;
  isAuthenticated: boolean;
  setActiveTab: (tab: any) => void;
  handleCreateSpinoff: (branchId?: string) => void;
}

const StoryOverview: React.FC<StoryOverviewProps> = ({
  currentStory,
  isAuthenticated,
  setActiveTab,
  handleCreateSpinoff,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
            故事简介
          </h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap font-light">
            {currentStory.description || '暂无描述'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black flex items-center gap-2">
              <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
              最新章节
            </h3>
            <button onClick={() => setActiveTab('chapters')} className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
              查看全部
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(currentStory.chapters || []).slice(-6).reverse().map((chapter: any, index: number) => (
              <Link 
                key={chapter.id} 
                to={`/read/${chapter.id}`}
                className={`flex flex-col p-5 rounded-2xl transition-all border group ${
                  index === 0 
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/40 ring-1 ring-blue-500/10' 
                    : 'bg-gray-50 dark:bg-gray-900/50 border-transparent hover:border-blue-200 dark:hover:border-blue-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black border transition-colors ${
                      index === 0
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                        : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 group-hover:border-blue-200 group-hover:text-blue-600'
                    }`}>
                      {chapter.orderIndex}
                    </span>
                    {index === 0 && (
                      <div className="flex flex-col">
                        <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase tracking-tight w-fit">NEW</span>
                        <span className="text-[10px] text-blue-600 font-bold mt-0.5">最新更新</span>
                      </div>
                    )}
                  </div>
                  <BookOpen size={18} className={index === 0 ? 'text-blue-600' : 'text-gray-300 group-hover:text-blue-500'} />
                </div>
                <h4 className="font-black text-gray-900 dark:text-white text-lg group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
                  {chapter.title}
                </h4>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <Sparkles size={12} className="text-amber-400" />
                    <span>约 {((chapter.content || '').length / 2).toFixed(0)} 字</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{new Date(chapter.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
            {(currentStory.chapters || []).length === 0 && (
              <div className="col-span-full py-16 text-center bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4 opacity-50" />
                <p className="text-gray-400 font-black text-lg">开启宇宙的第一章吧</p>
                <p className="text-gray-400 text-sm mt-1">目前还没有任何章节内容</p>
              </div>
            )}
          </div>
        </div>

        {/* 平行宇宙分支列表 */}
        {(currentStory.branches || []).length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black flex items-center gap-2">
                <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                平行宇宙
                <span className="ml-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-black rounded-full">
                  {(currentStory.branches || []).length}
                </span>
              </h3>
              <button
                onClick={() => setActiveTab('tree')}
                className="text-purple-600 font-bold text-sm hover:underline"
              >
                查看宇宙树
              </button>
            </div>
            <div className="space-y-3">
              {(currentStory.branches || []).slice(0, 5).map((branch: any) => (
                <Link
                  key={branch.id}
                  to={`/branch/${branch.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/10 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all group"
                >
                  <div className={`p-2 rounded-xl shrink-0 ${branch.isOfficial ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'}`}>
                    {branch.isOfficial ? <ShieldCheck size={16} /> : <GitBranch size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors text-sm line-clamp-1">{branch.title}</h4>
                      {branch.isOfficial && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full uppercase shrink-0">官方</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {branch.parentChapter && (
                        <span>从第 {branch.parentChapter.orderIndex} 章分歧</span>
                      )}
                      {branch.parentChapter && branch._count && (
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      )}
                      {branch._count !== undefined && (
                        <span>{branch._count.chapters} 章</span>
                      )}
                      {branch.author && (
                        <>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span>{branch.author.username}</span>
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
                        className="p-2 text-gray-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all"
                      >
                        <Sparkles size={16} />
                      </button>
                    )}
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-purple-500 transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
              {(currentStory.branches || []).length > 5 && (
                <button
                  onClick={() => setActiveTab('tree')}
                  className="w-full py-3 text-sm font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-2xl transition-all"
                >
                  查看全部 {(currentStory.branches || []).length} 个平行宇宙 →
                </button>
              )}
            </div>
          </div>
        )}

        {/* 番外作品展示 */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
              番外作品
              {(currentStory.spinoffs || []).length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-black rounded-full">
                  {(currentStory.spinoffs || []).length}
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
          {(currentStory.spinoffs || []).length > 0 ? (
            <div className="space-y-3">
              {(currentStory.spinoffs || []).slice(0, 5).map((spinoff: any) => (
                <Link
                  key={spinoff.id}
                  to={`/spinoff/${spinoff.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/10 border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all group"
                >
                  <div className={`p-2 rounded-xl shrink-0 ${spinoff.isOfficial ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    {spinoff.isOfficial ? <ShieldCheck size={18} /> : <Sparkles size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors text-sm line-clamp-1">{spinoff.title}</h4>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${
                        spinoff.type === 'biography' ? 'bg-blue-100 text-blue-600' :
                        spinoff.type === 'world_expansion' ? 'bg-purple-100 text-purple-600' :
                        'bg-indigo-100 text-indigo-600'
                      }`}>
                        {spinoff.type === 'biography' ? '传记' : spinoff.type === 'world_expansion' ? '设定' : '平行线'}
                      </span>
                      {spinoff.isOfficial && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full uppercase shrink-0">官方认证</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{spinoff.author?.username}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>{new Date(spinoff.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Sparkles size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">暂无番外作品</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl text-white">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2">
            <GitBranch size={24} />
            参与创作
          </h3>
          <p className="text-blue-100 mb-8 font-light leading-relaxed">
            觉得故事结局不尽如人意？在任何章节创建你的平行宇宙分支，开启全新的故事线。
          </p>
          <button 
            onClick={() => setActiveTab('tree')}
            className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black hover:bg-blue-50 transition-all shadow-lg active:scale-95"
          >
            开启新分支
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-black mb-6">故事统计</h3>
          <div className="space-y-6">
            {[
              { label: '总阅读量', value: '12,504', color: 'text-blue-500' },
              { label: '活跃分支', value: currentStory.branches.length, color: 'text-purple-500' },
              { label: '收藏人数', value: '892', color: 'text-amber-500' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 font-medium">{stat.label}</span>
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
