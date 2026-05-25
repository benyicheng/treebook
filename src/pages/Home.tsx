import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useStoryStore } from '../stores/useStoryStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useSiteConfigStore } from '../stores/useSiteConfigStore';
import { storyService, Story } from '../api/storyService';
import { branchService, Branch } from '../api/storyService';
import { booklistService, Booklist } from '../api/storyService';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronRight, Search, BookOpen, GitBranch, Clock, Star,
  TrendingUp, Zap, Heart, Crown, Layout, BarChart3, Tag,
  Sparkles, Globe, Megaphone, Mail, ChevronLeft, ChevronDown,
  Flame, Award, BookMarked, ArrowRight, Eye,
  MessageSquare, Users, Quote, Feather, Infinity,
  Waves, Orbit, Compass,
  ArrowUpRight, CheckCircle, Layers, LibraryBig,
  ScrollText, Navigation
} from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(date).toLocaleDateString();
}

/* ── 动画 variants ── */
const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: easeOut }
  })
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
};

/* ── 装饰性背景组件 ── */
const SectionBg = ({ variant = 1 }: { variant?: number }) => {
  const patterns = [
    'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.04) 0%, transparent 50%)',
    'radial-gradient(circle at 80% 20%, rgba(139,92,246,0.04) 0%, transparent 50%)',
    'radial-gradient(circle at 50% 80%, rgba(16,185,129,0.04) 0%, transparent 50%)',
  ];
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ background: patterns[variant % patterns.length] }} />
  );
};

