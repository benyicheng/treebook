import React, { useMemo } from 'react';
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

const CHAPTER_X_STEP = 280;
const CHAPTER_Y = 80;
const BRANCH_Y_START = 280;
const BRANCH_Y_STEP = 130;

const StoryBranchTree: React.FC<StoryBranchTreeProps> = ({ 
  chapters, 
  branches, 
  spinoffs = [], 
  readingHistory = [], 
  savepoints = [], 
  onNodeClick 
}) => {
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

    // 按 parentChapterId 分组分支，避免同一分叉点的分支节点重叠
    const branchesByParent: Record<string, Branch[]> = {};
    branches.forEach(branch => {
      const pid = branch.parentChapterId;
      if (!branchesByParent[pid]) branchesByParent[pid] = [];
      branchesByParent[pid].push(branch);
    });

    // 渲染分支节点（同一父节点的分支竖向错开）
    branches.forEach((branch) => {
      const parentX = chapterXMap[branch.parentChapterId];
      // 如果找不到父章节坐标（可能父章节是分支章节，不太可能但防御），放在最左侧
      const xPos = parentX !== undefined ? parentX : 0;

      // 计算当前分支在同父节点下的索引
      const siblingsGroup = branchesByParent[branch.parentChapterId] || [];
      const siblingIndex = siblingsGroup.findIndex(b => b.id === branch.id);

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
        position: { x: xPos, y: BRANCH_Y_START + siblingIndex * BRANCH_Y_STEP },
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
          strokeDasharray: isRead ? '0' : '8,4', // 已读分支实线，未读虚线
          opacity: isRead ? 1 : 0.6
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed, 
          color: (branch as any).isCertified ? '#f59e0b' : (branch.isOfficial ? '#f59e0b' : '#8b5cf6') 
        },
      });
    });

    // === 番外节点 (Spinoffs) ===
    if (spinoffs.length > 0) {
      // 计算分支区域的最大纵坐标，决定番外的起始行
      const branchSlotCounts = Object.values(branchesByParent).map(g => g.length);
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
  }, [chapters, branches, spinoffs]);

  return (
    <div className="w-full h-[650px] border border-gray-200 dark:border-gray-800 rounded-[2rem] overflow-hidden bg-[#fafbff] dark:bg-gray-950 shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
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
        <Controls className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg" />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'chapter') return '#3b82f6';
            if (node.type === 'spinoff') return (node.data as any).isOfficial ? '#f59e0b' : '#818cf8';
            return (node.data as any).isOfficial ? '#f59e0b' : '#8b5cf6';
          }}
          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg"
        />
      </ReactFlow>
    </div>
  );
};

export default StoryBranchTree;
