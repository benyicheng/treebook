import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { spinoffService } from '../../api/storyService';
import type { Spinoff, Character } from '../../api/types';
import { mergeService, MergeRequest } from '../../api/mergeService';
import { ArrowLeft, BookOpen, Star, Users, History, Sparkles, Layout, Info, Edit3, ShieldCheck, Send, GitBranch } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToast } from '../../components/notifications';
import ReactMarkdown from 'react-markdown';
import { Modal } from '../../components/ui';
import { FollowButton } from '../../components/Interaction';
import { ShareButton } from '../../components/Interaction';
import { useSpinoff } from '../../hooks/useSpinoffs';
import { useCharacters } from '../../hooks/useCharacters';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';

const SpinoffDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToast();

  // ── Data fetching with React Query ──
  const { data: spinoff, isLoading, error } = useSpinoff(id!);
  
  // Referenced characters
  const { data: allCharacters = [] } = useCharacters(
    spinoff?.originalStoryId || ''
  );
  const referencedCharIds = spinoff?.referencedCharacters
    ? JSON.parse(spinoff.referencedCharacters)
    : [];
  const characters: Character[] = referencedCharIds.length > 0
    ? allCharacters.filter((c: Character) => referencedCharIds.includes(c.id))
    : [];

  // Pending merge request (only if current user is author)
  const { data: pendingRequest } = useQuery<MergeRequest | null>({
    queryKey: ['merge', 'requests', id!, user?.id || ''],
    queryFn: async () => {
      const requests = await mergeService.getRequests(spinoff!.originalStoryId);
      const reqs = Array.isArray(requests) ? requests : [];
      return reqs.find(
        (r: MergeRequest) => r.spinoffId === id && r.status === 'pending'
      ) || null;
    },
    enabled: !!spinoff && !!user && user.id === spinoff.authorId,
  });

  // ── Mutations ──
  const qc = useQueryClient();
  const createRequestMutation = useMutation({
    mutationFn: (message: string) =>
      mergeService.createRequest({
        spinoffId: id!,
        storyId: spinoff!.originalStoryId,
        message,
        type: 'spinoff_official',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['merge', 'requests', id!] });
    },
  });

  // ── UI state ──
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const getTypeText = (type: string) => {
    switch (type) {
      case 'biography': return { label: '人物传记', color: 'bg-accent-100 text-accent-500', icon: Users };
      case 'world_expansion': return { label: '世界补完', color: 'bg-accent-100 text-accent-500', icon: Sparkles };
      default: return { label: 'IF 平行线', color: 'bg-accent-100 text-accent-600', icon: History };
    }
  };

  const handleRequestCertification = (e: React.FormEvent) => {
    e.preventDefault();
    createRequestMutation.mutate(requestMessage, {
      onSuccess: () => {
        setIsRequestModalOpen(false);
        setRequestMessage('');
        addToast('success', '认证申请已发送，请等待原作者审核。');
      },
      onError: () => {
        addToast('error', '申请发送失败，请重试。');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  if (error || !spinoff) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        <div className="bg-white dark:bg-ink-800 rounded-3xl border border-ink-100 dark:border-ink-700 shadow-sm p-8 space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-black text-ink-400 uppercase tracking-widest">番外短篇</div>
            <h1 className="text-2xl font-black text-ink-800 dark:text-white">内容加载失败</h1>
            <p className="text-ink-500 dark:text-ink-400 text-sm">{error?.message || '未找到该番外'}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-ink-100 dark:bg-ink-700 text-ink-800 dark:text-white rounded-2xl font-black hover:bg-ink-200 dark:hover:bg-ink-600 transition-all active:scale-95"
            >
              返回
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-accent-600 text-white rounded-2xl font-black hover:bg-accent-700 transition-all active:scale-95"
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
        <div className="bg-white dark:bg-ink-800 rounded-[2.5rem] p-10 shadow-xl border border-ink-100 dark:border-ink-700 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-ink-500 hover:text-accent-600 transition-colors">
              <ArrowLeft size={16} />
              返回番外列表
            </button>
            
            <div className="flex items-center gap-2">
              <ShareButton
                targetType="spinoff"
                targetId={spinoff.id}
                title={spinoff.title}
                description={spinoff.summary || spinoff.content.substring(0, 100)}
              />
              
              {(user?.id === spinoff.authorId || user?.role === 'admin') && (
                <>
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
                    className="flex items-center gap-2 px-4 py-2 bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400 rounded-xl text-sm font-bold hover:bg-accent-50 dark:hover:bg-accent-800/20 hover:text-accent-600 transition-all"
                  >
                    <Edit3 size={16} />
                    编辑番外
                  </button>
                </>
              )}
            </div>
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
            <h1 className="text-4xl md:text-5xl font-black text-ink-800 dark:text-white tracking-tight leading-tight">
              {spinoff.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-ink-500 dark:text-ink-400 font-bold">
              <Link to={`/story/${spinoff.originalStoryId || '#'}`} className="inline-flex items-center gap-2 hover:text-accent-600 transition-colors">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                原著：{spinoff.originalStory?.title || '未知'}
              </Link>
              {spinoff.originalBranch && (
                <>
                  <span className="w-1 h-1 bg-ink-300 rounded-full"></span>
                  <span className="inline-flex items-center gap-2 text-accent-500 dark:text-purple-400">
                    <GitBranch size={16} />
                    基于分支：{spinoff.originalBranch.title}
                  </span>
                </>
              )}
              <span className="w-1 h-1 bg-ink-300 rounded-full"></span>
              <span>作者：{spinoff.author?.username || '未知作者'}</span>
              {spinoff.author?.id && (
                <FollowButton targetUserId={spinoff.author.id} size="sm" />
              )}
              <span className="w-1 h-1 bg-ink-300 rounded-full"></span>
              <span>{new Date(spinoff.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {spinoff.summary && (
            <div className="p-6 bg-ink-50 dark:bg-ink-700/50 rounded-3xl border border-ink-100 dark:border-ink-600 italic text-ink-500 dark:text-ink-400 text-sm leading-relaxed">
              " {spinoff.summary} "
            </div>
          )}

          <div className="pt-6 border-t border-ink-100 dark:border-ink-700">
            <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed text-ink-600 dark:text-ink-200">
              <ReactMarkdown>{spinoff.content || ''}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: IP Info & Characters */}
      <aside className="w-full lg:w-80 space-y-6">
        <div className="bg-white dark:bg-ink-800 rounded-[2.5rem] p-8 border border-ink-100 dark:border-ink-700 shadow-sm space-y-8">
          {/* Reference Source */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-ink-400 uppercase tracking-widest">
              <Layout size={14} />
              世界观基石
            </div>
            <Link to={`/story/${spinoff.originalStoryId || '#'}`} className="group block space-y-3">
              {spinoff.originalStory?.coverImage ? (
                <div className="aspect-video rounded-2xl overflow-hidden">
                  <img
                    src={spinoff.originalStory.coverImage}
                    alt={spinoff.originalStory.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-accent-100 dark:bg-accent-800/30 rounded-2xl flex items-center justify-center overflow-hidden">
                  <BookOpen size={32} className="text-accent-600 group-hover:scale-110 transition-transform" />
                </div>
              )}
              <div>
                <h4 className="font-black text-ink-800 dark:text-white group-hover:text-accent-600 transition-colors leading-tight">
                  {spinoff.originalStory?.title}
                </h4>

                {/* Status & Tags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {spinoff.originalStory?.status && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      spinoff.originalStory.status === 'ongoing'
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : spinoff.originalStory.status === 'completed'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-ink-100 text-ink-500 dark:bg-ink-700 dark:text-ink-400'
                    }`}>
                      {spinoff.originalStory.status === 'ongoing' ? '连载中'
                        : spinoff.originalStory.status === 'completed' ? '已完结'
                        : '暂停'}
                    </span>
                  )}
                  {spinoff.originalStory?.tags?.slice(0, 3).map((tag: { id: string; name: string }) => (
                    <span key={tag.id} className="px-2 py-0.5 bg-accent-50 dark:bg-accent-800/20 text-accent-600 dark:text-accent-400 rounded-full text-[9px] font-bold">
                      #{tag.name}
                    </span>
                  ))}
                </div>

                {/* Description */}
                {spinoff.originalStory?.description && (
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-2 leading-relaxed line-clamp-3">
                    {spinoff.originalStory.description}
                  </p>
                )}

                {/* Author */}
                {spinoff.originalStory?.author && (
                  <p className="text-[10px] text-ink-400 mt-1.5">
                    作者：{spinoff.originalStory.author.username}
                  </p>
                )}

                <p className="text-xs text-accent-600 font-bold mt-2 group-hover:underline">
                  查看原著完整时空树 →
                </p>
              </div>
            </Link>
          </section>

          {/* Referenced Characters */}
          {characters.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-ink-400 uppercase tracking-widest">
                <Users size={14} />
                引用角色设定
              </div>
              <div className="grid grid-cols-1 gap-3">
                {characters.map(char => (
                  <div key={char.id} className="p-3 bg-ink-50 dark:bg-ink-700/50 rounded-2xl border border-ink-100 dark:border-ink-600 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-100 dark:bg-accent-800/50 flex items-center justify-center text-accent-600 dark:text-accent-400 font-bold">
                      {char.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-ink-800 dark:text-white truncate">{char.name}</p>
                      <p className="text-[10px] text-ink-500 truncate capitalize">{char.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Copyright Info */}
          <section className="p-5 bg-accent-50 dark:bg-accent-800/20 rounded-2xl border border-accent-100 dark:border-accent-800 space-y-3">
            <div className="flex items-center gap-2 text-accent-600 dark:text-accent-400">
              <Info size={16} />
              <h5 className="text-xs font-black">版权声明</h5>
            </div>
            <p className="text-[10px] text-accent-700 dark:text-accent-300 leading-relaxed font-medium">
              本作品已向原著作者缴纳 IP 授权费。禁止任何未经授权的转载或二次商业开发。
            </p>
          </section>
        </div>
        
        <button
          onClick={() => navigate('/spinoff')}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-ink-800 dark:bg-white text-white dark:text-ink-800 rounded-[2rem] font-black hover:bg-accent-600 dark:hover:bg-accent-50 transition-all active:scale-95"
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
            <label className="text-sm font-bold text-ink-500 uppercase tracking-wider">申请说明</label>
            <textarea
              required
              rows={4}
              className="w-full px-6 py-4 bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-700 rounded-3xl outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
              placeholder="请说明为什么你的番外应该获得官方认证（如：严格遵循设定、扩充了某个角色的背景等）..."
              value={requestMessage}
              onChange={e => setRequestMessage(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={createRequestMutation.isPending}
            className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black hover:bg-amber-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send size={18} />
            {createRequestMutation.isPending ? '发送中...' : '发送申请'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default SpinoffDetailPage;
