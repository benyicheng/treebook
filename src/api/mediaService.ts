import client from './client';
import type { UploadedMedia } from './types';
export type { UploadedMedia };

const resolveApiUrl = (path: string) => {
  const baseURL = client.defaults.baseURL;
  if (!baseURL || typeof baseURL !== 'string') return path;
  if (!path.startsWith('/')) return path;
  const origin = baseURL.replace(/\/api\/?$/, '');
  return origin + path;
};

export const mediaService = {
  async upload(file: File, purpose?: string) {
    const fd = new FormData();
    fd.append('file', file);
    if (purpose) fd.append('purpose', purpose);
    const res = await client.post('/media/uploads', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = res.data as UploadedMedia;
    return {
      ...data,
      resolvedUrl: resolveApiUrl(data.url),
    };
  },
};
