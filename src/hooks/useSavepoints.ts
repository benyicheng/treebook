import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savepointService } from '../api/storyService';
import { queryKeys } from '../lib/queryKeys';

export function useSavepoints(storyId: string, enabled = true) {
  return useQuery({
    queryKey: ['savepoints', { storyId }],
    queryFn: () => savepointService.getAll({ storyId }),
    enabled: enabled && !!storyId,
  });
}

export function useCreateSavepoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: savepointService.create,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['savepoints', { storyId: vars.storyId }] });
    },
  });
}

export function useDeleteSavepoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => savepointService.delete(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['savepoints'] });
    },
  });
}
