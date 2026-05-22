import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import { useStoryStore } from '../stores/useStoryStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useSiteConfigStore } from '../stores/useSiteConfigStore';
import { storyService, branchService, booklistService } from '../api/storyService';
import '@testing-library/jest-dom';

vi.mock('../stores/useStoryStore');
vi.mock('../stores/useAuthStore');
vi.mock('../stores/useSiteConfigStore');
vi.mock('../api/storyService', () => ({
  storyService: { getRecentReads: vi.fn() },
  branchService: { getAll: vi.fn() },
  booklistService: { getAll: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useAuthStore as any).mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    (useSiteConfigStore as any).mockReturnValue({
      config: {
        siteName: '平行宇宙',
        siteSlogan: '',
        logoUrl: '',
        faviconUrl: '',
        announcement: '',
        announcementEnabled: 'false',
        bannerSlides: JSON.stringify([]),
        editorPicks: JSON.stringify([]),
        footerCopyright: '',
        primaryColor: '#2563eb',
        contactEmail: '',
        icp: '',
        socialWeixin: '',
        socialWeibo: '',
      },
      fetchConfig: vi.fn(),
    });

    (storyService.getRecentReads as any).mockResolvedValue([]);
    (branchService.getAll as any).mockResolvedValue([]);
    (booklistService.getAll as any).mockResolvedValue([]);
  });

  it('calls fetchStories and fetchConfig on mount', () => {
    const fetchStories = vi.fn();
    const fetchConfig = vi.fn();

    (useStoryStore as any).mockReturnValue({
      stories: [],
      fetchStories,
      isLoading: false,
    });

    (useSiteConfigStore as any).mockReturnValue({
      config: {
        siteName: '平行宇宙',
        siteSlogan: '',
        logoUrl: '',
        faviconUrl: '',
        announcement: '',
        announcementEnabled: 'false',
        bannerSlides: JSON.stringify([]),
        editorPicks: JSON.stringify([]),
        footerCopyright: '',
        primaryColor: '#2563eb',
        contactEmail: '',
        icp: '',
        socialWeixin: '',
        socialWeibo: '',
      },
      fetchConfig,
    });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(fetchStories).toHaveBeenCalled();
    expect(fetchConfig).toHaveBeenCalled();
  });

  it('navigates to banner link when clicking banner button', () => {
    (useStoryStore as any).mockReturnValue({
      stories: [],
      fetchStories: vi.fn(),
      isLoading: false,
    });

    (useSiteConfigStore as any).mockReturnValue({
      config: {
        siteName: '平行宇宙',
        siteSlogan: '',
        logoUrl: '',
        faviconUrl: '',
        announcement: '',
        announcementEnabled: 'false',
        bannerSlides: JSON.stringify([{ title: 'T', description: 'D', buttonText: '探索全站', link: '/stories' }]),
        editorPicks: JSON.stringify([]),
        footerCopyright: '',
        primaryColor: '#2563eb',
        contactEmail: '',
        icp: '',
        socialWeixin: '',
        socialWeibo: '',
      },
      fetchConfig: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '探索全站' }));
    expect(mockNavigate).toHaveBeenCalledWith('/stories');
  });
});
