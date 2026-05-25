import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { ensure } from '../utils/entity';

export class ChapterService {
  static async createChapter(authorId: string, userRole: string, data: any) {
    const { storyId, branchId, title, content, orderIndex, isBranchPoint, characterData } = data;

    const story = await ensure.exists<any>(prisma.story, storyId, 'Story');

    let hasPermission = false;
    if (story.authorId === authorId || userRole === 'admin') {
      hasPermission = true;
    } else if (branchId) {
      const branch = await ensure.exists<any>(prisma.branch, branchId, 'Branch');
      if (branch.authorId === authorId) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      throw new AppError(403, 'FORBIDDEN', '没有权限向此故事/分支添加章节');
    }

    return prisma.chapter.create({
      data: {
        storyId,
        branchId,
        title,
        content,
        orderIndex,
        isBranchPoint: isBranchPoint || false,
        characterData: characterData ? JSON.stringify(characterData) : null,
      },
    });
  }

  static async updateChapter(id: string, authorId: string, userRole: string, data: any) {
    const { title, content, orderIndex, isBranchPoint, characterData } = data;

    const chapter = await ensure.exists<any>(prisma.chapter, id, 'Chapter', { story: true });

    // Check permissions: Story author, collaborator, or admin
    if (chapter.story.authorId !== authorId && userRole !== 'admin') {
      const collaboration = await prisma.collaboration.findFirst({
        where: { storyId: chapter.storyId, userId: authorId, status: 'approved' }
      });
      if (!collaboration) {
        throw new AppError(403, 'FORBIDDEN', '权限不足');
      }
    }

    return prisma.chapter.update({
      where: { id },
      data: {
        title,
        content,
        orderIndex,
        isBranchPoint,
        characterData: characterData ? JSON.stringify(characterData) : chapter.characterData,
      },
    });
  }

  static async deleteChapter(id: string, authorId: string, userRole: string) {
    const chapter = await ensure.exists<any>(prisma.chapter, id, 'Chapter', { story: true });

    await ensure.isOwner(authorId, userRole, chapter.story.authorId);

    await prisma.chapter.delete({ where: { id } });
    return { success: true, message: 'Chapter deleted successfully' };
  }

  static async getChapterById(id: string, userId?: string, referralBooklistId?: string) {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            author: { select: { username: true } }
          }
        },
        branch: {
          select: {
            id: true,
            title: true,
            author: { select: { username: true } }
          }
        },
        branchesFrom: {
          select: {
            id: true,
            title: true,
            description: true,
            isOfficial: true,
            viewCount: true,
            author: { select: { username: true } },
            _count: { select: { chapters: true } },
          }
        }
      }
    });

    if (!chapter) throw new AppError(404, 'NOT_FOUND', 'Chapter not found');

    if (userId) {
      // 检查引流书单是否存在（如果提供了）
      let validReferralId: string | null = null;
      if (referralBooklistId) {
        const booklist = await prisma.booklist.findUnique({ where: { id: referralBooklistId } });
        if (booklist) {
          validReferralId = referralBooklistId;
        }
      }

      // 追踪阅读历史和引流来源
      await prisma.readingHistory.upsert({
        where: {
          userId_chapterId: { userId, chapterId: id }
        },
        update: { 
          readAt: new Date(),
          referralBooklistId: validReferralId || undefined 
        },
        create: { 
          userId, 
          chapterId: id,
          referralBooklistId: validReferralId
        }
      });
    }

    // Interaction stats
    await prisma.interactionStat.upsert({
      where: { targetType_targetId: { targetType: 'chapter', targetId: id } },
      create: { targetType: 'chapter', targetId: id, viewCount: 1 },
      update: { viewCount: { increment: 1 } },
    });

    const [viewStat, commentCount] = await Promise.all([
      prisma.interactionStat.findUnique({
        where: { targetType_targetId: { targetType: 'chapter', targetId: id } },
        select: { viewCount: true }
      }),
      prisma.comment.count({
        where: { chapterId: id }
      })
    ]);

    const [nextChapter, prevChapter] = await Promise.all([
      prisma.chapter.findFirst({
        where: {
          storyId: chapter.storyId,
          branchId: chapter.branchId,
          orderIndex: chapter.orderIndex + 1
        },
        select: { id: true, title: true }
      }),
      prisma.chapter.findFirst({
        where: {
          storyId: chapter.storyId,
          branchId: chapter.branchId,
          orderIndex: chapter.orderIndex - 1
        },
        select: { id: true, title: true }
      })
    ]);

    return {
      ...chapter,
      nextChapter,
      prevChapter,
      viewCount: viewStat?.viewCount || 0,
      commentCount
    };
  }

  static async getByStory(storyId: string, branchId?: string | null, includeBranches?: boolean) {
    if (includeBranches) {
      // Return ALL chapters for the story across all tracks, with branch info for grouping
      return prisma.chapter.findMany({
        where: { storyId },
        orderBy: [
          { branchId: 'asc' },
          { orderIndex: 'asc' }
        ],
        select: {
          id: true,
          title: true,
          orderIndex: true,
          isBranchPoint: true,
          branchId: true,
          createdAt: true,
          branch: {
            select: { id: true, title: true }
          }
        }
      });
    }
    const where: any = { storyId };
    if (branchId !== undefined) {
      where.branchId = branchId;
    } else {
      where.branchId = null; // main story chapters
    }
    return prisma.chapter.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        title: true,
        orderIndex: true,
        isBranchPoint: true,
        createdAt: true,
      }
    });
  }

  static async searchChapters(query: string) {
    if (!query || query.trim().length === 0) return [];

    return prisma.chapter.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { story: { title: { contains: query } } },
        ],
      },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            author: { select: { username: true } },
          },
        },
      },
      orderBy: [
        { storyId: 'asc' },
        { orderIndex: 'asc' },
      ],
      take: 50,
    });
  }

  static async getComments(chapterId: string) {
    return prisma.comment.findMany({
      where: { chapterId },
      include: {
        author: {
          select: { username: true, avatarUrl: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createComment(chapterId: string, authorId: string, content: string) {
    return prisma.comment.create({
      data: {
        content,
        chapterId,
        authorId
      },
      include: {
        author: {
          select: { username: true, avatarUrl: true, role: true }
        }
      }
    });
  }

  static async updateComment(commentId: string, actorUserId: string, actorRole: string, content: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
    if (comment.authorId !== actorUserId && actorRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    return prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: { username: true, avatarUrl: true, role: true }
        }
      }
    });
  }
}
