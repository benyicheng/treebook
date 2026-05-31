import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { parsePagination, paginatedResponse, PaginatedResponse } from '../utils/pagination';
import { Prisma } from '@prisma/client';

export class BooklistService {
  static async createBooklist(creatorId: string, data: any) {
    const { title, description, isPublic, type, tags, coverImage } = data;
    return prisma.booklist.create({
      data: {
        creatorId,
        title,
        description,
        isPublic: isPublic !== undefined ? isPublic : true,
        type: type || 'COLLECTION',
        tags: tags || '',
        coverImage: coverImage || undefined
      }
    });
  }

  static async getBooklists(query?: { 
    creatorId?: string; 
    isPublic?: boolean; 
    limit?: number;
    type?: string;
    tag?: string;
    sortBy?: 'hot' | 'earning' | 'newest';
    page?: string;
  }): Promise<PaginatedResponse<any>> {
    const { page: pageStr, limit: limitNum } = query || {};
    const { page, limit } = parsePagination({
      page: pageStr,
      limit: limitNum?.toString(),
    });

    const where: any = {
      isPublic: query?.isPublic !== undefined ? query.isPublic : true
    };

    if (query?.creatorId) where.creatorId = query.creatorId;
    if (query?.type) where.type = query.type;
    if (query?.tag) {
      where.tags = { contains: query.tag };
    }

    let orderBy: any = { updatedAt: 'desc' };
    if (query?.sortBy === 'hot') {
      orderBy = [
        { likesCount: 'desc' },
        { viewCount: 'desc' }
      ];
    } else if (query?.sortBy === 'earning') {
      orderBy = { totalEarnings: 'desc' };
    }

    const [items, total] = await Promise.all([
      prisma.booklist.findMany({
        where,
        include: {
          creator: { select: { id: true, username: true } },
          _count: { select: { items: true } }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booklist.count({ where }),
    ]);

    return paginatedResponse(items, total, page, limit);
  }

  static async getMyBooklists(creatorId: string, query: { page?: string; limit?: string } = {}) {
    const { page, limit } = parsePagination(query);

    const where = { creatorId };
    const [items, total] = await Promise.all([
      prisma.booklist.findMany({
        where,
        include: {
          _count: { select: { items: true } }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booklist.count({ where }),
    ]);

    return paginatedResponse(items, total, page, limit);
  }

  /**
   * Resolve a polymorphic booklist item to its display info.
   */
  private static async resolveItem(item: any) {
    const resolved: any = { ...item };

    if (item.targetType === 'chapter' && item.targetId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: item.targetId },
        select: {
          id: true,
          title: true,
          story: { select: { id: true, title: true, author: { select: { id: true, username: true } } } },
          branch: { select: { id: true, title: true } },
        },
      });
      resolved.chapter = chapter;
    } else if (item.targetType === 'story' && item.targetId) {
      const story = await prisma.story.findUnique({
        where: { id: item.targetId },
        select: { id: true, title: true, author: { select: { id: true, username: true } } },
      });
      resolved.story = story;
    } else if (item.targetType === 'branch' && item.targetId) {
      const branch = await prisma.branch.findUnique({
        where: { id: item.targetId },
        select: {
          id: true,
          title: true,
          parentStory: { select: { id: true, title: true, author: { select: { id: true, username: true } } } },
        },
      });
      resolved.branch = branch;
    } else if (item.targetType === 'spinoff' && item.targetId) {
      const spinoff = await prisma.spinoff.findUnique({
        where: { id: item.targetId },
        select: { id: true, title: true, originalStory: { select: { id: true, title: true, author: { select: { id: true, username: true } } } } },
      });
      resolved.spinoff = spinoff;
    } else if (item.chapterId) {
      // Fallback for old data that only has chapterId
      const chapter = await prisma.chapter.findUnique({
        where: { id: item.chapterId },
        select: {
          id: true,
          title: true,
          story: { select: { id: true, title: true, author: { select: { id: true, username: true } } } },
          branch: { select: { id: true, title: true } },
        },
      });
      resolved.chapter = chapter;
    }

    return resolved;
  }

  static async getBooklistById(id: string) {
    const booklist = await prisma.booklist.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, username: true } },
        items: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');

    // Resolve polymorphic items
    const resolvedItems = await Promise.all(
      booklist.items.map((item) => BooklistService.resolveItem(item))
    );

    // Update view count
    await prisma.booklist.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    return { ...booklist, items: resolvedItems };
  }

  static async updateBooklist(id: string, creatorId: string, userRole: string, data: any) {
    const booklist = await prisma.booklist.findUnique({ where: { id } });

    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');
    if (booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    return prisma.booklist.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        isPublic: data.isPublic
      }
    });
  }

  static async deleteBooklist(id: string, creatorId: string, userRole: string) {
    const booklist = await prisma.booklist.findUnique({ where: { id } });

    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');
    if (booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    await prisma.booklist.delete({ where: { id } });
    return { success: true, message: 'Booklist deleted successfully' };
  }

  /**
   * Add an item to a booklist with polymorphic target support.
   * @param data.targetType - 'story' | 'branch' | 'spinoff' | 'chapter'
   * @param data.targetId - The ID of the target entity
   * @param data.chapterId - Legacy field (used if targetType/targetId not provided)
   */
  static async addItemToBooklist(booklistId: string, creatorId: string, userRole: string, data: any) {
    const booklist = await prisma.booklist.findUnique({ where: { id: booklistId } });
    
    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');
    if (booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    // Determine the target type and ID
    const targetType = data.targetType || 'chapter';
    const targetId = data.targetId || data.chapterId;
    if (!targetId) {
      throw new AppError(400, 'BAD_REQUEST', '缺少 targetId 或 chapterId');
    }

    // Validate the target entity exists
    if (targetType === 'story') {
      const story = await prisma.story.findUnique({ where: { id: targetId } });
      if (!story) throw new AppError(404, 'NOT_FOUND', '故事不存在');
    } else if (targetType === 'branch') {
      const branch = await prisma.branch.findUnique({ where: { id: targetId } });
      if (!branch) throw new AppError(404, 'NOT_FOUND', '分支不存在');
    } else if (targetType === 'spinoff') {
      const spinoff = await prisma.spinoff.findUnique({ where: { id: targetId } });
      if (!spinoff) throw new AppError(404, 'NOT_FOUND', '番外不存在');
    } else if (targetType === 'chapter') {
      const chapter = await prisma.chapter.findUnique({ where: { id: targetId } });
      if (!chapter) throw new AppError(404, 'NOT_FOUND', '章节不存在');
    } else {
      throw new AppError(400, 'BAD_REQUEST', '无效的 targetType');
    }

    // Check for duplicates by targetType+targetId
    const existingItem = await prisma.booklistItem.findFirst({
      where: { booklistId, targetType, targetId }
    });

    if (existingItem) {
      throw new AppError(400, 'DUPLICATE_ITEM', '该项目已在书单中');
    }

    // Get current items count for auto-incrementing orderIndex
    const currentCount = await prisma.booklistItem.count({ where: { booklistId } });

    return prisma.booklistItem.create({
      data: {
        booklistId,
        targetType,
        targetId,
        chapterId: targetType === 'chapter' ? targetId : undefined,
        orderIndex: data.orderIndex !== undefined ? data.orderIndex : currentCount + 1,
        notes: data.notes
      }
    });
  }

  static async upsertProgress(booklistId: string, userId: string, data: { currentItemIndex?: number; completedItemIds?: string[] }) {
    const booklist = await prisma.booklist.findUnique({ where: { id: booklistId } });
    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');

    return prisma.booklistProgress.upsert({
      where: {
        userId_booklistId: { userId, booklistId },
      },
      create: {
        userId,
        booklistId,
        currentItemIndex: data.currentItemIndex ?? -1,
        completedItemIds: JSON.stringify(data.completedItemIds ?? []),
      },
      update: {
        currentItemIndex: data.currentItemIndex ?? undefined,
        completedItemIds: data.completedItemIds !== undefined
          ? JSON.stringify(data.completedItemIds)
          : undefined,
      },
    });
  }

  /**
   * Atomically toggle a single item's completion status.
   * Uses a transaction to prevent concurrent-overwrite race conditions
   * that occur when two tabs both submit the full completedItemIds array.
   */
  static async toggleProgressItem(booklistId: string, userId: string, itemId: string) {
    const booklist = await prisma.booklist.findUnique({ where: { id: booklistId } });
    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const progress = await tx.booklistProgress.findUnique({
        where: { userId_booklistId: { userId, booklistId } },
      });

      let completedIds: string[];
      if (progress) {
        completedIds = JSON.parse(progress.completedItemIds);
        const idx = completedIds.indexOf(itemId);
        if (idx >= 0) {
          completedIds.splice(idx, 1);
        } else {
          completedIds.push(itemId);
        }
      } else {
        completedIds = [itemId];
      }

      return tx.booklistProgress.upsert({
        where: { userId_booklistId: { userId, booklistId } },
        create: { userId, booklistId, completedItemIds: JSON.stringify(completedIds) },
        update: { completedItemIds: JSON.stringify(completedIds) },
      });
    });
  }

  static async getProgress(booklistId: string, userId: string) {
    const progress = await prisma.booklistProgress.findUnique({
      where: {
        userId_booklistId: { userId, booklistId },
      },
    });

    if (!progress) return null;

    return {
      ...progress,
      completedItemIds: JSON.parse(progress.completedItemIds),
    };
  }

  static async removeItemFromBooklist(itemId: string, creatorId: string, userRole: string) {
    const item = await prisma.booklistItem.findUnique({ 
      where: { id: itemId },
      include: { booklist: true }
    });

    if (!item) throw new AppError(404, 'NOT_FOUND', 'Booklist item not found');
    if (item.booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    await prisma.booklistItem.delete({ where: { id: itemId } });
    return { success: true, message: 'Item removed from booklist' };
  }

  static async updateBooklistItemNotes(itemId: string, creatorId: string, userRole: string, data: any) {
    const item = await prisma.booklistItem.findUnique({
      where: { id: itemId },
      include: { booklist: true },
    });

    if (!item) throw new AppError(404, 'NOT_FOUND', 'Booklist item not found');
    if (item.booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    return prisma.booklistItem.update({
      where: { id: itemId },
      data: { notes: data?.notes },
    });
  }
}
