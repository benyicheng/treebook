import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import SectionTitle from './SectionTitle';
import { coverFallback, stagger, fadeUp } from './shared';

interface EditorPicksProps {
  displayedPicks: { id?: string; title?: string; author?: string; cover?: string; description?: string }[];
  storiesLoading: boolean;
}

const EditorPicks: React.FC<EditorPicksProps> = ({ displayedPicks, storiesLoading }) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-60px' }}
    variants={stagger}
  >
    <SectionTitle
      icon={Star}
      gradient="from-amber-400 to-orange-500"
      title="编辑推荐"
      link="/recommendations"
      linkText="查看全部"
    />
    {storiesLoading && displayedPicks.length === 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5 border border-ink-100 dark:border-ink-700 space-y-4 bg-white/50 dark:bg-ink-700/30 backdrop-blur-sm">
            <div className="flex gap-4">
              <Skeleton className="w-[68px] h-[96px] rounded-xl" />
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : displayedPicks.length === 0 ? (
      <EmptyState
        icon={Star}
        title="暂无编辑推荐"
        description="编辑团队正在精选优质作品，敬请期待"
        compact
      />
    ) : (
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedPicks.map((pick: any, i: number) => (
          <motion.div key={pick.id} variants={fadeUp} custom={i}>
            <Link
              to={`/story/${pick.id}`}
              className="group relative flex gap-5 p-4 rounded-2xl border border-ink-100 dark:border-ink-700 
                bg-white/70 dark:bg-ink-700/30 backdrop-blur-sm
                hover:border-amber-200/70 dark:hover:border-amber-800/50 
                hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5
                transition-all duration-300 overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-orange-500/0 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />
              {/* Cover */}
              <div className="w-[68px] aspect-[2/3] shrink-0 rounded-xl overflow-hidden shadow-md ring-1 ring-black/5">
                <img
                  src={pick.coverImage || coverFallback}
                  alt={pick.title}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = coverFallback }}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h3 className="text-sm font-bold text-ink-800 dark:text-white group-hover:text-amber-600 transition-colors line-clamp-1">
                    {pick.title}
                  </h3>
                  {pick.isOfficial && (
                    <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black rounded-full shrink-0 shadow-sm">
                      官方
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-400 mb-1.5 font-medium">
                  {pick.author?.username || pick.author}
                </p>
                <p className="text-xs text-ink-400 dark:text-ink-500 line-clamp-2 leading-relaxed">
                  {pick.comment || pick.description || '暂无简介'}
                </p>
                
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    )}
  </motion.section>
);

export default EditorPicks;
