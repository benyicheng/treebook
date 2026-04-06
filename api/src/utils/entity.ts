import { prisma } from '../prisma';
import { AppError } from './http';

/**
 * 实体存在性校验工具
 * 消除 Service 层中重复的 findUnique + throw 逻辑
 */
export const ensure = {
  async exists<T = any>(
    model: any, 
    id: string, 
    entityName: string, 
    include?: any
  ): Promise<T> {
    const item = await model.findUnique({ where: { id }, include });
    if (!item) {
      throw new AppError(404, 'NOT_FOUND', `${entityName} (ID: ${id}) 不存在`);
    }
    return item as T;
  },

  async isOwner(
    userId: string, 
    userRole: string, 
    ownerId: string, 
    errorMessage = '没有操作权限'
  ) {
    if (userRole === 'admin') return true;
    if (userId !== ownerId) {
      throw new AppError(403, 'FORBIDDEN', errorMessage);
    }
    return true;
  }
};

/**
 * 收益计算策略
 * 集中管理所有分润比例，防止逻辑碎片化
 */
export const RevenueConfig = {
  PRICE_PER_VIEW: 0.1,
  RATES: {
    PLATFORM: 0.15,
    STORY_AUTHOR: 0.40,
    CURATION_POOL: 0.10,
    SPINOFF_CURATION_POOL: 0.05,
    LICENSE_FEE_DEFAULT: 0.10
  }
};
