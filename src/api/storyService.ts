import client from './client';
import type { Story } from './types';
export type { Story, Character, Spinoff } from './types';

export const storyService = {
  getTags: async () => {
    const { data } = await client.get<any>('/stories/tags');
    return data;
  },

  getMy: async () => {
    const { data } = await client.get<any>('/stories/my');
    return data.items ?? data;
  },

  getById: async (id: string) => {
    if (!id || id === 'undefined' || id === 'null') throw new Error('storyService.getById: id is required');
    const { data } = await client.get<any>(`/stories/${id}`);
    return data;
  },

  update: async (id: string, storyData: Partial<Story>) => {
    if (!id) throw new Error('storyService.update: id is required');
    const { data } = await client.put<any>(`/stories/${id}`, storyData);
    return data;
  },

  getAll: async (params?: { tag?: string; isOfficial?: boolean; q?: string; page?: number; limit?: number }) => {
    const { data } = await client.get<any>('/stories', { params });
    return data.items ?? data;
  },

  create: async (storyData: Partial<Story>) => {
    const { data } = await client.post<any>('/stories', storyData);
    return data;
  },

  delete: async (id: string) => {
    await client.delete(`/stories/${id}`);
  },

  getMap: async (storyId: string) => {
    const { data } = await client.get<any>(`/stories/${storyId}/map`);
    return data;
  },

  getRecentReads: async () => {
    try {
      const { data } = await client.get<any>('/stories/recent');
      return data;
    } catch {
      return { data: [] };
    }
  },
};

export { characterService } from './characterService';
export { interactionService } from './interactionService';
export type {
  InteractionStats,
  LikeResponse,
  ShareResponse,
  RatingRequest,
  ShareConfig,
} from './interactionService';
export { branchService } from './branchService';
export type { Branch } from './branchService';
export { booklistService } from './booklistService';
export type { Booklist } from './booklistService';
export { chapterService } from './chapterService';
export type { Chapter, Comment } from './chapterService';
export { spinoffService } from './spinoffService';
export { savepointService } from './savepointService';
export { aiService } from './aiService';
