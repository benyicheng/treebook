import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 悬停时抬升（用于可点击卡片） */
  interactive?: boolean;
  /** 内边距预设，默认 md；none 时由子组件自行控制 */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Card — 统一的内容容器
 *
 * 统一 surface 背景、边框、圆角与阴影，替代散落的 `bg-white rounded-2xl border ...`。
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ interactive, padding = 'md', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-600 shadow-sm',
          interactive &&
            'transition-all duration-fast ease-out-quart hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
          PADDING[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex items-center justify-between p-6 border-b border-ink-100 dark:border-ink-600',
      className
    )}
    {...props}
  />
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('p-6', className)} {...props} />;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex items-center gap-3 px-6 py-4 border-t border-ink-100 dark:border-ink-600',
      className
    )}
    {...props}
  />
);

export default Card;
