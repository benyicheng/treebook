import React, { useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useBooklistGraph, useCreateRelation, useDeleteRelation } from '../../../hooks/useBooklists';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useToast } from '../../../components/notifications';
import { Plus, X, Link2 } from 'lucide-react';
import { Modal } from '../../../components/ui';

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

const BooklistGraph: React.FC<BooklistGraphProps> = ({ booklistId }) => {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const { data: graphData, isLoading } = useBooklistGraph(booklistId);
  const createRelation = useCreateRelation();
  const deleteRelation = useDeleteRelation();

  // Add relation modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRelation, setNewRelation] = useState({ sourceItemId: '', targetItemId: '', relationType: 'REFERENCE' });

  const graph = graphData?.data ?? graphData;
  const items = graph?.items ?? [];
  const relations = graph?.relations ?? [];

  // Build React Flow nodes from items
  const initialNodes: Node[] = useMemo(() => {
    return items.map((item: any, index: number) => ({
      id: item.id,
      type: 'default',
      position: {
        x: (index % 4) * 280 + 50,
        y: Math.floor(index / 4) * 200 + 50,
      },
      data: {
        label: item.chapter?.title || item.targetId || `条目 ${index + 1}`,
        notes: item.notes,
        storyTitle: item.chapter?.story?.title,
      },
      style: {
        background: '#f8fafc',
        border: '2px solid #6366f1',
        borderRadius: 12,
        padding: '12px 16px',
        fontSize: 13,
        fontWeight: 600,
        minWidth: 200,
        boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
      },
    }));
  }, [items]);

  // Build React Flow edges from relations
  const initialEdges: Edge[] = useMemo(() => {
    return relations.map((rel: any) => ({
      id: rel.id,
      source: rel.sourceItemId,
      target: rel.targetItemId,
      label: relationLabels[rel.relationType] || rel.relationType,
      style: {
        stroke: relationColors[rel.relationType] || '#94a3b8',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: relationColors[rel.relationType] || '#94a3b8',
      },
      animated: true,
      labelStyle: { fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 4,
    }));
  }, [relations]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

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
      setNewRelation({ sourceItemId: '', targetItemId: '', relationType: 'REFERENCE' });
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
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
            <strong className="text-indigo-500">{graph.nodes || items.length}</strong> 个节点
          </span>
          <span className="text-ink-500">
            <strong className="text-indigo-500">{graph.edges || relations.length}</strong> 条连线
          </span>
        </div>
        {user && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors"
          >
            <Plus size={16} />
            添加关系
          </button>
        )}
      </div>

      {/* Graph canvas */}
      <div className="bg-white dark:bg-ink-700 rounded-3xl border border-ink-100 dark:border-ink-600 overflow-hidden" style={{ height: 600 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.3}
          maxZoom={2}
        >
          <Controls />
          <Background color="#e2e8f0" gap={20} />
          <MiniMap
            nodeStrokeColor="#6366f1"
            nodeColor="#e0e7ff"
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
            <select
              className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 outline-none text-sm"
              value={newRelation.sourceItemId}
              onChange={e => setNewRelation(prev => ({ ...prev, sourceItemId: e.target.value }))}
            >
              <option value="">选择源条目</option>
              {items.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.chapter?.title || item.targetId || item.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-ink-500 mb-1 block">目标条目</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 outline-none text-sm"
              value={newRelation.targetItemId}
              onChange={e => setNewRelation(prev => ({ ...prev, targetItemId: e.target.value }))}
            >
              <option value="">选择目标条目</option>
              {items.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.chapter?.title || item.targetId || item.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-ink-500 mb-1 block">关系类型</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 outline-none text-sm"
              value={newRelation.relationType}
              onChange={e => setNewRelation(prev => ({ ...prev, relationType: e.target.value }))}
            >
              {Object.entries(relationLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddRelation}
            disabled={createRelation.isPending}
            className="w-full py-3 bg-indigo-500 text-white rounded-xl font-black hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            {createRelation.isPending ? '添加中...' : '确认添加'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default BooklistGraph;
