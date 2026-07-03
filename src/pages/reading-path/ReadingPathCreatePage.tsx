import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Route,
  ArrowLeft,
  Trash2,
  ChevronUp,
  ChevronDown,
  BookOpen,
  GitBranch,
  Sparkles,
  User,
  Loader2,
  AlertCircle,
  Library,
  List,
  Check,
} from 'lucide-react';
import client from '../../api/client';
import { Button, Input, Textarea } from '../../components/ui';
import { booklistService } from '../../api/storyService';
import { useAuthStore } from '../../stores/useAuthStore';

/* ─── Helpers ─── */

function getItemTitle(item: any): string {
  if (item.targetType === 'chapter' && item.chapter) return item.chapter.title
  if (item.targetType === 'story' && item.story) return item.story.title
  if (item.targetType === 'branch' && item.branch) return item.branch.title
  if (item.targetType === 'spinoff' && item.spinoff) return item.spinoff.title
  if (item.targetType === 'character') return item.notes || '人物'
  if (item.targetType === 'wiki_page') return item.notes || '百科词条'
  return item.notes || '未命名'
}

function getItemSubtitle(item: any): string | null {
  if (item.targetType === 'chapter' && item.chapter?.story) return item.chapter.story.title
  if (item.targetType === 'branch' && item.branch?.parentStory) return item.branch.parentStory.title
  if (item.targetType === 'spinoff' && item.spinoff?.originalStory) return item.spinoff.originalStory.title
  if (item.targetType === 'story' && item.story?.author) return `作者：${item.story.author.username}`
  return null
}

function getItemStoryId(item: any): string {
  if (item.targetType === 'chapter' && item.chapter?.story) return item.chapter.story.id
  if (item.targetType === 'branch' && item.branch?.parentStory) return item.branch.parentStory.id
  if (item.targetType === 'spinoff' && item.spinoff?.originalStory) return item.spinoff.originalStory.id
  if (item.targetType === 'story') return item.targetId
  return ''
}

function getItemStoryTitle(item: any): string {
  if (item.targetType === 'chapter' && item.chapter?.story) return item.chapter.story.title
  if (item.targetType === 'branch' && item.branch?.parentStory) return item.branch.parentStory.title
  if (item.targetType === 'spinoff' && item.spinoff?.originalStory) return item.spinoff.originalStory.title
  if (item.targetType === 'story' && item.story) return item.story.title
  return ''
}

const targetTypeIcons: Record<string, React.ElementType> = {
  chapter: BookOpen,
  branch: GitBranch,
  spinoff: Sparkles,
  story: BookOpen,
  character: User,
  wiki_page: BookOpen,
};

const targetTypeColors: Record<string, string> = {
  chapter:
    'bg-accent-50 text-accent-500 border-accent-200 dark:bg-accent-500/15 dark:text-accent-400 dark:border-accent-600',
  branch:
    'bg-purple-50 text-accent-500 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  spinoff:
    'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  story:
    'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  character:
    'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  wiki_page:
    'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
};

const targetTypeLabels: Record<string, string> = {
  chapter: '章节',
  branch: '分支',
  spinoff: '番外',
  story: '故事',
  character: '人物',
  wiki_page: '百科',
};

const guideTypeLabels: Record<string, string> = {
  chronological: '按时间顺序',
  character_focus: '聚焦特定角色',
  theme_exploration: '主题探索',
  completionist: '完整通关',
};

/* ─── Types ─── */

interface SelectedNode {
  nodeCategory: 'chapter' | 'branch' | 'spinoff' | 'story' | 'character' | 'wiki_page';
  contentId: string;
  title: string;
  introduction: string;
  note: string;
  storyId: string;
  storyTitle: string;
}

interface StoryBrief {
  id: string;
  title: string;
}

interface MapNode {
  id: string;
  title: string;
  category: 'chapter' | 'branch' | 'spinoff';
}

/* ─── Component ─── */

const ReadingPathCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const booklistId = searchParams.get('booklistId') || '';
  const storyIdParam = searchParams.get('storyId') || '';
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [guideType, setGuideType] = useState('chronological');

  const [booklist, setBooklist] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedNodes, setSelectedNodes] = useState<SelectedNode[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Story picker state (for creating without booklist)
  const [stories, setStories] = useState<StoryBrief[]>([]);
  const [storyId, setStoryId] = useState(storyIdParam);
  const [storyName, setStoryName] = useState('');
  const [storyMapNodes, setStoryMapNodes] = useState<MapNode[]>([]);
  const [showStoryPicker, setShowStoryPicker] = useState(!storyIdParam && !booklistId);
  const [storyLoading, setStoryLoading] = useState(false);

  useEffect(() => {
    if (booklistId) {
      setLoading(true);
      setFetchError(null);
      booklistService.getById(booklistId)
        .then((res: any) => {
          const data = res?.data || res;
          setBooklist(data);
          setItems(data?.items || []);
        })
        .catch(() => setFetchError('无法加载书单数据'))
        .finally(() => setLoading(false));
    } else if (storyId) {
      setLoading(true);
      setFetchError(null);
      client.get(`/stories/${storyId}`)
        .then((res) => {
          const data = res.data?.data || res.data;
          setStoryName(data.title || '');
          setItems([]);
        })
        .catch(() => setFetchError('无法加载故事数据'))
        .finally(() => setLoading(false));
      client.get(`/stories/${storyId}/map`)
        .then((res) => {
          const data = res.data;
          setStoryMapNodes(data.nodes || []);
        })
        .catch(() => {});
    } else {
      setLoading(false);
      // Fetch stories list for picker
      client.get('/stories', { params: { limit: 50 } })
        .then((res) => {
          const items = res.data?.items || res.data?.data || res.data || [];
          setStories(Array.isArray(items) ? items : []);
        })
        .catch(() => {});
    }
  }, [booklistId, storyId]);

  const selectStory = (sId: string, sTitle: string) => {
    setStoryId(sId);
    setStoryName(sTitle);
    setShowStoryPicker(false);
    setStoryLoading(true);
    client.get(`/stories/${sId}/map`)
      .then((res) => {
        setStoryMapNodes(res.data.nodes || []);
      })
      .catch(() => {})
      .finally(() => setStoryLoading(false));
  };

  const toggleNode = (item: any) => {
    const contentId = item.targetId;
    const existingIndex = selectedNodes.findIndex((n) => n.contentId === contentId);
    if (existingIndex >= 0) {
      setSelectedNodes((prev) => prev.filter((_, i) => i !== existingIndex));
    } else {
      setSelectedNodes((prev) => [
        ...prev,
        {
          nodeCategory: item.targetType,
          contentId,
          title: getItemTitle(item),
          introduction: '',
          note: item.notes || '',
          storyId: getItemStoryId(item),
          storyTitle: getItemStoryTitle(item),
        },
      ]);
    }
  };

  const toggleMapNode = (node: MapNode) => {
    const contentId = node.id.includes('-') ? node.id.split('-')[1] : node.id;
    const existingIndex = selectedNodes.findIndex((n) => n.contentId === contentId);
    if (existingIndex >= 0) {
      setSelectedNodes((prev) => prev.filter((_, i) => i !== existingIndex));
    } else {
      setSelectedNodes((prev) => [
        ...prev,
        {
          nodeCategory: node.category,
          contentId,
          title: node.title,
          introduction: '',
          note: '',
          storyId: storyId,
          storyTitle: storyName,
        },
      ]);
    }
  };

  const removeNode = (index: number) => {
    setSelectedNodes((prev) => prev.filter((_, i) => i !== index));
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

  const updateIntroduction = (index: number, introduction: string) => {
    setSelectedNodes((prev) => prev.map((n, i) => (i === index ? { ...n, introduction } : n)));
  };

  const updateNote = (index: number, note: string) => {
    setSelectedNodes((prev) => prev.map((n, i) => (i === index ? { ...n, note } : n)));
  };

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
        booklistId: booklistId || undefined,
        storyId: storyId || undefined,
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
      const data = res.data?.data || res.data;
      navigate(`/reading-path/${data.id}`);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error?.message || err?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const readableItems = items.filter(
    (item) => item.targetType === 'chapter' || item.targetType === 'branch' || item.targetType === 'spinoff'
  );
  const referenceItems = items.filter(
    (item) => item.targetType === 'story' || item.targetType === 'character' || item.targetType === 'wiki_page'
  );

  /* ── Render ── */

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <AlertCircle size={48} className="mx-auto text-ink-300 mb-4" />
        <h2 className="text-xl font-bold text-ink-800 dark:text-white mb-2">请先登录</h2>
        <p className="text-ink-500 mb-6">你需要登录后才能创建阅读路径</p>
        <Button onClick={() => navigate('/login')}>登录</Button>
      </div>
    );
  }

  if (!booklistId && !storyId && showStoryPicker) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 dark:hover:text-white transition-colors">
          <ArrowLeft size={16} /> 返回
        </button>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Route size={20} className="text-accent-400" />
            <span className="eyebrow text-accent-400">创建阅读路径</span>
          </div>
          <h1 className="text-2xl font-bold text-ink-800 dark:text-white">选择关联故事</h1>
          <p className="mt-1 text-sm text-ink-500">选择一篇故事，从它的内容中编排阅读路线</p>
        </div>

        <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 overflow-hidden">
          <div className="px-4 py-3 bg-ink-50 dark:bg-ink-700/50 border-b border-ink-100 dark:border-ink-700">
            <h3 className="text-sm font-bold text-ink-800 dark:text-white">故事列表</h3>
          </div>
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {stories.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-ink-400">加载中...</p>
              </div>
            ) : (
              stories.map((s) => (
                <button key={s.id} onClick={() => selectStory(s.id, s.title)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-ink-50 dark:hover:bg-ink-700/50 transition-colors">
                  <span className="w-9 h-9 rounded-xl bg-accent-50 dark:bg-accent-500/10 flex items-center justify-center text-accent-500 shrink-0">
                    <BookOpen size={16} />
                  </span>
                  <span className="text-sm font-bold text-ink-800 dark:text-white">{s.title}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs text-ink-400">也可以从</span>
          <Link to="/booklists" className="ml-1 text-xs text-accent-500 hover:underline font-medium">书单页面</Link>
          <span className="text-xs text-ink-400">创建阅读路径</span>
        </div>
      </div>
    );
  }

  const availableMapNodes = storyMapNodes.filter(
    (n) => n.category === 'chapter' || n.category === 'branch' || n.category === 'spinoff'
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 dark:hover:text-white transition-colors">
        <ArrowLeft size={16} /> 返回
      </button>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Route size={20} className="text-accent-400" />
          <span className="eyebrow text-accent-400">创建阅读路径</span>
        </div>
        <h1 className="text-2xl font-bold text-ink-800 dark:text-white">
          {booklist ? `基于「${booklist.title}」的路线` : storyName ? `「${storyName}」阅读路线` : '创建阅读路径'}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {booklist ? '从书单中选择内容，编排成一条阅读路线' : '从故事中选择章节/分支/番外，编排阅读顺序'}
        </p>
      </div>

      {/* Basic info + guideType */}
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
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(guideTypeLabels).map(([value, label]) => (
              <button key={value} onClick={() => setGuideType(value)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  guideType === value
                    ? 'border-accent-400 bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400'
                    : 'border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-700 text-ink-600 dark:text-ink-300 hover:border-accent-300 dark:hover:border-accent-600'
                }`}>
                {guideType === value && <Check size={14} className="shrink-0" />}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Story context (when not from booklist) */}
      {!booklistId && storyId && (
        <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Library size={14} className="text-ink-400" />
              <span className="text-xs font-bold text-ink-500">关联故事：</span>
              <span className="text-xs font-bold text-ink-800 dark:text-white">{storyName}</span>
            </div>
            <button onClick={() => setShowStoryPicker(true)}
              className="text-xs text-accent-500 hover:text-accent-600 font-bold">切换</button>
          </div>
        </div>
      )}

      {/* Selected nodes panel */}
      <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink-800 dark:text-white">
            已选节点
            {selectedNodes.length > 0 && (
              <span className="ml-2 text-xs font-normal text-ink-400">({selectedNodes.length})</span>
            )}
          </h3>
          {selectedNodes.length > 0 && (
            <button onClick={() => setSelectedNodes([])} className="text-xs text-red-500 hover:text-red-600 font-medium">清空</button>
          )}
        </div>

        {selectedNodes.length === 0 ? (
          <div className="py-8 text-center">
            <Route size={32} className="mx-auto text-ink-200 dark:text-ink-600 mb-2" />
            <p className="text-sm text-ink-400">还没有选择可阅读的节点</p>
            <p className="text-xs text-ink-300 dark:text-ink-500">从下方的内容列表中勾选章节、分支或番外</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {selectedNodes.map((node, i) => {
              const Icon = targetTypeIcons[node.nodeCategory] || BookOpen;
              const colorCls = targetTypeColors[node.nodeCategory] || targetTypeColors.chapter;
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
                  <div className="ml-8 mt-1.5 space-y-1">
                    <input type="text" value={node.introduction} onChange={(e) => updateIntroduction(i, e.target.value)}
                      placeholder="节点导读（选填，如：本章揭示了主角的身世）"
                      className="w-full text-xs text-ink-600 dark:text-ink-300 bg-transparent border border-transparent hover:border-ink-200 dark:hover:border-ink-600 focus:border-accent-400 focus:outline-none focus:ring-0 rounded-lg px-2 py-1 placeholder-ink-300 dark:placeholder-ink-500 transition-colors" />
                    <input type="text" value={node.note} onChange={(e) => updateNote(i, e.target.value)}
                      placeholder="推荐语（选填）"
                      className="w-full text-xs text-ink-400 bg-transparent border-0 border-b border-transparent hover:border-ink-200 focus:border-blue-400 focus:outline-none focus:ring-0 pb-0.5 placeholder-ink-300 dark:placeholder-ink-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item lists */}
      <div className="space-y-4">
        {/* From booklist items */}
        {booklistId && (
          <>
            <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 overflow-hidden">
              <div className="px-4 py-3 bg-ink-50 dark:bg-ink-700/50 border-b border-ink-100 dark:border-ink-700">
                <h3 className="text-sm font-bold text-ink-800 dark:text-white">可阅读的</h3>
                <p className="text-xs text-ink-500 mt-0.5">选择章节、分支或番外作为阅读路径节点</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-accent-400" />
                </div>
              ) : fetchError ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-ink-400">{fetchError}</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                  {readableItems.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-xs text-ink-400">该书单暂无可阅读的内容</p>
                    </div>
                  ) : (
                    readableItems.map((item, i) => {
                      const Icon = targetTypeIcons[item.targetType] || BookOpen;
                      const colorCls = targetTypeColors[item.targetType] || targetTypeColors.chapter;
                      const isSelected = selectedNodes.some((n) => n.contentId === item.targetId);
                      return (
                        <label key={`readable-${item.targetType}-${item.targetId}-${i}`}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                            isSelected ? 'bg-accent-50 dark:bg-accent-500/10' : 'hover:bg-ink-50 dark:hover:bg-ink-700/50'
                          }`}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleNode(item)}
                            className="w-4 h-4 rounded border-ink-300 text-accent-500 focus:ring-accent-400 focus:ring-offset-0" />
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border shrink-0 ${colorCls}`}>
                            <Icon size={14} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-ink-800 dark:text-white truncate">{getItemTitle(item)}</p>
                            {getItemSubtitle(item) && (
                              <p className="text-[10px] text-indigo-400 truncate">{getItemSubtitle(item)}</p>
                            )}
                          </div>
                          <span className="text-[10px] font-medium text-ink-400 shrink-0">{targetTypeLabels[item.targetType]}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {referenceItems.length > 0 && (
              <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 overflow-hidden">
                <div className="px-4 py-3 bg-ink-50 dark:bg-ink-700/50 border-b border-ink-100 dark:border-ink-700">
                  <h3 className="text-sm font-bold text-ink-800 dark:text-white">可参考的</h3>
                  <p className="text-xs text-ink-500 mt-0.5">这些内容可在阅读中作为参考资料查看</p>
                </div>

                <div className="p-2 space-y-1">
                  {referenceItems.map((item, i) => {
                    const Icon = targetTypeIcons[item.targetType] || BookOpen;
                    const colorCls = targetTypeColors[item.targetType] || targetTypeColors.story;
                    return (
                      <div key={`ref-${item.targetType}-${item.targetId}-${i}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-ink-50/50 dark:bg-ink-700/20 opacity-70">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border shrink-0 ${colorCls}`}>
                          <Icon size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-ink-800 dark:text-white truncate">{getItemTitle(item)}</p>
                          {getItemSubtitle(item) && (
                            <p className="text-[10px] text-indigo-400 truncate">{getItemSubtitle(item)}</p>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-800/20 text-accent-600 dark:text-accent-400 shrink-0">
                          阅读中可参考
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* From story map (when no booklist) */}
        {!booklistId && storyId && (
          <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 overflow-hidden">
            <div className="px-4 py-3 bg-ink-50 dark:bg-ink-700/50 border-b border-ink-100 dark:border-ink-700">
              <h3 className="text-sm font-bold text-ink-800 dark:text-white">故事内容</h3>
              <p className="text-xs text-ink-500 mt-0.5">选择章节、分支或番外作为阅读路径节点</p>
            </div>

            {storyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-accent-400" />
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                {availableMapNodes.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs text-ink-400">该故事暂无可用内容</p>
                  </div>
                ) : (
                  availableMapNodes.map((node, i) => {
                    const contentId = node.id.includes('-') ? node.id.split('-')[1] : node.id;
                    const Icon = targetTypeIcons[node.category] || BookOpen;
                    const colorCls = targetTypeColors[node.category] || targetTypeColors.chapter;
                    const isSelected = selectedNodes.some((n) => n.contentId === contentId);
                    return (
                      <label key={`map-${node.id}-${i}`}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                          isSelected ? 'bg-accent-50 dark:bg-accent-500/10' : 'hover:bg-ink-50 dark:hover:bg-ink-700/50'
                        }`}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleMapNode(node)}
                          className="w-4 h-4 rounded border-ink-300 text-accent-500 focus:ring-accent-400 focus:ring-offset-0" />
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border shrink-0 ${colorCls}`}>
                          <Icon size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-ink-800 dark:text-white truncate">{node.title}</p>
                        </div>
                        <span className="text-[10px] font-medium text-ink-400 shrink-0">{targetTypeLabels[node.category]}</span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
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
          {submitting ? '创建中…' : '创建阅读路径'}
        </Button>
      </div>
    </div>
  );
};

export default ReadingPathCreatePage;
