import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/http';

export class InitController {
  /**
   * 检查系统是否需要初始化（即：是否没有任何用户）
   */
  static async check(req: Request, res: Response, next: NextFunction) {
    try {
      const userCount = await prisma.user.count();
      res.json({
        needsInit: userCount === 0
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 创建首个超级管理员
   */
  static async setup(req: Request, res: Response, next: NextFunction) {
    try {
      // 安全检查：如果系统已经有用户，禁止再次初始化
      const userCount = await prisma.user.count();
      if (userCount > 0) {
        throw new AppError(403, 'FORBIDDEN', '系统已完成初始化，禁止重复设置管理员。');
      }

      const { email, username, password } = req.body;

      if (!email || !username || !password) {
        throw new AppError(400, 'BAD_REQUEST', '请提供完整的管理员信息。');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const admin = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          role: 'admin',
          isCertified: true,
          bio: '系统首席执行官 (System Administrator)'
        }
      });

      res.status(201).json({
        message: '管理员创建成功！系统初始化完成。',
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
