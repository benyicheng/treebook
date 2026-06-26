import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FollowButton from '../FollowButton';

// Mock useAuthStore
const mockUseAuthStore = vi.fn();
vi.mock('../../../stores/useAuthStore', () => ({
  useAuthStore: (...args: any[]) => mockUseAuthStore(...args),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock followService
const mockCheckFollowStatus = vi.fn();
const mockFollow = vi.fn();
const mockUnfollow = vi.fn();
vi.mock('../../../api/followService', () => ({
  followService: {
    checkFollowStatus: (...args: any[]) => mockCheckFollowStatus(...args),
    follow: (...args: any[]) => mockFollow(...args),
    unfollow: (...args: any[]) => mockUnfollow(...args),
  },
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('FollowButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckFollowStatus.mockResolvedValue({ isFollowing: false });
    mockFollow.mockResolvedValue({});
    mockUnfollow.mockResolvedValue({});
  });

  describe('unauthenticated state', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({ user: null });
    });

    it('renders follow button with follow text', () => {
      renderWithRouter(<FollowButton targetUserId="user-999" />);
      expect(screen.getByText('关注')).toBeInTheDocument();
    });

    it('navigates to login on click when not authenticated', () => {
      renderWithRouter(<FollowButton targetUserId="user-999" />);
      fireEvent.click(screen.getByText('关注'));
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
      );
    });
  });

  describe('authenticated state', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({ user: { id: 'user-1' } });
    });

    it('shows loading state initially', () => {
      // Don't resolve checkFollowStatus to test loading state
      mockCheckFollowStatus.mockReturnValue(new Promise(() => {}));
      renderWithRouter(<FollowButton targetUserId="user-999" />);
      expect(screen.getByText('加载中')).toBeInTheDocument();
    });

    it('checks follow status on mount', async () => {
      renderWithRouter(<FollowButton targetUserId="user-999" />);
      await waitFor(() => {
        expect(mockCheckFollowStatus).toHaveBeenCalledWith('user-999');
      });
    });

    it('shows follow button when not following', async () => {
      mockCheckFollowStatus.mockResolvedValue({ isFollowing: false });
      renderWithRouter(<FollowButton targetUserId="user-999" />);

      await waitFor(() => {
        expect(screen.getByText('关注')).toBeInTheDocument();
      });
    });

    it('shows unfollow button when following', async () => {
      mockCheckFollowStatus.mockResolvedValue({ isFollowing: true });
      renderWithRouter(<FollowButton targetUserId="user-999" />);

      await waitFor(() => {
        expect(screen.getByText('已关注')).toBeInTheDocument();
      });
    });

    it('follows on click when not following', async () => {
      mockCheckFollowStatus.mockResolvedValue({ isFollowing: false });
      renderWithRouter(<FollowButton targetUserId="user-999" />);

      await waitFor(() => {
        expect(screen.getByText('关注')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('关注'));

      await waitFor(() => {
        expect(mockFollow).toHaveBeenCalledWith('user-999');
      });
    });

    it('unfollows on click when following', async () => {
      mockCheckFollowStatus.mockResolvedValue({ isFollowing: true });
      renderWithRouter(<FollowButton targetUserId="user-999" />);

      await waitFor(() => {
        expect(screen.getByText('已关注')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('已关注'));

      await waitFor(() => {
        expect(mockUnfollow).toHaveBeenCalledWith('user-999');
      });
    });

    it('calls onFollowChange callback after follow', async () => {
      const onFollowChange = vi.fn();
      mockCheckFollowStatus.mockResolvedValue({ isFollowing: false });
      renderWithRouter(
        <FollowButton targetUserId="user-999" onFollowChange={onFollowChange} />,
      );

      await waitFor(() => {
        expect(screen.getByText('关注')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('关注'));

      await waitFor(() => {
        expect(onFollowChange).toHaveBeenCalledWith(true);
      });
    });

    it('calls onFollowChange callback after unfollow', async () => {
      const onFollowChange = vi.fn();
      mockCheckFollowStatus.mockResolvedValue({ isFollowing: true });
      renderWithRouter(
        <FollowButton targetUserId="user-999" onFollowChange={onFollowChange} />,
      );

      await waitFor(() => {
        expect(screen.getByText('已关注')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('已关注'));

      await waitFor(() => {
        expect(onFollowChange).toHaveBeenCalledWith(false);
      });
    });

    it('handles follow error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCheckFollowStatus.mockResolvedValue({ isFollowing: false });
      mockFollow.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<FollowButton targetUserId="user-999" />);

      await waitFor(() => {
        expect(screen.getByText('关注')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('关注'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('handles checkFollowStatus error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCheckFollowStatus.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<FollowButton targetUserId="user-999" />);

      // Should still render after error
      await waitFor(() => {
        expect(screen.getByText('关注')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('own profile', () => {
    it('returns null for own profile', () => {
      mockUseAuthStore.mockReturnValue({ user: { id: 'user-self' } });
      const { container } = renderWithRouter(
        <FollowButton targetUserId="user-self" />,
      );
      expect(container.innerHTML).toBe('');
    });
  });
});
