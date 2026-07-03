import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Route,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  BookOpen,
  GitBranch,
  Sparkles,
  Loader2,
  AlertCircle,
  Library,
  Check,
  List,
} from 'lucide-react';
import client from '../../api/client';
import { Button, Input, Textarea } from '../../components/ui';
import { useAuthStore } from '../../stores/useAuthStore';
import CharacterTagSelector, { type CharacterTag } from './components/CharacterTagSelector';

/* ─── Types ─── */

interface MapNode {
  id: string;
  title: string;
  category: 'chapter' | 'branch' | 'spinoff';
  description?: string | null;
  orderIndex?: number;
}

interface StoryBrief {
  id: string;
  title: string;
}

const guideTypeLabels: Record<string, string> = {
  chronological: '按时间顺序',
  character_focus: '聚焦特定角色',
  theme_exploration: '主题探索',
  completionist: '完整通关',
};

interface SelectedNode {
  nodeCategory: 'chapter' | 'branch' | 'spinoff';
  contentId: string;
  title: string;
  introduction: string;
  note: string;
  storyId: string;
  storyTitle: string;
}

interface PathDetail {
  id: string;
  title: string;
  description: string | null;
  guideType: string | null;
  origin: string;
  creator: { id: string; username: string; avatarUrl: string | null };
  storyId: string;
  nodes: {
    id: string;
    sortOrder: number;
    nodeCategory: string;
    contentId: string;
    contentTitle: string;
    introduction: string | null;
    note: string | null;
    estimatedMin: number | null;
    storyId?: string;
    storyTitle?: string;
  }[];
}

/* ─── Helpers ─── */

function parseMapNodeId(prefixed: string) {
  const sep = prefixed.indexOf('-');
  if (sep === -1) return null;
  return {
    category: prefixed.slice(0, sep) as 'chapter' | 'branch' | 'spinoff',
    contentId: prefixed.slice(sep + 1),
  };
}

const nodeIcons: Record<string, React.ElementType> = {
  chapter: BookOpen,
  branch: GitBranch,
  spinoff: Sparkles,
};

const nodeColors: Record<string, string> = {
  chapter:
    'bg-accent-50 text-accent-500 border-accent-200 dark:bg-accent-500/15 dark:text-accent-400 dark:border-accent-600',
  branch:
    'bg-purple-50 text-accent-500 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  spinoff:
    'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
};

const categoryLabels: Record<string, string> = {
  chapter: '章节',
  branch: '分支',
  spinoff: '番外',
};

/* ─── Component ─── */

const ReadingPathEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [pageLoading, setPageLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pathData, setPathData] = useState<PathDetail | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [guideType, setGuideType] = useState('chronological');

  // Story map data for node picker
  const [storyName, setStoryName] = useState('');
  const [availableNodes, setAvailableNodes] = useState<MapNode[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [stories, setStories] = useState<StoryBrief[]>([]);
  const [showStoryPicker, setShowStoryPicker] = useState(false);
  const [nodePickerLoading, setNodePickerLoading] = useState(false);

  // Selected nodes (in order)
  const [selectedNodes, setSelectedNodes] = useState<SelectedNode[]>([]);

  // Character tags per node: key = `${nodeCategory}:${contentId}`
  const [nodeCharacterTags, setNodeCharacterTags] = useState<Map<string, CharacterTag[]>>(new Map());

  const getNodeKey = (nodeCategory: string, contentId: string) => `${nodeCategory}:${contentId}`;

  // Node picker tab
  const [pickerTab, setPickerTab] = useState<'chapter' | 'branch' | 'spinoff'>('chapter');

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* Fetch stories list for picker */
  useEffect(() => {
    client.get('/stories', { params: { limit: 50 } })
      .then((res) => {
        const items = res.data?.items || res.data?.data || res.data || [];
        setStories(Array.isArray(items) ? items : []);
      })
      .catch(() => {});
  }, []);

  /* Fetch path detail + initial story map */
  useEffect(() => {
    if (!id) {
      setFetchError('缺少路径 ID');
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    client.get(`/reading-paths/${id}`)
      .then((res) => {
        const data: PathDetail = res.data?.data || res.data;
        setPathData(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setGuideType(data.guideType || 'chronological');
        setSelectedStoryId(data.storyId || '');

        // Pre-populate selected nodes
        const nodes = data.nodes.map((n) => ({
          nodeCategory: n.nodeCategory as 'chapter' | 'branch' | 'spinoff',
          contentId: n.contentId,
          title: n.contentTitle,
          introduction: n.introduction || '',
          note: n.note || '',
          storyId: n.storyId || data.storyId || '',
          storyTitle: n.storyTitle || '',
        }));
        setSelectedNodes(nodes);

        // Fetch map data for the story
        const storyIdToFetch = data.storyId || '';
        if (storyIdToFetch) {
          return client.get(`/stories/${storyIdToFetch}/map`);
        }
        return null;
      })
      .then((mapRes) => {
        if (!mapRes) return;
        const mapData = mapRes.data;
        setStoryName(mapData.story?.title || '');
        setAvailableNodes(mapData.nodes || []);
      })
      .catch((err) => {
        setFetchError(err?.response?.data?.error?.message || '无法加载阅读路径数据');
      })
      .finally(() => setPageLoading(false));
  }, [id]);

  /* Verify ownership */
  useEffect(() => {
    if (pathData && user && pathData.creator.id !== user.id) {
      setFetchError('你只能编辑自己创建的阅读路径');
    }
  }, [pathData, user]);

  /* Switch story in the picker */
  const selectPickerStory = (storyId: string, title: string) => {
    setSelectedStoryId(storyId);
    setStoryName(title);
    setShowStoryPicker(false);
    setNodePickerLoading(true);
    client.get(`/stories/${storyId}/map`)
      .then((res) => {
        setAvailableNodes(res.data.nodes || []);
      })
      .catch(() => {})
      .finally(() => setNodePickerLoading(false));
  };

  /* Add a node */
  const addNode = (node: MapNode) => {
    const parsed = parseMapNodeId(node.id);
    if (!parsed) return;
    if (selectedNodes.some((n) => n.contentId === parsed.contentId)) return;
    setSelectedNodes((prev) => [
      ...prev,
      {
        nodeCategory: parsed.category,
        contentId: parsed.contentId,
        title: node.title,
        introduction: '',
        note: '',
        storyId: selectedStoryId,
        storyTitle: storyName,
      },
    ]);
  };

  const removeNode = (index: number) => {
    setSelectedNodes((prev) => {
      const node = prev[index];
      if (node) {
        const key = getNodeKey(node.nodeCategory, node.contentId);
        setNodeCharacterTags((prevTags) => {
          const next = new Map(prevTags);
          next.delete(key);
          return next;
        });
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const moveNode = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= selectedNodes.length) return;
    setSelectedNodes((prev) => {
      const arr = [...prev];
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  const updateNote = (index: number, note: string) => {
    setSelectedNodes((prev) => prev.map((n, i) => (i === index ? { ...n, note } : n)));
  };

  const updateIntroduction = (index: number, introduction: string) => {
    setSelectedNodes((prev) => prev.map((n, i) => (i === index ? { ...n, introduction } : n)));
  };

  const updateNodeCharacterTags = (nodeCategory: string, contentId: string, tags: CharacterTag[]) => {
    const key = getNodeKey(nodeCategory, contentId);
    setNodeCharacterTags((prev) => {
      const next = new Map(prev);
      if (tags.length === 0) {
        next.delete(key);
      } else {
        next.set(key, tags);
      }
      return next;
    });
  };

  /* Submit */
  const handleSubmit = async () => {
    if (!title.trim()) { setSubmitError('请输入路径名称'); return; }
    if (selectedNodes.length === 0) { setSubmitError('请至少添加一个节点'); return; }
    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Update reading path
      await client.put(`/reading-paths/${id}`, {
        title: title.trim(),
        description: description.trim() || undefined,
        guideType,
        nodes: selectedNodes.map((n, i) => ({
          nodeCategory: n.nodeCategory,
          contentId: n.contentId,
          sortOrder: i,
          introduction: n.introduction || undefined,
          note: n.note || undefined,
          storyId: n.storyId,
          storyTitle: n.storyTitle,
        })),
      });

      // 2. Batch-create character appearances (group by storyId)
      const tagsByStory = new Map<string, { characterId: string; targetType: string; targetId: string; appearanceType: string }[]>();
      for (const node of selectedNodes) {
        const key = getNodeKey(node.nodeCategory, node.contentId);
        const tags = nodeCharacterTags.get(key);
        if (!tags || tags.length === 0 || !node.storyId) continue;
        const entries = tags.map((t) => ({
          characterId: t.characterId,
          targetType: node.nodeCategory,
          targetId: node.contentId,
          appearanceType: t.appearanceType,
        }));
        const existing = tagsByStory.get(node.storyId) || [];
        tagsByStory.set(node.storyId, [...existing, ...entries]);
      }

      // Send batch requests per story (fire-and-forget — don't block navigation on failure)
      const batchPromises: Promise<any>[] = [];
      for (const [storyId, appearances] of tagsByStory) {
        batchPromises.push(
          client.put(`/stories/${storyId}/character-appearances`, { appearances }).catch(() => {
            // Permission errors are expected for cross-author content
          })
        );
      }
      await Promise.allSettled(batchPromises);

      navigate(`/reading-path/${id}`);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error?.message || err?.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render ── */

  if (pageLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 flex flex-col items-center gap-4">
        <Loader2 size={32} className="animate-spin text-accent-400" />
        <p className="text-sm text-ink-500">加载阅读路径数据…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <AlertCircle size={48} className="mx-auto text-ink-300 mb-4" />
        <h2 className="text-xl font-bold text-ink-800 dark:text-white mb-2">无法加载</h2>
        <p className="text-ink-500 mb-6">{fetchError}</p>
        <Button variant="subtle" onClick={() => navigate(-1)}>返回</Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <AlertCircle size={48} className="mx-auto text-ink-300 mb-4" />
        <h2 className="text-xl font-bold text-ink-800 dark:text-white mb-2">请先登录</h2>
        <p className="text-ink-500 mb-6">你需要登录后才能编辑阅读路径</p>
        <Button onClick={() => navigate('/login')}>登录</Button>
      </div>
    );
  }

  const availableByCategory = {
    chapter: availableNodes.filter((n) => n.category === 'chapter'),
    branch: availableNodes.filter((n) => n.category === 'branch'),
    spinoff: availableNodes.filter((n) => n.category === 'spinoff'),
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 dark:hover:text-white transition-colors">
        <ArrowLeft size={16} /> 返回
      </button>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Route size={20} className="text-accent-400" />
          <span className="eyebrow text-accent-400">编辑阅读路径</span>
        </div>
        <h1 className="text-2xl font-bold text-ink-800 dark:text-white">
          {storyName ? `编辑「${pathData?.title || title}」` : '编辑阅读路径'}
        </h1>
        <p className="mt-1 text-sm text-ink-500">修改阅读路径的名称、简介或添加跨作品节点</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink-800 dark:text-white">基本信息</h3>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1.5">路径名称 *</label>
              <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="如：凡人修仙 · 必看分支合集" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1.5">简介</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述这条路线适合什么样的读者…" rows={2}
                className="resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1.5">路线类型</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(guideTypeLabels).map(([value, label]) => (
                  <button key={value} onClick={() => setGuideType(value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      guideType === value
                        ? 'border-accent-400 bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400'
                        : 'border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 text-ink-600 dark:text-ink-300 hover:border-accent-300 dark:hover:border-accent-600'
                    }`}>
                    {guideType === value && <Check size={12} className="shrink-0" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 p-5 space-y-3">
            <h3 className="text-sm font-bold text-ink-800 dark:text-white">路径概览</h3>
            <div className="flex flex-wrap gap-2">
              {(['chapter', 'branch', 'spinoff'] as const).map((cat) => {
                const count = selectedNodes.filter((n) => n.nodeCategory === cat).length;
                if (count === 0) return null;
                const Icon = nodeIcons[cat];
                return (
                  <span key={cat} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${nodeColors[cat]}`}>
                    <Icon size={12} /> {count} {categoryLabels[cat]}
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-ink-400">
              共 <span className="font-bold text-ink-500 dark:text-ink-300">{selectedNodes.length}</span> 个节点
            </p>
            {(() => {
              const usedStories = new Set(selectedNodes.map((n) => n.storyId).filter(Boolean));
              if (usedStories.size > 1) {
                return <p className="text-xs text-accent-500 font-medium">跨作品路线（{usedStories.size} 篇故事）</p>;
              }
              return null;
            })()}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Selected nodes */}
          <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-800 dark:text-white">已选节点</h3>
              {selectedNodes.length > 0 && (
                <button onClick={() => setSelectedNodes([])} className="text-xs text-red-500 hover:text-red-600 font-medium">清空</button>
              )}
            </div>
            {selectedNodes.length === 0 ? (
              <div className="py-8 text-center">
                <Route size={32} className="mx-auto text-ink-200 dark:text-ink-600 mb-2" />
                <p className="text-sm text-ink-400">还没有添加节点</p>
                <p className="text-xs text-ink-300 dark:text-ink-500">从下方的内容列表中选择章节、分支或番外</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {selectedNodes.map((node, i) => {
                  const Icon = nodeIcons[node.nodeCategory];
                  const colorCls = nodeColors[node.nodeCategory];
                  return (
                    <div key={`${node.contentId}-${i}`}
                      className="flex flex-col p-2.5 rounded-xl border border-ink-100 dark:border-ink-700 bg-ink-50/50 dark:bg-ink-700/30 group hover:border-accent-200 dark:hover:border-accent-600 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-center text-xs font-bold text-ink-400 shrink-0">{i + 1}</span>
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${colorCls} shrink-0`}>
                          <Icon size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-ink-800 dark:text-white truncate">{node.title}</p>
                          {node.storyTitle && (
                            <p className="text-[10px] text-indigo-400 truncate">{node.storyTitle}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveNode(i, -1)} disabled={i === 0}
                            className="p-1 rounded-md hover:bg-ink-200 dark:hover:bg-ink-600 disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronUp size={14} className="text-ink-500" />
                          </button>
                          <button onClick={() => moveNode(i, 1)} disabled={i === selectedNodes.length - 1}
                            className="p-1 rounded-md hover:bg-ink-200 dark:hover:bg-ink-600 disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronDown size={14} className="text-ink-500" />
                          </button>
                          <button onClick={() => removeNode(i)} className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30">
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                      {/* Node fields */}
                      <div className="ml-8 mt-1.5 space-y-1">
                        <input type="text" value={node.introduction} onChange={(e) => updateIntroduction(i, e.target.value)}
                          placeholder="节点导读（选填，如：本章揭示了主角的身世）"
                          className="w-full text-xs text-ink-600 dark:text-ink-300 bg-transparent border border-transparent hover:border-ink-200 dark:hover:border-ink-600 focus:border-accent-400 focus:outline-none focus:ring-0 rounded-lg px-2 py-1 placeholder-ink-300 dark:placeholder-ink-500 transition-colors" />
                        <input type="text" value={node.note} onChange={(e) => updateNote(i, e.target.value)}
                          placeholder="推荐语（选填）"
                          className="w-full text-xs text-ink-400 bg-transparent border-0 border-b border-transparent hover:border-ink-200 focus:border-blue-400 focus:outline-none focus:ring-0 pb-0.5 placeholder-ink-300 dark:placeholder-ink-500 transition-colors" />
                      </div>
                      {/* Character tag selector per node */}
                      {node.storyId && (
                        <CharacterTagSelector
                          storyId={node.storyId}
                          selectedTags={nodeCharacterTags.get(getNodeKey(node.nodeCategory, node.contentId)) || []}
                          onChange={(tags) => updateNodeCharacterTags(node.nodeCategory, node.contentId, tags)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Node picker */}
          <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 overflow-hidden">
            {/* Story selector bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-ink-50 dark:bg-ink-700/50 border-b border-ink-100 dark:border-ink-700">
              <div className="flex items-center gap-2">
                <Library size={14} className="text-ink-400" />
                <span className="text-xs font-bold text-ink-500">当前故事：</span>
                <span className="text-xs font-bold text-ink-800 dark:text-white">{storyName || '未选择'}</span>
              </div>
              <button onClick={() => setShowStoryPicker(!showStoryPicker)}
                className="text-xs text-accent-500 hover:text-accent-600 font-bold">切换故事</button>
            </div>

            {showStoryPicker && (
              <div className="border-b border-ink-100 dark:border-ink-700 max-h-48 overflow-y-auto p-2 space-y-1">
                {stories.length === 0 ? (
                  <p className="text-xs text-ink-400 text-center py-4">加载故事列表中...</p>
                ) : (
                  stories.map((s) => (
                    <button key={s.id} onClick={() => selectPickerStory(s.id, s.title)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm transition-colors ${
                        selectedStoryId === s.id
                          ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 font-bold'
                          : 'hover:bg-ink-50 dark:hover:bg-ink-700 text-ink-700 dark:text-ink-300'
                      }`}>
                      {selectedStoryId === s.id && <Check size={14} className="text-accent-500 shrink-0" />}
                      <span className="flex-1 truncate">{s.title}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="flex border-b border-ink-100 dark:border-ink-700">
              {(['chapter', 'branch', 'spinoff'] as const).map((cat) => {
                const count = availableByCategory[cat].length;
                const Icon = nodeIcons[cat];
                const isActive = pickerTab === cat;
                return (
                  <button key={cat} onClick={() => setPickerTab(cat)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
                      isActive
                        ? 'border-accent-400 text-accent-500 dark:text-accent-400'
                        : 'border-transparent text-ink-400 hover:text-ink-500 dark:hover:text-ink-300'
                    }`}>
                    <Icon size={14} /> {categoryLabels[cat]}
                    <span className="ml-1 text-[10px] text-ink-400">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {nodePickerLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-accent-400" />
                </div>
              ) : availableByCategory[pickerTab].length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-ink-400">
                    暂无{pickerTab === 'chapter' ? '章节' : pickerTab === 'branch' ? '分支' : '番外'}
                  </p>
                </div>
              ) : (
                availableByCategory[pickerTab].map((node) => {
                  const alreadySelected = selectedNodes.some((n) => n.contentId === parseMapNodeId(node.id)?.contentId);
                  return (
                    <button key={node.id} onClick={() => addNode(node)} disabled={alreadySelected}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        alreadySelected
                          ? 'bg-ink-50 dark:bg-ink-700/50 opacity-50 cursor-not-allowed'
                          : 'hover:bg-ink-50 dark:hover:bg-ink-700/50 cursor-pointer'
                      }`}>
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border shrink-0 ${nodeColors[pickerTab]}`}>
                        {React.createElement(nodeIcons[pickerTab], { size: 14 })}
                      </span>
                      <span className="flex-1 text-sm font-medium text-ink-800 dark:text-white truncate">{node.title}</span>
                      {alreadySelected ? (
                        <span className="text-[10px] text-ink-400 shrink-0">已添加</span>
                      ) : (
                        <Plus size={14} className="text-ink-300 hover:text-accent-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 pb-8">
        <Button variant="ghost" onClick={() => navigate(-1)}>取消</Button>
        <Button onClick={handleSubmit} loading={submitting} disabled={!title.trim() || selectedNodes.length === 0}
          leftIcon={!submitting ? <Route size={16} /> : undefined}>
          {submitting ? '保存中…' : '保存修改'}
        </Button>
      </div>
    </div>
  );
};

export default ReadingPathEditPage;
