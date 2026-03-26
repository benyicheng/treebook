import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取所有站点配置（公开接口）
 */
export async function getSiteConfig(req: Request, res: Response): Promise<void> {
  try {
    const configs = await prisma.siteConfig.findMany();
    
    // 转换为键值对格式
    const result: Record<string, string> = {};
    for (const config of configs) {
      result[config.key] = config.value;
    }

    res.json(result);
  } catch (err: any) {
    console.error('获取配置失败:', err);
    res.status(500).json({ 
      error: '获取配置失败',
      message: err.message 
    });
  }
}

/**
 * 更新站点配置（需 admin 权限）
 */
export async function updateSiteConfig(req: Request, res: Response): Promise<void> {
  try {
    // 验证用户权限
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: '无权限，需要管理员身份' });
      return;
    }

    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      res.status(400).json({ error: '请求格式错误' });
      return;
    }

    // 批量更新配置
    const keys = Object.keys(updates);
    for (const key of keys) {
      await prisma.siteConfig.upsert({
        where: { key },
        update: { value: String(updates[key]) },
        create: { key, value: String(updates[key]) },
      });
    }

    res.json({ success: true, updated: keys });
  } catch (err: any) {
    console.error('更新配置失败:', err);
    res.status(500).json({ 
      error: '更新配置失败',
      message: err.message 
    });
  }
}
