import { useState, useRef, useCallback } from 'react';
import type { Chapter, Branch, Spinoff } from '../../api/storyService';
import type { NodePreviewData } from './NodePreviewCard';

interface UseHoverPreviewOptions {
  chapters: Chapter[];
  branches: Branch[];
  spinoffs: Spinoff[];
  onHover?: (type: 'chapter' | 'branch' | 'spinoff', id: string) => void;
}

export function useHoverPreview({ chapters, branches, spinoffs, onHover }: UseHoverPreviewOptions) {
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
    if (rfNode.id.startsWith('cluster-') || rfNode.id.startsWith('collapse-')) return;

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
      onHover?.(type, data.id);
    }, 150);
  }, [buildHoverData, onHover]);

  const handleNodeMouseMove = useCallback((event: React.MouseEvent, _rfNode: any) => {
    if (!hoveredNode) return;
    setHoveredNode(prev => prev ? {
      ...prev,
      position: { x: event.clientX, y: event.clientY },
    } : null);
  }, [hoveredNode]);

  const handleNodeMouseLeave = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => {
      setHoveredNode(null);
    }, 100);
  }, []);

  return {
    hoveredNode,
    setHoveredNode,
    handleNodeMouseEnter,
    handleNodeMouseMove,
    handleNodeMouseLeave,
  };
}
