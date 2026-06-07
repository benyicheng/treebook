import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Heart,
  Share2,
  Edit3,
  Trash2,
  Eye,
  User,
  Calendar,
} from 'lucide-react';
import { FollowButton } from '../../../components/Interaction';

interface BooklistData {
  id: string;
  title: string;
  description?: string;
  type?: 'TIMELINE' | 'COLLECTION';
  tags?: string;
  creator?: {
    id: string;
    username: string;
  };
  updatedAt: string;
  items?: any[];
  totalEarnings?: number;
}

interface BooklistHeaderProps {
  booklist: BooklistData;
  isCreator: boolean;
  stats: any;
  completedCount: number;
  totalItems: number;
  onStartJourney: () => void;
  onToggleLike: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const BooklistHeader: React.FC<BooklistHeaderProps> = ({
  booklist,
  isCreator,
  stats,
  completedCount,
  totalItems,
  onStartJourney,
  onToggleLike,
  onShare,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-ink-700 rounded-3xl p-8 md:p-12 shadow-xl border border-ink-100 dark:border-ink-600 space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-ink-500 hover:text-accent-500 transition-colors"
      >
        <ArrowLeft size={16} />
        返回书单列表
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-sm ${
              booklist.type === 'TIMELINE' ? 'bg-accent-600' : 'bg-accent-500'
            }`}>
              {booklist.type === 'TIMELINE' ? '时空导览' : '精选书单'}
            </span>
            {booklist.tags?.split(',').filter(Boolean).map(tag => (
              <span key={tag} className="px-2 py-1 bg-ink-100 dark:bg-ink-600 text-ink-500 text-[10px] font-bold rounded-lg">
                #{tag.trim()}
              </span>
            ))}
            {totalItems > 0 && (
              <span className="px-3 py-1 bg-ink-100 dark:bg-ink-600 text-ink-500 dark:text-ink-400 text-xs font-black rounded-full uppercase tracking-wider">
                {totalItems} 站
              </span>
            )}
            {stats && (
              <div className="flex items-center gap-4 ml-4 text-ink-400">
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

          <h1 className="text-4xl md:text-5xl font-black text-ink-800 dark:text-white tracking-tight leading-tight">
            {booklist.title}
          </h1>
          <p className="text-ink-500 dark:text-ink-400 text-xl font-light leading-relaxed max-w-2xl italic">
            "{booklist.description || '这位导游很懒，没有留下任何简介。'}"
          </p>

          <div className="flex items-center gap-6 pt-4 text-ink-400">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center text-accent-500 dark:text-accent-400 font-bold">
                {booklist.creator?.username?.[0] || 'U'}
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">策划人</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-ink-600 dark:text-ink-300">{booklist.creator?.username}</p>
                  {booklist.creator?.id && (
                    <FollowButton targetUserId={booklist.creator.id} size="sm" />
                  )}
                </div>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-ink-100 dark:bg-ink-600"></div>
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">最后更新</p>
              <p className="text-sm font-bold text-ink-600 dark:text-ink-300">{new Date(booklist.updatedAt).toLocaleDateString()}</p>
            </div>
            {isCreator && (
              <>
                <div className="h-8 w-[1px] bg-ink-100 dark:bg-ink-600"></div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest leading-none mb-1 text-accent-500">累计分润</p>
                  <p className="text-sm font-bold text-accent-500">{(booklist.totalEarnings || 0).toFixed(2)} USD</p>
                </div>
              </>
            )}
            {/* Reading progress summary */}
            {completedCount > 0 && (
              <>
                <div className="h-8 w-[1px] bg-ink-100 dark:bg-ink-600"></div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest leading-none mb-1 text-accent-500">阅读进度</p>
                  <p className="text-sm font-bold text-accent-500">{completedCount}/{totalItems} 站已完成</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[240px]">
          <button
            onClick={onStartJourney}
            className="w-full flex items-center justify-center gap-3 px-10 py-5 bg-accent-500 text-white rounded-2xl font-black text-lg hover:bg-accent-600 transition-all shadow-xl shadow-accent-400/20 active:scale-95 group"
          >
            <Play size={24} fill="currentColor" className="group-hover:scale-110 transition-transform" />
            {completedCount > 0 ? `继续阅读 第${completedCount + 1}站` : '开始旅程'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onToggleLike}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${
                stats?.liked
                  ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/30"
                  : "bg-white dark:bg-ink-700 text-ink-600 dark:text-ink-300 border-ink-100 dark:border-ink-600 hover:bg-ink-50 dark:hover:bg-ink-600"
              }`}
            >
              <Heart size={18} className={stats?.liked ? "fill-red-500" : ""} />
              {stats?.liked ? '已点赞' : '点赞'}
            </button>

            <button
              onClick={onShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-ink-50 dark:bg-ink-700 text-ink-600 dark:text-ink-300 border border-ink-100 dark:border-ink-600 rounded-xl font-bold text-sm hover:bg-ink-50 dark:hover:bg-ink-600 transition-all"
            >
              <Share2 size={18} />
              分享
            </button>
          </div>

          {isCreator && (
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-ink-100 dark:bg-ink-600 text-ink-600 dark:text-ink-300 rounded-xl font-bold text-sm hover:bg-ink-200 dark:hover:bg-ink-500 transition-all"
              >
                <Edit3 size={16} />
                编辑书单
              </button>
              <button
                onClick={onDelete}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BooklistHeader;
