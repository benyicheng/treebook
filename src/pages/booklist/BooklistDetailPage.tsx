import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booklistService, storyService, Booklist, Chapter, Story } from '../../api/storyService';
import { useAuthStore } from '../../stores/useAuthStore';
import Modal from '../../components/Modal';
import { 
  ArrowLeft, 
  CheckCircle2,
  Play, 
  ArrowUp,
  ArrowDown,
  Heart,
  Share2,
  Eye,
  Edit3,
  Trash2,
  Plus,
  X,
  AlertCircle,
  Search,
  Check,
  Copy,
  Twitter,
  Facebook,
  MessageCircle,
  Link2
} from 'lucide-react';
import { interactionService, InteractionStats } from '../../api/interactionService';
import BooklistHeader from './components/BooklistHeader';
import BooklistTimeline from './components/BooklistTimeline';
import ReadingDrawer from './components/ReadingDrawer';
import { useBooklistProgress } from '../../hooks/useBooklistProgress';

const BooklistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [booklist, setBooklist] = useState<(Booklist & { creator: any, items: any[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<InteractionStats | null>(null);
  
  // 编辑模式状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<{
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
  
  // 编辑项目状态
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemNotes, setItemNotes] = useState('');

  // 添加章节状态
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 阅读抽屉状态
  const [isReadingDrawerOpen, setIsReadingDrawerOpen] = useState(false);
  const [drawerStartIndex, setDrawerStartIndex] = useState(0);

  // 阅读进度追踪
  const {
    isCompleted,
    continueReading,
    setCurrentItem,
    markCompleted,
    completionPercentage,
    completedCount,
    totalItems,
  } = useBooklistProgress({
    booklistId: id || '',
    totalItems: booklist?.items?.length || 0,
  });

  useEffect(() => {
    if (id) {
      fetchBooklist(id);
      fetchStats(id);
    }
  }, [id]);

  const fetchBooklist = async (listId: string) => {
    setIsLoading(true);
    try {
      const data = await booklistService.getById(listId);
      setBooklist(data);
      setEditForm({ 
        title: data.title, 
        description: data.description || '',
        type: data.type || 'COLLECTION',
        tags: data.tags || '',
        coverImage: data.coverImage || ''
      });
    } catch (err) {
      console.error('Failed to fetch booklist');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async (listId: string) => {
    try {
      const data = await interactionService.getStats('booklist', listId);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  // 处理点赞
  const handleToggleLike = async () => {
    if (!id || !user) {
      alert('请先登录后再点赞');
      return;
    }
    
    try {
      const res = await interactionService.toggleLike('booklist', id);
      setStats(prev => prev ? {
        ...prev,
        liked: res.liked,
        likeCount: res.likeCount
      } : {
        liked: res.liked,
        likeCount: res.likeCount,
        targetType: 'booklist',
        targetId: id,
        shareCount: 0,
        viewCount: 0,
        ratingCount: 0,
        ratingAvg: 0,
        ratingDist: {},
        myRating: null,
        myReasonTags: []
      } as any);
    } catch (err) {
      console.error('Like failed');
    }
  };

  // 处理分享
  const handleShare = async (platform: 'copy' | 'twitter' | 'facebook' | 'wechat') => {
    if (!id || !booklist) return;
    
    const config = interactionService.generateShareConfig(
      platform as any,
      'booklist',
      id,
      booklist.title,
      booklist.description || ''
    );
    
    const success = await interactionService.executeShare(config);
    if (success) {
      if (platform === 'copy') {
        alert('链接已成功复制到剪贴板！');
      }
      // 记录分享
      try {
        const res = await interactionService.recordShare('booklist', id, platform as any);
        setStats(prev => prev ? { ...prev, shareCount: res.shareCount } : {
          shareCount: res.shareCount,
          liked: false,
          likeCount: 0,
          targetType: 'booklist',
          targetId: id,
          viewCount: 0,
          ratingCount: 0,
          ratingAvg: 0,
          ratingDist: {},
          myRating: null,
          myReasonTags: []
        } as any);
      } catch (err) {
        console.error('Record share failed');
      }
      setIsShareModalOpen(false);
    } else {
      alert('分享失败，请重试');
    }
  };
  
  // 检查当前用户是否是创建者
  const isCreator = user && booklist && user.id === booklist.creator?.id;

  // 更新书单信息
  const handleUpdateBooklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      await booklistService.update(id, editForm);
      setIsEditModalOpen(false);
      fetchBooklist(id);
    } catch (err) {
      alert('更新书单失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除书单
  const handleDeleteBooklist = async () => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      await booklistService.delete(id);
      navigate('/booklist');
    } catch (err) {
      alert('删除书单失败');
      setIsSubmitting(false);
    }
  };

  // 更新项目笔记
  const handleUpdateItemNotes = async () => {
    if (!id || !editingItem) return;
    
    setIsSubmitting(true);
    try {
      await booklistService.updateItem(id, editingItem.id, { notes: itemNotes });
      setEditingItem(null);
      fetchBooklist(id);
    } catch (err) {
      alert('更新笔记失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除项目
  const handleRemoveItem = async (itemId: string) => {
    if (!id) return;
    
    if (!confirm('确定要删除这个章节吗？')) return;
    
    try {
      await booklistService.removeItem(id, itemId);
      fetchBooklist(id);
    } catch (err) {
      alert('删除章节失败');
    }
  };

  // 打开添加章节弹窗时加载故事列表
  const openAddChapterModal = async () => {
    setIsAddChapterModalOpen(true);
    setSelectedStoryId('');
    setSelectedChapterId('');
    setChapters([]);
    setNewItemNotes('');
    setSearchQuery('');
    try {
      const data = await storyService.getAll();
      setStories(data);
    } catch (err) {
      console.error('Failed to fetch stories');
    }
  };

  // 选择故事后加载章节列表
  const handleStorySelect = async (storyId: string) => {
    setSelectedStoryId(storyId);
    setSelectedChapterId('');
    setIsLoadingChapters(true);
    try {
      const data = await storyService.getById(storyId);
      setChapters(data.chapters || []);
    } catch (err) {
      console.error('Failed to fetch chapters');
    } finally {
      setIsLoadingChapters(false);
    }
  };

  // 添加章节到书单
  const handleAddChapter = async () => {
    if (!id || !selectedChapterId) return;
    
    setIsSubmitting(true);
    try {
      await booklistService.addItem(id, { 
        chapterId: selectedChapterId, 
        notes: newItemNotes 
      });
      setIsAddChapterModalOpen(false);
      fetchBooklist(id);
    } catch (err: any) {
      if (err.response?.data?.message === 'Chapter already in booklist') {
        alert('该章节已在书单中');
      } else {
        alert('添加章节失败');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 过滤故事列表
  const filteredStories = stories.filter(story => 
    story.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 调整章节顺序 - 优化为单次批量提交
  const handleMoveItem = async (itemId: string, direction: 'up' | 'down') => {
    if (!id || !booklist) return;
    
    const currentIndex = booklist.items.findIndex(item => item.id === itemId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= booklist.items.length) return;
    
    // 1. 乐观更新 UI
    const newItems = [...booklist.items];
    const temp = newItems[currentIndex];
    newItems[currentIndex] = newItems[newIndex];
    newItems[newIndex] = temp;
    
    const updatedBooklist = { ...booklist, items: newItems };
    setBooklist(updatedBooklist);
    
    // 2. 准备批量更新数据
    const itemOrders = newItems.map((item, i) => ({
      id: item.id,
      orderIndex: i + 1
    }));
    
    try {
      await booklistService.reorderItems(id, itemOrders);
      // 成功后重新拉取以确保同步 (可选)
    } catch (err) {
      alert('调整顺序失败，已还原');
      fetchBooklist(id); // 还原数据
    }
  };

  // 打开阅读抽屉
  const handleOpenReadingDrawer = (item?: any, index?: number) => {
    if (item !== undefined && index !== undefined) {
      setDrawerStartIndex(index);
      setCurrentItem(index);
    } else {
      // Start journey / continue reading
      const startIdx = continueReading();
      setDrawerStartIndex(startIdx);
      setCurrentItem(startIdx);
    }
    setIsReadingDrawerOpen(true);
  };

  // 阅读抽屉进度回调
  const handleDrawerProgress = (index: number, completed: boolean) => {
    if (completed) {
      const item = booklist?.items?.[index];
      if (item) markCompleted(item.id);
    }
    setCurrentItem(index);
  };

  if (isLoading || !booklist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <BooklistHeader
        booklist={booklist}
        isCreator={isCreator}
        stats={stats}
        completedCount={completedCount}
        totalItems={totalItems}
        onStartJourney={() => handleOpenReadingDrawer()}
        onToggleLike={handleToggleLike}
        onShare={() => setIsShareModalOpen(true)}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      <BooklistTimeline
        items={booklist.items || []}
        booklistId={booklist.id}
        isCreator={isCreator}
        onAddChapter={openAddChapterModal}
        onRead={(item, index) => handleOpenReadingDrawer(item, index)}
        onEditNotes={(item) => {
          setEditingItem(item);
          setItemNotes(item.notes || '');
        }}
        onMoveItem={handleMoveItem}
        onRemoveItem={handleRemoveItem}
      />

      {/* Reading Drawer (方案A) */}
      <ReadingDrawer
        isOpen={isReadingDrawerOpen}
        onClose={() => setIsReadingDrawerOpen(false)}
        items={booklist.items || []}
        initialIndex={drawerStartIndex}
        booklistTitle={booklist.title}
        onProgressUpdate={handleDrawerProgress}
      />

      {/* 编辑书单弹窗 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑书单"
      >
        <form onSubmit={handleUpdateBooklist} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">书单标题</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={editForm.title}
              onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">书单简介</label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
              value={editForm.description}
              onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">导览类型</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={editForm.type}
                onChange={e => setEditForm(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <option value="COLLECTION">普通书单 (精选收藏)</option>
                <option value="TIMELINE">时空导览 (推荐阅读路线)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">标签 (逗号分隔)</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="治愈, 平行线, 虐心..."
                value={editForm.tags}
                onChange={e => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">封面图片 URL</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="https://images.unsplash.com/..."
              value={editForm.coverImage}
              onChange={e => setEditForm(prev => ({ ...prev, coverImage: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 删除书单确认弹窗 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="删除书单"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <p className="font-bold text-red-600 mb-1">确定要删除这个书单吗？</p>
              <p className="text-sm text-red-500">此操作不可撤销，书单中的所有章节推荐都将被删除。</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleDeleteBooklist}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 分享书单弹窗 */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="分享这份书单"
      >
        {booklist && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{booklist.title}</h3>
              <p className="text-sm text-gray-500">选择一个平台分享你的阅读路线</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleShare('copy')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 group transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-600 group-hover:text-emerald-600 transition-colors">
                  <Link2 size={24} />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">复制链接</span>
              </button>
              
              <button
                onClick={() => handleShare('twitter')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-600 group-hover:text-blue-400 transition-colors">
                  <Twitter size={24} />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Twitter</span>
              </button>
              
              <button
                onClick={() => handleShare('wechat')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-green-50 dark:hover:bg-green-900/20 group transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-600 group-hover:text-green-500 transition-colors">
                  <MessageCircle size={24} />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">微信</span>
              </button>
            </div>
            
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 text-center leading-relaxed">
                "分享你的独特品味，帮助其他读者在平行宇宙中找到精彩的故事章节。"
              </p>
            </div>
            
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              关闭
            </button>
          </div>
        )}
      </Modal>

      {/* 编辑项目笔记弹窗 */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="编辑导游点评"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">章节</label>
            <p className="text-gray-700 dark:text-gray-300 font-medium">{editingItem?.chapter?.title}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">导游点评</label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
              placeholder="写下你对这个章节的推荐理由..."
              value={itemNotes}
              onChange={e => setItemNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setEditingItem(null)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleUpdateItemNotes}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存点评'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 添加章节弹窗 */}
      <Modal
        isOpen={isAddChapterModalOpen}
        onClose={() => setIsAddChapterModalOpen(false)}
        title="添加章节到书单"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 搜索故事 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">搜索故事</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="输入故事标题搜索..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 故事列表 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">选择故事</label>
            <div className="max-h-32 overflow-y-auto space-y-2 border border-gray-100 dark:border-gray-700 rounded-xl p-2">
              {filteredStories.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">暂无故事</p>
              ) : (
                filteredStories.map(story => (
                  <button
                    key={story.id}
                    onClick={() => handleStorySelect(story.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedStoryId === story.id
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{story.title}</span>
                      {selectedStoryId === story.id && <Check size={16} className="text-emerald-600" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 章节列表 */}
          {selectedStoryId && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">选择章节</label>
              {isLoadingChapters ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                </div>
              ) : chapters.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4 border border-gray-100 dark:border-gray-700 rounded-xl">
                  该故事暂无章节
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-100 dark:border-gray-700 rounded-xl p-2">
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      onClick={() => setSelectedChapterId(chapter.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedChapterId === chapter.id
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{index + 1}. {chapter.title}</span>
                        {selectedChapterId === chapter.id && <Check size={16} className="text-emerald-600" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 导游点评 */}
          {selectedChapterId && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">导游点评（可选）</label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                placeholder="写下你对这个章节的推荐理由..."
                value={newItemNotes}
                onChange={e => setNewItemNotes(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsAddChapterModalOpen(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleAddChapter}
              disabled={!selectedChapterId || isSubmitting}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '添加中...' : '添加章节'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BooklistDetailPage;
