import { useState, useEffect, useCallback } from 'react';
import { discoverService, UniverseFeedItem } from '../../../api/discoverService';

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
  const [tab, setTab] = useState<DiscoverTab>(initialTab);
  const [items, setItems] = useState<UniverseFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await discoverService.getUniverseFeed(tab, page, 20);
      setItems(result.items);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError(err?.message || '加载失败');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const goToPage = useCallback(
    (p: number) => {
      setPage(Math.max(1, Math.min(p, totalPages)));
    },
    [totalPages],
  );

  const refresh = useCallback(() => {
    fetch();
  }, [fetch]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [tab]);

  return { items, loading, error, tab, setTab, page, totalPages, goToPage, refresh };
}
