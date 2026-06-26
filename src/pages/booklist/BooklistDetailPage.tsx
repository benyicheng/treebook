import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { Modal, EmptyState } from '../../components/ui';
import {
  AlertCircle, Copy, Twitter, Facebook,
  MessageCircle, Edit3, X,
  Route, Clock, User, ChevronRight, BookOpen,
  LayoutDashboard, GitBranch, Sparkles, Library, Calendar, Share2 as NetworkIcon,
  GripVertical,
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { interactionService, InteractionStats } from '../../api/interactionService';
import { useToast } from '../../components/notifications';
import { wikiService } from '../../api/wikiService';
import ReactMarkdown from 'react-markdown';
import BooklistHeader from './components/BooklistHeader';
import BooklistGraph from './components/BooklistGraph';
import AddItemDrawer, { AddItemType } from './components/AddItemDrawer';
import CreateEventModal from './components/CreateEventModal';
import BooklistEventTab from './components/BooklistEventTab';
import { ReadingDrawer } from '../../components/Booklist';
import { useNavigationStackStore } from '../../stores/useNavigationStackStore';
import {
  useBooklist, useUpdateBooklist, useDeleteBooklist,
  useUpdateBooklistItem, useRemoveFromBooklist,
  useBatchAddItems, useReorderItems,
} from '../../hooks/useBooklists';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/** 可拖拽的单行章节，仅创建者可见拖拽手柄 */
const SortableChapterRow: React.FC<{
  item: any;
  index: number;
  isCreator: boolean;
  onEdit: (item: any) => void;
  onRemove: (itemId: string) => void;
}> = ({ item, index, isCreator, onEdit, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {isCreator && (
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 text-ink-300 hover:text-ink-500 cursor-grab active:cursor-grabbing shrink-0 touch-none rounded-lg hover:bg-ink-100 dark:hover:bg-ink-600"
          title="拖拽排序"
        >
          <GripVertical size={16} />
        </button>
      )}
      <span className="text-xs text-ink-400 w-6 shrink-0">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-800 dark:text-white truncate">
          {item.chapter?.title || `第 ${item.chapter?.orderIndex || index + 1} 章`}
        </p>
        {item.notes && (
          <p className="text-xs text-ink-400 italic truncate mt-0.5">点评：{item.notes}</p>
        )}
      </div>
      {isCreator && (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(item)}
            className="p-2 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-500/15 text-ink-400 hover:text-accent-600 transition-colors"
            title="编辑点评">
            <Edit3 size={14} />
          </button>
          <button onClick={() => onRemove(item.id)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-ink-400 hover:text-red-500 transition-colors"
            title="移除">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

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

  const updateBooklist = useUpdateBooklist();
  const deleteBooklist = useDeleteBooklist();
  const updateBooklistItem = useUpdateBooklistItem();
  const removeFromBooklist = useRemoveFromBooklist();
  const batchAddItems = useBatchAddItems();
  const reorderMutation = useReorderItems();

  // 主线章节本地排序状态（乐观更新）
  const [mainlineOrder, setMainlineOrder] = useState<string[] | null>(null);

  // 当书单数据变化时重置本地排序
  useEffect(() => {
    setMainlineOrder(null);
  }, [booklist]);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!id || !booklist) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 基于当前主线章节顺序计算新顺序
    const bl = booklist as any;
    const mainlineItems = (bl.itemsBySection?.mainline || bl.items || [])
      .filter((it: any) => it.targetType === 'chapter' || it.chapterId);
    const currentIds = (mainlineOrder || mainlineItems.map((it: any) => it.id));
    const oldIndex = currentIds.indexOf(active.id as string);
    const newIndex = currentIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...currentIds];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setMainlineOrder(reordered);

    // 提交到后端（orderIndex 从 1 开始）
    reorderMutation.mutate(
      { booklistId: id, items: reordered.map((itemId, idx) => ({ id: itemId, orderIndex: idx + 1 })) },
      { onError: () => { setMainlineOrder(null); addToast('error', '排序失败，已回滚'); } },
    );
  }, [id, booklist, mainlineOrder, reorderMutation, addToast]);

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

  // ── Tab State ──
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  // Wiki pages data (loaded per booklist)
  const { data: wikiPages } = useQuery({
    queryKey: ['booklist', id, 'wiki-pages'],
    queryFn: () => wikiService.getByBooklist(id!),
    enabled: !!id && activeTab === 'wiki',
  });

  // ── UI State ──
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string; description: string; content: string; type: string; tags: string; coverImage: string;
  }>({ title: '', description: '', content: '', type: 'COLLECTION', tags: '', coverImage: '' });

  const tagsToString = (tags: any) => {
    if (typeof tags === 'string') return tags || '';
    if (Array.isArray(tags)) return tags.map((t: any) => t.name || t).join(', ');
    return '';
  };

  // Sync edit form when booklist loads
  useEffect(() => {
    if (booklist) {
      const b = booklist as any;
      setEditForm({
        title: b.title,
        description: b.description || '',
        content: b.content || '',
        type: b.type || 'COLLECTION',
        tags: tagsToString(b.tags),
        coverImage: b.coverImage || ''
      });
    }
  }, [booklist]);

  // Edit item notes
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemNotes, setItemNotes] = useState('');

  // Reading drawer (stack-based)
  const { openDrawer } = useNavigationStackStore();

  // ── Derived state ──
  const isCreator = user && booklist && (
    user.id === (booklist as any).creator?.id || user.id === (booklist as any).creatorId
  );
  const b = (booklist as any) || {};

  // 各类型已存在的 targetId 集合，传给 AddItemDrawer 标记"已添加"
  const existingIds: Record<AddItemType, Set<string>> = {
    chapter: new Set((b.items || []).filter((i: any) => i.targetType === 'chapter' || i.chapterId).map((i: any) => i.targetId || i.chapterId).filter(Boolean)),
    story:   new Set((b.items || []).filter((i: any) => i.targetType === 'story').map((i: any) => i.targetId).filter(Boolean)),
    branch:  new Set((b.itemsBySection?.branch || []).map((i: any) => i.targetId).filter(Boolean)),
    spinoff: new Set((b.itemsBySection?.spinoff || []).map((i: any) => i.targetId).filter(Boolean)),
    event:   new Set((b.items || []).filter((i: any) => i.targetType === 'event').map((i: any) => i.targetId).filter(Boolean)),
    wiki:    new Set((b.itemsBySection?.wiki || []).map((i: any) => i.targetId).filter(Boolean)),
  };

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

  // ── 统一批量添加（由 AddItemDrawer 调用，一次请求提交所有选中项）──
  const handleBatchAdd = async (items: { targetType: AddItemType; targetId: string }[], notes: string) => {
    if (!id || items.length === 0) return;
    try {
      const result = await batchAddItems.mutateAsync({
        booklistId: id,
        payload: {
          items: items.map(it => ({
            targetType: it.targetType,
            targetId: it.targetId,
            notes: notes || undefined,
          })),
          notes: notes || undefined,
        },
      });
      if (result?.added > 0) {
        addToast('success', `成功添加 ${result.added} 项${result.skipped > 0 ? `，跳过 ${result.skipped} 项已存在` : ''}`);
      } else if (result?.skipped > 0) {
        addToast('info', `${result.skipped} 项已存在，未添加新内容`);
      }
    } catch (err: any) {
      addToast('error', err?.message || '批量添加失败');
      throw err;
    }
  };

  // 创建大事件后自动加入书单
  const handleEventCreated = (eventId: string) => {
    if (!id) return;
    batchAddItems.mutate(
      { booklistId: id, payload: { items: [{ targetType: 'event', targetId: eventId }] } },
      { onSuccess: () => { refetchBooklist(); addToast('success', '大事件已创建并添加到书单'); } }
    );
  };

  const handleRemoveEvent = (itemId: string) => {
    if (!id || !confirm('确定要删除这个大事件吗？')) return;
    removeFromBooklist.mutate(
      { booklistId: id, itemId },
      { onSuccess: () => refetchBooklist(), onError: () => addToast('error', '删除大事件失败') }
    );
  };

  const handleEditEventNotes = (item: any) => {
    setEditingItem(item);
    setItemNotes(item.notes || '');
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

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      <BooklistHeader
        booklist={b}
        stats={stats}
        isCreator={isCreator}
        onToggleLike={handleToggleLike}
        onShare={() => setIsShareModalOpen(true)}
        onEdit={() => { setIsEditModalOpen(true); }}
        onDelete={() => { setIsDeleteModalOpen(true); }}
      />

      {/* ── 阅读主入口：从头阅读 / 继续阅读 ── */}
      {(() => {
        const readableItems = (b.itemsBySection?.mainline || b.items || [])
          .filter((it: any) => it.chapterId || (it.targetType === 'chapter' && it.targetId))
          .sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));
        const firstChapter = readableItems[0];
        if (!firstChapter) return null;
        const firstChapterId = firstChapter.chapterId || firstChapter.targetId;
        return (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-md transition-shadow duration-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white shrink-0">
              <BookOpen size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-ink-800 dark:text-white">开始阅读这份书单</p>
              <p className="text-xs text-ink-400 truncate">
                {readableItems.length} 个章节可读 · 从「{firstChapter.chapter?.title || '第一章'}」开始
              </p>
            </div>
            <Link
              to={`/read/${firstChapterId}?referralId=${id}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent-500 text-white rounded-xl font-bold text-sm hover:bg-accent-600 transition-all shadow-lg active:scale-95 shrink-0"
            >
              <BookOpen size={16} />
              从头阅读
            </Link>
          </div>
        );
      })()}



      {/* ── 统一操作栏：添加内容 + 从头阅读 ── */}
      {isCreator && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddDrawerOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-500 text-white rounded-xl font-bold text-sm hover:bg-accent-600 transition-all shadow-lg active:scale-95"
          >
            <BookOpen size={18} />
            添加内容
          </button>
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <div className="flex items-center gap-1 p-1 bg-ink-100/80 dark:bg-ink-700/60 backdrop-blur-sm rounded-xl border border-ink-200/50 dark:border-ink-600/50 overflow-x-auto w-full">
        {[
          { id: 'overview', label: '概览', icon: LayoutDashboard, count: null },
          { id: 'content', label: '内容', icon: BookOpen, count: (b.itemsBySection?.mainline || b.items || []).length + (b.itemsByStory || []).length },
          { id: 'branch', label: '分支', icon: GitBranch, count: (b.itemsBySection?.branch || []).length },
          { id: 'spinoff', label: '番外', icon: Sparkles, count: (b.itemsBySection?.spinoff || []).length },
          { id: 'wiki', label: '百科', icon: Library, count: (b.itemsBySection?.wiki || []).length },
          { id: 'graph', label: '图谱', icon: NetworkIcon, count: null },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-ink-600 text-ink-800 dark:text-white shadow-sm'
                : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-ink-100 dark:bg-ink-500' : 'bg-ink-200 dark:bg-ink-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Guide content */}
          {b.content && (
            <div className="prose prose-sm dark:prose-invert max-w-none p-6 rounded-2xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600">
              <ReactMarkdown>{b.content}</ReactMarkdown>
            </div>
          )}

          {/* Structural scope summary */}
          {b.itemsBySection && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
                  <BookOpen size={14} className="text-white" />
                </div>
                <h2 className="text-base font-black text-ink-800 dark:text-white tracking-tight">结构范围</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { section: 'mainline', target: 'content', label: '主线章节', icon: BookOpen },
                  { section: 'branch', target: 'branch', label: '分支故事', icon: GitBranch },
                  { section: 'spinoff', target: 'spinoff', label: '番外篇', icon: Sparkles },
                  { section: 'wiki', target: 'wiki', label: '百科词条', icon: Library },
                ].map(card => {
                  const count = (b.itemsBySection?.[card.section] || []).length;
                  return (
                    <button key={card.section} onClick={() => setActiveTab(card.target)}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white shrink-0">
                        <card.icon size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-ink-400">{card.label}</p>
                        <p className="text-xl font-black text-ink-800 dark:text-white">{count}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reading paths */}
          {(b.paths?.length ?? 0) > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
                  <Route size={14} className="text-white" />
                </div>
                <h2 className="text-base font-black text-ink-800 dark:text-white tracking-tight">
                  阅读路径
                  <span className="text-sm font-normal text-ink-400 ml-2">({b.paths.length})</span>
                </h2>
              </div>
              <div className="grid gap-3">
                {b.paths.slice(0, 3).map((p: any) => (
                  <Link
                    key={p.id}
                    to={`/reading-path/${p.id}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white shrink-0">
                      <Route size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink-800 dark:text-white truncate group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">{p.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-800/30 text-accent-600 dark:text-accent-400 font-medium">
                          {p.origin === 'author' ? '作者原创' : '社区精选'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-ink-400">
                        <span className="flex items-center gap-1"><Route size={11} />{p._count?.nodes ?? 0} 节点</span>
                        <span className="flex items-center gap-1"><User size={11} />{p.creator?.username ?? '未知'}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-ink-300 group-hover:text-accent-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
              {(b.paths.length > 3) && (
                <Link to={`/booklist/${id}`} className="text-sm font-bold text-accent-600 hover:text-accent-700">
                  查看全部 {b.paths.length} 条路径 →
                </Link>
              )}
            </div>
          )}

          {/* Graph preview */}
          <div className="rounded-2xl overflow-hidden border border-ink-100 dark:border-ink-600">
            <div className="h-[500px]">
              <BooklistGraph booklistId={id!} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* 主线章节区 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
                <BookOpen size={14} className="text-white" />
              </div>
              <h2 className="text-base font-black text-ink-800 dark:text-white tracking-tight">
                主线章节
                <span className="text-sm font-normal text-ink-400 ml-2">({(b.itemsBySection?.mainline || []).length})</span>
              </h2>
            </div>
            {(b.itemsBySection?.mainline || []).length === 0 ? (
              <EmptyState icon={BookOpen} title="暂未声明覆盖的章节范围" compact />
            ) : isCreator ? (
              /* 创建者：拖拽排序视图 */
              <>
                {(b.itemsBySection?.mainline || []).length > 1 && (
                  <p className="text-[10px] text-ink-400 font-medium flex items-center gap-1">
                    <GripVertical size={11} /> 拖拽手柄可调整章节顺序
                  </p>
                )}
                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={(mainlineOrder || (b.itemsBySection?.mainline || []).map((it: any) => it.id))}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {(mainlineOrder
                        ? mainlineOrder
                            .map(itemId => (b.itemsBySection?.mainline || b.items || []).find((it: any) => it.id === itemId))
                            .filter(Boolean)
                        : (b.itemsBySection?.mainline || b.items || [])
                      ).map((item: any, idx: number) => (
                        <SortableChapterRow
                          key={item.id}
                          item={item}
                          index={idx}
                          isCreator={!!isCreator}
                          onEdit={(it) => { setEditingItem(it); setItemNotes(it.notes || ''); }}
                          onRemove={handleRemoveItem}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            ) : (
              /* 读者：按故事分组视图 */
              <div className="space-y-3">
                {groupByStory(b.itemsBySection?.mainline || b.items || []).map((group: any) => (
                  <div key={group.storyId} className="rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <div className="px-4 py-3 bg-ink-50 dark:bg-ink-800 border-b border-ink-100 dark:border-ink-600">
                      <p className="text-sm font-bold text-ink-700 dark:text-ink-300">{group.storyTitle}</p>
                    </div>
                    <div className="divide-y divide-ink-100 dark:divide-ink-600">
                      {group.chapters.map((item: any, idx: number) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50 dark:hover:bg-ink-600/50 transition-colors cursor-pointer">
                          <span className="text-xs text-ink-400 w-6 shrink-0">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink-800 dark:text-white truncate">
                              {item.chapter?.title || `第 ${item.chapter?.orderIndex || idx + 1} 章`}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-ink-400 italic truncate mt-0.5">点评：{item.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 故事分组区 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
                <Library size={14} className="text-white" />
              </div>
              <h2 className="text-base font-black text-ink-800 dark:text-white tracking-tight">
                故事
                <span className="text-sm font-normal text-ink-400 ml-2">({(b.itemsByStory || []).length} 组)</span>
              </h2>
            </div>
            {(b.itemsByStory || []).length === 0 && (b.items || []).filter((item: any) => item.targetType === 'story').length === 0 ? (
              <EmptyState icon={Library} title="暂未添加故事" compact />
            ) : (
              <div className="space-y-4">
                {(b.itemsByStory || []).map((group: any) => (
                  <div key={group.storyId} className="rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <div className="px-4 py-3 bg-gradient-to-r from-accent-50 to-transparent dark:from-accent-500/10 border-b border-ink-100 dark:border-ink-600 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white shrink-0">
                        <Library size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-ink-800 dark:text-white">{group.story?.title || '未知故事'}</p>
                        {group.story?.author && (
                          <p className="text-xs text-ink-400">作者：{group.story.author.username}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-400">
                        <span>{group.items.length} 章节</span>
                        <span>{group.events.length} 事件</span>
                        {group.children.length > 0 && <span>{group.children.length} 子项</span>}
                      </div>
                    </div>
                    {group.items.length > 0 && (
                      <div className="divide-y divide-ink-100 dark:divide-ink-600">
                        {group.items.map((item: any, idx: number) => (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50 dark:hover:bg-ink-600/50 transition-colors cursor-pointer">
                            <span className="text-xs text-ink-400 w-6 shrink-0 text-right">{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-ink-800 dark:text-white truncate">
                                {item.chapter?.title || item.branch?.title || item.targetId}
                              </p>
                              {item.notes && (
                                <p className="text-xs text-ink-400 italic truncate mt-0.5">点评：{item.notes}</p>
                              )}
                            </div>
                            {isCreator && (
                              <button onClick={() => handleRemoveItem(item.id)}
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-ink-400 hover:text-red-500 transition-colors shrink-0"
                                title="移除">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {group.events.length > 0 && (
                      <div className="border-t border-dashed border-ink-100 dark:border-ink-600">
                        <div className="px-4 py-2 bg-rose-50/50 dark:bg-rose-900/10">
                          <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                            <Calendar size={12} /> 关联事件
                          </p>
                        </div>
                        <div className="divide-y divide-ink-100 dark:divide-ink-600">
                          {group.events.map((item: any) => {
                            const evt = item.event || item;
                            return (
                              <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-ink-50 dark:hover:bg-ink-600/50 transition-colors cursor-pointer">
                                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: evt.color || '#f43f5e' }}>
                                  <Calendar size={10} className="text-white" />
                                </div>
                                <span className="text-sm text-ink-700 dark:text-ink-300">{evt.title}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-medium">{evt.type}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'branch' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
              <GitBranch size={14} className="text-white" />
            </div>
            <h2 className="text-base font-black text-ink-800 dark:text-white tracking-tight">
              分支故事
              <span className="text-sm font-normal text-ink-400 ml-2">({(b.itemsBySection?.branch || []).length})</span>
            </h2>
          </div>
          {(b.itemsBySection?.branch || []).length === 0 ? (
            <EmptyState icon={GitBranch} title="暂无分支内容" compact />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(b.itemsBySection?.branch || []).map((item: any, idx: number) => (
                <button
                  key={item.id}
                  onClick={() => navigate('/branch/' + item.targetId)}
                  className="p-4 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left w-full cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <GitBranch size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink-800 dark:text-white truncate">
                        {item.branch?.title || `分支 #${idx + 1}`}
                      </p>
                      {item.branch?.parentStory && (
                        <p className="text-[11px] text-ink-400 truncate mt-0.5">
                          源自《{item.branch.parentStory.title}》
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {item.branch?.branchType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 font-medium">
                            {item.branch.branchType === 'parallel' ? '平行分支' :
                             item.branch.branchType === 'alternative' ? 'IF 路线' :
                             item.branch.branchType}
                          </span>
                        )}
                        {item.branch?.isOfficial && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                            官方
                          </span>
                        )}
                        {item.branch?.author && (
                          <span className="text-[10px] text-ink-400 truncate">
                            作者：{item.branch.author.username}
                          </span>
                        )}
                        {item.notes && (
                          <span className="text-[10px] text-ink-400 italic truncate">点评：{item.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'event' && (
        <BooklistEventTab
          itemsByStory={(booklist as any)?.itemsByStory || []}
          isCreator={isCreator}
          onRemoveItem={handleRemoveEvent}
          onEditNotes={handleEditEventNotes}
          onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
          onOpenAddEvent={() => setIsAddDrawerOpen(true)}
        />
      )}

      {activeTab === 'spinoff' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
              <Sparkles size={14} className="text-white" />
            </div>
            <h2 className="text-base font-black text-ink-800 dark:text-white tracking-tight">
              番外篇
              <span className="text-sm font-normal text-ink-400 ml-2">({(b.itemsBySection?.spinoff || []).length})</span>
            </h2>
          </div>
          {(b.itemsBySection?.spinoff || []).length === 0 ? (
            <EmptyState icon={Sparkles} title="暂无番外内容" compact />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(b.itemsBySection?.spinoff || []).map((item: any, idx: number) => (
                <button
                  key={item.id}
                  onClick={() => openDrawer(
                    { path: '/read/' + (item.chapterId || item.targetId), title: item.spinoff?.title || '阅读' },
                    { booklistId: id!, initialIndex: idx, items: b.itemsBySection?.spinoff || [] },
                  )}
                  className="p-4 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left w-full cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <Sparkles size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink-800 dark:text-white truncate">
                        {item.spinoff?.title || `番外 #${idx + 1}`}
                      </p>
                      {item.spinoff?.originalStory && (
                        <p className="text-[11px] text-ink-400 truncate mt-0.5">
                          出自《{item.spinoff.originalStory.title}》
                        </p>
                      )}
                      {item.spinoff?.summary && (
                        <p className="text-xs text-ink-500 mt-1.5 line-clamp-2 leading-relaxed">{item.spinoff.summary}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {item.spinoff?.type && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 font-medium">
                            {item.spinoff.type === 'if_timeline' ? 'IF 时间线' :
                             item.spinoff.type === 'biography' ? '人物传记' :
                             item.spinoff.type === 'world_expansion' ? '世界观扩展' :
                             item.spinoff.type}
                          </span>
                        )}
                        {item.spinoff?.author && (
                          <span className="text-[10px] text-ink-400 truncate">
                            作者：{item.spinoff.author.username}
                          </span>
                        )}
                        {item.notes && (
                          <span className="text-[10px] text-ink-400 italic truncate">点评：{item.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'wiki' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
              <Library size={14} className="text-white" />
            </div>
            <h2 className="text-base font-black text-ink-800 dark:text-white tracking-tight">
              百科
              <span className="text-sm font-normal text-ink-400 ml-2">({(b.itemsBySection?.wiki || []).length})</span>
            </h2>
          </div>
          {/* Wiki items from booklist items */}
          {(b.itemsBySection?.wiki || []).length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(b.itemsBySection?.wiki || []).map((item: any, idx: number) => (
                <Link key={item.id} to={`/wiki/${item.targetId}`}
                  className="p-4 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 block cursor-pointer">
                  <p className="text-sm font-bold text-ink-800 dark:text-white truncate">
                    {item.wikiPage?.title || `百科 #${idx + 1}`}
                  </p>
                  {item.wikiPage?.summary && (
                    <p className="text-xs text-ink-500 mt-1 line-clamp-2">{item.wikiPage.summary}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {item.wikiPage?.contentType && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 font-medium">
                        {item.wikiPage.contentType}
                      </span>
                    )}
                    {item.notes && (
                      <span className="text-[10px] text-ink-400 italic">点评：{item.notes}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
          {/* Wiki pages linked to this booklist */}
          {wikiPages?.data?.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(wikiPages.data || []).map((page: any) => (
                <Link key={page.id} to={`/wiki/${page.id}`}
                  className="p-4 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 block cursor-pointer">
                  <p className="text-sm font-bold text-ink-800 dark:text-white truncate">{page.title}</p>
                  {page.summary && <p className="text-xs text-ink-500 mt-1 line-clamp-2">{page.summary}</p>}
                  <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 font-medium">
                    {page.contentType}
                  </span>
                </Link>
              ))}
            </div>
          )}
          {(b.itemsBySection?.wiki || []).length === 0 && (!wikiPages?.data || wikiPages.data.length === 0) && (
            <EmptyState icon={Library} title="暂无百科内容" compact />
          )}
        </div>
      )}

      {activeTab === 'graph' && (
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
          <textarea className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none focus:ring-2 focus:ring-accent-500 resize-none font-mono text-sm"
            rows={8} value={editForm.content} onChange={e => setEditForm(s => ({ ...s, content: e.target.value }))} placeholder="导读正文 (Markdown)&#10;&#10;可以在这里写故事背景介绍、结构分析、阅读视角解读等。&#10;使用 [[百科条目名]] 引用百科词条。" />
          <div className="flex gap-3">
            <select className="flex-1 px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none"
              value={editForm.type} onChange={e => setEditForm(s => ({ ...s, type: e.target.value }))}>
              <option value="COLLECTION">精选合集</option>
              <option value="TIMELINE">时空导览</option>
            </select>
          </div>
          <input className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 outline-none focus:ring-2 focus:ring-accent-500"
            value={editForm.tags} onChange={e => setEditForm(s => ({ ...s, tags: e.target.value }))} placeholder="标签 (逗号分隔)" />
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

      {/* 统一添加内容抽屉（替换原 6 个重复的 SearchableSelectionModal + AddItemDialog）*/}
      <AddItemDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        existingIds={existingIds}
        onSubmit={handleBatchAdd}
        onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreated={handleEventCreated}
      />

      {/* Reading Drawer (stack-based) */}
      <ReadingDrawer />
    </div>
  );
};

export default BooklistDetailPage;
