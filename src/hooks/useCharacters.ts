import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { characterService } from '../api/characterService';
import { queryKeys } from '../lib/queryKeys';

export function useCharacters(storyId: string) {
  return useQuery({
    queryKey: queryKeys.characters.byStory(storyId),
    queryFn: () => characterService.getCharacters(storyId),
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
      data: Parameters<typeof characterService.createCharacter>[1];
    }) => characterService.createCharacter(storyId, data),
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
      data: Parameters<typeof characterService.updateCharacter>[1];
    }) => characterService.updateCharacter(charId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.characters.all });
    },
  });
}
