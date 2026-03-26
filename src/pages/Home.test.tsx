import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import { useStoryStore } from '../stores/useStoryStore';
import { useAuthStore } from '../stores/useAuthStore';
import { storyService } from '../api/storyService';
import '@testing-library/jest-dom';

vi.mock('../stores/useStoryStore');
vi.mock('../stores/useAuthStore');
vi.mock('../api/storyService', () => ({
  storyService: { getTags: vi.fn(), getRecentReads: vi.fn(), getById: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Home stats cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useStoryStore as any).mockReturnValue({
      stories: [],
      fetchStories: vi.fn(),
      isLoading: false,
    });
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
    });
    (storyService.getTags as any).mockResolvedValue([]);
    (storyService.getRecentReads as any).mockResolvedValue([]);
    (storyService.getById as any).mockResolvedValue({ chapters: [], branches: [] });
  });

  it('navigates to /spinoff when clicking 番外篇', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '番外篇' }));
    expect(mockNavigate).toHaveBeenCalledWith('/spinoff');
  });

  it('switches filter to 全部 when clicking 活跃主线', () => {
    const fetchStories = vi.fn();
    (useStoryStore as any).mockReturnValue({
      stories: [],
      fetchStories,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('社区分支'));
    expect(screen.getByText('社区分支')).toHaveClass('bg-white');

    fireEvent.click(screen.getByRole('button', { name: '活跃主线' }));
    expect(screen.getByText('全部')).toHaveClass('bg-white');

    expect(fetchStories).toHaveBeenCalledWith({
      tag: undefined,
      isOfficial: false,
    });
    expect(fetchStories).toHaveBeenCalledWith({
      tag: undefined,
      isOfficial: undefined,
    });
  });

  it('switches filter to 社区分支 when clicking 分支宇宙', () => {
    const fetchStories = vi.fn();
    (useStoryStore as any).mockReturnValue({
      stories: [],
      fetchStories,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '分支宇宙' }));
    expect(screen.getByText('社区分支')).toHaveClass('bg-white');

    expect(fetchStories).toHaveBeenCalledWith({
      tag: undefined,
      isOfficial: false,
    });
  });

  it('navigates to read page when clicking 探索故事 and first chapter exists', async () => {
    (useStoryStore as any).mockReturnValue({
      stories: [{ id: 'story-1', title: 'S', description: '' }],
      fetchStories: vi.fn(),
      isLoading: false,
    });
    (storyService.getById as any).mockResolvedValue({
      id: 'story-1',
      chapters: [{ id: 'chap-1', title: 'C1', orderIndex: 1, content: 'x' }],
      branches: [],
    });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '探索故事' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/read/chap-1');
    });
  });
});
