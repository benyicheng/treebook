import React from 'react';
import { cn } from '../../lib/utils';

type InputSize = 'sm' | 'md' | 'lg';

const SIZES: Record<InputSize, string> = {
  sm: 'h-9 text-sm',
  md: 'h-11 text-sm',
  lg: 'h-12 text-base',
};

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 尺寸，默认 md */
  size?: InputSize;
  /** 错误态：红色边框与焦点环 */
  error?: boolean;
  /** 左侧图标（lucide 图标元素） */
  leftIcon?: React.ReactNode;
  /** 右侧图标 / 操作 */
  rightIcon?: React.ReactNode;
  /** 外层容器类名 */
  wrapperClassName?: string;
}

/**
 * Input — 统一的文本输入框
 *
 * 统一高度、圆角、聚焦环、错误态与前后缀图标槽，替代散落的内联 input 样式。
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { size = 'md', error, leftIcon, rightIcon, wrapperClassName, className, ...props },
    ref
  ) => {
    return (
      <div className={cn('relative flex items-center', wrapperClassName)}>
        {leftIcon && (
          <span className="absolute left-3 inline-flex text-ink-400 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-100',
            'border transition-all duration-fast outline-none font-medium',
            'placeholder:text-ink-400 placeholder:font-normal',
            'focus:ring-2',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            error
              ? 'border-red-400 focus:ring-red-500/30'
              : 'border-ink-200 dark:border-ink-600 focus:ring-accent-500/30 focus:border-accent-400',
            SIZES[size],
            leftIcon ? 'pl-10' : 'pl-4',
            rightIcon ? 'pr-10' : 'pr-4',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 inline-flex text-ink-400">{rightIcon}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
