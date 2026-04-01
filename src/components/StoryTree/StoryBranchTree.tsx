import React, { useMemo } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  MiniMap, 
  Position, 
  MarkerType 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Chapter, Branch } from '../../api/storyService';
import { nodeTypes } from './CustomNodes';

interface StoryBranchTreeProps {
  chapters: Chapter[];
  branches: Branch[];
  readingHistory?: any[]; // 传入已读历史
  savepoints?: any[];      // 传入存档点
  onNodeClick?: (nodeId: string, type: 'chapter' | 'branch') => void;
}

const CHAPTER_X_STEP = 280;
const CHAPTER_Y = 80;
const BRANCH_Y_START = 280;
const BRANCH_Y_STEP = 130;

const StoryBranchTree: React.FC<StoryBranchTreeProps> = ({ 
  chapters, 
  branches, 
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
          isCertified: branch.isCertified,
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
          stroke: branch.isCertified ? '#f59e0b' : (branch.isOfficial ? '#f59e0b' : '#8b5cf6'), 
          strokeWidth: branch.isCertified ? 4 : 2.5, 
          strokeDasharray: isRead ? '0' : '8,4', // 已读分支实线，未读虚线
          opacity: isRead ? 1 : 0.6
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed, 
          color: branch.isCertified ? '#f59e0b' : (branch.isOfficial ? '#f59e0b' : '#8b5cf6') 
        },
      });
    });

    return { nodes, edges };
  }, [chapters, branches]);

  return (
    <div className="w-full h-[650px] border border-gray-200 dark:border-gray-800 rounded-[2rem] overflow-hidden bg-[#fafbff] dark:bg-gray-950 shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          let type: 'chapter' | 'branch';
          let id: string;

          if (node.id.startsWith('branch-')) {
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
            return (node.data as any).isOfficial ? '#f59e0b' : '#8b5cf6';
          }}
          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg"
        />
      </ReactFlow>
    </div>
  );
};

export default StoryBranchTree;
