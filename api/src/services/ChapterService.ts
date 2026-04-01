import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { Prisma } from '@prisma/client';

export class ChapterService {
  static async createChapter(authorId: string, userRole: string, data: any) {
    const { storyId, branchId, title, content, orderIndex, isBranchPoint, characterData } = data;

    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new AppError(404, 'NOT_FOUND', 'Story not found');

    let hasPermission = false;
    if (story.authorId === authorId || userRole === 'admin') {
      hasPermission = true;
    } else if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (branch && branch.authorId === authorId) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      throw new AppError(403, 'FORBIDDEN', 'Not authorized to add chapters to this story/branch');
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

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: { story: true }
    });

    if (!chapter) throw new AppError(404, 'NOT_FOUND', 'Chapter not found');

    // Check permissions: Story author, collaborator, or admin
    if (chapter.story.authorId !== authorId) {
      const collaboration = await prisma.collaboration.findFirst({
        where: { storyId: chapter.storyId, userId: authorId, status: 'approved' }
      });
      if (!collaboration && userRole !== 'admin') {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
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
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: { story: true }
    });

    if (!chapter) throw new AppError(404, 'NOT_FOUND', 'Chapter not found');

    if (chapter.story.authorId !== authorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

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
}
