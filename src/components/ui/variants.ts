import { cn } from '../../lib/utils';

/**
 * variants — 轻量 variant 工具
 *
 * 手写实现（复用 `cn()`，不引入 cva 等新依赖），用于在组件与
 * `<Link>` / `<a>` 之间共享同一套按钮样式。所有类均取自现有设计 token
 * （ink-* / accent-* / rounded-* / duration-*）。
 */

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'subtle'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold ' +
  'whitespace-nowrap select-none outline-none transition-all duration-fast ease-out-quart ' +
  'focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:ring-offset-1 ' +
  'focus-visible:ring-offset-ink-50 dark:focus-visible:ring-offset-ink-800 ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-500 text-white shadow-md shadow-accent-500/20 hover:bg-accent-600 active:scale-[0.98]',
  secondary:
    'bg-ink-800 text-ink-50 dark:bg-ink-50 dark:text-ink-800 shadow-md hover:opacity-90 active:scale-[0.98]',
  outline:
    'border border-ink-200 dark:border-ink-600 text-ink-700 dark:text-ink-200 ' +
    'hover:bg-ink-100 dark:hover:bg-ink-700/50 active:scale-[0.98]',
  ghost:
    'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700/50 active:scale-[0.98]',
  subtle:
    'bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-200 hover:bg-ink-200 dark:hover:bg-ink-600 active:scale-[0.98]',
  danger:
    'bg-red-500 text-white shadow-md shadow-red-500/20 hover:bg-red-600 active:scale-[0.98]',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

/** 图标按钮的方形尺寸（保证 ≥40px 命中区） */
export const ICON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
};

export interface ButtonVariantOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** 传入额外类名，twMerge 会正确覆盖冲突项（如 rounded-full） */
  className?: string;
}

/**
 * 生成按钮类名。可直接套用于 `<Link>` / `<a>`：
 * `<Link className={buttonVariants({ variant: 'primary' })} />`
 */
export function buttonVariants({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: ButtonVariantOptions = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);
}
