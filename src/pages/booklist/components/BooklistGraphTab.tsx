import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NetworkIcon, Link2, GitBranch, BookOpen, FileText, Sparkles, Calendar, Star, ChevronRight, RotateCcw, ZoomIn, ZoomOut, Move, Trash2, Plus } from 'lucide-react';
import { EmptyState, Select, Button, IconButton, Badge } from '../../../components/ui';
import { useBooklistGraph, useCreateRelation, useDeleteRelation } from '../../../hooks/useBooklists';
import { useToast } from '../../../components/notifications';

interface BooklistGraphTabProps {
  booklist: any;
  booklistId: string;
  isCreator?: boolean;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'chapter' | 'branch' | 'wiki' | 'spinoff' | 'event';
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  targetId?: string;
  parentChapterId?: string;
  storyId?: string;
}

interface GraphLink {
  from: string;
  to: string;
  type: 'mainline' | 'branch' | 'wiki' | 'spinoff' | 'event' | 'relation';
  label?: string | null;
}

/** 自定义关系类型预设 */
const RELATION_TYPES: { value: string; label: string }[] = [
  { value: 'related', label: '关联' },
  { value: 'reference', label: '引用' },
  { value: 'contrast', label: '对比' },
  { value: 'sequel', label: '续作' },
  { value: 'prequel', label: '前传' },
  { value: 'foreshadow', label: '伏笔' },
];
const relationTypeLabel = (t: string) => RELATION_TYPES.find((r) => r.value === t)?.label || t;

