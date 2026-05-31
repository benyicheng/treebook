import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { RevenueConfig, ensure } from '../utils/entity';

export class RevenueService {
  static async getWalletInfo(userId: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 20
            }
          }
        }
      }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, balance: 0 },
        include: {
          user: {
            include: {
              transactions: {
                orderBy: { createdAt: 'desc' },
                take: 20
              }
            }
          }
        }
      });
    }

    return wallet;
  }

  static async settleStoryRevenue(storyId: string) {
    const story: any = await ensure.exists(prisma.story, storyId, 'Story', {
      branches: { include: { author: true } },
      author: true
    });

    const totalRevenue = story.viewCount * RevenueConfig.PRICE_PER_VIEW;
    const { PLATFORM, CURATION_POOL, STORY_AUTHOR } = RevenueConfig.RATES;
    
    const platformFee = totalRevenue * PLATFORM;
    const curationPool = totalRevenue * CURATION_POOL;
    const authorShare = totalRevenue * STORY_AUTHOR; 
    const contributorsPool = totalRevenue - platformFee - curationPool - authorShare; 

    // 获取书单引流统计
    const curationStats = await prisma.readingHistory.groupBy({
      by: ['referralBooklistId'],
      where: {
        chapter: { storyId: storyId },
        referralBooklistId: { not: null }
      },
      _count: { _all: true }
    });

    const totalReferredViews = curationStats.reduce((acc, stat) => acc + stat._count._all, 0);

    let totalWeight = 0;
    const branchWeights = story.branches.map((branch: any) => {
      const weight = (branch.contributionScore || 10) * (branch.isCertified ? 2 : 1);
      totalWeight += weight;
      return { branchId: branch.id, authorId: branch.authorId, weight };
    });

    await prisma.$transaction(async (tx) => {
      // 1. Author share
      await this.updateWallet(tx, story.authorId, authorShare, 'REVENUE_SHARE', 'STORY', story.id, `故事《${story.title}》主线分润 (${STORY_AUTHOR * 100}%)`);

      // 2. Curation Reward
      if (totalReferredViews > 0) {
        await this.distributeCurationRewards(tx, curationStats, totalReferredViews, curationPool, '引流分润');
      }

      // 3. Contributors share
      for (const bw of branchWeights) {
        const share = totalWeight > 0 ? (bw.weight / totalWeight) * contributorsPool : 0;
        if (share <= 0) continue;
        await this.updateWallet(tx, bw.authorId, share, 'REVENUE_SHARE', 'BRANCH', bw.branchId, `分支贡献分润 (权重: ${bw.weight})`);
      }
    });

    return { totalRevenue, platformFee, curationPool, authorShare, contributorsPool, settledAt: new Date() };
  }

  static async settleSpinoffRevenue(spinoffId: string) {
    const spinoff: any = await ensure.exists(prisma.spinoff, spinoffId, 'Spinoff', {
      originalStory: { include: { author: true } },
      author: true
    });

    const totalRevenue = spinoff.viewCount * RevenueConfig.PRICE_PER_VIEW;
    const { SPINOFF_CURATION_POOL, LICENSE_FEE_DEFAULT } = RevenueConfig.RATES;
    
    const curationPool = totalRevenue * SPINOFF_CURATION_POOL;
    const remainingRevenue = totalRevenue - curationPool;
    
    const licenseFeeRate = spinoff.revenueShareRate || LICENSE_FEE_DEFAULT;
    const licenseFee = remainingRevenue * licenseFeeRate;
    const authorShare = remainingRevenue - licenseFee;

    const curationStats = await prisma.readingHistory.groupBy({
      by: ['referralBooklistId'],
      where: {
        chapter: { 
          storyId: spinoff.originalStoryId,
          branchId: spinoff.originalBranchId || undefined
        },
        referralBooklistId: { not: null }
      },
      _count: { _all: true }
    });

    const totalReferredViews = curationStats.reduce((acc, stat) => acc + stat._count._all, 0);

    await prisma.$transaction(async (tx) => {
      // 1. Curation Reward
      if (totalReferredViews > 0) {
        await this.distributeCurationRewards(tx, curationStats, totalReferredViews, curationPool, '番外引流分润');
      }

      // 2. License fee
      await this.updateWallet(tx, spinoff.originalStory.authorId, licenseFee, 'REVENUE_SHARE', 'SPINOFF', spinoff.id, `番外《${spinoff.title}》的世界观授权费`);

      // 3. Spinoff author
      await this.updateWallet(tx, spinoff.authorId, authorShare, 'REVENUE_SHARE', 'SPINOFF', spinoff.id, `番外《${spinoff.title}》创作分润`);
    });

    return { totalRevenue, curationPool, licenseFee, authorShare, settledAt: new Date() };
  }

  // Helper: 统一更新钱包与交易记录
  private static async updateWallet(tx: any, userId: string, amount: number, type: string, targetType: string, targetId: string, description: string) {
    await tx.wallet.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: amount }
    });

    await tx.transaction.create({
      data: { userId, amount, type, targetType, targetId, description }
    });
  }

  // Helper: 统一分发书单奖金（批量查询，避免 N+1）
  private static async distributeCurationRewards(tx: any, stats: any[], totalViews: number, pool: number, descSuffix: string) {
    // Collect unique referral IDs
    const referralIds = [...new Set(
      stats.map((s: any) => s.referralBooklistId).filter(Boolean) as string[]
    )];
    if (!referralIds.length) return;

    // Batch fetch all relevant booklists in one query
    const booklists: Array<{ id: string; creatorId: string; title: string; isIncentiveEnabled: boolean }> =
      await tx.booklist.findMany({
        where: { id: { in: referralIds }, isIncentiveEnabled: true },
        select: { id: true, creatorId: true, title: true, isIncentiveEnabled: true },
      });

    const booklistMap = new Map(booklists.map((b: { id: string; creatorId: string; title: string; isIncentiveEnabled: boolean }) => [b.id, b]));

    for (const stat of stats) {
      if (!stat.referralBooklistId) continue;
      const booklist = booklistMap.get(stat.referralBooklistId);
      if (!booklist) continue;

      const reward = (stat._count._all / totalViews) * pool;
      await this.updateWallet(tx, booklist.creatorId, reward, 'CURATION_REWARD', 'BOOKLIST', stat.referralBooklistId, `书单《${booklist.title}》${descSuffix}`);
      await tx.booklist.update({
        where: { id: stat.referralBooklistId },
        data: { totalEarnings: { increment: reward } },
      });
    }
  }
}
