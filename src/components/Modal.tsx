import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
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

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-white dark:bg-ink-700 rounded-3xl w-full max-w-lg max-h-[calc(100vh-5rem)] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col outline-none"
      >
        <div className="flex items-center justify-between p-6 border-b border-ink-100 dark:border-ink-600 shrink-0">
          <h3 id={titleId} className="text-xl font-black">{title}</h3>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-ink-500 hover:text-ink-600 hover:bg-ink-100 dark:hover:bg-ink-600 rounded-full transition-colors"
            aria-label="关闭"
          >
            <X size={16} />
            <span>关闭</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
