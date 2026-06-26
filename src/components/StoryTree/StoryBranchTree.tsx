import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  type ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Chapter, Branch, Spinoff } from '../../api/storyService';
import { nodeTypes } from './CustomNodes';
import NodePreviewCard from './NodePreviewCard';
import TreeViewToggle, { ViewMode } from './TreeViewToggle';
import TreeContextMenu from './TreeContextMenu';
import { analytics } from '../../lib/analytics';
import { useTreeLayout } from './useTreeLayout';
import { useHoverPreview } from './useHoverPreview';

interface StoryBranchTreeProps {
  chapters: Chapter[];
  branches: Branch[];
  spinoffs?: Spinoff[];
  readingHistory?: any[];
  savepoints?: any[];
  onNodeClick?: (nodeId: string, type: 'chapter' | 'branch' | 'spinoff') => void;
  selectedChapterId?: string | null;
  storyId?: string;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  focusNodeId?: string;
  pathIds?: string[];
  onCopyLink?: (id: string, type: 'chapter' | 'branch' | 'spinoff') => void;
  onCreateBranch?: (chapterId: string) => void;
  onAddToBooklist?: (id: string, type: 'chapter' | 'branch' | 'spinoff') => void;
  onViewDetail?: (id: string, type: 'chapter' | 'branch' | 'spinoff') => void;
  onShare?: (id: string, type: 'chapter' | 'branch' | 'spinoff') => void;
}

const MINIMAP_THRESHOLD = 50;

const StoryBranchTree: React.FC<StoryBranchTreeProps> = ({ 
  chapters, 
  branches, 
  spinoffs = [], 
  readingHistory = [], 
  savepoints = [], 
  onNodeClick,
  selectedChapterId,
  storyId,
  viewMode,
  onViewModeChange,
  focusNodeId,
  pathIds,
  onCopyLink,
  onCreateBranch,
  onAddToBooklist,
  onViewDetail,
  onShare,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    open: boolean;
    position: { x: number; y: number };
    nodeType?: 'chapter' | 'branch' | 'spinoff';
    nodeId?: string;
  }>({ open: false, position: { x: 0, y: 0 } });

  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('panorama');
  const effectiveViewMode = viewMode ?? internalViewMode;
  const handleViewModeChange = onViewModeChange ?? setInternalViewMode;

  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstanceRef.current = instance;
  }, []);

  useEffect(() => {
    reactFlowInstanceRef.current?.fitView({ padding: effectiveViewMode === 'focus' ? 0.5 : 0.3, duration: 300 });
  }, [effectiveViewMode]);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: any) => {
    event.preventDefault();
    if (node.id.startsWith('cluster-') || node.id.startsWith('collapse-')) return;

    let nodeType: 'chapter' | 'branch' | 'spinoff';
    if (node.id.startsWith('spinoff-')) nodeType = 'spinoff';
    else if (node.id.startsWith('branch-')) nodeType = 'branch';
    else nodeType = 'chapter';

    const nodeId = node.id.replace(/^(chapter|branch|spinoff)-/, '');

    setContextMenu({
      open: true,
      position: { x: event.clientX, y: event.clientY },
      nodeType,
      nodeId,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, open: false }));
  }, []);

  const handleCopyLink = useCallback((id: string, type: 'chapter' | 'branch' | 'spinoff') => {
    onCopyLink?.(id, type);
    if (!onCopyLink) {
      navigator.clipboard.writeText(`${window.location.origin}/read/${storyId}/${type}/${id}`);
    }
  }, [onCopyLink, storyId]);

  const { nodes, edges, toggleCluster, isHeavy, nodeExtent, totalNodes, CHAPTER_X_STEP, BRANCH_Y_STEP } = useTreeLayout({
    chapters,
    branches,
    spinoffs,
    selectedChapterId,
    readingHistory,
    savepoints,
    onNodeClick,
    effectiveViewMode,
    focusNodeId,
    pathIds,
  });

  const onHover = useCallback((type: 'chapter' | 'branch' | 'spinoff', id: string) => {
    if (storyId) {
      analytics.trackNodeHover(type, id, storyId);
    }
  }, [storyId]);

  const { hoveredNode, setHoveredNode, handleNodeMouseEnter, handleNodeMouseMove, handleNodeMouseLeave } = useHoverPreview({
    chapters,
    branches,
    spinoffs,
    onHover,
  });

  return (
    <div className="w-full h-[650px] border border-ink-200 dark:border-ink-700 rounded-[2rem] overflow-hidden bg-[color:var(--color-surface)] dark:bg-ink-800 shadow-inner relative">
      <div className="absolute top-3 right-3 z-20">
        <TreeViewToggle value={effectiveViewMode} onChange={handleViewModeChange} />
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onlyRenderVisibleElements
        elevateNodesOnSelect={false}
        nodesDraggable={!isHeavy}
        nodesConnectable={false}
        elementsSelectable={!isHeavy}
        nodeExtent={nodeExtent}
        proOptions={{ hideAttribution: true }}
        key={`${CHAPTER_X_STEP}-${BRANCH_Y_STEP}`}
        onInit={onInit}
        onNodeContextMenu={handleNodeContextMenu}
        onNodeClick={(_, node) => {
          if (node.id.startsWith('cluster-')) {
            toggleCluster(node.id.slice(8));
            return;
          }
          if (node.id.startsWith('collapse-')) {
            toggleCluster(node.id.slice(9));
            return;
          }

          let type: 'chapter' | 'branch' | 'spinoff';
          let id: string;

          if (node.id.startsWith('spinoff-')) {
            type = 'spinoff';
            id = node.id.slice(8);
          } else if (node.id.startsWith('branch-')) {
            type = 'branch';
            id = node.id.slice(7);
          } else {
            type = 'chapter';
            id = node.id.slice(8);
          }
          
           if (storyId) {
             analytics.trackNodeClick(type, id, storyId);
           }
           onNodeClick?.(id, type);
        }}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseMove={handleNodeMouseMove}
        onNodeMouseLeave={handleNodeMouseLeave}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.15}
        maxZoom={1.8}
      >
        <Background color="var(--color-border)" gap={24} />
        <Controls className="bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-700 rounded-xl overflow-hidden shadow-lg" />
        {totalNodes <= MINIMAP_THRESHOLD && (
          <MiniMap 
            nodeColor={(node) => {
              if (node.type === 'chapter') return '#3b82f6';
              if (node.type === 'spinoff') return (node.data as any).isOfficial ? '#f59e0b' : '#818cf8';
              return (node.data as any).isOfficial ? '#f59e0b' : '#8b5cf6';
            }}
            className="bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-700 rounded-xl overflow-hidden shadow-lg"
          />
        )}
      </ReactFlow>

      {hoveredNode && (
        <NodePreviewCard
          node={hoveredNode.data}
          position={hoveredNode.position}
          onClose={() => setHoveredNode(null)}
          onClick={(id, type) => {
            setHoveredNode(null);
            onNodeClick?.(id, type);
          }}
        />
      )}

      <TreeContextMenu
        open={contextMenu.open}
        position={contextMenu.position}
        nodeType={contextMenu.nodeType}
        nodeId={contextMenu.nodeId}
        onClose={closeContextMenu}
        onCopyLink={handleCopyLink}
        onCreateBranch={onCreateBranch}
        onAddToBooklist={onAddToBooklist}
        onViewDetail={onViewDetail}
        onShare={onShare}
      />
    </div>
  );
};

export default StoryBranchTree;
