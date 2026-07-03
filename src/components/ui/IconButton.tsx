import React from 'react';
import { cn } from '../../lib/utils';
import {
  ICON_SIZES,
  type ButtonVariant,
  type ButtonSize,
} from './variants';

const BASE =
  'inline-flex items-center justify-center rounded-xl outline-none ' +
  'transition-all duration-fast ease-out-quart ' +
  'focus-visible:ring-2 focus-visible:ring-accent-500/40 ' +
  'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.95]';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent-500 text-white shadow-md shadow-accent-500/20 hover:bg-accent-600',
  secondary: 'bg-ink-800 text-ink-50 dark:bg-ink-50 dark:text-ink-800 hover:opacity-90',
  outline:
    'border border-ink-200 dark:border-ink-600 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700/50',
  ghost: 'text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700/50 hover:text-ink-700 dark:hover:text-ink-200',
  subtle: 'bg-ink-100 dark:bg-ink-700 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-600',
  danger: 'text-ink-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20',
};

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 无障碍标签，图标按钮必填 */
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * IconButton — 纯图标按钮
 *
 * 统一方形命中区（sm/md/lg 对应 36/44/48px）与焦点态，强制要求 aria-label。
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={props.type ?? 'button'}
        className={cn(BASE, VARIANTS[variant], ICON_SIZES[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
