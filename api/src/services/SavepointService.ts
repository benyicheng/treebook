import { prisma } from '../prisma';
import { AppError } from '../utils/http';

export class SavepointService {
  static async createSavepoint(userId: string, data: any) {
    const { storyId, branchId, chapterId, name } = data;

    return prisma.readingSavepoint.create({
      data: {
        userId,
        storyId,
        branchId: branchId || null,
        chapterId,
        name: name || `存档于 ${new Date().toLocaleString()}`
      },
      include: {
        chapter: { select: { title: true } },
        branch: { select: { title: true } }
      }
    });
  }

  static async getUserSavepoints(userId: string, storyId?: string) {
    return prisma.readingSavepoint.findMany({
      where: { 
        userId,
        storyId: storyId ? storyId : undefined
      },
      include: {
        story: { select: { title: true } },
        branch: { select: { title: true } },
        chapter: { select: { title: true, orderIndex: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async deleteSavepoint(id: string, userId: string) {
    const savepoint = await prisma.readingSavepoint.findUnique({ where: { id } });
    if (!savepoint) throw new AppError(404, 'NOT_FOUND', 'Savepoint not found');
    if (savepoint.userId !== userId) throw new AppError(403, 'FORBIDDEN', 'Access denied');

    await prisma.readingSavepoint.delete({ where: { id } });
    return { success: true, message: 'Savepoint deleted' };
  }
}
