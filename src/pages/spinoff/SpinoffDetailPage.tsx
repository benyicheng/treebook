import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { spinoffService, Spinoff } from '../../api/storyService';
import { ArrowLeft, BookOpen, Star } from 'lucide-react';

const SpinoffDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [spinoff, setSpinoff] = useState<Spinoff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await spinoffService.getById(id);
        setSpinoff(data);
      } catch (e: any) {
        setError(e.response?.data?.message || e.message || '加载失败');
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !spinoff) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">番外短篇</div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">内容加载失败</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{error || '未找到该番外'}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
            >
              返回
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-xl border border-gray-100 dark:border-gray-800 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={16} />
          返回番外列表
        </button>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-black rounded-full uppercase tracking-wider">番外短篇</span>
            {spinoff.isOfficial && (
              <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-black rounded-full uppercase tracking-wider">
                官方认证
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            {spinoff.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 font-bold">
            <span className="inline-flex items-center gap-2">
              <Star size={16} className="text-amber-400 fill-amber-400" />
              原著：{spinoff.originalStory?.title || '未知'}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>作者：{spinoff.author?.username || '未知作者'}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>{new Date(spinoff.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
          <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-200 leading-relaxed text-lg font-light">
            {spinoff.content || ''}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => navigate('/spinoff')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
        >
          <BookOpen size={18} />
          浏览更多番外
        </button>
      </div>
    </div>
  );
};

export default SpinoffDetailPage;

