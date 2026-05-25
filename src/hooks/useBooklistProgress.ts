import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { booklistService } from '../api/storyService';

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

export function useBooklistProgress({ booklistId, totalItems }: UseBooklistProgressOptions) {
  const { user } = useAuthStore();
  const [progress, setProgress] = useState<BooklistProgress>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + booklistId);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed;
      }
    } catch {
      // corrupted data, start fresh
    }
    return {
      booklistId,
      currentItemIndex: -1,
      completedItemIds: [],
      updatedAt: Date.now(),
    };
  });

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadDone = useRef(false);

  // D4: On mount, load progress from backend and merge with local
  useEffect(() => {
    if (!user || !booklistId) {
      isInitialLoadDone.current = true;
      return;
    }

    const fetchBackendProgress = async () => {
      try {
        const backendProgress = await booklistService.getProgress(booklistId);
        if (backendProgress && backendProgress.updatedAt) {
          const backendTs = new Date(backendProgress.updatedAt).getTime();
          const localProgress = localStorage.getItem(STORAGE_PREFIX + booklistId);
          
          if (localProgress) {
            const local = JSON.parse(localProgress);
            // Use whichever version is newer
            if (backendTs > local.updatedAt) {
              const merged: BooklistProgress = {
                booklistId,
                currentItemIndex: backendProgress.currentItemIndex ?? -1,
                completedItemIds: backendProgress.completedItemIds ?? [],
                updatedAt: backendTs,
              };
              setProgress(merged);
            }
          } else {
            // No local progress, use backend
            setProgress({
              booklistId,
              currentItemIndex: backendProgress.currentItemIndex ?? -1,
              completedItemIds: backendProgress.completedItemIds ?? [],
              updatedAt: backendTs,
            });
          }
        }
      } catch {
        // Backend unavailable, use local-only
      } finally {
        isInitialLoadDone.current = true;
      }
    };

    fetchBackendProgress();
  }, [user, booklistId]);

  // Persist to localStorage whenever progress changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + booklistId, JSON.stringify(progress));
    } catch {
      // localStorage full or unavailable
    }
  }, [progress, booklistId]);

  // D4: Sync to backend with debounce (only when initial load is done)
  useEffect(() => {
    if (!user || !booklistId || !isInitialLoadDone.current) return;

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(() => {
      booklistService.updateProgress(booklistId, {
        currentItemIndex: progress.currentItemIndex,
        completedItemIds: progress.completedItemIds,
      }).catch(() => {
        // Silent fail - localStorage is the primary source
      });
    }, 1000);

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [progress, user, booklistId]);

  const markCompleted = useCallback((itemId: string) => {
    setProgress(prev => {
      if (prev.completedItemIds.includes(itemId)) return prev;
      return {
        ...prev,
        completedItemIds: [...prev.completedItemIds, itemId],
        updatedAt: Date.now(),
      };
    });
  }, []);

  const markUncompleted = useCallback((itemId: string) => {
    setProgress(prev => ({
      ...prev,
      completedItemIds: prev.completedItemIds.filter(id => id !== itemId),
      updatedAt: Date.now(),
    }));
  }, []);

  const setCurrentItem = useCallback((index: number) => {
    setProgress(prev => ({
      ...prev,
      currentItemIndex: index,
      updatedAt: Date.now(),
    }));
  }, []);

  const continueReading = useCallback((): number => {
    if (progress.currentItemIndex >= 0 && progress.currentItemIndex < totalItems) {
      return progress.currentItemIndex;
    }
    return 0;
  }, [progress.currentItemIndex, totalItems]);

  const resetProgress = useCallback(() => {
    setProgress({
      booklistId,
      currentItemIndex: -1,
      completedItemIds: [],
      updatedAt: Date.now(),
    });
  }, [booklistId]);

  const isCompleted = useCallback((itemId: string): boolean => {
    return progress.completedItemIds.includes(itemId);
  }, [progress.completedItemIds]);

  const completionPercentage = totalItems > 0
    ? Math.round((progress.completedItemIds.length / totalItems) * 100)
    : 0;

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
  };
}
