import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Star, MessageCircle, Send, Clock, X, Search, Edit3, Trash2, GripVertical,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { storyEventService, StoryEvent, EventComment } from '../../../api/storyEventService';
import { chapterService, branchService, spinoffService } from '../../../api/storyService';
import { LikeButton } from '../../../components/Interaction/LikeButton';
import { ShareButton } from '../../../components/Interaction/ShareButton';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useToast } from '../../../components/notifications';
import { useNavigate } from 'react-router-dom';
import EventEditModal from './EventEditModal';
import { EVENT_TYPE_LABELS } from './eventConstants';

interface EventDetailDrawerProps {
  eventId: string;
  onClose: () => void;
  /** 故事作者 ID，用于判断是否可编辑/创建分支番外 */
  storyAuthorId?: string;
  /** 所属故事 ID，用于"从此事件创建分支/番外"跳转 */
  storyId?: string;
}

const CommentAvatar: React.FC<{ author: { avatarUrl?: string | null; username: string } }> = ({ author }) => {
  const [imgFailed, setImgFailed] = useState(false);
  if (author.avatarUrl && !imgFailed) {
    return (
      <img
        src={author.avatarUrl}
        alt={author.username}
        className="w-full h-full object-cover rounded-2xl"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return <>{author.username[0]}</>;
};

/** 可拖拽的节点行 */
const SortableNodeChip: React.FC<{
  node: any;
  canEdit: boolean;
  onNavigate: (node: any) => void;
  onRemove: (nodeId: string) => void;
}> = ({ node, canEdit, onNavigate, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-0.5">
      {canEdit && (
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 text-ink-300 hover:text-ink-500 cursor-grab active:cursor-grabbing touch-none"
          title="拖拽排序"
        >
          <GripVertical size={12} />
        </button>
      )}
      <button
        onClick={() => onNavigate(node)}
        className="px-3 py-1.5 text-xs font-medium rounded-xl bg-ink-50 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors border border-ink-100 dark:border-ink-600"
      >
        {node.targetType === 'chapter' ? '📖' : node.targetType === 'branch' ? '🌿' : '✨'}
        {' '}{node.note || node.targetType}
      </button>
      {canEdit && (
        <button
          onClick={() => onRemove(node.id)}
          className="p-0.5 rounded-full text-ink-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="移除关联"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({ eventId, onClose, storyAuthorId, storyId }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addTargetType, setAddTargetType] = useState<'chapter' | 'branch' | 'spinoff'>('chapter');
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addNote, setAddNote] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => storyEventService.getById(eventId),
    enabled: !!eventId,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['event', eventId, 'comments'],
    queryFn: () => storyEventService.getComments(eventId),
    enabled: !!eventId,
  });

  // ── Node search queries ──
  const { data: chapterSearchResults = [] } = useQuery({
    queryKey: ['chapters', 'search', addSearchQuery],
    queryFn: () => chapterService.search(addSearchQuery),
    enabled: showAddPanel && addTargetType === 'chapter' && addSearchQuery.trim().length > 0,
  });

  const { data: branchSearchResults = [] } = useQuery({
    queryKey: ['branches', 'search', addSearchQuery],
    queryFn: () => branchService.getAll({ q: addSearchQuery }),
    enabled: showAddPanel && addTargetType === 'branch' && addSearchQuery.trim().length > 0,
  });

  const { data: spinoffSearchResults = [] } = useQuery({
    queryKey: ['spinoffs', 'search', addSearchQuery],
    queryFn: () => spinoffService.getAll({ q: addSearchQuery }),
    enabled: showAddPanel && addTargetType === 'spinoff' && addSearchQuery.trim().length > 0,
  });

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => storyEventService.createComment(eventId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'comments'] });
      setNewComment('');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => storyEventService.deleteComment(eventId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'comments'] });
    },
  });

  const removeNodeMutation = useMutation({
    mutationFn: (nodeId: string) => storyEventService.removeNode(eventId, nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  const addNodeMutation = useMutation({
    mutationFn: (input: { targetType: string; targetId: string; note?: string }) =>
      storyEventService.addNode(eventId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setAddSearchQuery('');
      setAddNote('');
    },
  });

  const reorderNodesMutation = useMutation({
    mutationFn: (nodeIds: string[]) => storyEventService.reorderNodes(eventId, nodeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  // ── DnD sensors ──
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const canEdit = !!user && (user.id === storyAuthorId || user.role === 'admin');

  const handleRemoveNode = async (nodeId: string) => {
    try {
      await removeNodeMutation.mutateAsync(nodeId);
    } catch {
      addToast('error', '删除关联失败');
    }
  };

  const handleAddNode = async (targetId: string) => {
    try {
      await addNodeMutation.mutateAsync({ targetType: addTargetType, targetId, note: addNote.trim() || undefined });
    } catch {
      addToast('error', '添加关联失败');
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const nodes = (event as any)?.nodes || [];
    const oldIndex = nodes.findIndex((n: any) => n.id === active.id);
    const newIndex = nodes.findIndex((n: any) => n.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...nodes];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reorderNodesMutation.mutate(reordered.map((n: any) => n.id));
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCommentMutation.mutateAsync(commentId);
      addToast('success', '评论已删除');
    } catch {
      addToast('error', '删除评论失败');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;
    try {
      await createCommentMutation.mutateAsync(newComment);
    } catch {
      addToast('error', '评论发送失败');
    }
  };

  const handleNodeNavigate = (node: any) => {
    const path = node.targetType === 'chapter'
      ? `/read/${node.targetId}`
      : node.targetType === 'branch'
        ? `/branch/${node.targetId}`
        : `/spinoff/${node.targetId}`;
    navigate(path);
  };

  if (isLoading || !event) return null;

  const evt = event as StoryEvent;
  const color = evt.color || '#f43f5e';
  const typeLabel = EVENT_TYPE_LABELS[evt.type] || evt.type || '主线';
  const commentList = comments as EventComment[];
  const nodes = evt.nodes || [];
  const searchResults = addTargetType === 'chapter' ? chapterSearchResults
    : addTargetType === 'branch' ? branchSearchResults
    : spinoffSearchResults;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-ink-700 rounded-3xl w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col outline-none"
      >
        <div className="flex items-center justify-between p-6 border-b border-ink-100 dark:border-ink-600 shrink-0">
          <h3 className="text-xl font-black flex items-center gap-2">
            <Calendar size={20} style={{ color }} />
            <span>事件详情</span>
          </h3>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-accent-500 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-full transition-colors"
              >
                <Edit3 size={14} />
                <span>编辑</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-ink-500 hover:text-ink-600 hover:bg-ink-100 dark:hover:bg-ink-600 rounded-full transition-colors"
            >
              <X size={16} />
              <span>关闭</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: color }}
              >
                <Calendar size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-black text-ink-800 dark:text-white">{evt.title}</h2>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star
                      key={n}
                      size={12}
                      className={n <= (evt.importance || 1) ? 'text-amber-400 fill-amber-400' : 'text-ink-200 dark:text-ink-500'}
                    />
                  ))}
                </div>
              </div>
            </div>

            <span
              className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: color + '20', color }}
            >
              {typeLabel}
            </span>

            {evt.description && (
              <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">{evt.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <LikeButton targetType="event" targetId={eventId} size="md" showCount={true} />
            <ShareButton
              targetType="event"
              targetId={eventId}
              title={evt.title}
              description={evt.description || ''}
              size="md"
              showCount={true}
            />
          </div>

          {/* ── 关联内容（支持拖拽排序 + note）── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-ink-500 dark:text-ink-400 uppercase tracking-widest">
                关联内容{nodes.length > 0 ? ` (${nodes.length})` : ''}
              </h4>
              {canEdit && (
                <button
                  onClick={() => {
                    setShowAddPanel(!showAddPanel);
                    if (showAddPanel) { setAddSearchQuery(''); setAddNote(''); }
                  }}
                  className="text-xs font-bold text-accent-500 hover:text-accent-600 transition-colors"
                >
                  {showAddPanel ? '取消' : '+ 添加'}
                </button>
              )}
            </div>

            {nodes.length > 0 && (
              canEdit ? (
                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={nodes.map((n: any) => n.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-wrap gap-2">
                      {nodes.map((node: any) => (
                        <SortableNodeChip
                          key={node.id}
                          node={node}
                          canEdit={canEdit}
                          onNavigate={handleNodeNavigate}
                          onRemove={handleRemoveNode}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {nodes.map((node: any) => (
                    <SortableNodeChip
                      key={node.id}
                      node={node}
                      canEdit={false}
                      onNavigate={handleNodeNavigate}
                      onRemove={handleRemoveNode}
                    />
                  ))}
                </div>
              )
            )}

            {nodes.length === 0 && !showAddPanel && (
              <p className="text-xs text-ink-400">暂无关联内容</p>
            )}

            {/* ── 添加面板（含 note 输入）── */}
            {showAddPanel && (
              <div className="space-y-2 p-3 rounded-xl bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-600">
                <div className="flex gap-1">
                  {(['chapter', 'branch', 'spinoff'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => { setAddTargetType(t); setAddSearchQuery(''); }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        addTargetType === t
                          ? 'bg-white dark:bg-ink-700 text-ink-800 dark:text-white shadow-sm'
                          : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
                      }`}
                    >
                      {t === 'chapter' ? '📖 章节' : t === 'branch' ? '🌿 分支' : '✨ 番外'}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    value={addSearchQuery}
                    onChange={e => setAddSearchQuery(e.target.value)}
                    placeholder={`搜索${addTargetType === 'chapter' ? '章节' : addTargetType === 'branch' ? '分支' : '番外'}...`}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-ink-200 dark:border-ink-600 bg-white dark:bg-ink-700 text-xs outline-none focus:ring-2 focus:ring-accent-400"
                  />
                </div>

                <input
                  value={addNote}
                  onChange={e => setAddNote(e.target.value)}
                  placeholder="备注（可选，如「决战之地」）"
                  className="w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-600 bg-white dark:bg-ink-700 text-xs outline-none focus:ring-2 focus:ring-accent-400"
                />

                <div className="max-h-40 overflow-y-auto space-y-1">
                  {searchResults.length > 0 ? (
                    searchResults.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddNode(item.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors text-left"
                      >
                        <span className="font-medium truncate">{item.title || `(${addTargetType})`}</span>
                      </button>
                    ))
                  ) : addSearchQuery.trim().length > 0 ? (
                    <p className="text-xs text-ink-400 text-center py-2">未找到匹配内容</p>
                  ) : (
                    <p className="text-xs text-ink-400 text-center py-2">输入关键词搜索</p>
                  )}
                </div>

                {addNodeMutation.isPending && (
                  <p className="text-xs text-ink-400 text-center">添加中...</p>
                )}
              </div>
            )}

            {/* ── 从此事件创建分支/番外（仅故事作者）── */}
            {canEdit && storyId && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => navigate(`/story/${storyId}?tab=tree&branchEventId=${eventId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                >
                  <Calendar size={12} />
                  从此事件创建分支
                </button>
                <button
                  onClick={() => navigate(`/spinoff/create?storyId=${storyId}&eventId=${eventId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <Calendar size={12} />
                  从此事件创作番外
                </button>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-ink-100 dark:border-ink-700 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-ink-500 dark:text-ink-400 uppercase tracking-widest flex items-center gap-2">
                <MessageCircle size={14} />
                评论 ({commentList.length})
              </h4>
            </div>

            {isAuthenticated ? (
              <form onSubmit={handleSubmitComment} className="flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="写下你的看法..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-accent-400 transition-all"
                />
                <button
                  type="submit"
                  disabled={createCommentMutation.isPending || !newComment.trim()}
                  className="px-4 py-2.5 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-all disabled:opacity-50 shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            ) : (
              <p className="text-sm text-ink-400 text-center py-3">登录后即可参与评论</p>
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {commentsLoading ? (
                <p className="text-sm text-ink-400 text-center">加载中...</p>
              ) : commentList.length > 0 ? (
                commentList.map((c: EventComment) => {
                  const canDeleteComment = !!user && (user.id === c.authorId || user.role === 'admin' || canEdit);
                  return (
                    <div key={c.id} className="flex gap-3 group">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-100 to-accent-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-accent-500 font-bold text-sm shrink-0">
                        <CommentAvatar author={c.author} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ink-700 dark:text-ink-300">{c.author.username}</span>
                          {c.author.role === 'author' && (
                            <span className="px-1.5 py-0.5 bg-accent-400 text-white text-[8px] font-black rounded-full">官方</span>
                          )}
                          <span className="text-[10px] text-ink-400 ml-auto">
                            <Clock size={10} className="inline mr-1" />
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                          {canDeleteComment && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="p-1 rounded text-ink-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                              title="删除评论"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-ink-500 dark:text-ink-300 bg-ink-50 dark:bg-ink-800 rounded-xl px-3 py-2">{c.content}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-ink-400 text-center py-4">暂无评论</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 事件编辑弹窗 */}
      {isEditModalOpen && (
        <EventEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          event={evt}
        />
      )}
    </div>,
    document.body
  );
};

export default EventDetailDrawer;
