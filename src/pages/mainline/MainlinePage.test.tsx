import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MainlinePage from './MainlinePage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useStoryStore } from '../../stores/useStoryStore';
import { useAuthStore } from '../../stores/useAuthStore';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Mock stores
vi.mock('../../stores/useStoryStore');
vi.mock('../../stores/useAuthStore');
vi.mock('../../api/storyService'); // Mock API services if needed

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'story-123' }),
  };
});

describe('MainlinePage', () => {
  const mockStory = {
    id: 'story-123',
    title: 'Test Story',
    authorId: 'author-123',
    chapters: [
      { id: 'chap-1', title: 'Chapter 1', orderIndex: 1, content: 'Some content' }
    ],
    branches: [],
    createdAt: new Date().toISOString(),
  };

  const mockUser = {
    id: 'author-123',
    username: 'Test Author',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useStoryStore as any).mockReturnValue({
      currentStory: mockStory,
      fetchStoryById: vi.fn(),
      isLoading: false,
    });
    (useAuthStore as any).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
    // Mock window.alert
    vi.stubGlobal('alert', vi.fn());
  });

  it('navigates to reading page when "Start Reading" is clicked', () => {
    render(
      <MemoryRouter>
        <MainlinePage />
      </MemoryRouter>
    );

    const startReadingBtn = screen.getByText('开始阅读');
    fireEvent.click(startReadingBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/read/chap-1');
  });

  it('shows alert when "Start Reading" is clicked but no chapters exist', () => {
    (useStoryStore as any).mockReturnValue({
      currentStory: { ...mockStory, chapters: [] },
      fetchStoryById: vi.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <MainlinePage />
      </MemoryRouter>
    );

    const startReadingBtn = screen.getByText('开始阅读');
    fireEvent.click(startReadingBtn);

    expect(window.alert).toHaveBeenCalledWith('该故事暂无章节，请先添加章节');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows "Manage Story" button for author', () => {
    render(
      <MemoryRouter>
        <MainlinePage />
      </MemoryRouter>
    );

    expect(screen.getByText('管理故事')).toBeInTheDocument();
  });

  it('hides "Manage Story" button for non-author', () => {
    (useAuthStore as any).mockReturnValue({
      user: { id: 'other-user' },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <MainlinePage />
      </MemoryRouter>
    );

    expect(screen.queryByText('管理故事')).not.toBeInTheDocument();
  });

  it('opens management modal when "Manage Story" is clicked', async () => {
    render(
      <MemoryRouter>
        <MainlinePage />
      </MemoryRouter>
    );

    const manageBtn = screen.getByText('管理故事');
    fireEvent.click(manageBtn);

    expect(screen.getByText('管理故事信息')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Story')).toBeInTheDocument();
  });

  it('switches to chapters tab when "View All Chapters" is clicked', () => {
    render(
      <MemoryRouter>
        <MainlinePage />
      </MemoryRouter>
    );

    // Initial state: Overview tab
    expect(screen.getByText('故事简介')).toBeInTheDocument();

    const viewAllBtn = screen.getByText('查看全部章节');
    fireEvent.click(viewAllBtn);

    // Should switch to Chapters tab
    expect(screen.getByText('全书目录')).toBeInTheDocument();
  });
});
