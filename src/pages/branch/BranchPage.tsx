import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStoryStore } from '../../stores/useStoryStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { BookOpen, GitBranch, MessageSquare, Edit3, Share2, PlusCircle, ArrowLeft, BookMarked, GitMerge, ChevronRight, Star, Sparkles, Crown, GitPullRequest } from 'lucide-react';
import ChapterEditor from '../../components/Editor/ChapterEditor';
import { chapterService, spinoffService, branchService } from '../../api/storyService';
import Modal from '../../components/Modal';
import AddToBooklistModal from '../../components/AddToBooklistModal';
import MergeRequestModal from '../../components/Merge/MergeRequestModal';

const BranchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBranch, fetchBranchById, isLoading } = useStoryStore();
  const { user } = useAuthStore();
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

  // 加入书单
  const [booklistTargetChapter, setBooklistTargetChapter] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (id) {
      fetchBranchById(id);
    }
  }, [id, fetchBranchById]);

  useEffect(() => {
    if (currentBranch) {
      setNewChapterData(prev => ({ ...prev, orderIndex: currentBranch.chapters.length + 1 }));
    }
  }, [currentBranch]);

  if (isLoading || !currentBranch) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // 权限判断：分支作者、主线故事作者或管理员可以编辑
  const isAuthor = user && (
    user.id === currentBranch.authorId || 
    user.id === currentBranch.parentStory?.authorId ||
    user.role === 'admin'
  );

  // 认证权限：只有主线作者或管理员可以认证
  const canCertify = user && (
    user.id === currentBranch.parentStory?.authorId ||
    user.role === 'admin'
  );

  const handleCertify = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await branchService.certify(id, !(currentBranch as any).isCertified);
      alert((currentBranch as any).isCertified ? '已取消认证' : '分支已认证为金级');
      fetchBranchById(id);
    } catch (err) {
      alert('操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveChapter = async (content: string) => {
    if (editingChapterId) {
      try {
        await chapterService.update(editingChapterId, { content });
        alert('章节已保存');
        setEditingChapterId(null);
        setActiveTab('chapters');
        if (id) fetchBranchById(id);
      } catch (err) {
        alert('保存失败');
      }
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await chapterService.create({
        ...newChapterData,
        branchId: id,
        storyId: currentBranch.parentStoryId,
        content: '<p>新章节内容...</p>',
      });
      setIsChapterModalOpen(false);
      if (id) fetchBranchById(id);
      setNewChapterData({ title: '', orderIndex: currentBranch.chapters.length + 2 });
    } catch (err) {
      alert('添加章节失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSpinoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch.parentStoryId) return;
    setIsSubmitting(true);
    try {
      await spinoffService.create({
        ...newSpinoffData,
        originalStoryId: currentBranch.parentStoryId,
      });
      setIsSpinoffModalOpen(false);
      fetchBranchById(id);
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
        <div className="p-8 space-y-6">
          {/* 面包屑 + 分叉点上下文 */}
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-gray-400">
            <Link to={`/story/${currentBranch.parentStoryId}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <ArrowLeft size={14} />
              {currentBranch.parentStory?.title}
            </Link>
            {(currentBranch as any).parentChapter && (
              <>
                <ChevronRight size={14} className="text-gray-300" />
                <Link
                  to={`/read/${(currentBranch as any).parentChapter.id}`}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 transition-colors"
                >
                  <GitMerge size={12} />
                  第 {(currentBranch as any).parentChapter.orderIndex} 章：{(currentBranch as any).parentChapter.title}
                </Link>
                <ChevronRight size={14} className="text-gray-300" />
                <span className="text-purple-600 dark:text-purple-400">本分支</span>
              </>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-purple-600 text-white text-xs font-black rounded-full uppercase tracking-wider">平行宇宙分支</span>
                {currentBranch.isOfficial && (
                  <span className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-full uppercase tracking-wider">官方认证</span>
                )}
              </div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                {currentBranch.title}
                {(currentBranch as any).isCertified && (
                  <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg rotate-[-12deg] shrink-0">
                    <Crown size={22} />
                  </div>
                )}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-light max-w-2xl leading-relaxed">
                {currentBranch.description}
              </p>
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-[10px]">
                    {currentBranch.author?.username?.[0] || 'A'}
                  </div>
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{currentBranch.author?.username}</span>
                </div>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="text-sm">{new Date(currentBranch.createdAt).toLocaleDateString()} 创建</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              {canCertify && (
                <button 
                  onClick={handleCertify}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${
                    (currentBranch as any).isCertified 
                      ? 'bg-amber-100 text-amber-600 border-2 border-amber-400' 
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                >
                  <Crown size={18} />
                  {(currentBranch as any).isCertified ? '已认证金级' : '认证金级分支'}
                </button>
              )}
              <button 
                onClick={() => {
                  const firstChapterId = currentBranch.chapters[0]?.id;
                  if (firstChapterId) navigate(`/read/${firstChapterId}`);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg active:scale-95"
              >
                <BookOpen size={18} />
                开始阅读
              </button>
              {isAuthor && (
                <button 
                  onClick={() => setIsChapterModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg active:scale-95"
                >
                  <PlusCircle size={18} />
                  添加新章节
                </button>
              )}
              {user && user.id === currentBranch.authorId && (currentBranch as any).status !== 'merged' && (
                <button 
                  onClick={() => setIsMergeModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-100 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-200 transition-all shadow-lg active:scale-95"
                >
                  <GitPullRequest size={18} />
                  发起合并
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 番外作品展示 */}
        <div className="px-8 py-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={18} className="text-amber-500" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
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
              {(currentBranch.parentStory?.spinoffs || []).slice(0, 5).map(spinoff => (
                <Link
                  key={spinoff.id}
                  to={`/spinoff/${spinoff.id}`}
                  className="flex-shrink-0 w-64 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${spinoff.isOfficial ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>
                      <Star size={14} />
                    </div>
                    {spinoff.isOfficial && (
                      <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full uppercase">官方</span>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:text-amber-600 transition-colors">{spinoff.title}</h4>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400">
                    <span>{spinoff.author?.username}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{new Date(spinoff.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-3">
              <Sparkles size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">暂无番外作品</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex px-8 border-t border-gray-100 dark:border-gray-700">
          {[
            { id: 'chapters', label: '章节目录', icon: MessageSquare },
            ...(editingChapterId ? [{ id: 'editor', label: '正在编辑', icon: Edit3 }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all relative ${
                activeTab === tab.id 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {activeTab === 'editor' && editingChapterId ? (
          <div className="p-8 h-[700px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black">编辑章节</h3>
              <button onClick={() => {
                setEditingChapterId(null);
                setActiveTab('chapters');
              }} className="text-gray-500 font-bold hover:text-gray-700">取消编辑</button>
            </div>
            <ChapterEditor 
              chapterId={editingChapterId} 
              initialContent={currentBranch.chapters.find(c => c.id === editingChapterId)?.content || ''} 
              onSave={handleSaveChapter}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {currentBranch.chapters.length > 0 ? (
              currentBranch.chapters.map(chapter => (
                <div key={chapter.id} className="p-8 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <span className="text-4xl font-black text-gray-100 dark:text-gray-800 group-hover:text-purple-100 dark:group-hover:text-purple-900 transition-colors w-12 text-center">
                        {chapter.orderIndex}
                      </span>
                      <div>
                        <Link 
                          to={`/read/${chapter.id}`}
                          className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors mb-1 block hover:underline"
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
                          onClick={(e) => { 
                            e.preventDefault();
                            setEditingChapterId(chapter.id);
                            setActiveTab('editor');
                          }}
                          className="p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all"
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
                      <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400">
                  <GitBranch size={40} />
                </div>
                <p className="text-gray-500 font-medium">这个世界还在孕育中，暂无章节内容</p>
                {isAuthor && (
                  <button 
                    onClick={() => setIsChapterModalOpen(true)}
                    className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all"
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
            <label className="text-sm font-bold text-gray-500">章节标题</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder="例如：抉择的后果"
              value={newChapterData.title}
              onChange={e => setNewChapterData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">章节顺序</label>
            <input 
              type="number" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              value={newChapterData.orderIndex}
              onChange={e => setNewChapterData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) }))}
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black hover:bg-purple-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
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
        <form onSubmit={handleCreateSpinoff} className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex gap-3 text-amber-700 dark:text-amber-300 text-sm">
            <Sparkles size={20} className="shrink-0" />
            <p>番外作品是基于原著的独立短篇，探索角色的另一面，无需遵循主线剧情。</p>
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

      {/* 合并请求弹窗 */}
      <MergeRequestModal 
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        storyId={currentBranch.parentStoryId}
        branchId={currentBranch.id}
        branchTitle={currentBranch.title}
        onSuccess={() => {
          alert('合并请求已发起，请等待原作者审核。');
          if (id) fetchBranchById(id);
        }}
      />
    </div>
  );
};

export default BranchPage;
