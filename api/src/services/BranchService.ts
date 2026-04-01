import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { Prisma } from '@prisma/client';

export class BranchService {
  static async createBranch(authorId: string, userRole: string, data: any) {
    const { parentStoryId, parentChapterId, title, description, branchType, conditions, isOfficial } = data;

    const parentStory = await prisma.story.findUnique({ where: { id: parentStoryId } });
    if (!parentStory) throw new AppError(404, 'NOT_FOUND', 'Parent story not found');

    // Official status check
    let finalIsOfficial = false;
    if (isOfficial && (parentStory.authorId === authorId || userRole === 'admin')) {
      finalIsOfficial = true;
    }

    const branch = await prisma.branch.create({
      data: {
        parentStoryId,
        parentChapterId,
        authorId,
        title,
        description,
        branchType: branchType || 'parallel',
        isOfficial: finalIsOfficial,
        conditions: conditions ? JSON.stringify(conditions) : null,
      },
    });

    // Increment branchCount in the parent story
    await prisma.story.update({
      where: { id: parentStoryId },
      data: { branchCount: { increment: 1 } }
    });

    return branch;
  }

  static async getBranches(limit?: number) {
    return prisma.branch.findMany({
      include: {
        author: {
          select: { username: true, role: true }
        },
        parentStory: {
          select: { title: true, coverImage: true }
        },
        _count: {
          select: { chapters: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async getBranchById(id: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        author: {
          select: { username: true, role: true }
        },
        chapters: {
          orderBy: { orderIndex: 'asc' }
        },
        parentStory: {
          include: {
            spinoffs: {
              include: {
                author: {
                  select: { username: true },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        parentChapter: true,
      }
    });

    if (!branch) throw new AppError(404, 'NOT_FOUND', 'Branch not found');

    return branch;
  }

  static async updateBranch(id: string, authorId: string, userRole: string, data: any) {
    const { title, description, branchType, conditions, isOfficial } = data;

    const branch = await prisma.branch.findUnique({
      where: { id },
      include: { parentStory: true }
    });

    if (!branch) throw new AppError(404, 'NOT_FOUND', 'Branch not found');

    // Permission check: Branch author, story author, or admin
    const hasPermission = 
      branch.authorId === authorId || 
      branch.parentStory.authorId === authorId ||
      userRole === 'admin';

    if (!hasPermission) {
      throw new AppError(403, 'FORBIDDEN', 'Not authorized to update this branch');
    }

    // Official status check
    let finalIsOfficial = branch.isOfficial;
    if (isOfficial !== undefined && (branch.parentStory.authorId === authorId || userRole === 'admin')) {
      finalIsOfficial = isOfficial;
    }

    return prisma.branch.update({
      where: { id },
      data: {
        title,
        description,
        branchType,
        conditions: conditions ? JSON.stringify(conditions) : branch.conditions,
        isOfficial: finalIsOfficial,
      },
    });
  }

  static async getMyBranches(authorId: string) {
    return prisma.branch.findMany({
      where: { authorId },
      include: {
        parentStory: {
          select: { title: true }
        },
        _count: {
          select: { chapters: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async deleteBranch(id: string, authorId: string, userRole: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: { parentStory: true }
    });

    if (!branch) throw new AppError(404, 'NOT_FOUND', 'Branch not found');

    const hasPermission = 
      branch.authorId === authorId || 
      branch.parentStory.authorId === authorId ||
      userRole === 'admin';

    if (!hasPermission) {
      throw new AppError(403, 'FORBIDDEN', 'Not authorized to delete this branch');
    }

    // Chapters are deleted via cascade in Prisma
    await prisma.branch.delete({ where: { id } });

    // Decrement branchCount in the parent story
    await prisma.story.update({
      where: { id: branch.parentStoryId },
      data: { branchCount: { decrement: 1 } }
    });

    return { success: true, message: 'Branch deleted successfully' };
  }
}
