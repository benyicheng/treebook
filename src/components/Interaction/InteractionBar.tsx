import React, { useEffect, useState, useCallback } from 'react';
import { Eye, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { LikeButton } from './LikeButton';
import { RatingComponent } from './RatingComponent';
import { ShareButton } from './ShareButton';
import { interactionService, InteractionStats, TargetType } from '../../api/interactionService';
import { useAuthStore } from '../../stores/useAuthStore';

interface InteractionBarProps {
  targetType: TargetType;
  targetId: string;
  viewCount?: number;
  commentCount?: number;
  showRating?: boolean;
  showShare?: boolean;
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const InteractionBar: React.FC<InteractionBarProps> = ({
  targetType,
  targetId,
  viewCount = 0,
  commentCount = 0,
  showRating = true,
  showShare = true,
  compact = false,
  size = 'md',
}) => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<InteractionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await interactionService.getStats(targetType, targetId);
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch interaction stats:', err);
      setError('加载互动数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 监听互动更新事件
  useEffect(() => {
    const handleInteractionUpdate = (e: CustomEvent) => {
      if (e.detail?.targetType === targetType && e.detail?.targetId === targetId) {
        fetchStats();
      }
    };

    window.addEventListener('interaction-update', handleInteractionUpdate as EventListener);
    return () => {
      window.removeEventListener('interaction-update', handleInteractionUpdate as EventListener);
    };
  }, [targetType, targetId, fetchStats]);

  const handleLikeChange = useCallback((liked: boolean, count: number) => {
    if (stats) {
      setStats({ ...stats, liked, likeCount: count });
    }
  }, [stats]);

  const handleRatingChange = useCallback((rating: number, reasonTags: string[]) => {
    if (stats) {
      setStats({
        ...stats,
        myRating: rating,
        myReasonTags: reasonTags,
        ratingCount: stats.ratingCount + (stats.myRating ? 0 : 1),
      });
    }
  }, [stats]);

  const handleShare = useCallback((platform: string, count: number) => {
    if (stats) {
      setStats({ ...stats, shareCount: count });
    }
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 animate-pulse">
        <div className="w-20 h-8 bg-ink-200 dark:bg-ink-600 rounded-full" />
        <div className="w-20 h-8 bg-ink-200 dark:bg-ink-600 rounded-full" />
        <div className="w-20 h-8 bg-ink-200 dark:bg-ink-600 rounded-full" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-sm text-ink-400">
        互动数据加载失败
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <LikeButton
          targetType={targetType}
          targetId={targetId}
          initialLiked={stats.liked}
          initialCount={stats.likeCount}
          onLikeChange={handleLikeChange}
          size="sm"
        />
        <ShareButton
          targetType={targetType}
          targetId={targetId}
          title=""
          description=""
          initialCount={stats.shareCount}
          onShare={handleShare}
          size="sm"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* 主要互动按钮 */}
      <div className="flex items-center gap-4 flex-wrap">
        <LikeButton
          targetType={targetType}
          targetId={targetId}
          initialLiked={stats.liked}
          initialCount={stats.likeCount}
          onLikeChange={handleLikeChange}
        />
        
        <ShareButton
          targetType={targetType}
          targetId={targetId}
          title=""
          description=""
          initialCount={stats.shareCount}
          onShare={handleShare}
        />

        {/* 浏览量 */}
        <div className="flex items-center gap-1.5 text-ink-400">
          <Eye size={18} />
          <span className="text-sm font-medium">{viewCount.toLocaleString()}</span>
        </div>

        {/* 评论数 */}
        <div className="flex items-center gap-1.5 text-ink-400">
          <MessageSquare size={18} />
          <span className="text-sm font-medium">{commentCount.toLocaleString()}</span>
        </div>
      </div>

      {/* 评分区域 */}
      {showRating && (
        <div className="pt-4 border-t border-ink-100 dark:border-ink-700">
          <RatingComponent
            targetType={targetType}
            targetId={targetId}
            initialRating={stats.myRating}
            initialReasonTags={stats.myReasonTags}
            ratingCount={stats.ratingCount}
            ratingAvg={stats.ratingAvg}
            ratingDist={stats.ratingDist}
            onRatingChange={handleRatingChange}
          />
        </div>
      )}
    </motion.div>
  );
};

export default InteractionBar;
