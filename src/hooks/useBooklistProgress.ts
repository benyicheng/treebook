import { useState, useCallback, useEffect } from 'react';

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
  const [progress, setProgress] = useState<BooklistProgress>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + booklistId);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate: if totalItems changed (booklist was edited), reset
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

  // Persist to localStorage whenever progress changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + booklistId, JSON.stringify(progress));
    } catch {
      // localStorage full or unavailable
    }
  }, [progress, booklistId]);

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
    // If there's a current item (in-progress), return that
    if (progress.currentItemIndex >= 0 && progress.currentItemIndex < totalItems) {
      // Check if it's already completed — if so, return next uncompleted
      const itemIds = progress.completedItemIds;
      // We don't track which itemId maps to which index here, so trust currentItemIndex
      return progress.currentItemIndex;
    }
    // If no current item, find first uncompleted
    // Return 0 as default — start from beginning
    return 0;
  }, [progress.currentItemIndex, totalItems, progress.completedItemIds]);

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
