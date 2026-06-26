import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StoryEventsTab from '../StoryEventsTab';
import { storyEventService } from '../../../../api/storyEventService';
import '@testing-library/jest-dom';

// Mock storyEventService
vi.mock('../../../../api/storyEventService', () => ({
  storyEventService: {
    getByStory: vi.fn(),
    create: vi.fn(),
  },
}));

// Mock toast
const mockAddToast = vi.fn();
vi.mock('../../../../components/notifications', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));
vi.mock('../../../../components/notifications/Toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

// Mock EventDetailDrawer (portal-based, skip rendering)
vi.mock('../../../booklist/components/EventDetailDrawer', () => ({
  default: () => null,
}));

// Mock CreateEventModal
vi.mock('../../../booklist/components/CreateEventModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="create-modal" /> : null),
}));

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

import { useQuery } from '@tanstack/react-query';

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

function renderComponent(props?: Partial<React.ComponentProps<typeof StoryEventsTab>>) {
  return render(
    <MemoryRouter>
      <StoryEventsTab
        storyId="story-1"
        storyAuthorId="author-1"
        isAuthor={true}
        storyTitle="测试故事"
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('StoryEventsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddToast.mockClear();
  });

  it('renders empty state when no events', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });
    renderComponent();
    expect(screen.getByText('暂无大事件')).toBeInTheDocument();
  });

  it('renders create button for author', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });
    renderComponent({ isAuthor: true });
    // 空状态下有顶部按钮 + EmptyState action 按钮，至少 1 个
    expect(screen.getAllByText('创建大事件').length).toBeGreaterThan(0);
  });

  it('does not render create button for non-author', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });
    renderComponent({ isAuthor: false });
    // 非作者不显示任何"创建大事件"按钮
    expect(screen.queryAllByText('创建大事件')).toHaveLength(0);
  });

  it('renders event timeline with events', () => {
    mockUseQuery.mockReturnValue({
      data: [
        { id: 'evt-1', title: '开端', type: 'main_arc', importance: 3, color: '#f43f5e', description: '故事开始', nodes: [], sortOrder: 0 },
      ],
      isLoading: false,
    });
    renderComponent();
    expect(screen.getByText('开端')).toBeInTheDocument();
    expect(screen.getByText('主线')).toBeInTheDocument();
  });

  it('shows loading spinner', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: true });
    renderComponent();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('opens create modal when clicking create button', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });
    renderComponent();
    // 空状态下有顶部按钮 + EmptyState action 按钮两个"创建大事件"，点击第一个
    const buttons = screen.getAllByText('创建大事件');
    fireEvent.click(buttons[0]);
    expect(screen.getByTestId('create-modal')).toBeInTheDocument();
  });
});
