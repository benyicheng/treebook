import React, { useState } from 'react';
import { Booklist } from '../../api/storyService';
import { useBooklists, useCreateBooklist } from '../../hooks/useBooklists';
import { useAuthStore } from '../../stores/useAuthStore';
import { 
  PlusCircle, 
  Filter, 
  Sparkles, 
  Map, 
  Tag,
  Layers,
  ArrowRight,
  Check,
  LayoutList
} from 'lucide-react';
import { Modal } from '../../components/ui';
import { useToast } from '../../components/notifications';
import BooklistCard from '../../components/Booklist/BooklistCard';

const BooklistPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  
  // Filtering & Sorting
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('hot');
  const [selectedTag, setSelectedTag] = useState<string>('');
  
  const { data: booklists = [], isLoading } = useBooklists({
    type: filterType === 'ALL' ? undefined : filterType,
    sortBy,
    tag: selectedTag || undefined,
  });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBooklist, setNewBooklist] = useState<{
    title: string;
    description: string;
    type: 'TIMELINE' | 'COLLECTION';
    tags: string;
    coverImage: string;
  }>({
    title: '',
    description: '',
    type: 'COLLECTION',
    tags: '',
    coverImage: ''
  });

  const createBooklistMutation = useCreateBooklist();

  const handleCreateBooklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createBooklistMutation.mutateAsync(newBooklist);
      setIsModalOpen(false);
      setNewBooklist({ title: '', description: '', type: 'COLLECTION', tags: '', coverImage: '' });
    } catch (err) {
      addToast('error', '创建书单失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-ink-800 dark:text-white tracking-tight flex items-center gap-2">
          <Sparkles size={24} className="text-accent-500" />
          世界线导览
        </h1>
        {isAuthenticated && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-500 text-white rounded-xl font-bold text-sm hover:bg-accent-600 transition-all shadow-lg active:scale-95"
          >
            <PlusCircle size={18} />
            开启策展计划
          </button>
        )}
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-ink-50 dark:bg-ink-700 p-4 rounded-3xl border border-ink-100 dark:border-ink-600 shadow-sm sticky top-20 z-40 backdrop-blur-xl bg-white/80 dark:bg-ink-700/80">
        <div className="flex p-1 bg-ink-100 dark:bg-ink-800 rounded-2xl">
          <button 
            onClick={() => setFilterType('ALL')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              filterType === 'ALL' ? 'bg-white dark:bg-ink-700 text-accent-500 shadow-sm' : 'text-ink-500 hover:text-ink-600'
            }`}
          >
            全部路线
          </button>
          <button 
            onClick={() => setFilterType('TIMELINE')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              filterType === 'TIMELINE' ? 'bg-white dark:bg-ink-700 text-accent-500 shadow-sm' : 'text-ink-500 hover:text-ink-600'
            }`}
          >
            时空导览 (Timeline)
          </button>
          <button 
            onClick={() => setFilterType('COLLECTION')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              filterType === 'COLLECTION' ? 'bg-white dark:bg-ink-700 text-accent-500 shadow-sm' : 'text-ink-500 hover:text-ink-600'
            }`}
          >
            主题合集
          </button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input 
              type="text"
              placeholder="搜索标签..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-accent-400 outline-none transition-all text-sm font-medium"
              value={selectedTag}
              onChange={e => setSelectedTag(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-600 rounded-xl">
            <Filter size={16} className="text-ink-400" />
            <select 
              className="bg-transparent text-sm font-bold text-ink-600 dark:text-ink-300 outline-none cursor-pointer"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {booklists.map((booklist: Booklist) => (
            <BooklistCard key={booklist.id} booklist={booklist} />
          ))}

          {booklists.length === 0 && (
            <div className="col-span-full py-32 text-center bg-ink-50 dark:bg-ink-800/30 rounded-[3rem] border-2 border-dashed border-ink-200 dark:border-ink-700">
              <Map size={64} className="mx-auto text-ink-300 mb-6" />
              <h3 className="text-2xl font-black text-ink-800 dark:text-white mb-2">此处时空尚未开辟</h3>
              <p className="text-ink-500 font-medium">暂无符合条件的书单，不如亲自去开辟一条新的阅读路线？</p>
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
            <label className="text-sm font-bold text-ink-500">导览标题</label>
            <input 
              type="text" 
              required
              className="w-full px-6 py-4 rounded-2xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-accent-400 outline-none transition-all font-bold text-lg"
              placeholder="例如：末世废土：人类最后的一百种结局"
              value={newBooklist.title}
              onChange={e => setNewBooklist(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          {/* C4: 可视化类型选择卡片 */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-ink-500">导览类型</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNewBooklist(prev => ({ ...prev, type: 'TIMELINE' }))}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                  newBooklist.type === 'TIMELINE'
                    ? 'border-accent-400 bg-accent-50 dark:bg-accent-500/10 shadow-lg shadow-accent-400/10'
                    : 'border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 hover:border-emerald-200 dark:hover:border-accent-600'
                }`}
              >
                {newBooklist.type === 'TIMELINE' && (
                  <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-accent-400 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    newBooklist.type === 'TIMELINE'
                      ? 'bg-accent-400 text-white'
                      : 'bg-ink-200 dark:bg-ink-600 text-ink-500'
                  }`}>
                    <Map size={20} />
                  </div>
                  <div>
                    <div className={`font-black text-sm ${
                      newBooklist.type === 'TIMELINE' ? 'text-accent-600 dark:text-accent-400' : 'text-ink-600 dark:text-ink-300'
                    }`}>
                      时空导览
                    </div>
                    <div className="text-[10px] text-ink-400 font-medium">Timeline</div>
                  </div>
                </div>
                <p className="text-xs text-ink-500 leading-relaxed">
                  按时间/逻辑顺序排列章节，带领读者沿指定路线穿越平行宇宙。
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-ink-400">
                  <ArrowRight size={11} />
                  <span>适合：推荐阅读路线、系列导读</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNewBooklist(prev => ({ ...prev, type: 'COLLECTION' }))}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                  newBooklist.type === 'COLLECTION'
                    ? 'border-accent-400 bg-accent-50 dark:bg-accent-500/10 shadow-lg shadow-accent-400/10'
                    : 'border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 hover:border-emerald-200 dark:hover:border-accent-600'
                }`}
              >
                {newBooklist.type === 'COLLECTION' && (
                  <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-accent-400 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    newBooklist.type === 'COLLECTION'
                      ? 'bg-accent-400 text-white'
                      : 'bg-ink-200 dark:bg-ink-600 text-ink-500'
                  }`}>
                    <Layers size={20} />
                  </div>
                  <div>
                    <div className={`font-black text-sm ${
                      newBooklist.type === 'COLLECTION' ? 'text-accent-600 dark:text-accent-400' : 'text-ink-600 dark:text-ink-300'
                    }`}>
                      主题合集
                    </div>
                    <div className="text-[10px] text-ink-400 font-medium">Collection</div>
                  </div>
                </div>
                <p className="text-xs text-ink-500 leading-relaxed">
                  自由收藏精选章节，按主题聚合，读者可按任意顺序浏览。
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-ink-400">
                  <LayoutList size={11} />
                  <span>适合：主题精选、角色聚焦、风格合集</span>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">标签 (逗号分隔)</label>
            <input 
              type="text" 
              className="w-full px-6 py-4 rounded-2xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-accent-400 outline-none transition-all font-bold"
              placeholder="治愈, 虐心..."
              value={newBooklist.tags}
              onChange={e => setNewBooklist(prev => ({ ...prev, tags: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">导览简介</label>
            <textarea 
              rows={4}
              className="w-full px-6 py-4 rounded-2xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-accent-400 outline-none transition-all resize-none font-medium"
              placeholder="为你的路线写一段引人入胜的开场白..."
              value={newBooklist.description}
              onChange={e => setNewBooklist(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">封面图片 URL (可选)</label>
            <input 
              type="text" 
              className="w-full px-6 py-4 rounded-2xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-accent-400 outline-none transition-all font-medium"
              placeholder="https://images.unsplash.com/..."
              value={newBooklist.coverImage}
              onChange={e => setNewBooklist(prev => ({ ...prev, coverImage: e.target.value }))}
            />
          </div>
          <div className="p-4 bg-accent-50 dark:bg-accent-500/5 rounded-2xl border border-accent-100 dark:border-accent-600/30">
            <div className="flex items-start gap-3">
              <Sparkles size={16} className="text-accent-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-accent-600 dark:text-accent-400 font-semibold mb-1">
                  创作建议
                </p>
                <p className="text-xs text-accent-500 dark:text-accent-400 leading-relaxed">
                  {newBooklist.type === 'TIMELINE'
                    ? '时空导览适合按故事发展顺序呈现章节，建议从第一章开始依次添加，保持逻辑连贯性。读者会按你设定的顺序逐站阅读。'
                    : '主题合集没有固定的阅读顺序，可以自由搭配不同故事中主题相似的章节。建议精选 5-10 个最具代表性的章节。'}
                </p>
              </div>
            </div>
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-accent-500 text-white rounded-[2rem] font-black text-xl hover:bg-accent-600 transition-all shadow-xl shadow-accent-400/20 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '正在开辟时空...' : '立即开启路线'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default BooklistPage;
