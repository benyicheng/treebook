import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wikiService, WikiPage, WikiReferences } from '../api/wikiService';
import { queryKeys } from '../lib/queryKeys';

export function useWikiPages(params?: {
  storyId?: string;
  contentType?: string;
  search?: string;
  status?: string;
  page?: string;
  limit?: string;
}) {
  return useQuery({
    queryKey: queryKeys.wiki.list(params as Record<string, unknown> | undefined),
    queryFn: () => wikiService.list(params),
  });
}

export function useWikiPage(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.wiki.detail(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('useWikiPage: id is required');
      return wikiService.getById(id);
    },
    enabled: !!id,
  });
}

export function useCreateWikiPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WikiPage>) => wikiService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wiki.lists() });
    },
  });
}

export function useUpdateWikiPage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WikiPage>) => wikiService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wiki.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wiki.detail(id) });
    },
  });
}

export function useDeleteWikiPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => wikiService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wiki.lists() });
    },
  });
}

export function useAddWikiAlias(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { alias: string; language?: string }) =>
      wikiService.addAlias(pageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wiki.detail(pageId) });
    },
  });
}

export function useRemoveWikiAlias(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (aliasId: string) => wikiService.removeAlias(pageId, aliasId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wiki.detail(pageId) });
    },
  });
}

export function useCreateWikiLink(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { targetPageId: string; linkType: string }) =>
      wikiService.createLink(pageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wiki.detail(pageId) });
    },
  });
}

export function useRemoveWikiLink(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => wikiService.removeLink(pageId, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wiki.detail(pageId) });
    },
  });
}

export function useWikiReferences(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.wiki.references(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('useWikiReferences: id is required');
      return wikiService.getReferences(id);
    },
    enabled: !!id,
  });
}
