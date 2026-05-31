import React, { useState, useEffect, useCallback } from 'react';
import { Character } from '../../../api/storyService';
import { useCharacters } from '../../../hooks/useCharacters';
import { useCharacterAppearances, useBatchCharacterAppearances } from '../../../hooks/useCharacterAppearances';
import { useToast } from '../../../components/Toast';
import { Save, Loader2, User } from 'lucide-react';

interface ChapterTarget {
  id: string;
  title: string;
  type: 'chapter' | 'branch' | 'spinoff';
  orderIndex: number;
}

interface AppearanceRecord {
  characterId: string;
  targetType: string;
  targetId: string;
  appearanceType: string;
}

const APPEARANCE_OPTIONS = [
  { value: '', label: '—', color: '' },
  { value: 'appears', label: '出场', color: 'bg-accent-100 dark:bg-accent-500/15 text-accent-600' },
  { value: 'main_focus', label: '重点', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
  { value: 'mention', label: '提及', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
  { value: 'cameo', label: '客串', color: 'bg-green-100 dark:bg-green-900/30 text-green-600' },
];

const targetTypeLabel: Record<string, string> = {
  chapter: '章节',
  branch: '分支',
  spinoff: '番外',
};

interface AppearanceManagerProps {
  storyId: string;
  isAuthor: boolean;
  chapters?: { id: string; title: string; orderIndex: number }[];
  branches?: { id: string; title: string }[];
  spinoffs?: { id: string; title: string }[];
}

const AppearanceManager: React.FC<AppearanceManagerProps> = ({
  storyId,
  isAuthor,
  chapters = [],
  branches = [],
  spinoffs = [],
}) => {
  const { addToast } = useToast();
  const { data: characters = [], isLoading: charsLoading } = useCharacters(storyId);
  const { data: appearancesData, isLoading: appsLoading } = useCharacterAppearances(storyId);
  const batchMutation = useBatchCharacterAppearances(storyId);

  // Build list of targets (columns)
  const targets: ChapterTarget[] = React.useMemo(() => {
    const result: ChapterTarget[] = [
      ...chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        type: 'chapter' as const,
        orderIndex: ch.orderIndex,
      })),
      ...branches.map((br) => ({
        id: br.id,
        title: br.title,
        type: 'branch' as const,
        orderIndex: 999,
      })),
      ...spinoffs.map((sp) => ({
        id: sp.id,
        title: sp.title,
        type: 'spinoff' as const,
        orderIndex: 999,
      })),
    ];
    // Sort targets: chapters by orderIndex first, then branches/spinoffs
    result.sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id));
    return result;
  }, [chapters, branches, spinoffs]);

  // Local matrix state: key = `${characterId}_${targetType}_${targetId}`, value = appearanceType
  const [matrix, setMatrix] = useState<Record<string, string>>({});

  // Initialize local state from server data
  useEffect(() => {
    if (appearancesData) {
      const list: AppearanceRecord[] = Array.isArray(appearancesData) ? appearancesData : appearancesData.data ?? [];
      const newMatrix: Record<string, string> = {};
      for (const app of list) {
        newMatrix[`${app.characterId}_${app.targetType}_${app.targetId}`] = app.appearanceType;
      }
      setMatrix(newMatrix);
    }
  }, [appearancesData]);

  const handleCellChange = useCallback(
    (characterId: string, targetType: string, targetId: string, value: string) => {
      setMatrix((prev) => {
        const key = `${characterId}_${targetType}_${targetId}`;
        const next = { ...prev };
        if (value === '') {
          delete next[key];
        } else {
          next[key] = value;
        }
        return next;
      });
    },
    []
  );

  const handleSave = async () => {
    // Build appearance list from matrix (omit empty entries)
    const appearances: { characterId: string; targetType: string; targetId: string; appearanceType: string }[] = [];
    for (const [key, value] of Object.entries(matrix)) {
      const [characterId, targetType, targetId] = key.split('_');
      appearances.push({ characterId, targetType, targetId, appearanceType: value });
    }
    try {
      await batchMutation.mutateAsync({ appearances });
      addToast('success', '出场设置已保存');
    } catch {
      addToast('error', '保存失败');
    }
  };

  const hasChanges = React.useRef(false);
  hasChanges.current = true; // Always allow save — user might clear all

  const isLoading = charsLoading || appsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-accent-500" />
      </div>
    );
  }

  if (characters.length === 0 || targets.length === 0) {
    return (
      <div className="py-8 text-center bg-ink-50 dark:bg-ink-700/50 rounded-3xl border-2 border-dashed border-ink-200 dark:border-ink-600">
        <User size={32} className="mx-auto text-ink-300 mb-3" />
        <p className="text-ink-500 font-medium">
          {characters.length === 0 ? '请先添加角色' : '暂无章节'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <h4 className="text-lg font-black text-ink-700 dark:text-ink-300">
          角色出场管理
        </h4>
        {isAuthor && (
          <button
            onClick={handleSave}
            disabled={batchMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-xl text-sm font-bold hover:bg-accent-600 transition-all shadow-lg shadow-accent-400/20 active:scale-95 disabled:opacity-50"
          >
            {batchMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            保存出场设置
          </button>
        )}
      </div>

      {/* Collapsible scrollable table */}
      <div className="bg-ink-50 dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 dark:border-ink-600">
                <th className="sticky left-0 bg-ink-50 dark:bg-ink-700 z-10 px-4 py-3 text-left text-xs font-black text-ink-500 uppercase tracking-wider min-w-[140px]">
                  角色
                </th>
                {targets.map((target) => (
                  <th
                    key={`${target.type}_${target.id}`}
                    className="px-3 py-3 text-center text-xs font-black text-ink-500 uppercase tracking-wider min-w-[100px] max-w-[140px]"
                  >
                    <div className="truncate" title={target.title}>
                      {target.title}
                    </div>
                    <span className="text-[10px] font-bold text-ink-400">
                      {targetTypeLabel[target.type]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {characters.map((char: Character, idx: number) => (
                <tr
                  key={char.id}
                  className={`${
                    idx % 2 === 0
                      ? 'bg-ink-50 dark:bg-ink-700'
                      : 'bg-white dark:bg-ink-800'
                  } border-b border-ink-100 dark:border-ink-600 last:border-none`}
                >
                  <td className="sticky left-0 z-10 px-4 py-3 font-bold text-ink-800 dark:text-white text-sm truncate max-w-[140px]"
                      style={
                        idx % 2 === 0
                          ? { backgroundColor: 'inherit' }
                          : { backgroundColor: 'inherit' }
                      }
                  >
                    <div className="flex items-center gap-2">
                      {char.avatarUrl ? (
                        <img src={char.avatarUrl} alt="" className="w-6 h-6 rounded-lg object-cover shrink-0" />
                      ) : (
                        <User size={16} className="shrink-0 text-ink-400" />
                      )}
                      <span className="truncate">{char.name}</span>
                    </div>
                  </td>
                  {targets.map((target) => {
                    const key = `${char.id}_${target.type}_${target.id}`;
                    const value = matrix[key] || '';
                    const option = APPEARANCE_OPTIONS.find((o) => o.value === value);
                    return (
                      <td key={key} className="px-3 py-2 text-center">
                        {isAuthor ? (
                          <select
                            value={value}
                            onChange={(e) =>
                              handleCellChange(char.id, target.type, target.id, e.target.value)
                            }
                            className="w-full px-1.5 py-1.5 rounded-lg border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-800 text-xs font-bold focus:ring-2 focus:ring-accent-400 outline-none transition-all cursor-pointer"
                          >
                            {APPEARANCE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : value ? (
                          <span
                            className={`inline-block px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              option?.color || 'bg-ink-100 dark:bg-ink-600 text-ink-500'
                            }`}
                          >
                            {option?.label || '—'}
                          </span>
                        ) : (
                          <span className="text-ink-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!isAuthor && (
        <p className="text-xs text-ink-400 px-4">
          * 仅作者可编辑出场设置
        </p>
      )}
    </div>
  );
};

export default AppearanceManager;
