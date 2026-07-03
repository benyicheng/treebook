import React from 'react';

/**
 * Spinner — 统一的加载旋转指示器
 *
 * 此前各页面 spinner 边框粗细 (border-2 / border-4) 与颜色
 * (accent-500 / accent-600) 不一致，此处统一规格。
 */
interface SpinnerProps {
  /** 尺寸（直径 px），默认 48 */
  size?: number;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 48, className = '' }) => (
  <div
    className={`animate-spin rounded-full border-2 border-accent-500 border-t-transparent ${className}`}
    style={{ width: size, height: size }}
    role="status"
    aria-label="加载中"
  />
);

export default Spinner;
