import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { booklistService } from '../api/storyService';
import { queryKeys } from '../lib/queryKeys';

export function useBooklists(params?: {
  type?: string;
  tag?: string;
  q?: string;
  sortBy?: string;
  limit?: number;
  page?: number;
  isPublic?: boolean;
  creatorId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.booklists.list(params as Record<string, unknown>),
    queryFn: () => booklistService.getAll(params),
    staleTime: 30_000,
  });
}

export function useBooklist(id: string) {
  return useQuery({
    queryKey: queryKeys.booklists.detail(id),
    queryFn: () => booklistService.getById(id),
    enabled: !!id,
  });
}

export function useMyBooklists() {
  return useQuery({
    queryKey: queryKeys.booklists.my,
    queryFn: () => booklistService.getMy(),
  });
}

export function useHotBooklists() {
  return useQuery({
    queryKey: ['booklists', 'hot'],
    queryFn: () => booklistService.getAll({ sortBy: 'hot', limit: 5 }),
    staleTime: 60_000,
  });
}

export function useCreateBooklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: booklistService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.booklists.all });
    },
  });
}

export function useAddToBooklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      booklistId,
      data,
    }: {
      booklistId: string;
      data: { chapterId?: string; targetType?: string; targetId?: string; notes?: string; section?: string };
    }) => booklistService.addItem(booklistId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.booklists.detail(vars.booklistId) });
      qc.invalidateQueries({ queryKey: queryKeys.booklists.all });
    },
  });
}

export function useBatchAddItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      booklistId,
      payload,
    }: {
      booklistId: string;
      payload: Parameters<typeof booklistService.batchAddItems>[1];
    }) => booklistService.batchAddItems(booklistId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.booklists.detail(vars.booklistId) });
    },
  });
}

export function useReorderItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      booklistId,
      items,
    }: {
      booklistId: string;
      items: { id: string; orderIndex: number }[];
    }) => booklistService.reorderItems(booklistId, items),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.booklists.detail(vars.booklistId) });
    },
  });
}

export function useRemoveFromBooklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      booklistId,
      itemId,
    }: {
      booklistId: string;
      itemId: string;
    }) => booklistService.removeItem(booklistId, itemId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.booklists.detail(vars.booklistId) });
      qc.invalidateQueries({ queryKey: queryKeys.booklists.all });
    },
  });
}

export function useUpdateBooklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof booklistService.update>[1];
    }) => booklistService.update(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.booklists.detail(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.booklists.list({}) });
    },
  });
}

export function useDeleteBooklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => booklistService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.booklists.all });
    },
  });
}

export function useUpdateBooklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      booklistId,
      itemId,
      data,
    }: {
      booklistId: string;
      itemId: string;
      data: { notes?: string; orderIndex?: number };
    }) => booklistService.updateItem(booklistId, itemId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.booklists.detail(vars.booklistId) });
    },
  });
}

// ── Graph: Relations ────────────────────────────────

export function useBooklistGraph(booklistId: string) {
  return useQuery({
    queryKey: [...queryKeys.booklists.detail(booklistId), 'graph'],
    queryFn: () => booklistService.getGraph(booklistId),
    enabled: !!booklistId,
  });
}

export function useCreateRelation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      booklistId,
      data,
    }: {
      booklistId: string;
      data: { sourceItemId: string; targetItemId: string; relationType: string; label?: string | null };
    }) => booklistService.createRelation(booklistId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...queryKeys.booklists.detail(vars.booklistId), 'graph'] });
      qc.invalidateQueries({ queryKey: queryKeys.booklists.detail(vars.booklistId) });
    },
  });
}

export function useDeleteRelation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ booklistId, relationId }: { booklistId: string; relationId: string }) =>
      booklistService.deleteRelation(booklistId, relationId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...queryKeys.booklists.detail(vars.booklistId), 'graph'] });
    },
  });
}


