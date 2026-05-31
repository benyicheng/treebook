import React, { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  BookOpen,
  GitBranch,
  Sparkles,
  Clock,
  User,
  Route,
} from 'lucide-react';
import { useTrail } from '../../hooks/useReadingPaths';
import { toast } from '../../lib/toast';
import { TrailData, TrailNode } from '../../hooks/useReadingPaths';

const getNodeLink = (node: TrailNode): string => {
  switch (node.nodeCategory) {
    case 'chapter':
      return `/read/${node.contentId}`;
    case 'branch':
      return `/branch/${node.contentId}`;
    case 'spinoff':
      return `/spinoff/${node.contentId}`;
    default:
      return '#';
  }
};

const getNodeIcon = (category: string) => {
  switch (category) {
    case 'chapter':
      return BookOpen;
    case 'branch':
      return GitBranch;
    case 'spinoff':
      return Sparkles;
    default:
      return BookOpen;
  }
};

const getNodeColor = (category: string) => {
  switch (category) {
    case 'chapter':
      return 'text-accent-500 bg-accent-50 border-accent-200';
    case 'branch':
      return 'text-accent-500 bg-purple-50 border-purple-200';
    case 'spinoff':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    default:
      return 'text-ink-500 bg-ink-50 border-ink-200';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'chapter':
      return '章节';
    case 'branch':
      return '分支';
    case 'spinoff':
      return '番外';
    default:
      return category;
  }
};

const ReadingTrailPage: React.FC = () => {
  const { trailId } = useParams<{ trailId: string }>();
  const navigate = useNavigate();

  // ── Data fetching with React Query ──
  const { data: trail, isLoading, error } = useTrail(trailId!);

  // ── Local UI state ──
  const [advancing, setAdvancing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Derive from trail data
  const nodes = trail?.path.nodes || [];
  const totalNodes = nodes.length;
  const currentNode = nodes[trail?.currentNodeIndex ?? -1];

  // Check completion state
  if (trail?.completedAt) {
    setIsCompleted(true);
  }

  const handleAdvance = useCallback(async () => {
    if (!trailId || advancing) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/reading-paths/trails/${trailId}/advance`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.data?.isCompleted || data.isCompleted) {
        setIsCompleted(true);
      } else {
        const newIndex = data.data?.currentNodeIndex ?? data.currentNodeIndex;
        if (trail) {
          trail.currentNodeIndex = newIndex;
        }
      }
    } catch (err: any) {
      toast(err?.message || '操作失败', 'error');
    } finally {
      setAdvancing(false);
    }
  }, [trailId, advancing, trail]);

  const handleBackToPath = useCallback(() => {
    if (trail?.pathId) {
      navigate(`/reading-path/${trail.pathId}`);
    } else {
      navigate(-1);
    }
  }, [trail, navigate]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-ink-100 rounded w-2/3" />
          <div className="h-32 bg-ink-100 rounded-xl" />
          <div className="h-12 bg-ink-100 rounded-xl w-1/3" />
        </div>
      </div>
    );
  }

  if (error || !trail) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <Route size={48} className="mx-auto text-ink-300 mb-4" />
        <h2 className="text-xl font-bold text-ink-800 mb-2">阅读记录未找到</h2>
        <p className="text-ink-500 mb-6">{error?.message || '阅读记录不存在'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-ink-100 rounded-xl text-sm font-bold hover:bg-ink-200 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  // Completion state
  if (isCompleted || trail.currentNodeIndex >= totalNodes) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
        <h1 className="text-2xl font-black text-ink-800 mb-2">阅读完成！</h1>
        <p className="text-ink-500 mb-2">
          你已读完全部 {totalNodes} 个节点的「{trail.path.title}」
        </p>
        <p className="text-sm text-ink-400 mb-8">
          <Clock size={14} className="inline mr-1" />
          完成于 {new Date().toLocaleDateString('zh-CN')}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleBackToPath}
            className="px-6 py-2.5 bg-accent-400 text-white rounded-xl text-sm font-bold hover:bg-accent-500 transition-colors"
          >
            返回阅读路径
          </button>
        </div>
      </div>
    );
  }

  const NodeIcon = currentNode ? getNodeIcon(currentNode.nodeCategory) : BookOpen;
  const colorClass = currentNode ? getNodeColor(currentNode.nodeCategory) : '';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToPath}
          className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 transition-colors"
        >
          <ArrowLeft size={16} />
          {trail.path.title}
        </button>
        <span className="text-sm text-ink-400">
          {trail.currentNodeIndex + 1} / {totalNodes}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-ink-100 rounded-full h-2">
        <div
          className="bg-accent-400 h-2 rounded-full transition-all duration-500"
          style={{ width: `${((trail.currentNodeIndex + 1) / totalNodes) * 100}%` }}
        />
      </div>

      {/* Current node */}
      {currentNode ? (
        <div className="bg-white border border-ink-200 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorClass}`}
            >
              <NodeIcon size={12} />
              {getCategoryLabel(currentNode.nodeCategory)}
            </span>
            <span className="text-xs text-ink-400">
              节点 {trail.currentNodeIndex + 1}
            </span>
          </div>

          <h2 className="text-xl font-bold text-ink-800">{currentNode.contentTitle}</h2>

          {currentNode.note && currentNode.note !== currentNode.contentTitle && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong className="text-xs uppercase tracking-wider">导游提示：</strong>
                {currentNode.note}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Link
              to={getNodeLink(currentNode)}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent-400 text-white rounded-xl text-sm font-bold hover:bg-accent-500 transition-colors"
            >
              <Play size={16} />
              去阅读
            </Link>

            <button
              onClick={handleAdvance}
              disabled={advancing}
              className="flex items-center gap-2 px-5 py-2.5 border border-ink-200 text-ink-600 rounded-xl text-sm font-bold hover:bg-ink-50 disabled:opacity-50 transition-colors"
            >
              <ArrowRight size={16} />
              {advancing ? '处理中...' : '已完成此节点，继续'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-ink-200 rounded-2xl p-8 text-center">
          <p className="text-ink-500">当前没有可阅读的节点</p>
          <button
            onClick={handleBackToPath}
            className="mt-4 px-6 py-2 bg-ink-100 rounded-xl text-sm font-bold hover:bg-ink-200 transition-colors"
          >
            返回
          </button>
        </div>
      )}

      {/* Node list preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-ink-500 px-1">全部节点</h3>
        <div className="space-y-1">
          {nodes.map((node: any, idx: number) => {
            const Icon = getNodeIcon(node.nodeCategory);
            const isCurrent = idx === trail.currentNodeIndex;
            const isDone = idx < trail.currentNodeIndex;

            return (
              <div
                key={node.id}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  isCurrent
                    ? 'bg-accent-50 border border-accent-200 font-bold text-accent-600'
                    : isDone
                      ? 'bg-ink-50 text-ink-400'
                      : 'bg-white border border-ink-100 text-ink-500'
                }`}
              >
                {isDone ? (
                  <CheckCircle size={16} className="text-green-500 shrink-0" />
                ) : (
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-accent-400 text-white'
                        : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                )}
                <Icon size={14} className="shrink-0" />
                <span className="truncate">{node.contentTitle}</span>
                <span className="text-[10px] text-ink-400 shrink-0">
                  {getCategoryLabel(node.nodeCategory)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReadingTrailPage;
