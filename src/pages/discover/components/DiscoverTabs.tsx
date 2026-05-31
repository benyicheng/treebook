import React from 'react';
import { DiscoverTab } from '../hooks/useUniverseFeed';
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
    <div className="flex items-center gap-2 mb-6">
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
              active
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-400/30'
                : 'bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        );
      })}
      <span className="ml-auto text-sm text-ink-400 dark:text-ink-500">共 {total} 个宇宙</span>
    </div>
  );
};

export default DiscoverTabs;
