import React, { useState, useCallback, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { interactionService, TargetType } from '../../api/interactionService';
import { useAuthStore } from '../../stores/useAuthStore';

interface LikeButtonProps {
  targetType: TargetType;
  targetId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onLikeChange?: (liked: boolean, count: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

const sizeClasses = {
  sm: { button: 'p-1.5', icon: 14, count: 'text-xs' },
  md: { button: 'p-2', icon: 18, count: 'text-sm' },
  lg: { button: 'p-3', icon: 24, count: 'text-base' },
};

export const LikeButton: React.FC<LikeButtonProps> = ({
  targetType,
  targetId,
  initialLiked = false,
  initialCount = 0,
  onLikeChange,
  size = 'md',
  showCount = true,
}) => {
  const { isAuthenticated } = useAuthStore();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // 获取初始状态
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await interactionService.getStats(targetType, targetId);
        setLiked(data.liked);
        setCount(data.likeCount);
      } catch (error) {
        console.error('Failed to fetch like stats:', error);
      }
    };
    if (isAuthenticated) {
      fetchStats();
    }
  }, [targetType, targetId, isAuthenticated]);

  const handleClick = useCallback(async () => {
    if (!isAuthenticated) {
      // 触发登录提示
      window.dispatchEvent(new CustomEvent('show-login-prompt'));
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    
    // 乐观更新
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : count - 1;
    setLiked(newLiked);
    setCount(Math.max(0, newCount));

    if (newLiked) {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 600);
    }

    try {
      const result = await interactionService.toggleLike(targetType, targetId);
      
      // 同步服务器返回的真实数据
      setLiked(result.liked);
      setCount(result.likeCount);
      
      onLikeChange?.(result.liked, result.likeCount);
      
      // 如果有防刷警告，显示提示
      if (result.fraudCheck?.warning) {
        console.warn('Like action flagged:', result.fraudCheck.confidence);
      }
    } catch (error: any) {
      // 回滚乐观更新
      setLiked(liked);
      setCount(count);
      
      const status = error.response?.status;
      const errorCode = error.response?.data?.code;
      const errorMsg = error.response?.data?.message;
      
      if (status === 401) {
        alert('请先登录后再点赞');
      } else if (status === 429) {
        alert('操作太频繁，请稍后再试');
      } else if (status === 403) {
        alert('操作被限制，请联系客服');
      } else if (status === 404) {
        alert('内容不存在');
      } else {
        console.error('Like failed:', error);
        alert('点赞失败：' + (errorMsg || '请稍后重试'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isLoading, liked, count, targetType, targetId, onLikeChange]);

  const classes = sizeClasses[size];

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative flex items-center gap-1.5 rounded-full transition-all duration-200
        ${classes.button}
        ${liked 
          ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
          : 'text-gray-400 hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }
        ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="relative">
        <AnimatePresence>
          {showParticles && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0],
                    x: Math.cos((i * 60 * Math.PI) / 180) * 20,
                    y: Math.sin((i * 60 * Math.PI) / 180) * 20,
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Heart size={classes.icon / 2} className="text-red-400 fill-red-400" />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
        
        <motion.div
          animate={liked ? {
            scale: [1, 1.3, 1],
            transition: { duration: 0.3 }
          } : {}}
        >
          <Heart
            size={classes.icon}
            className={`transition-all duration-200 ${
              liked ? 'fill-current' : ''
            }`}
          />
        </motion.div>
      </div>
      
      {showCount && (
        <motion.span
          key={count ?? 0}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`font-bold ${classes.count}`}
        >
          {(count ?? 0).toLocaleString()}
        </motion.span>
      )}
    </motion.button>
  );
};

export default LikeButton;
