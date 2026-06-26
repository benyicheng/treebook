import client from './client';

export const savepointService = {
  create: async (savepointData: { storyId: string, branchId?: string, chapterId: string, name?: string }) => {
    const { data } = await client.post<any>('/savepoints', savepointData);
    return data;
  },

  getAll: async (params?: { storyId?: string }) => {
    const { data } = await client.get<any>('/savepoints', { params });
    return data;
  },

  delete: async (id: string) => {
    const { data } = await client.delete(`/savepoints/${id}`);
    return data;
  }
};
