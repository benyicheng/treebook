import { prisma } from '../prisma';
import { AppError } from '../utils/http';
import { parsePagination, paginatedResponse, PaginatedResponse } from '../utils/pagination';
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

  static async getBranches(query: { page?: string; limit?: string } = {}): Promise<PaginatedResponse<any>> {
    const { page, limit } = parsePagination(query);

    const where = {};
    const [items, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        include: {
          author: {
            select: { id: true, username: true, role: true }
          },
          parentStory: {
            select: { title: true, coverImage: true }
          },
          _count: {
            select: { chapters: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.branch.count({ where }),
    ]);

    return paginatedResponse(items, total, page, limit);
  }

  static async getBranchById(id: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, role: true }
        },
        chapters: {
          orderBy: { orderIndex: 'asc' }
        },
        parentStory: {
          include: {
            spinoffs: {
              include: {
                author: {
                  select: { id: true, username: true },
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

  static async getMyBranches(authorId: string, query: { page?: string; limit?: string } = {}) {
    const { page, limit } = parsePagination(query);

    const where = { authorId };
    const [items, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        include: {
          parentStory: {
            select: { title: true }
          },
          _count: {
            select: { chapters: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.branch.count({ where }),
    ]);

    return paginatedResponse(items, total, page, limit);
  }

  /**
   * Create a sub-branch under an existing branch.
   * Auto-calculates treeDepth = parent.treeDepth + 1.
   * Max depth: 5 layers.
   */
  static async createSubBranch(authorId: string, userRole: string, data: any) {
    const { parentBranchId, parentChapterId, title, description, branchType, conditions } = data;

    // Validate parent branch
    const parentBranch = await prisma.branch.findUnique({
      where: { id: parentBranchId },
      include: { parentStory: true },
    });
    if (!parentBranch) throw new AppError(404, 'NOT_FOUND', '父分支不存在');

    // Permission: branch author, story author, or admin
    const hasPermission =
      parentBranch.authorId === authorId ||
      parentBranch.parentStory.authorId === authorId ||
      userRole === 'admin';
    if (!hasPermission) {
      throw new AppError(403, 'FORBIDDEN', '无权在此分支下创建子分支');
    }

    // Depth cap
    const treeDepth = parentBranch.treeDepth + 1;
    if (treeDepth > 5) {
      throw new AppError(400, 'DEPTH_EXCEEDED', '分支嵌套深度不能超过5层');
    }

    const subBranch = await prisma.branch.create({
      data: {
        parentStoryId: parentBranch.parentStoryId,
        parentChapterId,
        parentBranchId,
        authorId,
        title,
        description,
        branchType: branchType || 'parallel',
        treeDepth,
        isOfficial: parentBranch.isOfficial,
        conditions: conditions ? JSON.stringify(conditions) : null,
      },
    });

    // Increment branchCount in the parent story
    await prisma.story.update({
      where: { id: parentBranch.parentStoryId },
      data: { branchCount: { increment: 1 } },
    });

    return subBranch;
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
