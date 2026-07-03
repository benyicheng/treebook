import React, { useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { useBooklistGraph, useCreateRelation, useDeleteRelation } from '../../../hooks/useBooklists';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useToast } from '../../../components/notifications';
import { Plus, X, Link2 } from 'lucide-react';
import { Modal, Select, Button, Badge } from '../../../components/ui';

interface BooklistGraphProps {
  booklistId: string;
}

const relationColors: Record<string, string> = {
  SAME_CHARACTER: '#8b5cf6',
  ALTERNATE_INTERPRETATION: '#f59e0b',
  SHARED_UNIVERSE: '#06b6d4',
  TIMELINE_FORK: '#ef4444',
  PARALLEL_EVENT: '#10b981',
  PRECEDING_EVENT: '#6366f1',
  CHARACTER_CAMEO: '#ec4899',
  BACKGROUND_REFERENCE: '#6b7280',
};

const relationLabels: Record<string, string> = {
  SAME_CHARACTER: '同角色',
  ALTERNATE_INTERPRETATION: '另类解读',
  SHARED_UNIVERSE: '共享宇宙',
  TIMELINE_FORK: '分叉点',
  PARALLEL_EVENT: '平行事件',
  PRECEDING_EVENT: '前序事件',
  CHARACTER_CAMEO: '客串',
  BACKGROUND_REFERENCE: '背景引用',
};

const contentTypeLabels: Record<string, string> = {
  character: '角色',
  setting: '设定',
  event: '事件',
  concept: '概念',
  faction: '势力',
  item: '物品',
};

const GraphNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="px-3 py-2">
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-bold text-ink-800 leading-tight">{data.label}</span>
        {data.isWiki && (
          <Badge tone="success" variant="solid" size="sm">
            百科
          </Badge>
        )}
      </div>
      {data.storyTitle && (
        <div className="text-[11px] text-ink-400 truncate">{data.storyTitle}</div>
      )}
      {data.isWiki && data.wikiContentType && (
        <div className="mt-1">
          <Badge tone="success" variant="outline" size="sm">
            {contentTypeLabels[data.wikiContentType] || data.wikiContentType}
          </Badge>
        </div>
      )}
      {data.notes && (
        <div className="mt-1 text-[11px] text-ink-500 italic line-clamp-2">{data.notes}</div>
      )}
    </div>
  );
};

const nodeTypes = { default: GraphNode };

