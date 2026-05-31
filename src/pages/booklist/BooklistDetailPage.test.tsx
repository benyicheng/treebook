import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BooklistDetailPage from './BooklistDetailPage';
import '@testing-library/jest-dom';

// Mock window.matchMedia for ReadingDrawer theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const mockUseBooklist = vi.fn();

vi.mock('../../hooks/useBooklists', () => ({
  useBooklist: (...args: any[]) => mockUseBooklist(...args),
  useUpdateBooklist: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteBooklist: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateBooklistItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveFromBooklist: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddToBooklist: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../hooks/useBooklistProgress', () => ({
  useBooklistProgress: () => ({
    progress: {},
    loading: false,
    activeChapterId: null,
    startReading: vi.fn(),
    markChapterRead: vi.fn(),
    continueReading: () => 0,
    isCompleted: () => false,
  }),
}));

vi.mock('../../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({ user: null, isAuthenticated: false })),
}));

vi.mock('../../components/Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

function renderWithProviders(ui: React.ReactElement, { initialEntries = ['/booklist/list-1'] } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/booklist/:id" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BooklistDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders booklist detail without crashing', async () => {
    mockUseBooklist.mockReturnValue({
      data: {
        id: 'list-1',
        creatorId: 'user-1',
        title: '测试书单',
        description: '测试简介',
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creator: { username: '策划人A' },
        items: [
          {
            id: 'item-1',
            chapterId: 'chap-1',
            orderIndex: 1,
            notes: '推荐理由',
            chapter: {
              id: 'chap-1',
              chapterId: 'chap-1',
              title: '第一章',
              content: 'abc',
              branchId: null,
              story: {
                id: 'story-1',
                title: '主线A',
                author: { username: '作者A' },
              },
            },
          },
        ],
      },
      isLoading: false,
    });

    renderWithProviders(<BooklistDetailPage />, { initialEntries: ['/booklist/list-1'] });

    await waitFor(() => {
      expect(screen.getByText('测试书单')).toBeInTheDocument();
    });

    expect(screen.getByText('旅程终点')).toBeInTheDocument();
  });

  it('renders fallback author when story.author is missing', async () => {
    mockUseBooklist.mockReturnValue({
      data: {
        id: 'list-2',
        creatorId: 'user-1',
        title: '测试书单2',
        description: null,
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creator: { username: '策划人B' },
        items: [
          {
            id: 'item-2',
            chapterId: 'chap-2',
            orderIndex: 1,
            notes: null,
            chapter: {
              id: 'chap-2',
              title: '第二章',
              content: 'abcd',
              branchId: null,
              story: {
                id: 'story-2',
                title: '主线B',
              },
            },
          },
        ],
      },
      isLoading: false,
    });

    renderWithProviders(<BooklistDetailPage />, { initialEntries: ['/booklist/list-2'] });

    await waitFor(() => {
      expect(screen.getByText('测试书单2')).toBeInTheDocument();
    });

    expect(screen.getByText('未知作者')).toBeInTheDocument();
  });
});
