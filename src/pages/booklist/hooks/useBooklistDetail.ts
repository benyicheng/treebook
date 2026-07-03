import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useToast } from '../../../components/notifications';
import { useQueryClient } from '@tanstack/react-query';
import {
  useBooklist, useUpdateBooklist, useDeleteBooklist,
  useUpdateBooklistItem, useRemoveFromBooklist,
  useBatchAddItems, useReorderItems,
} from '../../../hooks/useBooklists';
import { useBooklistProgress } from '../../../hooks/useBooklistProgress';
import { interactionService } from '../../../api/interactionService';
import { wikiService } from '../../../api/wikiService';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AddItemType } from '../components/AddItemDrawer';
import type { DragEndEvent } from '@dnd-kit/core';

export interface DeleteItemState {
  title: string;
  onConfirm: () => void;
}

export interface EditFormState {
  title: string;
  description: string;
  content: string;
  type: string;
  tags: string;
  coverImage: string;
}

const tagsToString = (tags: any) => {
  if (typeof tags === 'string') return tags || '';
  if (Array.isArray(tags)) return tags.map((t: any) => t.name || t).join(', ');
  return '';
};

export const useBooklistDetail = (id: string | undefined) => {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const qc = useQueryClient();

  const { data: booklist, isLoading, refetch: refetchBooklist } = useBooklist(id!);
  const updateBooklist = useUpdateBooklist();
  const deleteBooklist = useDeleteBooklist();
  const updateBooklistItem = useUpdateBooklistItem();
  const removeFromBooklist = useRemoveFromBooklist();
  const batchAddItems = useBatchAddItems();
  const reorderMutation = useReorderItems();

  const [mainlineOrder, setMainlineOrder] = useState<string[] | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    title: '', description: '', content: '', type: 'COLLECTION', tags: '', coverImage: ''
  });
  const [deleteItem, setDeleteItem] = useState<DeleteItemState | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemNotes, setItemNotes] = useState('');

  useEffect(() => {
    setMainlineOrder(null);
  }, [booklist]);

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

  const { data: stats } = useQuery({
    queryKey: ['interaction', 'stats', 'booklist', id!],
    queryFn: () => interactionService.getStats('booklist', id!),
    enabled: !!id,
  });

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

  const b = (booklist as any) || {};
  const mainlineItems = (b.itemsBySection?.mainline || b.items || [])
    .filter((it: any) => it.chapterId || (it.targetType === 'chapter' && it.targetId));

  const booklistProgress = useBooklistProgress({
    booklistId: id ?? '',
    totalItems: mainlineItems.length,
  });

  const existingIds: Record<AddItemType, Set<string>> = {
    chapter: new Set((b.items || []).filter((i: any) => i.targetType === 'chapter' || i.chapterId).map((i: any) => i.targetId || i.chapterId).filter(Boolean)),
    story: new Set((b.items || []).filter((i: any) => i.targetType === 'story').map((i: any) => i.targetId).filter(Boolean)),
    branch: new Set((b.itemsBySection?.branch || []).map((i: any) => i.targetId).filter(Boolean)),
    spinoff: new Set((b.itemsBySection?.spinoff || []).map((i: any) => i.targetId).filter(Boolean)),
    event: new Set((b.items || []).filter((i: any) => i.targetType === 'event').map((i: any) => i.targetId).filter(Boolean)),
    wiki: new Set((b.itemsBySection?.wiki || []).map((i: any) => i.targetId).filter(Boolean)),
  };

  const isCreator = user && booklist && (
    user.id === (booklist as any).creator?.id || user.id === (booklist as any).creatorId
  );

  const handleToggleLike = useCallback(async () => {
    if (!id || !user) { addToast('warning', '请先登录后再点赞'); return; }
    toggleLikeMutation.mutate();
  }, [id, user, toggleLikeMutation, addToast]);

  const handleShare = useCallback(async (platform: 'copy' | 'twitter' | 'facebook' | 'wechat') => {
    if (!id || !booklist) return;
    const config = interactionService.generateShareConfig(
      platform as any, 'booklist', id, booklist.title, (booklist as any).description || ''
    );
    const success = await interactionService.executeShare(config);
    if (success) {
      if (platform === 'copy') addToast('success', '链接已成功复制到剪贴板！');
      recordShareMutation.mutate(platform);
    } else {
      addToast('error', '分享失败，请重试');
    }
  }, [id, booklist, recordShareMutation, addToast]);

  const handleUpdateBooklist = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    updateBooklist.mutate({ id, data: editForm }, {
      onSuccess: () => {
        refetchBooklist();
      },
      onError: () => addToast('error', '更新书单失败'),
    });
  }, [id, editForm, updateBooklist, refetchBooklist, addToast]);

  const handleDeleteBooklist = useCallback(() => {
    if (!id) return;
    deleteBooklist.mutate(id, {
      onError: () => addToast('error', '删除书单失败'),
    });
  }, [id, deleteBooklist, addToast]);

  const handleUpdateItemNotes = useCallback(() => {
    if (!id || !editingItem) return;
    updateBooklistItem.mutate(
      { booklistId: id, itemId: editingItem.id, data: { notes: itemNotes } },
      { onSuccess: () => { setEditingItem(null); refetchBooklist(); }, onError: () => addToast('error', '更新笔记失败') }
    );
  }, [id, editingItem, itemNotes, updateBooklistItem, refetchBooklist, addToast]);

  const handleRemoveItem = useCallback((itemId: string) => {
    if (!id) return;
    const item = (b.itemsBySection?.mainline || b.items || []).find((it: any) => it.id === itemId);
    const title = item?.chapter?.title || item?.story?.title || item?.branch?.title || item?.spinoff?.title || '该项';
    setDeleteItem({
      title,
      onConfirm: () => {
        removeFromBooklist.mutate(
          { booklistId: id, itemId },
          { onSuccess: () => refetchBooklist(), onError: () => addToast('error', '删除章节失败') },
        );
        setDeleteItem(null);
      },
    });
  }, [id, b, removeFromBooklist, refetchBooklist, addToast]);

  const handleBatchAdd = useCallback(async (items: { targetType: AddItemType; targetId: string }[], notes: string) => {
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
  }, [id, batchAddItems, addToast]);

  const handleEventCreated = useCallback((eventId: string) => {
    if (!id) return;
    batchAddItems.mutate(
      { booklistId: id, payload: { items: [{ targetType: 'event', targetId: eventId }] } },
      { onSuccess: () => { refetchBooklist(); addToast('success', '大事件已创建并添加到书单'); } }
    );
  }, [id, batchAddItems, refetchBooklist, addToast]);

  const handleRemoveEvent = useCallback((itemId: string) => {
    if (!id) return;
    setDeleteItem({
      title: '这个大事件',
      onConfirm: () => {
        removeFromBooklist.mutate(
          { booklistId: id, itemId },
          { onSuccess: () => refetchBooklist(), onError: () => addToast('error', '删除大事件失败') },
        );
        setDeleteItem(null);
      },
    });
  }, [id, removeFromBooklist, refetchBooklist, addToast]);

  const handleEditEventNotes = useCallback((item: any) => {
    setEditingItem(item);
    setItemNotes(item.notes || '');
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!id || !booklist) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const bl = booklist as any;
    const mainlineItemsData = (bl.itemsBySection?.mainline || bl.items || [])
      .filter((it: any) => it.targetType === 'chapter' || it.chapterId);
    const currentIds = (mainlineOrder || mainlineItemsData.map((it: any) => it.id));
    const oldIndex = currentIds.indexOf(activeId);
    const newIndex = currentIds.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...currentIds];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setMainlineOrder(reordered);

    reorderMutation.mutate(
      { booklistId: id, items: reordered.map((itemId, idx) => ({ id: itemId, orderIndex: idx + 1 })) },
      { onError: () => { setMainlineOrder(null); addToast('error', '排序失败，已回滚'); } },
    );
  }, [id, booklist, mainlineOrder, reorderMutation, addToast]);

  const wikiPagesQuery = useQuery({
    queryKey: ['booklist', id, 'wiki-pages'],
    queryFn: () => wikiService.getByBooklist(id!),
    enabled: !!id,
  });

  return {
    booklist,
    isLoading,
    stats,
    editForm,
    setEditForm,
    deleteItem,
    setDeleteItem,
    editingItem,
    setEditingItem,
    itemNotes,
    setItemNotes,
    mainlineOrder,
    isCreator,
    booklistProgress,
    existingIds,
    mainlineItems,
    handleToggleLike,
    handleShare,
    handleUpdateBooklist,
    handleDeleteBooklist,
    handleUpdateItemNotes,
    handleRemoveItem,
    handleBatchAdd,
    handleEventCreated,
    handleRemoveEvent,
    handleEditEventNotes,
    handleDragEnd,
    wikiPagesQuery,
    updateBooklist,
    deleteBooklist,
    removeFromBooklist,
    updateBooklistItem,
    refetchBooklist,
  };
};