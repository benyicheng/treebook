import { prisma } from '../prisma';
import { AppError } from '../utils/http';

export class MergeService {
  static async createMergeRequest(userId: string, data: any) {
    const { branchId, spinoffId, storyId, message, type = 'branch_merge' } = data;

    if (type === 'branch_merge') {
      if (!branchId) throw new AppError(400, 'BAD_REQUEST', '缺少分支ID');
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch || branch.authorId !== userId) {
        throw new AppError(403, 'FORBIDDEN', '你没有权限为此分支发起合并请求');
      }
      const existing = await prisma.mergeRequest.findFirst({
        where: { branchId, status: 'pending' }
      });
      if (existing) throw new AppError(400, 'BAD_REQUEST', '该分支已有挂起的合并请求');

      return prisma.mergeRequest.create({
        data: { type, branchId, storyId, message, status: 'pending' }
      });
    } 
    
    if (type === 'spinoff_official') {
      if (!spinoffId) throw new AppError(400, 'BAD_REQUEST', '缺少番外ID');
      const spinoff = await prisma.spinoff.findUnique({ where: { id: spinoffId } });
      if (!spinoff || spinoff.authorId !== userId) {
        throw new AppError(403, 'FORBIDDEN', '你没有权限为此番外发起认证请求');
      }
      const existing = await prisma.mergeRequest.findFirst({
        where: { spinoffId, status: 'pending' }
      });
      if (existing) throw new AppError(400, 'BAD_REQUEST', '该番外已有挂起的认证请求');

      return prisma.mergeRequest.create({
        data: { type, spinoffId, storyId, message, status: 'pending' }
      });
    }

    throw new AppError(400, 'BAD_REQUEST', '无效的请求类型');
  }

  static async getMergeRequests(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new AppError(404, 'NOT_FOUND', '故事不存在');

    const isOriginalAuthor = story.authorId === userId;

    const requests = await prisma.mergeRequest.findMany({
      where: { storyId },
      include: {
        branch: { include: { author: { select: { username: true } } } },
        spinoff: { include: { author: { select: { username: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return isOriginalAuthor 
      ? requests 
      : requests.filter(r => 
          (r.branch?.authorId === userId) || (r.spinoff?.authorId === userId)
        );
  }

  static async handleMergeRequest(requestId: string, userId: string, data: { status: 'approved' | 'rejected', reviewComment?: string }) {
    const { status, reviewComment } = data;

    const mergeRequest = await prisma.mergeRequest.findUnique({
      where: { id: requestId },
      include: {
        story: true,
        branch: true,
        spinoff: true
      }
    });

    if (!mergeRequest) throw new AppError(404, 'NOT_FOUND', '请求不存在');
    if (mergeRequest.story.authorId !== userId) {
      throw new AppError(403, 'FORBIDDEN', '只有故事原作者可以审核请求');
    }

    if (status === 'approved') {
      if (mergeRequest.type === 'branch_merge' && mergeRequest.branchId) {
        await prisma.$transaction([
          prisma.branch.update({
            where: { id: mergeRequest.branchId },
            data: { isOfficial: true, status: 'merged' }
          }),
          prisma.mergeRequest.update({
            where: { id: requestId },
            data: { status: 'approved', reviewComment }
          })
        ]);
      } else if (mergeRequest.type === 'spinoff_official' && mergeRequest.spinoffId) {
        await prisma.$transaction([
          prisma.spinoff.update({
            where: { id: mergeRequest.spinoffId },
            data: { isOfficial: true }
          }),
          prisma.mergeRequest.update({
            where: { id: requestId },
            data: { status: 'approved', reviewComment }
          })
        ]);
      }
    } else {
      await prisma.mergeRequest.update({
        where: { id: requestId },
        data: { status: 'rejected', reviewComment }
      });
    }

    return { success: true, message: `请求已${status === 'approved' ? '通过' : '拒绝'}` };
  }
}
