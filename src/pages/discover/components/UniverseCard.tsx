import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GitBranch, Sparkles, Route, Users, Eye } from 'lucide-react';
import { UniverseFeedItem } from '../../../api/discoverService';

interface UniverseCardProps {
  item: UniverseFeedItem;
}

interface StatTileProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}

const StatTile: React.FC<StatTileProps> = ({ icon: Icon, label, value, color }) => (
  <div
    className={`flex flex-col items-center justify-center gap-0.5 p-2.5 rounded-xl ${color} transition-colors`}
  >
    <Icon size={16} className="opacity-70" />
    <span className="text-sm font-black">{value}</span>
    <span className="text-[9px] font-bold opacity-60 uppercase tracking-wider">{label}</span>
  </div>
);

const UniverseCard: React.FC<UniverseCardProps> = ({ item }) => {
  const statusLabel: Record<string, string> = {
    ongoing: '连载中',
    completed: '已完结',
    paused: '暂停中',
  };

  const statusColor: Record<string, string> = {
    ongoing: 'bg-green-500',
    completed: 'bg-accent-400',
    paused: 'bg-yellow-500',
  };

  return (
    <Link
      to={`/story/${item.id}`}
      className="group block bg-ink-50 dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 overflow-hidden hover:shadow-xl hover:border-accent-200 dark:hover:border-accent-600 transition-all duration-300"
    >
      {/* Cover */}
      <div className="relative h-32 bg-gradient-to-br from-accent-100 to-indigo-100 dark:from-accent-500/10 dark:to-accent-600/10 overflow-hidden">
        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={36} className="text-blue-300 dark:text-accent-500" />
          </div>
        )}
        <span
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white ${statusColor[item.status] || 'bg-ink-500'}`}
        >
          {statusLabel[item.status] || item.status}
        </span>
      </div>

      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-base font-bold text-ink-800 dark:text-white group-hover:text-accent-500 dark:group-hover:text-accent-400 transition-colors truncate">
          {item.title}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-[8px] font-bold text-white overflow-hidden shrink-0">
            {item.author.avatarUrl ? (
              <img
                src={item.author.avatarUrl}
                alt={item.author.username}
                className="w-full h-full object-cover"
              />
            ) : (
              item.author.username[0]?.toUpperCase()
            )}
          </div>
          <span className="text-xs font-medium text-ink-500 dark:text-ink-400 truncate">
            {item.author.username}
          </span>
          {item.description && (
            <span className="text-xs text-ink-400 dark:text-ink-500 truncate ml-auto">
              · {item.description?.slice(0, 30)}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-1.5">
          <StatTile
            icon={BookOpen}
            label="章节"
            value={item.chapterCount}
            color="bg-accent-50 text-accent-500 dark:bg-accent-500/15 dark:text-accent-400"
          />
          <StatTile
            icon={GitBranch}
            label="分支"
            value={item.branchCount}
            color="bg-purple-50 text-accent-500 dark:bg-purple-900/30 dark:text-purple-400"
          />
          <StatTile
            icon={Sparkles}
            label="番外"
            value={item.spinoffCount}
            color="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          />
          <StatTile
            icon={Route}
            label="路径"
            value={item.readingPathCount}
            color="bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400"
          />
          <StatTile
            icon={Users}
            label="活跃"
            value={item.activeReaders}
            color="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
          />
          <StatTile
            icon={Eye}
            label="浏览"
            value={item.hotPathsCount}
            color="bg-accent-50 text-accent-500 dark:bg-accent-500/15 dark:text-accent-400"
          />
        </div>
      </div>
    </Link>
  );
};

export default UniverseCard;
