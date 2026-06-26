import { prisma } from '../prisma';
import { AppError } from '../utils/http';

export class EventCommentService {
  static async getByEvent(eventId: string) {
    const event = await prisma.storyEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError(404, 'NOT_FOUND', '大事件不存在');

    return prisma.eventComment.findMany({
      where: { eventId },
      include: {
        author: {
          select: { username: true, avatarUrl: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(eventId: string, authorId: string, content: string) {
    const event = await prisma.storyEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError(404, 'NOT_FOUND', '大事件不存在');

    return prisma.eventComment.create({
      data: { content, eventId, authorId },
      include: {
        author: { select: { username: true, avatarUrl: true, role: true } },
      },
    });
  }

  static async delete(commentId: string, actorId: string, actorRole: string) {
    const comment = await prisma.eventComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError(404, 'NOT_FOUND', '评论不存在');
    if (comment.authorId !== actorId && actorRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', '无权限删除此评论');
    }

    await prisma.eventComment.delete({ where: { id: commentId } });
    return { success: true };
  }
}
