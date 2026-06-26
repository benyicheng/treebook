import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddToBooklistModal from '../AddToBooklistModal';
import { booklistService } from '../../../api/storyService';

// Mock useAuthStore
const { mockUseAuthStore } = vi.hoisted(() => ({ mockUseAuthStore: vi.fn() }));
vi.mock('../../../stores/useAuthStore', () => ({
  useAuthStore: (...args: any[]) => mockUseAuthStore(...args),
}));

// Mock useToast
const { mockAddToast } = vi.hoisted(() => ({ mockAddToast: vi.fn() }));
vi.mock('../../notifications/Toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

// Mock Modal — 直接渲染 children
vi.mock('../Modal', () => ({
  default: ({ children, isOpen, title }: any) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <button onClick={isOpen ? undefined : undefined}>close</button>
        {title && <h3>{title}</h3>}
        {children}
      </div>
    ) : null,
}));

// Mock booklistService — same pattern as LikeButton/RatingComponent
vi.mock('../../../api/storyService', () => ({
  booklistService: {
    getMy: vi.fn(),
    addItem: vi.fn(),
  },
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('AddToBooklistModal', () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    chapterId: 'chap-1',
    chapterTitle: '第一章：开端',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unauthenticated state', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({ isAuthenticated: false });
    });

    it('shows login prompt when not authenticated', () => {
      renderWithRouter(<AddToBooklistModal {...baseProps} />);
      expect(screen.getByText('请先登录后再加入书单')).toBeInTheDocument();
      expect(screen.getByText('去登录')).toBeInTheDocument();
    });

    it('has login link pointing to /login', () => {
      renderWithRouter(<AddToBooklistModal {...baseProps} />);
      const loginLink = screen.getByText('去登录');
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('authenticated state', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({ isAuthenticated: true });
      (booklistService.getMy as any).mockResolvedValue([
        { id: 'list-1', title: '我的精选', description: '', isPublic: true },
      ]);
      (booklistService.addItem as any).mockResolvedValue({});
    });

    it('loads user booklists on open', async () => {
      (booklistService.getMy as any).mockResolvedValue([
        { id: 'list-1', title: '我的精选', description: '', isPublic: true },
        { id: 'list-2', title: '科幻合集', description: '', isPublic: false },
      ]);

      renderWithRouter(<AddToBooklistModal {...baseProps} />);

      await waitFor(() => {
        expect(booklistService.getMy).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('我的精选')).toBeInTheDocument();
        expect(screen.getByText('科幻合集')).toBeInTheDocument();
      });
    });

    it('shows chapter title when provided', () => {
      renderWithRouter(<AddToBooklistModal {...baseProps} />);
      expect(screen.getByText('第一章：开端')).toBeInTheDocument();
    });

    it('shows booklist select dropdown with options', async () => {
      renderWithRouter(<AddToBooklistModal {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByText('我的精选')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('shows note textarea', () => {
      renderWithRouter(<AddToBooklistModal {...baseProps} />);
      expect(
        screen.getByPlaceholderText(/为这一站写点推荐语/),
      ).toBeInTheDocument();
    });

    it('submits and shows success state', async () => {
      renderWithRouter(<AddToBooklistModal {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByText('确认加入')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('确认加入'));

      await waitFor(() => {
        expect(booklistService.addItem).toHaveBeenCalledWith('list-1', {
          chapterId: 'chap-1',
          notes: '',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('成功加入书单！')).toBeInTheDocument();
      });
    });

    it('calls onClose after successful add', async () => {
      renderWithRouter(<AddToBooklistModal {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByText('确认加入')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('确认加入'));

      await waitFor(() => {
        expect(screen.getByText('成功加入书单！')).toBeInTheDocument();
      });

      expect(booklistService.addItem).toHaveBeenCalledWith('list-1', {
        chapterId: 'chap-1',
        notes: '',
      });
    });

    it('shows toast when chapter already in booklist', async () => {
      (booklistService.addItem as any).mockRejectedValue({
        response: { data: { message: 'Chapter already in booklist' } },
      });

      renderWithRouter(<AddToBooklistModal {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByText('确认加入')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('确认加入'));

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith('info', '该章节已在书单中');
      });
    });

    it('shows error toast on generic failure', async () => {
      (booklistService.addItem as any).mockRejectedValue(new Error('Network error'));

      renderWithRouter(<AddToBooklistModal {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByText('确认加入')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('确认加入'));

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith('error', '添加失败，请重试');
      });
    });

    it('shows empty booklists state', async () => {
      (booklistService.getMy as any).mockResolvedValue([]);

      renderWithRouter(<AddToBooklistModal {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByText('你还没有创建过书单')).toBeInTheDocument();
      });
    });

    it('has link to create booklist when empty', async () => {
      (booklistService.getMy as any).mockResolvedValue([]);

      renderWithRouter(<AddToBooklistModal {...baseProps} />);

      await waitFor(() => {
        const link = screen.getByText('去创建一个新书单');
        expect(link).toHaveAttribute('href', '/booklist');
      });
    });

    it('shows loading spinner while fetching booklists', () => {
      (booklistService.getMy as any).mockReturnValue(new Promise(() => {}));

      renderWithRouter(<AddToBooklistModal {...baseProps} />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('calls onClose when cancel button clicked', () => {
      renderWithRouter(<AddToBooklistModal {...baseProps} />);
      fireEvent.click(screen.getByText('取消'));
      expect(baseProps.onClose).toHaveBeenCalled();
    });

    it('submit button is disabled when no booklist exists', async () => {
      (booklistService.getMy as any).mockResolvedValue([]);

      renderWithRouter(<AddToBooklistModal {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByText('你还没有创建过书单')).toBeInTheDocument();
      });

      const submitBtn = screen.getByText('确认加入');
      expect(submitBtn).toBeDisabled();
    });

    it('submit button shows loading text while submitting', async () => {
      (booklistService.getMy as any).mockResolvedValue([
        { id: 'list-1', title: '我的精选', description: '', isPublic: true },
      ]);
      (booklistService.addItem as any).mockReturnValue(new Promise(() => {}));

      renderWithRouter(<AddToBooklistModal {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByText('确认加入')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('确认加入'));

      await waitFor(() => {
        expect(screen.getByText('正在加入...')).toBeInTheDocument();
      });
    });
  });

  describe('closed state', () => {
    it('does not render when isOpen is false', () => {
      const { container } = renderWithRouter(
        <AddToBooklistModal {...baseProps} isOpen={false} />,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
