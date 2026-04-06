import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { Prisma } from '@prisma/client';
import { ensure } from '../utils/entity';

export class SpinoffService {
  static async createSpinoff(authorId: string, data: any) {
    const { originalStoryId, originalBranchId, title, summary, content, type, isOfficial, revenueShareRate } = data;

    const originalStory: any = await ensure.exists(prisma.story, originalStoryId, 'Original story');
    await ensure.exists(prisma.user, authorId, 'Author');

    if (originalBranchId) {
      await ensure.exists(prisma.branch, originalBranchId, 'Original branch');
    }

    // Official status check: 只有原作者能标记为官方
    const finalIsOfficial = !!(isOfficial && originalStory.authorId === authorId);

    return prisma.spinoff.create({
      data: {
        originalStoryId,
        originalBranchId: originalBranchId || null,
        authorId,
        title,
        summary,
        content,
        type: type || 'if_timeline',
        isOfficial: finalIsOfficial,
        revenueShareRate: revenueShareRate !== undefined ? revenueShareRate : 0.1,
      },
    });
  }

  static async getAllSpinoffs(query?: any) {
    const { storyId, branchId, limit } = query || {};
    return prisma.spinoff.findMany({
      where: {
        originalStoryId: storyId,
        originalBranchId: branchId,
      },
      include: {
        author: { select: { username: true } },
        originalStory: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : undefined
    });
  }

  static async getSpinoffById(id: string) {
    const spinoff = await prisma.spinoff.findUnique({
      where: { id },
      include: {
        author: { select: { username: true, role: true } },
        originalStory: { select: { title: true, authorId: true } },
        originalBranch: { select: { title: true } },
      },
    });

    if (!spinoff) throw new AppError(404, 'NOT_FOUND', 'Spinoff not found');

    // Update view count
    await prisma.spinoff.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    return spinoff;
  }

  static async updateSpinoff(id: string, authorId: string, userRole: string, data: any) {
    const spinoff: any = await ensure.exists(prisma.spinoff, id, 'Spinoff', { originalStory: true });

    // 权限校验：作者、原作者、或管理员
    const canEdit = spinoff.authorId === authorId || spinoff.originalStory.authorId === authorId || userRole === 'admin';
    if (!canEdit) throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');

    return prisma.spinoff.update({
      where: { id },
      data: {
        title: data.title,
        summary: data.summary,
        content: data.content,
        status: data.status,
        isOfficial: data.isOfficial !== undefined && spinoff.originalStory.authorId === authorId ? data.isOfficial : spinoff.isOfficial,
      },
    });
  }

  static async getMySpinoffs(authorId: string) {
    return prisma.spinoff.findMany({
      where: { authorId },
      include: {
        originalStory: { select: { title: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async deleteSpinoff(id: string, authorId: string, userRole: string) {
    const spinoff: any = await ensure.exists(prisma.spinoff, id, 'Spinoff', { originalStory: true });

    const canDelete = spinoff.authorId === authorId || spinoff.originalStory.authorId === authorId || userRole === 'admin';
    if (!canDelete) throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');

    await prisma.spinoff.delete({ where: { id } });
    return { success: true, message: 'Spinoff deleted successfully' };
  }
}
