import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Route,
  Eye,
  BookOpen,
  GitBranch,
  Sparkles,
  ArrowLeft,
  Clock,
  User,
  Pencil,
  Play,
  ChevronRight,
  Users,
  Library,
} from 'lucide-react';
import client from '../../api/client';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToast } from '../../components/notifications';
import { getNodeIcon, getNodeColor, getCategoryLabel, getNodeLinkBase } from '../../utils/nodeMeta';

interface ReadingPathNode {
  id: string;
  sortOrder: number;
  nodeCategory: string;
  contentId: string;
  contentTitle: string;
  introduction: string | null;
  note: string | null;
  estimatedMin: number | null;
}

interface ReadingPathDetail {
  id: string;
  storyId?: string;
  booklistId?: string;
  booklist?: { id: string; title: string } | null;
  title: string;
  description: string | null;
  guideType: string | null;
  origin: string;
  creator: { id: string; username: string; avatarUrl: string | null };
  viewCount: number;
  startCount: number;
  completionCount: number;
  nodeCount: number;
  createdAt: string;
  nodes: ReadingPathNode[];
}

const guideTypeLabels: Record<string, { label: string; color: string }> = {
  chronological: { label: '按时间顺序', color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  character_focus: { label: '聚焦角色', color: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
  theme_exploration: { label: '主题探索', color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' },
  completionist: { label: '完整通关', color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
};

interface CharacterBrief {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  description: string | null;
}

interface NodeCharacter {
  id: string;
  appearanceType: string;
  note: string | null;
  character: CharacterBrief;
}

const ReadingPathDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const [path, setPath] = useState<ReadingPathDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingRead, setStartingRead] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // ── Character guide state ──
  const [allCharacters, setAllCharacters] = useState<CharacterBrief[]>([]);
  const [nodeCharacterMap, setNodeCharacterMap] = useState<Record<string, NodeCharacter[]>>({});
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [hoveredCharacterId, setHoveredCharacterId] = useState<string | null>(null);

  // Which node IDs have the selected character?
  const highlightedNodeIds = useMemo(() => {
    if (!selectedCharacterId) return new Set<string>();
    const set = new Set<string>();
    for (const [nodeId, chars] of Object.entries(nodeCharacterMap)) {
      if (chars.some((c) => c.character.id === selectedCharacterId)) {
        set.add(nodeId);
      }
    }
    return set;
  }, [selectedCharacterId, nodeCharacterMap]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const fetchPath = client.get(`/reading-paths/${id}`).then((res) => {
      const data = res.data;
      setPath(data);
      // Record view
      client.post(`/reading-paths/${id}/view`).catch(() => {});
    });

    const fetchCharacters = client
      .get(`/reading-paths/${id}/characters`)
      .then((res) => {
        const data = res.data;
        setAllCharacters(data.allCharacters?.map((a: any) => a.character) ?? []);
        setNodeCharacterMap(data.nodeCharacterMap ?? {});
      })
      .catch(() => {
        // Character data is optional — fail silently
      });

    Promise.all([fetchPath, fetchCharacters])
      .catch((err) => {
        setError(err?.response?.data?.error?.message || '阅读路径不存在');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const getNodeLink = (node: ReadingPathNode): string => {
    // 携带阅读路径上下文，便于 ReadPage 识别来源并回写进度。
    // 阶段 1 仅注入参数，ReadPage 暂未消费会安全降级。
    const base = getNodeLinkBase(node.nodeCategory, node.contentId);
    return id && base !== '#' ? `${base}?ctx=path:${id}` : base;
  };

  const handleStartReading = async () => {
    if (!id) return;
    if (!user) {
      navigate(`/login?redirect=/reading-path/${id}`);
      return;
    }
    setStartingRead(true);
    try {
      const res = await client.post(`/reading-paths/${id}/start`);
      const trailId = res.data?.id;
      if (trailId) {
        navigate(`/reading-path/trail/${trailId}`);
      }
    } catch (err: any) {
      addToast('error', err?.response?.data?.error?.message || '开始阅读失败，请重试');
    } finally {
      setStartingRead(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-ink-100 dark:bg-ink-700 rounded w-2/3" />
          <div className="h-4 bg-ink-100 dark:bg-ink-700 rounded w-1/2" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-ink-100 dark:bg-ink-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center">
        <Route size={48} className="mx-auto text-ink-300 mb-4" />
        <h2 className="text-xl font-bold text-ink-800 dark:text-white mb-2">阅读路径未找到</h2>
        <p className="text-ink-500 mb-6">{error || '该阅读路径不存在或已被删除'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-ink-100 dark:bg-ink-700 rounded-xl text-sm font-bold hover:bg-ink-200 dark:hover:bg-ink-600 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ── Sticky header bar ── */}
      <div
        className={`fixed top-14 inset-x-0 z-30 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 dark:bg-ink-800/90 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-ink-100 dark:border-ink-700 translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Route size={18} className="text-accent-500 shrink-0" />
            <span className="text-sm font-bold text-ink-800 dark:text-white truncate">{path.title}</span>
          </div>
          <button
            onClick={handleStartReading}
            disabled={startingRead}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent-500 text-white text-xs font-bold hover:bg-accent-600 disabled:opacity-50 transition-colors shrink-0"
          >
            <Play size={14} />
            {startingRead ? '加载中...' : user ? '开始阅读' : '登录后阅读'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>

        {/* ── Hero Header ── */}
        <div ref={headerRef} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500 via-purple-500 to-pink-500 p-8 md:p-10 text-white shadow-2xl shadow-accent-500/20">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Route size={20} className="text-white/70" />
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                阅读路径 · {path.origin === 'author' ? '作者原创' : '社区精选'}
              </span>
              {path.guideType && guideTypeLabels[path.guideType] && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${guideTypeLabels[path.guideType].color} bg-opacity-80`}>
                  {guideTypeLabels[path.guideType].label}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{path.title}</h1>
              {path.description && (
                <p className="mt-3 text-white/80 leading-relaxed max-w-2xl">{path.description}</p>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
              <span className="flex items-center gap-1.5">
                <User size={14} />
                {path.creator.username}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={14} />
                {path.viewCount} 次浏览
              </span>
              <span className="flex items-center gap-1.5">
                <Route size={14} />
                {path.nodeCount} 个节点
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {new Date(path.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>

            {/* Parent booklist link */}
            {path.booklist && (
              <div className="mt-3">
                <Link to={`/booklist/${path.booklist.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-medium transition-colors backdrop-blur-sm">
                  <Library size={14} />
                  来自书单：{path.booklist.title}
                </Link>
              </div>
            )}

            {/* ── Hero CTA ── */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleStartReading}
                disabled={startingRead}
                className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-ink-50 text-accent-600 text-base font-semibold shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 transition-all duration-300"
              >
                <Play size={20} className="fill-accent-600 group-hover:translate-x-0.5 transition-transform" />
                {startingRead ? '加载中...' : user ? '开始阅读' : '登录后开始阅读'}
                <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </button>

              {user && path.creator.id === user.id && (
                <Link
                  to={`/reading-path/edit/${path.id}`}
                  className="flex items-center gap-1.5 px-5 py-3.5 rounded-2xl bg-white/15 backdrop-blur-sm text-white text-sm font-bold border border-white/20 hover:bg-white/25 transition-all"
                >
                  <Pencil size={16} />
                  编辑路径
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Character Gallery ── */}
        {allCharacters.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink-800 dark:text-white px-1 flex items-center gap-2">
              <Users size={20} className="text-accent-500" />
              出场角色
              <span className="text-xs font-normal text-ink-400">({allCharacters.length})</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {allCharacters.map((char) => (
                <button
                  key={char.id}
                  onClick={() =>
                    setSelectedCharacterId(
                      selectedCharacterId === char.id ? null : char.id,
                    )
                  }
                  onMouseEnter={() => setHoveredCharacterId(char.id)}
                  onMouseLeave={() => setHoveredCharacterId(null)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                    selectedCharacterId === char.id
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10 shadow-md shadow-accent-500/10'
                      : 'border-transparent bg-ink-50 dark:bg-ink-800 hover:bg-ink-100 dark:hover:bg-ink-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-accent-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {char.avatarUrl ? (
                      <img
                        src={char.avatarUrl}
                        alt={char.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      char.name[0]
                    )}
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-sm font-bold text-ink-800 dark:text-white">
                      {char.name}
                    </div>
                    <div className="text-[10px] text-ink-400">
                      {char.role === 'protagonist'
                        ? '主角'
                        : char.role === 'antagonist'
                          ? '反派'
                          : '配角'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {selectedCharacterId && (
              <p className="text-xs text-ink-400 px-1">
                已筛选: 只显示{' '}
                {allCharacters.find((c) => c.id === selectedCharacterId)?.name}{' '}
                出场的节点
                <button
                  onClick={() => setSelectedCharacterId(null)}
                  className="ml-2 text-accent-500 hover:underline font-medium"
                >
                  清除筛选
                </button>
              </p>
        )}
        </div>
      )}

      </div> {/* ── end max-w-3xl hero section ── */}

      {/* ── Two-column nodes section ── */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left sidebar: node map */}
          <aside className="w-full lg:w-64 lg:shrink-0">
            <div className="lg:sticky lg:top-24 space-y-3">
              <h2 className="text-lg font-bold text-ink-800 dark:text-white">节点地图</h2>
              <nav className="space-y-0.5 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                {path.nodes.map((node, index) => {
                  const Icon = getNodeIcon(node.nodeCategory);
                  return (
                    <Link key={node.id} to={getNodeLink(node)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-ink-500 hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors"
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-ink-100 dark:bg-ink-600 text-ink-400 shrink-0">
                        {index + 1}
                      </span>
                      <Icon size={12} className="shrink-0" />
                      <span className="truncate flex-1">{node.contentTitle}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Right: detailed nodes */}
          <div className="flex-1 min-w-0">
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-ink-800 dark:text-white px-1">阅读顺序</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-ink-200 dark:bg-ink-600" />

            <div className="space-y-3">
              {path.nodes.map((node, index) => {
                const Icon = getNodeIcon(node.nodeCategory);
                const colorClass = getNodeColor(node.nodeCategory);
                const nodeChars = nodeCharacterMap[node.id] ?? [];
                const isDimmed =
                  selectedCharacterId != null &&
                  !nodeChars.some((c) => c.character.id === selectedCharacterId);

                return (
                  <Link
                    key={node.id}
                    to={getNodeLink(node)}
                    className={`relative flex items-start gap-4 pl-0 group transition-opacity duration-300 ${
                      isDimmed ? 'opacity-30' : ''
                    }`}
                  >
                    {/* Number badge */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 shrink-0 transition-all ${
                        isDimmed
                          ? 'bg-ink-100 dark:bg-ink-700 border-ink-200 dark:border-ink-600'
                          : 'bg-ink-50 dark:bg-ink-800 border-ink-200 dark:border-ink-600 group-hover:border-accent-400 dark:group-hover:border-accent-500'
                      }`}
                    >
                      <span
                        className={`text-xs font-bold transition-colors ${
                          isDimmed
                            ? 'text-ink-300'
                            : 'text-ink-500 group-hover:text-accent-500'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </div>

                    {/* Content card */}
                    <div
                      className={`flex-1 min-w-0 rounded-xl border p-4 transition-all ${
                        isDimmed
                          ? 'bg-ink-50/50 dark:bg-ink-800/30 border-ink-100 dark:border-ink-700'
                          : 'bg-ink-50 dark:bg-ink-800 border-ink-100 dark:border-ink-700 group-hover:shadow-md group-hover:border-accent-200 dark:group-hover:border-indigo-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colorClass}`}
                            >
                              <Icon size={10} />
                              {getCategoryLabel(node.nodeCategory)}
                            </span>
                            {node.estimatedMin && (
                              <span className="text-[10px] text-ink-400">
                                {node.estimatedMin} 分钟
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-ink-800 dark:text-white truncate">
                            {node.contentTitle}
                          </h4>
                          {node.introduction && (
                            <p className="mt-0.5 text-xs text-accent-500 dark:text-accent-400 line-clamp-2 italic">
                              {node.introduction}
                            </p>
                          )}
                          {node.note && node.note !== node.contentTitle && (
                            <p className="mt-0.5 text-xs text-ink-400 line-clamp-1">
                              {node.note}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ── Character avatars per node ── */}
                      {nodeChars.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-ink-200/50 dark:border-ink-700/50">
                          <div className="flex -space-x-1.5">
                            {nodeChars.map((nc) => {
                              const isHighlighted =
                                selectedCharacterId == null ||
                                selectedCharacterId === nc.character.id;
                              return (
                                <div
                                  key={nc.id}
                                  title={`${nc.character.name} — ${nc.appearanceType === 'main_focus' ? '重点' : nc.appearanceType === 'mention' ? '提及' : nc.appearanceType === 'cameo' ? '客串' : '出场'}`}
                                  className={`w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-accent-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white dark:ring-ink-900 transition-all ${
                                    isHighlighted
                                      ? 'opacity-100'
                                      : 'opacity-30'
                                  }`}
                                >
                                  {nc.character.avatarUrl ? (
                                    <img
                                      src={nc.character.avatarUrl}
                                      alt={nc.character.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    nc.character.name[0]
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <span className="text-[10px] text-ink-400 ml-1">
                            {nodeChars.length === 1
                              ? '1 位角色'
                              : `${nodeChars.length} 位角色`}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* ── Mobile bottom bar ── */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-ink-50/95 dark:bg-ink-800/95 backdrop-blur-xl border-t border-ink-100 dark:border-ink-700 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink-800 dark:text-white truncate">{path.title}</p>
            <p className="text-xs text-ink-400">{path.nodeCount} 个节点 · {path.viewCount} 次浏览</p>
          </div>
          <button
            onClick={handleStartReading}
            disabled={startingRead}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-accent-500 text-white text-sm font-bold hover:bg-accent-600 disabled:opacity-50 transition-colors shrink-0 ml-4"
          >
            <Play size={16} className="fill-white" />
            {startingRead ? '加载中...' : user ? '开始阅读' : '登录后阅读'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReadingPathDetailPage;
