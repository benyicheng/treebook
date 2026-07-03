import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';
import IconButton from './IconButton';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  message,
  confirmText = '确认',
  cancelText = '取消',
  danger = true,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 scrim z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-md px-4"
      >
        <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-2xl border border-ink-100 dark:border-ink-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                danger 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : 'bg-amber-100 dark:bg-amber-900/30'
              }`}>
                <AlertTriangle 
                  size={24} 
                  className={danger ? 'text-red-500' : 'text-amber-500'} 
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-ink-800 dark:text-white mb-2">
                  {title}
                </h3>
                <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
                  {message}
                </p>
              </div>
              <IconButton
                size="sm"
                onClick={onClose}
                aria-label="关闭"
                className="shrink-0"
              >
                <X size={18} />
              </IconButton>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-4 bg-ink-50 dark:bg-ink-800/50 border-t border-ink-100 dark:border-ink-700">
            <Button variant="subtle" fullWidth onClick={onClose}>
              {cancelText}
            </Button>
            <Button
              variant={danger ? 'danger' : 'primary'}
              fullWidth
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;
