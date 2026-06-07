import React, { useEffect, useState } from 'react';
import { Users, ChevronDown, ChevronUp, Plus, X, Loader2 } from 'lucide-react';
import client from '../../../api/client';

/* ─── Types ─── */

export interface CharacterBrief {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: 'protagonist' | 'antagonist' | 'supporting';
}

export interface CharacterTag {
  characterId: string;
  appearanceType: 'main_focus' | 'appears' | 'mention' | 'cameo';
}

interface Props {
  storyId: string;
  selectedTags: CharacterTag[];
  onChange: (tags: CharacterTag[]) => void;
}

/* ─── Constants ─── */

const APPEARANCE_LABELS: Record<string, string> = {
  main_focus: '重点',
  appears: '出场',
  mention: '提及',
  cameo: '客串',
};

const APPEARANCE_COLORS: Record<string, string> = {
  main_focus: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700',
  appears: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  mention: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700',
  cameo: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
};

const ROLE_LABELS: Record<string, string> = {
  protagonist: '主角',
  antagonist: '反派',
  supporting: '配角',
};

/* ─── Component ─── */

const CharacterTagSelector: React.FC<Props> = ({ storyId, selectedTags, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [characters, setCharacters] = useState<CharacterBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedStoryId, setLoadedStoryId] = useState('');

  // Fetch characters when storyId changes
  useEffect(() => {
    if (!storyId || storyId === loadedStoryId) return;
    setLoading(true);
    client
      .get(`/stories/${storyId}/characters`)
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setCharacters(Array.isArray(data) ? data : []);
        setLoadedStoryId(storyId);
      })
      .catch(() => {
        setCharacters([]);
      })
      .finally(() => setLoading(false));
  }, [storyId, loadedStoryId]);

  // Reset when storyId changes
  useEffect(() => {
    if (storyId !== loadedStoryId && loadedStoryId !== '') {
      setLoadedStoryId('');
      setCharacters([]);
    }
  }, [storyId, loadedStoryId]);

  const selectedMap = new Map(selectedTags.map((t) => [t.characterId, t]));
  const availableCharacters = characters.filter((c) => !selectedMap.has(c.id));
  const tagCount = selectedTags.length;

  const addCharacter = (char: CharacterBrief) => {
    onChange([...selectedTags, { characterId: char.id, appearanceType: 'appears' }]);
  };

  const removeCharacter = (charId: string) => {
    onChange(selectedTags.filter((t) => t.characterId !== charId));
  };

  const changeAppearance = (charId: string, type: CharacterTag['appearanceType']) => {
    onChange(selectedTags.map((t) => (t.characterId === charId ? { ...t, appearanceType: type } : t)));
  };

  const getCharById = (id: string) => characters.find((c) => c.id === id);

  return (
    <div className="mt-2 pt-2 border-t border-ink-100 dark:border-ink-700">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-accent-500 dark:hover:text-accent-400 transition-colors"
      >
        <Users size={13} />
        <span>角色标签</span>
        {tagCount > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent-100 dark:bg-accent-500/20 text-[10px] font-bold text-accent-600 dark:text-accent-400">
            {tagCount}
          </span>
        )}
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="mt-2 space-y-2 pl-1">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-ink-400 py-1">
              <Loader2 size={12} className="animate-spin" />
              加载角色列表…
            </div>
          ) : characters.length === 0 ? (
            <p className="text-xs text-ink-400 py-1">
              该故事暂无角色数据
            </p>
          ) : (
            <>
              {/* Selected character tags */}
              {tagCount > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.map((tag) => {
                    const char = getCharById(tag.characterId);
                    if (!char) return null;
                    return (
                      <span
                        key={tag.characterId}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border ${APPEARANCE_COLORS[tag.appearanceType]}`}
                      >
                        {/* Avatar */}
                        <span className="w-4 h-4 rounded-full bg-gradient-to-br from-accent-400 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                          {char.name[0]}
                        </span>
                        <span>{char.name}</span>
                        {/* Appearance type dropdown */}
                        <select
                          value={tag.appearanceType}
                          onChange={(e) => changeAppearance(tag.characterId, e.target.value as CharacterTag['appearanceType'])}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] bg-transparent border-0 border-b border-current/30 px-0.5 py-0 focus:outline-none cursor-pointer appearance-none"
                        >
                          {Object.entries(APPEARANCE_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                        {/* Remove */}
                        <button
                          onClick={() => removeCharacter(tag.characterId)}
                          className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Available characters to add */}
              {availableCharacters.length > 0 && (
                <div>
                  <p className="text-[10px] text-ink-400 mb-1">
                    {tagCount > 0 ? '添加更多角色' : '添加出场角色'}：
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {availableCharacters.map((char) => (
                      <button
                        key={char.id}
                        onClick={() => addCharacter(char)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-300 hover:bg-accent-50 dark:hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400 border border-transparent hover:border-accent-200 dark:hover:border-accent-600 transition-all"
                      >
                        <span className="w-4 h-4 rounded-full bg-gradient-to-br from-ink-300 to-ink-400 dark:from-ink-500 dark:to-ink-600 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                          {char.name[0]}
                        </span>
                        <span>{char.name}</span>
                        <span className="text-[9px] text-ink-400">
                          {ROLE_LABELS[char.role] || char.role}
                        </span>
                        <Plus size={10} className="text-ink-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterTagSelector;
