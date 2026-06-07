import React from 'react';
import { Spinoff } from '../../api/storyService';
import { useSpinoffs } from '../../hooks/useSpinoffs';
import { useAuthStore } from '../../stores/useAuthStore';
import { BookOpen, PlusCircle, Star, MessageSquare, Users } from 'lucide-react';
import { Modal } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../../components/ui';
import { ShareButton } from '../../components/Interaction';

const SpinoffPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: spinoffsData, isLoading } = useSpinoffs();
  const spinoffs: Spinoff[] = Array.isArray(spinoffsData) ? spinoffsData : (spinoffsData as any)?.data || [];
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-3xl font-black text-ink-800 dark:text-white tracking-tight">精彩番外</h1>
        {isAuthenticated && (
          <button 
            onClick={() => navigate('/spinoff/create')}
            className="flex items-center gap-2 px-6 py-3 bg-accent-600 text-white rounded-2xl font-bold hover:bg-accent-700 transition-all shadow-lg active:scale-95"
          >
            <PlusCircle size={20} />
            发布番外
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-8 space-y-4">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-20 w-full" />
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
          {spinoffs.map((spinoff) => (
            <div key={spinoff.id} className="group bg-ink-50 dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 p-8 hover:border-indigo-300 dark:hover:border-accent-500 hover:shadow-2xl hover:shadow-accent-500/10 transition-all duration-300 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-accent-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-full">
                    番外短篇
                  </span>
                  {spinoff.isOfficial && (
                    <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider rounded-full">
                      官方认证
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-4 flex-grow">
                <h3 className="text-2xl font-black text-ink-800 dark:text-white group-hover:text-accent-600 transition-colors line-clamp-2 leading-tight">
                  {spinoff.title}
                </h3>
                <div className="flex items-center gap-2 text-xs font-bold text-ink-400">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span>原著：{spinoff.originalStory?.title}</span>
                </div>
                <p className="prose prose-sm dark:prose-invert line-clamp-4 text-ink-500 dark:text-ink-400 font-light leading-relaxed">
                  {spinoff.content.substring(0, 300)}
                </p>

                {/* Referenced Characters */}
                {spinoff.characters && spinoff.characters.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <Users size={12} className="text-ink-300 shrink-0" />
                    <div className="flex -space-x-1.5">
                      {spinoff.characters.slice(0, 4).map(char => (
                        <div
                          key={char.id}
                          className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-2 border-white dark:border-ink-700 flex items-center justify-center text-[9px] font-black text-accent-600 dark:text-indigo-400"
                          title={`${char.name}（${char.role === 'protagonist' ? '主角' : char.role === 'antagonist' ? '反派' : '配角'}）`}
                        >
                          {char.name[0]}
                        </div>
                      ))}
                      {spinoff.characters.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-ink-100 dark:bg-ink-700 border-2 border-white dark:border-ink-700 flex items-center justify-center text-[8px] font-black text-ink-400">
                          +{spinoff.characters.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-ink-50 dark:border-ink-600 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-accent-600 dark:text-indigo-400 font-bold text-xs">
                    {spinoff.author?.username?.[0] || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-600 dark:text-ink-300">{spinoff.author?.username}</p>
                    <p className="text-[10px] text-ink-400">{new Date(spinoff.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ShareButton
                    targetType="spinoff"
                    targetId={spinoff.id}
                    title={spinoff.title}
                    description={spinoff.summary || spinoff.content.substring(0, 100)}
                    size="sm"
                    variant="ghost"
                  />
                  <button onClick={() => navigate(`/spinoff/${spinoff.id}`)} className="p-3 bg-ink-50 dark:bg-ink-800 text-ink-400 hover:text-accent-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
                    <BookOpen size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {spinoffs.length === 0 && (
            <div className="col-span-full py-20 text-center bg-ink-50 dark:bg-ink-800/30 rounded-3xl border-2 border-dashed border-ink-200 dark:border-ink-700">
              <MessageSquare size={48} className="mx-auto text-ink-300 mb-4" />
              <p className="text-ink-500 font-medium text-lg">暂无番外内容，快来创作第一个吧！</p>
            </div>
          )}
        </div>
      )}

      {/* Modal removed - integrated into SpinoffEditorPage */}
    </div>
  );
};

export default SpinoffPage;
