import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  GripVertical,
  Loader2,
  AlertCircle,
  Library,
  Check,
} from 'lucide-react';
import client from '../../api/client';
import { useAuthStore } from '../../stores/useAuthStore';

/* ─── Types ─── */

interface MapNode {
  id: string; // "chapter-xxx" | "branch-xxx" | "spinoff-xxx"
  title: string;
  category: 'chapter' | 'branch' | 'spinoff';
  description?: string | null;
  orderIndex?: number;
}

interface StoryBrief {
  id: string;
  title: string;
}

interface SelectedNode {
  nodeCategory: 'chapter' | 'branch' | 'spinoff';
  contentId: string;
  title: string;
  note: string;
  storyId: string;
  storyTitle: string;
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

const ReadingPathCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStoryId = searchParams.get('storyId') || '';
  const { user } = useAuthStore();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [origin] = useState('community');

  // Data
  const [storyName, setStoryName] = useState('');
  const [availableNodes, setAvailableNodes] = useState<MapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Story selector
  const [stories, setStories] = useState<StoryBrief[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState(initialStoryId);
  const [showStoryPicker, setShowStoryPicker] = useState(false);

  // Selected nodes (in order)
  const [selectedNodes, setSelectedNodes] = useState<SelectedNode[]>([]);

  // Node picker tab
  const [pickerTab, setPickerTab] = useState<'chapter' | 'branch' | 'spinoff'>('chapter');

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* Fetch stories list for the story picker */
  useEffect(() => {
    client
      .get('/stories', { params: { limit: 50 } })
      .then((res) => {
        const items = res.data?.items || res.data?.data || res.data || [];
        setStories(Array.isArray(items) ? items : []);
      })
      .catch(() => {});
  }, []);

  /* Fetch story map when selected story changes */
  useEffect(() => {
    if (!selectedStoryId) {
      if (!initialStoryId) {
        setFetchError('请选择一篇故事');
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    setFetchError(null);
    client
      .get(`/stories/${selectedStoryId}/map`)
      .then((res) => {
        const data = res.data;
        setStoryName(data.story?.title || '');
        setAvailableNodes(data.nodes || []);
      })
      .catch(() => setFetchError('无法加载故事数据'))
      .finally(() => setLoading(false));
  }, [selectedStoryId, initialStoryId]);

  /* Fetch story name for the initial story if provided */
  useEffect(() => {
    if (initialStoryId && !storyName) {
      client.get(`/stories/${initialStoryId}`).then((res) => {
        const s = res.data?.data || res.data;
        setStoryName(s?.title || '');
      }).catch(() => {});
    }
  }, [initialStoryId]);

  /* Add a node to selected list */
  const addNode = (node: MapNode) => {
    const parsed = parseMapNodeId(node.id);
    if (!parsed) return;
    // Prevent duplicates (by contentId)
    if (selectedNodes.some((n) => n.contentId === parsed.contentId)) return;
    setSelectedNodes((prev) => [
      ...prev,
      {
        nodeCategory: parsed.category,
        contentId: parsed.contentId,
        title: node.title,
        note: '',
        storyId: selectedStoryId,
        storyTitle: storyName,
      },
    ]);
  };

  /* Remove a node */
  const removeNode = (index: number) => {
    setSelectedNodes((prev) => prev.filter((_, i) => i !== index));
  };

  /* Move node up/down */
  const moveNode = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= selectedNodes.length) return;
    setSelectedNodes((prev) => {
      const arr = [...prev];
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  /* Update note */
  const updateNote = (index: number, note: string) => {
    setSelectedNodes((prev) => prev.map((n, i) => (i === index ? { ...n, note } : n)));
  };

  /* Switch story in the picker */
  const selectPickerStory = (storyId: string, storyTitle: string) => {
    setSelectedStoryId(storyId);
    setStoryName(storyTitle);
    setShowStoryPicker(false);
  };

  /* Submit */
  const handleSubmit = async () => {
    if (!title.trim()) {
      setSubmitError('请输入路径名称');
      return;
    }
    if (selectedNodes.length === 0) {
      setSubmitError('请至少添加一个节点');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await client.post('/reading-paths', {
        storyId: initialStoryId || selectedStoryId || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        origin,
        nodes: selectedNodes.map((n, i) => ({
          nodeCategory: n.nodeCategory,
          contentId: n.contentId,
          sortOrder: i,
          note: n.note || undefined,
          storyId: n.storyId,
          storyTitle: n.storyTitle,
        })),
      });
      const data = res.data?.data || res.data;
      navigate(`/reading-path/${data.id}`);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error?.message || err?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render ── */

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <AlertCircle size={48} className="mx-auto text-ink-300 mb-4" />
        <h2 className="text-xl font-bold text-ink-800 dark:text-white mb-2">请先登录</h2>
        <p className="text-ink-500 mb-6">你需要登录后才能创建阅读路径</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-bold hover:bg-accent-600">登录</button>
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
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 dark:hover:text-white transition-colors">
        <ArrowLeft size={16} /> 返回
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Route size={20} className="text-accent-400" />
          <span className="text-xs font-bold text-accent-400 uppercase tracking-wider">创建阅读路径</span>
        </div>
        <h1 className="text-2xl font-black text-ink-800 dark:text-white">
          {storyName ? `为「${storyName}」创建路线` : '创建阅读路径'}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          从多个故事中挑选内容，编排成一条跨作品的阅读路线
        </p>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink-800 dark:text-white">基本信息</h3>
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1.5">路径名称 *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="如：凡人修仙 · 必看分支合集"
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 text-sm text-ink-800 dark:text-white placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1.5">简介</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述这条路线适合什么样的读者…" rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 text-sm text-ink-800 dark:text-white placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent resize-none" />
            </div>
          </div>

          {/* Stats */}
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
            {/* Show story sources */}
            {(() => {
              const usedStories = new Set(selectedNodes.map((n) => n.storyId));
              if (usedStories.size > 1) {
                return (
                  <p className="text-xs text-indigo-500 font-medium">
                    跨作品路线（{usedStories.size} 篇故事）
                  </p>
                );
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
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-ink-100 dark:border-ink-700 bg-ink-50/50 dark:bg-ink-700/30 group hover:border-accent-200 dark:hover:border-accent-600 transition-colors">
                      <span className="w-6 text-center text-xs font-bold text-ink-400 shrink-0">{i + 1}</span>
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${colorCls} shrink-0`}>
                        <Icon size={14} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-ink-800 dark:text-white truncate">{node.title}</p>
                        {node.storyTitle && (
                          <p className="text-[10px] text-indigo-400 truncate">{node.storyTitle}</p>
                        )}
                        <input type="text" value={node.note} onChange={(e) => updateNote(i, e.target.value)}
                          placeholder="添加推荐语（可选）"
                          className="mt-0.5 w-full text-xs text-ink-400 bg-transparent border-0 border-b border-transparent hover:border-ink-200 focus:border-blue-400 focus:outline-none focus:ring-0 pb-0.5 placeholder-ink-300 dark:placeholder-ink-500 transition-colors" />
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
                  );
                })}
              </div>
            )}
          </div>

          {/* Node picker with story selector */}
          <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 overflow-hidden">
            {/* Story selector bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-ink-50 dark:bg-ink-700/50 border-b border-ink-100 dark:border-ink-700">
              <div className="flex items-center gap-2">
                <Library size={14} className="text-ink-400" />
                <span className="text-xs font-bold text-ink-500">当前故事：</span>
                {loading ? (
                  <Loader2 size={12} className="animate-spin text-ink-400" />
                ) : (
                  <span className="text-xs font-bold text-ink-800 dark:text-white">{storyName || '未选择'}</span>
                )}
              </div>
              <button onClick={() => setShowStoryPicker(!showStoryPicker)}
                className="text-xs text-accent-500 hover:text-accent-600 font-bold">
                切换故事
              </button>
            </div>

            {/* Story picker dropdown */}
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

            {/* Category tabs */}
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

            {/* Node list */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-accent-400" />
              </div>
            ) : fetchError ? (
              <div className="py-8 text-center">
                <p className="text-xs text-ink-400">{fetchError}</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                {availableByCategory[pickerTab].length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs text-ink-400">暂无内容</p>
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
            )}
          </div>
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      {/* Submit button */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-8">
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors">取消</button>
        <button onClick={handleSubmit} disabled={submitting || !title.trim() || selectedNodes.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-500 text-white text-sm font-bold hover:bg-accent-600 disabled:bg-ink-300 dark:disabled:bg-ink-600 disabled:cursor-not-allowed transition-colors">
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" /> 创建中…</>
          ) : (
            <><Route size={16} /> 创建阅读路径</>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReadingPathCreatePage;
