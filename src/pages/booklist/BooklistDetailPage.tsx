import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booklistService, chapterService, Booklist } from '../../api/storyService';
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

  // 添加章节状态 (C2: 全局搜索 + 批量添加)
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [batchNotes, setBatchNotes] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const isCreator = user && booklist && (
    user.id === booklist.creator?.id || 
    user.id === booklist.creatorId
  );

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

  // 打开添加章节弹窗 (C2: 重置搜索状态)
  const openAddChapterModal = () => {
    setIsAddChapterModalOpen(true);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedChapterIds(new Set());
    setBatchNotes('');
  };

  // C2: 搜索输入变化处理 (防抖 300ms)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    if (value.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await chapterService.search(value.trim());
        setSearchResults(results);
      } catch (err) {
        console.error('Failed to search chapters');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // C2: 切换章节多选
  const toggleChapterSelection = (chapterId: string) => {
    setSelectedChapterIds(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  // C2: 全选/取消全选当前搜索结果
  const toggleSelectAll = () => {
    const availableIds = searchResults
      .filter(ch => !existingChapterIds.has(ch.id))
      .map(ch => ch.id);
    if (availableIds.length === 0) return;
    
    const allSelected = availableIds.every(id => selectedChapterIds.has(id));
    setSelectedChapterIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        // 取消全选
        availableIds.forEach(id => next.delete(id));
      } else {
        // 全选
        availableIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // C2: 批量添加章节到书单
  const handleBatchAddChapters = async () => {
    if (!id || selectedChapterIds.size === 0) return;
    
    setIsSubmitting(true);
    const chapterIds = Array.from(selectedChapterIds);
    let successCount = 0;
    let failCount = 0;
    
    const results = await Promise.allSettled(
      chapterIds.map(chapterId =>
        booklistService.addItem(id, {
          chapterId,
          notes: batchNotes,
        })
      )
    );
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        failCount++;
      }
    });
    
    setIsSubmitting(false);
    
    if (successCount > 0) {
      setIsAddChapterModalOpen(false);
      fetchBooklist(id);
      if (failCount > 0) {
        alert(`成功添加 ${successCount} 个章节，${failCount} 个添加失败（可能已在书单中）`);
      }
    } else {
      alert('添加失败，章节可能已在书单中');
    }
  };

  // C2: 获取已存在章节 ID 集合（用于去重）
  const existingChapterIds = new Set(
    (booklist?.items || []).map((item: any) => item.chapterId).filter(Boolean)
  );

  // C2: 按故事分组搜索结果
  const groupByStory = (chapters: any[]) => {
    const map = new Map<string, { storyId: string; storyTitle: string; chapters: any[] }>();
    chapters.forEach(ch => {
      const storyId = ch.story?.id || 'unknown';
      if (!map.has(storyId)) {
        map.set(storyId, { storyId, storyTitle: ch.story?.title || '未知故事', chapters: [] });
      }
      map.get(storyId)!.chapters.push(ch);
    });
    return Array.from(map.values());
  };

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

  // 拖拽排序 - 批量更新顺序
  const handleReorder = (reorderedItems: any[]) => {
    if (!id || !booklist) return;

    // 1. 乐观更新 UI
    const updatedBooklist = { ...booklist, items: reorderedItems };
    setBooklist(updatedBooklist);

    // 2. 批量提交到后端
    const itemOrders = reorderedItems.map((item, i) => ({
      id: item.id,
      orderIndex: i + 1
    }));

    booklistService.reorderItems(id, itemOrders).catch(() => {
      alert('调整顺序失败，已还原');
      fetchBooklist(id); // 还原数据
    });
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
        onReorder={handleReorder}
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

      {/* 添加章节弹窗 (C2: 全局搜索 + 批量添加) */}
      <Modal
        isOpen={isAddChapterModalOpen}
        onClose={() => setIsAddChapterModalOpen(false)}
        title="添加章节到书单"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 全局搜索 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">
              搜索章节
              {selectedChapterIds.size > 0 && (
                <span className="ml-2 text-emerald-600 font-bold">
                  (已选 {selectedChapterIds.size} 项)
                </span>
              )}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="输入章节标题或故事标题搜索..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                </div>
              )}
            </div>
          </div>

          {/* 搜索结果 */}
          {searchQuery.trim().length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-500">
                  搜索结果
                  {searchResults.length > 0 && (
                    <span className="ml-1 text-gray-400 font-normal">
                      ({searchResults.length} 个章节)
                    </span>
                  )}
                </label>
                {searchResults.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
                  >
                    {searchResults.filter(ch => !existingChapterIds.has(ch.id)).every(ch => selectedChapterIds.has(ch.id))
                      ? '取消全选'
                      : '全选'}
                  </button>
                )}
              </div>

              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4 border border-gray-100 dark:border-gray-700 rounded-xl">
                  未找到匹配的章节
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 dark:border-gray-700 rounded-xl p-2">
                  {groupByStory(searchResults).map(({ storyId, storyTitle, chapters }) => (
                    <div key={storyId}>
                      <div className="text-xs font-bold text-gray-400 px-2 py-1 mt-1 first:mt-0">
                        {storyTitle}
                      </div>
                      {chapters.map((chapter: any) => {
                        const isExisting = existingChapterIds.has(chapter.id);
                        const isSelected = selectedChapterIds.has(chapter.id);
                        return (
                          <label
                            key={chapter.id}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                              isExisting
                                ? 'opacity-40 cursor-not-allowed'
                                : isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isExisting}
                              onChange={() => toggleChapterSelection(chapter.id)}
                              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="flex-1 font-medium truncate">
                              {chapter.orderIndex}. {chapter.title}
                            </span>
                            {isExisting && (
                              <span className="text-xs text-gray-400 flex-shrink-0">已添加</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 批量导游点评 */}
          {selectedChapterIds.size > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">
                导游点评（批量，共 {selectedChapterIds.size} 个章节）
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                placeholder="为所有选中的章节填写统一的推荐理由..."
                value={batchNotes}
                onChange={e => setBatchNotes(e.target.value)}
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
              onClick={handleBatchAddChapters}
              disabled={selectedChapterIds.size === 0 || isSubmitting}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? '添加中...'
                : selectedChapterIds.size > 0
                ? `添加所选章节 (${selectedChapterIds.size})`
                : '添加章节'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BooklistDetailPage;
