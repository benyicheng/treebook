import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Compass } from 'lucide-react';
import { Story } from '../../api/storyService';
import { Skeleton } from '../ui/Skeleton';
import { coverFallback, stagger, fadeUp } from './shared';

interface ExploreSectionProps {
  sortedStories: Story[];
  storiesLoading: boolean;
  exploreTab: string;
  setExploreTab: (tab: string) => void;
}

const ExploreSection: React.FC<ExploreSectionProps> = ({ sortedStories, storiesLoading, exploreTab, setExploreTab }) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-60px' }}
    variants={stagger}
    className="mt-16 pt-12 border-t border-ink-200/70 dark:border-ink-700/70 relative"
  >
    {/* Section background */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-50/30 to-transparent dark:via-accent-600/5 pointer-events-none" />

    <div className="relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-9">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 shadow-sm">
            <Compass size={14} className="text-white" />
          </div>
          <h2 className="text-xl font-black text-ink-800 dark:text-white tracking-tight">探索全站</h2>
        </div>
        <div className="flex items-center gap-1 p-1 bg-ink-100/80 dark:bg-ink-700/60 backdrop-blur-sm rounded-xl border border-ink-200/50 dark:border-ink-600/50">
          {['热门', '新书', '官方', '完结'].map(tab => (
            <button
              key={tab}
              onClick={() => setExploreTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                exploreTab === tab
                  ? 'bg-white dark:bg-ink-600 text-ink-800 dark:text-white shadow-md'
                  : 'text-ink-500 hover:text-ink-600 dark:hover:text-ink-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {storiesLoading && sortedStories.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <Skeleton className="aspect-[3/4] rounded-2xl mb-3" />
              <Skeleton className="h-4 w-3/4 mb-1.5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : sortedStories.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-ink-100 dark:bg-ink-700 flex items-center justify-center">
            <Search size={24} className="text-ink-400" />
          </div>
          <p className="text-ink-400 dark:text-ink-500 text-sm font-medium">暂无 {exploreTab} 相关内容</p>
        </div>
      ) : (
        <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {sortedStories.slice(0, 12).map((story, i) => (
            <motion.div key={story.id} variants={fadeUp} custom={i}>
              <Link to={`/story/${story.id}`} className="group block">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 bg-ink-100 dark:bg-ink-700 
                  shadow-md group-hover:shadow-2xl group-hover:-translate-y-1.5 transition-all duration-300
                  ring-1 ring-black/5">
                  <img
                    src={story.coverImage || coverFallback}
                    alt={story.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform">
                    <p className="text-xs text-white/90 line-clamp-2 font-medium drop-shadow-lg">
                      {story.description || '暂无简介'}
                    </p>
                  </div>
                  {story.status === 'completed' && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-accent-400/90 backdrop-blur-sm text-white text-[9px] font-black rounded-full shadow-lg shadow-accent-400/30">
                      完结
                    </div>
                  )}
                  {story.isOfficial && !story.status?.includes('completed') && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-[9px] font-black rounded-full uppercase shadow-lg shadow-accent-400/30">
                      官方
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-bold text-ink-800 dark:text-white group-hover:text-accent-500 transition-colors line-clamp-1 mb-1">
                  {story.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
                  <span className="font-medium truncate">{story.author?.username}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  </motion.section>
);

export default ExploreSection;
