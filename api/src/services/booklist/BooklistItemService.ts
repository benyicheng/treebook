import { prisma } from '../../prisma';
import { AppError } from '../../utils/http';

export class BooklistItemService {
  /**
   * Resolve a polymorphic booklist item to its display info.
   */
  static async resolveItem(item: any) {
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

  /**
   * Add an item to a booklist with polymorphic target support.
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
