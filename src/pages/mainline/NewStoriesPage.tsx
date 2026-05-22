import React, { useEffect, useState } from 'react';
import { storyService, Story } from '../../api/storyService';
import { Clock, Zap, BookOpen, ChevronRight, LayoutGrid, LayoutList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../../components/ui/Skeleton';

const NewStoriesPage: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await storyService.getAll(); // Fetch all/newest
      setStories(Array.isArray(data) ? data : (data as any)?.data || []);
    } catch (err) {
      console.error('Failed to fetch new stories', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest mb-2">
            <Zap size={14} className="fill-blue-600" />
            New Arrivals
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">新书速递</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-lg font-light max-w-2xl">
            最新的平行宇宙作品，开启第一视角探索无限可能的起点。
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            <LayoutList size={20} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <Skeleton className="aspect-[2/3] rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="pt-4 border-t border-gray-50 dark:border-gray-700">
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8" : "space-y-6"}>
          {stories.map((story) => (
            viewMode === 'grid' ? (
              <Link 
                key={story.id} 
                to={`/story/${story.id}`}
                className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
              >
                <div className="aspect-[2/3] overflow-hidden relative">
                  <img 
                    src={story.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop`} 
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {story.isOfficial && (
                    <div className="absolute top-4 left-4 px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded-md uppercase tracking-tight shadow-lg backdrop-blur-md">
                      Official
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-base font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors mb-2 line-clamp-1 leading-tight">
                    {story.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-3">
                    <span className="text-gray-400 font-medium">By</span>
                    <span className="text-gray-700 dark:text-gray-300">{story.author?.username}</span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(story.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {story._count?.chapters || 0}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <Link 
                key={story.id} 
                to={`/story/${story.id}`}
                className="group flex gap-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
              >
                <div className="w-24 md:w-32 aspect-[2/3] shrink-0 overflow-hidden rounded-2xl shadow-lg border border-gray-100 dark:border-gray-900">
                  <img 
                    src={story.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop`} 
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="flex-1 py-1 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                      {story.title}
                    </h3>
                    {story.isOfficial && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-tight shadow-sm">
                        Official
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 font-bold">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[10px]">
                        {story.author?.username?.[0] || 'A'}
                      </div>
                      <span>{story.author?.username}</span>
                    </div>
                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></span>
                    <span>{new Date(story.createdAt).toLocaleDateString()} 发布</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed line-clamp-2 text-sm max-w-3xl">
                    {story.description}
                  </p>
                </div>
                <div className="hidden md:flex flex-col items-end justify-center gap-2 pr-4 shrink-0">
                  <div className="text-lg font-black text-gray-300 group-hover:text-blue-600 transition-colors uppercase tracking-[0.2em]">View</div>
                  <ChevronRight size={24} className="text-gray-200 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )
          ))}
          
          {stories.length === 0 && (
            <div className="col-span-full py-24 text-center bg-gray-50 dark:bg-gray-900/30 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
              <Zap size={64} className="mx-auto text-gray-200 mb-6" />
              <p className="text-gray-500 font-black text-2xl">宇宙正在加速膨胀</p>
              <p className="text-gray-400 mt-2">目前还没有新书发布，快来书写宇宙的第一行字吧！</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewStoriesPage;
