import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { BookOpen, GitBranch, MessageSquare, Edit3, Share2, PlusCircle, ArrowLeft, Bookmark, GitMerge, ChevronRight, Star, Sparkles, Crown, GitPullRequest, GitFork, Layers } from 'lucide-react';
import { ChapterEditor } from '../../components/Editor';
import { Modal } from '../../components/ui';
import { AddToBooklistModal } from '../../components/Booklist';
import MergeRequestModal from '../../components/Merge/MergeRequestModal';
import { useToast } from '../../components/notifications';
import { FollowButton } from '../../components/Interaction';
import { useBranch, useCertifyBranch, useCreateSubBranch } from '../../hooks/useBranches';
import { useCreateChapter, useUpdateChapter } from '../../hooks/useChapters';
import { useCreateSpinoff } from '../../hooks/useSpinoffs';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';

const BranchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // ─── React Query: data fetching ───
  const { data: currentBranch, isLoading } = useBranch(id || '');

  // ─── React Query: mutations ───
  const updateChapter = useUpdateChapter();
  const createChapter = useCreateChapter();
  const certifyBranch = useCertifyBranch();
  const createSubBranch = useCreateSubBranch();

  // ─── Local UI state ───
  const [activeTab, setActiveTab] = useState<'chapters' | 'editor'>('chapters');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // Modal State
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isSpinoffModalOpen, setIsSpinoffModalOpen] = useState(false);
  const [newChapterData, setNewChapterData] = useState({
    title: '',
    orderIndex: 1,
  });
  const [newSpinoffData, setNewSpinoffData] = useState({
    title: '',
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isSubBranchModalOpen, setIsSubBranchModalOpen] = useState(false);
  const [newSubBranchData, setNewSubBranchData] = useState({
    parentChapterId: '',
    title: '',
    description: '',
    branchType: 'alternate',
  });

  // 加入书单
  const [booklistTargetChapter, setBooklistTargetChapter] = useState<{ id: string; title: string } | null>(null);

  // Initialize orderIndex when branch loads
  useEffect(() => {
    if (currentBranch) {
      setNewChapterData(prev => ({ ...prev, orderIndex: currentBranch.chapters.length + 1 }));
    }
  }, [currentBranch]);

  // ─── Loading state ───
  if (isLoading || !currentBranch) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  // 权限判断：分支作者、主线故事作者或管理员可以编辑
  const isAuthor = !!(user && (
    user.id === currentBranch.authorId ||
    user.id === currentBranch.parentStory?.authorId ||
    user.role === 'admin'
  ));

  // 认证权限：只有主线作者或管理员可以认证
  const canCertify = !!(user && (
    user.id === currentBranch.parentStory?.authorId ||
    user.role === 'admin'
  ));

  // ─── Handlers ───
  const handleCertify = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await certifyBranch.mutateAsync({ id, certify: !currentBranch.isCertified });
      addToast('success', currentBranch.isCertified ? '已取消认证' : '分支已认证为金级');
    } catch (err) {
      addToast('error', '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveChapter = async (content: string) => {
    if (!editingChapterId) return;
    try {
      await updateChapter.mutateAsync({ id: editingChapterId, data: { content } });
      addToast('success', '章节已保存');
      setEditingChapterId(null);
      setActiveTab('chapters');
    } catch (err) {
      addToast('error', '保存失败');
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createChapter.mutateAsync({
        ...newChapterData,
        branchId: id,
        storyId: currentBranch.parentStoryId,
        content: '<p>新章节内容...</p>',
      });
      setIsChapterModalOpen(false);
      setNewChapterData({ title: '', orderIndex: (currentBranch.chapters.length || 0) + 2 });
    } catch (err) {
      addToast('error', '添加章节失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newSubBranchData.parentChapterId) return;
    setIsSubmitting(true);
    try {
      await createSubBranch.mutateAsync({
        parentBranchId: id,
        data: {
          parentChapterId: newSubBranchData.parentChapterId,
          title: newSubBranchData.title,
          description: newSubBranchData.description || undefined,
          branchType: newSubBranchData.branchType,
        },
      });
      setIsSubBranchModalOpen(false);
      setNewSubBranchData({
        parentChapterId: '',
        title: '',
        description: '',
        branchType: 'alternate',
      });
      addToast('success', '子分支已创建');
    } catch (err) {
      addToast('error', '创建子分支失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-ink-700 rounded-3xl overflow-hidden shadow-xl border border-ink-100 dark:border-ink-600">
        <div className="p-8 space-y-6">
          {/* 面包屑 + 分叉点上下文 */}
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink-400">
            <Link to={`/story/${currentBranch.parentStoryId}`} className="flex items-center gap-1.5 hover:text-accent-500 transition-colors">
              <ArrowLeft size={14} />
              {currentBranch.parentStory?.title}
            </Link>
            {currentBranch.parentChapter?.id && (
              <>
                <ChevronRight size={14} className="text-ink-300" />
                <Link
                  to={`/read/${currentBranch.parentChapter.id}`}
                  className="flex items-center gap-1 px-2.5 py-1 bg-accent-50 dark:bg-accent-500/10 text-accent-500 dark:text-accent-400 rounded-full hover:bg-accent-100 transition-colors"
                >
                  <GitMerge size={12} />
                  第 {currentBranch.parentChapter.orderIndex} 章：{currentBranch.parentChapter.title}
                </Link>
                <ChevronRight size={14} className="text-ink-300" />
                <span className="text-accent-500 dark:text-purple-400">本分支</span>
              </>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-accent-500 text-white text-xs font-black rounded-full uppercase tracking-wider">平行宇宙分支</span>
                {currentBranch.isOfficial && (
                  <span className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-full uppercase tracking-wider">官方认证</span>
                )}
              </div>
              <h1 className="text-4xl font-black text-ink-800 dark:text-white tracking-tight flex items-center gap-3">
                {currentBranch.title}
                {currentBranch.isCertified && (
                  <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg rotate-[-12deg] shrink-0">
                    <Crown size={22} />
                  </div>
                )}
              </h1>
              <p className="text-ink-500 dark:text-ink-400 text-lg font-light max-w-2xl leading-relaxed">
                {currentBranch.description}
              </p>
              <div className="flex items-center gap-4 text-ink-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-[10px]">
                    {(currentBranch.author?.username?.[0] || 'A')}
                  </div>
                  <span className="text-sm font-bold text-ink-500 dark:text-ink-300">{currentBranch.author?.username}</span>
                  {currentBranch.author?.id && (
                    <FollowButton targetUserId={currentBranch.author.id} size="sm" />
                  )}
                </div>
                <span className="w-1 h-1 bg-ink-300 rounded-full"></span>
                <span className="text-sm">{new Date(currentBranch.createdAt).toLocaleDateString()} 创建</span>
              </div>
            </div>

            <div className="flex gap-3">
              {canCertify && (
                <button
                  onClick={handleCertify}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${
                    currentBranch.isCertified
                      ? 'bg-amber-100 text-amber-600 border-2 border-amber-400'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                >
                  <Crown size={18} />
                  {currentBranch.isCertified ? '已认证金级' : '认证金级分支'}
                </button>
              )}
              <button
                onClick={() => {
                  const firstChapterId = currentBranch.chapters[0]?.id;
                  if (firstChapterId) navigate(`/read/${firstChapterId}`);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-ink-800 text-white dark:bg-white dark:text-ink-800 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg active:scale-95"
              >
                <BookOpen size={18} />
                开始阅读
              </button>
              {isAuthor && (
                <button
                  onClick={() => {
                    setNewSubBranchData(prev => ({
                      ...prev,
                      parentChapterId: currentBranch.chapters[0]?.id || '',
                    }));
                    setIsSubBranchModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-2xl font-bold hover:bg-accent-600 transition-all shadow-lg active:scale-95"
                >
                  <GitFork size={18} />
                  创建子分支
                </button>
              )}
              {isAuthor && (
                <button
                  onClick={() => setIsChapterModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg active:scale-95"
                >
                  <PlusCircle size={18} />
                  添加新章节
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 番外作品展示 */}
        <div className="px-8 py-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-t border-ink-100 dark:border-ink-600">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={18} className="text-amber-500" />
              <span className="text-sm font-bold text-ink-600 dark:text-ink-300">
                番外作品
                {(currentBranch.parentStory?.spinoffs || []).length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full">
                    {(currentBranch.parentStory?.spinoffs || []).length}
                  </span>
                )}
              </span>
            </div>
            {user && (
              <button
                onClick={() => setIsSpinoffModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-all"
              >
                <PlusCircle size={14} />
                发布番外
              </button>
            )}
          </div>
          {(currentBranch.parentStory?.spinoffs || []).length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {(currentBranch.parentStory?.spinoffs || []).slice(0, 5).map((spinoff: any) => (
                <Link
                  key={spinoff.id}
                  to={`/spinoff/${spinoff.id}`}
                  className="flex-shrink-0 w-64 p-4 bg-ink-50 dark:bg-ink-700 rounded-2xl border border-ink-100 dark:border-ink-600 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${spinoff.isOfficial ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-ink-100 dark:bg-ink-600 text-ink-500'}`}>
                      <Star size={14} />
                    </div>
                    {spinoff.isOfficial && (
                      <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full uppercase">官方</span>
                    )}
                  </div>
                  <h4 className="font-bold text-ink-800 dark:text-white text-sm line-clamp-2 group-hover:text-amber-600 transition-colors">{spinoff.title}</h4>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-ink-400">
                    <span>{spinoff.author?.username}</span>
                    <span className="w-1 h-1 bg-ink-300 rounded-full"></span>
                    <span>{new Date(spinoff.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-3">
              <Sparkles size={24} className="mx-auto text-ink-300 mb-2" />
              <p className="text-xs text-ink-400">暂无番外作品</p>
            </div>
          )}
        </div>

        {/* 子分支展示 */}
        {currentBranch.subBranches && currentBranch.subBranches.length > 0 && (
          <div className="px-8 py-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-t border-ink-100 dark:border-ink-600">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={18} className="text-accent-500" />
              <span className="text-sm font-bold text-ink-600 dark:text-ink-300">
                子分支
                <span className="ml-1 px-2 py-0.5 bg-accent-500 text-white text-[10px] font-black rounded-full">
                  {currentBranch.subBranches.length}
                </span>
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {currentBranch.subBranches.map((sub: any) => (
                <Link
                  key={sub.id}
                  to={`/branch/${sub.id}`}
                  className="flex-shrink-0 w-64 p-4 bg-white dark:bg-ink-700 rounded-2xl border border-ink-100 dark:border-ink-600 hover:border-accent-300 dark:hover:border-accent-700 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-accent-100 dark:bg-accent-800/30 text-accent-600 dark:text-accent-400">
                      <GitFork size={14} />
                    </div>
                    {sub.isOfficial && (
                      <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full uppercase">官方</span>
                    )}
                  </div>
                  <h4 className="font-bold text-ink-800 dark:text-white text-sm line-clamp-2 group-hover:text-accent-600 transition-colors">{sub.title}</h4>
                  {sub.description && (
                    <p className="text-xs text-ink-400 mt-1 line-clamp-2">{sub.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-ink-400">
                    <span>{sub.author?.username}</span>
                    <span className="w-1 h-1 bg-ink-300 rounded-full"></span>
                    <span>{sub._count?.chapters || 0} 章节</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex px-8 border-t border-ink-100 dark:border-ink-600">
          {[
            { id: 'chapters', label: '章节目录', icon: MessageSquare },
            ...(editingChapterId ? [{ id: 'editor', label: '正在编辑', icon: Edit3 }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all relative ${
                activeTab === tab.id
                  ? 'text-accent-500 dark:text-purple-400'
                  : 'text-ink-500 hover:text-ink-600 dark:hover:text-ink-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-500 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-ink-700 rounded-3xl shadow-sm border border-ink-100 dark:border-ink-600 overflow-hidden">
        {activeTab === 'editor' && editingChapterId ? (
          <div className="p-8 h-[700px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black">编辑章节</h3>
              <button onClick={() => {
                setEditingChapterId(null);
                setActiveTab('chapters');
              }} className="text-ink-500 font-bold hover:text-ink-600">取消编辑</button>
            </div>
            <ChapterEditor
              chapterId={editingChapterId}
              initialContent={currentBranch.chapters.find((c: any) => c.id === editingChapterId)?.content || ''}
              onSave={handleSaveChapter}
            />
          </div>
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-ink-600">
            {currentBranch.chapters.length > 0 ? (
              currentBranch.chapters.map((chapter: any) => (
                <div key={chapter.id} className="p-8 hover:bg-ink-50 dark:hover:bg-ink-800/30 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <span className="text-4xl font-black text-ink-100 dark:text-ink-700 group-hover:text-accent-100 dark:group-hover:text-purple-900 transition-colors w-12 text-center">
                        {chapter.orderIndex}
                      </span>
                      <div>
                        <Link
                          to={`/read/${chapter.id}`}
                          className="text-xl font-bold text-ink-800 dark:text-white group-hover:text-accent-500 transition-colors mb-1 block hover:underline"
                        >
                          {chapter.title}
                        </Link>
                        <div className="flex items-center gap-3 text-sm text-ink-400">
                          <span>约 {(chapter.content.length / 2).toFixed(0)} 字</span>
                          <span className="w-1 h-1 bg-ink-300 rounded-full"></span>
                          <span>{new Date(chapter.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isAuthor && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingChapterId(chapter.id);
                            setActiveTab('editor');
                          }}
                          className="p-3 text-ink-400 hover:text-accent-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all"
                          title="编辑章节"
                        >
                          <Edit3 size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => setBooklistTargetChapter({ id: chapter.id, title: chapter.title })}
                        className="p-3 text-ink-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-xl transition-all"
                        title="加入书单"
                      >
                        <Bookmark size={20} />
                      </button>
                      <button className="p-3 text-ink-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-xl transition-all">
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-ink-100 dark:bg-ink-700 rounded-full flex items-center justify-center mx-auto text-ink-400">
                  <GitBranch size={40} />
                </div>
                <p className="text-ink-500 font-medium">这个世界还在孕育中，暂无章节内容</p>
                {isAuthor && (
                  <button
                    onClick={() => setIsChapterModalOpen(true)}
                    className="px-6 py-2 bg-accent-500 text-white rounded-xl font-bold hover:bg-purple-700 transition-all"
                  >
                    撰写第一章
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chapter Modal */}
      <Modal
        isOpen={isChapterModalOpen}
        onClose={() => setIsChapterModalOpen(false)}
        title="添加分支新章节"
      >
        <form onSubmit={handleCreateChapter} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">章节标题</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder="例如：抉择的后果"
              value={newChapterData.title}
              onChange={e => setNewChapterData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">章节顺序</label>
            <input
              type="number"
              required
              className="w-full px-4 py-3 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              value={newChapterData.orderIndex}
              onChange={e => setNewChapterData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) }))}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-accent-500 text-white rounded-2xl font-black hover:bg-purple-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '正在发布...' : '确认发布'}
          </button>
        </form>
      </Modal>

      {/* Spinoff Modal */}
      <Modal
        isOpen={isSpinoffModalOpen}
        onClose={() => setIsSpinoffModalOpen(false)}
        title="发布番外作品"
      >
        <form className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex gap-3 text-amber-700 dark:text-amber-300 text-sm">
            <Sparkles size={20} className="shrink-0" />
            <p>番外作品是基于原著的独立短篇，探索角色的另一面，无需遵循主线剧情。</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">番外标题</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              placeholder="例如：某个角色的过去..."
              value={newSpinoffData.title}
              onChange={e => setNewSpinoffData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">番外内容</label>
            <textarea
              required
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
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

      {/* 创建子分支弹窗 */}
      <Modal
        isOpen={isSubBranchModalOpen}
        onClose={() => setIsSubBranchModalOpen(false)}
        title="创建子分支"
      >
        <form onSubmit={handleCreateSubBranch} className="space-y-4">
          <div className="p-4 bg-accent-50 dark:bg-accent-800/20 rounded-2xl flex gap-3 text-accent-700 dark:text-accent-300 text-sm">
            <GitFork size={20} className="shrink-0" />
            <p>子分支是在现有分支基础上进一步分叉的平行分支，探索更深层次的可能性。</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">子分支标题</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="例如：如果选择了另一条路..."
              value={newSubBranchData.title}
              onChange={e => setNewSubBranchData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">描述（可选）</label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder="描述这个子分支的故事方向..."
              value={newSubBranchData.description}
              onChange={e => setNewSubBranchData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">起始章节</label>
            <select
              required
              value={newSubBranchData.parentChapterId}
              onChange={e => setNewSubBranchData(prev => ({ ...prev, parentChapterId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="">请选择起始章节</option>
              {(currentBranch.chapters || []).map((ch: any) => (
                <option key={ch.id} value={ch.id}>第 {ch.orderIndex} 章：{ch.title}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-500">分支类型</label>
            <div className="flex gap-2">
              {[
                { value: 'alternate', label: 'IF线' },
                { value: 'expansion', label: '世界扩展' },
                { value: 'biography', label: '人物传记' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNewSubBranchData(prev => ({ ...prev, branchType: opt.value }))}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                    newSubBranchData.branchType === opt.value
                      ? 'border-indigo-500 bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400'
                      : 'border-ink-200 dark:border-ink-600 text-ink-500 hover:border-ink-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newSubBranchData.title.trim() || !newSubBranchData.parentChapterId}
            className="w-full py-4 bg-accent-500 text-white rounded-2xl font-black hover:bg-accent-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '创建中...' : '确认创建'}
          </button>
        </form>
      </Modal>

      {/* 合并请求弹窗 */}
      <MergeRequestModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        storyId={currentBranch.parentStoryId}
        branchId={currentBranch.id}
        branchTitle={currentBranch.title}
        onSuccess={() => {
          addToast('success', '合并请求已发起，请等待原作者审核。');
          queryClient.invalidateQueries({ queryKey: queryKeys.branches.detail(id!) });
        }}
      />
    </div>
  );
};

export default BranchPage;
