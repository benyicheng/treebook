import React from 'react';
import { Library } from 'lucide-react';
import { EmptyState } from '../../../components/ui';
import { Link } from 'react-router-dom';

interface BooklistWikiTabProps {
  booklist: any;
  wikiPages: any[];
}

export const BooklistWikiTab: React.FC<BooklistWikiTabProps> = ({ booklist, wikiPages }) => {
  const b = booklist || {};

  const collectedItems = (b.itemsBySection?.wiki || []).map((item: any) => ({
    id: item.targetId,
    title: item.wikiPage?.title,
    summary: item.wikiPage?.summary,
    contentType: item.wikiPage?.contentType,
    notes: item.notes,
    collected: true,
  }));

  const linkedPages = (wikiPages || []).map((page: any) => ({
    id: page.id,
    title: page.title,
    summary: page.summary,
    contentType: page.contentType,
    notes: undefined,
    collected: false,
  }));

  const seen = new Set<string>();
  const merged = [...collectedItems, ...linkedPages].filter((p) => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return (
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
      {merged.length === 0 ? (
        <EmptyState icon={Library} title="暂无百科内容" compact />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {merged.map((page, idx: number) => (
            <Link
              key={page.id + idx}
              to={`/wiki/${page.id}`}
              className="p-4 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 block cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink-800 dark:text-white truncate">
                  {page.title || `百科 #${idx + 1}`}
                </p>
                {page.collected && (
                  <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold">
                    收录
                  </span>
                )}
              </div>
              {page.summary && (
                <p className="text-xs text-ink-500 mt-1 line-clamp-2">{page.summary}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {page.contentType && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 font-medium">
                    {page.contentType}
                  </span>
                )}
                {page.notes && (
                  <span className="text-[10px] text-ink-400 italic truncate">点评：{page.notes}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BooklistWikiTab;