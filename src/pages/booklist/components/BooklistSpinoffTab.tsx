import React from 'react';
import { Sparkles } from 'lucide-react';
import { EmptyState } from '../../../components/ui';
import { useNavigationStackStore } from '../../../stores/useNavigationStackStore';

interface BooklistSpinoffTabProps {
  booklist: any;
  booklistId: string;
}

export const BooklistSpinoffTab: React.FC<BooklistSpinoffTabProps> = ({ booklist, booklistId }) => {
  const { openDrawer } = useNavigationStackStore();
  const b = booklist || {};

  return (
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
                { booklistId, initialIndex: idx, items: b.itemsBySection?.spinoff || [] },
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
                    <p className="text-xs text-ink-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {item.spinoff.summary}
                    </p>
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
  );
};

export default BooklistSpinoffTab;