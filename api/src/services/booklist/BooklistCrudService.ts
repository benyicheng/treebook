import { prisma } from '../../prisma';
import { AppError } from '../../utils/http';
import { parsePagination, paginatedResponse, PaginatedResponse } from '../../utils/pagination';
import { BooklistItemService } from './BooklistItemService';

function parseTags(tags: string | string[] | undefined): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);
  return tags.split(',').map(t => t.trim()).filter(Boolean);
}

function buildTagString(tagNames: string[]) {
  return tagNames.length > 0 ? tagNames.join(',') : undefined;
}

export class BooklistCrudService {
  static async createBooklist(creatorId: string, data: any) {
    const { title, description, isPublic, type, tags, coverImage } = data;
    const tagNames = parseTags(tags);
    return prisma.booklist.create({
      data: {
        creatorId,
        title,
        description,
        isPublic: isPublic !== undefined ? isPublic : true,
        type: type || 'COLLECTION',
        coverImage: coverImage || undefined,
        tags: buildTagString(tagNames),
      }
    });
  }

  static async getBooklists(query?: {
    creatorId?: string;
    isPublic?: boolean;
    limit?: number;
    type?: string;
    tag?: string;
    q?: string;
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
    // Full-text search across title and description
    if (query?.q && query.q.trim()) {
      where.OR = [
        { title: { contains: query.q.trim(), mode: 'insensitive' } },
        { description: { contains: query.q.trim(), mode: 'insensitive' } },
      ];
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
        },
        paths: {
          select: {
            id: true,
            title: true,
            description: true,
            origin: true,
            viewCount: true,
            startCount: true,
            completionCount: true,
            createdAt: true,
            creator: { select: { id: true, username: true } },
            _count: { select: { nodes: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      }
    });

    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');

    // Resolve polymorphic items (batch to avoid N+1)
    const resolvedItems = await BooklistItemService.resolveItems(booklist.items);

    // Group items by section (backfill missing sections from targetType)
    const itemsBySection: Record<string, any[]> = {};
    for (const item of resolvedItems) {
      const section = item.section || (
        item.targetType === 'chapter' ? 'mainline' :
        item.targetType === 'story' ? 'story' :
        item.targetType === 'branch' ? 'branch' :
        item.targetType === 'spinoff' ? 'spinoff' :
        item.targetType === 'event' ? 'event' :
        item.targetType === 'wiki' ? 'wiki' :
        'general'
      );
      if (!itemsBySection[section]) itemsBySection[section] = [];
      itemsBySection[section].push(item);
    }

    // Group items by storyId for hierarchical rendering
    const itemsByStory: Record<string, { storyId: string; story?: any; items: any[]; events: any[]; children: any[] }> = {};
    const ungrouped: any[] = [];
    const storyIds = new Set(resolvedItems.filter((i: any) => i.storyId).map((i: any) => i.storyId));
    let storyMap = new Map<string, any>();
    if (storyIds.size > 0) {
      const stories = await prisma.story.findMany({
        where: { id: { in: [...storyIds] } },
        select: { id: true, title: true, coverImage: true, author: { select: { id: true, username: true } } },
      });
      storyMap = new Map(stories.map(s => [s.id, s]));
    }
    for (const item of resolvedItems) {
      if (item.storyId && storyMap.has(item.storyId)) {
        if (!itemsByStory[item.storyId]) {
          itemsByStory[item.storyId] = { storyId: item.storyId, story: storyMap.get(item.storyId), items: [], events: [], children: [] };
        }
        if (item.targetType === 'event') {
          itemsByStory[item.storyId].events.push(item);
        } else if (item.parentItemId) {
          itemsByStory[item.storyId].children.push(item);
        } else {
          itemsByStory[item.storyId].items.push(item);
        }
      } else {
        ungrouped.push(item);
      }
    }

    // Update view count
    await prisma.booklist.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    return { ...booklist, items: resolvedItems, itemsBySection, itemsByStory: Object.values(itemsByStory), ungroupedItems: ungrouped };
  }

  static async updateBooklist(id: string, creatorId: string, userRole: string, data: any) {
    const booklist = await prisma.booklist.findUnique({ where: { id } });

    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');
    if (booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    const tagNames = data.tags !== undefined ? parseTags(data.tags) : undefined;

    return prisma.booklist.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        type: data.type,
        coverImage: data.coverImage,
        isPublic: data.isPublic,
        tags: tagNames !== undefined ? buildTagString(tagNames) : undefined,
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

  static async getBooklistWikiPages(booklistId: string) {
    const booklist = await prisma.booklist.findUnique({ where: { id: booklistId }, select: { id: true } });
    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');

    return prisma.wikiPage.findMany({
      where: { booklistId },
      include: {
        creator: { select: { id: true, username: true, avatarUrl: true } },
        story: { select: { id: true, title: true } },
        _count: { select: { outgoingLinks: true, incomingLinks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
