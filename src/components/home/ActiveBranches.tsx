import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitBranch, ChevronRight } from 'lucide-react';
import { Branch } from '../../api/storyService';
import { Skeleton } from '../ui/Skeleton';
import SectionTitle from './SectionTitle';
import { timeAgo } from '../../lib/utils';
import { stagger, fadeUp } from './shared';

interface ActiveBranchesProps {
  newBranches: Branch[];
}

const ActiveBranches: React.FC<ActiveBranchesProps> = ({ newBranches }) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-60px' }}
    variants={stagger}
  >
    <SectionTitle
      icon={GitBranch}
      gradient="from-purple-500 to-accent-600"
      title="活跃分支"
      link="/branches"
      linkText="探索分支"
    />
    {newBranches.length === 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5 border border-ink-100 dark:border-ink-700 space-y-3 bg-white/50 dark:bg-ink-700/30">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    ) : (
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {newBranches.slice(0, 4).map((branch, i) => (
          <motion.div key={branch.id} variants={fadeUp} custom={i}>
            <Link
              to={`/branch/${branch.id}`}
              className="group relative block p-5 rounded-2xl border border-ink-100 dark:border-ink-700 
                bg-white/70 dark:bg-ink-700/30 backdrop-blur-sm
                hover:border-purple-200/70 dark:hover:border-purple-800/50 
                hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-0.5
                transition-all duration-300 overflow-hidden"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-accent-400/0 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-full">
                    <GitBranch size={10} />
                    分支
                  </span>
                  <span className="text-xs text-ink-400 dark:text-ink-500 truncate font-medium">
                    衍生自：{branch.parentStory?.title}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-ink-800 dark:text-white group-hover:text-accent-500 dark:group-hover:text-purple-400 transition-colors mb-2 line-clamp-1">
                  {branch.title}
                </h4>
                {branch.description && (
                  <p className="text-xs text-ink-400 dark:text-ink-500 line-clamp-2 mb-3 leading-relaxed">
                    {branch.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
                    <span className="font-medium">{branch.author?.username}</span>
                    <span className="text-ink-300 dark:text-ink-500">·</span>
                    <span>{timeAgo(branch.updatedAt || branch.createdAt)}</span>
                  </div>
                  <span className="text-purple-400 group-hover:text-accent-500 transition-colors font-bold text-xs flex items-center gap-0.5">
                    查看详情 <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    )}
  </motion.section>
);

export default ActiveBranches;
