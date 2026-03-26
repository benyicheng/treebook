import React, { useEffect, useState, useRef } from 'react';
import { useStoryStore } from '../stores/useStoryStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useSiteConfigStore } from '../stores/useSiteConfigStore';
import { storyService, booklistService, branchService } from '../api/storyService';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Book, Users, Star, Plus, Search, Clock, ArrowRight, ChevronLeft, ChevronRight, Flame, TrendingUp, BookMarked, Sparkles, Crown, Zap, Heart, GitBranch } from 'lucide-react';
import type { EditorPick } from './admin/CMSPage';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { stories, fetchStories, isLoading } = useStoryStore();
  const { isAuthenticated } = useAuthStore();
  const { config } = useSiteConfigStore();
  const [tags, setTags] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentReads, setRecentReads] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [hotBooklists, setHotBooklists] = useState<any[]>([]);
  const [newBranches, setNewBranches] = useState<any[]>([]);

  // 轮播相关状态
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoSlideInterval = useRef<NodeJS.Timeout | null>(null);

  const filter = (searchParams.get('filter') as 'all' | 'official' | 'community') || 'all';
  const selectedTag = searchParams.get('tag');

  const scrollToStories = () => {
    const el = document.getElementById('stories-section');
    if (el && typeof (el as any).scrollIntoView === 'function') {
      (el as any).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const exploreStory = async () => {
    const firstStoryId = stories[0]?.id;
    if (!firstStoryId) { scrollToStories(); return; }
    try {
      const story = await storyService.getById(firstStoryId);
      const firstChapterId = story.chapters?.[0]?.id;
      if (firstChapterId) { navigate(`/read/${firstChapterId}`); return; }
      navigate(`/story/${firstStoryId}`);
    } catch { navigate(`/story/${firstStoryId}`); }
  };

  useEffect(() => {
    fetchStories({
      tag: selectedTag || undefined,
      isOfficial: filter === 'official' ? true : filter === 'community' ? false : undefined,
    });
    fetchTags();
    fetchHotBooklists();
    fetchNewBranches();
    if (isAuthenticated) fetchRecentReads();
  }, [fetchStories, filter, isAuthenticated, selectedTag]);

  const fetchTags = async () => {
    try { const data = await storyService.getTags(); setTags(data); }
    catch (err) { console.error('Failed to fetch tags'); }
  };

  const fetchRecentReads = async () => {
    try { const data = await storyService.getRecentReads(); setRecentReads(data); }
    catch (err) { console.error('Failed to fetch recent reads'); }
  };

  const fetchHotBooklists = async () => {
    try { const data = await booklistService.getAll(); setHotBooklists(data.slice(0, 4)); }
    catch (err) { console.error('Failed to fetch hot booklists'); }
  };

  const fetchNewBranches = async () => {
    try { const data = await branchService.getAll(); setNewBranches(data.slice(0, 4)); }
    catch (err) { console.error('Failed to fetch new branches'); }
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const setFilterParam = (t: 'all' | 'official' | 'community') => {
    const next = new URLSearchParams(searchParams);
    if (t === 'all') next.delete('filter');
    else next.set('filter', t);
    setSearchParams(next, { replace: true });
  };

  const toggleTagParam = (tagName: string) => {
    const next = new URLSearchParams(searchParams);
    const cur = next.get('tag');
    if (cur === tagName) next.delete('tag');
    else next.set('tag', tagName);
    setSearchParams(next, { replace: true });
  };

  // 轮播数据
  const bannerSlides = (() => {
    try {
      const slides = JSON.parse(config.bannerSlides || '[]');
      if (Array.isArray(slides) && slides.length > 0) return slides;
    } catch {}
    return [
      { id: 1, title: '第二届 网文打卡攀登赛', subtitle: '360天超长写作活动，与万名作者同行', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1400&h=500&fit=crop', link: '/contest', badge: '🏆 开放报名' },
      { id: 2, title: '悬疑推理专题月', subtitle: '精选20本烧脑推理小说，一起解谜', image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1400&h=500&fit=crop', link: '/tag/悬疑', badge: '🔥 热门' },
      { id: 3, title: '女性成长故事集', subtitle: '看见女性的力量与光芒，书写自己的故事', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1400&h=500&fit=crop', link: '/tag/女性', badge: '✨ 推荐' },
    ];
  })();

  // 频道数据
  const channels = [
    { id: 'completed', name: '完本频道', icon: Crown, color: 'from-emerald-400 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'romance', name: '言情频道', icon: Heart, color: 'from-pink-400 to-rose-600', bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-600 dark:text-pink-400' },
    { id: 'suspense', name: '悬疑频道', icon: Zap, color: 'from-amber-400 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400' },
    { id: 'female', name: '女性频道', icon: Sparkles, color: 'from-purple-400 to-indigo-600', bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600 dark:text-purple-400' },
    { id: 'fantasy', name: '幻想频道', icon: Star, color: 'from-blue-400 to-cyan-600', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400' },
  ];

  // 分类标签
  const categoryTags = ['全部', '悬疑', '熟男熟女', '破镜重圆', '年上', '职场', '先婚后爱', '久别重逢', '校园', '青梅竹马', '年代', '暗恋', '市井生活', '欢喜冤家'];

  // 自动轮播
  useEffect(() => {
    autoSlideInterval.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => { if (autoSlideInterval.current) clearInterval(autoSlideInterval.current); };
  }, [bannerSlides.length]);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % bannerSlides.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + bannerSlides.length) % bannerSlides.length);

  return (
    <div className="pb-20 -mx-4 md:-mx-10 bg-gray-50 dark:bg-gray-950">

      {/* ══════════════ Banner 轮播 ══════════════ */}
      <section className="relative w-full h-[300px] md:h-[420px] overflow-hidden">
        {bannerSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url(${slide.image})` }} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute inset-0 flex items-end pb-12 md:items-center md:pb-0">
              <div className="max-w-7xl mx-auto px-8 md:px-12 w-full">
                <div className="max-w-lg">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold rounded-full mb-4 shadow-lg">
                    {slide.badge}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight drop-shadow-lg">
                    {slide.title}
                  </h2>
                  <p className="text-base md:text-lg text-white/85 mb-7 font-medium drop-shadow-md leading-relaxed">
                    {slide.subtitle}
                  </p>
                  <Link
                    to={slide.link}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-100"
                  >
                    立即参与
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* 控制按钮 */}
        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all">
          <ChevronLeft size={18} />
        </button>
        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all">
          <ChevronRight size={18} />
        </button>

        {/* 指示器 */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 items-center">
          {bannerSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`rounded-full transition-all duration-300 ${index === currentSlide ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75'}`}
            />
          ))}
        </div>
      </section>

      {/* ══════════════ 公告栏 ══════════════ */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 mt-0">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-5 py-3 text-sm">
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded tracking-wider">公告</span>
            <span className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors truncate">
              {config.announcementEnabled === 'true' && config.announcement
                ? config.announcement
                : '瞰雾《黄雀风》同名改编短剧已上线，快来围观！'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-5 shrink-0 ml-6">
            <Link to="/contest/long" className="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>长篇拉力赛
            </Link>
            <Link to="/contest/essay" className="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>征文专区
            </Link>
            <Link to="/publish" className="text-gray-500 hover:text-blue-600 transition-colors whitespace-nowrap">出版改编</Link>
            <Link to="/author/benefits" className="text-gray-500 hover:text-blue-600 transition-colors whitespace-nowrap">作者福利</Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-10 mt-6 space-y-6">

        {/* ══════════════ 频道导航 ══════════════ */}
        <section>
          <div className="grid grid-cols-5 gap-2 md:gap-3">
            {channels.map((channel) => (
              <Link
                key={channel.id}
                to={`/channel/${channel.id}`}
                className={`group relative overflow-hidden rounded-xl ${channel.bg} border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all duration-300 py-4 flex flex-col items-center justify-center gap-1.5`}
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${channel.color} flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                  <channel.icon size={18} className="text-white" />
                </div>
                <span className={`text-xs font-bold ${channel.text} group-hover:opacity-80 transition-opacity`}>
                  {channel.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════════ 畅销金榜 + 侧边热搜 ══════════════ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
              <span className="w-1 h-5 bg-gradient-to-b from-red-400 to-red-600 rounded-full"></span>
              畅销金榜
            </h2>
          </div>

          {/* 分类标签 */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            {categoryTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveCategory(tag)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === tag
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex gap-5">
            {/* 左侧排行榜列表 */}
            <div className="hidden lg:block w-64 shrink-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20">
                <span className="text-sm font-black text-red-600 dark:text-red-400">🏆 实时热榜 TOP 10</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {(isLoading ? Array.from({ length: 10 }) : filteredStories.slice(0, 10)).map((story: any, index) => (
                  <div key={index} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                    <span className={`w-5 h-5 flex items-center justify-center text-xs font-black rounded shrink-0 ${
                      index === 0 ? 'bg-red-500 text-white' :
                      index === 1 ? 'bg-orange-400 text-white' :
                      index === 2 ? 'bg-amber-400 text-white' :
                      'text-gray-400 font-bold'
                    }`}>
                      {index + 1}
                    </span>
                    {isLoading ? (
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
                    ) : (
                      <Link to={`/story/${story?.id}`} className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors line-clamp-1 flex-1">
                        {story?.title}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧书籍网格 */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-xl mb-2.5" />
                      <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-4/5 mb-1.5" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/5" />
                    </div>
                  ))
                ) : (
                  filteredStories.slice(0, 10).map((story, index) => (
                    <Link key={story.id} to={`/story/${story.id}`} className="group">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2.5 bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-md transition-shadow">
                        <img
                          src={story.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop`}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {index < 3 && (
                          <div className={`absolute top-2 left-2 w-5 h-5 text-white text-[10px] font-black rounded flex items-center justify-center shadow ${
                            index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-400' : 'bg-amber-400'
                          }`}>
                            {index + 1}
                          </div>
                        )}
                        {(story.author?.role === 'author' || story.author?.role === 'admin') && (
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-blue-600/90 backdrop-blur-sm text-white text-[9px] font-bold rounded">
                            官方
                          </div>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 mb-0.5 group-hover:text-blue-600 transition-colors">
                        {story.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1">{story.author?.username}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════ 编辑推荐 ══════════════ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></span>
              编辑推荐
            </h2>
            <Link to="/recommendations" className="text-sm text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1">
              查看更多 <ArrowRight size={14} />
            </Link>
          </div>

          {(() => {
            // 解析 editorPicks 配置
            let picks: EditorPick[] = [];
            try {
              const parsed = JSON.parse(config.editorPicks || '[]');
              picks = Array.isArray(parsed) ? parsed : [];
            } catch {
              picks = [];
            }

            // 回退：若编辑推荐为空，从故事列表取前 7 条
            const fallbackStories = filteredStories.slice(0, 7);
            const fallbackPicks: EditorPick[] = fallbackStories.map(s => ({
              id: s.id,
              title: s.title,
              coverImage: s.coverImage || '',
              author: s.author?.username || '',
              description: s.description || '',
              comment: '',
              badge: '推荐',
            }));

            const displayPicks = picks.length > 0 ? picks : fallbackPicks;
            const main = displayPicks[0];
            const subs = displayPicks.slice(1, 7);

            if (!main) return (
              <div className="flex items-center justify-center py-16 text-sm text-gray-400">
                暂无推荐内容
              </div>
            );

            return (
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
                {/* 主推大图 */}
                <Link
                  to={`/story/${main.id}`}
                  className="group lg:col-span-2 relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm hover:shadow-lg transition-shadow"
                  style={{ aspectRatio: '1/1' }}
                >
                  <img
                    src={main.coverImage || `https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop`}
                    alt={main.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="inline-block px-2.5 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full shadow-lg">
                      ✦ {main.badge || '主编力荐'}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-base font-black text-white mb-0.5 leading-snug">{main.title}</h3>
                    <p className="text-[11px] text-white/70 mb-1">{main.author}</p>
                    {main.comment ? (
                      <p className="text-xs text-amber-200/90 italic line-clamp-2 leading-relaxed">「{main.comment}」</p>
                    ) : (
                      <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">{main.description}</p>
                    )}
                  </div>
                </Link>

                {/* 右侧推荐列表 */}
                <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {subs.map((pick) => (
                    <Link
                      key={pick.id}
                      to={`/story/${pick.id}`}
                      className="group flex gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                    >
                      <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700 shadow-sm relative">
                        <img
                          src={pick.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&h=200&fit=crop`}
                          alt={pick.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {pick.badge && (
                          <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-black bg-blue-600/90 text-white py-0.5 truncate">
                            {pick.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
                          {pick.title}
                        </h4>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">{pick.author}</p>
                        {pick.comment ? (
                          <p className="text-xs text-blue-500 dark:text-blue-400 italic line-clamp-2 leading-relaxed">「{pick.comment}」</p>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{pick.description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}
        </section>

        {/* ══════════════ 新书速递 ══════════════ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
              <span className="w-1 h-5 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></span>
              新书速递
            </h2>
            <Link to="/new" className="text-sm text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1">
              查看更多 <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
            {/* 新书卡片 */}
            {filteredStories.slice(5, 9).map((story) => (
              <Link key={`story-${story.id}`} to={`/story/${story.id}`} className="group">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-md transition-shadow">
                  <img
                    src={story.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=280&fit=crop`}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-green-500/90 backdrop-blur-sm text-white text-[9px] font-black rounded tracking-wider shadow">
                    新书
                  </span>
                </div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 mb-0.5 group-hover:text-blue-600 transition-colors">
                  {story.title}
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{story.author?.username}</p>
              </Link>
            ))}

            {/* 分支卡片 */}
            {newBranches.slice(0, 2).map((branch) => (
              <Link key={`branch-${branch.id}`} to={`/branch/${branch.id}`} className="group">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-100 dark:border-purple-800 shadow-sm group-hover:shadow-md transition-all">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center mb-2">
                      <GitBranch size={18} className="text-white" />
                    </div>
                    <h3 className="text-xs font-black text-gray-900 dark:text-white line-clamp-2 mb-1 text-center leading-snug">
                      {branch.title}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 text-center">
                      {branch.parentStory?.title}
                    </p>
                  </div>
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-purple-500/90 backdrop-blur-sm text-white text-[9px] font-black rounded tracking-wider shadow">
                    支线
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
                  by {branch.author?.username}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════════ 热门书单 ══════════════ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
              <BookMarked size={20} className="text-amber-500" />
              热门书单
            </h2>
            <Link to="/booklist" className="text-sm text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1">
              查看更多 <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {hotBooklists.length > 0 ? (
              hotBooklists.map((booklist) => (
                <Link
                  key={booklist.id}
                  to={`/booklist/${booklist.id}`}
                  className="group rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={booklist.description ? `https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=280&fit=crop` : `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=280&fit=crop`}
                      alt={booklist.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-400 text-white text-[9px] font-black rounded-full">
                      热门
                    </span>
                    <div className="absolute bottom-2 left-3 right-3">
                      <h3 className="text-sm font-black text-white mb-0.5 line-clamp-1">{booklist.title}</h3>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">by {booklist.creator?.username || '未知'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">{booklist._count?.items || 0} 本</span>
                      <span className="text-[11px] text-gray-400">🔥 {booklist.viewCount || 0}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-4 py-10 text-center">
                <BookMarked size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">暂无热门书单</p>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════ 继续阅读 ══════════════ */}
        {recentReads.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                <Clock size={20} className="text-blue-500" />
                继续阅读
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentReads.slice(0, 4).map((read) => (
                <Link
                  key={read.id}
                  to={`/read/${read.id}`}
                  className="group flex gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                >
                  <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700 shadow-sm">
                    <img
                      src={read.story.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&h=200&fit=crop`}
                      alt={read.story.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="text-[11px] text-gray-400 mb-0.5 line-clamp-1">{read.story.title}</p>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                      {read.title}
                    </h4>
                    <span className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full">
                      {read.branch ? '平行分支' : '主线章节'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════ 更多推荐 ══════════════ */}
        <section id="stories-section">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
              <span className="w-1 h-5 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></span>
              更多推荐
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  id="stories-search"
                  type="text"
                  placeholder="搜索故事..."
                  className="pl-8 pr-4 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 outline-none w-40 transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Link to="/story/create" className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md">
                <Plus size={15} />
                创建故事
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-xl mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-4/5 mb-1.5" />
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded w-3/5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filteredStories.slice(11, 23).map((story) => (
                <Link key={story.id} to={`/story/${story.id}`} className="group">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-md transition-shadow">
                    <img
                      src={story.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=280&fit=crop`}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {(story.author?.role === 'author' || story.author?.role === 'admin') && (
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-blue-600/90 backdrop-blur-sm text-white text-[9px] font-bold rounded shadow">
                        官方
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 mb-0.5 group-hover:text-blue-600 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{story.author?.username}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ══════════════ 页脚 ══════════════ */}
      <footer className="mt-14 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white mb-4 uppercase tracking-wider">关于我们</h4>
              <ul className="space-y-2.5 text-sm text-gray-500 dark:text-gray-400">
                <li><Link to="/about" className="hover:text-blue-600 transition-colors">平台介绍</Link></li>
                <li><Link to="/contact" className="hover:text-blue-600 transition-colors">联系我们</Link></li>
                <li><Link to="/join" className="hover:text-blue-600 transition-colors">加入我们</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white mb-4 uppercase tracking-wider">创作者</h4>
              <ul className="space-y-2.5 text-sm text-gray-500 dark:text-gray-400">
                <li><Link to="/author/guide" className="hover:text-blue-600 transition-colors">创作指南</Link></li>
                <li><Link to="/author/benefits" className="hover:text-blue-600 transition-colors">作者福利</Link></li>
                <li><Link to="/author/copyright" className="hover:text-blue-600 transition-colors">版权保护</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white mb-4 uppercase tracking-wider">帮助中心</h4>
              <ul className="space-y-2.5 text-sm text-gray-500 dark:text-gray-400">
                <li><Link to="/help" className="hover:text-blue-600 transition-colors">常见问题</Link></li>
                <li><Link to="/feedback" className="hover:text-blue-600 transition-colors">意见反馈</Link></li>
                <li><Link to="/report" className="hover:text-blue-600 transition-colors">举报中心</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white mb-4 uppercase tracking-wider">关注我们</h4>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-xs font-bold">
                  微信
                </a>
                <a href="#" className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-xs font-bold">
                  微博
                </a>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400 space-x-4">
            <span>{config.footerCopyright || '© 2026 平行宇宙故事平台. All rights reserved.'}</span>
            {config.icp && <span>{config.icp}</span>}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
