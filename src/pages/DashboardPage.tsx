import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { storyService, branchService, spinoffService, booklistService } from '../api/storyService';
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
  Zap
} from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'stories' | 'branches' | 'spinoffs' | 'booklists'>('overview');

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

  const isLoading = isStoriesLoading || isBranchesLoading || isSpinoffsLoading || isBooklistsLoading;

  if (isLoading && !stories?.length && !branches?.length) {
    return (
      <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-xl border border-gray-100 dark:border-gray-800">
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
        <div className="flex p-1.5 bg-white dark:bg-gray-900 rounded-2xl w-fit border border-gray-100 dark:border-gray-800">
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
    { label: '主线故事', value: storyList.length, icon: Book, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: '平行分支', value: branchList.length, icon: GitBranch, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: '精彩番外', value: spinoffList.length, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: '精选书单', value: booklistList.length, icon: List, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl border-4 border-white dark:border-gray-800">
            {user?.username?.[0] || 'U'}
          </div>
          <div className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{user?.username}</h1>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-200 dark:border-blue-800">
                {user?.role === 'author' ? '官方作者' : '时空旅行者'}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{user?.email}</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
            <button onClick={() => navigate('/profile')} className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-black hover:opacity-90 transition-all flex items-center gap-2">
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
            <div key={i} className={`${stat.bg} p-6 rounded-3xl border border-white dark:border-gray-800 shadow-sm text-center min-w-[120px]`}>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-white dark:bg-gray-900 rounded-2xl w-fit border border-gray-100 dark:border-gray-800 shadow-sm mx-auto md:mx-0">
        {[
          { id: 'overview', label: '总览', icon: LayoutDashboard },
          { id: 'stories', label: '我的主线', icon: Book },
          { id: 'branches', label: '我的分支', icon: GitBranch },
          { id: 'spinoffs', label: '我的番外', icon: Star },
          { id: 'booklists', label: '我的书单', icon: List },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
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
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <Zap size={20} className="text-blue-600" />
                快速创作
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => navigate('/story/create')}
                  className="p-6 rounded-2xl border-2 border-dashed border-blue-100 dark:border-blue-900/30 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left group"
                >
                  <Plus size={24} className="text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                  <div className="font-black text-gray-900 dark:text-white">创建主线</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">开启新宇宙</div>
                </button>
                <button 
                  onClick={() => navigate('/spinoff')}
                  className="p-6 rounded-2xl border-2 border-dashed border-amber-100 dark:border-amber-900/30 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all text-left group"
                >
                  <Star size={24} className="text-amber-600 mb-3 group-hover:scale-110 transition-transform" />
                  <div className="font-black text-gray-900 dark:text-white">写个番外</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">探索角色另一面</div>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <Clock size={20} className="text-purple-600" />
                最近更新
              </h3>
              <div className="space-y-4">
                {[...storyList, ...branchList].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3).map((item, i) => (
                  <Link 
                    key={i} 
                    to={(item as any).parentStoryId ? `/branch/${item.id}` : `/story/${item.id}`}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${(item as any).parentStoryId ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                        {(item as any).parentStoryId ? <GitBranch size={18} /> : <Book size={18} />}
                      </div>
                      <div>
                        <div className="text-sm font-black text-gray-900 dark:text-white">{item.title}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(item.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </Link>
                ))}
                {storyList.length === 0 && branchList.length === 0 && (
                  <p className="text-gray-400 text-sm italic py-4">暂无活动记录</p>
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
                className="group bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <Book size={24} />
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {story._count?.chapters || 0} 章节
                    </span>
                    <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {story._count?.branches || 0} 分支
                    </span>
                  </div>
                </div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{story.title}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 font-light">{story.description}</p>
              </Link>
            ))}
            <Link 
              to="/story/create"
              className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all group min-h-[200px]"
            >
              <Plus size={32} className="text-gray-400 group-hover:text-blue-500 mb-2" />
              <span className="text-sm font-black text-gray-500 group-hover:text-blue-500">创建新主线</span>
            </Link>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {branchList.map(branch => (
              <Link 
                key={branch.id} 
                to={`/branch/${branch.id}`}
                className="group bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-purple-500 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <GitBranch size={24} />
                  </div>
                  {branch.isOfficial && (
                    <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/20">
                      官方认证
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">原著：{branch.parentStory?.title}</div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 transition-colors">{branch.title}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 font-light">{branch.description}</p>
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
                className="group bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-amber-500 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <Star size={24} />
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">原著：{spinoff.originalStory?.title}</div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 transition-colors">{spinoff.title}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 font-light leading-relaxed italic">"{spinoff.content.substring(0, 100)}..."</p>
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
                className="group bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <List size={24} />
                  </div>
                  <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                    {list._count?.items || 0} 章节
                  </span>
                </div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 transition-colors">{list.title}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 font-light">{list.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
