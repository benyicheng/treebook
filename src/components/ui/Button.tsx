import React from 'react';
import { cn } from '../../lib/utils';
import {
  buttonVariants,
  type ButtonVariant,
  type ButtonSize,
} from './variants';

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 视觉样式，默认 primary */
  variant?: ButtonVariant;
  /** 尺寸，默认 md（h-11 / 44px 命中区） */
  size?: ButtonSize;
  /** 加载态：显示内置 spinner 并禁用交互 */
  loading?: boolean;
  /** 左侧图标（lucide 图标元素） */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 撑满父容器宽度 */
  fullWidth?: boolean;
}

/**
 * Button — 统一的按钮组件
 *
 * 替代全项目散落的内联按钮类名，统一 padding / 圆角 / 焦点环 / 禁用态 /
 * loading 态。需要用于 `<Link>` 时改用 `buttonVariants()` 生成类名。
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonVariants({ variant, size, fullWidth, className })}
        {...props}
      >
        {loading ? (
          <span
            className="animate-spin rounded-full border-2 border-current border-t-transparent h-4 w-4"
            aria-hidden="true"
          />
        ) : (
          leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>
        )}
        {children && <span className={cn(loading && 'opacity-90')}>{children}</span>}
        {!loading && rightIcon && (
          <span className="shrink-0 inline-flex">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
