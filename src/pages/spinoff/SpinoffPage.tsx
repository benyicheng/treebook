import React, { useEffect, useState } from 'react';
import { spinoffService, Spinoff, storyService, Story } from '../../api/storyService';
import { useAuthStore } from '../../stores/useAuthStore';
import { BookOpen, PlusCircle, Star, MessageSquare } from 'lucide-react';
import Modal from '../../components/Modal';
import { useNavigate } from 'react-router-dom';

const SpinoffPage: React.FC = () => {
  const navigate = useNavigate();
  const [spinoffs, setSpinoffs] = useState<Spinoff[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSpinoff, setNewSpinoff] = useState({
    originalStoryId: '',
    title: '',
    content: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [spinoffData, storyData] = await Promise.all([
        spinoffService.getAll(),
        storyService.getAll()
      ]);
      setSpinoffs(spinoffData);
      setStories(storyData);
      if (storyData.length > 0) {
        setNewSpinoff(prev => ({ ...prev, originalStoryId: storyData[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch spinoffs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSpinoff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await spinoffService.create(newSpinoff);
      setIsModalOpen(false);
      setNewSpinoff({ originalStoryId: stories[0]?.id || '', title: '', content: '' });
      fetchData();
    } catch (err) {
      alert('创建番外失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">精彩番外</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-lg font-light">
            基于现有世界观的独立短篇，探索角色的另一面。
          </p>
        </div>
        {isAuthenticated && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
          >
            <PlusCircle size={20} />
            发布番外
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {spinoffs.map((spinoff) => (
            <div key={spinoff.id} className="group bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-full">
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
                <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                  {spinoff.title}
                </h3>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span>原著：{spinoff.originalStory?.title}</span>
                </div>
                <div className="prose prose-sm dark:prose-invert line-clamp-4 text-gray-500 dark:text-gray-400 font-light leading-relaxed" dangerouslySetInnerHTML={{ __html: spinoff.content.substring(0, 300) }} />
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    {spinoff.author?.username?.[0] || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{spinoff.author?.username}</p>
                    <p className="text-[10px] text-gray-400">{new Date(spinoff.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/spinoff/${spinoff.id}`)} className="p-3 bg-gray-50 dark:bg-gray-900 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
                  <BookOpen size={20} />
                </button>
              </div>
            </div>
          ))}
          
          {spinoffs.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium text-lg">暂无番外内容，快来创作第一个吧！</p>
            </div>
          )}
        </div>
      )}

      {/* Spinoff Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="发布新番外"
      >
        <form onSubmit={handleCreateSpinoff} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">关联原著</label>
            <select 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={newSpinoff.originalStoryId}
              onChange={e => setNewSpinoff(prev => ({ ...prev, originalStoryId: e.target.value }))}
            >
              {stories.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">番外标题</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="例如：某个角色的过去..."
              value={newSpinoff.title}
              onChange={e => setNewSpinoff(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">番外内容</label>
            <textarea 
              required
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder="开始你的创作..."
              value={newSpinoff.content}
              onChange={e => setNewSpinoff(prev => ({ ...prev, content: e.target.value }))}
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '发布中...' : '确认发布'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default SpinoffPage;
