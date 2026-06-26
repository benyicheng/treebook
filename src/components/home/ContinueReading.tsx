import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import { coverFallback, stagger, fadeUp } from './shared';

interface ContinueReadingProps {
  recentReads: any[];
}

const ContinueReading: React.FC<ContinueReadingProps> = ({ recentReads }) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-60px' }}
    variants={stagger}
  >
    <div className="flex items-center gap-2.5 mb-5">
      <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-400 to-accent-500 shadow-sm">
        <Clock size={13} className="text-white" />
      </div>
      <h3 className="text-sm font-black text-ink-800 dark:text-white flex-1 tracking-tight">继续阅读</h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {recentReads.map((item: any, i: number) => (
        <motion.div key={item.id} variants={fadeUp} custom={i}>
          <Link
            to={`/story/${item.story?.id || '#'}/read?chapter=${item.id}`}
            className="group flex items-start gap-4 p-3.5 rounded-2xl bg-ink-50 dark:bg-ink-800/50 border border-ink-100 dark:border-ink-700/60 hover:border-violet-200 dark:hover:border-violet-800/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            {/* Cover thumbnail */}
            <div className="relative w-14 h-[70px] rounded-xl overflow-hidden flex-shrink-0 bg-ink-100 dark:bg-ink-700 ring-1 ring-black/5">
              <img
                src={item.story?.coverImage || coverFallback}
                alt={item.story?.title}
                loading="lazy"
                onError={(e) => { e.currentTarget.src = coverFallback }}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink-800 dark:text-white group-hover:text-accent-600 transition-colors line-clamp-1">
                {item.story?.title || '未知故事'}
              </p>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 line-clamp-1">
                第 {item.title} 章
              </p>
              {typeof item.progress === 'number' && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-ink-100 dark:bg-ink-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all"
                      style={{ width: `${Math.min(item.progress * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-ink-400">
                    {Math.round(Math.min(item.progress * 100, 100))}%
                  </span>
                </div>
              )}
            </div>
            <ArrowRight size={14} className="text-ink-300 dark:text-ink-500 group-hover:text-accent-400 group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
          </Link>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

export default ContinueReading;
