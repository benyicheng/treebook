import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUniverseFeed } from '../../hooks/useUniverseFeed';
import DiscoverTabs from './components/DiscoverTabs';
import UniverseCardGrid from './components/UniverseCardGrid';
import { Compass, Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const UniverseDiscoverPage: React.FC = () => {
  const { items, loading, error, tab, setTab, page, totalPages, goToPage, refresh } =
    useUniverseFeed('hot');

  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-accent-500/5 dark:bg-accent-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent-500/5 dark:bg-accent-500/10 blur-3xl" />
      </div>

      <div className={`max-w-[1400px] mx-auto transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-400/20">
                <Compass size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black">
                  <span className="bg-gradient-to-r from-accent-500 to-indigo-500 bg-clip-text text-transparent">
                    宇宙探索
                  </span>
                </h1>
                <p className="text-sm text-ink-500 dark:text-ink-400">
                  发现平行宇宙中的精彩世界
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative flex-1 sm:flex-initial">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索宇宙..."
                className="w-full sm:w-48 pl-9 pr-4 py-2 text-sm bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-700 rounded-full outline-none focus:border-accent-300 dark:focus:border-accent-600 focus:ring-2 focus:ring-accent-500/20 transition-all placeholder:text-ink-400 text-ink-700 dark:text-ink-200"
              />
            </form>

            {/* Refresh */}
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-700 rounded-full hover:bg-ink-100 dark:hover:bg-ink-700 disabled:opacity-50 transition-all"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">刷新</span>
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
            <span>{error}</span>
            <button onClick={refresh} className="ml-auto underline hover:no-underline shrink-0">
              重试
            </button>
          </div>
        )}

        {/* ── Tabs ── */}
        <DiscoverTabs activeTab={tab} onTabChange={setTab} total={items.length} />

        {/* ── Grid ── */}
        <UniverseCardGrid items={items} loading={loading} />

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12 pb-8">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-bold text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-700 hover:bg-ink-100 dark:hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
              上一页
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = page <= 3
                  ? i + 1
                  : page >= totalPages - 2
                    ? totalPages - 4 + i
                    : page - 2 + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                      pageNum === page
                        ? 'bg-accent-500 text-white shadow-sm shadow-accent-400/30'
                        : 'text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-700 hover:bg-ink-100 dark:hover:bg-ink-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-bold text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-700 hover:bg-ink-100 dark:hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              下一页
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniverseDiscoverPage;
