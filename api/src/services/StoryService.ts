import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { parsePagination, paginatedResponse, PaginatedResponse } from '../utils/pagination';
import { Prisma } from '@prisma/client';
import type { UpdateStoryDTO } from '../utils/validation';

export interface StoryListQuery {
  isOfficial?: string;
  tag?: string;
  q?: string;
  page?: string;
  limit?: string;
}

export interface StoryListItem {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  status: string;
  isOfficial: boolean;
  viewCount: number;
  branchCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: { username: string; role: string };
  tags: { name: string }[];
  _count: { branches: number; chapters: number };
}

export class StoryService {
  static async getAllStories(query: Record<string, string>): Promise<PaginatedResponse<StoryListItem>> {
    const { isOfficial, tag, q } = query;
    const { page, limit } = parsePagination(query);
    const where: Prisma.StoryWhereInput = {};

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } }
      ];
    }

    if (tag) {
      where.tags = {
        some: {
          name: tag
        }
      };
    }

    if (typeof isOfficial === 'string') {
      const v = isOfficial.toLowerCase();
      if (v === 'true' || v === '1') {
        where.isOfficial = true;
      } else if (v === 'false' || v === '0') {
        where.isOfficial = false;
      }
    }

    const select = {
      id: true,
      title: true,
      description: true,
      coverImage: true,
      status: true,
      isOfficial: true,
      viewCount: true,
      branchCount: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          username: true,
          role: true,
        },
      },
      tags: true,
      _count: {
        select: {
          branches: true,
          chapters: true,
        },
      },
    } as const;

    const [items, total] = await Promise.all([
      prisma.story.findMany({
        where,
        select,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.story.count({ where }),
    ]);

    return paginatedResponse(items as StoryListItem[], total, page, limit);
  }

  static async getStoryById(id: string) {
    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        tags: true,
        chapters: {
          where: { branchId: null },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            content: true,
            orderIndex: true,
            isBranchPoint: true,
            createdAt: true,
          }
        },
        branches: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
            parentChapter: {
              select: {
                id: true,
                title: true,
                orderIndex: true,
              },
            },
            _count: {
              select: { chapters: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        spinoffs: {
          include: {
            author: {
              select: { id: true, username: true },
            },
            originalChapter: {
              select: { id: true, title: true, orderIndex: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!story) {
      throw new AppError(404, 'NOT_FOUND', 'Story not found');
    }

    return story;
  }

  static async createStory(authorId: string, data: Prisma.StoryCreateInput & { tags?: string[] }) {
    const { title, description, coverImage, metadata, tags } = data;

    // Determine isOfficial based on author's role
    const author = await prisma.user.findUnique({ where: { id: authorId }, select: { role: true } });
    const isOfficial = author?.role === 'author' || author?.role === 'admin';

    return prisma.story.create({
      data: {
        title,
        description,
        coverImage,
        isOfficial,
        metadata: metadata ? JSON.stringify(metadata) : null,
        authorId,
        tags: tags ? {
          connectOrCreate: tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag }
          }))
        } : undefined
      },
      include: { tags: true }
    });
  }

  static async updateStory(id: string, authorId: string, role: string, data: UpdateStoryDTO) {
    const { title, description, coverImage, status, metadata, tags } = data;
    const story = await prisma.story.findUnique({ where: { id } });

    if (!story) {
      throw new AppError(404, 'NOT_FOUND', 'Story not found');
    }

    if (story.authorId !== authorId && role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Not authorized to update this story');
    }

    return prisma.story.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(status !== undefined && { status }),
        metadata: metadata !== undefined ? JSON.stringify(metadata) : story.metadata,
        tags: tags ? {
          set: [],
          connectOrCreate: tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag }
          }))
        } : undefined
      },
      include: { tags: true }
    });
  }

  static async deleteStory(id: string, authorId: string, role: string) {
    const story = await prisma.story.findUnique({ where: { id } });

    if (!story) {
      throw new AppError(404, 'NOT_FOUND', 'Story not found');
    }

    if (story.authorId !== authorId && role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Not authorized to delete this story');
    }

    await prisma.story.delete({ where: { id } });
    return { success: true, message: 'Story deleted successfully' };
  }

  static async getMyStories(authorId: string, query: { page?: string; limit?: string } = {}) {
    const { page, limit } = parsePagination(query);

    const where = { authorId };
    const [items, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: {
          tags: true,
          _count: {
            select: {
              branches: true,
              chapters: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.story.count({ where }),
    ]);

    return paginatedResponse(items, total, page, limit);
  }

  static async getStoryCharacters(storyId: string) {
    return prisma.character.findMany({
      where: { storyId },
      orderBy: { createdAt: 'asc' }
    });
  }

  static async createCharacter(storyId: string, authorId: string, role: string, data: Prisma.CharacterCreateInput) {
    const { name, description, avatarUrl, role: charRole, attributes } = data;
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    
    if (!story) throw new AppError(404, 'NOT_FOUND', 'Story not found');
    if (story.authorId !== authorId && role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    return prisma.character.create({
      data: {
        storyId,
        name,
        description,
        avatarUrl,
        role: charRole || 'supporting',
        attributes: attributes ? JSON.stringify(attributes) : null
      }
    });
  }

  static async updateCharacter(charId: string, authorId: string, role: string, data: Prisma.CharacterUpdateInput) {
    const { name, description, avatarUrl, role: charRole, attributes } = data;
    const character = await prisma.character.findUnique({
      where: { id: charId },
      include: { story: true }
    });

    if (!character) throw new AppError(404, 'NOT_FOUND', 'Character not found');
    if (character.story.authorId !== authorId && role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    return prisma.character.update({
      where: { id: charId },
      data: {
        name,
        description,
        avatarUrl,
        role: charRole,
        attributes: attributes ? JSON.stringify(attributes) : character.attributes
      }
    });
  }

  static async deleteCharacter(charId: string, authorId: string, role: string) {
    const character = await prisma.character.findUnique({
      where: { id: charId },
      include: { story: true }
    });

    if (!character) throw new AppError(404, 'NOT_FOUND', 'Character not found');
    if (character.story.authorId !== authorId && role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    await prisma.character.delete({ where: { id: charId } });
    return { success: true, message: 'Character deleted successfully' };
  }

  static async certifyBranch(branchId: string, userId: string, role: string, data: { isCertified: boolean }) {
    const { isCertified } = data;

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { parentStory: true }
    });

    if (!branch) throw new AppError(404, 'NOT_FOUND', 'Branch not found');

    if (branch.parentStory.authorId !== userId && role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Only story author or admin can certify branches');
    }

    return prisma.branch.update({
      where: { id: branchId },
      data: {
        isCertified,
        certifiedAt: isCertified ? new Date() : null,
        contributionScore: isCertified ? 1000 : 0
      }
    });
  }

  static async getStoryCharacterAppearances(storyId: string) {
    return prisma.characterAppearance.findMany({
      where: {
        character: { storyId },
      },
      include: {
        character: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  static async batchUpdateCharacterAppearances(
    storyId: string,
    authorId: string,
    role: string,
    appearances: { characterId: string; targetType: string; targetId: string; appearanceType: string }[]
  ) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new AppError(404, 'NOT_FOUND', 'Story not found');
    if (story.authorId !== authorId && role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    // Delete existing appearances for this story and create new ones atomically
    const result = await prisma.$transaction(async (tx) => {
      await tx.characterAppearance.deleteMany({
        where: {
          character: { storyId },
        },
      });

      if (appearances.length === 0) return [];

      return tx.characterAppearance.createMany({
        data: appearances.map((a) => ({
          characterId: a.characterId,
          targetType: a.targetType,
          targetId: a.targetId,
          appearanceType: a.appearanceType,
        })),
      });
    });

    return { success: true, count: appearances.length };
  }

  static async getRecentReads(userId: string) {
    const history = await prisma.readingHistory.findMany({
      where: { userId },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            story: {
              select: {
                id: true,
                title: true,
                coverImage: true
              }
            },
            branch: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: { readAt: 'desc' },
      take: 5
    });
    
    return history.map(item => ({
      ...item.chapter,
      readAt: item.readAt,
      progress: item.progress
    }));
  }

  static async getTags() {
    return prisma.tag.findMany({
      include: {
        _count: {
          select: { stories: true }
        }
      },
      orderBy: {
        stories: {
          _count: 'desc'
        }
      },
      take: 20
    });
  }
}
