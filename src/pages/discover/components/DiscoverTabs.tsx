import React from 'react';
import type { DiscoverTab } from '../../../hooks/useUniverseFeed';
import { Flame, Clock } from 'lucide-react';

interface DiscoverTabsProps {
  activeTab: DiscoverTab;
  onTabChange: (tab: DiscoverTab) => void;
  total: number;
}

const tabs: { key: DiscoverTab; label: string; icon: React.ElementType }[] = [
  { key: 'hot', label: '热门宇宙', icon: Flame },
  { key: 'latest', label: '最新发布', icon: Clock },
];

const DiscoverTabs: React.FC<DiscoverTabsProps> = ({ activeTab, onTabChange, total }) => {
  return (
    <div className="flex items-center gap-2 mb-6 bg-ink-50/50 dark:bg-ink-800/50 p-1.5 rounded-2xl">
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-fast ${
              active
                ? 'bg-white dark:bg-ink-700 text-ink-800 dark:text-white shadow-sm'
                : 'text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        );
      })}
      <span className="ml-auto text-sm text-ink-400 dark:text-ink-500 px-2">共 {total} 个宇宙</span>
    </div>
  );
};

export default DiscoverTabs;
