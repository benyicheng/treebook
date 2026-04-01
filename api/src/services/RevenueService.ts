import { prisma } from '../prisma';
import { AppError } from '../utils/http';

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
    const PRICE_PER_VIEW = 0.1;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        branches: { include: { author: true } },
        author: true
      }
    });

    if (!story) throw new AppError(404, 'NOT_FOUND', 'Story not found');

    const totalRevenue = story.viewCount * PRICE_PER_VIEW;
    const PLATFORM_FEE_RATE = 0.15; // 平台抽成 15%
    const CURATION_POOL_RATE = 0.10; // 策展（书单）分润池 10%
    
    const platformFee = totalRevenue * PLATFORM_FEE_RATE;
    const curationPool = totalRevenue * CURATION_POOL_RATE;
    const authorShare = totalRevenue * 0.40; // 故事作者 40%
    const contributorsPool = totalRevenue - platformFee - curationPool - authorShare; // 剩余给分支贡献者 (约 35%)

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
    const branchWeights = story.branches.map(branch => {
      const weight = (branch.contributionScore || 10) * (branch.isCertified ? 2 : 1);
      totalWeight += weight;
      return { branchId: branch.id, authorId: branch.authorId, weight };
    });

    await prisma.$transaction(async (tx) => {
      // 1. Author share
      await tx.wallet.upsert({
        where: { userId: story.authorId },
        update: { balance: { increment: authorShare } },
        create: { userId: story.authorId, balance: authorShare }
      });
      
      await tx.transaction.create({
        data: {
          userId: story.authorId,
          amount: authorShare,
          type: 'REVENUE_SHARE',
          targetType: 'STORY',
          targetId: story.id,
          description: `故事《${story.title}》主线分润 (40%)`
        }
      });

      // 2. Curation Reward (书单作者分润)
      if (totalReferredViews > 0) {
        for (const stat of curationStats) {
          if (!stat.referralBooklistId) continue;
          
          const booklist = await tx.booklist.findUnique({
            where: { id: stat.referralBooklistId },
            select: { creatorId: true, title: true, isIncentiveEnabled: true }
          });

          if (booklist && booklist.isIncentiveEnabled) {
            const reward = (stat._count._all / totalReferredViews) * curationPool;
            await tx.wallet.upsert({
              where: { userId: booklist.creatorId },
              update: { balance: { increment: reward } },
              create: { userId: booklist.creatorId, balance: reward }
            });

            await tx.transaction.create({
              data: {
                userId: booklist.creatorId,
                amount: reward,
                type: 'CURATION_REWARD',
                targetType: 'BOOKLIST',
                targetId: stat.referralBooklistId,
                description: `书单《${booklist.title}》引流分润 (引流数: ${stat._count._all})`
              }
            });

            // 更新书单累计收益
            await tx.booklist.update({
              where: { id: stat.referralBooklistId },
              data: { totalEarnings: { increment: reward } }
            });
          }
        }
      }

      // 3. Contributors share
      for (const bw of branchWeights) {
        const share = totalWeight > 0 ? (bw.weight / totalWeight) * contributorsPool : 0;
        if (share <= 0) continue;

        await tx.wallet.upsert({
          where: { userId: bw.authorId },
          update: { balance: { increment: share } },
          create: { userId: bw.authorId, balance: share }
        });

        await tx.transaction.create({
          data: {
            userId: bw.authorId,
            amount: share,
            type: 'REVENUE_SHARE',
            targetType: 'BRANCH',
            targetId: bw.branchId,
            description: `分支贡献分润 (权重: ${bw.weight})`
          }
        });
      }
    });

    return {
      totalRevenue,
      platformFee,
      curationPool,
      authorShare,
      contributorsPool,
      settledAt: new Date()
    };
  }

  static async settleSpinoffRevenue(spinoffId: string) {
    const PRICE_PER_VIEW = 0.1;

    const spinoff = await prisma.spinoff.findUnique({
      where: { id: spinoffId },
      include: {
        originalStory: { include: { author: true } },
        author: true
      }
    });

    if (!spinoff) throw new AppError(404, 'NOT_FOUND', 'Spinoff not found');

    const totalRevenue = spinoff.viewCount * PRICE_PER_VIEW;
    const CURATION_POOL_RATE = 0.05; // 番外策展分润池 5% (因为还要给原著分成)
    const curationPool = totalRevenue * CURATION_POOL_RATE;
    const remainingRevenue = totalRevenue - curationPool;
    
    const licenseFeeRate = spinoff.revenueShareRate || 0.1;
    const licenseFee = remainingRevenue * licenseFeeRate;
    const authorShare = remainingRevenue - licenseFee;

    // 获取书单引流统计
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
        for (const stat of curationStats) {
          if (!stat.referralBooklistId) continue;
          
          const booklist = await tx.booklist.findUnique({
            where: { id: stat.referralBooklistId },
            select: { creatorId: true, title: true, isIncentiveEnabled: true }
          });

          if (booklist && booklist.isIncentiveEnabled) {
            const reward = (stat._count._all / totalReferredViews) * curationPool;
            await tx.wallet.upsert({
              where: { userId: booklist.creatorId },
              update: { balance: { increment: reward } },
              create: { userId: booklist.creatorId, balance: reward }
            });

            await tx.transaction.create({
              data: {
                userId: booklist.creatorId,
                amount: reward,
                type: 'CURATION_REWARD',
                targetType: 'BOOKLIST',
                targetId: stat.referralBooklistId,
                description: `书单《${booklist.title}》番外引流分润`
              }
            });

            await tx.booklist.update({
              where: { id: stat.referralBooklistId },
              data: { totalEarnings: { increment: reward } }
            });
          }
        }
      }

      // 2. License fee to original author
      await tx.wallet.upsert({
        where: { userId: spinoff.originalStory.authorId },
        update: { balance: { increment: licenseFee } },
        create: { userId: spinoff.originalStory.authorId, balance: licenseFee }
      });
      
      await tx.transaction.create({
        data: {
          userId: spinoff.originalStory.authorId,
          amount: licenseFee,
          type: 'REVENUE_SHARE',
          targetType: 'SPINOFF',
          targetId: spinoff.id,
          description: `番外《${spinoff.title}》的世界观授权费`
        }
      });

      // 3. Spinoff author revenue
      await tx.wallet.upsert({
        where: { userId: spinoff.authorId },
        update: { balance: { increment: authorShare } },
        create: { userId: spinoff.authorId, balance: authorShare }
      });

      await tx.transaction.create({
        data: {
          userId: spinoff.authorId,
          amount: authorShare,
          type: 'REVENUE_SHARE',
          targetType: 'SPINOFF',
          targetId: spinoff.id,
          description: `番外《${spinoff.title}》创作分润`
        }
      });
    });

    return {
      totalRevenue,
      curationPool,
      licenseFee,
      authorShare,
      settledAt: new Date()
    };
  }
}
