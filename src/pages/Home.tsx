import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useStoryStore } from '../stores/useStoryStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useSiteConfigStore } from '../stores/useSiteConfigStore';
import { storyService, Story } from '../api/storyService';
import { branchService, Branch } from '../api/storyService';
import { booklistService, Booklist } from '../api/storyService';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, Search, BookOpen, GitBranch, Clock, Star,
  TrendingUp, Zap, Heart, Crown, Layout, BarChart3, Tag,
  Sparkles, Globe, Megaphone, Mail, ChevronLeft, ChevronDown,
  Flame, Award, BookMarked, PenLine, ArrowRight, Eye,
  MessageSquare, Users
} from 'lucide-react';
import { Skeleton, SkeletonCard, SkeletonRow } from '../components/ui/Skeleton';

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

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { stories, fetchStories, isLoading: storiesLoading } = useStoryStore();
  const { user, isAuthenticated } = useAuthStore();
  const { config, fetchConfig } = useSiteConfigStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentReads, setRecentReads] = useState<any[]>([]);
  const [hotBooklists, setHotBooklists] = useState<Booklist[]>([]);
  const [newBranches, setNewBranches] = useState<Branch[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [exploreTab, setExploreTab] = useState<string>('热门');
  const bannerTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRecentReads = useCallback(async () => {
    try { const data = await storyService.getRecentReads(); setRecentReads(data); }
    catch {}
  }, []);

  const fetchHotBooklists = useCallback(async () => {
    try { const data = await booklistService.getAll(); setHotBooklists(data.slice(0, 5)); }
    catch {}
  }, []);

  const fetchNewBranches = useCallback(async () => {
    try { const data = await branchService.getAll(); setNewBranches(data.slice(0, 8)); }
    catch {}
  }, []);

  useEffect(() => {
    fetchStories();
    fetchConfig();
    if (isAuthenticated) fetchRecentReads();
    fetchHotBooklists();
    fetchNewBranches();
  }, [fetchStories, fetchConfig, isAuthenticated, fetchRecentReads, fetchHotBooklists, fetchNewBranches]);

  let bannerSlides: any[] = [];
  try { bannerSlides = JSON.parse(config.bannerSlides || '[]'); } catch {}
  const slides = bannerSlides.length > 0 ? bannerSlides : [{
    imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&h=400&fit=crop',
    title: '平行宇宙创作计划',
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
  try { editorPicks = JSON.parse(config.editorPicks || '[]'); } catch {}
  const displayedPicks = editorPicks.length > 0 ? editorPicks : stories.slice(0, 4);

  const sortedStories = React.useMemo(() => {
    const list = [...stories];
    switch (exploreTab) {
      case '热门': return list.sort((a, b) => (b as any).viewCount - (a as any).viewCount);
      case '新书': return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case '官方': return list.filter(s => s.isOfficial || (s as any).author?.role === 'author');
      case '完结': return list.filter(s => s.status === 'completed');
      default: return list;
    }
  }, [stories, exploreTab]);

  return (
    <div className="pb-16 -mx-4 md:-mx-10 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 md:px-10">

        {/* Announcement */}
        {config.announcementEnabled === 'true' && config.announcement && (
          <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 shadow-lg shadow-blue-500/20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
            <div className="relative flex items-center gap-3">
              <Megaphone size={18} className="text-white/90 shrink-0" />
              <p className="text-sm font-medium text-white">{config.announcement}</p>
            </div>
          </div>
        )}

        {/* Banner Carousel */}
        <section className="relative w-full aspect-[21/7] rounded-3xl overflow-hidden mb-10 shadow-xl border border-gray-100 dark:border-gray-800 group">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${slide.imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent" />
          <div className="absolute inset-y-0 left-8 md:left-12 flex flex-col justify-center max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-xs font-bold mb-4 w-fit">
              <Sparkles size={12} />
              精选推荐
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight drop-shadow-lg">
              {slide.title}
            </h2>
            <p className="text-sm md:text-base text-white/80 mb-6 leading-relaxed max-w-md">
              {slide.description}
            </p>
            <button
              onClick={() => navigate(slide.link || '#')}
              className="w-fit px-8 py-3 bg-white text-gray-900 text-sm font-black rounded-full hover:bg-gray-100 transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              {slide.buttonText || '查看详情'}
              <ArrowRight size={16} />
            </button>
          </div>

          {slides.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goBanner(i)}
                  className={`transition-all rounded-full ${
                    i === bannerIndex ? 'w-8 h-2 bg-white shadow-md' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Main layout: 70/30 */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left: 70% */}
          <div className="lg:w-[70%] space-y-10">

            {/* Editor picks */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-7 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
                <div className="flex-1 flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">编辑推荐</h2>
                  <Link to="/recommendations" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                    更多 <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
              {storiesLoading && displayedPicks.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-3">
                      <div className="flex gap-4">
                        <Skeleton className="w-16 h-24 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/3" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedPicks.map((pick: any) => (
                    <Link
                      key={pick.id}
                      to={`/story/${pick.id}`}
                      className="group flex gap-5 p-4 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg hover:shadow-blue-500/5 transition-all"
                    >
                      <div className="w-16 aspect-[2/3] shrink-0 rounded-xl overflow-hidden shadow-sm">
                        <img
                          src={pick.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop'}
                          alt={pick.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                            {pick.title}
                          </h3>
                          {pick.isOfficial && (
                            <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded-full uppercase shrink-0">官方</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-1.5">{pick.author?.username || pick.author}</p>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {pick.comment || pick.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* New stories grid */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-7 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
                <div className="flex-1 flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">新书速递</h2>
                  <Link to="/new" className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1">
                    更多 <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
              {storiesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <Skeleton className="aspect-[3/4] rounded-2xl mb-3" />
                      <Skeleton className="h-4 w-3/4 mb-1.5" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {stories.slice(4, 9).map(story => (
                    <Link key={story.id} to={`/story/${story.id}`} className="group block">
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all">
                        <img
                          src={story.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop`}
                          alt={story.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform">
                          <p className="text-xs text-white/90 line-clamp-2">{story.description}</p>
                        </div>
                        {story.isOfficial && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black rounded-full uppercase shadow-lg">
                            官方
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1 mb-0.5">
                        {story.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{story.author?.username}</span>
                        {(story as any).viewCount > 0 && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span>{(story as any).viewCount} 阅</span>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Active branches */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-7 bg-gradient-to-b from-purple-500 to-violet-600 rounded-full" />
                <div className="flex-1 flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">活跃分支</h2>
                  <Link to="/branches" className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1">
                    更多 <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
              {newBranches.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 space-y-3">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newBranches.slice(0, 4).map(branch => (
                    <Link
                      key={branch.id}
                      to={`/branch/${branch.id}`}
                      className="group p-5 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-lg hover:shadow-purple-500/5 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-full">
                          <GitBranch size={10} className="inline mr-0.5" />
                          分支
                        </span>
                        <span className="text-xs text-gray-400 truncate">衍生自：{branch.parentStory?.title}</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors mb-2 line-clamp-1">
                        {branch.title}
                      </h4>
                      {branch.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{branch.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-500">
                          <span>{branch.author?.username}</span>
                          <span className="text-gray-300">·</span>
                          <span>{timeAgo(branch.updatedAt || branch.createdAt)}</span>
                        </div>
                        <span className="text-purple-400 group-hover:text-purple-600 transition-colors font-bold text-xs flex items-center gap-0.5">
                          查看详情 <ChevronRight size={12} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right sidebar: 30% */}
          <div className="lg:w-[30%] space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: BookOpen, label: '作品', value: stories.length, color: 'from-blue-500 to-indigo-600' },
                { icon: Users, label: '作者', value: Math.max(...stories.map(s => (s as any).authorId ? 1 : 0), 0) + 3, color: 'from-emerald-500 to-teal-600' },
                { icon: GitBranch, label: '分支', value: newBranches.length, color: 'from-purple-500 to-violet-600' },
              ].map(stat => (
                <div key={stat.label} className="p-4 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-center hover:shadow-md transition-all">
                  <div className={`w-8 h-8 mx-auto mb-2 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                    <stat.icon size={14} className="text-white" />
                  </div>
                  <div className="text-lg font-black text-gray-900 dark:text-white">{stat.value || 0}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Ranking */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Flame size={16} className="text-orange-500" />
                <h3 className="text-sm font-black text-gray-900 dark:text-white flex-1">热度排行榜</h3>
              </div>
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                {storiesLoading && stories.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 animate-pulse border-b border-gray-50 dark:border-gray-900 last:border-0">
                      <Skeleton className="w-5 h-5" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2 w-1/4" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col">
                    {stories.slice(0, 8).map((story: any, index) => (
                      <Link
                        key={story.id}
                        to={`/story/${story.id}`}
                        className="flex items-center gap-3 py-2.5 group border-b border-gray-50 dark:border-gray-900 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <span className={`w-6 h-6 flex items-center justify-center text-xs font-black rounded-lg shrink-0 ${
                          index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-sm' :
                          index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white shadow-sm' :
                          'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                            {story.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span>{story.author?.username}</span>
                            <span>·</span>
                            <span>{(story as any).viewCount || 0} 阅</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Booklists */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <BookMarked size={16} className="text-emerald-500" />
                <h3 className="text-sm font-black text-gray-900 dark:text-white flex-1">精选书单</h3>
              </div>
              <div className="space-y-3">
                {hotBooklists.length === 0 ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))
                ) : (
                  hotBooklists.map((list) => (
                    <Link
                      key={list.id}
                      to={`/booklist/${list.id}`}
                      className="group block p-4 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md hover:shadow-emerald-500/5 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <BookMarked size={14} className="text-emerald-500 shrink-0" />
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-1">
                          {list.title}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-400 pl-6">
                        {list._count?.items} 部作品 · 来自 {list.creator?.username || '资深编辑'}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            {/* CTA */}
            <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl shadow-indigo-500/20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
              <div className="relative">
                <div className="w-12 h-12 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <PenLine size={22} className="text-white" />
                </div>
                <h4 className="text-lg font-black text-white mb-2">成为签约作者</h4>
                <p className="text-sm text-white/80 leading-relaxed mb-5">
                  如果你热爱创作，追求逻辑极致，这里有百万级别的创作扶持金和专业的编辑指导。
                </p>
                <button className="w-full py-3 bg-white text-indigo-700 text-sm font-black rounded-xl hover:bg-gray-100 transition-all shadow-lg active:scale-95">
                  提交样章
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Explore */}
        <section className="mt-12 pt-10 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-7 bg-gradient-to-b from-rose-500 to-pink-600 rounded-full" />
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">探索全站</h2>
            </div>
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {['热门', '新书', '官方', '完结'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setExploreTab(tab)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    exploreTab === tab
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {storiesLoading && stories.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <Skeleton className="aspect-[3/4] rounded-2xl mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-1.5" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : sortedStories.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">
              暂无 {exploreTab} 相关内容
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sortedStories.map((story) => (
                <Link key={story.id} to={`/story/${story.id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all">
                    <img
                      src={story.coverImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop`}
                      alt={story.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {story.status === 'completed' && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full uppercase shadow-lg">
                        完结
                      </div>
                    )}
                    {story.isOfficial && !story.status?.includes('completed') && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black rounded-full uppercase shadow-lg">
                        官方
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1 mb-0.5">
                    {story.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{story.author?.username}</span>
                    {(story as any).viewCount > 0 && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span>{(story as any).viewCount} 阅</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-10 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 md:px-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Sparkles size={12} className="text-white" />
              </div>
              <span className="text-sm font-black text-gray-900 dark:text-white ml-2">平行宇宙</span>
            </div>
            <div className="flex gap-8 text-xs text-gray-400">
              {['关于我们', '创作指南', '版权保护', '帮助中心'].map(f => (
                <Link key={f} to="#" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors font-medium">{f}</Link>
              ))}
            </div>
            <div className="flex flex-col items-end gap-1">
              {config.contactEmail && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Mail size={12} />
                  <span>{config.contactEmail}</span>
                </div>
              )}
              <div className="text-[10px] text-gray-300 dark:text-gray-700 font-medium tracking-wider text-right">
                <span>{config.footerCopyright || '© 2026 PARALLEL UNIVERSE STORY PLATFORM.'}</span>
                {config.icp && <span className="ml-2 opacity-60">{config.icp}</span>}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
