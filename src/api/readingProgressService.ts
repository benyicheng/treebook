import client from './client';
import type { ReadingProgress, ReadingStats } from './types';
export type { ReadingProgress, ReadingStats };

export const readingProgressService = {
  getProgress: async (chapterIds?: string[]): Promise<ReadingProgress[]> => {
    const params: Record<string, string> = {};
    if (chapterIds?.length) {
      params.chapterIds = chapterIds.join(',');
    }
    const { data } = await client.get<ReadingProgress[]>('/reading-progress', { params });
    return data;
  },

  getStats: async (): Promise<ReadingStats> => {
    const { data } = await client.get<ReadingStats>('/reading-progress/stats');
    return data;
  },

  upsertProgress: async (chapterId: string, payload: {
    status?: 'reading' | 'completed';
    progress?: number;
    currentPage?: number;
    source?: string;
    sourceId?: string;
  }): Promise<ReadingProgress> => {
    const { data } = await client.put<ReadingProgress>(`/reading-progress/${chapterId}`, payload);
    return data;
  },
};
