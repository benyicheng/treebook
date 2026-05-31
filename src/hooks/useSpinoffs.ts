import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spinoffService } from '../api/storyService';
import { queryKeys } from '../lib/queryKeys';

export function useSpinoffs(params?: {
  originalStoryId?: string;
  isOfficial?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.spinoffs.list(params as Record<string, unknown>),
    queryFn: () => spinoffService.getAll(params),
  });
}

export function useSpinoff(id: string) {
  return useQuery({
    queryKey: queryKeys.spinoffs.detail(id),
    queryFn: () => spinoffService.getById(id),
    enabled: !!id,
  });
}

export function useMySpinoffs() {
  return useQuery({
    queryKey: queryKeys.spinoffs.my,
    queryFn: () => spinoffService.getMy(),
  });
}

export function useCreateSpinoff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: spinoffService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.spinoffs.all });
      qc.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
  });
}

export function useUpdateSpinoff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof spinoffService.update>[1] }) =>
      spinoffService.update(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.spinoffs.detail(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.spinoffs.all });
    },
  });
}

export function useDeleteSpinoff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => spinoffService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.spinoffs.all });
      qc.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
  });
}
