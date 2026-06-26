/**
 * 集中式 JWT 密钥管理
 *
 * 启动时强制检查密钥是否已配置，防止使用默认值运行。
 * 测试环境自动使用占位密钥，不影响生产安全检查。
 */

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
}

const isTest = !!process.env.VITEST || process.env.NODE_ENV === 'test';

export function JWT_SECRET(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (isTest) return 'test-secret-key';
    throw new Error(
      '[FATAL] JWT_SECRET 环境变量未设置。请在 .env 中配置生产级随机密钥（如 openssl rand -hex 64）。'
    );
  }

  if (
    secret === 'your-secret-key' ||
    secret === 'change-me-to-a-random-secret-in-production'
  ) {
    if (isTest) return secret;
    throw new Error(
      '[FATAL] JWT_SECRET 仍为默认不安全值。请立即将 .env 中的 JWT_SECRET 替换为生产级随机密钥。'
    );
  }

  return secret;
}
