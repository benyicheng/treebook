import client from './client';
import type { Chapter, ChapterExtended, Comment } from './types';
export type { Chapter, ChapterExtended, Comment };

export const chapterService = {
  search: async (query: string) => {
    const { data } = await client.get<any>('/chapters/search', {
      params: { q: query }
    });
    return data;
  },

  getById: async (id: string, referralId?: string) => {
    const { data } = await client.get<any>(`/chapters/${id}`, {
      params: { referralId }
    });
    return data;
  },

  getByStory: async (storyId: string, branchId?: string, includeBranches?: boolean) => {
    const params: Record<string, string> = {};
    if (branchId) params.branchId = branchId;
    if (includeBranches) params.includeBranches = 'true';
    const { data } = await client.get<any>(`/chapters/stories/${storyId}`, { params });
    return data;
  },

  create: async (chapterData: Partial<Chapter>) => {
    const { data } = await client.post<any>('/chapters', chapterData);
    return data;
  },

  update: async (id: string, chapterData: Partial<Chapter>) => {
    const { data } = await client.put<any>(`/chapters/${id}`, chapterData);
    return data;
  },

  getComments: async (chapterId: string) => {
    const { data } = await client.get<any>(`/chapters/${chapterId}/comments`);
    return data;
  },

  createComment: async (chapterId: string, content: string) => {
    const { data } = await client.post<any>(`/chapters/${chapterId}/comments`, { content });
    return data;
  },

};
