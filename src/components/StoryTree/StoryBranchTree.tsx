import React, { useMemo, useState, useCallback } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  MiniMap, 
  MarkerType 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Chapter, Branch, Spinoff } from '../../api/storyService';
import { nodeTypes } from './CustomNodes';

interface StoryBranchTreeProps {
  chapters: Chapter[];
  branches: Branch[];
  spinoffs?: Spinoff[];
  readingHistory?: any[]; // 传入已读历史
  savepoints?: any[];      // 传入存档点
  onNodeClick?: (nodeId: string, type: 'chapter' | 'branch' | 'spinoff') => void;
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
  onNodeClick 
}) => {
  const { xStep, yStep, chapterY } = useDynamicSpacing();
  const BRANCH_Y_START = 280;
  const BRANCH_Y_STEP = yStep;
  const CHAPTER_X_STEP = xStep;
  const CHAPTER_Y = chapterY;

  // 性能阈值
  const CLUSTER_THRESHOLD = 5;   // 同父章 >5 个分支时折叠
  const MINIMAP_THRESHOLD = 30;  // 总节点 >30 时隐藏 MiniMap

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

    // 按 parentChapterId 分组分支
    const branchesByParent: Record<string, Branch[]> = {};
    branches.forEach(branch => {
      const pid = branch.parentChapterId;
      if (!branchesByParent[pid]) branchesByParent[pid] = [];
      branchesByParent[pid].push(branch);
    });

    // 渲染分支节点（带聚类折叠）
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
            },
            position: { x: xPos, y: BRANCH_Y_START + index * BRANCH_Y_STEP },
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
    if (spinoffs.length > 0) {
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
      const spinoffsWithBranch = spinoffs.filter(s => s.originalBranchId);
      const spinoffsWithoutBranch = spinoffs.filter(s => !s.originalBranchId);

      // 无分支关联的番外：居中排列
      spinoffsWithoutBranch.forEach((spinoff, index) => {
        const xPos = mainlineMidX + (index - (spinoffsWithoutBranch.length - 1) / 2) * CHAPTER_X_STEP;

        nodes.push({
          id: `spinoff-${spinoff.id}`,
          type: 'spinoff',
          data: {
            label: spinoff.title || '番外',
            spinoffType: spinoff.type,
            isOfficial: spinoff.isOfficial,
            authorName: spinoff.author?.username,
          },
          position: { x: xPos, y: spinoffY },
        });

        // 从第一个主线章节连接到番外（表达「故事衍生」）
        if (mainlineChapters.length > 0) {
          edges.push({
            id: `edge-spinoff-${spinoff.id}`,
            source: `chapter-${mainlineChapters[0].id}`,
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

    return { nodes, edges };
  }, [chapters, branches, spinoffs, expandedClusters, CHAPTER_X_STEP, CHAPTER_Y, BRANCH_Y_START, BRANCH_Y_STEP, readingHistory, savepoints]);

  const totalNodes = chapters.length + branches.length + (spinoffs?.length || 0);

  return (
    <div className="w-full h-[650px] border border-ink-200 dark:border-ink-700 rounded-[2rem] overflow-hidden bg-[#fafbff] dark:bg-ink-800 shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onlyRenderVisibleElements
        elevateNodesOnSelect={false}
        proOptions={{ hideAttribution: true }}
        key={`${CHAPTER_X_STEP}-${BRANCH_Y_STEP}`}
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
          
          onNodeClick?.(id, type);
        }}
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
    </div>
  );
};

export default StoryBranchTree;
