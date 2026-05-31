import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { InteractionBar } from '../InteractionBar';
import { interactionService } from '../../../api/interactionService';
import { useAuthStore } from '../../../stores/useAuthStore';

// Mock 依赖
vi.mock('../../../api/interactionService', () => ({
  interactionService: {
    getStats: vi.fn(),
  },
  RATING_REASON_TAGS: ['A', 'B'],
}));

vi.mock('../../../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock 子组件 — InteractionBar 的职责是编排，不是渲染细节
vi.mock('../LikeButton', () => ({
  LikeButton: ({ onLikeChange, size, targetType, targetId, initialLiked, initialCount }: any) => (
    <button
      data-testid="like-button"
      data-size={size}
      data-target-type={targetType}
      data-target-id={targetId}
      data-liked={String(initialLiked)}
      data-count={String(initialCount)}
      onClick={() => onLikeChange?.(true, initialCount + 1)}
    >
      Like
    </button>
  ),
}));

vi.mock('../RatingComponent', () => ({
  RatingComponent: ({ onRatingChange, size, initialRating, ratingCount, ratingAvg }: any) => (
    <div
      data-testid="rating-component"
      data-size={size}
      data-rating={String(initialRating)}
      data-count={String(ratingCount)}
      data-avg={String(ratingAvg)}
    >
      <button onClick={() => onRatingChange?.(4, ['good'])}>Rate</button>
    </div>
  ),
}));

vi.mock('../ShareButton', () => ({
  ShareButton: ({ onShare, size, initialCount }: any) => (
    <button
      data-testid="share-button"
      data-size={size}
      data-count={String(initialCount)}
      onClick={() => onShare?.('copy', initialCount + 1)}
    >
      Share
    </button>
  ),
}));

// framer-motion mock
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ---------- 测试数据 ----------
const mockStats = {
  liked: true,
  likeCount: 99,
  shareCount: 10,
  ratingCount: 42,
  ratingAvg: 4.2,
  ratingDist: { '8': 20, '10': 15 },
  myRating: 3,
  myReasonTags: ['推荐'],
  viewCount: 500,
};

const defaultProps = {
  targetType: 'story' as const,
  targetId: 'test-id',
  viewCount: 1000,
  commentCount: 25,
};

describe('InteractionBar', () => {
  beforeEach(() => {
    (useAuthStore as any).mockReturnValue({ user: { id: 'u1' }, isAuthenticated: true });
    (interactionService.getStats as any).mockResolvedValue(mockStats);
  });

  // ============ 状态切换 ============
  describe('状态', () => {
    it('加载中显示骨架屏', () => {
      // 让 getStats 永远不 resolve，保持 loading 状态
      (interactionService.getStats as any).mockReturnValue(new Promise(() => {}));

      render(<InteractionBar {...defaultProps} />);

      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('加载失败显示错误提示', async () => {
      (interactionService.getStats as any).mockRejectedValue(new Error('Network error'));

      render(<InteractionBar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('互动数据加载失败')).toBeInTheDocument();
      });
    });

    it('加载成功渲染所有子组件', async () => {
      render(<InteractionBar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('like-button')).toBeInTheDocument();
      });
      expect(screen.getByTestId('share-button')).toBeInTheDocument();
      expect(screen.getByTestId('rating-component')).toBeInTheDocument();
    });

    it('显示浏览量和评论数', async () => {
      render(<InteractionBar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('like-button')).toBeInTheDocument();
      });

      // viewCount 和 commentCount 是直接 props，立即渲染
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  // ============ 数据传递 ============
  describe('Props 传递', () => {
    it('传递正确的 stats 给 LikeButton', async () => {
      render(<InteractionBar {...defaultProps} />);

      await waitFor(() => {
        const btn = screen.getByTestId('like-button');
        expect(btn).toBeInTheDocument();
        expect(btn.dataset.liked).toBe('true');
        expect(btn.dataset.count).toBe('99');
      });
    });

    it('传递正确的 stats 给 RatingComponent', async () => {
      render(<InteractionBar {...defaultProps} />);

      await waitFor(() => {
        const comp = screen.getByTestId('rating-component');
        expect(comp.dataset.rating).toBe('3');
        expect(comp.dataset.count).toBe('42');
        expect(comp.dataset.avg).toBe('4.2');
      });
    });

    it('隐藏评分区域（showRating=false）', async () => {
      render(<InteractionBar {...defaultProps} showRating={false} />);

      await waitFor(() => screen.getByTestId('like-button'));

      expect(screen.queryByTestId('rating-component')).not.toBeInTheDocument();
      // 注: showShare prop 当前未在组件 JSX 中使用，ShareButton 始终渲染
    });
  });

  // ============ Compact 模式 ============
  describe('Compact 模式', () => {
    it('compact 模式只显示 Like 和 Share', async () => {
      render(<InteractionBar {...defaultProps} compact />);

      await waitFor(() => {
        expect(screen.getByTestId('like-button')).toBeInTheDocument();
      });
      expect(screen.getByTestId('share-button')).toBeInTheDocument();

      // compact 不应显示评分或浏览/评论
      expect(screen.queryByTestId('rating-component')).not.toBeInTheDocument();
      expect(screen.queryByText('1,000')).not.toBeInTheDocument();
    });

    it('compact 模式传递 sm 尺寸', async () => {
      render(<InteractionBar {...defaultProps} compact />);

      await waitFor(() => screen.getByTestId('like-button'));

      expect(screen.getByTestId('like-button').dataset.size).toBe('sm');
      expect(screen.getByTestId('share-button').dataset.size).toBe('sm');
    });
  });

  // ============ 回调处理 ============
  describe('回调', () => {
    it('Like 回调更新内部 stats', async () => {
      render(<InteractionBar {...defaultProps} />);

      await waitFor(() => screen.getByTestId('like-button'));

      // 初始 count = 99
      expect(screen.getByTestId('like-button').dataset.count).toBe('99');

      // 点击 like → callback 设置 newLiked=true, newCount=99+1=100
      fireEvent.click(screen.getByTestId('like-button'));

      await waitFor(() => {
        expect(screen.getByTestId('like-button').dataset.liked).toBe('true');
        expect(screen.getByTestId('like-button').dataset.count).toBe('100');
      });
    });
  });
});
