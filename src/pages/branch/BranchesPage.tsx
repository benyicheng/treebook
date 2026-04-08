import React, { useEffect, useState } from 'react';
import { branchService, Branch } from '../../api/storyService';
import { useAuthStore } from '../../stores/useAuthStore';
import { GitBranch, ShieldCheck, Clock, User, ArrowRight, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const BranchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const branchData = await branchService.getAll();
      setBranches(Array.isArray(branchData) ? branchData : (branchData as any)?.data || []);
    } catch (err) {
      console.error('Failed to fetch branches', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <GitBranch size={36} className="text-blue-600" />
            活跃分支
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-lg font-light">
            探索无限可能：从任何章节分叉出的平行宇宙故事线。
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {branches.map((branch) => (
            <Link 
              key={branch.id} 
              to={`/branch/${branch.id}`}
              className="group bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col relative overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 ${
                    branch.isOfficial 
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
                      : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
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
                <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                  {branch.title}
                </h3>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <span className="text-gray-400 font-medium">源于：</span>
                    <span className="text-blue-600 hover:underline">{branch.parentStory?.title}</span>
                  </div>
                  {branch.parentChapter && (
                    <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                      <Clock size={12} />
                      从第 {branch.parentChapter.orderIndex} 章 "{branch.parentChapter.title}" 分叉
                    </div>
                  )}
                </div>

                <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed line-clamp-3 text-sm">
                  {branch.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs">
                    {branch.author?.username?.[0] || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{branch.author?.username}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <MessageSquare size={10} />
                      {branch._count?.chapters || 0} 个章节
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 rounded-xl transition-all">
                  <ArrowRight size={20} />
                </div>
              </div>
            </Link>
          ))}
          
          {branches.length === 0 && (
            <div className="col-span-full py-24 text-center bg-gray-50 dark:bg-gray-900/30 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
              <GitBranch size={64} className="mx-auto text-gray-200 mb-6" />
              <p className="text-gray-500 font-black text-2xl">宇宙尚未分叉</p>
              <p className="text-gray-400 mt-2">去主线故事中寻找灵感，开启第一个分支吧！</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
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
