import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Eye } from 'lucide-react';
import { Story } from '../../api/storyService';
import { Skeleton } from '../ui/Skeleton';
import SectionTitle from './SectionTitle';
import { coverFallback, stagger, fadeUp } from './shared';

interface NewStoriesGridProps {
  stories: Story[];
  storiesLoading: boolean;
}

const NewStoriesGrid: React.FC<NewStoriesGridProps> = ({ stories, storiesLoading }) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-60px' }}
    variants={stagger}
  >
    <SectionTitle
      icon={Zap}
      gradient="from-sky-400 to-accent-500"
      title="新书速递"
      link="/new"
      linkText="浏览更多"
    />
    {storiesLoading ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <Skeleton className="aspect-[3/4] rounded-2xl mb-3" />
            <Skeleton className="h-4 w-3/4 mb-1.5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    ) : (
      <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {stories.slice(0, 4).map((story, i) => (
          <motion.div key={story.id} variants={fadeUp} custom={i}>
            <Link to={`/story/${story.id}`} className="group block">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3.5 bg-ink-100 dark:bg-ink-700 shadow-md group-hover:shadow-2xl group-hover:-translate-y-1.5 transition-all duration-300 ring-1 ring-black/5">
                <img
                  src={story.coverImage || coverFallback}
                  alt={story.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-xs text-white/90 line-clamp-2 font-medium leading-relaxed drop-shadow-lg">
                    {story.description || '暂无简介'}
                  </p>
                </div>
                {story.isOfficial && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-[9px] font-black rounded-full uppercase shadow-lg shadow-accent-400/30">
                    官方
                  </div>
                )}
                {story.status === 'completed' && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-accent-400/90 backdrop-blur-sm text-white text-[9px] font-black rounded-full shadow-lg">
                    完结
                  </div>
                )}
              </div>
              <h3 className="text-sm font-bold text-ink-800 dark:text-white group-hover:text-accent-500 transition-colors line-clamp-1 mb-1">
                {story.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
                <span className="font-medium truncate">{story.author?.username}</span>
                {(story as any).viewCount > 0 && (
                  <>
                    <span className="text-ink-300 dark:text-ink-500">·</span>
                    <span className="flex items-center gap-0.5">
                      <Eye size={11} /> {(story as any).viewCount}
                    </span>
                  </>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    )}
  </motion.section>
);

export default NewStoriesGrid;
