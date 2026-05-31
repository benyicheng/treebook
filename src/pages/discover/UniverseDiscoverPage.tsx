import React from 'react';
import { useUniverseFeed } from './hooks/useUniverseFeed';
import DiscoverTabs from './components/DiscoverTabs';
import UniverseCardGrid from './components/UniverseCardGrid';
import { ChevronLeft, ChevronRight, Compass } from 'lucide-react';

const UniverseDiscoverPage: React.FC = () => {
  const { items, loading, error, tab, setTab, page, totalPages, goToPage, refresh } =
    useUniverseFeed('hot');

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-400/20">
              <Compass size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-ink-800 dark:text-white">宇宙探索</h1>
          </div>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 ml-[52px]">
            发现平行宇宙中的精彩世界
          </p>
        </div>
        <button
          onClick={refresh}
          className="px-4 py-2 text-sm font-bold text-ink-500 dark:text-ink-400 bg-ink-100 dark:bg-ink-700 rounded-full hover:bg-ink-200 dark:hover:bg-ink-600 transition-colors"
        >
          刷新
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
          <button onClick={refresh} className="ml-3 underline hover:no-underline">
            重试
          </button>
        </div>
      )}

      {/* Tabs */}
      <DiscoverTabs activeTab={tab} onTabChange={setTab} total={items.length} />

      {/* Grid */}
      <UniverseCardGrid items={items} loading={loading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold text-ink-500 dark:text-ink-400 bg-ink-100 dark:bg-ink-700 hover:bg-ink-200 dark:hover:bg-ink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
            上一页
          </button>
          <span className="text-sm font-medium text-ink-500 dark:text-ink-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold text-ink-500 dark:text-ink-400 bg-ink-100 dark:bg-ink-700 hover:bg-ink-200 dark:hover:bg-ink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            下一页
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default UniverseDiscoverPage;