/* ── 渐变色条标题 ── */
const SectionTitle = ({ icon: Icon, gradient, title, link, linkText }: {
  icon: React.ElementType; gradient: string; title: string;
  link?: string; linkText?: string;
}) => (
  <motion.div
    variants={fadeUp}
    className="flex items-center gap-3 mb-7"
  >
    <div className={`w-1 h-7 rounded-full bg-gradient-to-b ${gradient}`} />
    <div className="flex-1 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-10 shadow-sm`}>
          <Icon size={14} className="text-white" />
        </div>
        <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight">
          {title}
        </h2>
      </div>
      {link && (
        <Link
          to={link}
          className="group flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          {linkText || '更多'}
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  </motion.div>
);

/* ── 封面图片fallback ── */
const coverFallback = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { stories, fetchStories, isLoading: storiesLoading } = useStoryStore();
  const { user, isAuthenticated } = useAuthStore();
  const { config, fetchConfig } = useSiteConfigStore();
  const [searchQuery, setSearchQuery] = useState('');
  const urlSearch = searchParams.get('search') || '';
  const searchResults = urlSearch
    ? stories.filter(s =>
        s.title.toLowerCase().includes(urlSearch.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(urlSearch.toLowerCase()) ||
        (s.author?.username || '').toLowerCase().includes(urlSearch.toLowerCase())
      )
    : [];
  const [recentReads, setRecentReads] = useState<any[]>([]);
  const [hotBooklists, setHotBooklists] = useState<Booklist[]>([]);
  const [newBranches, setNewBranches] = useState<Branch[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [exploreTab, setExploreTab] = useState<string>('热门');
  const bannerTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRecentReads = useCallback(async () => {
    try { const data = await storyService.getRecentReads(); setRecentReads(data); }
    catch { /* ignore */ }
  }, []);

  const fetchHotBooklists = useCallback(async () => {
    try { const data = await booklistService.getAll(); setHotBooklists(data.slice(0, 5)); }
    catch { /* ignore */ }
  }, []);

  const fetchNewBranches = useCallback(async () => {
    try { const data = await branchService.getAll(); setNewBranches(data.slice(0, 8)); }
    catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchStories();
    fetchConfig();
    if (isAuthenticated) fetchRecentReads();
    fetchHotBooklists();
    fetchNewBranches();
  }, [fetchStories, fetchConfig, isAuthenticated, fetchRecentReads, fetchHotBooklists, fetchNewBranches]);

  let bannerSlides: any[] = [];
  try { bannerSlides = JSON.parse(config.bannerSlides || '[]'); } catch { /* ignore */ }
  const slides = bannerSlides.length > 0 ? bannerSlides : [{
    imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&h=400&fit=crop',
    title: '书树创作计划',
    description: '汇聚全球万千创作者，在这里，每一个故事都有无限可能。',
    buttonText: '开始创作',
    link: '#'
  }];

  useEffect(() => {
    if (slides.length < 2) return;
    bannerTimer.current = setInterval(() => {
      setBannerIndex(i => (i + 1) % slides.length);
    }, 5000);
    return () => { if (bannerTimer.current) clearInterval(bannerTimer.current); };
  }, [slides.length]);

  const goBanner = useCallback((i: number) => {
    setBannerIndex(i);
    if (bannerTimer.current) { clearInterval(bannerTimer.current); bannerTimer.current = null; }
  }, []);

  const slide = slides[bannerIndex];

  let editorPicks: any[] = [];
  try { editorPicks = JSON.parse(config.editorPicks || '[]'); } catch { /* ignore */ }
  const displayedPicks = editorPicks.length > 0 ? editorPicks : stories.slice(0, 4);

  const sortedStories = React.useMemo(() => {
    const list = [...stories];
    switch (exploreTab) {
      case '热门': return list.sort((a, b) => ((b as any).viewCount || 0) - ((a as any).viewCount || 0));
      case '新书': return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case '官方': return list.filter(s => s.isOfficial || (s as any).author?.role === 'author');
      case '完结': return list.filter(s => s.status === 'completed');
      default: return list;
    }
  }, [stories, exploreTab]);

  const userCount = Math.max(
    3,
    ...stories.map(s => ((s as any).authorId ? 1 : 0) as number),
    ...newBranches.map(b => ((b as any).authorId ? 1 : 0) as number)
  );

  return (
    <div className="pb-0 font-sans overflow-hidden">
      {/* ════════════════════════════════════ */}
      {/*   ANNOUNCEMENT                      */}
      {/* ════════════════════════════════════ */}
      {config.announcementEnabled === 'true' && config.announcement && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 px-6 py-4 shadow-xl shadow-indigo-500/20"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg shrink-0 mt-0.5">
              <Megaphone size={15} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-white/95 leading-relaxed">{config.announcement}</p>
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════ */}
      {/*   HERO BANNER                       */}
      {/* ════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full aspect-[21/8] max-h-[460px] rounded-3xl overflow-hidden mb-12 shadow-2xl border border-gray-100/50 dark:border-gray-800/50 group"
      >
        {/* Background image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={bannerIndex}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.imageUrl})` }}
          />
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/85 via-gray-900/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />

        {/* Decorative particles */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                top: `${15 + i * 14}%`,
                left: `${5 + i * 16}%`,
                opacity: 0.3 + Math.sin(i) * 0.2,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="absolute inset-y-0 left-6 md:left-10 lg:left-14 flex flex-col justify-center max-w-xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-white/90 text-[11px] font-bold mb-5 w-fit border border-white/10"
          >
            <Sparkles size={12} className="text-yellow-300" />
            精选推荐
          </motion.div>

          <motion.h2
            key={`title-${bannerIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 leading-tight drop-shadow-2xl"
          >
            {slide.title}
          </motion.h2>

          <motion.p
            key={`desc-${bannerIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-sm md:text-base text-white/75 mb-7 leading-relaxed max-w-md font-medium"
          >
            {slide.description}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            onClick={() => navigate(slide.link || '#')}
            className="group/btn w-fit px-8 py-3.5 bg-white text-gray-900 text-sm font-black rounded-full hover:bg-gray-50 transition-all shadow-2xl active:scale-95 flex items-center gap-2.5"
          >
            {slide.buttonText || '查看详情'}
            <ArrowRight size={15} className="transition-transform group-hover/btn:translate-x-1" />
          </motion.button>
        </div>

        {/* Bottom dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goBanner(i)}
                className={`transition-all duration-500 rounded-full ${
                  i === bannerIndex
                    ? 'w-9 h-2.5 bg-white shadow-lg shadow-white/30'
                    : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}

        {/* Side arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => goBanner((bannerIndex - 1 + slides.length) % slides.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:bg-black/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => goBanner((bannerIndex + 1) % slides.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:bg-black/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </motion.section>

      {/* ════════════════════════════════════ */}
      {/*   SEARCH RESULTS                    */}
      {/* ════════════════════════════════════ */}
      {urlSearch && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
              <Search size={14} className="text-white" />
            </div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex-1">
              搜索 "{urlSearch}"
            </h2>
            <span className="text-sm text-gray-400 font-medium">
              找到 {searchResults.length} 个结果
            </span>
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              清除筛选
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-400 dark:text-gray-500 text-sm font-medium mb-2">
                没有找到与 "{urlSearch}" 相关的内容
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600">试试其他关键词</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {searchResults.map((story, i) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/story/${story.id}`} className="group block">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800 shadow-md group-hover:shadow-2xl group-hover:-translate-y-1.5 transition-all duration-300 ring-1 ring-black/5">
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
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black rounded-full uppercase shadow-lg shadow-blue-500/30">
                          官方
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                      {story.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium truncate">{story.author?.username}</span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="flex items-center gap-0.5">
                        <Eye size={11} /> {(story as any).viewCount || 0}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      )}

      {/* ════════════════════════════════════ */}
      {/*   MAIN LAYOUT: 70/30                */}
      {/* ════════════════════════════════════ */}
      {!urlSearch && (
      <div className="flex flex-col lg:flex-row gap-10">
        {/* ──── LEFT: 70% ──── */}
        <div className="lg:w-[68%] space-y-14">

          {/* ── Editor Picks ── */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <SectionTitle
              icon={Star}
              gradient="from-amber-400 to-orange-500"
              title="编辑推荐"
              link="/recommendations"
              linkText="查看全部"
            />
            {storiesLoading && displayedPicks.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl p-5 border border-gray-100 dark:border-gray-800 space-y-4 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm">
                    <div className="flex gap-4">
                      <Skeleton className="w-[68px] h-[96px] rounded-xl" />
                      <div className="flex-1 space-y-2.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedPicks.map((pick: any, i: number) => (
                  <motion.div key={pick.id} variants={fadeUp} custom={i}>
                    <Link
                      to={`/story/${pick.id}`}
                      className="group relative flex gap-5 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 
                        bg-white/70 dark:bg-gray-800/30 backdrop-blur-sm
                        hover:border-amber-200/70 dark:hover:border-amber-800/50 
                        hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5
                        transition-all duration-300 overflow-hidden"
                    >
                      {/* Hover glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-orange-500/0 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />
                      {/* Cover */}
                      <div className="w-[68px] aspect-[2/3] shrink-0 rounded-xl overflow-hidden shadow-md ring-1 ring-black/5">
                        <img
                          src={pick.coverImage || coverFallback}
                          alt={pick.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 min-w-0 relative z-10">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors line-clamp-1">
                            {pick.title}
                          </h3>
                          {pick.isOfficial && (
                            <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black rounded-full shrink-0 shadow-sm">
                              官方
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                          {pick.author?.username || pick.author}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed">
                          {pick.comment || pick.description || '暂无简介'}
                        </p>
                        <div className="flex items-center gap-3 mt-2.5 text-[10px] text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye size={11} /> {(pick as any).viewCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart size={11} /> {(pick as any).likeCount || 0}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>

          {/* ── Continue Reading ── */}
          {isAuthenticated && recentReads.length > 0 && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 shadow-sm">
                  <Clock size={13} className="text-white" />
                </div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white flex-1 tracking-tight">继续阅读</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentReads.map((item: any, i: number) => (
                  <motion.div key={item.id} variants={fadeUp} custom={i}>
                    <Link
                      to={`/story/${item.story?.id || '#'}/read?chapter=${item.id}`}
                      className="group flex items-start gap-4 p-3.5 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/60 hover:border-violet-200 dark:hover:border-violet-800/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    >
                      {/* Cover thumbnail */}
                      <div className="relative w-14 h-[70px] rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 ring-1 ring-black/5">
                        <img
                          src={item.story?.coverImage || coverFallback}
                          alt={item.story?.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-violet-600 transition-colors line-clamp-1">
                          {item.story?.title || '未知故事'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                          第 {item.title} 章
                        </p>
                        {typeof item.progress === 'number' && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all"
                                style={{ width: `${Math.min(item.progress * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-gray-400">
                              {Math.round(Math.min(item.progress * 100, 100))}%
                            </span>
                          </div>
                        )}
                      </div>
                      <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ── New Stories Grid ── */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <SectionTitle
              icon={Zap}
              gradient="from-sky-400 to-blue-600"
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
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3.5 bg-gray-100 dark:bg-gray-800 shadow-md group-hover:shadow-2xl group-hover:-translate-y-1.5 transition-all duration-300 ring-1 ring-black/5">
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
                          <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black rounded-full uppercase shadow-lg shadow-blue-500/30">
                            官方
                          </div>
                        )}
                        {story.status === 'completed' && (
                          <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/90 backdrop-blur-sm text-white text-[9px] font-black rounded-full shadow-lg">
                            完结
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                        {story.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium truncate">{story.author?.username}</span>
                        {(story as any).viewCount > 0 && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
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

          {/* ── Section Divider ── */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-dashed border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <div className="px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
                <div className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                  <Infinity size={16} className="text-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Active Branches ── */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <SectionTitle
              icon={GitBranch}
              gradient="from-purple-500 to-violet-600"
              title="活跃分支"
              link="/branches"
              linkText="探索分支"
            />
            {newBranches.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl p-5 border border-gray-100 dark:border-gray-800 space-y-3 bg-white/50 dark:bg-gray-800/30">
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
                      className="group relative block p-5 rounded-2xl border border-gray-100 dark:border-gray-800 
                        bg-white/70 dark:bg-gray-800/30 backdrop-blur-sm
                        hover:border-purple-200/70 dark:hover:border-purple-800/50 
                        hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-0.5
                        transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-violet-500/0 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-full">
                            <GitBranch size={10} />
                            分支
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 truncate font-medium">
                            衍生自：{branch.parentStory?.title}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2 line-clamp-1">
                          {branch.title}
                        </h4>
                        {branch.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                            {branch.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <span className="font-medium">{branch.author?.username}</span>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <span>{timeAgo(branch.updatedAt || branch.createdAt)}</span>
                          </div>
                          <span className="text-purple-400 group-hover:text-purple-600 transition-colors font-bold text-xs flex items-center gap-0.5">
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
        </div>

        {/* ──── RIGHT SIDEBAR: 32% ──── */}
        <div className="lg:w-[32%] space-y-8">

          {/* ── Quick Stats ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { icon: BookOpen, label: '作品', value: stories.length, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
              { icon: Users, label: '作者', value: userCount || 0, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
              { icon: GitBranch, label: '分支', value: newBranches.length, gradient: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/20' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group p-4 rounded-2xl border border-gray-100 dark:border-gray-800 
                  bg-white/70 dark:bg-gray-800/30 backdrop-blur-sm text-center 
                  hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`w-9 h-9 mx-auto mb-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} 
                  flex items-center justify-center shadow-lg ${stat.shadow} 
                  group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon size={15} className="text-white" />
                </div>
                <div className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
                  {stat.value || 0}
                </div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* ── Hot Ranking ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 shadow-sm">
                <Flame size={13} className="text-white" />
              </div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex-1 tracking-tight">热度排行榜</h3>
            </div>
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 
              bg-white/70 dark:bg-gray-800/30 backdrop-blur-sm p-4
              shadow-sm">
              {storiesLoading && stories.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 animate-pulse border-b border-gray-50 dark:border-gray-900 last:border-0">
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
                      className="flex items-center gap-3 py-3 group border-b border-gray-50 dark:border-gray-900 last:border-0 
                        hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent dark:hover:from-gray-800/30 dark:hover:to-transparent
                        -mx-2 px-2 rounded-xl transition-all duration-200"
                    >
                      <span className={`w-7 h-7 flex items-center justify-center text-xs font-black rounded-xl shrink-0 transition-transform group-hover:scale-110 ${
                        index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/20' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md' :
                        index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white shadow-md' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {story.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span className="font-medium">{story.author?.username}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Eye size={11} /> {(story as any).viewCount || 0}
                          </span>
                        </div>
                      </div>
                      {index < 3 && (
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          index === 0 ? 'bg-orange-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'
                        }`} />
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.section>

          {/* ── Hot Booklists ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 shadow-sm">
                <BookMarked size={13} className="text-white" />
              </div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex-1 tracking-tight">精选书单</h3>
              <Link to="/booklist" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                全部
              </Link>
            </div>
            <div className="space-y-3">
              {hotBooklists.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-2 bg-white/50 dark:bg-gray-800/30">
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
                      className="group block p-4 rounded-2xl border border-gray-100 dark:border-gray-800 
                        bg-white/70 dark:bg-gray-800/30 backdrop-blur-sm
                        hover:border-emerald-200/70 dark:hover:border-emerald-800/50 
                        hover:shadow-md hover:shadow-emerald-500/5 hover:-translate-y-0.5
                        transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${
                          ['from-emerald-400 to-teal-500', 'from-sky-400 to-blue-500', 'from-rose-400 to-pink-500', 'from-amber-400 to-orange-500', 'from-violet-400 to-purple-500'][i % 5]
                        } flex items-center justify-center shadow-sm shrink-0`}>
                          <BookMarked size={13} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                            {list.title}
                          </h4>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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


        </div>
      </div>

      )}

      {/* ════════════════════════════════════ */}
      {/*   EXPLORE SECTION                   */}
      {/* ════════════════════════════════════ */}
      {!urlSearch && (
      <>
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={stagger}
        className="mt-16 pt-12 border-t border-gray-200/70 dark:border-gray-800/70 relative"
      >
        {/* Section background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent dark:via-blue-950/10 pointer-events-none" />

        <div className="relative">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-9">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 shadow-sm`}>
                <Compass size={14} className="text-white" />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">探索全站</h2>
            </div>
            <div className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              {['热门', '新书', '官方', '完结'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setExploreTab(tab)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                    exploreTab === tab
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          {storiesLoading && stories.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <Skeleton className="aspect-[3/4] rounded-2xl mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-1.5" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : sortedStories.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">暂无 {exploreTab} 相关内容</p>
            </div>
          ) : (
            <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {sortedStories.slice(0, 12).map((story, i) => (
                <motion.div key={story.id} variants={fadeUp} custom={i}>
                  <Link to={`/story/${story.id}`} className="group block">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800 
                      shadow-md group-hover:shadow-2xl group-hover:-translate-y-1.5 transition-all duration-300
                      ring-1 ring-black/5">
                      <img
                        src={story.coverImage || coverFallback}
                        alt={story.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform">
                        <p className="text-xs text-white/90 line-clamp-2 font-medium drop-shadow-lg">
                          {story.description || '暂无简介'}
                        </p>
                      </div>
                      {story.status === 'completed' && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-emerald-500/90 backdrop-blur-sm text-white text-[9px] font-black rounded-full shadow-lg shadow-emerald-500/30">
                          完结
                        </div>
                      )}
                      {story.isOfficial && !story.status?.includes('completed') && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black rounded-full uppercase shadow-lg shadow-blue-500/30">
                          官方
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                      {story.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium truncate">{story.author?.username}</span>
                      {(story as any).viewCount > 0 && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">·</span>
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
        </div>
      </motion.section>

      {/* ════════════════════════════════════ */}
      {/*   FOOTER                            */}
      {/* ════════════════════════════════════ */}
      <footer className="relative mt-20 pt-14 pb-8 border-t border-gray-200/70 dark:border-gray-800/70">
        {/* Subtle bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/50 to-transparent dark:via-gray-900/30 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4">
          {/* Top: Links grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Sparkles size={15} className="text-white" />
                </div>
                <span className="text-base font-black text-gray-900 dark:text-white">
                  {config.siteName || '平行宇宙'}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed max-w-xs">
                汇聚全球万千创作者，让每一个故事都有无限可能。在这里，你可以创作、分享和探索无穷的平行宇宙。
              </p>
              <div className="flex items-center gap-3 mt-4">
                {config.contactEmail && (
                  <a href={`mailto:${config.contactEmail}`} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 transition-colors">
                    <Mail size={12} />
                    <span className="hidden sm:inline truncate">{config.contactEmail}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: '关于',
                links: [
                  { name: '关于我们', to: '/about' },
                  { name: '联系方式', to: '/contact' },
                  { name: '加入我们', to: '/join' },
                ]
              },
              {
                title: '创作',
                links: [
                  { name: '创作指南', to: '/author/guide' },
                  { name: '作者福利', to: '/author/benefits' },
                  { name: '版权保护', to: '/author/copyright' },
                ]
              },
              {
                title: '支持',
                links: [
                  { name: '帮助中心', to: '/help' },
                  { name: '意见反馈', to: '/feedback' },
                  { name: '投诉举报', to: '/report' },
                ]
              },
            ].map((group) => (
              <div key={group.title}>
                <h5 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">
                  {group.title}
                </h5>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.to}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-800/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-[10px] text-gray-400 dark:text-gray-600 font-medium tracking-wider text-center md:text-left">
                <span>{config.footerCopyright || '© 2026 PARALLEL UNIVERSE STORY PLATFORM. All rights reserved.'}</span>
                {config.icp && <span className="ml-2 opacity-60">{config.icp}</span>}
              </div>
              <div className="flex items-center gap-4 text-[10px] text-gray-400 dark:text-gray-600">
                <a href="#" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">隐私政策</a>
                <span className="opacity-30">|</span>
                <a href="#" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">服务条款</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </>)
      }

    </div>
  );
};

export default Home;
