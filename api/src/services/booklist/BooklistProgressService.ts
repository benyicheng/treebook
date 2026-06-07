import { prisma } from '../../prisma';
import { AppError } from '../../utils/http';
import { Prisma } from '@prisma/client';

export class BooklistProgressService {
  static async upsertProgress(booklistId: string, userId: string, data: { currentItemIndex?: number; completedItemIds?: string[] }) {
    const booklist = await prisma.booklist.findUnique({ where: { id: booklistId } });
    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');

    return prisma.booklistProgress.upsert({
      where: {
        userId_booklistId: { userId, booklistId },
      },
      create: {
        userId,
        booklistId,
        currentItemIndex: data.currentItemIndex ?? -1,
        completedItemIds: JSON.stringify(data.completedItemIds ?? []),
      },
      update: {
        currentItemIndex: data.currentItemIndex ?? undefined,
        completedItemIds: data.completedItemIds !== undefined
          ? JSON.stringify(data.completedItemIds)
          : undefined,
      },
    });
  }

  /**
   * Atomically toggle a single item's completion status.
   */
  static async toggleProgressItem(booklistId: string, userId: string, itemId: string) {
    const booklist = await prisma.booklist.findUnique({ where: { id: booklistId } });
    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const progress = await tx.booklistProgress.findUnique({
        where: { userId_booklistId: { userId, booklistId } },
      });

      let completedIds: string[];
      if (progress) {
        completedIds = JSON.parse(progress.completedItemIds);
        const idx = completedIds.indexOf(itemId);
        if (idx >= 0) {
          completedIds.splice(idx, 1);
        } else {
          completedIds.push(itemId);
        }
      } else {
        completedIds = [itemId];
      }

      return tx.booklistProgress.upsert({
        where: { userId_booklistId: { userId, booklistId } },
        create: { userId, booklistId, completedItemIds: JSON.stringify(completedIds) },
        update: { completedItemIds: JSON.stringify(completedIds) },
      });
    });
  }

  static async getProgress(booklistId: string, userId: string) {
    const progress = await prisma.booklistProgress.findUnique({
      where: {
        userId_booklistId: { userId, booklistId },
      },
    });

    if (!progress) return null;

    return {
      ...progress,
      completedItemIds: JSON.parse(progress.completedItemIds),
    };
  }
}
