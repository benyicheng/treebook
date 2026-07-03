import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, GitBranch, BookmarkPlus, Eye, Share2 } from 'lucide-react';
import { Button } from '../ui';

interface TreeContextMenuProps {
  open: boolean;
  position: { x: number; y: number };
  nodeType?: 'chapter' | 'branch' | 'spinoff';
  nodeId?: string;
  onClose: () => void;
  onCopyLink: (id: string, type: 'chapter' | 'branch' | 'spinoff') => void;
  onCreateBranch?: (chapterId: string) => void;
  onAddToBooklist?: (id: string, type: 'chapter' | 'branch' | 'spinoff') => void;
  onViewDetail?: (id: string, type: 'chapter' | 'branch' | 'spinoff') => void;
  onShare?: (id: string, type: 'chapter' | 'branch' | 'spinoff') => void;
}

const TreeContextMenu: React.FC<TreeContextMenuProps> = ({
  open,
  position,
  nodeType,
  nodeId,
  onClose,
  onCopyLink,
  onCreateBranch,
  onAddToBooklist,
  onViewDetail,
  onShare,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const menuItems: { id: string; label: string; icon: React.ReactNode; action: () => void }[] = [];
  if (nodeType === 'chapter') {
    menuItems.push(
      { id: 'copy', label: '复制链接', icon: <Copy size={14} />, action: () => { onCopyLink(nodeId!, nodeType); onClose(); } },
      { id: 'branch', label: '创建分支', icon: <GitBranch size={14} />, action: () => { onCreateBranch?.(nodeId!); onClose(); } },
      { id: 'booklist', label: '添加到书单', icon: <BookmarkPlus size={14} />, action: () => { onAddToBooklist?.(nodeId!, nodeType); onClose(); } },
    );
  } else if (nodeType === 'branch') {
    menuItems.push(
      { id: 'copy', label: '复制链接', icon: <Copy size={14} />, action: () => { onCopyLink(nodeId!, nodeType); onClose(); } },
      { id: 'detail', label: '查看详情', icon: <Eye size={14} />, action: () => { onViewDetail?.(nodeId!, nodeType); onClose(); } },
      { id: 'share', label: '分享', icon: <Share2 size={14} />, action: () => { onShare?.(nodeId!, nodeType); onClose(); } },
    );
  } else if (nodeType === 'spinoff') {
    menuItems.push(
      { id: 'copy', label: '复制链接', icon: <Copy size={14} />, action: () => { onCopyLink(nodeId!, nodeType); onClose(); } },
      { id: 'detail', label: '查看详情', icon: <Eye size={14} />, action: () => { onViewDetail?.(nodeId!, nodeType); onClose(); } },
    );
  }

  const menuHeight = menuItems.length * 44 + 16;
  const adjustedX = Math.min(position.x, window.innerWidth - 200);
  const adjustedY = Math.min(position.y, window.innerHeight - menuHeight);

  return (
    <AnimatePresence>
      {open && nodeId && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.9, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed z-[10000] bg-white dark:bg-ink-800 rounded-2xl shadow-2xl border border-ink-100 dark:border-ink-700 overflow-hidden py-1 min-w-[180px]"
          style={{ left: adjustedX, top: adjustedY }}
        >
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={item.action}
              className="w-full justify-start gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-700 dark:text-ink-300 hover:bg-accent-50 dark:hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400"
            >
              <span className="text-ink-400 dark:text-ink-500">{item.icon}</span>
              {item.label}
            </Button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TreeContextMenu;
