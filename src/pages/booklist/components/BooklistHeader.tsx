import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Share2, Edit3, Trash2,
  Eye, User, Route, BookOpen,
} from 'lucide-react';
import { FollowButton } from '../../../components/Interaction';
import { Button, IconButton } from '../../../components/ui';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  TIMELINE:   { label: '时空导览', icon: Route,    color: 'bg-accent-600' },
  COLLECTION: { label: '精选合集', icon: BookOpen, color: 'bg-accent-500' },
};

interface BooklistData {
  id: string;
  title: string;
  description?: string;
  type?: string;
  tags?: string | { id: string; name: string }[];
  creator?: { id: string; username: string };
  updatedAt: string;
  totalEarnings?: number;
  paths?: any[];
}

interface BooklistHeaderProps {
  booklist: BooklistData;
  isCreator: boolean;
  stats: any;
  onToggleLike: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewPaths?: () => void;
  activeTab?: string;
  onExpandPaths?: () => void;
}

const BooklistHeader: React.FC<BooklistHeaderProps> = ({
  booklist, isCreator, stats,
  onToggleLike, onShare, onEdit, onDelete,
  onViewPaths,
  activeTab,
  onExpandPaths,
}) => {
  const navigate = useNavigate();
  const tc = TYPE_CONFIG[booklist.type || ''] || TYPE_CONFIG.COLLECTION;
  const TypeIcon = tc.icon;
  const pathCount = booklist.paths?.length ?? 0;

  return (
    <div className="bg-white dark:bg-ink-700 rounded-2xl p-6 md:p-8 shadow-lg border border-ink-100 dark:border-ink-600 space-y-6 relative overflow-hidden">

      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        leftIcon={<ArrowLeft size={16} />}
        className="text-ink-500 hover:text-accent-500"
      >
        返回
      </Button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-sm inline-flex items-center gap-1.5 ${tc.color}`}>
              <TypeIcon size={12} />
              {tc.label}
            </span>
            {(typeof booklist.tags === 'string'
              ? booklist.tags.split(',').filter(Boolean)
              : Array.isArray(booklist.tags)
                ? booklist.tags
                : []
            ).map((tag: any) => (
              <span key={tag.id || tag} className="px-2 py-1 bg-ink-100 dark:bg-ink-600 text-ink-500 text-[10px] font-bold rounded-lg">
                #{tag.name || tag}
              </span>
            ))}
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

          <h1 className="text-3xl md:text-4xl font-black text-ink-800 dark:text-white tracking-tight leading-tight">
            {booklist.title}
          </h1>
          <p className="text-ink-500 dark:text-ink-400 text-xl font-light leading-relaxed max-w-2xl italic">
            &ldquo;{booklist.description || '这位导游很懒，没有留下任何简介。'}&rdquo;
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
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[240px]">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate(`/reading-path/create?booklistId=${booklist.id}`)}
            leftIcon={<Route size={20} className="group-hover:scale-110 transition-transform" />}
            className="group py-3.5 text-base shadow-lg shadow-accent-400/20"
          >
            创建阅读路径
          </Button>

          {pathCount > 0 && (
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => {
                if (activeTab === 'overview') {
                  if (onExpandPaths) {
                    onExpandPaths();
                  }
                } else if (onViewPaths) {
                  onViewPaths();
                } else {
                  navigate(`/booklist/${booklist.id}?tab=overview`);
                }
              }}
              leftIcon={<Route size={18} />}
            >
              查看全部 {pathCount} 条路径
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={onToggleLike}
              leftIcon={<Heart size={18} className={stats?.liked ? 'fill-red-500' : ''} />}
              className={`flex-1 py-3 ${
                stats?.liked
                  ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/30'
                  : 'bg-white dark:bg-ink-700 text-ink-600 dark:text-ink-300 border-ink-100 dark:border-ink-600 hover:bg-ink-50 dark:hover:bg-ink-600'
              }`}
            >
              {stats?.liked ? '已点赞' : '点赞'}
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={onShare}
              leftIcon={<Share2 size={18} />}
              className="flex-1 py-3 bg-ink-50 dark:bg-ink-700 text-ink-600 dark:text-ink-300 border-ink-100 dark:border-ink-600 hover:bg-ink-50 dark:hover:bg-ink-600"
            >
              分享
            </Button>
          </div>

          {isCreator && (
            <div className="flex gap-2">
              <Button
                variant="subtle"
                size="md"
                onClick={onEdit}
                leftIcon={<Edit3 size={16} />}
                className="flex-1 py-3"
              >
                编辑书单
              </Button>
              <IconButton
                variant="ghost"
                size="md"
                aria-label="删除书单"
                onClick={onDelete}
                className="py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BooklistHeader;
