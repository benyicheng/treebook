import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booklistService, Booklist, storyService, Story } from '../../api/storyService';
import { useAuthStore } from '../../stores/useAuthStore';
import { List, PlusCircle, BookOpen, Clock, Layers } from 'lucide-react';
import Modal from '../../components/Modal';

const BooklistPage: React.FC = () => {
  const navigate = useNavigate();
  const [booklists, setBooklists] = useState<Booklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBooklist, setNewBooklist] = useState({
    title: '',
    description: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await booklistService.getAll();
      setBooklists(data);
    } catch (err) {
      console.error('Failed to fetch booklists');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBooklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await booklistService.create(newBooklist);
      setIsModalOpen(false);
      setNewBooklist({ title: '', description: '' });
      fetchData();
    } catch (err) {
      alert('创建书单失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">精选书单</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-lg font-light">
            社区成员精心编排的阅读路线，像导游一样带你领略平行宇宙的风景。
          </p>
        </div>
        {isAuthenticated && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
          >
            <PlusCircle size={20} />
            创建书单
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {booklists.map((booklist) => (
            <div key={booklist.id} className="group bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <List size={24} />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <Clock size={14} />
                  <span>{new Date(booklist.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  {booklist.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  {booklist.description || '暂无描述'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <Layers size={16} />
                    <span>{booklist.items?.length || 0} 个章节</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <BookOpen size={16} />
                    <span>by {booklist.creator?.username}</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/booklist/${booklist.id}`)}
                  className="px-6 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md active:scale-95"
                >
                  查看书单
                </button>
              </div>
            </div>
          ))}

          {booklists.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <List size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium text-lg">暂无书单，快来创建第一个精选路线吧！</p>
            </div>
          )}
        </div>
      )}

      {/* Booklist Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="创建新书单"
      >
        <form onSubmit={handleCreateBooklist} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">书单标题</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="例如：最虐心的平行宇宙合集"
              value={newBooklist.title}
              onChange={e => setNewBooklist(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">书单简介</label>
            <textarea 
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
              placeholder="简述这个书单的主题..."
              value={newBooklist.description}
              onChange={e => setNewBooklist(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '正在创建...' : '确认创建'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default BooklistPage;