const BooklistGraph: React.FC<BooklistGraphProps> = ({ booklistId }) => {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { data: graphData, isLoading } = useBooklistGraph(booklistId);
  const createRelation = useCreateRelation();
  const deleteRelation = useDeleteRelation();

  // Add relation modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRelation, setNewRelation] = useState({ sourceItemId: '', targetItemId: '', relationType: 'BACKGROUND_REFERENCE' });

  const graph = graphData?.data ?? graphData;
  const items = graph?.items ?? [];
  const relations = graph?.relations ?? [];

  // Build React Flow nodes from items
  const initialNodes: Node[] = useMemo(() => {
    return items.map((item: any, index: number) => {
      const isWiki = item.targetType === 'wiki';
      const wiki = item.wiki;
      const spinoff = item.spinoff;
      const branch = item.branch;
      const label = isWiki && wiki ? wiki.title : (item.chapter?.title || spinoff?.title || branch?.title || item.targetId || `条目 ${index + 1}`);
      return {
        id: item.id,
        type: 'default',
        position: {
          x: (index % 4) * 280 + 50,
          y: Math.floor(index / 4) * 200 + 50,
        },
        data: {
          label,
          notes: item.notes,
          storyTitle: item.chapter?.story?.title,
          isWiki,
          targetId: item.targetId,
          wikiContentType: wiki?.contentType,
          wikiSummary: wiki?.summary,
        },
        style: {
          background: isWiki ? 'var(--color-surface-2)' : 'var(--color-surface)',
          border: isWiki ? '2px solid #22c55e' : '2px solid var(--color-accent)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          minWidth: 220,
          boxShadow: isWiki
            ? '0 2px 8px rgba(34,197,94,0.15)'
            : '0 2px 8px rgba(99,102,241,0.15)',
        },
      };
    });
  }, [items]);

  // Build React Flow edges from relations
  const initialEdges: Edge[] = useMemo(() => {
    return relations.map((rel: any) => ({
      id: rel.id,
      source: rel.sourceItemId,
      target: rel.targetItemId,
      label: relationLabels[rel.relationType] || rel.relationType,
      style: {
        stroke: relationColors[rel.relationType] || 'var(--color-text-muted)',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: relationColors[rel.relationType] || 'var(--color-text-muted)',
      },
      animated: true,
      labelStyle: { fontSize: 'var(--text-xs)', fontWeight: 600 },
      labelBgStyle: { fill: 'var(--color-surface)', fillOpacity: 0.9 },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 4,
    }));
  }, [relations]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.data.isWiki && node.data.targetId) {
      navigate(`/wiki/${node.data.targetId}`);
    }
  }, [navigate]);

  const handleAddRelation = async () => {
    if (!newRelation.sourceItemId || !newRelation.targetItemId) {
      addToast('warning', '请选择源和目标条目');
      return;
    }
    try {
      await createRelation.mutateAsync({
        booklistId,
        data: {
          sourceItemId: newRelation.sourceItemId,
          targetItemId: newRelation.targetItemId,
          relationType: newRelation.relationType,
        },
      });
      setIsAddModalOpen(false);
      setNewRelation({ sourceItemId: '', targetItemId: '', relationType: 'BACKGROUND_REFERENCE' });
      addToast('success', '关系已创建');
    } catch {
      addToast('error', '创建关系失败');
    }
  };

  const handleDeleteRelation = async (relationId: string) => {
    try {
      await deleteRelation.mutateAsync({ booklistId, relationId });
    } catch {
      addToast('error', '删除关系失败');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500" />
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="text-center py-20 text-ink-400 font-medium">
        无法加载关系图数据
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between bg-white dark:bg-ink-700 rounded-2xl border border-ink-100 dark:border-ink-600 p-4">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-ink-500">
            <strong className="text-accent-500">{graph.nodes || items.length}</strong> 个节点
          </span>
          <span className="text-ink-500">
            <strong className="text-accent-500">{graph.edges || relations.length}</strong> 条连线
          </span>
        </div>
        {user && (
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
          >
            添加关系
          </Button>
        )}
      </div>

      {/* Graph canvas */}
      <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 overflow-hidden" style={{ height: 600 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.3}
          maxZoom={2}
        >
          <Controls />
          <Background color="var(--color-border)" gap={20} />
          <MiniMap
            nodeStrokeColor="var(--color-accent)"
            nodeColor="var(--color-surface-2)"
            nodeBorderRadius={8}
            style={{ width: 150, height: 100 }}
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-ink-700 rounded-2xl border border-ink-100 dark:border-ink-600 p-4">
        <h4 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2">关系图例</h4>
        <div className="flex flex-wrap gap-3">
          {Object.entries(relationLabels).map(([key, label]) => (
            <span key={key} className="inline-flex items-center gap-1.5 text-xs text-ink-500">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: relationColors[key] }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Add Relation Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="添加关系">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-ink-500 mb-1 block">源条目</label>
            <Select
              size="md"
              wrapperClassName="w-full"
              value={newRelation.sourceItemId}
              onChange={e => setNewRelation(prev => ({ ...prev, sourceItemId: e.target.value }))}
            >
              <option value="">选择源条目</option>
              {items.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.chapter?.title || item.wiki?.title || item.spinoff?.title || item.branch?.title || item.targetId || item.id.slice(0, 8)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-bold text-ink-500 mb-1 block">目标条目</label>
            <Select
              size="md"
              wrapperClassName="w-full"
              value={newRelation.targetItemId}
              onChange={e => setNewRelation(prev => ({ ...prev, targetItemId: e.target.value }))}
            >
              <option value="">选择目标条目</option>
              {items.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.chapter?.title || item.wiki?.title || item.spinoff?.title || item.branch?.title || item.targetId || item.id.slice(0, 8)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-bold text-ink-500 mb-1 block">关系类型</label>
            <Select
              size="md"
              wrapperClassName="w-full"
              value={newRelation.relationType}
              onChange={e => setNewRelation(prev => ({ ...prev, relationType: e.target.value }))}
            >
              {Object.entries(relationLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
          <Button
            onClick={handleAddRelation}
            disabled={createRelation.isPending}
            variant="primary"
            size="md"
            fullWidth
          >
            {createRelation.isPending ? '添加中...' : '确认添加'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default BooklistGraph;
