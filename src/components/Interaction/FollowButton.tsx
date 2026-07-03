import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { followService } from '../../api/followService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToast } from '../notifications/Toast';
import { UserPlus, UserCheck, LogIn } from 'lucide-react';
import { Button } from '../ui';

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  onFollowChange,
  className = '',
  size = 'md',
}) => {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Check initial follow status (only if logged in)
  useEffect(() => {
    let cancelled = false;
    if (!user || user.id === targetUserId) {
      setInitialLoading(false);
      return;
    }
    followService.checkFollowStatus(targetUserId).then((res) => {
      if (!cancelled) {
        setIsFollowing(res.isFollowing);
        setInitialLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setInitialLoading(false);
    });
    return () => { cancelled = true; };
  }, [targetUserId, user]);

  const handleToggleFollow = useCallback(async () => {
    // Not logged in → redirect to login
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    // Own profile → do nothing
    if (user.id === targetUserId) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollow(targetUserId);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followService.follow(targetUserId);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) {
        addToast('warning', '请先登录后再操作');
      } else if (status === 429) {
        addToast('warning', '操作太频繁，请稍后再试');
      } else if (status === 404) {
        addToast('info', '该用户不存在');
      } else {
        console.error('Follow action failed:', err);
        addToast('error', '操作失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }, [isFollowing, targetUserId, user, navigate, onFollowChange, addToast]);

  // Don't show button for own profile
  if (user && user.id === targetUserId) return null;

  const iconSize = { sm: 14, md: 16, lg: 18 };

  if (initialLoading) {
    return (
      <Button
        variant="subtle"
        size={size}
        loading
        className={className}
      >
        加载中
      </Button>
    );
  }

  // Unauthenticated: show follow button that redirects to login
  if (!user) {
    return (
      <Button
        variant="primary"
        size={size}
        onClick={handleToggleFollow}
        leftIcon={<LogIn size={iconSize[size]} />}
        className={`bg-gradient-to-r from-accent-500 to-purple-500 text-white hover:from-accent-600 hover:to-accent-500 ${className}`}
      >
        关注
      </Button>
    );
  }

  if (isFollowing) {
    return (
      <Button
        variant="subtle"
        size={size}
        onClick={handleToggleFollow}
        disabled={loading}
        loading={loading}
        leftIcon={
          loading ? undefined : (
            <UserCheck size={iconSize[size]} className="group-hover:hidden" />
          )
        }
        className={`bg-ink-100 dark:bg-ink-700 text-ink-600 dark:text-ink-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 group ${className}`}
      >
        <span className="group-hover:hidden">已关注</span>
        <span className="hidden group-hover:inline">取消关注</span>
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size={size}
      onClick={handleToggleFollow}
      disabled={loading}
      loading={loading}
      leftIcon={
        loading ? undefined : <UserPlus size={iconSize[size]} />
      }
      className={className}
    >
      关注
    </Button>
  );
};

export default FollowButton;
