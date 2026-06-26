import React, { useEffect, useRef, useState } from 'react';
import { Clock, BookOpen, GitBranch, Sparkles, FileText } from 'lucide-react';

export interface NodePreviewData {
  id: string;
  type: 'chapter' | 'branch' | 'spinoff';
  title: string;
  description?: string | null;
  orderIndex?: number;
  wordCount?: number;
  estimatedMinutes?: number;
  authorName?: string;
  status?: string;
}

interface NodePreviewCardProps {
  node: NodePreviewData;
  position: { x: number; y: number };
  onClose: () => void;
  onClick?: (id: string, type: 'chapter' | 'branch' | 'spinoff') => void;
}

const MAX_CARD_WIDTH = 320;
const CARD_HEIGHT_ESTIMATE = 200;
const GAP = 16;

const NodePreviewCard: React.FC<NodePreviewCardProps> = ({ node, position, onClose, onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState(position);

  useEffect(() => {
    const adjustPosition = () => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let x = position.x + GAP;
      let y = position.y + GAP;

      // Flip horizontally if overflowing right edge
      if (x + rect.width > vw - GAP) {
        x = position.x - rect.width - GAP;
      }

      // Flip vertically if overflowing bottom edge
      if (y + rect.height > vh - GAP) {
        y = position.y - rect.height - GAP;
      }

      // Clamp to viewport
      x = Math.max(GAP, Math.min(x, vw - rect.width - GAP));
      y = Math.max(GAP, Math.min(y, vh - rect.height - GAP));

      setAdjustedPos({ x, y });
    };

    adjustPosition();
    window.addEventListener('resize', adjustPosition);
    return () => window.removeEventListener('resize', adjustPosition);
  }, [position]);

  const typeIcon = () => {
    switch (node.type) {
      case 'chapter':
        return <BookOpen size={14} className="text-accent-500" />;
      case 'branch':
        return <GitBranch size={14} className="text-purple-500" />;
      case 'spinoff':
        return <Sparkles size={14} className="text-accent-500" />;
    }
  };

  const typeLabel = () => {
    switch (node.type) {
      case 'chapter':
        return node.orderIndex ? `第 ${node.orderIndex} 章` : '主线章节';
      case 'branch':
        return '平行分支';
      case 'spinoff':
        return '精彩番外';
    }
  };

  const handleClick = () => {
    onClick?.(node.id, node.type);
    onClose();
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onMouseEnter={() => {}} // prevent closing while hovering
      onMouseLeave={onClose}
      className="fixed z-[9999] cursor-pointer animate-in fade-in zoom-in-95 duration-100"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      <div className="bg-white/95 dark:bg-ink-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-ink-100 dark:border-ink-700 min-w-[260px] max-w-[320px] overflow-hidden transition-all hover:shadow-accent-200/30 dark:hover:shadow-accent-500/10 hover:border-accent-300 dark:hover:border-accent-600">
        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-ink-50 dark:border-ink-700/50">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-ink-50 dark:bg-ink-700 text-[10px] font-bold text-ink-500 dark:text-ink-300 uppercase tracking-wider">
            {typeIcon()}
            {typeLabel()}
          </span>
          {node.status && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
              node.status === 'completed' ? 'bg-accent-100 text-accent-600 dark:bg-accent-800/30 dark:text-accent-400' :
              node.status === 'ongoing' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
              node.status === 'merged' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
              node.status === 'certified' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
              'bg-ink-100 text-ink-500 dark:bg-ink-700 dark:text-ink-300'
            }`}>
              {node.status === 'completed' ? '完结' : node.status === 'ongoing' ? '连载' : node.status === 'merged' ? '已合并' : node.status === 'certified' ? '已认证' : node.status}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="px-4 py-2">
          <h4 className="text-sm font-black text-ink-800 dark:text-white leading-snug line-clamp-2">
            {node.title}
          </h4>
        </div>

        {/* Description */}
        {node.description && (
          <div className="px-4 pb-1">
            <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed line-clamp-3">
              <FileText size={10} className="inline mr-1 -mt-0.5 text-ink-300" />
              {node.description}
            </p>
          </div>
        )}

        {/* Meta footer */}
        <div className="px-4 py-2 bg-ink-50/50 dark:bg-ink-900/30 border-t border-ink-50 dark:border-ink-700/50 flex items-center gap-3 flex-wrap">
          {node.estimatedMinutes && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-ink-400">
              <Clock size={10} />
              {node.estimatedMinutes} 分钟阅读
            </span>
          )}
          {node.wordCount && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-ink-400">
              <BookOpen size={10} />
              {node.wordCount > 1000
                ? `${(node.wordCount / 1000).toFixed(1)}k 字`
                : `${node.wordCount} 字`}
            </span>
          )}
          {node.authorName && (
            <span className="text-[10px] font-medium text-ink-400 ml-auto">
              @{node.authorName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodePreviewCard;
