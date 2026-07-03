import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** 控制弹窗宽度，默认 md (max-w-lg) */
  size?: ModalSize;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC 键关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // 焦点陷阱：打开时将焦点移入 dialog，关闭时恢复
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // 让对话框本身可聚焦
    dialogRef.current?.focus();
    return () => {
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  // Tab 键循环焦点
  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (!el) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = el.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) { e.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 sm:p-6 scrim backdrop-blur-sm"
          onClick={handleBackdropClick}
          aria-hidden="false"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className={`bg-white dark:bg-ink-700 rounded-3xl w-full ${SIZE_CLASSES[size]} max-h-[calc(100vh-5rem)] overflow-hidden shadow-2xl flex flex-col outline-none`}
          >
            <div className="flex items-center justify-between p-6 border-b border-ink-100 dark:border-ink-600 shrink-0">
              <h3 id={titleId} className="text-xl font-black">{title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                leftIcon={<X size={16} />}
                aria-label="关闭"
              >
                关闭
              </Button>
            </div>
            <div className="p-6 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
