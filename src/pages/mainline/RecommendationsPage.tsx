import React, { useEffect, useState } from 'react';
import { storyService, Story } from '../../api/storyService';
import { BookOpen, Star, TrendingUp, ChevronRight, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteConfigStore } from '../../stores/useSiteConfigStore';

const RecommendationsPage: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { config, fetchConfig } = useSiteConfigStore();
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      await fetchConfig();
      // Parse editor picks from config
      let editorPicks = [];
      try {
        editorPicks = JSON.parse(config.editorPicks || '[]');
      } catch (e) {
        editorPicks = [];
      }

      if (editorPicks.length > 0) {
        setStories(editorPicks);
      } else {
        // Fallback to official or highly rated stories
        const data = await storyService.getAll({ isOfficial: true });
        setStories(Array.isArray(data) ? data : (data as any)?.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations', err);
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
            <Star size={14} className="fill-blue-600" />
            Editor's Choice
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">编辑推荐</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-lg font-light max-w-2xl">
            由资深编辑团队深度阅读并认证的精品佳作，包含卓越的世界观设定与叙事逻辑。
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stories.map((story) => (
            <Link 
              key={story.id} 
              to={`/story/${story.id}`}
              className="group flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
            >
              <div className="md:w-48 aspect-[2/3] shrink-0 overflow-hidden relative">
                <img 
                  src={story.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop`} 
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              
              <div className="flex-1 p-8 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider rounded-full">
                      精品主线
                    </span>
                    {story.author?.role === 'author' && (
                      <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider rounded-full">
                        官方认证
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors mb-3 leading-tight">
                  {story.title}
                </h3>
                
                <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed line-clamp-3 text-sm mb-6">
                  {story.description}
                </p>

                <div className="mt-auto pt-6 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs">
                      {story.author?.username?.[0] || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{story.author?.username}</p>
                      <p className="text-[10px] text-gray-400">{story._count?.chapters || 0} 个章节</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 font-black text-xs group-hover:gap-2 transition-all">
                    立即阅读 <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {stories.length === 0 && (
            <div className="col-span-full py-24 text-center bg-gray-50 dark:bg-gray-900/30 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
              <TrendingUp size={64} className="mx-auto text-gray-200 mb-6" />
              <p className="text-gray-500 font-black text-2xl">暂无推荐内容</p>
              <p className="text-gray-400 mt-2">编辑们正在加紧审阅，敬请期待！</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
