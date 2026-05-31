import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MainlinePage from './MainlinePage';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock useStoryDetails hook — controls all data/logic for MainlinePage
const mockUseStoryDetails = vi.fn();

vi.mock('./hooks/useStoryDetails', () => ({
  useStoryDetails: () => mockUseStoryDetails(),
}));

// Mock toast
const mockAddToast = vi.fn();
vi.mock('../../components/Toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('../../components/FollowButton', () => ({
  default: () => null,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'story-123' }),
    useSearchParams: () => [new URLSearchParams()],
  };
});

// Default story data
const defaultStory = {
  id: 'story-123',
  title: 'Test Story',
  authorId: 'author-123',
  description: 'Test description',
  coverImage: '',
  isOfficial: true,
  genres: [],
  chapters: [
    { id: 'chap-1', title: 'Chapter 1', orderIndex: 1, content: 'Some content', branchId: null },
  ],
  branches: [],
  spinoffs: [],
  characters: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const defaultHookReturn = {
  id: 'story-123',
  currentStory: defaultStory,
  isLoading: false,
  user: { id: 'author-123', username: 'Test Author' },
  isAuthenticated: true,
  isAuthor: true,
  activeTab: 'overview' as const,
  setActiveTab: vi.fn(),
  editingChapterId: null as string | null,
  setEditingChapterId: vi.fn(),
  isSubmitting: false,
  isSettling: false,
  isBranchModalOpen: false,
  setIsBranchModalOpen: vi.fn(),
  isChapterModalOpen: false,
  setIsChapterModalOpen: vi.fn(),
  isManageModalOpen: false,
  setIsManageModalOpen: vi.fn(),
  isMergeModalOpen: false,
  setIsMergeModalOpen: vi.fn(),
  booklistTargetChapter: null as { id: string; title: string } | null,
  setBooklistTargetChapter: vi.fn(),
  newBranchData: { title: '', description: '', parentChapterId: 'chap-1' },
  setNewBranchData: vi.fn(),
  newChapterData: { title: '', orderIndex: 2 },
  setNewChapterData: vi.fn(),
  editStoryData: { title: 'Test Story', description: '', coverImage: '' },
  setEditStoryData: vi.fn(),
  savepoints: [],
  readingHistory: [],
  handleSaveChapter: vi.fn(),
  handleCreateBranch: vi.fn(),
  handleCreateChapter: vi.fn(),
  handleUpdateStory: vi.fn(),
  handleSettleRevenue: vi.fn(),
};

describe('MainlinePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStoryDetails.mockReturnValue(defaultHookReturn);
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('navigates to reading page when "Start Reading" is clicked', () => {
    render(
      <MemoryRouter>
        <MainlinePage />
      </MemoryRouter>,
    );

    const startReadingBtn = screen.getByText('开始阅读');
    fireEvent.click(startReadingBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/read/chap-1');
  });

  it('shows toast when "Start Reading" is clicked but no chapters exist', () => {
    mockUseStoryDetails.mockReturnValue({
      ...defaultHookReturn,
      currentStory: { ...defaultStory, chapters: [] },
    });

    render(
      <MemoryRouter>
        <MainlinePage />
      </MemoryRouter>,
    );

    const startReadingBtn = screen.getByText('开始阅读');
    fireEvent.click(startReadingBtn);

    expect(mockAddToast).toHaveBeenCalledWith('warning', '该故事暂无章节，请先添加章节');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows "Manage Story" button for author', () => {
    render(
      <MemoryRouter>
        <MainlinePage />
      </MemoryRouter>,
    );

    expect(screen.getByText('管理故事')).toBeInTheDocument();
  });

  it('hides "Manage Story" button for non-author', () => {
    mockUseStoryDetails.mockReturnValue({
      ...defaultHookReturn,
      isAuthor: false,
      user: { id: 'other-user', username: 'Other' },
    });

    render(
      <MemoryRouter>
        <MainlinePage />
      </MemoryRouter>,
    );

    expect(screen.queryByText('管理故事')).not.toBeInTheDocument();
  });

  it('opens management modal when "Manage Story" is clicked', () => {
    const setIsManageModalOpen = vi.fn();
    mockUseStoryDetails.mockReturnValue({
      ...defaultHookReturn,
      setIsManageModalOpen,
    });

    render(
      <MemoryRouter>
        <MainlinePage />
      </MemoryRouter>,
    );

    const manageBtn = screen.getByText('管理故事');
    fireEvent.click(manageBtn);

    expect(setIsManageModalOpen).toHaveBeenCalledWith(true);
  });

  it('opens branch creation modal when clicking "开启新分支"', () => {
    const setIsBranchModalOpen = vi.fn();
    mockUseStoryDetails.mockReturnValue({
      ...defaultHookReturn,
      setIsBranchModalOpen,
    });

    render(
      <MemoryRouter>
        <MainlinePage />
      </MemoryRouter>,
    );

    const branchBtn = screen.getByText('开启新分支');
    fireEvent.click(branchBtn);

    expect(setIsBranchModalOpen).toHaveBeenCalledWith(true);
  });

  it('switches to chapters tab when "View All Chapters" is clicked', () => {
    const setActiveTab = vi.fn();
    mockUseStoryDetails.mockReturnValue({
      ...defaultHookReturn,
      setActiveTab,
    });

    render(
      <MemoryRouter>
        <MainlinePage />
      </MemoryRouter>,
    );

    expect(screen.getByText('故事简介')).toBeInTheDocument();

    const viewAllBtn = screen.getByText('查看全部');
    fireEvent.click(viewAllBtn);

    expect(setActiveTab).toHaveBeenCalledWith('chapters');
  });
});
