import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { followService } from '../api/followService';
import { useAuthStore } from '../stores/useAuthStore';
import { UserPlus, UserCheck, Loader2, LogIn } from 'lucide-react';

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
    } catch (err) {
      console.error('Follow action failed:', err);
    } finally {
      setLoading(false);
    }
  }, [isFollowing, targetUserId, user, navigate, onFollowChange]);

  // Don't show button for own profile
  if (user && user.id === targetUserId) return null;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-2.5 text-base gap-2',
  };

  const iconSize = { sm: 14, md: 16, lg: 18 };

  if (initialLoading) {
    return (
      <button
        disabled
        className={`inline-flex items-center justify-center rounded-xl font-bold transition-all opacity-50 ${sizeClasses[size]} ${className}`}
      >
        <Loader2 size={iconSize[size]} className="animate-spin" />
        加载中
      </button>
    );
  }

  // Unauthenticated: show follow button that redirects to login
  if (!user) {
    return (
      <button
        onClick={handleToggleFollow}
        className={`inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95
          bg-gradient-to-r from-accent-500 to-purple-500 text-white hover:from-accent-600 hover:to-accent-500
          ${sizeClasses[size]} ${className}`}
      >
        <LogIn size={iconSize[size]} />
        关注
      </button>
    );
  }

  if (isFollowing) {
    return (
      <button
        onClick={handleToggleFollow}
        disabled={loading}
        className={`inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95
          bg-ink-100 dark:bg-ink-700 text-ink-600 dark:text-ink-300
          hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400
          group ${sizeClasses[size]} ${className}`}
      >
        {loading ? (
          <Loader2 size={iconSize[size]} className="animate-spin" />
        ) : (
          <UserCheck size={iconSize[size]} className="group-hover:hidden" />
        )}
        <span className="group-hover:hidden">已关注</span>
        <span className="hidden group-hover:inline">取消关注</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95
        bg-accent-500 text-white hover:bg-accent-600
        ${sizeClasses[size]} ${className}`}
    >
      {loading ? (
        <Loader2 size={iconSize[size]} className="animate-spin" />
      ) : (
        <UserPlus size={iconSize[size]} />
      )}
      关注
    </button>
  );
};

export default FollowButton;
