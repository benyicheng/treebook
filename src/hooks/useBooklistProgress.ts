import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/useAuthStore';
import { booklistService } from '../api/storyService';
import { queryKeys } from '../lib/queryKeys';

const STORAGE_PREFIX = 'booklist_progress_';

interface BooklistProgress {
  booklistId: string;
  currentItemIndex: number;
  completedItemIds: string[];
  updatedAt: number;
}

interface UseBooklistProgressOptions {
  booklistId: string;
  totalItems: number;
}

function loadLocal(booklistId: string): BooklistProgress | null {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + booklistId);
    if (stored) return JSON.parse(stored) as BooklistProgress;
  } catch { /* corrupted data */ }
  return null;
}

function saveLocal(progress: BooklistProgress) {
  try {
    localStorage.setItem(STORAGE_PREFIX + progress.booklistId, JSON.stringify(progress));
  } catch { /* localStorage full */ }
}

export function useBooklistProgress({ booklistId, totalItems }: UseBooklistProgressOptions) {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const localInitial = loadLocal(booklistId);

  const fallbackRef = useRef<BooklistProgress>({
    booklistId,
    currentItemIndex: -1,
    completedItemIds: [],
    updatedAt: Date.now(),
  });

  const { data: progress = localInitial ?? fallbackRef.current } = useQuery({
    queryKey: queryKeys.readingProgress.byBooklist(booklistId),
    queryFn: async () => {
      try {
        const backend = await booklistService.getProgress(booklistId);
        if (backend?.updatedAt) {
          const backendTs = new Date(backend.updatedAt).getTime();
          const local = loadLocal(booklistId);
          if (local && local.updatedAt >= backendTs) return local;
          const merged: BooklistProgress = {
            booklistId,
            currentItemIndex: backend.currentItemIndex ?? -1,
            completedItemIds: backend.completedItemIds ?? [],
            updatedAt: backendTs,
          };
          saveLocal(merged);
          return merged;
        }
      } catch { /* backend unavailable */ }
      return loadLocal(booklistId) ?? fallbackRef.current;
    },
    staleTime: 30_000,
    enabled: !!booklistId,
  });

  const syncMutation = useMutation({
    mutationFn: (p: BooklistProgress) =>
      booklistService.updateProgress(booklistId, {
        currentItemIndex: p.currentItemIndex,
        completedItemIds: p.completedItemIds,
      }),
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSync = useCallback((p: BooklistProgress) => {
    if (!user || !booklistId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      syncMutation.mutate(p);
    }, 1000);
  }, [user, booklistId, syncMutation]);

  const update = useCallback((partial: Partial<BooklistProgress>) => {
    qc.setQueryData(queryKeys.readingProgress.byBooklist(booklistId), (prev: BooklistProgress | undefined) => {
      const next: BooklistProgress = {
        ...(prev ?? fallbackRef.current),
        ...partial,
        updatedAt: Date.now(),
      };
      saveLocal(next);
      scheduleSync(next);
      return next;
    });
  }, [booklistId, qc, scheduleSync]);

  const markCompleted = useCallback((itemId: string) => {
    if (progress.completedItemIds.includes(itemId)) return;
    update({
      completedItemIds: [...progress.completedItemIds, itemId],
    });
  }, [progress.completedItemIds, update]);

  const markUncompleted = useCallback((itemId: string) => {
    update({
      completedItemIds: progress.completedItemIds.filter(id => id !== itemId),
    });
  }, [progress.completedItemIds, update]);

  const setCurrentItem = useCallback((index: number) => {
    update({ currentItemIndex: index });
  }, [update]);

  const continueReading = useCallback((): number => {
    if (progress.currentItemIndex >= 0 && progress.currentItemIndex < totalItems) {
      return progress.currentItemIndex;
    }
    return 0;
  }, [progress.currentItemIndex, totalItems]);

  const resetProgress = useCallback(() => {
    update({
      currentItemIndex: -1,
      completedItemIds: [],
    });
  }, [update]);

  const isCompleted = useCallback((itemId: string): boolean => {
    return progress.completedItemIds.includes(itemId);
  }, [progress.completedItemIds]);

  const completionPercentage = totalItems > 0
    ? Math.round((progress.completedItemIds.length / totalItems) * 100)
    : 0;

  const scrollPositionRef = useRef<number>(0);

  const saveProgressOnUnload = useCallback(() => {
    saveLocal(progress);
    if (user && booklistId) {
      booklistService.updateProgress(booklistId, {
        currentItemIndex: progress.currentItemIndex,
        completedItemIds: progress.completedItemIds,
      }).catch(() => {});
    }
  }, [progress, booklistId, user]);

  const setScrollPosition = useCallback((pos: number) => {
    scrollPositionRef.current = pos;
  }, []);

  const getScrollPosition = useCallback((): number => {
    return scrollPositionRef.current;
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => { saveProgressOnUnload(); };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveProgressOnUnload();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveProgressOnUnload]);

  // Persist to localStorage on every progress change
  useEffect(() => {
    saveLocal(progress);
  }, [progress]);

  return {
    progress,
    markCompleted,
    markUncompleted,
    setCurrentItem,
    continueReading,
    resetProgress,
    isCompleted,
    completionPercentage,
    currentItemIndex: progress.currentItemIndex,
    completedCount: progress.completedItemIds.length,
    totalItems,
    saveProgressOnUnload,
    scrollPositionRef,
    setScrollPosition,
    getScrollPosition,
  };
}
