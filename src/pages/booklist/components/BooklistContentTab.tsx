import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Library, X, GripVertical, Edit3, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button, IconButton, Badge, EmptyState } from '../../../components/ui';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import BooklistProgressBar from './BooklistProgressBar';

/** 从条目解析章节 id（用于阅读跳转与进度匹配） */
const getChapterId = (item: any): string | undefined =>
  item?.chapterId || item?.chapter?.id || (item?.targetType === 'chapter' ? item?.targetId : undefined);

interface SortableChapterRowProps {
  item: any;
  index: number;
  isCreator: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  onRead: (item: any) => void;
  onEdit: (item: any) => void;
  onRemove: (itemId: string) => void;
}

const SortableChapterRow: React.FC<SortableChapterRowProps> = ({ item, index, isCreator, isCompleted, isCurrent, onRead, onEdit, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const canRead = !!getChapterId(item);
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-ink-700 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        isCurrent ? 'border-accent-400 ring-1 ring-accent-400/30' : 'border-ink-100 dark:border-ink-600'
      }`}
    >
      {isCreator && (
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="拖拽排序"
          title="拖拽排序"
          {...attributes}
          {...listeners}
          className="h-auto w-auto p-1.5 rounded-lg text-ink-300 hover:text-ink-500 cursor-grab active:cursor-grabbing shrink-0 touch-none hover:bg-ink-100 dark:hover:bg-ink-600"
        >
          <GripVertical size={16} />
        </IconButton>
      )}
      {isCompleted ? (
        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
      ) : (
        <span className="text-xs text-ink-400 w-6 shrink-0 text-center">{index + 1}</span>
      )}
      <button
        onClick={() => canRead && onRead(item)}
        disabled={!canRead}
        className="flex-1 min-w-0 text-left disabled:cursor-default group"
      >
        <p className={`text-sm font-medium truncate transition-colors ${
          isCompleted ? 'text-ink-500 dark:text-ink-400' : 'text-ink-800 dark:text-white'
        } ${canRead ? 'group-hover:text-accent-600' : ''}`}>
          {item.chapter?.title || `第 ${item.chapter?.orderIndex || index + 1} 章`}
          {isCurrent && (
            <Badge tone="accent" size="sm" className="ml-2 align-middle">当前</Badge>
          )}
        </p>
        {item.notes && (
          <p className="text-xs text-ink-400 italic truncate mt-0.5">点评：{item.notes}</p>
        )}
      </button>
      <div className="flex items-center gap-1 shrink-0">
        {canRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRead(item)}
            title="阅读此章节"
            rightIcon={<ChevronRight size={14} />}
            className="h-auto gap-1 px-2.5 py-1.5 rounded-lg text-xs text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-500/15"
          >
            {isCurrent ? '继续' : isCompleted ? '重读' : '阅读'}
          </Button>
        )}
        {isCreator && (
          <>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="编辑点评"
              title="编辑点评"
              onClick={() => onEdit(item)}
              className="h-auto w-auto p-2 rounded-lg text-ink-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-500/15"
            >
              <Edit3 size={14} />
            </IconButton>
            <IconButton
              variant="danger"
              size="sm"
              aria-label="移除"
              title="移除"
              onClick={() => onRemove(item.id)}
              className="h-auto w-auto p-2 rounded-lg text-ink-400 dark:hover:bg-red-900/30"
            >
              <X size={14} />
            </IconButton>
          </>
        )}
      </div>
    </div>
  );
};

interface ProgressLike {
  isCompleted: (itemId: string) => boolean;
  currentItemIndex: number;
  completedCount: number;
  totalItems: number;
  completionPercentage: number;
}

interface BooklistContentTabProps {
  booklist: any;
  booklistId: string;
  isCreator: boolean;
  mainlineOrder: string[] | null;
  progress?: ProgressLike;
  onEditItem: (item: any) => void;
  onRemoveItem: (itemId: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onAddItem?: () => void;
}

export const BooklistContentTab: React.FC<BooklistContentTabProps> = ({
  booklist,
  booklistId,
  isCreator,
  mainlineOrder,
  progress,
  onEditItem,
  onRemoveItem,
  onDragEnd,
  onAddItem,
}) => {
  const b = booklist || {};
  const navigate = useNavigate();

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // 阅读跳转：携带书单上下文，进入阅读页后可在侧栏看到来源与进度
  const readChapter = (item: any) => {
    const chapterId = getChapterId(item);
    if (!chapterId) return;
    navigate(`/read/${chapterId}?ctx=booklist:${booklistId}`);
  };

  const isItemCompleted = (item: any) => {
    const chapterId = getChapterId(item);
    return !!(progress && chapterId && progress.isCompleted(chapterId));
  };

  const groupByStory = (chapters: any[]) => {
    const map = new Map<string, { storyId: string; storyTitle: string; chapters: any[] }>();
    chapters.forEach((ch: any) => {
      const storyId = ch.story?.id || 'unknown';
      if (!map.has(storyId)) map.set(storyId, { storyId, storyTitle: ch.story?.title || '未知故事', chapters: [] });
      map.get(storyId)!.chapters.push(ch);
    });
    return Array.from(map.values());
  };

  const mainlineList = b.itemsBySection?.mainline || b.items || [];
  // content tab 展示顺序（创建者可能有本地乐观排序）
  const orderedMainline = mainlineOrder
    ? mainlineOrder.map(itemId => mainlineList.find((it: any) => it.id === itemId)).filter(Boolean)
    : mainlineList;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
              <BookOpen size={14} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-ink-800 dark:text-white tracking-tight">
              主线章节
              <span className="text-sm font-normal text-ink-400 ml-2">({(b.itemsBySection?.mainline || []).length})</span>
            </h2>
          </div>
          {isCreator && onAddItem && (
            <Button variant="primary" size="sm" onClick={onAddItem} className="shadow-lg shadow-accent-400/20">
              + 添加条目
            </Button>
          )}
        </div>

        {/* 阅读进度条 */}
        {progress && progress.totalItems > 0 && (
          <BooklistProgressBar
            completedCount={progress.completedCount}
            totalItems={progress.totalItems}
            percentage={progress.completionPercentage}
          />
        )}

        {(b.itemsBySection?.mainline || []).length === 0 ? (
          <EmptyState icon={BookOpen} title="暂未声明覆盖的章节范围" compact />
        ) : isCreator ? (
          <>
            {(b.itemsBySection?.mainline || []).length > 1 && (
              <p className="text-[10px] text-ink-400 font-medium flex items-center gap-1">
                <GripVertical size={11} /> 拖拽手柄可调整章节顺序
              </p>
            )}
            <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext
                items={(mainlineOrder || (b.itemsBySection?.mainline || []).map((it: any) => it.id))}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {orderedMainline.map((item: any, idx: number) => (
                    <SortableChapterRow
                      key={item.id}
                      item={item}
                      index={idx}
                      isCreator={!!isCreator}
                      isCompleted={isItemCompleted(item)}
                      isCurrent={progress?.currentItemIndex === idx}
                      onRead={readChapter}
                      onEdit={onEditItem}
                      onRemove={onRemoveItem}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        ) : (
          <div className="space-y-3">
            {groupByStory(b.itemsBySection?.mainline || b.items || []).map((group: any) => (
              <div key={group.storyId} className="rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="px-4 py-3 bg-ink-50 dark:bg-ink-800 border-b border-ink-100 dark:border-ink-600">
                  <p className="text-sm font-bold text-ink-700 dark:text-ink-300">{group.storyTitle}</p>
                </div>
                <div className="divide-y divide-ink-100 dark:divide-ink-600">
                  {group.chapters.map((item: any, idx: number) => {
                    const canRead = !!getChapterId(item);
                    const completed = isItemCompleted(item);
                    return (
                      <button
                        key={item.id}
                        onClick={() => canRead && readChapter(item)}
                        disabled={!canRead}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-ink-50 dark:hover:bg-ink-600/50 transition-colors disabled:cursor-default group"
                      >
                        {completed ? (
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        ) : (
                          <span className="text-xs text-ink-400 w-6 shrink-0">{idx + 1}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            completed ? 'text-ink-500 dark:text-ink-400' : 'text-ink-800 dark:text-white'
                          } ${canRead ? 'group-hover:text-accent-600' : ''}`}>
                            {item.chapter?.title || `第 ${item.chapter?.orderIndex || idx + 1} 章`}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-ink-400 italic truncate mt-0.5">点评：{item.notes}</p>
                          )}
                        </div>
                        {canRead && (
                          <ChevronRight size={16} className="text-ink-300 group-hover:text-accent-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
            <Library size={14} className="text-white" />
          </div>
          <h2 className="text-base font-bold text-ink-800 dark:text-white tracking-tight">
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
                    {group.items.map((item: any, idx: number) => {
                      const canRead = !!getChapterId(item);
                      return (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50 dark:hover:bg-ink-600/50 transition-colors">
                          <span className="text-xs text-ink-400 w-6 shrink-0 text-right">{idx + 1}</span>
                          <button
                            onClick={() => canRead && readChapter(item)}
                            disabled={!canRead}
                            className="flex-1 min-w-0 text-left disabled:cursor-default group"
                          >
                            <p className={`text-sm font-medium text-ink-800 dark:text-white truncate ${canRead ? 'group-hover:text-accent-600' : ''}`}>
                              {item.chapter?.title || item.branch?.title || item.targetId}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-ink-400 italic truncate mt-0.5">点评：{item.notes}</p>
                            )}
                          </button>
                          {isCreator && (
                            <IconButton
                              variant="danger"
                              size="sm"
                              aria-label="移除"
                              title="移除"
                              onClick={() => onRemoveItem(item.id)}
                              className="h-auto w-auto p-1.5 rounded-lg text-ink-400 hover:bg-red-100 dark:hover:bg-red-900/30 shrink-0"
                            >
                              <X size={14} />
                            </IconButton>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {group.events.length > 0 && (
                  <div className="border-t border-dashed border-ink-100 dark:border-ink-600">
                    <div className="px-4 py-2 bg-rose-50/50 dark:bg-rose-900/10">
                      <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                        <Library size={12} /> 关联事件
                      </p>
                    </div>
                    <div className="divide-y divide-ink-100 dark:divide-ink-600">
                      {group.events.map((item: any) => {
                        const evt = item.event || item;
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-ink-50 dark:hover:bg-ink-600/50 transition-colors">
                            <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: evt.color || '#f43f5e' }}>
                              <Library size={10} className="text-white" />
                            </div>
                            <span className="text-sm text-ink-700 dark:text-ink-300">{evt.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-medium">
                              {evt.type}
                            </span>
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
  );
};

export default BooklistContentTab;
