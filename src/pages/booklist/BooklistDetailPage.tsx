import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { booklistService, storyService, Booklist, Chapter, Story } from '../../api/storyService';
import { useAuthStore } from '../../stores/useAuthStore';
import Modal from '../../components/Modal';
import { 
  ArrowLeft, 
  CheckCircle2,
  Play, 
  MapPin, 
  User, 
  Calendar, 
  BookOpen, 
  ChevronRight,
  ChevronLeft,
  GitBranch,
  Quote,
  Edit3,
  Trash2,
  GripVertical,
  Plus,
  X,
  Save,
  AlertCircle,
  Search,
  Check,
  ArrowUp,
  ArrowDown,
  Heart,
  Share2,
  Eye,
  MoreHorizontal,
  Copy,
  Twitter,
  Facebook,
  MessageCircle,
  Link2
} from 'lucide-react';
import { interactionService, InteractionStats } from '../../api/interactionService';

const BooklistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [booklist, setBooklist] = useState<(Booklist & { creator: any, items: any[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<InteractionStats | null>(null);
  
  // 编辑模式状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({ 
    title: '', 
    description: '', 
    type: 'COLLECTION', 
    tags: '',
    coverImage: ''
  });
  
  // 编辑项目状态
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemNotes, setItemNotes] = useState('');

  // 添加章节状态
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id) {
      fetchBooklist(id);
      fetchStats(id);
    }
  }, [id]);

  const fetchBooklist = async (listId: string) => {
    setIsLoading(true);
    try {
      const data = await booklistService.getById(listId);
      setBooklist(data);
      setEditForm({ 
        title: data.title, 
        description: data.description || '',
        type: data.type || 'COLLECTION',
        tags: data.tags || '',
        coverImage: data.coverImage || ''
      });
    } catch (err) {
      console.error('Failed to fetch booklist');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async (listId: string) => {
    try {
      const data = await interactionService.getStats('booklist', listId);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  // 处理点赞
  const handleToggleLike = async () => {
    if (!id || !user) {
      alert('请先登录后再点赞');
      return;
    }
    
    try {
      const res = await interactionService.toggleLike('booklist', id);
      setStats(prev => prev ? {
        ...prev,
        liked: res.liked,
        likeCount: res.likeCount
      } : {
        liked: res.liked,
        likeCount: res.likeCount,
        targetType: 'booklist',
        targetId: id,
        shareCount: 0,
        viewCount: 0,
        ratingCount: 0,
        ratingAvg: 0,
        ratingDist: {},
        myRating: null,
        myReasonTags: []
      } as any);
    } catch (err) {
      console.error('Like failed');
    }
  };

  // 处理分享
  const handleShare = async (platform: 'copy' | 'twitter' | 'facebook' | 'wechat') => {
    if (!id || !booklist) return;
    
    const config = interactionService.generateShareConfig(
      platform as any,
      'booklist',
      id,
      booklist.title,
      booklist.description || ''
    );
    
    const success = await interactionService.executeShare(config);
    if (success) {
      if (platform === 'copy') {
        alert('链接已成功复制到剪贴板！');
      }
      // 记录分享
      try {
        const res = await interactionService.recordShare('booklist', id, platform as any);
        setStats(prev => prev ? { ...prev, shareCount: res.shareCount } : {
          shareCount: res.shareCount,
          liked: false,
          likeCount: 0,
          targetType: 'booklist',
          targetId: id,
          viewCount: 0,
          ratingCount: 0,
          ratingAvg: 0,
          ratingDist: {},
          myRating: null,
          myReasonTags: []
        } as any);
      } catch (err) {
        console.error('Record share failed');
      }
      setIsShareModalOpen(false);
    } else {
      alert('分享失败，请重试');
    }
  };
  
  // 检查当前用户是否是创建者
  const isCreator = user && booklist && user.id === booklist.creator?.id;

  // 更新书单信息
  const handleUpdateBooklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      await booklistService.update(id, editForm);
      setIsEditModalOpen(false);
      fetchBooklist(id);
    } catch (err) {
      alert('更新书单失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除书单
  const handleDeleteBooklist = async () => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      await booklistService.delete(id);
      navigate('/booklist');
    } catch (err) {
      alert('删除书单失败');
      setIsSubmitting(false);
    }
  };

  // 更新项目笔记
  const handleUpdateItemNotes = async () => {
    if (!id || !editingItem) return;
    
    setIsSubmitting(true);
    try {
      await booklistService.updateItem(id, editingItem.id, { notes: itemNotes });
      setEditingItem(null);
      fetchBooklist(id);
    } catch (err) {
      alert('更新笔记失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除项目
  const handleRemoveItem = async (itemId: string) => {
    if (!id) return;
    
    if (!confirm('确定要删除这个章节吗？')) return;
    
    try {
      await booklistService.removeItem(id, itemId);
      fetchBooklist(id);
    } catch (err) {
      alert('删除章节失败');
    }
  };

  // 打开添加章节弹窗时加载故事列表
  const openAddChapterModal = async () => {
    setIsAddChapterModalOpen(true);
    setSelectedStoryId('');
    setSelectedChapterId('');
    setChapters([]);
    setNewItemNotes('');
    setSearchQuery('');
    try {
      const data = await storyService.getAll();
      setStories(data);
    } catch (err) {
      console.error('Failed to fetch stories');
    }
  };

  // 选择故事后加载章节列表
  const handleStorySelect = async (storyId: string) => {
    setSelectedStoryId(storyId);
    setSelectedChapterId('');
    setIsLoadingChapters(true);
    try {
      const data = await storyService.getById(storyId);
      setChapters(data.chapters || []);
    } catch (err) {
      console.error('Failed to fetch chapters');
    } finally {
      setIsLoadingChapters(false);
    }
  };

  // 添加章节到书单
  const handleAddChapter = async () => {
    if (!id || !selectedChapterId) return;
    
    setIsSubmitting(true);
    try {
      await booklistService.addItem(id, { 
        chapterId: selectedChapterId, 
        notes: newItemNotes 
      });
      setIsAddChapterModalOpen(false);
      fetchBooklist(id);
    } catch (err: any) {
      if (err.response?.data?.message === 'Chapter already in booklist') {
        alert('该章节已在书单中');
      } else {
        alert('添加章节失败');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 过滤故事列表
  const filteredStories = stories.filter(story => 
    story.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 调整章节顺序 - 优化为单次批量提交
  const handleMoveItem = async (itemId: string, direction: 'up' | 'down') => {
    if (!id || !booklist) return;
    
    const currentIndex = booklist.items.findIndex(item => item.id === itemId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= booklist.items.length) return;
    
    // 1. 乐观更新 UI
    const newItems = [...booklist.items];
    const temp = newItems[currentIndex];
    newItems[currentIndex] = newItems[newIndex];
    newItems[newIndex] = temp;
    
    const updatedBooklist = { ...booklist, items: newItems };
    setBooklist(updatedBooklist);
    
    // 2. 准备批量更新数据
    const itemOrders = newItems.map((item, i) => ({
      id: item.id,
      orderIndex: i + 1
    }));
    
    try {
      await booklistService.reorderItems(id, itemOrders);
      // 成功后重新拉取以确保同步 (可选)
    } catch (err) {
      alert('调整顺序失败，已还原');
      fetchBooklist(id); // 还原数据
    }
  };

  if (isLoading || !booklist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-700 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors">
          <ArrowLeft size={16} />
          返回书单列表
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-sm ${
                (booklist as any).type === 'TIMELINE' ? 'bg-indigo-600' : 'bg-emerald-600'
              }`}>
                {(booklist as any).type === 'TIMELINE' ? '时空导览' : '精选书单'}
              </span>
              {(booklist as any).tags?.split(',').filter(Boolean).map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] font-bold rounded-lg">
                  #{tag.trim()}
                </span>
              ))}
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-black rounded-full uppercase tracking-wider">
                {booklist.items.length} 站
              </span>
              {stats && (
                <div className="flex items-center gap-4 ml-4 text-gray-400">
                  <div className="flex items-center gap-1.5" title="阅读次数">
                    <Eye size={14} />
                    <span className="text-xs font-bold">{(stats as any).viewCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="点赞数">
                    <Heart size={14} className={stats.liked ? "fill-red-500 text-red-500" : ""} />
                    <span className="text-xs font-bold">{stats.likeCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="分享次数">
                    <Share2 size={14} />
                    <span className="text-xs font-bold">{stats.shareCount}</span>
                  </div>
                </div>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              {booklist.title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xl font-light leading-relaxed max-w-2xl italic">
              "{booklist.description || '这位导游很懒，没有留下任何简介。'}"
            </p>
            <div className="flex items-center gap-6 pt-4 text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                  {booklist.creator?.username?.[0] || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">策划人</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{booklist.creator?.username}</p>
                </div>
              </div>
              <div className="h-8 w-[1px] bg-gray-100 dark:bg-gray-700"></div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">最后更新</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{new Date(booklist.updatedAt).toLocaleDateString()}</p>
              </div>
              {isCreator && (
                <>
                  <div className="h-8 w-[1px] bg-gray-100 dark:bg-gray-700"></div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest leading-none mb-1 text-emerald-600">累计分润</p>
                    <p className="text-sm font-bold text-emerald-600">{((booklist as any).totalEarnings || 0).toFixed(2)} USD</p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-3 min-w-[240px]">
            <button 
              onClick={() => booklist.items[0] && navigate(`/read/${booklist.items[0].chapterId}?referralId=${booklist.id}`)}
              className="w-full flex items-center justify-center gap-3 px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 group"
            >
              <Play size={24} fill="currentColor" className="group-hover:scale-110 transition-transform" />
              开始旅程
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={handleToggleLike}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${
                  stats?.liked 
                    ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/30" 
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Heart size={18} className={stats?.liked ? "fill-red-500" : ""} />
                {stats?.liked ? '已点赞' : '点赞'}
              </button>
              
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <Share2 size={18} />
                分享
              </button>
            </div>

            {isCreator && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  <Edit3 size={16} />
                  编辑书单
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guided Tour Path */}
      <div className="space-y-12 px-4 relative">
        <div className="absolute left-10 md:left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-emerald-500/20 to-transparent rounded-full -z-10"></div>
        
        <div className="ml-20 md:ml-24 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <MapPin className="text-emerald-600" />
            阅读路线详情
          </h2>
          {isCreator && (
            <button
              onClick={openAddChapterModal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all"
            >
              <Plus size={16} />
              添加章节
            </button>
          )}
        </div>

        <div className="space-y-12">
          {booklist.items.map((item, index) => (
            <div key={item.id} className="relative flex gap-8 md:gap-12 animate-in slide-in-from-bottom-8 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
              {/* Timeline Marker */}
              <div className="relative flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-white dark:bg-gray-800 border-4 border-emerald-500 shadow-xl flex items-center justify-center text-3xl font-black text-emerald-600 z-10">
                  {(index + 1).toString().padStart(2, '0')}
                </div>
                {index < booklist.items.length - 1 && (
                  <div className="absolute top-20 bottom-[-48px] w-1 bg-emerald-500 rounded-full"></div>
                )}
              </div>

              {/* Station Card */}
              <div className="flex-1 space-y-6 pt-4">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all group">
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          item.chapter.branchId ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {item.chapter.branchId ? '平行分支' : '主线章节'}
                        </span>
                        <span className="text-xs font-bold text-gray-400">
                          {item.chapter.story.title}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                        {item.chapter.title}
                      </h3>
                    </div>
                    <Link 
                      to={`/read/${item.chapterId}${booklist ? `?referralId=${booklist.id}` : ''}`}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl font-bold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-all active:scale-95"
                    >
                      阅读此章节
                      <ChevronRight size={16} />
                    </Link>
                  </div>

                  {(item.notes || isCreator) && (
                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-l-4 border-emerald-500 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                          <Quote size={14} fill="currentColor" />
                          导游点评
                        </div>
                        {isCreator && (
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setItemNotes(item.notes || '');
                            }}
                            className="text-gray-400 hover:text-emerald-600 transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                      </div>
                      {item.notes ? (
                        <p className="text-gray-600 dark:text-gray-400 text-lg font-light leading-relaxed italic">
                          {item.notes}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm italic">暂无点评，点击编辑添加...</p>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <User size={14} />
                        {item.chapter?.story?.author?.username || '未知作者'}
                      </div>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={14} />
                        约 {((item.chapter?.content?.length || 0) / 2).toFixed(0)} 字
                      </div>
                    </div>
                    
                    {isCreator && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMoveItem(item.id, 'up')}
                          disabled={index === 0}
                          className="text-gray-300 hover:text-emerald-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="上移"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveItem(item.id, 'down')}
                          disabled={index === booklist.items.length - 1}
                          className="text-gray-300 hover:text-emerald-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="下移"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors ml-2"
                          title="删除此章节"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Journey End */}
        <div className="ml-20 md:ml-24 pt-12 pb-20">
          <div className="flex flex-col items-center justify-center text-center p-12 bg-gray-100 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 space-y-4">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">旅程终点</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">这就是本条阅读路线的所有推荐内容。</p>
            </div>
            <button 
              onClick={() => navigate('/booklist')}
              className="mt-4 px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl font-black text-sm hover:shadow-lg transition-all active:scale-95"
            >
              探索更多路线
            </button>
          </div>
        </div>
      </div>

      {/* 编辑书单弹窗 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑书单"
      >
        <form onSubmit={handleUpdateBooklist} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">书单标题</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={editForm.title}
              onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">书单简介</label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
              value={editForm.description}
              onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">导览类型</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={editForm.type}
                onChange={e => setEditForm(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="COLLECTION">普通书单 (精选收藏)</option>
                <option value="TIMELINE">时空导览 (推荐阅读路线)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">标签 (逗号分隔)</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="治愈, 平行线, 虐心..."
                value={editForm.tags}
                onChange={e => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">封面图片 URL</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="https://images.unsplash.com/..."
              value={editForm.coverImage}
              onChange={e => setEditForm(prev => ({ ...prev, coverImage: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 删除书单确认弹窗 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="删除书单"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <p className="font-bold text-red-600 mb-1">确定要删除这个书单吗？</p>
              <p className="text-sm text-red-500">此操作不可撤销，书单中的所有章节推荐都将被删除。</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleDeleteBooklist}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 分享书单弹窗 */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="分享这份书单"
      >
        {booklist && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{booklist.title}</h3>
              <p className="text-sm text-gray-500">选择一个平台分享你的阅读路线</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleShare('copy')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 group transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-600 group-hover:text-emerald-600 transition-colors">
                  <Link2 size={24} />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">复制链接</span>
              </button>
              
              <button
                onClick={() => handleShare('twitter')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-600 group-hover:text-blue-400 transition-colors">
                  <Twitter size={24} />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Twitter</span>
              </button>
              
              <button
                onClick={() => handleShare('wechat')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-green-50 dark:hover:bg-green-900/20 group transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-600 group-hover:text-green-500 transition-colors">
                  <MessageCircle size={24} />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">微信</span>
              </button>
            </div>
            
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 text-center leading-relaxed">
                "分享你的独特品味，帮助其他读者在平行宇宙中找到精彩的故事章节。"
              </p>
            </div>
            
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              关闭
            </button>
          </div>
        )}
      </Modal>

      {/* 编辑项目笔记弹窗 */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="编辑导游点评"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">章节</label>
            <p className="text-gray-700 dark:text-gray-300 font-medium">{editingItem?.chapter?.title}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">导游点评</label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
              placeholder="写下你对这个章节的推荐理由..."
              value={itemNotes}
              onChange={e => setItemNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setEditingItem(null)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleUpdateItemNotes}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存点评'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 添加章节弹窗 */}
      <Modal
        isOpen={isAddChapterModalOpen}
        onClose={() => setIsAddChapterModalOpen(false)}
        title="添加章节到书单"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 搜索故事 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">搜索故事</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="输入故事标题搜索..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 故事列表 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">选择故事</label>
            <div className="max-h-32 overflow-y-auto space-y-2 border border-gray-100 dark:border-gray-700 rounded-xl p-2">
              {filteredStories.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">暂无故事</p>
              ) : (
                filteredStories.map(story => (
                  <button
                    key={story.id}
                    onClick={() => handleStorySelect(story.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedStoryId === story.id
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{story.title}</span>
                      {selectedStoryId === story.id && <Check size={16} className="text-emerald-600" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 章节列表 */}
          {selectedStoryId && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">选择章节</label>
              {isLoadingChapters ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                </div>
              ) : chapters.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4 border border-gray-100 dark:border-gray-700 rounded-xl">
                  该故事暂无章节
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-100 dark:border-gray-700 rounded-xl p-2">
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      onClick={() => setSelectedChapterId(chapter.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedChapterId === chapter.id
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{index + 1}. {chapter.title}</span>
                        {selectedChapterId === chapter.id && <Check size={16} className="text-emerald-600" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 导游点评 */}
          {selectedChapterId && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">导游点评（可选）</label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                placeholder="写下你对这个章节的推荐理由..."
                value={newItemNotes}
                onChange={e => setNewItemNotes(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsAddChapterModalOpen(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleAddChapter}
              disabled={!selectedChapterId || isSubmitting}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '添加中...' : '添加章节'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BooklistDetailPage;
