import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { Prisma } from '@prisma/client';

export class SpinoffService {
  static async createSpinoff(authorId: string, data: any) {
    const { originalStoryId, originalBranchId, title, summary, content, type, isOfficial, revenueShareRate } = data;

    const originalStory = await prisma.story.findUnique({ where: { id: originalStoryId } });
    if (!originalStory) throw new AppError(404, 'NOT_FOUND', 'Original story not found');

    // 验证用户是否存在（防止数据库重置后的 Token 残留问题）
    const author = await prisma.user.findUnique({ where: { id: authorId } });
    if (!author) throw new AppError(401, 'UNAUTHORIZED', 'Author account no longer exists, please re-login');

    // 验证分支是否存在（如果提供了）
    if (originalBranchId) {
      const branch = await prisma.branch.findUnique({ where: { id: originalBranchId } });
      if (!branch) throw new AppError(404, 'NOT_FOUND', 'Original branch not found');
    }

    // Official status check
    let finalIsOfficial = false;
    if (isOfficial && (originalStory.authorId === authorId)) {
      finalIsOfficial = true;
    }

    return prisma.spinoff.create({
      data: {
        originalStoryId,
        originalBranchId: originalBranchId || null, // 确保空字符串转为 null
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
    const spinoff = await prisma.spinoff.findUnique({ 
      where: { id },
      include: { originalStory: true }
    });

    if (!spinoff) throw new AppError(404, 'NOT_FOUND', 'Spinoff not found');

    if (spinoff.authorId !== authorId && spinoff.originalStory.authorId !== authorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

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
    const spinoff = await prisma.spinoff.findUnique({
      where: { id },
      include: { originalStory: true }
    });

    if (!spinoff) throw new AppError(404, 'NOT_FOUND', 'Spinoff not found');

    if (spinoff.authorId !== authorId && spinoff.originalStory.authorId !== authorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    await prisma.spinoff.delete({ where: { id } });
    return { success: true, message: 'Spinoff deleted successfully' };
  }
}
