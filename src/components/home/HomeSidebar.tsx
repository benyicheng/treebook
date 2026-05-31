import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Users, GitBranch, Flame, BookMarked, Route } from 'lucide-react';
import { Story, Branch, Booklist } from '../../api/storyService';
import { Skeleton } from '../ui/Skeleton';

interface SiteStats {
  stories: number;
  users: number;
  branches: number;
}

interface HomeSidebarProps {
  stories: Story[];
  stats?: SiteStats;
  newBranches: Branch[];
  storiesLoading: boolean;
  hotBooklists: Booklist[];
  hotReadingPaths: any[];
}

const HomeSidebar: React.FC<HomeSidebarProps> = ({
  stories, stats, newBranches, storiesLoading, hotBooklists, hotReadingPaths,
}) => (
  <div className="lg:w-[32%] space-y-8">
    {/* Quick Stats */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-3 gap-3"
    >
      {[
        { icon: BookOpen, label: '作品', value: stats?.stories ?? stories.length, gradient: 'from-accent-400 to-accent-600', shadow: 'shadow-accent-400/20' },
        { icon: Users, label: '作者', value: stats?.users ?? 0, gradient: 'from-accent-400 to-teal-600', shadow: 'shadow-accent-400/20' },
        { icon: GitBranch, label: '分支', value: stats?.branches ?? newBranches.length, gradient: 'from-purple-500 to-accent-600', shadow: 'shadow-purple-500/20' },
      ].map((stat) => (
        <div
          key={stat.label}
          className="group p-4 rounded-2xl border border-ink-100 dark:border-ink-700 
            bg-white/70 dark:bg-ink-700/30 backdrop-blur-sm text-center 
            hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
          <div className={`w-9 h-9 mx-auto mb-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} 
            flex items-center justify-center shadow-lg ${stat.shadow} 
            group-hover:scale-110 transition-transform duration-300`}>
            <stat.icon size={15} className="text-white" />
          </div>
          <div className="text-xl font-black text-ink-800 dark:text-white tabular-nums">
            {stat.value || 0}
          </div>
          <div className="text-[10px] text-ink-400 font-bold uppercase tracking-widest mt-0.5">
            {stat.label}
          </div>
        </div>
      ))}
    </motion.div>

    {/* Hot Ranking */}
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 shadow-sm">
          <Flame size={13} className="text-white" />
        </div>
        <h3 className="text-sm font-black text-ink-800 dark:text-white flex-1 tracking-tight">热度排行榜</h3>
      </div>
      <div className="rounded-2xl border border-ink-100 dark:border-ink-700 
        bg-white/70 dark:bg-ink-700/30 backdrop-blur-sm p-4 shadow-sm">
        {storiesLoading && stories.length === 0 ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 animate-pulse border-b border-ink-50 dark:border-ink-800 last:border-0">
              <Skeleton className="w-6 h-6 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/4" />
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col">
            {stories.slice(0, 7).map((story: any, index) => (
              <Link
                key={story.id}
                to={`/story/${story.id}`}
                className="flex items-center gap-3 py-3 group border-b border-ink-50 dark:border-ink-800 last:border-0 
                  hover:bg-gradient-to-r hover:from-ink-50 hover:to-transparent dark:hover:from-ink-700/30 dark:hover:to-transparent
                  -mx-2 px-2 rounded-xl transition-all duration-200"
              >
                <span className={`w-7 h-7 flex items-center justify-center text-xs font-black rounded-xl shrink-0 transition-transform group-hover:scale-110 ${
                  index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/20' :
                  index === 1 ? 'bg-gradient-to-br from-ink-300 to-ink-400 text-white shadow-md' :
                  index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white shadow-md' :
                  'bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink-800 dark:text-white group-hover:text-accent-500 dark:group-hover:text-accent-400 transition-colors truncate">
                    {story.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-400 mt-0.5">
                    <span className="font-medium">{story.author?.username}</span>
                  </div>
                </div>
                {index < 3 && (
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    index === 0 ? 'bg-orange-500' : index === 1 ? 'bg-ink-400' : 'bg-amber-700'
                  }`} />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.section>

    {/* Hot Booklists */}
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 shadow-sm">
          <BookMarked size={13} className="text-white" />
        </div>
        <h3 className="text-sm font-black text-ink-800 dark:text-white flex-1 tracking-tight">精选书单</h3>
        <Link to="/booklist" className="text-xs font-bold text-accent-500 hover:text-accent-600 transition-colors">
          全部
        </Link>
      </div>
      <div className="space-y-3">
        {hotBooklists.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 border border-ink-100 dark:border-ink-700 space-y-2 bg-white/50 dark:bg-ink-700/30">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        ) : (
          hotBooklists.map((list, i) => (
            <motion.div
              key={list.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + i * 0.08 }}
            >
              <Link
                to={`/booklist/${list.id}`}
                className="group block p-4 rounded-2xl border border-ink-100 dark:border-ink-700 
                  bg-white/70 dark:bg-ink-700/30 backdrop-blur-sm
                  hover:border-emerald-200/70 dark:hover:border-accent-600/50 
                  hover:shadow-md hover:shadow-accent-400/5 hover:-translate-y-0.5
                  transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${
                    ['from-emerald-400 to-teal-500', 'from-sky-400 to-accent-400', 'from-rose-400 to-pink-500', 'from-amber-400 to-orange-500', 'from-violet-400 to-purple-500'][i % 5]
                  } flex items-center justify-center shadow-sm shrink-0`}>
                    <BookMarked size={13} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-ink-800 dark:text-white group-hover:text-accent-500 dark:group-hover:text-accent-400 transition-colors line-clamp-1">
                      {list.title}
                    </h4>
                    <p className="text-xs text-ink-400 dark:text-ink-500 mt-1">
                      {(list as any)._count?.items || 0} 部作品 · 来自 {list.creator?.username || '资深编辑'}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </motion.section>

    {/* Hot Reading Paths */}
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-400 to-accent-600 shadow-sm">
          <Route size={13} className="text-white" />
        </div>
        <h3 className="text-sm font-black text-ink-800 dark:text-white flex-1 tracking-tight">阅读路径</h3>
        <Link to="/reading-paths" className="text-xs font-bold text-accent-600 hover:text-accent-700 transition-colors">
          全部
        </Link>
      </div>
      <div className="space-y-3">
        {hotReadingPaths.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 border border-ink-100 dark:border-ink-700 space-y-2 bg-white/50 dark:bg-ink-700/30">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        ) : (
          hotReadingPaths.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
            >
              <Link
                to={`/reading-path/${p.id}`}
                className="group block p-4 rounded-2xl border border-ink-100 dark:border-ink-700 
                  bg-white/70 dark:bg-ink-700/30 backdrop-blur-sm
                  hover:border-indigo-200/70 dark:hover:border-indigo-800/50 
                  hover:shadow-md hover:shadow-accent-500/5 hover:-translate-y-0.5
                  transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${
                    ['from-indigo-400 to-accent-400', 'from-blue-400 to-cyan-500', 'from-fuchsia-400 to-pink-500'][i % 3]
                  } flex items-center justify-center shadow-sm shrink-0`}>
                    <Route size={13} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-ink-800 dark:text-white group-hover:text-accent-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {p.title}
                    </h4>
                    <p className="text-xs text-ink-400 dark:text-ink-500 mt-1">
                      {p.nodeCount || 0} 个节点 · {p.viewCount || 0} 次浏览
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </motion.section>
  </div>
);

export default HomeSidebar;
