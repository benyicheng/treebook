import React from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 错误态：红色边框与焦点环 */
  error?: boolean;
}

/**
 * Textarea — 统一的多行文本输入框
 *
 * 与 Input 保持一致的圆角、聚焦环与错误态。
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full rounded-xl bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-100',
          'border transition-all duration-fast outline-none font-medium px-4 py-3 text-sm resize-y',
          'placeholder:text-ink-400 placeholder:font-normal',
          'focus:ring-2',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          error
            ? 'border-red-400 focus:ring-red-500/30'
            : 'border-ink-200 dark:border-ink-600 focus:ring-accent-500/30 focus:border-accent-400',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