export const BooklistGraphTab: React.FC<BooklistGraphTabProps> = ({ booklist, booklistId, isCreator }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // 关系管理表单状态
  const [relSource, setRelSource] = useState('');
  const [relTarget, setRelTarget] = useState('');
  const [relType, setRelType] = useState('related');
  const [relLabel, setRelLabel] = useState('');

  const { addToast } = useToast();
  const { data: graphData } = useBooklistGraph(booklistId);
  const relations: any[] = graphData?.relations || [];
  const createRelation = useCreateRelation();
  const deleteRelation = useDeleteRelation();

  const b = booklist || {};

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.clientWidth - 32, 1200);
        const height = Math.max(400, Math.floor(width * 0.75));
        setCanvasSize({ width, height });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const chapters = (b.itemsBySection?.mainline || b.items || []).filter((it: any) => it.chapterId);
    const branches = (b.itemsBySection?.branch || []);
    const wikiPages = (b.itemsBySection?.wiki || []);
    const spinoffs = (b.itemsBySection?.spinoff || []);
    const events = (b.items || []).filter((it: any) => it.targetType === 'event');

    const newNodes: GraphNode[] = [];
    const newLinks: GraphLink[] = [];
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    if (chapters.length > 0) {
      const radius = Math.min(canvasSize.width * 0.25, 100 + chapters.length * 8);
      chapters.forEach((chapter: any, i: number) => {
        const angle = (i / chapters.length) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        newNodes.push({
          id: chapter.id,
          label: chapter.chapter?.title || `章节${i + 1}`,
          type: 'chapter',
          x,
          y,
          originalX: x,
          originalY: y,
          targetId: chapter.targetId || chapter.chapterId || chapter.chapter?.id,
        });
        if (i > 0) {
          newLinks.push({
            from: chapters[i - 1].id,
            to: chapter.id,
            type: 'mainline',
          });
        }
      });
    }

    if (branches.length > 0) {
      const radius = canvasSize.width * 0.35;
      branches.forEach((branch: any, i: number) => {
        const angle = (i / branches.length) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        newNodes.push({
          id: branch.id,
          label: branch.branch?.title || `分支${i + 1}`,
          type: 'branch',
          x,
          y,
          originalX: x,
          originalY: y,
          targetId: branch.targetId || branch.branchId || branch.branch?.id,
          parentChapterId: branch.originChapterId,
        });
        if (branch.originChapterId) {
          const parentChapter = chapters.find((c: any) => c.chapterId === branch.originChapterId);
          if (parentChapter) {
            newLinks.push({
              from: parentChapter.id,
              to: branch.id,
              type: 'branch',
            });
          }
        }
      });
    }

    if (spinoffs.length > 0) {
      const radius = canvasSize.width * 0.42;
      spinoffs.forEach((spinoff: any, i: number) => {
        const angle = (i / spinoffs.length) * Math.PI * 2 + Math.PI / 6;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        newNodes.push({
          id: spinoff.id,
          label: spinoff.spinoff?.title || spinoff.story?.title || `番外${i + 1}`,
          type: 'spinoff',
          x,
          y,
          originalX: x,
          originalY: y,
          targetId: spinoff.targetId || spinoff.spinoffId || spinoff.spinoff?.id,
        });
      });
    }

    if (wikiPages.length > 0) {
      const radius = canvasSize.width * 0.42;
      wikiPages.forEach((page: any, i: number) => {
        const angle = (i / wikiPages.length) * Math.PI * 2 + Math.PI / 3;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        newNodes.push({
          id: page.id,
          label: page.wikiPage?.title || `百科${i + 1}`,
          type: 'wiki',
          x,
          y,
          originalX: x,
          originalY: y,
          targetId: page.targetId || page.wikiPageId || page.wikiPage?.id,
        });
      });
    }

    if (events.length > 0) {
      const radius = canvasSize.width * 0.48;
      events.forEach((event: any, i: number) => {
        const angle = (i / events.length) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        newNodes.push({
          id: event.id,
          label: event.event?.title || `事件${i + 1}`,
          type: 'event',
          x,
          y,
          originalX: x,
          originalY: y,
          targetId: event.targetId || event.eventId || event.event?.id,
          storyId: event.event?.story?.id || event.storyId,
        });
      });
    }

    // 用户自定义关系（后端 relation）→ 渲染为额外的边
    relations.forEach((r: any) => {
      if (!r.sourceItemId || !r.targetItemId) return;
      newLinks.push({
        from: r.sourceItemId,
        to: r.targetItemId,
        type: 'relation',
        label: r.label || relationTypeLabel(r.relationType),
      });
    });

    setNodes(newNodes);
    setLinks(newLinks);
  }, [b, canvasSize, relations]);

  const drawArrow = useCallback((ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
    const headLen = 8;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    ctx.save();
    ctx.translate(canvasSize.width / 2 + offset.x, canvasSize.height / 2 + offset.y);
    ctx.scale(scale, scale);

    ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    const maxRadius = canvasSize.width * 0.5;
    for (let i = 1; i <= 4; i++) {
      const r = (maxRadius / 4) * i;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('书单', 0, 0);

    links.forEach((link) => {
      const fromNode = nodes.find((n) => n.id === link.from);
      const toNode = nodes.find((n) => n.id === link.to);
      if (!fromNode || !toNode) return;

      const relFromX = fromNode.x - canvasSize.width / 2;
      const relFromY = fromNode.y - canvasSize.height / 2;
      const relToX = toNode.x - canvasSize.width / 2;
      const relToY = toNode.y - canvasSize.height / 2;

      ctx.beginPath();
      ctx.moveTo(relFromX, relFromY);
      ctx.lineTo(relToX, relToY);

      let color = '';
      if (link.type === 'mainline') {
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        color = '#6366f1';
      } else if (link.type === 'branch') {
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        color = '#8b5cf6';
      } else if (link.type === 'spinoff') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        color = '#f59e0b';
      } else if (link.type === 'event') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        color = '#ef4444';
      } else if (link.type === 'relation') {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        color = '#10b981';
      } else {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        color = '#06b6d4';
      }
      ctx.stroke();
      ctx.setLineDash([]);

      if (link.type === 'mainline' || link.type === 'relation') {
        drawArrow(ctx, relFromX, relFromY, relToX, relToY, color);
      }

      // 自定义关系：在中点绘制标签
      if (link.type === 'relation' && link.label) {
        const midX = (relFromX + relToX) / 2;
        const midY = (relFromY + relToY) / 2;
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textW = ctx.measureText(link.label).width;
        ctx.fillStyle = isDark ? '#064e3b' : '#d1fae5';
        ctx.fillRect(midX - textW / 2 - 4, midY - 8, textW + 8, 16);
        ctx.fillStyle = '#10b981';
        ctx.fillText(link.label, midX, midY);
      }
    });

    nodes.forEach((node) => {
      const isHovered = hoveredNode?.id === node.id;
      const relX = node.x - canvasSize.width / 2;
      const relY = node.y - canvasSize.height / 2;

      const colors = {
        chapter: { fill: '#6366f1', bg: '#e0e7ff', hoverBg: '#c7d2fe', icon: '章' },
        branch: { fill: '#8b5cf6', bg: '#ede9fe', hoverBg: '#ddd6fe', icon: '分' },
        spinoff: { fill: '#f59e0b', bg: '#fef3c7', hoverBg: '#fde68a', icon: '番' },
        wiki: { fill: '#06b6d4', bg: '#cffafe', hoverBg: '#a5f3fc', icon: '百' },
        event: { fill: '#ef4444', bg: '#fee2e2', hoverBg: '#fecaca', icon: '事' },
      };
      const color = colors[node.type];
      const size = isHovered ? 32 : 24;

      ctx.fillStyle = isHovered ? color.hoverBg : color.bg;
      ctx.beginPath();
      ctx.arc(relX, relY, size + 6, 0, Math.PI * 2);
      ctx.fill();

      if (isHovered) {
        ctx.shadowColor = color.fill;
        ctx.shadowBlur = 12;
      }

      ctx.fillStyle = color.fill;
      ctx.beginPath();
      ctx.arc(relX, relY, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${isHovered ? 16 : 12}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(color.icon, relX, relY);

      ctx.fillStyle = isDark ? '#e2e8f0' : '#334155';
      ctx.font = `${isHovered ? 11 : 9}px system-ui`;
      const displayLabel = node.label.length > (isHovered ? 12 : 6) ? node.label.substring(0, isHovered ? 12 : 6) + '...' : node.label;
      ctx.fillText(displayLabel, relX, relY + size + 12);
    });

    ctx.restore();
  }, [nodes, links, hoveredNode, scale, offset, canvasSize, drawArrow]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(0.25, scale * delta), 3);
    setScale(newScale);
  }, [scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    setHoveredNode(null);
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;

    const worldX = (mouseX * canvasSize.width - canvasSize.width / 2 - offset.x) / scale + canvasSize.width / 2;
    const worldY = (mouseY * canvasSize.height - canvasSize.height / 2 - offset.y) / scale + canvasSize.height / 2;

    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    let foundNode: GraphNode | null = null;
    for (const node of nodes) {
      const distance = Math.sqrt((worldX - node.x) ** 2 + (worldY - node.y) ** 2);
      if (distance < 35) {
        foundNode = node;
        break;
      }
    }
    setHoveredNode(foundNode);
  }, [isDragging, dragStart, offset, scale, nodes, canvasSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;

    const worldX = (mouseX * canvasSize.width - canvasSize.width / 2 - offset.x) / scale + canvasSize.width / 2;
    const worldY = (mouseY * canvasSize.height - canvasSize.height / 2 - offset.y) / scale + canvasSize.height / 2;

    for (const node of nodes) {
      const distance = Math.sqrt((worldX - node.x) ** 2 + (worldY - node.y) ** 2);
      if (distance < 35) {
        if (node.targetId) {
          let url = '';
          if (node.type === 'chapter') url = `/read/${node.targetId}`;
          else if (node.type === 'branch') url = `/branch/${node.targetId}`;
          else if (node.type === 'spinoff') url = `/spinoff/${node.targetId}`;
          else if (node.type === 'wiki') url = `/wiki/${node.targetId}`;
          else if (node.type === 'event') url = node.storyId ? `/story/${node.storyId}?tab=events&eventId=${node.targetId}` : `/search?q=${encodeURIComponent(node.label)}`;
          if (url) {
            window.open(url, '_blank');
          }
        }
        break;
      }
    }
  }, [isDragging, offset, scale, nodes, canvasSize]);

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(3, prev * 1.2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(0.25, prev / 1.2));
  }, []);

  const nodeLabel = (id: string) => nodes.find((n) => n.id === id)?.label || '(已移除条目)';

  const handleCreateRelation = async () => {
    if (!relSource || !relTarget) { addToast('warning', '请选择源条目与目标条目'); return; }
    if (relSource === relTarget) { addToast('warning', '不能关联到自身'); return; }
    try {
      await createRelation.mutateAsync({
        booklistId,
        data: { sourceItemId: relSource, targetItemId: relTarget, relationType: relType, label: relLabel.trim() || null },
      });
      addToast('success', '关系已创建');
      setRelSource(''); setRelTarget(''); setRelLabel('');
    } catch (e: any) {
      addToast('error', e?.message || '创建关系失败');
    }
  };

  const handleDeleteRelation = async (relationId: string) => {
    try {
      await deleteRelation.mutateAsync({ booklistId, relationId });
      addToast('success', '关系已删除');
    } catch {
      addToast('error', '删除关系失败');
    }
  };

  const chapters = (b.itemsBySection?.mainline || b.items || []).filter((it: any) => it.chapterId);
  const branches = (b.itemsBySection?.branch || []);
  const wikiPages = (b.itemsBySection?.wiki || []);
  const spinoffs = (b.itemsBySection?.spinoff || []);
  const events = (b.items || []).filter((it: any) => it.targetType === 'event');

  const totalItems = chapters.length + branches.length + wikiPages.length + spinoffs.length + events.length;

  const getNodeTypeName = (type: string) => {
    const names: Record<string, string> = {
      chapter: '主线章节',
      branch: '分支故事',
      spinoff: '番外故事',
      wiki: '百科词条',
      event: '大事件',
    };
    return names[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-accent-400 to-accent-600" />
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-sm">
            <NetworkIcon size={14} className="text-white" />
          </div>
          <h2 className="text-base font-bold text-ink-800 dark:text-white tracking-tight">
            关系图谱
          </h2>
        </div>
        <p className="text-xs text-ink-400">点击节点跳转 · 滚轮缩放 · 拖拽平移</p>
      </div>

      {totalItems === 0 ? (
        <EmptyState icon={NetworkIcon} title="暂无数据可展示" compact />
      ) : (
        <>
          <div
            ref={containerRef}
            className="relative rounded-2xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 overflow-hidden shadow-lg"
          >
            <canvas
              ref={canvasRef}
              className="w-full"
              style={{ minHeight: '400px', cursor: isDragging ? 'grabbing' : hoveredNode ? 'pointer' : 'grab' }}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { setHoveredNode(null); setIsDragging(false); }}
              onWheel={handleWheel}
            />

            <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-ink-800/90 backdrop-blur-sm shadow-sm">
                <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">章</div>
                <span className="text-xs font-medium text-ink-600 dark:text-ink-300">主线章节 ({chapters.length})</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-ink-800/90 backdrop-blur-sm shadow-sm">
                <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold">分</div>
                <span className="text-xs font-medium text-ink-600 dark:text-ink-300">分支故事 ({branches.length})</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-ink-800/90 backdrop-blur-sm shadow-sm">
                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold">番</div>
                <span className="text-xs font-medium text-ink-600 dark:text-ink-300">番外故事 ({spinoffs.length})</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-ink-800/90 backdrop-blur-sm shadow-sm">
                <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">百</div>
                <span className="text-xs font-medium text-ink-600 dark:text-ink-300">百科词条 ({wikiPages.length})</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-ink-800/90 backdrop-blur-sm shadow-sm">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">事</div>
                <span className="text-xs font-medium text-ink-600 dark:text-ink-300">大事件 ({events.length})</span>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-0.5 bg-indigo-500" />
                <span className="text-ink-500">主线连接</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-0.5" style={{ background: 'repeating-linear-gradient(to right, #8b5cf6, #8b5cf6 3px, transparent 3px, transparent 6px)' }} />
                <span className="text-ink-500">分支衍生</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-0.5" style={{ background: 'repeating-linear-gradient(to right, #f59e0b, #f59e0b 3px, transparent 3px, transparent 6px)' }} />
                <span className="text-ink-500">番外</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-0.5" style={{ background: 'repeating-linear-gradient(to right, #ef4444, #ef4444 3px, transparent 3px, transparent 6px)' }} />
                <span className="text-ink-500">大事件</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-0.5 bg-emerald-500" />
                <span className="text-ink-500">自定义关系</span>
              </div>
            </div>

            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <div className="flex gap-1.5 p-1.5 rounded-xl bg-white/90 dark:bg-ink-800/90 backdrop-blur-sm shadow-sm">
                <IconButton
                  onClick={zoomIn}
                  aria-label="放大"
                  size="sm"
                  variant="ghost"
                  title="放大"
                >
                  <ZoomIn size={14} />
                </IconButton>
                <IconButton
                  onClick={zoomOut}
                  aria-label="缩小"
                  size="sm"
                  variant="ghost"
                  title="缩小"
                >
                  <ZoomOut size={14} />
                </IconButton>
                <div className="w-[1px] bg-ink-200 dark:bg-ink-600 my-1" />
                <IconButton
                  onClick={resetView}
                  aria-label="重置视图"
                  size="sm"
                  variant="ghost"
                  title="重置视图"
                >
                  <RotateCcw size={14} />
                </IconButton>
              </div>
              <div className="px-2 py-1 rounded-lg bg-white/90 dark:bg-ink-800/90 backdrop-blur-sm shadow-sm text-xs text-ink-500">
                {Math.round(scale * 100)}%
              </div>
            </div>

            {hoveredNode && (
              <div
                className="absolute z-20 px-3 py-2 rounded-xl bg-white dark:bg-ink-800 shadow-xl border border-ink-100 dark:border-ink-600 pointer-events-none"
                style={{
                  left: Math.min(tooltipPos.x + 12, canvasSize.width - 200),
                  top: Math.min(tooltipPos.y - 40, canvasSize.height - 60),
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{
                      backgroundColor: {
                        chapter: '#6366f1',
                        branch: '#8b5cf6',
                        spinoff: '#f59e0b',
                        wiki: '#06b6d4',
                        event: '#ef4444',
                      }[hoveredNode.type],
                    }}
                  >
                    {{ chapter: '章', branch: '分', spinoff: '番', wiki: '百', event: '事' }[hoveredNode.type]}
                  </div>
                  <span className="text-sm font-bold text-ink-800 dark:text-white">{hoveredNode.label}</span>
                </div>
                <div className="text-xs text-ink-500 dark:text-ink-400 mt-1">
                  {getNodeTypeName(hoveredNode.type)}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-accent-600">
                  <ChevronRight size={12} />
                  点击跳转
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-ink-400 z-10">
              <Move size={12} />
              <span>拖拽平移</span>
              <span className="mx-1">·</span>
              <span>滚轮缩放</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <div className="p-3 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={12} className="text-indigo-500" />
                <span className="text-xs font-bold text-ink-500">主线章节</span>
              </div>
              <p className="text-xl font-bold text-ink-800 dark:text-white">{chapters.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch size={12} className="text-violet-500" />
                <span className="text-xs font-bold text-ink-500">分支故事</span>
              </div>
              <p className="text-xl font-bold text-ink-800 dark:text-white">{branches.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Star size={12} className="text-amber-500" />
                <span className="text-xs font-bold text-ink-500">番外故事</span>
              </div>
              <p className="text-xl font-bold text-ink-800 dark:text-white">{spinoffs.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={12} className="text-cyan-500" />
                <span className="text-xs font-bold text-ink-500">百科词条</span>
              </div>
              <p className="text-xl font-bold text-ink-800 dark:text-white">{wikiPages.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={12} className="text-red-500" />
                <span className="text-xs font-bold text-ink-500">大事件</span>
              </div>
              <p className="text-xl font-bold text-ink-800 dark:text-white">{events.length}</p>
            </div>
          </div>

          {/* 自定义关系管理（创建者可编辑；所有人可见已有关系） */}
          {(isCreator || relations.length > 0) && (
            <div className="p-4 rounded-xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 space-y-3">
              <div className="flex items-center gap-2">
                <Link2 size={14} className="text-emerald-500" />
                <h4 className="text-sm font-bold text-ink-800 dark:text-white">自定义关系</h4>
                <span className="text-xs text-ink-400">({relations.length})</span>
              </div>

              {isCreator && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Select
                    value={relSource}
                    onChange={(e) => setRelSource(e.target.value)}
                    size="sm"
                    wrapperClassName="max-w-[140px]"
                  >
                    <option value="">选择源条目</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </Select>
                  <ChevronRight size={14} className="text-ink-400 shrink-0" />
                  <Select
                    value={relTarget}
                    onChange={(e) => setRelTarget(e.target.value)}
                    size="sm"
                    wrapperClassName="max-w-[140px]"
                  >
                    <option value="">选择目标条目</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </Select>
                  <Select
                    value={relType}
                    onChange={(e) => setRelType(e.target.value)}
                    size="sm"
                  >
                    {RELATION_TYPES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </Select>
                  <input
                    value={relLabel}
                    onChange={(e) => setRelLabel(e.target.value)}
                    placeholder="标签(可选)"
                    className="px-2 py-1.5 rounded-lg border border-ink-200 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 outline-none focus:ring-2 focus:ring-accent-400 w-28"
                  />
                  <Button
                    onClick={handleCreateRelation}
                    disabled={createRelation.isPending}
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus size={13} />}
                  >
                    添加
                  </Button>
                </div>
              )}

              {relations.length > 0 ? (
                <div className="space-y-1.5">
                  {relations.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-50 dark:bg-ink-800 text-xs">
                      <span className="font-medium text-ink-700 dark:text-ink-300 truncate max-w-[120px]">{nodeLabel(r.sourceItemId)}</span>
                      <Badge tone="success" variant="soft" size="sm" className="shrink-0">
                        {r.label || relationTypeLabel(r.relationType)}
                      </Badge>
                      <ChevronRight size={12} className="text-ink-400 shrink-0" />
                      <span className="font-medium text-ink-700 dark:text-ink-300 truncate max-w-[120px]">{nodeLabel(r.targetItemId)}</span>
                      {isCreator && (
                        <IconButton
                          onClick={() => handleDeleteRelation(r.id)}
                          aria-label="删除关系"
                          variant="danger"
                          size="sm"
                          className="ml-auto shrink-0"
                          title="删除关系"
                        >
                          <Trash2 size={12} />
                        </IconButton>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                isCreator && <p className="text-xs text-ink-400">还没有自定义关系。选择两个条目并指定关系类型来建立关联，关系会以绿色连线显示在图谱中。</p>
              )}
            </div>
          )}

          <div className="p-4 rounded-xl bg-gradient-to-br from-accent-50 to-indigo-50 dark:from-accent-900/20 dark:to-indigo-900/20 border border-accent-100 dark:border-accent-500/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-accent-100 dark:bg-accent-500/20">
                <Sparkles size={16} className="text-accent-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink-800 dark:text-white mb-1">使用提示</h4>
                <ul className="text-xs text-ink-500 dark:text-ink-400 space-y-1">
                  <li>• <strong className="text-ink-700 dark:text-ink-300">滚轮</strong>：缩放视图（0.25x - 3x）</li>
                  <li>• <strong className="text-ink-700 dark:text-ink-300">拖拽</strong>：平移画布</li>
                  <li>• <strong className="text-ink-700 dark:text-ink-300">悬停</strong>：查看节点详细信息</li>
                  <li>• <strong className="text-ink-700 dark:text-ink-300">点击</strong>：跳转到对应内容页面</li>
                  <li>• <strong className="text-ink-700 dark:text-ink-300">重置</strong>：恢复默认视图</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BooklistGraphTab;