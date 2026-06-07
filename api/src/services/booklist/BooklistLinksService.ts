import { prisma } from '../../prisma';

export class BooklistLinksService {
  /**
   * Sync BooklistStoryLink records based on current items.
   */
  static async syncStoryLinks(booklistId: string) {
    const items = await prisma.booklistItem.findMany({
      where: { booklistId },
      select: { targetType: true, targetId: true },
    });

    // Collect unique story IDs from items
    const storyIds = new Set<string>();
    for (const item of items) {
      if (item.targetType === 'story' && item.targetId) {
        storyIds.add(item.targetId);
      }
    }

    // Get existing links
    const existingLinks = await prisma.booklistStoryLink.findMany({
      where: { booklistId },
    });
    const existingStoryIds = new Set(existingLinks.map((l) => l.storyId));

    // Create missing links (default relation: 'referenced')
    const toCreate = [...storyIds]
      .filter((sid) => !existingStoryIds.has(sid))
      .map((storyId) => ({ booklistId, storyId, relation: 'referenced' as const }));

    if (toCreate.length > 0) {
      await prisma.booklistStoryLink.createMany({ data: toCreate });
    }

    // Remove stale links
    const toRemove = existingLinks.filter((l) => !storyIds.has(l.storyId));
    if (toRemove.length > 0) {
      await prisma.booklistStoryLink.deleteMany({
        where: { id: { in: toRemove.map((l) => l.id) } },
      });
    }

    return { created: toCreate.length, removed: toRemove.length };
  }

  /**
   * Get all story links for a booklist.
   */
  static async getStoryLinks(booklistId: string) {
    return prisma.booklistStoryLink.findMany({
      where: { booklistId },
      include: {
        story: { select: { id: true, title: true, coverImage: true, author: { select: { id: true, username: true } } } },
      },
    });
  }
}
