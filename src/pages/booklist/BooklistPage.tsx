import React, { useEffect, useState } from 'react';
import { booklistService, Booklist } from '../../api/storyService';
import { useAuthStore } from '../../stores/useAuthStore';
import { 
  PlusCircle, 
  Filter, 
  Sparkles, 
  Map, 
  Tag
} from 'lucide-react';
import Modal from '../../components/Modal';
import BooklistCard from '../../components/Booklist/BooklistCard';

const BooklistPage: React.FC = () => {
  const [booklists, setBooklists] = useState<Booklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  
  // Filtering & Sorting
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('hot');
  const [selectedTag, setSelectedTag] = useState<string>('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBooklist, setNewBooklist] = useState({
    title: '',
    description: '',
    type: 'COLLECTION',
    tags: '',
    coverImage: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await booklistService.getAll({
        type: filterType === 'ALL' ? undefined : filterType,
        sortBy,
        tag: selectedTag || undefined
      });
      setBooklists(data);
    } catch (err) {
      console.error('Failed to fetch booklists');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType, sortBy, selectedTag]);

  const handleCreateBooklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await booklistService.create(newBooklist);
      setIsModalOpen(false);
      setNewBooklist({ title: '', description: '', type: 'COLLECTION', tags: '', coverImage: '' });
      fetchData();
    } catch (err) {
      alert('创建书单失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/20 to-transparent"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 font-black text-xs uppercase tracking-widest">
            <Sparkles size={14} />
            Multiverse Curation
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
            世界线导览 <br/>
            <span className="text-emerald-400">发现平行宇宙</span>
          </h1>
          <p className="text-slate-400 text-xl font-light leading-relaxed">
            在这里，每一份书单都是一条独特的时空路径。跟随着资深策展人的指引，在无数个“如果”中穿梭，领略时空分叉的魅力。
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            {isAuthenticated && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/40 active:scale-95 group"
              >
                <PlusCircle size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                开启策展计划
              </button>
            )}
            <button className="flex items-center gap-3 px-8 py-4 bg-slate-800 text-slate-300 rounded-2xl font-black text-lg hover:bg-slate-700 transition-all active:scale-95">
              了解策展分成
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm sticky top-20 z-40 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80">
        <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl">
          <button 
            onClick={() => setFilterType('ALL')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              filterType === 'ALL' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            全部路线
          </button>
          <button 
            onClick={() => setFilterType('TIMELINE')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              filterType === 'TIMELINE' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            时空导览 (Timeline)
          </button>
          <button 
            onClick={() => setFilterType('COLLECTION')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              filterType === 'COLLECTION' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            主题合集
          </button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="搜索标签..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
              value={selectedTag}
              onChange={e => setSelectedTag(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl">
            <Filter size={16} className="text-gray-400" />
            <select 
              className="bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="hot">最热门 (Trending)</option>
              <option value="earning">高收益 (Top Paid)</option>
              <option value="newest">最新发布</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {booklists.map((booklist) => (
            <BooklistCard key={booklist.id} booklist={booklist} />
          ))}

          {booklists.length === 0 && (
            <div className="col-span-full py-32 text-center bg-gray-50 dark:bg-gray-900/30 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
              <Map size={64} className="mx-auto text-gray-300 mb-6" />
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">此处时空尚未开辟</h3>
              <p className="text-gray-500 font-medium">暂无符合条件的书单，不如亲自去开辟一条新的阅读路线？</p>
            </div>
          )}
        </div>
      )}

      {/* Booklist Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="开启新的策展计划"
      >
        <form onSubmit={handleCreateBooklist} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">导览标题</label>
            <input 
              type="text" 
              required
              className="w-full px-6 py-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-lg"
              placeholder="例如：末世废土：人类最后的一百种结局"
              value={newBooklist.title}
              onChange={e => setNewBooklist(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">导览类型</label>
              <select 
                className="w-full px-6 py-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                value={newBooklist.type}
                onChange={e => setNewBooklist(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="COLLECTION">普通合集 (Collection)</option>
                <option value="TIMELINE">时空导览 (Timeline)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">标签 (逗号分隔)</label>
              <input 
                type="text" 
                className="w-full px-6 py-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                placeholder="治愈, 虐心..."
                value={newBooklist.tags}
                onChange={e => setNewBooklist(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">导览简介</label>
            <textarea 
              rows={4}
              className="w-full px-6 py-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none font-medium"
              placeholder="为你的路线写一段引人入胜的开场白..."
              value={newBooklist.description}
              onChange={e => setNewBooklist(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">封面图片 URL (可选)</label>
            <input 
              type="text" 
              className="w-full px-6 py-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
              placeholder="https://images.unsplash.com/..."
              value={newBooklist.coverImage}
              onChange={e => setNewBooklist(prev => ({ ...prev, coverImage: e.target.value }))}
            />
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              温馨提示：优质的标题和简介能显著提升引流分润。时空导览建议按故事逻辑顺序排列章节。
            </p>
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '正在开辟时空...' : '立即开启路线'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default BooklistPage;
