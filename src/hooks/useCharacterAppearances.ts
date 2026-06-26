import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { characterService } from '../api/characterService';
import { queryKeys } from '../lib/queryKeys';

export function useCharacterAppearances(storyId: string) {
  return useQuery({
    queryKey: queryKeys.characterAppearances.byStory(storyId),
    queryFn: () => characterService.getCharacterAppearances(storyId),
    enabled: !!storyId,
  });
}

export function useBatchCharacterAppearances(storyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      appearances,
    }: {
      appearances: Parameters<typeof characterService.batchCharacterAppearances>[1];
    }) => characterService.batchCharacterAppearances(storyId, appearances),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.characterAppearances.byStory(storyId) });
    },
  });
}
