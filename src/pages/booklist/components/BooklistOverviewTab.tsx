import React from 'react';
import { BookOpen, GitBranch, Sparkles, Library, Route, NetworkIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import WikiText from '../../../components/wiki/WikiText';
import { Button, Badge } from '../../../components/ui';

interface BooklistOverviewTabProps {
  booklist: any;
  setActiveTab: (tab: string) => void;
  showAllPaths?: boolean;
  onTogglePaths?: () => void;
}

export const BooklistOverviewTab: React.FC<BooklistOverviewTabProps> = ({ booklist, setActiveTab, showAllPaths = false, onTogglePaths }) => {
  const b = booklist || {};

  return (
    <div className="space-y-6">
      {b.content && (
        <div className="prose prose-sm dark:prose-invert max-w-none p-6 rounded-2xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600">
          <WikiText content={b.content} />
        </div>
      )}

      {b.itemsBySection && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
              <BookOpen size={14} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-ink-800 dark:text-white tracking-tight">结构范围</h2>
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
                <button
                  key={card.section}
                  onClick={() => setActiveTab(card.target)}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left cursor-pointer"
                >
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

      {(b.paths?.length ?? 0) > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
              <Route size={14} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-ink-800 dark:text-white tracking-tight">
              阅读路径
              <span className="text-sm font-normal text-ink-400 ml-2">({b.paths.length})</span>
            </h2>
          </div>
          <div className="grid gap-3">
            {(showAllPaths ? b.paths : b.paths.slice(0, 3)).map((p: any) => (
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
                    <span className="text-sm font-bold text-ink-800 dark:text-white truncate group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                      {p.title}
                    </span>
                    <Badge tone="accent" size="sm">
                      {p.origin === 'author' ? '作者原创' : '社区精选'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-ink-400">
                    <span className="flex items-center gap-1">
                      <Route size={11} />
                      {p._count?.nodes ?? 0} 节点
                    </span>
                    <span className="flex items-center gap-1">
                      <Library size={11} />
                      {p.creator?.username ?? '未知'}
                    </span>
                  </div>
                </div>
                <NetworkIcon size={18} className="text-ink-300 group-hover:text-accent-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
          {b.paths.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePaths}
              leftIcon={showAllPaths ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              className="text-accent-600 hover:text-accent-700"
            >
              {showAllPaths ? '收起路径列表' : `查看全部 ${b.paths.length} 条路径`}
            </Button>
          )}
        </div>
      )}

      {(() => {
        const sectionCount = ['mainline', 'branch', 'spinoff', 'wiki']
          .reduce((acc, key) => acc + ((b.itemsBySection?.[key] || []).length as number), 0);
        return (
          <button
            onClick={() => setActiveTab('graph')}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white shrink-0">
              <NetworkIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-ink-800 dark:text-white">关系图谱</p>
              <p className="text-xs text-ink-400 mt-0.5">
                {sectionCount} 个条目 · 查看章节 / 分支 / 百科间的关联与分叉
              </p>
            </div>
            <NetworkIcon size={18} className="text-ink-300 group-hover:text-accent-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        );
      })()}
    </div>
  );
};

export default BooklistOverviewTab;