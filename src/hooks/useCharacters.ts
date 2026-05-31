import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storyService } from '../api/storyService';
import { queryKeys } from '../lib/queryKeys';

export function useCharacters(storyId: string) {
  return useQuery({
    queryKey: queryKeys.characters.byStory(storyId),
    queryFn: () => storyService.getCharacters(storyId),
    enabled: !!storyId,
  });
}

export function useCreateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      storyId,
      data,
    }: {
      storyId: string;
      data: Parameters<typeof storyService.createCharacter>[1];
    }) => storyService.createCharacter(storyId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.characters.byStory(vars.storyId) });
    },
  });
}

export function useUpdateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      charId,
      data,
    }: {
      charId: string;
      data: Parameters<typeof storyService.updateCharacter>[1];
    }) => storyService.updateCharacter(charId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.characters.all });
    },
  });
}
