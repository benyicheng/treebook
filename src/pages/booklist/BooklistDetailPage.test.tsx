import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BooklistDetailPage from './BooklistDetailPage';
import { booklistService } from '../../api/storyService';
import '@testing-library/jest-dom';

vi.mock('../../api/storyService', () => ({
  booklistService: { getById: vi.fn() },
}));

describe('BooklistDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders booklist detail without crashing', async () => {
    (booklistService.getById as any).mockResolvedValue({
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
    });

    render(
      <MemoryRouter initialEntries={['/booklist/list-1']}>
        <Routes>
          <Route path="/booklist/:id" element={<BooklistDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('测试书单')).toBeInTheDocument();
    });

    expect(screen.getByText('旅程终点')).toBeInTheDocument();
  });

  it('renders fallback author when story.author is missing', async () => {
    (booklistService.getById as any).mockResolvedValue({
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
    });

    render(
      <MemoryRouter initialEntries={['/booklist/list-2']}>
        <Routes>
          <Route path="/booklist/:id" element={<BooklistDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('测试书单2')).toBeInTheDocument();
    });

    expect(screen.getByText('未知作者')).toBeInTheDocument();
  });
});
