import React from 'react';
import { cn } from '../../lib/utils';

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
type BadgeVariant = 'soft' | 'solid' | 'outline';
type BadgeSize = 'sm' | 'md';

const SOFT: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 dark:bg-ink-700 text-ink-600 dark:text-ink-300',
  accent: 'bg-accent-50 dark:bg-accent-500/15 text-accent-600 dark:text-accent-400',
  success: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400',
  info: 'bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400',
};

const SOLID: Record<BadgeTone, string> = {
  neutral: 'bg-ink-500 text-white',
  accent: 'bg-accent-500 text-white',
  success: 'bg-emerald-500 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-500 text-white',
  info: 'bg-sky-500 text-white',
};

const OUTLINE: Record<BadgeTone, string> = {
  neutral: 'border border-ink-200 dark:border-ink-600 text-ink-600 dark:text-ink-300',
  accent: 'border border-accent-300 dark:border-accent-500/40 text-accent-600 dark:text-accent-400',
  success: 'border border-emerald-300 text-emerald-600 dark:text-emerald-400',
  warning: 'border border-amber-300 text-amber-600 dark:text-amber-400',
  danger: 'border border-red-300 text-red-600 dark:text-red-400',
  info: 'border border-sky-300 text-sky-600 dark:text-sky-400',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

/**
 * Badge — 统一的标签 / 状态徽标
 *
 * 替代散落的 `px-2 py-0.5 rounded-md text-xs ...` 状态标签样式。
 */
const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const toneMap =
    variant === 'solid' ? SOLID : variant === 'outline' ? OUTLINE : SOFT;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        toneMap[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
