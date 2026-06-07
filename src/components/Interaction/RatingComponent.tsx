import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Star, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { interactionService, RATING_REASON_TAGS, TargetType } from '../../api/interactionService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToast } from '../notifications/Toast';
import Modal from '../ui/Modal';

interface RatingComponentProps {
  targetType: TargetType;
  targetId: string;
  initialRating?: number | null;
  initialReasonTags?: string[];
  ratingCount?: number;
  ratingAvg?: number;
  ratingDist?: Record<string, number>;
  onRate?: (rating: number, reasonTags: string[]) => void;
  onRatingChange?: (rating: number, reasonTags: string[]) => void;
  size?: 'sm' | 'md' | 'lg';
  showDetail?: boolean;
  showDistribution?: boolean;
}

const sizeClasses = {
  sm: { star: 14, container: 'gap-0.5' },
  md: { star: 20, container: 'gap-1' },
  lg: { star: 28, container: 'gap-1.5' },
};

export const RatingComponent: React.FC<RatingComponentProps> = ({
  targetType,
  targetId,
  initialRating = null,
  initialReasonTags = [],
  ratingCount = 0,
  ratingAvg = 0,
  ratingDist = {},
  onRate,
  onRatingChange,
  size = 'md',
  showDetail = true,
  showDistribution = false,
}) => {
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useToast();
  const [currentRating, setCurrentRating] = useState<number | null>(initialRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialReasonTags);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stats, setStats] = useState({ ratingCount, ratingAvg, ratingDist });
  const containerRef = useRef<HTMLDivElement>(null);

  const classes = sizeClasses[size];

  // 获取评分统计
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await interactionService.getStats(targetType, targetId);
        setStats({
          ratingCount: data.ratingCount,
          ratingAvg: data.ratingAvg,
          ratingDist: data.ratingDist,
        });
      } catch (error) {
        console.error('Failed to fetch rating stats:', error);
      }
    };
    fetchStats();
  }, [targetType, targetId]);

  // 计算评分分布百分比
  const distributionData = React.useMemo(() => {
    const dist = stats.ratingDist || {};
    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    
    return [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(value => {
      const count = dist[value.toString()] || 0;
      return {
        stars: value / 2,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });
  }, [stats.ratingDist]);

  const handleStarClick = useCallback((starIndex: number, isHalf: boolean) => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('show-login-prompt'));
      return;
    }

    const rating = isHalf ? starIndex + 0.5 : starIndex + 1;
    setCurrentRating(rating);
    setIsModalOpen(true);
  }, [isAuthenticated]);

  const handleMouseMove = useCallback((e: React.MouseEvent, starIndex: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const starWidth = rect.width / 5;
    const x = e.clientX - rect.left;
    const starCenter = (starIndex + 0.5) * starWidth;
    const isHalf = x < starCenter;

    setHoverRating(isHalf ? starIndex + 0.5 : starIndex + 1);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!currentRating) return;

    setIsSubmitting(true);
    try {
      const result = await interactionService.submitRating(targetType, targetId, {
        score: currentRating,
        reasonTags: selectedTags,
      });

      onRatingChange?.(currentRating, selectedTags);
      setIsModalOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      console.error('Rating failed:', error);
      const status = error.response?.status;
      const errorCode = error.response?.data?.code;
      const errorMsg = error.response?.data?.message;
      
      if (status === 401) {
        addToast('warning', '请先登录后再评分');
      } else if (status === 429) {
        addToast('warning', '评分太频繁，请稍后再试');
      } else if (errorCode === 'VALIDATION_ERROR') {
        addToast('warning', '评分格式错误：' + (errorMsg || '评分必须是0.5-5.0之间的半整数'));
      } else if (errorCode === 'NOT_FOUND') {
        addToast('info', '目标内容不存在');
      } else {
        addToast('error', '评分失败：' + (errorMsg || '请稍后重试'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [currentRating, selectedTags, targetType, targetId, onRatingChange]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag].slice(0, 5)
    );
  }, []);

  const displayRating = hoverRating ?? currentRating ?? 0;

  return (
    <div className="space-y-4">
      {/* 评分星星 */}
      <div className="flex items-center gap-4">
        <div
          ref={containerRef}
          className={`flex ${classes.container}`}
          onMouseLeave={() => setHoverRating(null)}
        >
          {[0, 1, 2, 3, 4].map((starIndex) => {
            const starValue = starIndex + 1;
            const isFilled = displayRating >= starValue;
            const isHalfFilled = displayRating >= starValue - 0.5 && displayRating < starValue;

            return (
              <div
                key={starIndex}
                className="relative cursor-pointer"
                onMouseMove={(e) => handleMouseMove(e, starIndex)}
                onClick={(e) => {
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  const isHalf = e.clientX < rect.left + rect.width / 2;
                  handleStarClick(starIndex, isHalf);
                }}
              >
                {/* 背景星 (灰色) */}
                <Star
                  size={classes.star}
                  className="text-ink-200 dark:text-ink-600"
                />

                {/* 填充星 (黄色) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: isHalfFilled ? '50%' : isFilled ? '100%' : '0%' }}
                >
                  <Star
                    size={classes.star}
                    className="text-amber-400 fill-amber-400"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 平均分和人数 */}
        {showDetail && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-amber-500">{ratingAvg.toFixed(1)}</span>
            <span className="text-ink-400">({ratingCount}人评分)</span>
          </div>
        )}
      </div>

      {/* 评分分布可视化 */}
      {showDetail && ratingCount > 0 && (
        <div className="space-y-1">
          {distributionData.slice(0, 5).map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center gap-2 text-xs">
              <span className="w-8 text-ink-400">{stars}星</span>
              <div className="flex-1 h-2 bg-ink-100 dark:bg-ink-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="h-full bg-amber-400 rounded-full"
                />
              </div>
              <span className="w-10 text-right text-ink-400">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* 评分理由标签弹窗 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="为什么给出这个评分？"
      >
        <div className="space-y-6">
          {/* 已选评分展示 */}
          <div className="flex items-center justify-center gap-1 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={32}
                className={`${
                  star <= (currentRating || 0)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-ink-200'
                }`}
              />
            ))}
            <span className="ml-2 text-2xl font-bold text-amber-500">
              {currentRating}
            </span>
          </div>

          {/* 标签选择 */}
          <div>
            <p className="text-sm text-ink-500 mb-3">选择评价标签 (最多5个)</p>
            <div className="flex flex-wrap gap-2">
              {RATING_REASON_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-ink-100 text-ink-500 hover:bg-ink-200 dark:bg-ink-700 dark:text-ink-400'
                  }`}
                >
                  {selectedTags.includes(tag) && (
                    <Check size={12} className="inline mr-1" />
                  )}
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 bg-ink-100 text-ink-600 rounded-xl font-bold hover:bg-ink-200 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '提交中...' : '确认评分'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 成功提示 */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-green-500 text-white rounded-full font-bold shadow-lg z-50"
          >
            评分成功！
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RatingComponent;
