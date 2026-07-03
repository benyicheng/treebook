import { useCallback, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { discoverService, UniverseFeedItem } from '../api/discoverService';
import { queryKeys } from '../lib/queryKeys';

export type DiscoverTab = 'hot' | 'latest';

interface UseUniverseFeedReturn {
  items: UniverseFeedItem[];
  loading: boolean;
  error: string | null;
  tab: DiscoverTab;
  setTab: (tab: DiscoverTab) => void;
  page: number;
  totalPages: number;
  goToPage: (page: number) => void;
  refresh: () => void;
}

export function useUniverseFeed(initialTab: DiscoverTab = 'hot'): UseUniverseFeedReturn {
  const [tab, setTabState] = useState<DiscoverTab>(initialTab);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...queryKeys.discover.feed(), { tab, page }] as const,
    queryFn: () => discoverService.getUniverseFeed(tab, page, 20),
    placeholderData: keepPreviousData,
  });

  const setTab = useCallback((t: DiscoverTab) => {
    setTabState(t);
    setPage(1);
  }, []);

  const goToPage = useCallback(
    (p: number) => {
      setPage(prev => Math.max(1, Math.min(p, data?.totalPages ?? prev)));
    },
    [data?.totalPages],
  );

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    items: data?.items ?? [],
    loading: isLoading,
    error: error == null
      ? null
      : error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : typeof error === 'object'
            ? (error as Record<string, unknown>).message || JSON.stringify(error)
            : String(error),
    tab,
    setTab,
    page,
    totalPages: data?.totalPages ?? 1,
    goToPage,
    refresh,
  };
}
