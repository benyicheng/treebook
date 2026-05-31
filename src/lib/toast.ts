/**
 * 轻量级 Toast 通知工具
 * 基于 DOM 操作，不依赖 React context，可在任何位置调用。
 * 后续可按需替换为 react-hot-toast 等成熟方案。
 */

type ToastType = 'success' | 'error' | 'info';

const COLORS: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: '#059669', text: '#fff', icon: '✓' },
  error: { bg: '#DC2626', text: '#fff', icon: '✕' },
  info: { bg: '#2563EB', text: '#fff', icon: 'i' },
};

export function toast(message: string, type: ToastType = 'info', duration = 3000) {
  const palette = COLORS[type];

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99999;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 24px;
    border-radius: 12px;
    background: ${palette.bg};
    color: ${palette.text};
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
    max-width: 90vw;
    line-height: 1.4;
  `;

  const icon = document.createElement('span');
  icon.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    font-size: 12px;
    flex-shrink: 0;
  `;
  icon.textContent = palette.icon;
  container.appendChild(icon);

  const text = document.createElement('span');
  text.textContent = message;
  container.appendChild(text);

  document.body.appendChild(container);

  // Animate in
  requestAnimationFrame(() => {
    container.style.opacity = '1';
  });

  // Animate out & remove
  setTimeout(() => {
    container.style.opacity = '0';
    setTimeout(() => container.remove(), 300);
  }, duration);
}
