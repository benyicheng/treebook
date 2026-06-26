import { useMemo, useState, useCallback } from 'react';
import { MarkerType } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import type { Chapter, Branch, Spinoff } from '../../api/storyService';

const useDynamicSpacing = () => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  if (width < 768) return { xStep: 200, yStep: 110, chapterY: 60 };
  if (width < 1024) return { xStep: 240, yStep: 120, chapterY: 70 };
  return { xStep: 280, yStep: 130, chapterY: 80 };
};

interface UseTreeLayoutOptions {
  chapters: Chapter[];
  branches: Branch[];
  spinoffs: Spinoff[];
  selectedChapterId?: string | null;
  readingHistory: any[];
  savepoints: any[];
  onNodeClick?: (nodeId: string, type: 'chapter' | 'branch' | 'spinoff') => void;
  effectiveViewMode: string;
  focusNodeId?: string;
  pathIds?: string[];
}

export function useTreeLayout({
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
}: UseTreeLayoutOptions) {
  const { xStep, yStep, chapterY } = useDynamicSpacing();

  const BRANCH_Y_START = 280;
  const BRANCH_Y_STEP = yStep;
  const CHAPTER_X_STEP = xStep;
  const CHAPTER_Y = chapterY;

  const CLUSTER_THRESHOLD = 5;
  const MINIMAP_THRESHOLD = 50;

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

  const totalNodes = chapters.length + branches.length + (displayedSpinoffs.length || 0);

  const isHeavy = totalNodes > 50;

  const nodeExtent = useMemo(() => {
    if (!isHeavy) return undefined;
    const maxCol = Math.max(chapters.length, branches.length, 1);
    return [
      [-400, -200],
      [maxCol * xStep + 600, BRANCH_Y_START + maxCol * yStep + 500],
    ] as [[number, number], [number, number]];
  }, [isHeavy, chapters.length, branches.length, xStep, yStep, BRANCH_Y_START]);

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

    const readChapterIds = new Set(readingHistory.map(h => h.chapterId));
    const savepointChapterIds = new Set(savepoints.map(s => s.chapterId));
    const readBranchIds = new Set(readingHistory.filter(h => h.chapter?.branchId).map(h => h.chapter.branchId));

    const mainlineChapters = chapters
      .filter(c => !c.branchId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const chapterXMap: Record<string, number> = {};
    mainlineChapters.forEach((chapter, index) => {
      chapterXMap[chapter.id] = index * CHAPTER_X_STEP;
    });

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

    const branchesByParent: Record<string, Branch[]> = {};
    topLevelBranches.forEach(branch => {
      const pid = branch.parentChapterId;
      if (!branchesByParent[pid]) branchesByParent[pid] = [];
      branchesByParent[pid].push(branch);
    });

    const branchYMap: Record<string, number> = {};
    const SUB_BRANCH_Y_STEP = 100;

    const renderSubBranches = (parentBranchId: string, startX: number, startY: number, depth: number) => {
      const children = subBranchesByParent[parentBranchId];
      if (!children || children.length === 0) return;

      const sorted = [...children].sort((a, b) => (a.treeDepth ?? 0) - (b.treeDepth ?? 0));

      sorted.forEach((subBranch, index) => {
        const isRead = readBranchIds.has(subBranch.id);
        const subY = startY + (index + 1) * SUB_BRANCH_Y_STEP;
        const subX = startX + depth * 40;

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

        renderSubBranches(subBranch.id, subX, subY, depth + 1);
      });
    };

    Object.entries(branchesByParent).forEach(([parentChapterId, groupBranches]) => {
      const parentX = chapterXMap[parentChapterId];
      const xPos = parentX !== undefined ? parentX : 0;
      const isExpanded = expandedClusters.has(parentChapterId);
      const useCluster = !isExpanded && groupBranches.length > CLUSTER_THRESHOLD;

      if (useCluster) {
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

          renderSubBranches(branch.id, xPos, branchY, 1);
        });

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

    if (displayedSpinoffs.length > 0) {
      const branchSlotCounts = Object.entries(branchesByParent).map(([pid, g]) => {
        const isExpanded = expandedClusters.has(pid);
        const useCluster = !isExpanded && g.length > CLUSTER_THRESHOLD;
        return useCluster ? 1 : g.length;
      });
      const maxBranchSlots = Math.max(1, ...branchSlotCounts, 0);
      const spinoffY = BRANCH_Y_START + maxBranchSlots * BRANCH_Y_STEP + 80;

      const mainlineMidX = mainlineChapters.length > 0
        ? (chapterXMap[mainlineChapters[0].id] + chapterXMap[mainlineChapters[mainlineChapters.length - 1].id]) / 2
        : 0;

      const spinoffsWithBranch = displayedSpinoffs.filter(s => s.originalBranchId);
      const spinoffsWithoutBranch = displayedSpinoffs.filter(s => !s.originalBranchId);

      spinoffsWithoutBranch.forEach((spinoff, index) => {
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

  return {
    nodes,
    edges,
    expandedClusters,
    toggleCluster,
    isHeavy,
    nodeExtent,
    totalNodes,
    CHAPTER_X_STEP,
    BRANCH_Y_STEP,
  };
}
