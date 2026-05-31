import React from 'react';
import UniverseCard from './UniverseCard';
import { UniverseFeedItem } from '../../../api/discoverService';
import { Compass } from 'lucide-react';

interface UniverseCardGridProps {
  items: UniverseFeedItem[];
  loading: boolean;
}

const UniverseCardGrid: React.FC<UniverseCardGridProps> = ({ items, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 overflow-hidden animate-pulse"
          >
            <div className="h-40 bg-ink-100 dark:bg-ink-700" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-ink-100 dark:bg-ink-700 rounded w-3/4" />
              <div className="h-4 bg-ink-100 dark:bg-ink-700 rounded w-full" />
              <div className="h-4 bg-ink-100 dark:bg-ink-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-400 dark:text-ink-500">
        <Compass size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">暂无内容</p>
        <p className="text-sm mt-1">换个标签试试，或者过段时间再来看看</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {items.map((item) => (
        <UniverseCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default UniverseCardGrid;
