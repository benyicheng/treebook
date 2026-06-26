import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SpinoffDetailPage from './SpinoffDetailPage';
import '@testing-library/jest-dom';

const mockUseSpinoff = vi.fn();

vi.mock('../../hooks/useSpinoffs', () => ({
  useSpinoff: (...args: any[]) => mockUseSpinoff(...args),
}));

vi.mock('../../hooks/useCharacters', () => ({
  useCharacters: () => ({ data: [], isLoading: false }),
}));

vi.mock('../../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({ user: null, isAuthenticated: false })),
}));

vi.mock('../../components/notifications', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('../../components/Interaction/InteractionBar', () => ({
  InteractionBar: () => <div data-testid="interaction-bar" />,
}));

function renderWithProviders(ui: React.ReactElement, { initialEntries = ['/spinoff/s1'] } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/spinoff/:id" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SpinoffDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders spinoff detail', async () => {
    mockUseSpinoff.mockReturnValue({
      data: {
        id: 's1',
        authorId: 'u1',
        originalStoryId: 'st1',
        title: '番外标题',
        content: '内容',
        isOfficial: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: { username: '作者A' },
        originalStory: { title: '原著A' },
      },
      isLoading: false,
    });

    renderWithProviders(<SpinoffDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('番外标题')).toBeInTheDocument();
    });
    expect(screen.getByText('内容')).toBeInTheDocument();
    expect(screen.getByText(/作者：作者A/)).toBeInTheDocument();
  });

  it('shows fallback when author missing', async () => {
    mockUseSpinoff.mockReturnValue({
      data: {
        id: 's2',
        authorId: 'u1',
        originalStoryId: 'st1',
        title: '番外标题2',
        content: '内容2',
        isOfficial: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        originalStory: { title: '原著B' },
      },
      isLoading: false,
    });

    renderWithProviders(<SpinoffDetailPage />, { initialEntries: ['/spinoff/s2'] });

    await waitFor(() => {
      expect(screen.getByText('番外标题2')).toBeInTheDocument();
    });
    expect(screen.getByText(/作者：未知作者/)).toBeInTheDocument();
  });
});
