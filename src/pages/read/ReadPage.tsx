import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { chapterService, booklistService, savepointService, Chapter, Branch, Booklist } from '../../api/storyService';
import { useAuthStore } from '../../stores/useAuthStore';
import { 
  ArrowLeft, 
  ArrowRight, 
  GitBranch, 
  Plus, 
  BookMarked, 
  Settings,
  MoreVertical,
  CheckCircle2,
  Type,
  Sun,
  Moon,
  AlignLeft,
  Save,
  Clock,
  Trash2
} from 'lucide-react';
import Modal from '../../components/Modal';
import CommentSection from './CommentSection';
import { InteractionBar, ShareButton, RatingComponent } from '../../components/Interaction';

const ReadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const queryParams = new URLSearchParams(location.search);
  const referralId = queryParams.get('referralId') || undefined;

  const [chapter, setChapter] = useState<(Chapter & {
    story: any;
    branch: any;
    branchesFrom: Branch[];
    nextChapter: any;
    prevChapter: any;
    viewCount?: number;
    commentCount?: number;
  }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 阅读设置
  const [fontSize, setFontSize] = useState(18);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>('auto');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  
  // Booklist Modal
  const [isBooklistModalOpen, setIsBooklistModalOpen] = useState(false);
  const [myBooklists, setMyBooklists] = useState<Booklist[]>([]);
  const [selectedBooklistId, setSelectedBooklistId] = useState('');
  const [booklistNote, setBooklistNote] = useState('');
  const [isAddingToBooklist, setIsAddingToBooklist] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Savepoints
  const [isSavepointsOpen, setIsSavepointsOpen] = useState(false);
  const [savepoints, setSavepoints] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchChapter(id, referralId);
    }
    if (isAuthenticated) {
      fetchMyBooklists();
    }
  }, [id, isAuthenticated, referralId]);

  useEffect(() => {
    if (isSavepointsOpen && chapter?.storyId) {
      fetchSavepoints(chapter.storyId);
    }
  }, [isSavepointsOpen, chapter?.storyId]);

  const fetchChapter = async (chapterId: string, refId?: string) => {
    setIsLoading(true);
    try {
      const data = await chapterService.getById(chapterId, refId);
      setChapter(data);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Failed to fetch chapter');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyBooklists = async () => {
    try {
      const data = await booklistService.getMy();
      setMyBooklists(data);
      if (data.length > 0) setSelectedBooklistId(data[0].id);
    } catch (err) {
      console.error('Failed to fetch booklists');
    }
  };

  const fetchSavepoints = async (storyId: string) => {
    try {
      const data = await savepointService.getAll({ storyId });
      setSavepoints(data);
    } catch (err) {
      console.error('Failed to fetch savepoints');
    }
  };

  const handleCreateSavepoint = async () => {
    if (!chapter) return;
    setIsSaving(true);
    try {
      await savepointService.create({
        storyId: chapter.storyId,
        branchId: chapter.branchId,
        chapterId: chapter.id,
      });
      setSaveSuccess(true);
      fetchSavepoints(chapter.storyId);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to create savepoint');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavepoint = async (savepointId: string) => {
    try {
      await savepointService.delete(savepointId);
      setSavepoints(prev => prev.filter(s => s.id !== savepointId));
    } catch (err) {
      console.error('Failed to delete savepoint');
    }
  };

  // 从 localStorage 读取设置
  useEffect(() => {
    const savedFontSize = localStorage.getItem('readFontSize');
    const savedTheme = localStorage.getItem('readTheme');
    const savedFont = localStorage.getItem('readFont');

    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    if (savedTheme) setThemeMode(savedTheme as any);
    if (savedFont) setFontFamily(savedFont as any);
  }, []);

  // 保存设置到 localStorage
  const saveSettings = () => {
    localStorage.setItem('readFontSize', fontSize.toString());
    localStorage.setItem('readTheme', themeMode);
    localStorage.setItem('readFont', fontFamily);
  };

  // 应用主题
  useEffect(() => {
    const applyTheme = () => {
      const isDark = themeMode === 'dark' ||
        (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    };
    applyTheme();
  }, [themeMode]);

  const handleAddToBooklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooklistId || !id) return;
    
    setIsAddingToBooklist(true);
    try {
      await booklistService.addItem(selectedBooklistId, { 
        chapterId: id, 
        notes: booklistNote 
      });
      setAddSuccess(true);
      setTimeout(() => {
        setIsBooklistModalOpen(false);
        setAddSuccess(false);
        setBooklistNote('');
      }, 1500);
    } catch (err) {
      alert('添加失败，可能已在书单中');
    } finally {
      setIsAddingToBooklist(false);
    }
  };

  if (isLoading || !chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 pb-20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 h-16 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors shrink-0">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1">{chapter.title}</h2>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest line-clamp-1">
              {chapter.branch ? `分支：${chapter.branch.title}` : `主线：${chapter.story.title}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <button
            onClick={() => setIsBooklistModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          >
            <BookMarked size={18} />
            <span className="hidden sm:inline">加入书单</span>
          </button>
          <ShareButton
            targetType="chapter"
            targetId={chapter.id}
            title={chapter.title}
            description={`阅读《${chapter.story.title}》的章节：${chapter.title}`}
            size="sm"
            variant="ghost"
          />
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="阅读设置"
          >
            <Settings size={20} />
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setIsSavepointsOpen(true)}
              className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
              title="时空存档"
            >
              <Save size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Reading Area */}
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <div className="space-y-8 mb-16">
          <div className="space-y-4 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              {chapter.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-gray-400 text-sm font-medium">
              <span>{chapter.story.author.username}</span>
              <span className="w-1.5 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full"></span>
              <span>约 {(chapter.content.length / 2).toFixed(0)} 字</span>
            </div>
          </div>
          
          <div
            className={`prose prose-lg dark:prose-invert max-w-none leading-relaxed ${
              fontFamily === 'serif' ? 'font-serif' : 'font-sans'
            }`}
            style={{ fontSize: `${fontSize}px` }}
          >
            <ReactMarkdown>{chapter.content}</ReactMarkdown>
          </div>
        </div>

        {/* Branch Discovery Section */}
        {chapter.branchesFrom.length > 0 && (
          <div className="my-16">
            {/* 标题装饰 */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 dark:via-purple-700 to-transparent"></div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg shadow-purple-500/20">
                <GitBranch size={16} className="text-white" />
                <span className="text-white text-sm font-black tracking-wide">故事在此分歧</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 dark:via-purple-700 to-transparent"></div>
            </div>

            <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 backdrop-blur-sm">
              <p className="text-center text-indigo-600 dark:text-indigo-400 text-sm font-bold mb-6 opacity-80">
                在这个时间节点，{chapter.branchesFrom.length} 个平行宇宙从此分叉——你想探索哪一个？
              </p>
              <div className="grid grid-cols-1 gap-3">
                {chapter.branchesFrom.map((branch, idx) => (
                  <Link 
                    key={branch.id}
                    to={`/branch/${branch.id}`}
                    className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 rounded-2xl border border-indigo-100 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group"
                  >
                    {/* 序号 */}
                    <div className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-black shrink-0 ${
                      branch.isOfficial 
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' 
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{branch.title}</h4>
                        {branch.isOfficial 
                          ? <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full uppercase tracking-wide">官方认证</span>
                          : <span className="px-2 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[9px] font-black rounded-full uppercase tracking-wide">社区创作</span>
                        }
                      </div>
                      {branch.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-1.5">{branch.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {(branch as any)._count?.chapters !== undefined && (
                          <span className="font-medium">{(branch as any)._count.chapters} 章</span>
                        )}
                        {(branch as any)._count?.chapters !== undefined && branch.author && (
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        )}
                        {branch.author && (
                          <span>{branch.author.username} 著</span>
                        )}
                        {(branch as any).viewCount !== undefined && (branch as any).viewCount > 0 && (
                          <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{(branch as any).viewCount.toLocaleString()} 次阅读</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-gray-100 dark:border-gray-800">
          {chapter.prevChapter ? (
            <Link 
              to={`/read/${chapter.prevChapter.id}${referralId ? `?referralId=${referralId}` : ''}`}
              className="w-full sm:w-auto flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-blue-400 transition-all group"
            >
              <ArrowLeft className="text-gray-300 group-hover:text-blue-600 transition-colors" />
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">上一章</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 line-clamp-1">{chapter.prevChapter.title}</p>
              </div>
            </Link>
          ) : <div className="hidden sm:block w-48" />}

          <div className="flex gap-2">
            <button 
              onClick={() => navigate(`/story/${chapter.storyId}`)}
              className="p-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl hover:bg-gray-200 transition-all"
              title="查看目录"
            >
              <MoreVertical size={20} />
            </button>
          </div>

          {chapter.nextChapter ? (
            <Link 
              to={`/read/${chapter.nextChapter.id}${referralId ? `?referralId=${referralId}` : ''}`}
              className="w-full sm:w-auto flex items-center justify-end gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-blue-400 transition-all group"
            >
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">下一章</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 line-clamp-1">{chapter.nextChapter.title}</p>
              </div>
              <ArrowRight className="text-gray-300 group-hover:text-blue-600 transition-colors" />
            </Link>
          ) : (
            <div className="w-full sm:w-48 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-center">
              <p className="text-xs font-black text-blue-600 dark:text-blue-400">本系列暂无后续内容</p>
              <button 
                onClick={() => navigate(`/story/${chapter.storyId}`)}
                className="text-[10px] font-bold text-blue-400 hover:underline"
              >
                开启新分支？
              </button>
            </div>
          )}
        </div>

        {/* Interaction Section */}
        <div className="my-12 p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">互动</h3>
          <InteractionBar
            targetType="chapter"
            targetId={chapter.id}
            viewCount={chapter.viewCount || 0}
            commentCount={chapter.commentCount || 0}
            showRating={true}
            showShare={true}
            size="md"
          />
          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
            <RatingComponent
              targetType="chapter"
              targetId={chapter.id}
              size="lg"
              showDistribution={true}
              onRate={(rating, tags) => {
                console.log('Rated:', rating, 'Tags:', tags);
              }}
            />
          </div>
        </div>

        {/* Comments Section */}
        <CommentSection key={chapter.id} chapterId={chapter.id} />
      </div>

      {/* Reading Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => { setIsSettingsOpen(false); saveSettings(); }}
        title="阅读设置"
      >
        <div className="space-y-6">
          {/* 字体大小 */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
              <Type size={18} />
              字体大小
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg font-black text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                -
              </button>
              <div className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                <span className="text-2xl font-black text-gray-900 dark:text-white">{fontSize}px</span>
              </div>
              <button
                onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg font-black text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-400">推荐：18px（标准）、20px（舒适）、24px（大字）</p>
          </div>

          {/* 主题模式 */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-500">主题模式</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setThemeMode('light')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                  themeMode === 'light'
                    ? 'bg-amber-100 text-amber-600 border-2 border-amber-400'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <Sun size={18} />
                <span className="text-sm font-bold">浅色</span>
              </button>
              <button
                onClick={() => setThemeMode('dark')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                  themeMode === 'dark'
                    ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-400'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <Moon size={18} />
                <span className="text-sm font-bold">深色</span>
              </button>
              <button
                onClick={() => setThemeMode('auto')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                  themeMode === 'auto'
                    ? 'bg-gray-100 text-gray-600 border-2 border-gray-400'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <AlignLeft size={18} />
                <span className="text-sm font-bold">自动</span>
              </button>
            </div>
          </div>

          {/* 字体风格 */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-500">字体风格</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFontFamily('serif')}
                className={`p-4 rounded-xl transition-all ${
                  fontFamily === 'serif'
                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-400 font-serif'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 font-serif'
                }`}
              >
                <span className="text-lg">衬线体</span>
                <p className="text-xs mt-1 opacity-70">适合文学阅读</p>
              </button>
              <button
                onClick={() => setFontFamily('sans')}
                className={`p-4 rounded-xl transition-all ${
                  fontFamily === 'sans'
                    ? 'bg-purple-100 text-purple-600 border-2 border-purple-400 font-sans'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 font-sans'
                }`}
              >
                <span className="text-lg font-sans">无衬线</span>
                <p className="text-xs mt-1 opacity-70">适合快速阅读</p>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Booklist Modal */}
      <Modal 
        isOpen={isBooklistModalOpen} 
        onClose={() => setIsBooklistModalOpen(false)} 
        title="加入我的精选书单"
      >
        {addSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 size={40} />
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white">成功加入书单！</p>
          </div>
        ) : (
          <form onSubmit={handleAddToBooklist} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">选择书单</label>
              {myBooklists.length > 0 ? (
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={selectedBooklistId}
                  onChange={e => setSelectedBooklistId(e.target.value)}
                >
                  {myBooklists.map(list => (
                    <option key={list.id} value={list.id}>{list.title}</option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                  <p className="text-sm text-gray-500 mb-2">你还没有创建过书单</p>
                  <Link to="/booklist" className="text-blue-600 text-xs font-bold hover:underline">去创建一个新书单</Link>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">导游点评 (可选)</label>
              <textarea 
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="为这一站写点推荐语，告诉读者为什么要读这一章..."
                value={booklistNote}
                onChange={e => setBooklistNote(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={isAddingToBooklist || !selectedBooklistId}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isAddingToBooklist ? '正在加入...' : '确认加入书单'}
            </button>
          </form>
        )}
      </Modal>

      {/* Savepoints Modal */}
      <Modal
        isOpen={isSavepointsOpen}
        onClose={() => setIsSavepointsOpen(false)}
        title="时空存档 (Reading Savepoints)"
      >
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-black text-amber-800 dark:text-amber-200 uppercase tracking-widest">
                当前位置
              </h4>
              {saveSuccess && (
                <span className="text-[10px] font-bold text-emerald-600 animate-pulse">
                  存档成功！
                </span>
              )}
            </div>
            <p className="text-[13px] font-bold text-amber-900 dark:text-amber-100 mb-4">
              {chapter?.title}
            </p>
            <button
              onClick={handleCreateSavepoint}
              disabled={isSaving}
              className="w-full py-3 bg-amber-600 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 hover:bg-amber-500 transition-all disabled:opacity-50"
            >
              <Save size={14} />
              {isSaving ? '正在记录时空坐标...' : '立即存档当前进度'}
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">
              历史存档点
            </h4>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 no-scrollbar">
              {savepoints.length > 0 ? (
                savepoints.map(sp => (
                  <div key={sp.id} className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 transition-all">
                    <div className="flex-1 min-w-0" onClick={() => { navigate(`/read/${sp.chapterId}`); setIsSavepointsOpen(false); }}>
                      <h5 className="text-xs font-black text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors cursor-pointer">
                        {sp.chapter?.title || '未知章节'}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={10} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-bold">
                          {new Date(sp.createdAt).toLocaleString()}
                        </span>
                        {sp.branch && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-[10px] text-purple-500 font-bold italic">{sp.branch.title}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSavepoint(sp.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      title="删除存档"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-gray-400">
                  <Clock size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">暂无历史存档</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReadPage;
