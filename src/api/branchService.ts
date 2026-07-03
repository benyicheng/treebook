import type { Branch } from './types';
import client from './client';
export type { Branch };

export const branchService = {
  getAll: async (params?: { q?: string; page?: number; limit?: number }) => {
    const { data } = await client.get<any>('/branches', { params });
    return data.items ?? data;
  },

  create: async (branchData: Partial<Branch>) => {
    const { data } = await client.post<any>('/branches', branchData);
    return data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<any>(`/branches/${id}`);
    return data;
  },

  getMy: async () => {
    const { data } = await client.get<any>('/branches/my');
    return data.items ?? data;
  },

  update: async (id: string, branchData: Partial<Branch>) => {
    const { data } = await client.put<any>(`/branches/${id}`, branchData);
    return data;
  },

  delete: async (id: string) => {
    await client.delete(`/branches/${id}`);
  },

  certify: async (id: string, isCertified: boolean) => {
    const { data } = await client.post<any>(`/branches/${id}/certify`, { isCertified });
    return data;
  },

  createSubBranch: async (parentBranchId: string, subBranchData: {
    parentChapterId: string;
    title: string;
    description?: string;
    branchType?: string;
  }) => {
    const { data } = await client.post<any>(`/branches/${parentBranchId}/sub-branches`, subBranchData);
    return data;
  },
};
