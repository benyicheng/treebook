import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { storyService, branchService, spinoffService, booklistService } from '../api/storyService';
import { readingProgressService } from '../api/readingProgressService';
import { useQuery } from '@tanstack/react-query';
import {
  Book,
  GitBranch,
  Star,
  List,
  Settings,
  Plus,
  ChevronRight,
  Clock,
  LayoutDashboard,
  BarChart3,
  Eye,
  Heart,
  TrendingUp,
  BookOpen,
  Zap
} from 'lucide-react';
import { Skeleton } from '../components/ui';

type TabId = 'overview' | 'stories' | 'branches' | 'spinoffs' | 'booklists' | 'analytics';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, logout } = useAuthStore();
  const tabFromParam = searchParams.get('tab') as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(tabFromParam || 'overview');

  // Sync tab → URL query param
  useEffect(() => {
    const current = searchParams.get('tab');
    if (activeTab === 'overview' && current) {
      // clear param when going back to overview
      const next = new URLSearchParams(searchParams);
      next.delete('tab');
      setSearchParams(next, { replace: true });
    } else if (activeTab !== 'overview' && current !== activeTab) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', activeTab);
      setSearchParams(next, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  // Read tab from URL on mount
  useEffect(() => {
    if (tabFromParam && tabFromParam !== activeTab) {
      setActiveTab(tabFromParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const { data: stories = [], isLoading: isStoriesLoading } = useQuery({
    queryKey: ['myStories'],
    queryFn: storyService.getMy,
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const { data: branches = [], isLoading: isBranchesLoading } = useQuery({
    queryKey: ['myBranches'],
    queryFn: branchService.getMy,
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const { data: spinoffs = [], isLoading: isSpinoffsLoading } = useQuery({
    queryKey: ['mySpinoffs'],
    queryFn: spinoffService.getMy,
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const { data: booklists = [], isLoading: isBooklistsLoading } = useQuery({
    queryKey: ['myBooklists'],
    queryFn: booklistService.getMy,
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const { data: readingStats } = useQuery({
    queryKey: ['readingStats'],
    queryFn: readingProgressService.getStats,
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const isLoading = isStoriesLoading || isBranchesLoading || isSpinoffsLoading || isBooklistsLoading;

  if (isLoading && !stories?.length && !branches?.length) {
    return (
      <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-ink-800 rounded-[2.5rem] p-10 shadow-xl border border-ink-100 dark:border-ink-700">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="flex-1 space-y-4 w-full">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-24 w-28 rounded-3xl" />)}
            </div>
          </div>
        </div>
        <div className="flex p-1.5 bg-ink-50 dark:bg-ink-800 rounded-2xl w-fit border border-ink-100 dark:border-ink-700">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-24 rounded-xl mx-1" />)}
        </div>
      </div>
    );
  }

  // Ensure stories is an array
  const storyList = Array.isArray(stories) ? stories : [];
  const branchList = Array.isArray(branches) ? branches : [];
  const spinoffList = Array.isArray(spinoffs) ? spinoffs : [];
  const booklistList = Array.isArray(booklists) ? booklists : [];

  const stats = [
    { label: '主线故事', value: storyList.length, icon: Book, color: 'text-accent-400', bg: 'bg-accent-50 dark:bg-accent-500/10' },
    { label: '平行分支', value: branchList.length, icon: GitBranch, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-accent-500/10' },
    { label: '精彩番外', value: spinoffList.length, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: '精选书单', value: booklistList.length, icon: List, color: 'text-accent-400', bg: 'bg-accent-50 dark:bg-accent-500/10' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Profile Header */}
      <div className="bg-white dark:bg-ink-800 rounded-[2.5rem] p-10 shadow-xl border border-ink-100 dark:border-ink-700 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center text-white text-5xl font-black shadow-2xl border-4 border-white dark:border-ink-700">
            {user?.username?.[0] || 'U'}
          </div>
          <div className="absolute bottom-1 right-1 w-8 h-8 bg-accent-400 border-4 border-white dark:border-ink-700 rounded-full"></div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-4xl font-black text-ink-800 dark:text-white tracking-tight">{user?.username}</h1>
              <span className="px-3 py-1 bg-accent-100 dark:bg-accent-500/15 text-accent-500 dark:text-accent-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-accent-200 dark:border-accent-600">
                {user?.role === 'author' ? '官方作者' : '时空旅行者'}
              </span>
            </div>
            <p className="text-ink-500 dark:text-ink-400 font-medium">{user?.email}</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
            <button onClick={() => navigate('/profile')} className="px-6 py-2.5 bg-ink-800 dark:bg-white text-white dark:text-ink-800 rounded-xl text-sm font-black hover:opacity-90 transition-all flex items-center gap-2">
              <Settings size={16} />
              编辑资料
            </button>
            <button onClick={logout} className="px-6 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-black hover:bg-red-100 transition-all">
              注销登录
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          {stats.slice(0, 2).map((stat, i) => (
            <div key={i} className={`${stat.bg} p-6 rounded-3xl border border-white dark:border-ink-700 shadow-sm text-center min-w-[120px]`}>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] font-black text-ink-400 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-ink-50 dark:bg-ink-800 rounded-2xl w-fit border border-ink-100 dark:border-ink-700 shadow-sm mx-auto md:mx-0">
        {[
          { id: 'overview', label: '总览', icon: LayoutDashboard },
          { id: 'stories', label: '我的主线', icon: Book },
          { id: 'branches', label: '我的分支', icon: GitBranch },
          { id: 'spinoffs', label: '我的番外', icon: Star },
          { id: 'booklists', label: '我的书单', icon: List },
          { id: 'analytics', label: '数据分析', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
              activeTab === tab.id 
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-400/20 scale-[1.02]' 
                : 'text-ink-500 hover:text-ink-800 dark:hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Recent Activity or Quick Actions */}
            <div className="bg-white dark:bg-ink-800 rounded-[2rem] p-8 border border-ink-100 dark:border-ink-700 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-ink-800 dark:text-white flex items-center gap-3">
                <Zap size={20} className="text-accent-500" />
                快速创作
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => navigate('/story/create')}
                  className="p-6 rounded-2xl border-2 border-dashed border-accent-100 dark:border-accent-600/30 hover:border-accent-400 hover:bg-accent-50 dark:hover:bg-blue-900/10 transition-all text-left group"
                >
                  <Plus size={24} className="text-accent-500 mb-3 group-hover:scale-110 transition-transform" />
                  <div className="font-black text-ink-800 dark:text-white">创建主线</div>
                  <div className="text-[10px] text-ink-400 font-bold uppercase tracking-widest mt-1">开启新宇宙</div>
                </button>
                <button 
                  onClick={() => navigate('/spinoff')}
                  className="p-6 rounded-2xl border-2 border-dashed border-amber-100 dark:border-amber-900/30 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all text-left group"
                >
                  <Star size={24} className="text-amber-600 mb-3 group-hover:scale-110 transition-transform" />
                  <div className="font-black text-ink-800 dark:text-white">写个番外</div>
                  <div className="text-[10px] text-ink-400 font-bold uppercase tracking-widest mt-1">探索角色另一面</div>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-ink-800 rounded-[2rem] p-8 border border-ink-100 dark:border-ink-700 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-ink-800 dark:text-white flex items-center gap-3">
                <Clock size={20} className="text-accent-500" />
                最近更新
              </h3>
              <div className="space-y-4">
                {[...storyList, ...branchList].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3).map((item, i) => (
                  <Link 
                    key={i} 
                    to={(item as any).parentStoryId ? `/branch/${item.id}` : `/story/${item.id}`}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-ink-50 dark:hover:bg-ink-700 transition-all border border-transparent hover:border-ink-100 dark:hover:border-ink-600"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${(item as any).parentStoryId ? 'bg-purple-50 dark:bg-accent-500/10 text-accent-500' : 'bg-accent-50 dark:bg-accent-500/10 text-accent-500'}`}>
                        {(item as any).parentStoryId ? <GitBranch size={18} /> : <Book size={18} />}
                      </div>
                      <div>
                        <div className="text-sm font-black text-ink-800 dark:text-white">{item.title}</div>
                        <div className="text-[10px] text-ink-400 font-bold uppercase tracking-widest">{new Date(item.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-ink-300" />
                  </Link>
                ))}
                {storyList.length === 0 && branchList.length === 0 && (
                  <p className="text-ink-400 text-sm italic py-4">暂无活动记录</p>
                )}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'stories') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {storyList.map(story => (
              <Link 
                key={story.id} 
                to={`/story/${story.id}`}
                className="group bg-ink-50 dark:bg-ink-800 p-8 rounded-[2rem] border border-ink-100 dark:border-ink-700 hover:border-accent-400 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-accent-50 dark:bg-accent-500/10 text-accent-500 rounded-2xl group-hover:scale-110 transition-transform">
                    <Book size={24} />
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-ink-50 dark:bg-ink-700 text-ink-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {story._count?.chapters || 0} 章节
                    </span>
                    <span className="px-3 py-1 bg-ink-50 dark:bg-ink-700 text-ink-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {story._count?.branches || 0} 分支
                    </span>
                  </div>
                </div>
                <h4 className="text-xl font-black text-ink-800 dark:text-white mb-2 group-hover:text-accent-500 transition-colors">{story.title}</h4>
                <p className="text-ink-500 dark:text-ink-400 text-sm line-clamp-2 font-light">{story.description}</p>
              </Link>
            ))}
            <Link 
              to="/story/create"
              className="flex flex-col items-center justify-center p-8 bg-ink-50 dark:bg-ink-700/50 rounded-[2rem] border-2 border-dashed border-ink-200 dark:border-ink-600 hover:border-accent-400 transition-all group min-h-[200px]"
            >
              <Plus size={32} className="text-ink-400 group-hover:text-accent-400 mb-2" />
              <span className="text-sm font-black text-ink-500 group-hover:text-accent-400">创建新主线</span>
            </Link>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {branchList.map(branch => (
              <Link 
                key={branch.id} 
                to={`/branch/${branch.id}`}
                className="group bg-ink-50 dark:bg-ink-800 p-8 rounded-[2rem] border border-ink-100 dark:border-ink-700 hover:border-purple-500 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-purple-50 dark:bg-accent-500/10 text-accent-500 rounded-2xl group-hover:scale-110 transition-transform">
                    <GitBranch size={24} />
                  </div>
                  {branch.isOfficial && (
                    <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/20">
                      官方认证
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-ink-400 font-black uppercase tracking-widest mb-1">原著：{branch.parentStory?.title}</div>
                <h4 className="text-xl font-black text-ink-800 dark:text-white mb-2 group-hover:text-accent-500 transition-colors">{branch.title}</h4>
                <p className="text-ink-500 dark:text-ink-400 text-sm line-clamp-2 font-light">{branch.description}</p>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'spinoffs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {spinoffList.map(spinoff => (
              <Link 
                key={spinoff.id} 
                to={`/spinoff/${spinoff.id}`}
                className="group bg-ink-50 dark:bg-ink-800 p-8 rounded-[2rem] border border-ink-100 dark:border-ink-700 hover:border-amber-500 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <Star size={24} />
                  </div>
                </div>
                <div className="text-[10px] text-ink-400 font-black uppercase tracking-widest mb-1">原著：{spinoff.originalStory?.title}</div>
                <h4 className="text-xl font-black text-ink-800 dark:text-white mb-2 group-hover:text-amber-600 transition-colors">{spinoff.title}</h4>
                <p className="text-ink-500 dark:text-ink-400 text-sm line-clamp-3 font-light leading-relaxed italic">"{spinoff.content.substring(0, 100)}..."</p>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'booklists' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {booklistList.map(list => (
              <Link 
                key={list.id} 
                to={`/booklist/${list.id}`}
                className="group bg-ink-50 dark:bg-ink-800 p-8 rounded-[2rem] border border-ink-100 dark:border-ink-700 hover:border-accent-400 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-accent-50 dark:bg-accent-500/10 text-accent-500 rounded-2xl group-hover:scale-110 transition-transform">
                    <List size={24} />
                  </div>
                  <span className="px-3 py-1 bg-ink-50 dark:bg-ink-700 text-ink-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                    {list._count?.items || 0} 章节
                  </span>
                </div>
                <h4 className="text-xl font-black text-ink-800 dark:text-white mb-2 group-hover:text-accent-500 transition-colors">{list.title}</h4>
                <p className="text-ink-500 dark:text-ink-400 text-sm line-clamp-2 font-light">{list.description}</p>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Reading Stats */}
            <div className="bg-white dark:bg-ink-800 rounded-[2rem] p-8 border border-ink-100 dark:border-ink-700 shadow-sm">
              <h3 className="text-xl font-black text-ink-800 dark:text-white flex items-center gap-3 mb-6">
                <BookOpen size={20} className="text-accent-500" />
                阅读统计
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-accent-50 dark:bg-accent-500/10 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-accent-500">{readingStats?.total ?? '-'}</div>
                  <div className="text-xs font-bold text-ink-400 uppercase tracking-widest mt-2">总阅读章节</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-emerald-600">{readingStats?.completed ?? '-'}</div>
                  <div className="text-xs font-bold text-ink-400 uppercase tracking-widest mt-2">已完成</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-amber-600">{readingStats?.inProgress ?? '-'}</div>
                  <div className="text-xs font-bold text-ink-400 uppercase tracking-widest mt-2">在读中</div>
                </div>
              </div>
            </div>

            {/* Content Overview */}
            <div className="bg-white dark:bg-ink-800 rounded-[2rem] p-8 border border-ink-100 dark:border-ink-700 shadow-sm">
              <h3 className="text-xl font-black text-ink-800 dark:text-white flex items-center gap-3 mb-6">
                <TrendingUp size={20} className="text-accent-500" />
                内容概览
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border border-ink-100 dark:border-ink-700 text-center">
                  <Book size={24} className="mx-auto text-accent-500 mb-2" />
                  <div className="text-2xl font-black text-ink-800 dark:text-white">{storyList.length}</div>
                  <div className="text-[10px] font-black text-ink-400 uppercase tracking-widest">主线故事</div>
                </div>
                <div className="p-5 rounded-2xl border border-ink-100 dark:border-ink-700 text-center">
                  <GitBranch size={24} className="mx-auto text-purple-500 mb-2" />
                  <div className="text-2xl font-black text-ink-800 dark:text-white">{branchList.length}</div>
                  <div className="text-[10px] font-black text-ink-400 uppercase tracking-widest">平行分支</div>
                </div>
                <div className="p-5 rounded-2xl border border-ink-100 dark:border-ink-700 text-center">
                  <Star size={24} className="mx-auto text-amber-500 mb-2" />
                  <div className="text-2xl font-black text-ink-800 dark:text-white">{spinoffList.length}</div>
                  <div className="text-[10px] font-black text-ink-400 uppercase tracking-widest">精彩番外</div>
                </div>
                <div className="p-5 rounded-2xl border border-ink-100 dark:border-ink-700 text-center">
                  <List size={24} className="mx-auto text-accent-400 mb-2" />
                  <div className="text-2xl font-black text-ink-800 dark:text-white">{booklistList.length}</div>
                  <div className="text-[10px] font-black text-ink-400 uppercase tracking-widest">精选书单</div>
                </div>
              </div>
            </div>

            {/* Stories detail stats */}
            {storyList.length > 0 && (
              <div className="bg-white dark:bg-ink-800 rounded-[2rem] p-8 border border-ink-100 dark:border-ink-700 shadow-sm">
                <h3 className="text-xl font-black text-ink-800 dark:text-white flex items-center gap-3 mb-6">
                  <Eye size={20} className="text-accent-500" />
                  作品数据
                </h3>
                <div className="space-y-4">
                  {storyList.map(story => (
                    <div key={story.id} className="flex items-center justify-between p-4 rounded-2xl bg-ink-50 dark:bg-ink-700/50 border border-ink-100 dark:border-ink-700">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="p-2 bg-accent-50 dark:bg-accent-500/10 rounded-xl shrink-0">
                          <Book size={18} className="text-accent-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-black text-ink-800 dark:text-white truncate">{story.title}</div>
                          <div className="text-[10px] text-ink-400 font-bold uppercase tracking-widest">
                            {story.viewCount ?? 0} 次浏览 · {story._count?.chapters ?? 0} 章节
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-ink-400">
                          <Heart size={14} className="text-red-400" />
                          <span>{story._count?.branches ?? 0}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          story.status === 'ongoing' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600' :
                          story.status === 'completed' ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-500' :
                          'bg-ink-100 dark:bg-ink-700 text-ink-400'
                        }`}>
                          {story.status === 'ongoing' ? '连载中' : story.status === 'completed' ? '已完结' : '暂停'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
