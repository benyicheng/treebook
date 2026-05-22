import client from './client';

export type UploadedMedia = {
  id: string;
  kind: 'image' | 'audio' | 'video';
  mimeType: string;
  sizeBytes: number;
  url: string;
  status: string;
  resolvedUrl: string;
};

const resolveApiUrl = (path: string) => {
  const base = String((client.defaults as any)?.baseURL || '');
  if (!base) return path;
  if (!path.startsWith('/')) return path;
  const origin = base.replace(/\/api\/?$/, '');
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
    const data = res.data as any;
    return {
      ...data,
      resolvedUrl: resolveApiUrl(data.url),
    } as UploadedMedia;
  },
};

