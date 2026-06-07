import { prisma } from '../../prisma';
import { AppError } from '../../utils/http';
import { parsePagination, paginatedResponse, PaginatedResponse } from '../../utils/pagination';
import { BooklistItemService } from './BooklistItemService';

export class BooklistCrudService {
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
        { viewCount: 'desc' },
        { createdAt: 'desc' }
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
      booklist.items.map((item) => BooklistItemService.resolveItem(item))
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
}
