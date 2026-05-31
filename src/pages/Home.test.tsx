import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import { useAuthStore } from '../stores/useAuthStore';
import { useSiteConfigStore } from '../stores/useSiteConfigStore';
import '@testing-library/jest-dom';

vi.mock('../stores/useAuthStore');
vi.mock('../stores/useSiteConfigStore');

// Mock React Query hooks used by Home
vi.mock('../hooks/useStories', () => ({
  useStories: () => ({ data: [], isLoading: false }),
  useRecentReads: () => ({ data: [] }),
}));
vi.mock('../hooks/useBooklists', () => ({
  useHotBooklists: () => ({ data: [] }),
}));
vi.mock('../hooks/useBranches', () => ({
  useNewBranches: () => ({ data: [] }),
}));
vi.mock('../hooks/useDiscover', () => ({
  useHotReadingPaths: () => ({ data: [] }),
  useUniverseFeed: () => ({ data: [] }),
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
  });

  it('renders home page and calls fetchConfig on mount', () => {
    const fetchConfig = vi.fn();

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
      </MemoryRouter>,
    );

    expect(fetchConfig).toHaveBeenCalled();
    // Home should render the hero banner
    expect(screen.getByText('书树创作计划')).toBeInTheDocument();
  });

  it('navigates to banner link when clicking banner button', () => {
    (useSiteConfigStore as any).mockReturnValue({
      config: {
        siteName: '平行宇宙',
        siteSlogan: '',
        logoUrl: '',
        faviconUrl: '',
        announcement: '',
        announcementEnabled: 'false',
        bannerSlides: JSON.stringify([
          { title: 'T', description: 'D', buttonText: '探索全站', link: '/stories' },
        ]),
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
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '探索全站' }));
    expect(mockNavigate).toHaveBeenCalledWith('/stories');
  });
});
