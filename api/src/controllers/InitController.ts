import { Request, Response } from 'express';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/http';
import { catchAsync } from '../utils/catchAsync';
import { AuthRequest } from '../middleware/auth';
import { registerSchema } from '../utils/validation';
import { RbacBootstrapService } from '../domains/rbac/RbacBootstrapService';

export class InitController {
  static check = catchAsync(async (req: Request, res: Response) => {
    const userCount = await prisma.user.count();
    res.json({
      success: true,
      data: { needsInit: userCount === 0 },
    });
  });

  static setup = catchAsync(async (req: Request, res: Response) => {
    const { email, username, password } = req.body || {};

    if (!email || !username || !password) {
      throw new AppError(400, 'BAD_REQUEST', '请提供完整的管理员信息。');
    }

    // 复用注册校验：确保邮箱/用户名/密码格式合法，避免弱口令管理员
    const parsed = registerSchema.parse({ email, username, password });

    // 鉴权：若运维设置了 ADMIN_BOOTSTRAP_TOKEN，则必须匹配；否则仅允许在空库时初始化。
    // 无论哪种模式，"检查 + 创建" 都放进同一事务，消除并发抢注管理员的 TOCTOU 竞态。
    const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
    const providedToken = req.header('x-bootstrap-token');
    const tokenConfigured = !!bootstrapToken;
    if (tokenConfigured && providedToken !== bootstrapToken) {
      throw new AppError(403, 'FORBIDDEN', '非法的初始化请求：bootstrap token 不正确。');
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 12);

    const admin = await prisma.$transaction(async (tx) => {
      // 在事务内重新检查用户数，防止两个请求同时通过外层检查后重复创建管理员
      const userCount = await tx.user.count();
      if (userCount > 0) {
        throw new AppError(403, 'FORBIDDEN', '系统已完成初始化，禁止重复设置管理员。');
      }

      return tx.user.create({
        data: {
          email: parsed.email,
          username: parsed.username,
          passwordHash: hashedPassword,
          role: 'admin',
        },
      });
    });

    try {
      await RbacBootstrapService.ensureBaseRbac();
    } catch {}

    res.status(201).json({
      success: true,
      data: {
        message: '管理员创建成功！系统初始化完成。',
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
        },
      },
    });
  });

  static bootstrapRbac = catchAsync(async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }
    const out = await RbacBootstrapService.ensureBaseRbac();
    res.json({ success: true, data: out });
  });
}
