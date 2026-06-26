import { AppError } from './http';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../prisma';

export interface CurrentUser {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
}

export function getCurrentUser(req: AuthRequest): CurrentUser {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
  }
  return req.user;
}

/**
 * Verify that a target content entity exists and the current user is its author.
 * Throws 404 if entity not found, 403 if user is not the author.
 */
export async function verifyTargetAccess(targetType: string, targetId: string, userId: string): Promise<void> {
  let isAuthor = false;
  switch (targetType) {
    case 'chapter': {
      const chapter = await prisma.chapter.findUnique({
        where: { id: targetId },
        select: { story: { select: { authorId: true } } },
      });
      if (!chapter) throw new AppError(404, 'TARGET_NOT_FOUND', `chapter with id ${targetId} not found`);
      isAuthor = chapter.story?.authorId === userId;
      break;
    }
    case 'branch': {
      const branch = await prisma.branch.findUnique({
        where: { id: targetId },
        select: { authorId: true },
      });
      if (!branch) throw new AppError(404, 'TARGET_NOT_FOUND', `branch with id ${targetId} not found`);
      isAuthor = branch.authorId === userId;
      break;
    }
    case 'spinoff': {
      const spinoff = await prisma.spinoff.findUnique({
        where: { id: targetId },
        select: { authorId: true },
      });
      if (!spinoff) throw new AppError(404, 'TARGET_NOT_FOUND', `spinoff with id ${targetId} not found`);
      isAuthor = spinoff.authorId === userId;
      break;
    }
    default:
      throw new AppError(400, 'VALIDATION_ERROR', `Unsupported target type: ${targetType}`);
  }
  if (!isAuthor) {
    throw new AppError(403, 'FORBIDDEN', 'You are not the author of this content');
  }
}
