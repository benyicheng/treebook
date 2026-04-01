import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { spinoffService, Spinoff, storyService, Character } from '../../api/storyService';
import { mergeService, MergeRequest } from '../../api/mergeService';
import { ArrowLeft, BookOpen, Star, Users, History, Sparkles, Layout, Info, Edit3, ShieldCheck, Send, GitBranch } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import ReactMarkdown from 'react-markdown';
import Modal from '../../components/Modal';

const SpinoffDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [spinoff, setSpinoff] = useState<Spinoff | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<MergeRequest | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await spinoffService.getById(id);
        setSpinoff(data);
        
        // Load referenced characters
        if (data.referencedCharacters) {
          const charIds = JSON.parse(data.referencedCharacters);
          if (charIds.length > 0) {
            const allChars = await storyService.getCharacters(data.originalStoryId);
            setCharacters(allChars.filter(c => charIds.includes(c.id)));
          }
        }

        // Check for pending requests
        if (user && user.id === data.authorId) {
          const requests = await mergeService.getRequests(data.originalStoryId) || [];
          const currentPending = Array.isArray(requests) ? requests.find(r => r.spinoffId === id && r.status === 'pending') : null;
          setPendingRequest(currentPending || null);
        }
      } catch (e: any) {
        setError(e.response?.data?.message || e.message || '加载失败');
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [id]);

  const getTypeText = (type: string) => {
    switch (type) {
      case 'biography': return { label: '人物传记', color: 'bg-blue-100 text-blue-600', icon: Users };
      case 'world_expansion': return { label: '世界补完', color: 'bg-purple-100 text-purple-600', icon: Sparkles };
      default: return { label: 'IF 平行线', color: 'bg-indigo-100 text-indigo-600', icon: History };
    }
  };

  const handleRequestCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spinoff || !user) return;
    setIsSubmittingRequest(true);
    try {
      const created = await mergeService.createRequest({
        spinoffId: spinoff.id,
        storyId: spinoff.originalStoryId,
        message: requestMessage,
        type: 'spinoff_official'
      });
      setPendingRequest(created);
      setIsRequestModalOpen(false);
      alert('认证申请已发送，请等待原作者审核。');
    } catch (err) {
      alert('申请发送失败，请重试。');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !spinoff) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">番外短篇</div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">内容加载失败</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{error || '未找到该番外'}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
            >
              返回
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeInfo = getTypeText(spinoff.type);

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 pb-20">
      {/* Main Content */}
      <div className="flex-1 space-y-10">
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-xl border border-gray-100 dark:border-gray-800 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
              <ArrowLeft size={16} />
              返回番外列表
            </button>
            
            {(user?.id === spinoff.authorId || user?.role === 'admin') && (
              <div className="flex gap-2">
                {!spinoff.isOfficial && user?.id === spinoff.authorId && (
                  <button 
                    onClick={() => setIsRequestModalOpen(true)}
                    disabled={!!pendingRequest}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      pendingRequest 
                        ? 'bg-amber-50 text-amber-500 cursor-default' 
                        : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                    }`}
                  >
                    <ShieldCheck size={16} />
                    {pendingRequest ? '官方认证审核中' : '申请官方认证'}
                  </button>
                )}
                <button 
                  onClick={() => navigate(`/spinoff/edit/${spinoff.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all"
                >
                  <Edit3 size={16} />
                  编辑番外
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`px-3 py-1 ${typeInfo.color} text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1`}>
                <typeInfo.icon size={12} />
                {typeInfo.label}
              </span>
              {spinoff.isOfficial && (
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={12} />
                  官方认证
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              {spinoff.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 font-bold">
              <Link to={`/story/${spinoff.originalStoryId}`} className="inline-flex items-center gap-2 hover:text-indigo-600 transition-colors">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                原著：{spinoff.originalStory?.title || '未知'}
              </Link>
              {spinoff.originalBranch && (
                <>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <GitBranch size={16} />
                    基于分支：{spinoff.originalBranch.title}
                  </span>
                </>
              )}
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>作者：{spinoff.author?.username || '未知作者'}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>{new Date(spinoff.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {spinoff.summary && (
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700 italic text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              “ {spinoff.summary} ”
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed text-gray-700 dark:text-gray-200">
              <ReactMarkdown>{spinoff.content || ''}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: IP Info & Characters */}
      <aside className="w-full lg:w-80 space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
          {/* Reference Source */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
              <Layout size={14} />
              世界观基石
            </div>
            <Link to={`/story/${spinoff.originalStoryId}`} className="group block space-y-3">
              <div className="aspect-video bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center overflow-hidden">
                <BookOpen size={32} className="text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-tight">{spinoff.originalStory?.title}</h4>
                <p className="text-xs text-gray-500 mt-1">查看原著完整时空树 ➜</p>
              </div>
            </Link>
          </section>

          {/* Referenced Characters */}
          {characters.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <Users size={14} />
                引用角色设定
              </div>
              <div className="grid grid-cols-1 gap-3">
                {characters.map(char => (
                  <div key={char.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                      {char.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 dark:text-white truncate">{char.name}</p>
                      <p className="text-[10px] text-gray-500 truncate capitalize">{char.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Copyright Info */}
          <section className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Info size={16} />
              <h5 className="text-xs font-black">版权声明</h5>
            </div>
            <p className="text-[10px] text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
              本作品已向原著作者缴纳 IP 授权费。禁止任何未经授权的转载或二次商业开发。
            </p>
          </section>
        </div>
        
        <button
          onClick={() => navigate('/spinoff')}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[2rem] font-black hover:bg-indigo-600 dark:hover:bg-indigo-50 transition-all active:scale-95"
        >
          <BookOpen size={20} />
          发现更多平行时空
        </button>
      </aside>

      {/* Certification Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="申请官方认证"
      >
        <form onSubmit={handleRequestCertification} className="space-y-6">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex gap-3 text-amber-700 dark:text-amber-300 text-sm">
            <ShieldCheck size={20} className="shrink-0" />
            <p>官方认证后，你的番外将获得官方勋章，并在原著主线页面获得专属展示位，同时收益权重将提升至 200%。</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">申请说明</label>
            <textarea
              required
              rows={4}
              className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
              placeholder="请说明为什么你的番外应该获得官方认证（如：严格遵循设定、扩充了某个角色的背景等）..."
              value={requestMessage}
              onChange={e => setRequestMessage(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingRequest}
            className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black hover:bg-amber-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send size={18} />
            {isSubmittingRequest ? '发送中...' : '发送申请'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default SpinoffDetailPage;

