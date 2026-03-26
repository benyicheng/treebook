import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStoryStore } from '../../stores/useStoryStore';
import { useAuthStore } from '../../stores/useAuthStore';
import StoryBranchTree from '../../components/StoryTree/StoryBranchTree';
import { BookOpen, GitBranch, MessageSquare, Edit3, Share2, PlusCircle, AlertCircle, Users, BookMarked, ArrowRight, ShieldCheck, Star, Sparkles } from 'lucide-react';
import ChapterEditor from '../../components/Editor/ChapterEditor';
import { chapterService, branchService, storyService, spinoffService } from '../../api/storyService';
import Modal from '../../components/Modal';
import CharacterManager from './CharacterManager';
import AddToBooklistModal from '../../components/AddToBooklistModal';

const MainlinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentStory, fetchStoryById, isLoading } = useStoryStore();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'tree' | 'chapters' | 'characters'>('overview');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // Modal States
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isSpinoffModalOpen, setIsSpinoffModalOpen] = useState(false);
  const [newBranchData, setNewBranchData] = useState({
    title: '',
    description: '',
    parentChapterId: '',
  });
  const [newChapterData, setNewChapterData] = useState({
    title: '',
    orderIndex: 0,
  });
  const [editStoryData, setEditStoryData] = useState({
    title: '',
    description: '',
    coverImage: '',
  });
  const [newSpinoffData, setNewSpinoffData] = useState({
    title: '',
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加入书单
  const [booklistTargetChapter, setBooklistTargetChapter] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (id) {
      fetchStoryById(id);
    }
  }, [id, fetchStoryById]);

  useEffect(() => {
    if (currentStory && currentStory.chapters.length > 0 && !newBranchData.parentChapterId) {
      setNewBranchData(prev => ({ ...prev, parentChapterId: currentStory.chapters[0].id }));
    }
    if (currentStory) {
      setNewChapterData(prev => ({ ...prev, orderIndex: currentStory.chapters.length + 1 }));
    }
  }, [currentStory]);

  if (isLoading || !currentStory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAuthor = user?.id === currentStory.authorId;

  const handleSaveChapter = async (content: string) => {
    if (editingChapterId) {
      try {
        await chapterService.update(editingChapterId, { content });
        alert('章节已保存');
        setEditingChapterId(null);
        if (id) fetchStoryById(id);
      } catch (err) {
        alert('保存失败');
      }
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }
    setIsSubmitting(true);
    try {
      const branch = await branchService.create({
        ...newBranchData,
        parentStoryId: id,
        branchType: 'parallel',
        isOfficial: isAuthor, // 只有原作者创建的是官方分支
      });
      setIsBranchModalOpen(false);
      navigate(`/branch/${branch.id}`);
    } catch (err) {
      alert('创建分支失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await chapterService.create({
        ...newChapterData,
        storyId: id,
        content: '<p>新章节内容...</p>',
      });
      setIsChapterModalOpen(false);
      if (id) fetchStoryById(id);
      setNewChapterData({ title: '', orderIndex: currentStory.chapters.length + 2 });
    } catch (err) {
      alert('添加章节失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageStory = () => {
    if (!currentStory) return;
    setEditStoryData({
      title: currentStory.title,
      description: currentStory.description || '',
      coverImage: currentStory.coverImage || '',
    });
    setIsManageModalOpen(true);
  };

  const handleUpdateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      await storyService.update(id, editStoryData);
      setIsManageModalOpen(false);
      fetchStoryById(id);
      alert('故事信息已更新');
    } catch (err) {
      alert('更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSpinoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      await spinoffService.create({
        ...newSpinoffData,
        originalStoryId: id,
      });
      setIsSpinoffModalOpen(false);
      fetchStoryById(id);
      setNewSpinoffData({ title: '', content: '' });
      alert('番外发布成功');
    } catch (err) {
      alert('发布失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img 
            src={currentStory.coverImage || `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(currentStory.title)}+background&image_size=landscape_16_9`} 
            className="w-full h-full object-cover"
            alt={currentStory.title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
          <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-black rounded-full uppercase tracking-wider">主线故事</span>
                {currentStory.author?.role === 'author' && (
                  <span className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-full uppercase tracking-wider">官方认证</span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{currentStory.title}</h1>
              <div className="flex items-center gap-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                    {currentStory.author?.username?.[0] || 'A'}
                  </div>
                  <span className="text-sm font-bold">{currentStory.author?.username}</span>
                </div>
                <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                <span className="text-sm">{new Date(currentStory.createdAt).toLocaleDateString()} 发布</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const firstChapterId = currentStory.chapters?.[0]?.id;
                  if (firstChapterId) {
                    navigate(`/read/${firstChapterId}`);
                  } else {
                    alert('该故事暂无章节，请先添加章节');
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-lg active:scale-95"
              >
                <BookOpen size={18} />
                开始阅读
              </button>
              {isAuthor && (
                <button 
                  onClick={handleManageStory}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                >
                  <Edit3 size={18} />
                  管理故事
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-8 border-b border-gray-100 dark:border-gray-700">
          {[
            { id: 'overview', label: '详情概览', icon: BookOpen },
            { id: 'tree', label: '平行宇宙树', icon: GitBranch },
            { id: 'chapters', label: '章节目录', icon: MessageSquare },
            { id: 'characters', label: '角色档案', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all relative ${
                activeTab === tab.id 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-500">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  故事简介
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap font-light">
                  {currentStory.description || '暂无描述'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                    最新章节
                  </h3>
                  <button onClick={() => setActiveTab('chapters')} className="text-blue-600 font-bold text-sm hover:underline">查看全部章节</button>
                </div>
                <div className="space-y-4">
                  {currentStory.chapters.slice(-3).map((chapter, i) => (
                    <div key={chapter.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg text-xs font-black text-gray-400 border border-gray-100 dark:border-gray-700">
                          {chapter.orderIndex}
                        </span>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{chapter.title}</h4>
                          <span className="text-xs text-gray-400">{new Date(chapter.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Link to={`/read/${chapter.id}`} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <BookOpen size={20} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* 平行宇宙分支列表 */}
              {currentStory.branches.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                      平行宇宙
                      <span className="ml-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-black rounded-full">
                        {currentStory.branches.length}
                      </span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('tree')}
                      className="text-purple-600 font-bold text-sm hover:underline"
                    >
                      查看宇宙树
                    </button>
                  </div>
                  <div className="space-y-3">
                    {currentStory.branches.slice(0, 5).map(branch => (
                      <Link
                        key={branch.id}
                        to={`/branch/${branch.id}`}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/10 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all group"
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${branch.isOfficial ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'}`}>
                          {branch.isOfficial ? <ShieldCheck size={16} /> : <GitBranch size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors text-sm line-clamp-1">{branch.title}</h4>
                            {branch.isOfficial && (
                              <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full uppercase shrink-0">官方</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {branch.parentChapter && (
                              <span>从第 {branch.parentChapter.orderIndex} 章分歧</span>
                            )}
                            {branch.parentChapter && branch._count && (
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            )}
                            {branch._count !== undefined && (
                              <span>{branch._count.chapters} 章</span>
                            )}
                            {branch.author && (
                              <>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span>{branch.author.username}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-gray-300 group-hover:text-purple-500 transition-colors shrink-0" />
                      </Link>
                    ))}
                    {currentStory.branches.length > 5 && (
                      <button
                        onClick={() => setActiveTab('tree')}
                        className="w-full py-3 text-sm font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-2xl transition-all"
                      >
                        查看全部 {currentStory.branches.length} 个平行宇宙 →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 番外作品展示 */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                    番外作品
                    {(currentStory.spinoffs || []).length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-black rounded-full">
                        {(currentStory.spinoffs || []).length}
                      </span>
                    )}
                  </h3>
                  {isAuthenticated && (
                    <button
                      onClick={() => setIsSpinoffModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-all"
                    >
                      <PlusCircle size={16} />
                      发布番外
                    </button>
                  )}
                </div>
                {(currentStory.spinoffs || []).length > 0 ? (
                  <div className="space-y-3">
                    {(currentStory.spinoffs || []).slice(0, 5).map(spinoff => (
                      <Link
                        key={spinoff.id}
                        to={`/spinoff/${spinoff.id}`}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/10 border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all group"
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${spinoff.isOfficial ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-600'}`}>
                          <Star size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors text-sm line-clamp-1">{spinoff.title}</h4>
                            {spinoff.isOfficial && (
                              <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full uppercase shrink-0">官方</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{spinoff.author?.username}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{new Date(spinoff.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors shrink-0" />
                      </Link>
                    ))}
                    {(currentStory.spinoffs || []).length > 5 && (
                      <button
                        onClick={() => navigate('/spinoff')}
                        className="w-full py-3 text-sm font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-2xl transition-all"
                      >
                        查看全部 {(currentStory.spinoffs || []).length} 个番外作品 →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Sparkles size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400 text-sm">暂无番外作品</p>
                    {isAuthenticated && (
                      <button
                        onClick={() => setIsSpinoffModalOpen(true)}
                        className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-all"
                      >
                        创建第一个番外
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl text-white">
                <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                  <GitBranch size={24} />
                  参与创作
                </h3>
                <p className="text-blue-100 mb-8 font-light leading-relaxed">
                  觉得故事结局不尽如人意？在任何章节创建你的平行宇宙分支，开启全新的故事线。
                </p>
                <button 
                  onClick={() => setIsBranchModalOpen(true)}
                  className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black hover:bg-blue-50 transition-all shadow-lg active:scale-95"
                >
                  创建分支
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-black mb-6">故事统计</h3>
                <div className="space-y-6">
                  {[
                    { label: '总阅读量', value: '12,504', color: 'text-blue-500' },
                    { label: '活跃分支', value: currentStory.branches.length, color: 'text-purple-500' },
                    { label: '收藏人数', value: '892', color: 'text-amber-500' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">{stat.label}</span>
                      <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tree' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-2xl font-black">宇宙分支网络</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-bold text-gray-500">主线章节</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-xs font-bold text-gray-500">官方分支</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-xs font-bold text-gray-500">社区分支</span>
                </div>
              </div>
            </div>
            <StoryBranchTree 
              chapters={currentStory.chapters} 
              branches={currentStory.branches} 
              onNodeClick={(id, type) => {
                if (type === 'chapter') {
                  if (isAuthor) {
                    setEditingChapterId(id);
                    setActiveTab('chapters');
                  } else {
                    // 非作者点击章节，默认准备在此章节创建分支
                    setNewBranchData(prev => ({ ...prev, parentChapterId: id }));
                    setIsBranchModalOpen(true);
                  }
                } else if (type === 'branch') {
                  navigate(`/branch/${id}`);
                }
              }}
            />
          </div>
        )}

        {activeTab === 'chapters' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {editingChapterId ? (
              <div className="p-8 h-[700px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black">编辑章节</h3>
                  <button onClick={() => setEditingChapterId(null)} className="text-gray-500 font-bold hover:text-gray-700">取消编辑</button>
                </div>
                <ChapterEditor 
                  chapterId={editingChapterId} 
                  initialContent={currentStory.chapters.find(c => c.id === editingChapterId)?.content || ''} 
                  onSave={handleSaveChapter}
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <div className="p-8 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                  <h3 className="text-xl font-black">全书目录</h3>
                  {isAuthor && (
                    <button 
                      onClick={() => setIsChapterModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                    >
                      <PlusCircle size={16} />
                      添加新章节
                    </button>
                  )}
                </div>
                {currentStory.chapters.length > 0 ? (
                  currentStory.chapters.map(chapter => (
                    <div key={chapter.id} className="p-8 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <span className="text-4xl font-black text-gray-100 dark:text-gray-800 group-hover:text-blue-100 dark:group-hover:text-blue-900 transition-colors w-12">
                            {chapter.orderIndex.toString().padStart(2, '0')}
                          </span>
                          <div>
                            <Link 
                              to={`/read/${chapter.id}`}
                              className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors mb-1 block hover:underline"
                            >
                              {chapter.title}
                            </Link>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                              <span>约 {(chapter.content.length / 2).toFixed(0)} 字</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>{new Date(chapter.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isAuthor && (
                            <button 
                              onClick={(e) => { e.preventDefault(); setEditingChapterId(chapter.id); }}
                              className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                              title="编辑章节"
                            >
                              <Edit3 size={20} />
                            </button>
                          )}
                          <button
                            onClick={() => setBooklistTargetChapter({ id: chapter.id, title: chapter.title })}
                            className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                            title="加入书单"
                          >
                            <BookMarked size={20} />
                          </button>
                          <button className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all">
                            <Share2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400">
                      <BookOpen size={40} />
                    </div>
                    <p className="text-gray-500 font-medium">暂无章节内容</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'characters' && (
          <CharacterManager storyId={id!} isAuthor={isAuthor} />
        )}
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isBranchModalOpen} 
        onClose={() => setIsBranchModalOpen(false)} 
        title="创建平行宇宙分支"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">分支标题</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="例如：如果主角选择了另一条路..."
              value={newBranchData.title}
              onChange={e => setNewBranchData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">分支描述</label>
            <textarea 
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              placeholder="简述这个平行宇宙的核心差异..."
              value={newBranchData.description}
              onChange={e => setNewBranchData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">起始章节</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={newBranchData.parentChapterId}
              onChange={e => setNewBranchData(prev => ({ ...prev, parentChapterId: e.target.value }))}
            >
              {currentStory.chapters.map(c => (
                <option key={c.id} value={c.id}>第 {c.orderIndex} 章：{c.title}</option>
              ))}
            </select>
          </div>
          {!isAuthor && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex gap-3 text-amber-600 dark:text-amber-400">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-medium">您正在创建社区分支。您的分支将被标记为“社区”，并展现在平行宇宙树中。</p>
            </div>
          )}
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '正在创建...' : '开启新宇宙'}
          </button>
        </form>
      </Modal>

      <Modal 
        isOpen={isChapterModalOpen} 
        onClose={() => setIsChapterModalOpen(false)} 
        title="添加新章节"
      >
        <form onSubmit={handleCreateChapter} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">章节标题</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="例如：第一章 重生"
              value={newChapterData.title}
              onChange={e => setNewChapterData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">章节顺序</label>
            <input 
              type="number" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={newChapterData.orderIndex}
              onChange={e => setNewChapterData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) }))}
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '正在添加...' : '确认添加'}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title="管理故事信息"
      >        <form onSubmit={handleUpdateStory} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">故事标题</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={editStoryData.title}
              onChange={e => setEditStoryData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">封面图片 URL</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={editStoryData.coverImage}
              onChange={e => setEditStoryData(prev => ({ ...prev, coverImage: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">故事简介</label>
            <textarea 
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              value={editStoryData.description}
              onChange={e => setEditStoryData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : '保存修改'}
          </button>
        </form>
      </Modal>

      {/* Spinoff Modal */}
      <Modal
        isOpen={isSpinoffModalOpen}
        onClose={() => setIsSpinoffModalOpen(false)}
        title="发布番外作品"
      >
        <form onSubmit={handleCreateSpinoff} className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex gap-3 text-amber-700 dark:text-amber-300 text-sm">
            <Sparkles size={20} className="shrink-0" />
            <p>番外作品是基于当前故事的独立短篇，探索角色的另一面，无需遵循主线剧情。</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">番外标题</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              placeholder="例如：某个角色的过去..."
              value={newSpinoffData.title}
              onChange={e => setNewSpinoffData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">番外内容</label>
            <textarea
              required
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
              placeholder="开始你的创作..."
              value={newSpinoffData.content}
              onChange={e => setNewSpinoffData(prev => ({ ...prev, content: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black hover:bg-amber-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '发布中...' : '确认发布'}
          </button>
        </form>
      </Modal>

      {/* 加入书单弹窗 */}
      <AddToBooklistModal
        isOpen={!!booklistTargetChapter}
        onClose={() => setBooklistTargetChapter(null)}
        chapterId={booklistTargetChapter?.id || ''}
        chapterTitle={booklistTargetChapter?.title}
      />
    </div>
  );
};

export default MainlinePage;
