import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LikeButton } from '../LikeButton';
import { interactionService } from '../../../api/interactionService';
import { useAuthStore } from '../../../stores/useAuthStore';

// Mock依赖
vi.mock('../../../api/interactionService');
vi.mock('../../../stores/useAuthStore');

describe('LikeButton', () => {
  const mockToggleLike = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({ isAuthenticated: true });
    (interactionService.toggleLike as any).mockResolvedValue({
      liked: true,
      likeCount: 101,
    });
  });

  it('renders with initial state', () => {
    render(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={100}
      />
    );
    
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('toggles like on click', async () => {
    render(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={100}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(interactionService.toggleLike).toHaveBeenCalledWith('story', 'test-id');
    });
  });

  it('shows login prompt when not authenticated', () => {
    (useAuthStore as any).mockReturnValue({ isAuthenticated: false });
    
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
    
    render(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={100}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'show-login-prompt' })
    );
  });

  it('handles rate limit error', async () => {
    (interactionService.toggleLike as any).mockRejectedValue({
      response: { status: 429 },
    });
    
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={100}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('操作太频繁，请稍后再试');
    });
  });

  it('calls onLikeChange callback', async () => {
    const onLikeChange = vi.fn();
    
    render(
      <LikeButton
        targetType="story"
        targetId="test-id"
        initialLiked={false}
        initialCount={100}
        onLikeChange={onLikeChange}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(onLikeChange).toHaveBeenCalledWith(true, 101);
    });
  });
});
