import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  User,
  BookOpen,
  ChevronRight,
  Quote,
  Edit3,
  ArrowUp,
  ArrowDown,
  Trash2,
  Eye,
  GripVertical,
} from 'lucide-react';

interface ChapterItem {
  id: string;
  chapterId: string;
  notes?: string;
  chapter: {
    id: string;
    title: string;
    content?: string;
    branchId?: string | null;
    story: {
      id: string;
      title: string;
      author?: {
        username: string;
      };
    };
  };
}

interface BooklistChapterCardProps {
  item: ChapterItem;
  index: number;
  totalItems: number;
  booklistId: string;
  isCreator: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  onRead: (item: ChapterItem, index: number) => void;
  onEditNotes: (item: ChapterItem) => void;
  onMoveUp: (itemId: string) => void;
  onMoveDown: (itemId: string) => void;
  onRemove: (itemId: string) => void;
}

const BooklistChapterCard: React.FC<BooklistChapterCardProps> = ({
  item,
  index,
  totalItems,
  booklistId,
  isCreator,
  isCompleted,
  isCurrent,
  onRead,
  onEditNotes,
  onMoveUp,
  onMoveDown,
  onRemove,
}) => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);

  // ─── DnD sortable ──────────────────────────────────────────────
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const dndStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
    position: 'relative' as const,
  };

  const wordCount = item.chapter.content
    ? Math.round((item.chapter.content.length / 2))
    : 0;

  const previewContent = item.chapter.content
    ? item.chapter.content.slice(0, 200) + (item.chapter.content.length > 200 ? '...' : '')
    : '';

  return (
    <div
      ref={setNodeRef}
      style={{ ...dndStyle, animationDelay: `${index * 100}ms` }}
      className={`relative flex gap-8 md:gap-12 animate-in slide-in-from-bottom-8 duration-500 ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
    >
      {/* Timeline Marker */}
      <div className="relative flex flex-col items-center">
        <div className={`w-20 h-20 rounded-3xl border-4 shadow-xl flex items-center justify-center text-3xl font-black z-10 transition-all duration-300 ${
          isCompleted
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : isCurrent
              ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-emerald-500/30'
              : 'bg-white dark:bg-gray-800 border-emerald-500 text-emerald-600'
        }`}>
          {isCompleted ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            (index + 1).toString().padStart(2, '0')
          )}
        </div>
        {index < totalItems - 1 && (
          <div className={`absolute top-20 bottom-[-48px] w-1 rounded-full ${
            isCompleted ? 'bg-emerald-400' : 'bg-emerald-500'
          }`}></div>
        )}
      </div>

      {/* Station Card */}
      <div className={`flex-1 space-y-6 pt-4 relative ${
        isCurrent ? 'opacity-100' : isCompleted ? 'opacity-75' : 'opacity-100'
      }`}>
        <div
          className={`bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border transition-all group ${
            isCurrent
              ? 'border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
              : 'border-gray-100 dark:border-gray-700 hover:shadow-xl'
          }`}
          onMouseEnter={() => setShowPreview(true)}
          onMouseLeave={() => setShowPreview(false)}
        >
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  item.chapter.branchId ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {item.chapter.branchId ? '平行分支' : '主线章节'}
                </span>
                <span className="text-xs font-bold text-gray-400">
                  {item.chapter.story.title}
                </span>
                {isCurrent && (
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-full">
                    当前
                  </span>
                )}
              </div>
              <h3 className={`text-2xl font-black group-hover:text-emerald-600 transition-colors ${
                isCompleted ? 'text-gray-500 dark:text-gray-400 line-through decoration-1 decoration-gray-300' : 'text-gray-900 dark:text-white'
              }`}>
                {item.chapter.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRead(item, index)}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  isCurrent
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600'
                }`}
              >
                {isCurrent ? '继续阅读' : (isCompleted ? '重新阅读' : '阅读此章节')}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Hover Preview */}
          {showPreview && previewContent && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
                <Eye size={12} />
                内容预览
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                {previewContent}
              </p>
            </div>
          )}

          {/* Guide Notes */}
          {(item.notes || isCreator) && (
            <div className={`mt-6 p-6 rounded-2xl border-l-4 border-emerald-500 space-y-2 ${
              isCurrent ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-gray-50 dark:bg-gray-900/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                  <Quote size={14} fill="currentColor" />
                  导游点评
                </div>
                {isCreator && (
                  <button
                    onClick={() => onEditNotes(item)}
                    className="text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
              </div>
              {item.notes ? (
                <p className="text-gray-600 dark:text-gray-400 text-lg font-light leading-relaxed italic">
                  {item.notes}
                </p>
              ) : (
                <p className="text-gray-400 text-sm italic">暂无点评，点击编辑添加...</p>
              )}
            </div>
          )}

          {/* Footer Meta + Drag handle + Reorder buttons */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
              <div className="flex items-center gap-1.5">
                <User size={14} />
                {item.chapter?.story?.author?.username || '未知作者'}
              </div>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <div className="flex items-center gap-1.5">
                <BookOpen size={14} />
                约 {wordCount} 字
              </div>
            </div>

            {isCreator && (
              <div className="flex items-center gap-1">
                {/* Drag handle (dnd-kit) */}
                <button
                  {...attributes}
                  {...listeners}
                  className="p-1.5 text-gray-300 hover:text-emerald-600 transition-colors cursor-grab active:cursor-grabbing touch-none"
                  title="拖拽排序"
                  aria-label="拖拽排序"
                >
                  <GripVertical size={16} />
                </button>

                <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

                <button
                  onClick={() => onMoveUp(item.id)}
                  disabled={index === 0}
                  className="p-1.5 text-gray-300 hover:text-emerald-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="上移"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => onMoveDown(item.id)}
                  disabled={index === totalItems - 1}
                  className="p-1.5 text-gray-300 hover:text-emerald-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="下移"
                >
                  <ArrowDown size={14} />
                </button>
                <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  title="删除此章节"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BooklistChapterCard;
