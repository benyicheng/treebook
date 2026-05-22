import { prisma } from '../prisma';
import { AppError } from '../utils/http';
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
  }) {
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

    return prisma.booklist.findMany({
      where,
      include: {
        creator: { select: { username: true } },
        _count: { select: { items: true } }
      },
      orderBy,
      take: query?.limit
    });
  }

  static async getMyBooklists(creatorId: string) {
    return prisma.booklist.findMany({
      where: { creatorId },
      include: {
        _count: { select: { items: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async getBooklistById(id: string) {
    const booklist = await prisma.booklist.findUnique({
      where: { id },
      include: {
        creator: { select: { username: true } },
        items: {
          include: {
            chapter: {
              select: {
                id: true,
                title: true,
                story: { select: { title: true, author: { select: { username: true } } } },
                branch: { select: { title: true } }
              }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');

    // Update view count
    await prisma.booklist.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    return booklist;
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

  static async addItemToBooklist(booklistId: string, creatorId: string, userRole: string, data: any) {
    const booklist = await prisma.booklist.findUnique({ where: { id: booklistId } });
    
    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');
    if (booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    // Check for duplicates
    const existingItem = await prisma.booklistItem.findFirst({
      where: { booklistId, chapterId: data.chapterId }
    });

    if (existingItem) {
      throw new AppError(400, 'DUPLICATE_ITEM', 'This chapter is already in the booklist');
    }

    // Get current items count for auto-incrementing orderIndex
    const currentCount = await prisma.booklistItem.count({ where: { booklistId } });

    return prisma.booklistItem.create({
      data: {
        booklistId,
        chapterId: data.chapterId,
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
