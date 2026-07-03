import client from './client';

export const aiService = {
  generateImage: async (prompt: string, options?: Record<string, unknown>) => {
    const { data } = await client.post<Record<string, unknown>>('/ai/image', { prompt, options });
    return data;
  },

  generateVideo: async (prompt: string, options?: Record<string, unknown>) => {
    const { data } = await client.post<Record<string, unknown>>('/ai/video', { prompt, options });
    return data;
  }
};
