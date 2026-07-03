import client from './client';
import type { Character } from './types';
export type { Character };

export const characterService = {
  getCharacters: async (storyId: string) => {
    const { data } = await client.get<Character[]>(`/stories/${storyId}/characters`);
    return data;
  },

  createCharacter: async (storyId: string, charData: Partial<Character>) => {
    const { data } = await client.post<Character>(`/stories/${storyId}/characters`, charData);
    return data;
  },

  updateCharacter: async (charId: string, charData: Partial<Character>) => {
    const { data } = await client.put<Character>(`/stories/characters/${charId}`, charData);
    return data;
  },

  deleteCharacter: async (charId: string) => {
    await client.delete(`/stories/characters/${charId}`);
  },

  getAppearances: async (charId: string) => {
    const { data } = await client.get<any>(`/stories/characters/${charId}/appearances`);
    return data;
  },

  getCharacterAppearances: async (storyId: string) => {
    const { data } = await client.get(`/stories/${storyId}/character-appearances`);
    return data;
  },

  batchCharacterAppearances: async (storyId: string, appearances: { characterId: string; targetType: string; targetId: string; appearanceType: string }[]) => {
    const { data } = await client.put(`/stories/${storyId}/character-appearances`, { appearances });
    return data;
  },
};
