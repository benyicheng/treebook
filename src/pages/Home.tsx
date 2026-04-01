import React, { useEffect, useState, useRef } from 'react';
import { useStoryStore } from '../stores/useStoryStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useSiteConfigStore } from '../stores/useSiteConfigStore';
import { storyService, Story } from '../api/storyService';
import { branchService, Branch } from '../api/storyService';
import { booklistService, Booklist } from '../api/storyService';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Search, 
  BookOpen, 
  GitBranch, 
  Clock, 
  Star, 
  TrendingUp, 
  Zap, 
  Heart, 
  Crown,
  Layout,
  BarChart3,
  Tag,
  Sparkles,
  Globe
} from 'lucide-react';
// ══════════════ 豆瓣风格简约组件 ══════════════

const DoubanSectionHeader: React.FC<{ 
  title: string; 
  link?: string;
  linkText?: string;
}> = ({ title, link, linkText = '更多' }) => (
  <div className="flex items-end justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
    <h2 className="text-xl font-medium text-gray-900 dark:text-white tracking-tight">
      {title}
    </h2>
    {link && (
      <Link to={link} className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-0.5 mb-0.5">
        {linkText} <ChevronRight size={14} />
      </Link>
    )}
  </div>
);

const DoubanStoryCard: React.FC<{ story: any; showDesc?: boolean; variant?: 'grid' | 'list' }> = ({ story, showDesc = false, variant = 'grid' }) => {
  if (variant === 'list') {
    return (
      <Link to={`/story/${story.id}`} className="group flex gap-5 py-3 border-b border-gray-50 dark:border-gray-900 last:border-0">
        <div className="w-20 aspect-[2/3] shrink-0 rounded-[2px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
          <img
            src={story.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop`}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="flex-1 py-0.5">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
            {story.title}
          </h3>
          <div className="text-[13px] text-gray-500 mb-1 flex items-center gap-2">
            <span>{story.author?.username}</span>
            <span className="text-gray-300">•</span>
            <span>{story.isOfficial ? '官方' : '社区'}</span>
          </div>
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {story.description}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/story/${story.id}`} className="group block">
      <div className="relative aspect-[2/3] rounded-[3px] overflow-hidden mb-2.5 bg-gray-50 dark:bg-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all group-hover:shadow-lg group-hover:-translate-y-0.5">
        <img
          src={story.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop`}
          alt={story.title}
          className="w-full h-full object-cover"
        />
        {story.isOfficial && (
          <div className="absolute top-0 left-0 px-1.5 py-0.5 bg-blue-600/90 text-white text-[10px] font-medium rounded-br-sm backdrop-blur-sm">
            OFFICIAL
          </div>
        )}
      </div>
      <div className="space-y-0.5">
        <h3 className="text-[13px] font-medium text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 transition-colors leading-snug">
          {story.title}
        </h3>
        <p className="text-[11px] text-gray-500 truncate">{story.author?.username}</p>
        {showDesc && (
          <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-relaxed h-7">
            {story.description}
          </p>
        )}
      </div>
    </Link>
  );
};

const DoubanRankingItem: React.FC<{ story: any; index: number }> = ({ story, index }) => (
  <Link to={`/story/${story?.id}`} className="flex items-center gap-3 py-2 group border-b border-gray-50 dark:border-gray-900 last:border-0">
    <span className={`w-4 text-[13px] font-medium italic shrink-0 text-center ${
      index < 3 ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-700'
    }`}>
      {index + 1}
    </span>
    <div className="flex-1 min-w-0">
      <div className="text-[13px] text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors truncate">
        {story?.title}
      </div>
      <div className="text-[10px] text-gray-400 mt-0.5">
        {story?.author?.username}
      </div>
    </div>
  </Link>
);

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { stories, fetchStories, isLoading } = useStoryStore();
  const { user } = useAuthStore();
  const { config, fetchConfig } = useSiteConfigStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentReads, setRecentReads] = useState<any[]>([]);
  const [hotBooklists, setHotBooklists] = useState<Booklist[]>([]);
  const [newBranches, setNewBranches] = useState<Branch[]>([]);
  const bannerRef = useRef<HTMLDivElement>(null);

  // 解析 Banner 轮播图
  let bannerSlides = [];
  try {
    bannerSlides = JSON.parse(config.bannerSlides || '[]');
  } catch (e) {
    bannerSlides = [];
  }

  const slideData = bannerSlides[0] || {};
  const activeSlide = {
    imageUrl: slideData.imageUrl || slideData.image || 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&h=400&fit=crop',
    title: slideData.title || '平行宇宙创作计划',
    description: slideData.description || slideData.subtitle || '汇聚全球万千创作者，在这里，每一个故事都有无限可能。加入我们，共同探索叙事的边界。',
    buttonText: slideData.buttonText || slideData.badge || '开始创作',
    link: slideData.link || '#'
  };

  // 解析编辑推荐
  let editorPicks = [];
  try {
    editorPicks = JSON.parse(config.editorPicks || '[]');
  } catch (e) {
    editorPicks = [];
  }

  const displayedPicks = editorPicks.length > 0 ? editorPicks : stories.slice(0, 4);

  useEffect(() => {
    fetchStories();
    fetchConfig();
    fetchRecentReads();
    fetchHotBooklists();
    fetchNewBranches();
  }, [fetchStories, fetchConfig]);

  const fetchRecentReads = async () => {
    try { const data = await storyService.getRecentReads(); setRecentReads(data); }
    catch (err) { console.error('Failed to fetch recent reads'); }
  };

  const fetchHotBooklists = async () => {
    try { const data = await booklistService.getAll(); setHotBooklists(data.slice(0, 5)); }
    catch (err) { console.error('Failed to fetch hot booklists'); }
  };

  const fetchNewBranches = async () => {
    try { const data = await branchService.getAll(); setNewBranches(data.slice(0, 8)); }
    catch (err) { console.error('Failed to fetch new branches'); }
  };

  // 模拟分类数据
  const categorySections = [
    { title: '悬疑 · 幻想', icon: Zap, tags: ['无限流', '赛博朋克', '克苏鲁'], color: 'amber' },
    { title: '都市 · 言情', icon: Heart, tags: ['破镜重圆', '职场', '先婚后爱'], color: 'pink' },
    { title: '历史 · 权谋', icon: Crown, tags: ['群像', '权谋', '架空'], color: 'emerald' },
  ];

  return (
    <div className="pb-16 -mx-4 md:-mx-10 bg-white dark:bg-gray-950 font-sans">

      <div className="max-w-6xl mx-auto px-6 md:px-10 mt-1">
        
        {/* ══════════════ 豆瓣式 Banner ══════════════ */}
        <section className="relative w-full aspect-[21/6] rounded-[4px] overflow-hidden mb-8 shadow-sm border border-gray-100 dark:border-gray-900 group">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
               style={{ backgroundImage: `url(${activeSlide.imageUrl})` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent dark:from-black/80 dark:via-black/40" />
          <div className="absolute inset-y-0 left-10 flex flex-col justify-center max-w-sm">
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-3 tracking-tight leading-tight">
              {activeSlide.title}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {activeSlide.description}
            </p>
            <button 
              onClick={() => navigate?.(activeSlide.link || '#')}
              className="w-fit px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-[2px] hover:bg-gray-800 transition-all"
            >
              {activeSlide.buttonText || '查看详情'}
            </button>
          </div>
        </section>

        {/* ══════════════ 核心布局：75/25 分离 ══════════════ */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* 左侧主内容区 (75%) */}
          <div className="lg:w-[72%]">
            
            {/* 编辑推荐 (List Style) */}
            <section className="mb-8">
              <DoubanSectionHeader title="编辑推荐" link="/recommendations" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
                {displayedPicks.map((pick: any) => (
                  <Link key={pick.id} to={`/story/${pick.id}`} className="group flex gap-5 py-3 border-b border-gray-50 dark:border-gray-900 last:border-0">
                    <div className="w-20 aspect-[2/3] shrink-0 rounded-[2px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                      <img
                        src={pick.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop`}
                        alt={pick.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 py-0.5">
                      <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {pick.title}
                      </h3>
                      <div className="text-[13px] text-gray-500 mb-1 flex items-center gap-2">
                        <span>{pick.author?.username || pick.author}</span>
                        <span className="text-gray-300">•</span>
                        <span>{pick.badge || '推荐'}</span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {pick.comment || pick.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* 新书速递 (Grid Style) */}
            <section className="mb-8">
              <DoubanSectionHeader title="新书速递" link="/new" />
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-6 gap-y-8">
                {stories.slice(4, 9).map(story => (
                  <DoubanStoryCard key={story.id} story={story} showDesc />
                ))}
              </div>
            </section>

            {/* 分类专区 */}
            {categorySections.map((sec, idx) => (
              <section key={idx} className="mb-8">
                <DoubanSectionHeader title={sec.title} link="#" />
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
                  {stories.slice(idx * 2 + 5, idx * 2 + 10).map(story => (
                    <DoubanStoryCard key={story.id} story={story} />
                  ))}
                </div>
              </section>
            ))}

            {/* 最近活跃的分支 */}
            <section className="mb-8">
              <DoubanSectionHeader title="活跃分支" link="/branches" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                {newBranches.slice(0, 4).map(branch => (
                  <Link key={branch.id} to={`/branch/${branch.id}`} className="group block border-b border-gray-50 dark:border-gray-900 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] text-blue-600 font-medium px-1.5 py-0.5 border border-blue-100 dark:border-blue-900/30 rounded-sm">
                        分支
                      </span>
                      <span className="text-[11px] text-gray-400">衍生自：{branch.parentStory?.title}</span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white group-hover:text-blue-600 transition-colors mb-1.5">
                      {branch.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-xs text-gray-500">{branch.author?.username}</span>
                      <span className="text-gray-200 dark:text-gray-800">|</span>
                      <span className="text-[10px] text-gray-400">活跃于 2小时前</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* 右侧侧边栏 (25%) */}
          <div className="lg:w-[28%] space-y-12">
            
            {/* 排行榜 */}
            <section>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-[0.2em] mb-3 border-b border-gray-100 dark:border-gray-900 pb-2.5">
                热度排行榜
              </h3>
              <div className="flex flex-col">
                {(isLoading ? Array.from({ length: 8 }) : stories.slice(0, 8)).map((story: any, index) => (
                  <DoubanRankingItem key={index} story={story} index={index} />
                ))}
              </div>
            </section>

            {/* 书单精选 */}
            <section>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-[0.2em] mb-3 border-b border-gray-100 dark:border-gray-900 pb-2.5">
                精选书单
              </h3>
              <div className="space-y-4">
                {hotBooklists.map((list) => (
                  <Link key={list.id} to={`/booklist/${list.id}`} className="group block">
                    <h4 className="text-[13px] font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                      {list.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                      {list._count?.items} 部作品 · 来自 {list.creator?.username || '资深编辑'}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* 创作招募 */}
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2px] border border-gray-100 dark:border-gray-800">
              <h4 className="text-[13px] font-medium text-gray-900 dark:text-white mb-2">成为签约作者</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                如果你热爱创作，追求逻辑极致，这里有百万级别的创作扶持金和专业的编辑指导。
              </p>
              <button className="w-full py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-white dark:hover:bg-gray-800 transition-all">
                提交样章
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════ 全站探索 ══════════════ */}
        <section className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">探索全站</h2>
            <div className="flex items-center gap-6">
              {['热门', '新书', '官方', '完结'].map(tab => (
                <span key={tab} className={`text-[13px] cursor-pointer ${tab === '热门' ? 'text-gray-900 dark:text-white font-medium border-b-2 border-gray-900 dark:border-white pb-0.5' : 'text-gray-400 hover:text-gray-600'}`}>
                  {tab}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-6 gap-y-10">
            {stories.map((story) => (
              <DoubanStoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      </div>

      {/* 简约页脚 */}
      <footer className="mt-16 py-8 border-t border-gray-100 dark:border-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-6 text-[13px] text-gray-400">
              {['关于我们', '创作指南', '版权保护', '帮助中心'].map(f => (
                <Link key={f} to="#" className="hover:text-gray-600 transition-colors">{f}</Link>
              ))}
            </div>
            <div className="text-[10px] text-gray-300 dark:text-gray-700 font-medium uppercase tracking-widest text-right">
              {config.footerCopyright || '© 2026 PARALLEL UNIVERSE STORY PLATFORM.'}
              {config.icp && (
                <span className="block mt-1 opacity-60">{config.icp}</span>
              )}
            </div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default Home;
