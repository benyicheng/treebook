import React, { useState, useEffect } from 'react';
import { Story } from '../../api/storyService';
import { useStories } from '../../hooks/useStories';
import { BookOpen, Search, Filter, ChevronRight, Hash, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../../components/ui/Skeleton';

const AllStoriesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { data: storiesData, isLoading } = useStories({ q: debouncedSearch || undefined });
  const stories: Story[] = Array.isArray(storiesData) ? storiesData : (storiesData as any)?.data || [];
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-50 dark:bg-accent-500/15 text-accent-500 dark:text-accent-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-accent-100 dark:border-accent-600/50 shadow-sm shadow-accent-400/5">
            <BookOpen size={14} className="fill-accent-500/10" />
            Universe Explorer
          </div>
          <h1 className="text-5xl font-black text-ink-800 dark:text-white tracking-tight leading-none">
            主线宇宙
          </h1>
          <p className="text-ink-500 dark:text-ink-400 text-xl font-light max-w-2xl leading-relaxed">
            探索所有核心叙事线。每一个故事都是一个完整宇宙的基石，承载着无数分叉的可能。
          </p>
        </div>
        
        <div className="relative group md:w-80">
          <input 
            type="text" 
            placeholder="搜索主线故事..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-ink-50 dark:bg-ink-700 rounded-[2rem] border border-ink-100 dark:border-ink-600 focus:outline-none focus:ring-4 focus:ring-accent-400/10 focus:border-accent-400 transition-all text-ink-800 dark:text-white font-bold placeholder:text-ink-300 shadow-xl shadow-ink-200/50 dark:shadow-none"
          />
          <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-ink-300 group-focus-within:text-accent-500 transition-colors" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col bg-ink-50 dark:bg-ink-700 rounded-[3rem] border border-ink-100 dark:border-ink-600 overflow-hidden">
              <Skeleton className="aspect-[16/10] rounded-none" />
              <div className="p-8 space-y-3">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-6 w-16 rounded-lg" />
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {stories.map((story) => (
            <Link 
              key={story.id} 
              to={`/story/${story.id}`}
              className="group flex flex-col bg-ink-50 dark:bg-ink-700 rounded-[3rem] border border-ink-100 dark:border-ink-600 overflow-hidden hover:shadow-2xl hover:shadow-accent-400/15 transition-all duration-500 transform hover:-translate-y-2"
            >
              <div className="aspect-[16/10] overflow-hidden relative">
                <img 
                  src={story.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=400&fit=crop`} 
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex gap-2 mb-3">
                    {story.isOfficial && (
                      <span className="px-2.5 py-1 bg-amber-500 text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow-lg">
                        Premium
                      </span>
                    )}
                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow-lg">
                      Mainline
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                    {story.title}
                  </h3>
                </div>
              </div>
              
              <div className="p-8 flex flex-col flex-grow">
                <p className="text-ink-500 dark:text-ink-400 font-light leading-relaxed line-clamp-3 text-sm mb-8 flex-grow">
                  {story.description}
                </p>

                <div className="pt-6 border-t border-ink-50 dark:border-ink-600 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-600 flex items-center justify-center text-ink-400 group-hover:text-accent-500 group-hover:border-accent-100 transition-all font-black text-sm">
                      {story.author?.username?.[0] || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink-800 dark:text-white">{story.author?.username}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-ink-400 font-medium">{story._count?.chapters || 0} 章节</span>
                        <span className="w-1 h-1 bg-ink-200 rounded-full"></span>
                        <span className="text-[10px] text-ink-400 font-medium">1.2k 活跃度</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-12 h-12 rounded-2xl bg-accent-50 dark:bg-accent-500/10 text-accent-500 flex items-center justify-center transition-all group-hover:bg-accent-500 group-hover:text-white shadow-xl shadow-accent-400/5 group-hover:shadow-accent-400/20">
                    <ArrowRight size={24} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {stories.length === 0 && (
            <div className="col-span-full py-32 text-center bg-ink-50 dark:bg-ink-800/20 rounded-[4rem] border-4 border-dotted border-ink-100 dark:border-ink-700">
              <Search size={80} className="mx-auto text-ink-200 mb-8" />
              <p className="text-ink-500 font-black text-3xl">未找到匹配的宇宙</p>
              <p className="text-ink-400 mt-3 text-lg">换个关键词试试，或者由你来创造它？</p>
              <Link 
                to="/story/create"
                className="mt-10 inline-flex items-center gap-2 px-10 py-4 bg-accent-500 text-white rounded-[2rem] font-black hover:bg-accent-600 transition-all shadow-2xl shadow-accent-400/20"
              >
                开启新主线 <ArrowRight size={20} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllStoriesPage;
