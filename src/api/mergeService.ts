import client from './client';

export interface MergeRequest {
  id: string;
  type: 'branch_merge' | 'spinoff_official';
  branchId?: string;
  spinoffId?: string;
  storyId: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  reviewComment?: string;
  createdAt: string;
  branch?: {
    title: string;
    author: {
      username: string;
    };
  };
  spinoff?: {
    title: string;
    author: {
      username: string;
    };
  };
}

export const mergeService = {
  getRequests: async (storyId: string): Promise<MergeRequest[]> => {
    const { data } = await client.get(`/merges/${storyId}`);
    return data;
  },

  createRequest: async (data: { 
    branchId?: string; 
    spinoffId?: string; 
    storyId: string; 
    message: string;
    type?: 'branch_merge' | 'spinoff_official'
  }) => {
    const { data: responseData } = await client.post('/merges/create', data);
    return responseData;
  },

  handleRequest: async (requestId: string, status: 'approved' | 'rejected', reviewComment?: string) => {
    const { data } = await client.post(`/merges/handle/${requestId}`, { status, reviewComment });
    return data;
  }
};
