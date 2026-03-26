import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SpinoffDetailPage from './SpinoffDetailPage';
import { spinoffService } from '../../api/storyService';
import '@testing-library/jest-dom';

vi.mock('../../api/storyService', () => ({
  spinoffService: { getById: vi.fn() },
}));

describe('SpinoffDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders spinoff detail', async () => {
    (spinoffService.getById as any).mockResolvedValue({
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
    });

    render(
      <MemoryRouter initialEntries={['/spinoff/s1']}>
        <Routes>
          <Route path="/spinoff/:id" element={<SpinoffDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('番外标题')).toBeInTheDocument();
    });
    expect(screen.getByText('内容')).toBeInTheDocument();
    expect(screen.getByText(/作者：作者A/)).toBeInTheDocument();
  });

  it('shows fallback when author missing', async () => {
    (spinoffService.getById as any).mockResolvedValue({
      id: 's2',
      authorId: 'u1',
      originalStoryId: 'st1',
      title: '番外标题2',
      content: '内容2',
      isOfficial: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      originalStory: { title: '原著B' },
    });

    render(
      <MemoryRouter initialEntries={['/spinoff/s2']}>
        <Routes>
          <Route path="/spinoff/:id" element={<SpinoffDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('番外标题2')).toBeInTheDocument();
    });
    expect(screen.getByText(/作者：未知作者/)).toBeInTheDocument();
  });
});

