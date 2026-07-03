import client from './client';
import type { Spinoff } from './types';
export type { Spinoff };

export const spinoffService = {
  getAll: async (params?: { originalStoryId?: string; isOfficial?: boolean; q?: string; page?: number; limit?: number }) => {
    const { data } = await client.get<any>('/spinoffs', { params });
    return data.items ?? data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<any>(`/spinoffs/${id}`);
    return data;
  },

  getMy: async () => {
    const { data } = await client.get<any>('/spinoffs/my');
    return data.items ?? data;
  },

  create: async (spinoffData: Partial<Spinoff>) => {
    const { data } = await client.post<any>('/spinoffs', spinoffData);
    return data;
  },

  update: async (id: string, spinoffData: Partial<Spinoff>) => {
    const { data } = await client.put<any>(`/spinoffs/${id}`, spinoffData);
    return data;
  },

  delete: async (id: string) => {
    await client.delete(`/spinoffs/${id}`);
  },
};
