import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  MiniMap, 
  MarkerType,
  type ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Chapter, Branch, Spinoff } from '../../api/storyService';
import { nodeTypes } from './CustomNodes';
import NodePreviewCard, { NodePreviewData } from './NodePreviewCard';
import TreeViewToggle, { ViewMode } from './TreeViewToggle';
import TreeContextMenu from './TreeContextMenu';
import { analytics } from '../../lib/analytics';

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

// Dynamic spacing: larger viewports get more spacing
const useDynamicSpacing = () => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  if (width < 768) return { xStep: 200, yStep: 110, chapterY: 60 };
  if (width < 1024) return { xStep: 240, yStep: 120, chapterY: 70 };
  return { xStep: 280, yStep: 130, chapterY: 80 };
};

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
  const { xStep, yStep, chapterY } = useDynamicSpacing();

  // ─── Hover preview state ───
  const [hoveredNode, setHoveredNode] = useState<{ data: NodePreviewData; position: { x: number; y: number } } | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildHoverData = useCallback((nodeData: any, nodeType: 'chapter' | 'branch' | 'spinoff', rfNode: any): NodePreviewData | null => {
    if (nodeType === 'chapter') {
      const ch = chapters.find(c => c.id === rfNode.id.slice(8));
      if (!ch) return null;
      return {
        id: ch.id,
        type: 'chapter',
        title: ch.title,
        description: ch.content?.slice(0, 200),
        orderIndex: ch.orderIndex,
        wordCount: ch.content?.length || 0,
        estimatedMinutes: Math.max(1, Math.round((ch.content?.length || 0) / 500)),
        status: (ch as any).status,
      };
    }
    if (nodeType === 'branch') {
      const br = branches.find(b => b.id === rfNode.id.slice(7));
      if (!br) return null;
      return {
        id: br.id,
        type: 'branch',
        title: br.title,
        description: br.description,
        authorName: br.author?.username,
        status: br.status,
        wordCount: (br as any)._count?.chapters ? (br as any)._count.chapters * 500 : undefined,
      };
    }
    if (nodeType === 'spinoff') {
      const sp = spinoffs.find(s => s.id === rfNode.id.slice(8));
      if (!sp) return null;
      return {
        id: sp.id,
        type: 'spinoff',
        title: sp.title || '番外',
        description: sp.summary,
        authorName: sp.author?.username,
        status: sp.status,
        wordCount: sp.content?.length || 0,
        estimatedMinutes: Math.max(1, Math.round((sp.content?.length || 0) / 500)),
      };
    }
    return null;
  }, [chapters, branches, spinoffs]);

  const handleNodeMouseEnter = useCallback((_event: React.MouseEvent, rfNode: any) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    // Skip cluster/collapse nodes
    if (rfNode.id.startsWith('cluster-') || rfNode.id.startsWith('collapse-')) return;

    // Determine node type
    let type: 'chapter' | 'branch' | 'spinoff';
    if (rfNode.id.startsWith('spinoff-')) type = 'spinoff';
    else if (rfNode.id.startsWith('branch-')) type = 'branch';
    else if (rfNode.id.startsWith('chapter-')) type = 'chapter';
    else return;

    showTimer.current = setTimeout(() => {
      const data = buildHoverData(null, type, rfNode);
      if (!data) return;
      const rect = (document.querySelector('.react-flow__renderer') as HTMLElement)?.getBoundingClientRect();
      const mousePos = _event as unknown as MouseEvent;
      setHoveredNode({
        data,
        position: {
          x: mousePos.clientX || rect?.left || 0,
          y: mousePos.clientY || rect?.top || 0,
        },
      });
      // Analytics tracking
      if (storyId) {
        analytics.trackNodeHover(type, data.id, storyId);
      }
    }, 150); // 150ms debounce
  }, [buildHoverData, storyId]);

  const handleNodeMouseMove = useCallback((event: React.MouseEvent, _rfNode: any) => {
    if (!hoveredNode) return;
    // Update card position to follow mouse
    setHoveredNode(prev => prev ? {
      ...prev,
      position: { x: event.clientX, y: event.clientY },
    } : null);
  }, [hoveredNode]);

  const handleNodeMouseLeave = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => {
      setHoveredNode(null);
    }, 100); // 100ms close delay
  }, []);

  // Filter spinoffs when a chapter is selected
  const displayedSpinoffs = useMemo(() => {
    if (!selectedChapterId) return spinoffs;
    const branchIds = new Set(
      branches
        .filter(b => b.parentChapterId === selectedChapterId)
        .map(b => b.id)
    );
    return spinoffs.filter(
      s => s.originalChapterId === selectedChapterId || (s.originalBranchId != null && branchIds.has(s.originalBranchId))
    );
  }, [selectedChapterId, spinoffs, branches]);
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

  const BRANCH_Y_START = 280;
  const BRANCH_Y_STEP = yStep;
  const CHAPTER_X_STEP = xStep;
  const CHAPTER_Y = chapterY;

  const CLUSTER_THRESHOLD = 5;
  const MINIMAP_THRESHOLD = 50;

  const totalNodes = chapters.length + branches.length + (displayedSpinoffs.length || 0);

  const isHeavy = totalNodes > 50;

  const nodeExtent = useMemo(() => {
    if (!isHeavy) return undefined;
    const maxCol = Math.max(chapters.length, branches.length, 1);
    return [
      [-400, -200],
      [maxCol * xStep + 600, BRANCH_Y_START + maxCol * yStep + 500],
    ] as [[number, number], [number, number]];
  }, [isHeavy, chapters.length, branches.length, xStep, yStep]);

  // 展开/折叠状态：记录哪些父章的分支群被展开了
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());

  const toggleCluster = useCallback((parentChapterId: string) => {
    setExpandedClusters(prev => {
      const next = new Set(prev);
      if (next.has(parentChapterId)) {
        next.delete(parentChapterId);
      } else {
        next.add(parentChapterId);
      }
      return next;
    });
  }, []);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 映射已读状态和存档点
    const readChapterIds = new Set(readingHistory.map(h => h.chapterId));
    const savepointChapterIds = new Set(savepoints.map(s => s.chapterId));
    const readBranchIds = new Set(readingHistory.filter(h => h.chapter?.branchId).map(h => h.chapter.branchId));

    // 只取主线章节（branchId 为 null/undefined）并按顺序排列
    const mainlineChapters = chapters
      .filter(c => !c.branchId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    // 建立 chapterId → x坐标 映射（仅用主线章节计算位置）
    const chapterXMap: Record<string, number> = {};
    mainlineChapters.forEach((chapter, index) => {
      chapterXMap[chapter.id] = index * CHAPTER_X_STEP;
    });

    // 渲染主线章节节点
    mainlineChapters.forEach((chapter, index) => {
      nodes.push({
        id: `chapter-${chapter.id}`,
        type: 'chapter',
        data: { 
          label: chapter.title,
          orderIndex: chapter.orderIndex,
          isRead: readChapterIds.has(chapter.id),
          hasSavepoint: savepointChapterIds.has(chapter.id),
          onActivate: onNodeClick,
          type: 'chapter',
        },
        position: { x: chapterXMap[chapter.id], y: CHAPTER_Y },
      });

      if (index > 0) {
        edges.push({
          id: `edge-chapter-${mainlineChapters[index - 1].id}-${chapter.id}`,
          source: `chapter-${mainlineChapters[index - 1].id}`,
          target: `chapter-${chapter.id}`,
          animated: false,
          style: { stroke: '#3b82f6', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
        });
      }
    });

    // 分离子分支与顶级分支
    const subBranchesByParent: Record<string, Branch[]> = {};
    const topLevelBranches: Branch[] = [];

    branches.forEach(branch => {
      if (branch.parentBranchId) {
        if (!subBranchesByParent[branch.parentBranchId]) subBranchesByParent[branch.parentBranchId] = [];
        subBranchesByParent[branch.parentBranchId].push(branch);
      } else {
        topLevelBranches.push(branch);
      }
    });

    // 按 parentChapterId 分组顶级分支
    const branchesByParent: Record<string, Branch[]> = {};
    topLevelBranches.forEach(branch => {
      const pid = branch.parentChapterId;
      if (!branchesByParent[pid]) branchesByParent[pid] = [];
      branchesByParent[pid].push(branch);
    });

    // 跟踪已放置的分支 Y 坐标（用于子分支定位）
    const branchYMap: Record<string, number> = {};
    const SUB_BRANCH_Y_STEP = 100;

    // 递归渲染子分支
    const renderSubBranches = (parentBranchId: string, startX: number, startY: number, depth: number) => {
      const children = subBranchesByParent[parentBranchId];
      if (!children || children.length === 0) return;

      // 按 treeDepth 排序，保证顺序
      const sorted = [...children].sort((a, b) => (a.treeDepth ?? 0) - (b.treeDepth ?? 0));

      sorted.forEach((subBranch, index) => {
        const isRead = readBranchIds.has(subBranch.id);
        const subY = startY + (index + 1) * SUB_BRANCH_Y_STEP;
        const subX = startX + depth * 40; // 逐层微偏右

        branchYMap[subBranch.id] = subY;

        nodes.push({
          id: `branch-${subBranch.id}`,
          type: 'branch',
          data: {
            label: subBranch.title,
            isOfficial: subBranch.isOfficial,
            isCertified: (subBranch as any).isCertified,
            isHot: (subBranch.viewCount || 0) > 100,
            isRead,
            chapterCount: (subBranch as any)._count?.chapters ?? 0,
            authorName: subBranch.author?.username,
            isSubBranch: true,
            onActivate: onNodeClick,
          },
          position: { x: subX, y: subY },
        });

        edges.push({
          id: `edge-sub-branch-${subBranch.id}`,
          source: `branch-${parentBranchId}`,
          target: `branch-${subBranch.id}`,
          animated: true,
          style: {
            stroke: (subBranch as any).isCertified ? '#f59e0b' : '#a78bfa',
            strokeWidth: 2,
            strokeDasharray: '6,3',
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: (subBranch as any).isCertified ? '#f59e0b' : '#a78bfa' },
        });

        // 递归渲染更深层的子分支
        renderSubBranches(subBranch.id, subX, subY, depth + 1);
      });
    };

    // 渲染顶级分支节点（带聚类折叠）
    Object.entries(branchesByParent).forEach(([parentChapterId, groupBranches]) => {
      const parentX = chapterXMap[parentChapterId];
      const xPos = parentX !== undefined ? parentX : 0;
      const isExpanded = expandedClusters.has(parentChapterId);
      const useCluster = !isExpanded && groupBranches.length > CLUSTER_THRESHOLD;

      if (useCluster) {
        // 折叠态：显示单个「平行宇宙群」节点
        nodes.push({
          id: `cluster-${parentChapterId}`,
          type: 'branchCluster',
          data: { count: groupBranches.length, onToggle: () => toggleCluster(parentChapterId) },
          position: { x: xPos, y: BRANCH_Y_START },
          draggable: false,
        });
        edges.push({
          id: `edge-cluster-${parentChapterId}`,
          source: `chapter-${parentChapterId}`,
          sourceHandle: 'branch',
          target: `cluster-${parentChapterId}`,
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
        });
      } else {
        // 展开态或小群组：渲染独立分支节点
        groupBranches.forEach((branch, index) => {
          const isRead = readBranchIds.has(branch.id);
          const branchY = BRANCH_Y_START + index * BRANCH_Y_STEP;
          branchYMap[branch.id] = branchY;

          nodes.push({
            id: `branch-${branch.id}`,
            type: 'branch',
            data: { 
              label: branch.title,
              isOfficial: branch.isOfficial,
              isCertified: (branch as any).isCertified,
              isHot: (branch.viewCount || 0) > 100,
              isRead,
              chapterCount: (branch as any)._count?.chapters ?? 0,
              authorName: branch.author?.username,
              isSubBranch: false,
              onActivate: onNodeClick,
            },
            position: { x: xPos, y: branchY },
          });

          edges.push({
            id: `edge-branch-${branch.id}`,
            source: `chapter-${branch.parentChapterId}`,
            sourceHandle: 'branch',
            target: `branch-${branch.id}`,
            animated: true,
            style: { 
              stroke: (branch as any).isCertified ? '#f59e0b' : (branch.isOfficial ? '#f59e0b' : '#8b5cf6'), 
              strokeWidth: (branch as any).isCertified ? 4 : 2.5, 
              strokeDasharray: isRead ? '0' : '8,4',
              opacity: isRead ? 1 : 0.6
            },
            markerEnd: { 
              type: MarkerType.ArrowClosed, 
              color: (branch as any).isCertified ? '#f59e0b' : (branch.isOfficial ? '#f59e0b' : '#8b5cf6') 
            },
          });

          // 渲染该分支的子分支
          renderSubBranches(branch.id, xPos, branchY, 1);
        });

        // 展开态：在群组上方添加「收起」按钮
        if (isExpanded && groupBranches.length > CLUSTER_THRESHOLD) {
          nodes.push({
            id: `collapse-${parentChapterId}`,
            type: 'collapseButton',
            data: { count: groupBranches.length, onToggle: () => toggleCluster(parentChapterId) },
            position: { x: xPos, y: BRANCH_Y_START - 45 },
            draggable: false,
            selectable: false,
          });
        }
      }
    });

    // === 番外节点 (Spinoffs) ===
    if (displayedSpinoffs.length > 0) {
      // 计算分支区域的最大纵坐标（折叠群算 1 个槽位）
      const branchSlotCounts = Object.entries(branchesByParent).map(([pid, g]) => {
        const isExpanded = expandedClusters.has(pid);
        const useCluster = !isExpanded && g.length > CLUSTER_THRESHOLD;
        return useCluster ? 1 : g.length;
      });
      const maxBranchSlots = Math.max(1, ...branchSlotCounts, 0);
      const spinoffY = BRANCH_Y_START + maxBranchSlots * BRANCH_Y_STEP + 80;

      // 主线中点 x（用于无分支关联的番外定位）
      const mainlineMidX = mainlineChapters.length > 0
        ? (chapterXMap[mainlineChapters[0].id] + chapterXMap[mainlineChapters[mainlineChapters.length - 1].id]) / 2
        : 0;

      // 分离有分支关联和无分支的番外
      const spinoffsWithBranch = displayedSpinoffs.filter(s => s.originalBranchId);
      const spinoffsWithoutBranch = displayedSpinoffs.filter(s => !s.originalBranchId);

      // 无分支关联的番外：居中排列
      spinoffsWithoutBranch.forEach((spinoff, index) => {
        // 确定关联章节：如果有 originalChapterId 且在主文章节中，用该章节位置；否则居中
        const chapterId = spinoff.originalChapterId;
        const hasChapter = !!chapterId && chapterXMap[chapterId] !== undefined;
        const sourceChapterId = hasChapter ? chapterId : (mainlineChapters.length > 0 ? mainlineChapters[0].id : null);
        const xPos = hasChapter
          ? chapterXMap[chapterId]
          : (mainlineMidX + (index - (spinoffsWithoutBranch.length - 1) / 2) * CHAPTER_X_STEP);

        nodes.push({
          id: `spinoff-${spinoff.id}`,
          type: 'spinoff',
          data: {
            label: spinoff.title || '番外',
            spinoffType: spinoff.type,
            isOfficial: spinoff.isOfficial,
            authorName: spinoff.author?.username,
            onActivate: onNodeClick,
          },
          position: { x: xPos, y: spinoffY },
        });

        // 连接到对应的章节（有 originalChapterId 则连到该章，否则连到第一章）
        if (sourceChapterId) {
          edges.push({
            id: `edge-spinoff-${spinoff.id}`,
            source: `chapter-${sourceChapterId}`,
            target: `spinoff-${spinoff.id}`,
            animated: true,
            style: {
              stroke: spinoff.isOfficial ? '#f59e0b' : '#818cf8',
              strokeWidth: 2,
              strokeDasharray: '6,4',
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: spinoff.isOfficial ? '#f59e0b' : '#818cf8' },
          });
        }
      });

      // 有分支关联的番外：排列在对应分支下方
      spinoffsWithBranch.forEach((spinoff, index) => {
        nodes.push({
          id: `spinoff-${spinoff.id}`,
          type: 'spinoff',
          data: {
            label: spinoff.title || '番外',
            spinoffType: spinoff.type,
            isOfficial: spinoff.isOfficial,
            authorName: spinoff.author?.username,
            onActivate: onNodeClick,
          },
          position: { x: mainlineMidX + (index - (spinoffsWithBranch.length - 1) / 2) * CHAPTER_X_STEP, y: spinoffY + 120 },
        });

        edges.push({
          id: `edge-spinoff-${spinoff.id}`,
          source: `branch-${spinoff.originalBranchId}`,
          target: `spinoff-${spinoff.id}`,
          animated: true,
          style: {
            stroke: spinoff.isOfficial ? '#f59e0b' : '#818cf8',
            strokeWidth: 2,
            strokeDasharray: '6,4',
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: spinoff.isOfficial ? '#f59e0b' : '#818cf8' },
        });
      });
    }

    // ─── Apply view mode transformations ───
    if (effectiveViewMode === 'focus' && focusNodeId) {
      nodes.forEach(n => {
        const rawId = n.id.replace(/^(chapter|branch|spinoff)-/, '');
        n.data = { ...n.data, viewModeModifier: rawId === focusNodeId ? 'focus' : 'dimmed' };
      });
      edges.forEach(e => {
        const src = e.source.replace(/^(chapter|branch|spinoff)-/, '');
        const tgt = e.target.replace(/^(chapter|branch|spinoff)-/, '');
        if (src !== focusNodeId && tgt !== focusNodeId) {
          e.style = { ...e.style, opacity: 0.15 };
        }
      });
    } else if (effectiveViewMode === 'path' && pathIds?.length) {
      const pathSet = new Set(pathIds);
      nodes.forEach(n => {
        const rawId = n.id.replace(/^(chapter|branch|spinoff)-/, '');
        n.data = { ...n.data, viewModeModifier: pathSet.has(rawId) ? 'highlighted' : 'dimmed' };
      });
      edges.forEach(e => {
        const src = e.source.replace(/^(chapter|branch|spinoff)-/, '');
        const tgt = e.target.replace(/^(chapter|branch|spinoff)-/, '');
        if (pathSet.has(src) && pathSet.has(tgt)) {
          e.style = { ...e.style, stroke: '#f59e0b', strokeWidth: 4, opacity: 1 };
          e.markerEnd = { ...(e.markerEnd as any), color: '#f59e0b' };
          e.animated = true;
        } else {
          e.style = { ...e.style, opacity: 0.2 };
        }
      });
    }

    if (isHeavy) {
      edges.forEach(e => { e.animated = false; });
    }

    return { nodes, edges };
  }, [chapters, branches, displayedSpinoffs, expandedClusters, CHAPTER_X_STEP, CHAPTER_Y, BRANCH_Y_START, BRANCH_Y_STEP, readingHistory, savepoints, effectiveViewMode, focusNodeId, pathIds, isHeavy]);

  return (
    <div className="w-full h-[650px] border border-ink-200 dark:border-ink-700 rounded-[2rem] overflow-hidden bg-[#fafbff] dark:bg-ink-800 shadow-inner relative">
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
          // 聚类节点点击 → 展开
          if (node.id.startsWith('cluster-')) {
            toggleCluster(node.id.slice(8));
            return;
          }
          // 收起按钮点击 → 折叠
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
          
           // Analytics tracking
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
        <Background color="#dde1f0" gap={24} />
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

      {/* Node Hover Preview */}
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

      {/* Right-click Context Menu */}
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
