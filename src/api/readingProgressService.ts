import client from './client';

export interface ReadingProgress {
  chapterId: string;
  status: 'reading' | 'completed';
  progress: number;
  currentPage: number | null;
  source: string | null;
  sourceId: string | null;
  updatedAt: string;
}

export interface ReadingStats {
  total: number;
  completed: number;
  inProgress: number;
}

export const readingProgressService = {
  /** 批量获取阅读进度 */
  getProgress: async (chapterIds?: string[]): Promise<ReadingProgress[]> => {
    const params: any = {};
    if (chapterIds?.length) {
      params.chapterIds = chapterIds.join(',');
    }
    const { data } = await client.get<ReadingProgress[]>('/reading-progress', { params });
    return data;
  },

  /** 获取阅读统计 */
  getStats: async (): Promise<ReadingStats> => {
    const { data } = await client.get<ReadingStats>('/reading-progress/stats');
    return data;
  },

  /** 更新（upsert）阅读进度 */
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
