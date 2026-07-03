import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spinoffService } from '../api/spinoffService';
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


