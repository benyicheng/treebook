import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';
import {
  Search,
  BookOpen,
  GitBranch,
  FileText,
  User,
  Loader2,
  Sparkles,
} from 'lucide-react';
import analytics from '../../lib/analytics';
import { SearchResultItem } from '../../api/searchService';

const TYPE_TABS = [
  { key: 'all', label: '全部', icon: Search },
  { key: 'story', label: '故事', icon: BookOpen },
  { key: 'branch', label: '分支', icon: GitBranch },
  { key: 'spinoff', label: '番外', icon: FileText },
  { key: 'author', label: '作者', icon: User },
] as const;

const TYPE_LABELS: Record<string, string> = {
  story: '故事',
  chapter: '章节',
  branch: '分支',
  spinoff: '番外',
  author: '作者',
};

const TYPE_COLORS: Record<string, string> = {
  story: 'bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400',
  chapter: 'bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400',
  branch: 'bg-accent-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  spinoff: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  author: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const terms = query.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return text;

  const pattern = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-800/50 text-inherit rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function getItemLink(item: SearchResultItem): string {
  switch (item.type) {
    case 'story':
      return `/story/${item.sourceId}`;
    case 'chapter':
      return `/read/${item.sourceId}`;
    case 'branch':
      return `/branch/${item.sourceId}`;
    case 'spinoff':
      return `/spinoff/${item.sourceId}`;
    case 'author':
      return `/profile/${item.sourceId}`;
    default:
      return '/';
  }
}

const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const activeType = searchParams.get('type') || 'all';

  const [searchInput, setSearchInput] = useState(query);
  const prevTotalRef = useRef(0);

  const { data, isLoading: loading, error: queryError } = useSearch(
    query,
    activeType === 'all' ? null : activeType,
  );

  const results = data?.results || [];
  const total = data?.total || 0;
  const error = queryError ? '搜索服务暂时不可用，请稍后重试' : null;

  // Track analytics when search results change
  useEffect(() => {
    if (query && total > 0 && total !== prevTotalRef.current) {
      analytics.trackSearch(query, total, activeType !== 'all' ? [activeType] : undefined);
      prevTotalRef.current = total;
    }
  }, [query, total, activeType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed, type: activeType });
    }
  };

  const handleTabChange = (tabKey: string) => {
    setSearchParams({ q: query, type: tabKey });
  };

  return (
    <div className="max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-lg shadow-accent-400/20">
            <Search size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-ink-800 dark:text-white">搜索</h1>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSubmit} className="relative">
          <Search
            size={20}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索故事、分支、番外、作者..."
            className="w-full h-14 bg-ink-100 dark:bg-ink-700 border-2 border-transparent focus:border-accent-400 rounded-2xl pl-14 pr-5 text-base font-medium placeholder:text-ink-400 outline-none transition-all"
          />
        </form>
      </div>

      {/* Type Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {TYPE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeType === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 shadow-sm'
                  : 'text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      {query && !loading && (
        <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
          {total > 0 ? `找到 ${total} 个结果` : '未找到匹配结果'}
        </p>
      )}
      {!query && !loading && results.length > 0 && (
        <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
          <Sparkles size={14} className="inline mr-1 text-amber-500" />
          热门推荐
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-ink-100 dark:bg-ink-700 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium mb-4">
          {error}
        </div>
      )}

      {/* Results List */}
      {!loading && !error && (
        <div className="space-y-3">
          {results.map((item) => (
            <Link
              key={`${item.type}-${item.sourceId}`}
              to={getItemLink(item)}
              className="block p-5 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="shrink-0 w-10 h-10 rounded-xl bg-ink-100 dark:bg-ink-700 flex items-center justify-center mt-0.5">
                  {item.type === 'story' && <BookOpen size={18} className="text-accent-400" />}
                  {item.type === 'chapter' && <FileText size={18} className="text-accent-400" />}
                  {item.type === 'branch' && <GitBranch size={18} className="text-purple-500" />}
                  {item.type === 'spinoff' && <FileText size={18} className="text-amber-500" />}
                  {item.type === 'author' && <User size={18} className="text-rose-500" />}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title + Type Badge */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-ink-800 dark:text-white group-hover:text-accent-600 dark:group-hover:text-violet-400 transition-colors truncate">
                      {highlightText(item.title, query)}
                    </h3>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-bold ${TYPE_COLORS[item.type] || 'bg-ink-100 text-ink-500'}`}
                    >
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                  </div>

                  {/* Highlight snippet */}
                  {item.highlight && (
                    <p className="text-sm text-ink-500 dark:text-ink-400 line-clamp-2">
                      {highlightText(item.highlight, query)}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <div className="shrink-0 text-ink-300 dark:text-ink-600 group-hover:text-violet-400 transition-colors mt-1">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 3.5L10.5 8L5.5 12.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}

          {/* Empty State */}
          {results.length === 0 && query && (
            <div className="py-16 text-center">
              <Search size={48} className="mx-auto text-ink-300 dark:text-ink-500 mb-4" />
              <p className="text-ink-500 dark:text-ink-400 font-medium">没有找到相关内容</p>
              <p className="text-sm text-ink-400 dark:text-ink-500 mt-1">
                试试其他关键词或浏览热门推荐
              </p>
              <button
                onClick={() => {
                  setSearchParams({ q: '', type: 'all' });
                }}
                className="mt-4 px-5 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full text-sm font-bold hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
              >
                查看热门推荐
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;
