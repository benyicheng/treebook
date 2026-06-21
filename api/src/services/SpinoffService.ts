import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { parsePagination, paginatedResponse, PaginatedResponse } from '../utils/pagination';
import { Prisma } from '@prisma/client';
import { ensure } from '../utils/entity';
import type { CreateSpinoffDTO, UpdateSpinoffDTO } from '../utils/validation';

export class SpinoffService {
  static async createSpinoff(authorId: string, data: CreateSpinoffDTO) {
    const { originalStoryId, originalBranchId, originalChapterId, title, summary, content, type, isOfficial, revenueShareRate } = data;

    const originalStory: any = await ensure.exists(prisma.story, originalStoryId, 'Original story');
    await ensure.exists(prisma.user, authorId, 'Author');

    // Derive originalChapterId if not provided but branchId is given
    let resolvedChapterId = originalChapterId || null;
    if (originalBranchId && !resolvedChapterId) {
      const branch: any = await ensure.exists(prisma.branch, originalBranchId, 'Original branch');
      resolvedChapterId = branch.parentChapterId;
    } else if (originalChapterId) {
      await ensure.exists(prisma.chapter, originalChapterId, 'Original chapter');
    }

    // Official status check: 只有原作者能标记为官方
    const finalIsOfficial = !!(isOfficial && originalStory.authorId === authorId);

    return prisma.spinoff.create({
      data: {
        originalStoryId,
        originalBranchId: originalBranchId || null,
        originalChapterId: resolvedChapterId,
        authorId,
        title,
        summary: summary ?? null,
        content: content ?? '',
        type: type || 'if_timeline',
        isOfficial: finalIsOfficial,
        revenueShareRate: revenueShareRate !== undefined ? revenueShareRate : 0.1,
      },
    });
  }

  static async getAllSpinoffs(query?: any): Promise<PaginatedResponse<any>> {
    const { storyId, branchId, q } = query || {};
    const { page, limit } = parsePagination(query || {});

    const where: Prisma.SpinoffWhereInput = {};
    if (storyId) where.originalStoryId = storyId as string;
    if (branchId) where.originalBranchId = branchId as string;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { summary: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.spinoff.findMany({
        where,
        include: {
          author: { select: { username: true } },
          originalStory: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.spinoff.count({ where }),
    ]);

    // Collect referenced character IDs from all spinoffs and batch-fetch them
    const uniqueCharIds = [...new Set(
      items.flatMap(item => {
        try {
          return item.referencedCharacters ? JSON.parse(item.referencedCharacters) : [];
        } catch { return []; }
      })
    )];

    const charMap = new Map<string, { id: string; name: string; role: string; avatarUrl?: string }>();
    if (uniqueCharIds.length > 0) {
      const chars = await prisma.character.findMany({
        where: { id: { in: uniqueCharIds } },
        select: { id: true, name: true, role: true, avatarUrl: true },
      });
      chars.forEach(c => charMap.set(c.id, { ...c, avatarUrl: c.avatarUrl ?? undefined }));
    }

    const enrichedItems = items.map(item => {
      let characters: any[] = [];
      try {
        const ids = item.referencedCharacters ? JSON.parse(item.referencedCharacters) : [];
        characters = ids.map((id: string) => charMap.get(id)).filter(Boolean);
      } catch {}
      return { ...item, characters };
    });

    return paginatedResponse(enrichedItems, total, page, limit);
  }

  static async getSpinoffById(id: string) {
    const spinoff = await prisma.spinoff.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, role: true } },
        originalStory: {
          select: {
            title: true,
            authorId: true,
            description: true,
            coverImage: true,
            status: true,
            author: { select: { username: true } },
            tags: { select: { id: true, name: true } },
          },
        },
        originalBranch: { select: { title: true, description: true } },
        originalChapter: { select: { id: true, title: true, orderIndex: true } },
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

  static async updateSpinoff(id: string, authorId: string, userRole: string, data: UpdateSpinoffDTO) {
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

  static async getMySpinoffs(authorId: string, query: { page?: string; limit?: string } = {}) {
    const { page, limit } = parsePagination(query);

    const where = { authorId };
    const [items, total] = await Promise.all([
      prisma.spinoff.findMany({
        where,
        include: {
          originalStory: { select: { title: true } }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.spinoff.count({ where }),
    ]);

    return paginatedResponse(items, total, page, limit);
  }

  static async deleteSpinoff(id: string, authorId: string, userRole: string) {
    const spinoff: any = await ensure.exists(prisma.spinoff, id, 'Spinoff', { originalStory: true });

    const canDelete = spinoff.authorId === authorId || spinoff.originalStory.authorId === authorId || userRole === 'admin';
    if (!canDelete) throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');

    await prisma.spinoff.delete({ where: { id } });
    return { success: true, message: 'Spinoff deleted successfully' };
  }
}
