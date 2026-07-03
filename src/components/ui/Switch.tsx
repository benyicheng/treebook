import React from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 禁用态 */
  disabled?: boolean;
  /** 尺寸，sm 为卡片内紧凑场景 */
  size?: 'sm' | 'md';
  /** 无障碍标签 */
  'aria-label'?: string;
  id?: string;
}

const TRACK: Record<'sm' | 'md', string> = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
};

const THUMB: Record<'sm' | 'md', string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
};

const THUMB_TRANSLATE: Record<'sm' | 'md', string> = {
  sm: 'translate-x-4',
  md: 'translate-x-5',
};

/**
 * Switch — 统一的开关切换
 *
 * 替代散落的自定义 toggle。带无障碍语义（role=switch）、焦点环与禁用态。
 */
const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled,
  size = 'md',
  'aria-label': ariaLabel,
  id,
}) => {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full p-0.5 outline-none',
        'transition-colors duration-fast ease-out-quart',
        'focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:ring-offset-1',
        'focus-visible:ring-offset-ink-50 dark:focus-visible:ring-offset-ink-800',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        TRACK[size],
        checked
          ? 'bg-accent-500'
          : 'bg-ink-200 dark:bg-ink-600'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block rounded-full bg-white shadow-sm transition-transform duration-fast ease-out-quart',
          THUMB[size],
          checked ? THUMB_TRANSLATE[size] : 'translate-x-0'
        )}
      />
    </button>
  );
};

export default Switch;
