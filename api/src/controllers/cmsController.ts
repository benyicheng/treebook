import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';

/**
 * 获取所有站点配置（公开接口）
 */
export const getSiteConfig = catchAsync(async (req: Request, res: Response) => {
  const configs = await prisma.siteConfig.findMany();
  
  // 转换为键值对格式
  const result: Record<string, string> = {};
  for (const config of configs) {
    result[config.key] = config.value;
  }

  res.json({ success: true, data: result });
});

/**
 * 更新站点配置（需 cms:manage 权限，由中间件 enforce）
 */
export const updateSiteConfig = catchAsync(async (req: Request, res: Response) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    throw new AppError(400, 'BAD_REQUEST', '请求格式错误');
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

  res.json({ success: true, data: { updated: keys } });
});

/**
 * 获取站点统计（公开接口）
 */
export const getStats = catchAsync(async (req: Request, res: Response) => {
  const [storyCount, userCount, branchCount] = await Promise.all([
    prisma.story.count(),
    prisma.user.count(),
    prisma.branch.count(),
  ]);

  res.json({
    success: true,
    data: {
      stories: storyCount,
      users: userCount,
      branches: branchCount,
    },
  });
});
