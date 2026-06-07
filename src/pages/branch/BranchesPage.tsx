import React from 'react';
import { Branch } from '../../api/storyService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useBranches } from '../../hooks/useBranches';
import { GitBranch, ShieldCheck, Clock, User, ArrowRight, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '../../components/ui';

const BranchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: branchesData, isLoading } = useBranches();
  const branches: Branch[] = Array.isArray(branchesData) ? branchesData : (branchesData as any)?.data || [];
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-3xl font-black text-ink-800 dark:text-white tracking-tight flex items-center gap-3">
          <GitBranch size={28} className="text-accent-500" />
          活跃分支
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-8 space-y-4">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <div className="flex items-center gap-3 pt-4 border-t border-ink-50 dark:border-ink-600">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2.5 w-14" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {branches.map((branch) => (
            <Link 
              key={branch.id} 
              to={`/branch/${branch.id}`}
              className="group bg-ink-50 dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-8 hover:border-accent-300 dark:hover:border-accent-400 hover:shadow-2xl hover:shadow-accent-400/10 transition-all duration-300 flex flex-col relative overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-50 dark:bg-accent-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 ${
                    branch.isOfficial 
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
                      : 'bg-accent-50 dark:bg-accent-500/15 text-accent-500 dark:text-accent-400'
                  }`}>
                    {branch.isOfficial ? <ShieldCheck size={12} /> : <GitBranch size={12} />}
                    {branch.isOfficial ? '官方认证' : '平行世界'}
                  </span>
                  {branch.status === 'merged' && (
                    <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-wider rounded-full">
                      已并入主线
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-4 flex-grow relative">
                <h3 className="text-2xl font-black text-ink-800 dark:text-white group-hover:text-accent-500 transition-colors line-clamp-2 leading-tight">
                  {branch.title}
                </h3>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-ink-500">
                    <span className="text-ink-400 font-medium">源于：</span>
                    <span className="text-accent-500 hover:underline">{branch.parentStory?.title}</span>
                  </div>
                  {branch.parentChapter && (
                    <div className="text-[11px] text-ink-400 flex items-center gap-1.5">
                      <Clock size={12} />
                      从第 {branch.parentChapter.orderIndex} 章 "{branch.parentChapter.title}" 分叉
                    </div>
                  )}
                </div>

                <p className="text-ink-500 dark:text-ink-400 font-light leading-relaxed line-clamp-3 text-sm">
                  {branch.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-ink-50 dark:border-ink-600 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center text-accent-500 dark:text-accent-400 font-black text-xs">
                    {branch.author?.username?.[0] || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-600 dark:text-ink-300">{branch.author?.username}</p>
                    <p className="text-[10px] text-ink-400 flex items-center gap-1">
                      <MessageSquare size={10} />
                      {branch._count?.chapters || 0} 个章节
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-ink-50 dark:bg-ink-800 text-ink-400 group-hover:text-accent-500 group-hover:bg-accent-50 dark:group-hover:bg-accent-500/10 rounded-xl transition-all">
                  <ArrowRight size={20} />
                </div>
              </div>
            </Link>
          ))}
          
          {branches.length === 0 && (
            <div className="col-span-full py-24 text-center bg-ink-50 dark:bg-ink-800/30 rounded-[3rem] border-2 border-dashed border-ink-200 dark:border-ink-700">
              <GitBranch size={64} className="mx-auto text-ink-200 mb-6" />
              <p className="text-ink-500 font-black text-2xl">宇宙尚未分叉</p>
              <p className="text-ink-400 mt-2">去主线故事中寻找灵感，开启第一个分支吧！</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-8 px-8 py-3 bg-accent-500 text-white rounded-2xl font-bold hover:bg-accent-600 transition-all shadow-xl shadow-accent-400/20"
              >
                探索主线故事
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BranchesPage;
