import React, { useEffect, useState } from 'react';
import UniverseCard from './UniverseCard';
import { UniverseFeedItem } from '../../../api/discoverService';
import { Compass, BookOpen, GitBranch, Sparkles, Users, Eye } from 'lucide-react';

interface UniverseCardGridProps {
  items: UniverseFeedItem[];
  loading: boolean;
}

const skeletonStats = [
  BookOpen, GitBranch, Sparkles, Users, Eye,
];

const SkeletonCard: React.FC<{ index: number }> = ({ index }) => (
  <div
    className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 overflow-hidden animate-pulse"
    style={{ animationDelay: `${index * 40}ms` }}
  >
    {/* Cover */}
    <div className="h-40 bg-gradient-to-br from-ink-100 to-accent-50 dark:from-ink-700 dark:to-accent-800/20" />
    {/* Body */}
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-ink-100 dark:bg-ink-700" />
        <div className="h-3 bg-ink-100 dark:bg-ink-700 rounded w-24" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-ink-100 dark:bg-ink-700 rounded w-full" />
        <div className="h-3 bg-ink-100 dark:bg-ink-700 rounded w-3/4" />
      </div>
      <div className="flex gap-2 pt-1">
        {skeletonStats.map((Icon, i) => (
          <div key={i} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-ink-50 dark:bg-ink-700/50 w-14">
            <Icon size={12} className="text-ink-200 dark:text-ink-600" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const UniverseCardGrid: React.FC<UniverseCardGridProps> = ({ items, loading }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Small delay to trigger entrance animation
      const t = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [loading, items]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-ink-400 dark:text-ink-500">
        <div className="w-16 h-16 rounded-2xl bg-ink-50 dark:bg-ink-800 flex items-center justify-center mb-5">
          <Compass size={32} className="opacity-40" />
        </div>
        <p className="text-lg font-bold text-ink-600 dark:text-ink-300">暂无内容</p>
        <p className="text-sm mt-1 text-ink-400 dark:text-ink-500">换个标签试试，或者过段时间再来看看</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {items.map((item, i) => (
        <div
          key={item.id}
          className={` transition-all duration-500 ease-out-expo ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: `${i * 50}ms` }}
        >
          <UniverseCard item={item} index={i} />
        </div>
      ))}
    </div>
  );
};

export default UniverseCardGrid;
