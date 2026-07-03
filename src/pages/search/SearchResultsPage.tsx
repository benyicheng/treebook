import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ArrowUpDown,
  Clock,
} from 'lucide-react';
import analytics from '../../lib/analytics';
import { SearchResultItem } from '../../api/searchService';
import { Button, Input } from '../../components/ui';

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

const LIMIT = 20;

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
  const urlSort = (searchParams.get('sort') as 'relevance' | 'newest') || 'relevance';

  const [searchInput, setSearchInput] = useState(query);
  const [offset, setOffset] = useState(0);
  const [accumulatedResults, setAccumulatedResults] = useState<SearchResultItem[]>([]);
  const prevTotalRef = useRef(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'newest'>(urlSort);

  // Sync searchInput with URL query changes
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Reset pagination when query or type changes
  useEffect(() => {
    setOffset(0);
    setAccumulatedResults([]);
  }, [query, activeType, sortBy]);

  const { data, isFetching, error: queryError } = useSearch(
    query,
    activeType === 'all' ? null : activeType,
    LIMIT,
    offset,
    sortBy,
  );

  // Accumulate results across pages
  useEffect(() => {
    if (data?.results) {
      setAccumulatedResults(prev => offset === 0 ? data.results : [...prev, ...data.results]);
    }
  }, [data?.results, offset]);

  const total = data?.total || 0;
  const error = queryError ? '搜索服务暂时不可用，请稍后重试' : null;
  const hasMore = accumulatedResults.length > 0 && accumulatedResults.length < total;

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
    const params: Record<string, string> = {};
    if (trimmed) {
      params.q = trimmed;
      if (activeType !== 'all') params.type = activeType;
      params.sort = sortBy;
      setSearchParams(params);
    }
  };

  const handleTabChange = (tabKey: string) => {
    const params: Record<string, string> = { q: query };
    if (tabKey !== 'all') params.type = tabKey;
    params.sort = sortBy;
    setSearchParams(params);
  };

  const handleSortChange = (sort: 'relevance' | 'newest') => {
    setSortBy(sort);
    const params: Record<string, string> = { q: query, sort };
    if (activeType !== 'all') params.type = activeType;
    setSearchParams(params);
  };

  const handleLoadMore = () => {
    setOffset(prev => prev + LIMIT);
  };

  const handleClearSearch = () => {
    setSearchParams({ q: '' });
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
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索故事、分支、番外、作者..."
            size="lg"
            className="rounded-2xl h-14 text-base"
          />
        </form>
      </div>

      {/* Type Tabs + Sort Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
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

        {query && (
          <div className="flex items-center gap-1 shrink-0 ml-4">
            <button
              onClick={() => handleSortChange('relevance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === 'relevance'
                  ? 'bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-200'
                  : 'text-ink-400 hover:text-ink-600 dark:hover:text-ink-300'
              }`}
            >
              <ArrowUpDown size={12} />
              相关度
            </button>
            <button
              onClick={() => handleSortChange('newest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === 'newest'
                  ? 'bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-200'
                  : 'text-ink-400 hover:text-ink-600 dark:hover:text-ink-300'
              }`}
            >
              <Clock size={12} />
              最新
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      {query && !isFetching && (
        <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
          {total > 0 ? `找到 ${total} 个结果` : '未找到匹配结果'}
        </p>
      )}

      {/* Loading skeleton for first page */}
      {isFetching && offset === 0 && (
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
      {!error && (accumulatedResults.length > 0 || (!isFetching && query)) && (
        <div className="space-y-3">
          {accumulatedResults.map((item) => (
            <Link
              key={`${item.type}-${item.sourceId}`}
              to={getItemLink(item)}
              className="block p-5 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-ink-100 dark:bg-ink-700 flex items-center justify-center mt-0.5">
                  {item.type === 'story' && <BookOpen size={18} className="text-accent-400" />}
                  {item.type === 'chapter' && <FileText size={18} className="text-accent-400" />}
                  {item.type === 'branch' && <GitBranch size={18} className="text-purple-500" />}
                  {item.type === 'spinoff' && <FileText size={18} className="text-amber-500" />}
                  {item.type === 'author' && <User size={18} className="text-rose-500" />}
                </div>

                <div className="flex-1 min-w-0">
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

                  {item.highlight && (
                    <p className="text-sm text-ink-500 dark:text-ink-400 line-clamp-2">
                      {highlightText(item.highlight, query)}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-ink-300 dark:text-ink-600 group-hover:text-violet-400 transition-colors mt-1">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 3.5L10.5 8L5.5 12.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}

          {/* Empty State */}
          {accumulatedResults.length === 0 && query && !isFetching && (
            <div className="py-16 text-center">
              <Search size={48} className="mx-auto text-ink-300 dark:text-ink-500 mb-4" />
              <p className="text-ink-500 dark:text-ink-400 font-medium">没有找到相关内容</p>
              <p className="text-sm text-ink-400 dark:text-ink-500 mt-1">
                试试其他关键词或浏览热门推荐
              </p>
              <Button
                onClick={handleClearSearch}
                className="mt-4 rounded-full"
              >
                查看热门推荐
              </Button>
            </div>
          )}

          {/* Welcome state when no query */}
          {!query && !isFetching && accumulatedResults.length === 0 && (
            <div className="py-16 text-center">
              <Sparkles size={48} className="mx-auto text-amber-400 dark:text-amber-500 mb-4" />
              <p className="text-ink-800 dark:text-ink-200 font-bold text-lg">搜索你感兴趣的内容</p>
              <p className="text-sm text-ink-400 dark:text-ink-500 mt-1 max-w-md mx-auto">
                输入关键词搜索故事、分支、番外、作者，或按类型筛选
              </p>
              <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                {['科幻', '奇幻', '恋爱', '悬疑'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchParams({ q: tag })}
                    className="px-5 py-2 bg-ink-100 dark:bg-ink-700 text-ink-600 dark:text-ink-300 rounded-full text-sm font-bold hover:bg-accent-100 dark:hover:bg-accent-500/15 hover:text-accent-600 dark:hover:text-accent-400 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center py-6">
              <Button
                onClick={handleLoadMore}
                loading={isFetching}
                className="rounded-full"
                leftIcon={!isFetching ? <Search size={16} /> : undefined}
              >
                {isFetching ? '加载中...' : `加载更多 (${accumulatedResults.length}/${total})`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;
