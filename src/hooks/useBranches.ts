import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService } from '../api/storyService';
import { queryKeys } from '../lib/queryKeys';

export function useBranches(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.branches.list(params as Record<string, unknown>),
    queryFn: () => branchService.getAll(params),
    staleTime: 60_000,
  });
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: queryKeys.branches.detail(id),
    queryFn: () => branchService.getById(id),
    enabled: !!id,
  });
}

export function useMyBranches() {
  return useQuery({
    queryKey: queryKeys.branches.my,
    queryFn: () => branchService.getMy(),
  });
}

export function useNewBranches() {
  return useQuery({
    queryKey: ['branches', 'new'],
    queryFn: () => branchService.getAll({ limit: 8 }),
    staleTime: 60_000,
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: branchService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.branches.all });
      qc.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof branchService.update>[1] }) =>
      branchService.update(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.branches.detail(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.branches.lists() });
    },
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: branchService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.branches.all });
      qc.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
  });
}

export function useCertifyBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, certify }: { id: string; certify: boolean }) =>
      branchService.certify(id, certify),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.branches.detail(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.branches.lists() });
    },
  });
}
