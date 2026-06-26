import client from './client';

export const aiService = {
  generateImage: async (prompt: string, options?: any) => {
    const { data } = await client.post<any>('/ai/image', { prompt, options });
    return data;
  },

  generateVideo: async (prompt: string, options?: any) => {
    const { data } = await client.post<any>('/ai/video', { prompt, options });
    return data;
  }
};
