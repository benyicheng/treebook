import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

type SelectSize = 'sm' | 'md' | 'lg';

const SIZES: Record<SelectSize, string> = {
  sm: 'h-9 text-sm',
  md: 'h-11 text-sm',
  lg: 'h-12 text-base',
};

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** 尺寸，默认 md */
  size?: SelectSize;
  /** 错误态 */
  error?: boolean;
  /** 左侧装饰图标（可选） */
  leftIcon?: React.ReactNode;
  /** 外层容器类名 */
  wrapperClassName?: string;
}

/**
 * Select — 统一的下拉选择框
 *
 * 基于原生 `<select>`（保证可访问性与键盘可达），统一高度、圆角、聚焦环、
 * 错误态与右侧 chevron 指示。替代散落的内联 select 样式。
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { size = 'md', error, leftIcon, wrapperClassName, className, children, ...props },
    ref
  ) => {
    return (
      <div className={cn('relative flex items-center', wrapperClassName)}>
        {leftIcon && (
          <span className="absolute left-3 inline-flex text-ink-400 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full rounded-xl bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-100',
            'border transition-all duration-fast outline-none font-medium appearance-none pr-10',
            'focus:ring-2',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            error
              ? 'border-red-400 focus:ring-red-500/30'
              : 'border-ink-200 dark:border-ink-600 focus:ring-accent-500/30 focus:border-accent-400',
            SIZES[size],
            leftIcon ? 'pl-10' : 'pl-4',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 text-ink-400 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
