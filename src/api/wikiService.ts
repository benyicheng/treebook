import client from './client';
import type { WikiPage, WikiAlias, WikiLink } from './types';
export type { WikiPage, WikiAlias, WikiLink };

export interface WikiLookupResult {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  contentType: string;
  storyId: string | null;
  matchedTerm?: 'id' | 'title' | 'content' | 'alias';
  _count: { outgoingLinks: number; incomingLinks: number };
}

export interface WikiReferences {
  booklists: { id: string; title: string }[];
  readingPaths: { id: string; title: string }[];
}

export const wikiService = {
  list: async (params?: {
    storyId?: string;
    contentType?: string;
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) => {
    const { data } = await client.get<any>('/wiki-pages', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await client.get<any>(`/wiki-pages/${id}`);
    return data;
  },

  create: async (pageData: Partial<WikiPage>) => {
    const { data } = await client.post<any>('/wiki-pages', pageData);
    return data;
  },

  update: async (id: string, pageData: Partial<WikiPage>) => {
    const { data } = await client.put<any>(`/wiki-pages/${id}`, pageData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await client.delete(`/wiki-pages/${id}`);
    return data;
  },

  addAlias: async (pageId: string, aliasData: { alias: string; language?: string }) => {
    const { data } = await client.post<any>(`/wiki-pages/${pageId}/aliases`, aliasData);
    return data;
  },

  removeAlias: async (pageId: string, aliasId: string) => {
    const { data } = await client.delete(`/wiki-pages/${pageId}/aliases/${aliasId}`);
    return data;
  },

  createLink: async (pageId: string, linkData: { targetPageId: string; linkType: string }) => {
    const { data } = await client.post<any>(`/wiki-pages/${pageId}/links`, linkData);
    return data;
  },

  removeLink: async (pageId: string, linkId: string) => {
    const { data } = await client.delete(`/wiki-pages/${pageId}/links/${linkId}`);
    return data;
  },

  lookup: async (q: string, limit: number = 5): Promise<WikiLookupResult[]> => {
    const { data } = await client.get<WikiLookupResult[]>('/wiki-pages/lookup', {
      params: { q, limit },
    });
    return data;
  },

  getReferences: async (id: string): Promise<WikiReferences> => {
    const { data } = await client.get<WikiReferences>(`/wiki-pages/${id}/references`);
    return data;
  },

  getByBooklist: async (booklistId: string) => {
    const { data } = await client.get<any>(`/booklists/${booklistId}/wiki-pages`);
    return data;
  },
};
