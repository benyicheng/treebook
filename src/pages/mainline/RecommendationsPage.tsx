import React, { useEffect } from 'react';
import { BookOpen, Star, TrendingUp, ChevronRight, Filter, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteConfigStore } from '../../stores/useSiteConfigStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRecommendations, useFallbackStories, RecItem } from '../../hooks/useRecommendations';

const RecommendationsPage: React.FC = () => {
  const { config } = useSiteConfigStore();
  const { user } = useAuthStore();

  // ── Data fetching with React Query ──
  // Personalized recommendations (only if logged in)
  const {
    data: recItems = [],
    isLoading: recLoading,
    error: recError,
  } = useRecommendations(16);

  // Fallback: editor picks or official stories
  const {
    data: fallbackStories = [],
    isLoading: fallbackLoading,
  } = useFallbackStories(16);

  // Trigger config fetch on mount
  useEffect(() => {
    useSiteConfigStore.getState().fetchConfig();
  }, []);

  const isLoading = recLoading || fallbackLoading;
  const usingFallback = recItems.length === 0;
  const displayItems: RecItem[] = usingFallback
    ? (fallbackStories as any as RecItem[])
    : recItems;

  const getItemLink = (item: RecItem): string => {
    const type = (item as any).type || 'story';
    switch (type) {
      case 'story': return `/story/${item.id}`;
      case 'branch': return `/branch/${item.id}`;
      case 'spinoff': return `/spinoff/${item.id}`;
      default: return `/story/${item.id}`;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'following_network': return '好友在看';
      case 'similar_tags': return '与你兴趣相关';
      case 'hot': return '热门推荐';
      default: return '';
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'following_network': return 'bg-purple-50 text-accent-500';
      case 'similar_tags': return 'bg-accent-50 text-accent-500';
      case 'hot': return 'bg-amber-50 text-amber-600';
      default: return 'bg-ink-50 text-ink-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-3xl font-black text-ink-800 dark:text-white tracking-tight">
          {recItems.length > 0 ? '个性化推荐' : '编辑推荐'}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayItems.map((item) => (
            <Link
              key={`${'type' in item ? (item as any).type || 'story' : 'story'}-${item.id}`}
              to={getItemLink(item)}
              className="group flex flex-col md:flex-row bg-ink-50 dark:bg-ink-700 rounded-[2.5rem] border border-ink-100 dark:border-ink-600 overflow-hidden hover:shadow-2xl hover:shadow-accent-400/10 transition-all duration-500"
            >
              <div className="md:w-48 shrink-0 p-6 flex items-center justify-center relative bg-gradient-to-br from-accent-50 to-purple-50 dark:from-accent-700/30 dark:to-accent-600/30">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-ink-50 dark:bg-ink-700 shadow-lg flex items-center justify-center">
                    <BookOpen size={28} className="text-accent-400" />
                  </div>
                  {usingFallback ? null : (
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${getReasonColor((item as RecItem).reason)}`}>
                      {getReasonLabel((item as RecItem).reason)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 p-8 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-accent-50 dark:bg-accent-500/15 text-accent-500 dark:text-accent-400 text-[10px] font-black uppercase tracking-wider rounded-full">
                      {usingFallback ? '精品主线' : ('type' in item ? (item as any).type || 'story' : 'story') === 'story' ? '主线' : ('type' in item ? (item as any).type || 'story' : 'story') === 'branch' ? '分支' : '番外'}
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-ink-800 dark:text-white group-hover:text-accent-500 transition-colors mb-3 leading-tight">
                  {item.title}
                </h3>

                <p className="text-ink-500 dark:text-ink-400 font-light leading-relaxed line-clamp-3 text-sm mb-6">
                  {item.description || '暂无简介'}
                </p>

                <div className="mt-auto pt-6 border-t border-ink-50 dark:border-ink-600 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center text-accent-500 dark:text-accent-400 font-black text-xs">
                      {(item as any).author?.username?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink-600 dark:text-ink-300">{(item as any).author?.username || '未知'}</p>
                      <p className="text-[10px] text-ink-400">{(item as any).viewCount || 0} 次浏览</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-accent-500 font-black text-xs group-hover:gap-2 transition-all">
                    立即阅读 <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {displayItems.length === 0 && (
            <div className="col-span-full py-24 text-center bg-ink-50 dark:bg-ink-800/30 rounded-[3rem] border-2 border-dashed border-ink-200 dark:border-ink-700">
              <TrendingUp size={64} className="mx-auto text-ink-200 mb-6" />
              <p className="text-ink-500 font-black text-2xl">暂无推荐内容</p>
              <p className="text-ink-400 mt-2">编辑们正在加紧审阅，敬请期待！</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
