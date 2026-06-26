import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LikeButton } from '../LikeButton';
import { interactionService } from '../../../api/interactionService';
import { useAuthStore } from '../../../stores/useAuthStore';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// Mock 依赖 — factory 模式确保方法可被 spy
vi.mock('../../../api/interactionService', () => ({
  interactionService: {
    getStats: vi.fn(),
    toggleLike: vi.fn(),
  },
}));

vi.mock('../../../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

const { mockUseInteractionStore } = vi.hoisted(() => ({
  mockUseInteractionStore: vi.fn((...args: any[]) => ({ showLoginPrompt: vi.fn() })),
}));
vi.mock('../../../stores/useInteractionStore', () => ({
  useInteractionStore: (...args: any[]) => mockUseInteractionStore(...args),
}));

const mockAddToast = vi.fn();
vi.mock('../../notifications/Toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('LikeButton', () => {
  const mockToggleLike = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({ isAuthenticated: true });
    // getStats 返回默认数据，避免 useEffect 中 undefined 崩溃
    (interactionService.getStats as any).mockResolvedValue({
      liked: false,
      likeCount: 100,
    });
    (interactionService.toggleLike as any).mockResolvedValue({
      liked: true,
      likeCount: 101,
    });
  });

  it('renders with initial state', async () => {
    renderWithRouter(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={100}
      />,
    );

    // 初始渲染显示 initialCount，getStats 完成后更新为 100
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  it('toggles like on click', async () => {
    renderWithRouter(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={100}
      />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(interactionService.toggleLike).toHaveBeenCalledWith('story', 'test-id');
    });
  });

  it('shows login prompt when not authenticated', () => {
    (useAuthStore as any).mockReturnValue({ isAuthenticated: false });
    const showLoginPrompt = vi.fn();
    mockUseInteractionStore.mockReturnValue({ showLoginPrompt });

    renderWithRouter(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={100}
      />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(showLoginPrompt).toHaveBeenCalled();
  });

  it('handles rate limit error', async () => {
    (interactionService.toggleLike as any).mockRejectedValue({
      response: { status: 429 },
    });

    renderWithRouter(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={100}
      />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('warning', '操作太频繁，请稍后再试');
    });
  });

  it('calls onLikeChange callback', async () => {
    const onLikeChange = vi.fn();

    renderWithRouter(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={100}
        onLikeChange={onLikeChange}
      />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onLikeChange).toHaveBeenCalledWith(true, 101);
    });
  });

  it('shows count when showCount=true', async () => {
    renderWithRouter(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={42}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  it('hides count when showCount=false', async () => {
    renderWithRouter(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={42}
        showCount={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('42')).not.toBeInTheDocument();
    });
  });

  it('handles 401 error with toast', async () => {
    (interactionService.toggleLike as any).mockRejectedValue({
      response: { status: 401 },
    });

    renderWithRouter(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={100}
      />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('warning', '请先登录后再点赞');
    });
  });

  it('handles generic error with toast', async () => {
    (interactionService.toggleLike as any).mockRejectedValue({
      response: { status: 500, data: { message: '服务器错误' } },
    });

    renderWithRouter(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={100}
      />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('error', '点赞失败：服务器错误');
    });
  });
});
