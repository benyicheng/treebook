import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GitBranch, Sparkles, Eye, Users } from 'lucide-react';
import { UniverseFeedItem } from '../../../api/discoverService';

interface UniverseCardProps {
  item: UniverseFeedItem;
  index?: number;
}

const statMeta = [
  { icon: BookOpen, label: '章节', key: 'chapterCount' as const, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-500/15' },
  { icon: GitBranch, label: '分支', key: 'branchCount' as const, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  { icon: Sparkles, label: '番外', key: 'spinoffCount' as const, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  { icon: Users, label: '活跃', key: 'activeReaders' as const, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/30' },
  { icon: Eye, label: '浏览', key: 'hotPathsCount' as const, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/30' },
];

const UniverseCard: React.FC<UniverseCardProps> = ({ item, index = 0 }) => {
  const statusLabel: Record<string, string> = {
    ongoing: '连载中',
    completed: '已完结',
    paused: '暂停中',
  };

  const statusStyle: Record<string, string> = {
    ongoing: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    completed: 'bg-accent-500/15 text-accent-600 dark:text-accent-400 border-accent-200 dark:border-accent-800',
    paused: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  };

  return (
    <Link
      to={`/story/${item.id}`}
      className="group block bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-accent-200 dark:hover:border-accent-600 transition-all duration-300"
    >
      {/* Cover */}
      <div className="relative h-40 bg-gradient-to-br from-accent-100 via-indigo-100 to-purple-100 dark:from-accent-500/10 dark:via-indigo-500/10 dark:to-purple-500/10 overflow-hidden">
        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={44} className="text-ink-300 dark:text-ink-600" />
          </div>
        )}

        {/* Gradient overlay at bottom for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Status badge */}
        <span
          className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle[item.status] || 'bg-ink-500/15 text-ink-500 border-ink-200'}`}
        >
          {statusLabel[item.status] || item.status}
        </span>

        {/* Title overlay on cover */}
        <h3 className="absolute bottom-3 left-3 right-3 text-base font-bold text-white drop-shadow-lg truncate">
          {item.title}
        </h3>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 space-y-3">
        {/* Author + description */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-[9px] font-bold text-white overflow-hidden shrink-0 ring-2 ring-white dark:ring-ink-700">
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
          <span className="text-xs font-semibold text-ink-500 dark:text-ink-400 truncate">
            {item.author.username}
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-ink-400 dark:text-ink-500 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 pt-1">
          {statMeta.map(({ icon: Icon, label, key, color, bg }) => (
            <div
              key={key}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${bg} ${color}`}
              title={label}
            >
              <Icon size={12} className="shrink-0" />
              <span className="text-[11px] font-bold">{item[key]}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default UniverseCard;
