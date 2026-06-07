import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booklistService, chapterService, Booklist } from '../../api/storyService';
import { useAuthStore } from '../../stores/useAuthStore';
import { Modal } from '../../components/ui';
import { 
  ArrowLeft, CheckCircle2, Play, ArrowUp, ArrowDown,
  Heart, Share2, Eye, Edit3, Trash2, Plus, X,
  AlertCircle, Search, Check, Copy, Twitter, Facebook,
  MessageCircle, Link2, LayoutList, Share2 as NetworkIcon
} from 'lucide-react';
import { interactionService, InteractionStats } from '../../api/interactionService';
import { useToast } from '../../components/notifications';
import BooklistHeader from './components/BooklistHeader';
import BooklistTimeline from './components/BooklistTimeline';
import BooklistGraph from './components/BooklistGraph';
import { ReadingDrawer } from '../../components/Booklist';
import { useBooklistProgress } from '../../hooks/useBooklistProgress';
import { useNavigationStackStore } from '../../stores/useNavigationStackStore';
import { useBooklist, useUpdateBooklist, useDeleteBooklist, useUpdateBooklistItem, useRemoveFromBooklist, useAddToBooklist } from '../../hooks/useBooklists';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BooklistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const qc = useQueryClient();

  // ── Data fetching with React Query ──
  const { data: booklist, isLoading, refetch: refetchBooklist } = useBooklist(id!);

  // Interaction stats
  const { data: stats } = useQuery<InteractionStats>({
    queryKey: ['interaction', 'stats', 'booklist', id!],
    queryFn: () => interactionService.getStats('booklist', id!),
    enabled: !!id,
  });

  // ── Mutations ──
  const updateBooklist = useUpdateBooklist();
  const deleteBooklist = useDeleteBooklist();
  const updateBooklistItem = useUpdateBooklistItem();
  const removeFromBooklist = useRemoveFromBooklist();
  const addToBooklist = useAddToBooklist();

  const toggleLikeMutation = useMutation({
    mutationFn: () => interactionService.toggleLike('booklist', id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interaction', 'stats', 'booklist', id!] });
    },
  });

  const recordShareMutation = useMutation({
    mutationFn: (platform: string) => interactionService.recordShare('booklist', id!, platform as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interaction', 'stats', 'booklist', id!] });
    },
  });

  // ── UI State ──
  const [viewMode, setViewMode] = useState<'timeline' | 'graph'>('timeline');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string; description: string; type: 'TIMELINE' | 'COLLECTION'; tags: string; coverImage: string;
  }>({ title: '', description: '', type: 'COLLECTION', tags: '', coverImage: '' });

  // Sync edit form when booklist loads
  useEffect(() => {
    if (booklist) {
      setEditForm({ 
        title: booklist.title, 
        description: booklist.description || '',
        type: booklist.type || 'COLLECTION',
        tags: booklist.tags || '',
        coverImage: booklist.coverImage || ''
      });
    }
  }, [booklist]);

  // Edit item
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemNotes, setItemNotes] = useState('');

  // Add chapter
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [batchNotes, setBatchNotes] = useState('');

  // Debounced chapter search
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['chapters', 'search', searchQuery],
    queryFn: () => chapterService.search(searchQuery),
    enabled: searchQuery.trim().length > 0,
  });
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reading drawer (stack-based)
  const { openDrawer } = useNavigationStackStore();

  // Reading progress
  const {
    isCompleted, continueReading, setCurrentItem,
    markCompleted, completionPercentage, completedCount, totalItems,
    saveProgressOnUnload,
  } = useBooklistProgress({
    booklistId: id || '',
    totalItems: booklist?.items?.length || 0,
  });

  // ── Derived state ──
  const isCreator = user && booklist && (
    user.id === (booklist as any).creator?.id || user.id === (booklist as any).creatorId
  );
  const existingChapterIds = new Set(
    ((booklist as any)?.items || []).map((item: any) => item.chapterId).filter(Boolean)
  );

  // ── Handlers ──
  const handleToggleLike = async () => {
    if (!id || !user) { addToast('warning', '请先登录后再点赞'); return; }
    toggleLikeMutation.mutate();
  };

  const handleShare = async (platform: 'copy' | 'twitter' | 'facebook' | 'wechat') => {
    if (!id || !booklist) return;
    const config = interactionService.generateShareConfig(
      platform as any, 'booklist', id, booklist.title, (booklist as any).description || ''
    );
    const success = await interactionService.executeShare(config);
    if (success) {
      if (platform === 'copy') addToast('success', '链接已成功复制到剪贴板！');
      recordShareMutation.mutate(platform);
      setIsShareModalOpen(false);
    } else {
      addToast('error', '分享失败，请重试');
    }
  };

  const handleUpdateBooklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    updateBooklist.mutate({ id, data: editForm }, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        refetchBooklist();
      },
      onError: () => addToast('error', '更新书单失败'),
    });
  };

  const handleDeleteBooklist = () => {
    if (!id) return;
    deleteBooklist.mutate(id, {
      onSuccess: () => navigate('/booklist'),
      onError: () => addToast('error', '删除书单失败'),
    });
  };

  const handleUpdateItemNotes = () => {
    if (!id || !editingItem) return;
    updateBooklistItem.mutate(
      { booklistId: id, itemId: editingItem.id, data: { notes: itemNotes } },
      { onSuccess: () => { setEditingItem(null); refetchBooklist(); }, onError: () => addToast('error', '更新笔记失败') }
    );
  };

  const handleRemoveItem = (itemId: string) => {
    if (!id || !confirm('确定要删除这个章节吗？')) return;
    removeFromBooklist.mutate(
      { booklistId: id, itemId },
      { onSuccess: () => refetchBooklist(), onError: () => addToast('error', '删除章节失败') }
    );
  };

  const openAddChapterModal = () => {
    setIsAddChapterModalOpen(true); setSearchQuery(''); setSelectedChapterIds(new Set()); setBatchNotes('');
  };

  const toggleChapterSelection = (chapterId: string) => {
    setSelectedChapterIds(prev => {
      const next = new Set(prev);
      next.has(chapterId) ? next.delete(chapterId) : next.add(chapterId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const availableIds = searchResults
      .filter((ch: any) => !existingChapterIds.has(ch.id))
      .map((ch: any) => ch.id);
    if (availableIds.length === 0) return;
    const allSelected = availableIds.every((id: string) => selectedChapterIds.has(id));
    setSelectedChapterIds(prev => {
      const next = new Set(prev);
      allSelected ? availableIds.forEach((id: string) => next.delete(id)) : availableIds.forEach((id: string) => next.add(id));
      return next;
    });
  };

  const handleBatchAddChapters = async () => {
    if (!id || selectedChapterIds.size === 0) return;
    setIsSubmitting(true);
    const chapterIds = Array.from(selectedChapterIds);
    let successCount = 0, failCount = 0;
    const results = await Promise.allSettled(
      chapterIds.map(chapterId => addToBooklist.mutateAsync({ booklistId: id, data: { chapterId, notes: batchNotes } }))
    );
    results.forEach(r => { r.status === 'fulfilled' ? successCount++ : failCount++; });
    setIsSubmitting(false);
    if (successCount > 0) {
      setIsAddChapterModalOpen(false); refetchBooklist();
      if (failCount > 0) addToast('warning', `成功添加 ${successCount} 个章节，${failCount} 个添加失败`);
    } else { addToast('error', '添加失败，章节可能已在书单中'); }
  };

  const handleMoveItem = async (itemId: string, direction: 'up' | 'down') => {
    if (!id || !booklist) return;
    const items = (booklist as any).items || [];
    const idx = items.findIndex((i: any) => i.id === itemId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= items.length) return;
    try {
      await booklistService.updateItem(id, itemId, { sortOrder: newIdx } as any);
      refetchBooklist();
    } catch { addToast('error', '调整顺序失败'); }
  };

  // ── Render helpers ──
  const groupByStory = (chapters: any[]) => {
    const map = new Map<string, { storyId: string; storyTitle: string; chapters: any[] }>();
    chapters.forEach((ch: any) => {
      const storyId = ch.story?.id || 'unknown';
      if (!map.has(storyId)) map.set(storyId, { storyId, storyTitle: ch.story?.title || '未知故事', chapters: [] });
      map.get(storyId)!.chapters.push(ch);
    });
    return Array.from(map.values());
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-accent-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booklist) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <AlertCircle size={48} className="mx-auto text-ink-300 mb-4" />
        <h2 className="text-2xl font-black text-ink-800 mb-2">书单未找到</h2>
        <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2.5 bg-ink-100 rounded-xl font-bold hover:bg-ink-200 transition-colors">返回</button>
      </div>
    );
  }

  const b = booklist as any;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-xl transition-colors">
          <ArrowLeft size={18} className="text-ink-400" />
        </button>
      </div>

      <BooklistHeader
        booklist={b}
        stats={stats}
        isCreator={isCreator}
        completedCount={completedCount}
        totalItems={totalItems}
        onToggleLike={handleToggleLike}
        onShare={() => setIsShareModalOpen(true)}
        onStartJourney={() => {
          const startIndex = continueReading() || 0;
          const targetItem = b.items?.[startIndex];
          if (targetItem) {
            openDrawer(
              { path: '/read/' + targetItem.chapterId, title: targetItem.chapter?.title || '阅读' },
              { booklistId: id!, initialIndex: startIndex, items: b.items || [] },
            );
          }
        }}
        onEdit={() => { setIsEditModalOpen(true); }}
        onDelete={() => { setIsDeleteModalOpen(true); }}
      />

      {/* View toggle */}
      <div className="flex items-center gap-2 bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 rounded-2xl p-1 w-fit">
        <button
          onClick={() => setViewMode('timeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            viewMode === 'timeline'
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-600'
          }`}
        >
          <LayoutList size={16} />
          时间线
        </button>
        <button
          onClick={() => setViewMode('graph')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            viewMode === 'graph'
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-600'
          }`}
        >
          <NetworkIcon size={16} />
          关系图
        </button>
      </div>

      {viewMode === 'timeline' ? (
        <BooklistTimeline
          items={b.items || []}
          booklistId={id!}
          isCreator={isCreator}
          onAddChapter={openAddChapterModal}
          onRemoveItem={handleRemoveItem}
          onEditNotes={(item: any) => { setEditingItem(item); setItemNotes(item.notes || ''); }}
          onMoveItem={handleMoveItem}
          onRead={(item: any, index: number) => {
            openDrawer(
              { path: '/read/' + item.chapterId, title: item.chapter?.title || '阅读' },
              { booklistId: id!, initialIndex: index, items: b.items || [] },
            );
          }}
          onReorder={async (newItems: any[]) => {
            for (let i = 0; i < newItems.length; i++) {
              await booklistService.updateItem(id!, newItems[i].id, { sortOrder: i } as any);
            }
            refetchBooklist();
          }}
        />
      ) : (
        <BooklistGraph booklistId={id!} />
      )}

      {/* Share Modal */}
      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="分享书单">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '复制链接', icon: Copy, action: () => handleShare('copy') },
            { label: 'Twitter', icon: Twitter, action: () => handleShare('twitter') },
            { label: 'Facebook', icon: Facebook, action: () => handleShare('facebook') },
            { label: '微信', icon: MessageCircle, action: () => handleShare('wechat') },
          ].map(({ label, icon: Icon, action }) => (
            <button key={label} onClick={action}
              className="flex items-center gap-2 p-4 rounded-2xl bg-ink-50 dark:bg-ink-700 hover:bg-ink-100 dark:hover:bg-ink-600 transition-colors font-bold text-sm">
              <Icon size={18} />{label}
            </button>
          ))}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="编辑书单">
        <form onSubmit={handleUpdateBooklist} className="space-y-4">
          <input className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none focus:ring-2 focus:ring-accent-500"
            value={editForm.title} onChange={e => setEditForm(s => ({ ...s, title: e.target.value }))} placeholder="书单标题" required />
          <textarea className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none focus:ring-2 focus:ring-accent-500 resize-none"
            rows={3} value={editForm.description} onChange={e => setEditForm(s => ({ ...s, description: e.target.value }))} placeholder="书单描述" />
          <div className="flex gap-3">
            <select className="flex-1 px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none"
              value={editForm.type} onChange={e => setEditForm(s => ({ ...s, type: e.target.value as any }))}>
              <option value="COLLECTION">合集</option>
              <option value="TIMELINE">时间线</option>
            </select>
          </div>
          <button type="submit" disabled={updateBooklist.isPending}
            className="w-full py-3 bg-accent-600 text-white rounded-xl font-black hover:bg-accent-700 disabled:opacity-50 transition-colors">
            {updateBooklist.isPending ? '保存中...' : '保存'}
          </button>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="确认删除">
        <p className="text-ink-500 mb-6">删除后无法恢复，确定要删除这个书单吗？</p>
        <div className="flex gap-3">
          <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 bg-ink-100 rounded-xl font-bold hover:bg-ink-200 transition-colors">取消</button>
          <button onClick={handleDeleteBooklist} disabled={deleteBooklist.isPending}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black hover:bg-red-600 disabled:opacity-50 transition-colors">
            {deleteBooklist.isPending ? '删除中...' : '确认删除'}
          </button>
        </div>
      </Modal>

      {/* Edit Item Notes Modal */}
      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="编辑点评">
        <textarea className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none focus:ring-2 focus:ring-accent-500 resize-none"
          rows={3} value={itemNotes} onChange={e => setItemNotes(e.target.value)} placeholder="添加导游点评..." />
        <button onClick={handleUpdateItemNotes} disabled={updateBooklistItem.isPending}
          className="mt-4 w-full py-3 bg-accent-600 text-white rounded-xl font-black hover:bg-accent-700 disabled:opacity-50 transition-colors">
          {updateBooklistItem.isPending ? '保存中...' : '保存'}
        </button>
      </Modal>

      {/* Add Chapter Modal */}
      <Modal isOpen={isAddChapterModalOpen} onClose={() => setIsAddChapterModalOpen(false)} title="添加章节">
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <input className="w-full pl-10 pr-4 py-3 rounded-xl border border-ink-200 bg-ink-50 outline-none focus:ring-2 focus:ring-accent-500"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索故事章节..." />
          </div>
          {isSearching && <p className="text-sm text-ink-400 text-center">搜索中...</p>}
          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-400">{selectedChapterIds.size} 个已选</span>
                <button onClick={toggleSelectAll} className="text-xs font-bold text-accent-600 hover:text-accent-700">
                  {searchResults.filter((ch: any) => !existingChapterIds.has(ch.id)).every((ch: any) => selectedChapterIds.has(ch.id)) ? '取消全选' : '全选'}
                </button>
              </div>
              {groupByStory(searchResults).map((group: any) => (
                <div key={group.storyId}>
                  <p className="text-sm font-bold text-ink-500 mb-2">{group.storyTitle}</p>
                  {group.chapters.map((ch: any) => {
                    const alreadyExists = existingChapterIds.has(ch.id);
                    const selected = selectedChapterIds.has(ch.id);
                    return (
                      <div key={ch.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border mb-1 transition-colors ${
                          selected ? 'border-indigo-300 bg-indigo-50' : 'border-ink-100 hover:bg-ink-50'
                        } ${alreadyExists ? 'opacity-50' : 'cursor-pointer'}`}
                        onClick={() => !alreadyExists && toggleChapterSelection(ch.id)}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selected ? 'bg-accent-500 border-accent-500' : 'border-ink-300'}`}>
                          {selected && <Check size={12} className="text-white" />}
                        </div>
                        <span className="flex-1 text-sm font-medium">{ch.title || `第${ch.order}章`}</span>
                        {alreadyExists && <span className="text-[10px] text-ink-400">已添加</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
            <p className="text-sm text-ink-400 text-center py-4">未找到匹配的章节</p>
          )}
          {selectedChapterIds.size > 0 && (
            <textarea className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-ink-50 outline-none resize-none"
              rows={2} value={batchNotes} onChange={e => setBatchNotes(e.target.value)} placeholder="批量添加导游点评（可选）" />
          )}
          {selectedChapterIds.size > 0 && (
            <button onClick={handleBatchAddChapters} disabled={isSubmitting}
              className="w-full py-3 bg-accent-600 text-white rounded-xl font-black hover:bg-accent-700 disabled:opacity-50 transition-colors">
              {isSubmitting ? `添加中...` : `添加 ${selectedChapterIds.size} 个章节`}
            </button>
          )}
        </div>
      </Modal>

      {/* Reading Drawer (stack-based) */}
      <ReadingDrawer />
    </div>
  );
};

export default BooklistDetailPage;
