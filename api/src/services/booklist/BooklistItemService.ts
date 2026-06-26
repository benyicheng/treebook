import { prisma } from '../../prisma';
import { AppError } from '../../utils/http';

function getStoryId(targetType: string, targetId: string): Promise<string | null> {
  if (targetType === 'story') return Promise.resolve(targetId);
  if (targetType === 'chapter') {
    return prisma.chapter.findUnique({ where: { id: targetId }, select: { storyId: true } })
      .then(r => r?.storyId ?? null);
  }
  if (targetType === 'branch') {
    return prisma.branch.findUnique({ where: { id: targetId }, select: { parentStoryId: true } })
      .then(r => r?.parentStoryId ?? null);
  }
  if (targetType === 'spinoff') {
    return prisma.spinoff.findUnique({ where: { id: targetId }, select: { originalStoryId: true } })
      .then(r => r?.originalStoryId ?? null);
  }
  if (targetType === 'event') {
    return prisma.storyEvent.findUnique({ where: { id: targetId }, select: { storyId: true } })
      .then(r => r?.storyId ?? null);
  }
  return Promise.resolve(null);
}

function getSection(targetType: string): string {
  return targetType === 'branch' ? 'branch' :
    targetType === 'spinoff' ? 'spinoff' :
    targetType === 'chapter' ? 'mainline' :
    targetType === 'story' ? 'story' :
    targetType === 'event' ? 'event' :
    targetType === 'wiki' ? 'wiki' :
    'general';
}

export class BooklistItemService {
  static async resolveItem(item: any) {
    const resolved: any = { ...item };

    if (item.targetType === 'chapter' && item.targetId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: item.targetId },
        select: {
          id: true,
          title: true,
          story: { select: { id: true, title: true, author: { select: { id: true, username: true } } } },
          branch: { select: { id: true, title: true } },
        },
      });
      resolved.chapter = chapter;
    } else if (item.targetType === 'story' && item.targetId) {
      const story = await prisma.story.findUnique({
        where: { id: item.targetId },
        select: { id: true, title: true, coverImage: true, viewCount: true, author: { select: { id: true, username: true } } },
      });
      resolved.story = story;
    } else if (item.targetType === 'branch' && item.targetId) {
      const branch = await prisma.branch.findUnique({
        where: { id: item.targetId },
        select: {
          id: true, title: true, status: true, branchType: true, viewCount: true, isOfficial: true,
          author: { select: { id: true, username: true, avatarUrl: true } },
          parentStory: { select: { id: true, title: true, author: { select: { id: true, username: true } } } },
        },
      });
      resolved.branch = branch;
    } else if (item.targetType === 'spinoff' && item.targetId) {
      const spinoff = await prisma.spinoff.findUnique({
        where: { id: item.targetId },
        select: {
          id: true, title: true, summary: true, type: true, status: true, viewCount: true,
          author: { select: { id: true, username: true, avatarUrl: true } },
          originalStory: { select: { id: true, title: true, author: { select: { id: true, username: true } } } },
        },
      });
      resolved.spinoff = spinoff;
    } else if (item.targetType === 'event' && item.targetId) {
      const event = await prisma.storyEvent.findUnique({
        where: { id: item.targetId },
        select: { id: true, title: true, description: true, type: true, color: true, importance: true, story: { select: { id: true, title: true } }, nodes: { orderBy: { sortOrder: 'asc' } }, createdAt: true },
      });
      resolved.event = event;
    } else if (item.targetType === 'wiki' && item.targetId) {
      const wikiPage = await prisma.wikiPage.findUnique({
        where: { id: item.targetId },
        select: { id: true, title: true, summary: true, contentType: true, story: { select: { id: true, title: true } } },
      });
      resolved.wikiPage = wikiPage;
    } else if (item.chapterId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: item.chapterId },
        select: {
          id: true,
          title: true,
          story: { select: { id: true, title: true, author: { select: { id: true, username: true } } } },
          branch: { select: { id: true, title: true } },
        },
      });
      resolved.chapter = chapter;
    }

    return resolved;
  }

  /**
   * Batch-resolve polymorphic items grouped by targetType.
   */
  static async resolveItems(items: any[]) {
    const groups: Record<string, string[]> = {};
    const fallbackIds: string[] = [];

    for (const item of items) {
      if (item.targetType && item.targetId) {
        if (!groups[item.targetType]) groups[item.targetType] = [];
        groups[item.targetType].push(item.targetId);
      } else if (item.chapterId) {
        fallbackIds.push(item.chapterId);
      }
    }

    const chapters = await (async () => {
      const ids = [...(groups['chapter'] || []), ...fallbackIds];
      if (ids.length === 0) return [];
      return prisma.chapter.findMany({
        where: { id: { in: ids } },
        select: {
          id: true, title: true,
          story: { select: { id: true, title: true, author: { select: { id: true, username: true } } } },
          branch: { select: { id: true, title: true } },
        },
      });
    })();

    const stories = groups['story']?.length
      ? await prisma.story.findMany({
          where: { id: { in: groups['story'] } },
          select: { id: true, title: true, coverImage: true, viewCount: true, author: { select: { id: true, username: true } } },
        })
      : [];

    const branches = groups['branch']?.length
      ? await prisma.branch.findMany({
          where: { id: { in: groups['branch'] } },
          select: {
            id: true, title: true, status: true, branchType: true, viewCount: true, isOfficial: true,
            author: { select: { id: true, username: true, avatarUrl: true } },
            parentStory: { select: { id: true, title: true, author: { select: { id: true, username: true } } } },
          },
        })
      : [];

    const spinoffs = groups['spinoff']?.length
      ? await prisma.spinoff.findMany({
          where: { id: { in: groups['spinoff'] } },
          select: {
            id: true, title: true, summary: true, type: true, status: true, viewCount: true,
            author: { select: { id: true, username: true, avatarUrl: true } },
            originalStory: { select: { id: true, title: true, author: { select: { id: true, username: true } } } },
          },
        })
      : [];

    const events = groups['event']?.length
      ? await prisma.storyEvent.findMany({
          where: { id: { in: groups['event'] } },
          select: { id: true, title: true, description: true, type: true, color: true, importance: true, story: { select: { id: true, title: true } }, nodes: { orderBy: { sortOrder: 'asc' } }, createdAt: true },
        })
      : [];

    const wikis = groups['wiki']?.length
      ? await prisma.wikiPage.findMany({
          where: { id: { in: groups['wiki'] } },
          select: { id: true, title: true, summary: true, contentType: true, story: { select: { id: true, title: true } } },
        })
      : [];

    const chapterMap = new Map(chapters.map(c => [c.id, c]));
    const storyMap = new Map(stories.map(s => [s.id, s]));
    const branchMap = new Map(branches.map(b => [b.id, b]));
    const spinoffMap = new Map(spinoffs.map(s => [s.id, s]));
    const eventMap = new Map(events.map(e => [e.id, e]));
    const wikiMap = new Map(wikis.map(w => [w.id, w]));

    return items.map((item) => {
      const resolved: any = { ...item };
      const id = item.targetId || item.chapterId;
      if (!id) return resolved;

      if (item.targetType === 'chapter' || (!item.targetType && item.chapterId)) {
        resolved.chapter = chapterMap.get(id);
      } else if (item.targetType === 'story') {
        resolved.story = storyMap.get(id);
      } else if (item.targetType === 'branch') {
        resolved.branch = branchMap.get(id);
      } else if (item.targetType === 'spinoff') {
        resolved.spinoff = spinoffMap.get(id);
      } else if (item.targetType === 'event') {
        resolved.event = eventMap.get(id);
      } else if (item.targetType === 'wiki') {
        resolved.wikiPage = wikiMap.get(id);
      }
      return resolved;
    });
  }

  /**
   * Add an item to a booklist with polymorphic target support.
   * Supports story / chapter / branch / spinoff / event / wiki target types.
   * Auto-fills storyId and expands events into child items.
   */
  static async addItemToBooklist(booklistId: string, creatorId: string, userRole: string, data: any) {
    const booklist = await prisma.booklist.findUnique({ where: { id: booklistId } });

    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');
    if (booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    const targetType = data.targetType || 'chapter';
    const targetId = data.targetId || data.chapterId;
    if (!targetId) {
      throw new AppError(400, 'BAD_REQUEST', '缺少 targetId 或 chapterId');
    }

    // Validate target entity and get storyId
    if (targetType === 'story') {
      const story = await prisma.story.findUnique({ where: { id: targetId } });
      if (!story) throw new AppError(404, 'NOT_FOUND', '故事不存在');
    } else if (targetType === 'branch') {
      const branch = await prisma.branch.findUnique({ where: { id: targetId } });
      if (!branch) throw new AppError(404, 'NOT_FOUND', '分支不存在');
    } else if (targetType === 'spinoff') {
      const spinoff = await prisma.spinoff.findUnique({ where: { id: targetId } });
      if (!spinoff) throw new AppError(404, 'NOT_FOUND', '番外不存在');
    } else if (targetType === 'chapter') {
      const chapter = await prisma.chapter.findUnique({ where: { id: targetId } });
      if (!chapter) throw new AppError(404, 'NOT_FOUND', '章节不存在');
    } else if (targetType === 'event') {
      const event = await prisma.storyEvent.findUnique({ where: { id: targetId } });
      if (!event) throw new AppError(404, 'NOT_FOUND', '大事件不存在');
    } else if (targetType === 'wiki') {
      const wikiPage = await prisma.wikiPage.findUnique({ where: { id: targetId } });
      if (!wikiPage) throw new AppError(404, 'NOT_FOUND', '百科不存在');
    } else {
      throw new AppError(400, 'BAD_REQUEST', '无效的 targetType');
    }

    // Check duplicate by targetType+targetId
    const existingItem = await prisma.booklistItem.findFirst({
      where: { booklistId, targetType, targetId }
    });
    if (existingItem) {
      throw new AppError(400, 'DUPLICATE_ITEM', '该项目已在书单中');
    }

    const currentCount = await prisma.booklistItem.count({ where: { booklistId } });
    const storyId = data.storyId ?? (await getStoryId(targetType, targetId));

    return prisma.$transaction(async (tx) => {
      const parent = await tx.booklistItem.create({
        data: {
          booklistId,
          targetType,
          targetId,
          storyId,
          section: data.section || getSection(targetType),
          chapterId: targetType === 'chapter' ? targetId : undefined,
          parentItemId: data.parentItemId || null,
          orderIndex: data.orderIndex !== undefined ? data.orderIndex : currentCount + 1,
          notes: data.notes,
        },
      });

      // If adding an event, auto-expand its nodes as child items
      if (targetType === 'event') {
        const eventNodes = await prisma.storyEventNode.findMany({
          where: { eventId: targetId },
          orderBy: { sortOrder: 'asc' },
        });
        if (eventNodes.length > 0) {
          await tx.booklistItem.createMany({
            data: eventNodes.map((n, i) => ({
              booklistId,
              targetType: n.targetType,
              targetId: n.targetId,
              storyId,
              section: getSection(n.targetType),
              chapterId: n.targetType === 'chapter' ? n.targetId : undefined,
              parentItemId: parent.id,
              orderIndex: currentCount + 2 + i,
              notes: n.note || undefined,
            })),
          });
        }
      }

      return tx.booklistItem.findUnique({
        where: { id: parent.id },
        include: {
          children: targetType === 'event' ? { orderBy: { orderIndex: 'asc' } } : false,
        },
      });
    });
  }

  static async removeItemFromBooklist(itemId: string, creatorId: string, userRole: string) {
    const item = await prisma.booklistItem.findUnique({
      where: { id: itemId },
      include: { booklist: true, children: { select: { id: true } } },
    });

    if (!item) throw new AppError(404, 'NOT_FOUND', 'Booklist item not found');
    if (item.booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    await prisma.$transaction(async (tx) => {
      if (item.children?.length) {
        await tx.booklistItem.deleteMany({
          where: { parentItemId: itemId },
        });
      }
      await tx.booklistItem.delete({ where: { id: itemId } });
    });
    return { success: true, message: 'Item removed from booklist' };
  }

  static async updateBooklistItemNotes(itemId: string, creatorId: string, userRole: string, data: any) {
    const item = await prisma.booklistItem.findUnique({
      where: { id: itemId },
      include: { booklist: true },
    });

    if (!item) throw new AppError(404, 'NOT_FOUND', 'Booklist item not found');
    if (item.booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    return prisma.booklistItem.update({
      where: { id: itemId },
      data: { notes: data?.notes },
    });
  }

  /**
   * Batch-add multiple items to a booklist in a single transaction.
   * Validates each target entity, skips duplicates, and auto-fills storyId/section.
   * Returns counts of added vs skipped items.
   */
  static async batchAddItems(booklistId: string, creatorId: string, userRole: string, data: any) {
    const booklist = await prisma.booklist.findUnique({ where: { id: booklistId } });
    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');
    if (booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    const items: any[] = Array.isArray(data?.items) ? data.items : [];
    if (items.length === 0) {
      throw new AppError(400, 'BAD_REQUEST', 'items 不能为空');
    }

    const fallbackNotes = data?.notes;
    const added: any[] = [];
    const skipped: { targetType: string; targetId: string; reason: string }[] = [];

    await prisma.$transaction(async (tx) => {
      // Pre-fetch existing items for this booklist to skip duplicates in-batch
      const existingItems = await tx.booklistItem.findMany({
        where: { booklistId },
        select: { targetType: true, targetId: true },
      });
      const existingKeys = new Set(existingItems.map(i => `${i.targetType}:${i.targetId}`));
      const seenInBatch = new Set<string>();

      let orderIndex = await tx.booklistItem.count({ where: { booklistId } });

      for (const entry of items) {
        const targetType = entry.targetType || 'chapter';
        const targetId = entry.targetId || entry.chapterId;
        if (!targetId) {
          skipped.push({ targetType, targetId: '', reason: '缺少 targetId' });
          continue;
        }

        const key = `${targetType}:${targetId}`;
        if (existingKeys.has(key) || seenInBatch.has(key)) {
          skipped.push({ targetType, targetId, reason: '已在书单中' });
          continue;
        }

        // Validate target entity existence
        const exists = await validateTargetExists(tx, targetType, targetId);
        if (!exists) {
          skipped.push({ targetType, targetId, reason: '目标不存在' });
          continue;
        }

        const storyId = entry.storyId ?? (await getStoryId(targetType, targetId));
        orderIndex += 1;

        const parent = await tx.booklistItem.create({
          data: {
            booklistId,
            targetType,
            targetId,
            storyId,
            section: entry.section || getSection(targetType),
            chapterId: targetType === 'chapter' ? targetId : undefined,
            parentItemId: entry.parentItemId || null,
            orderIndex,
            notes: entry.notes ?? fallbackNotes,
          },
        });
        seenInBatch.add(key);
        added.push(parent);

        // Auto-expand event nodes as child items (same as single add)
        if (targetType === 'event') {
          const eventNodes = await tx.storyEventNode.findMany({
            where: { eventId: targetId },
            orderBy: { sortOrder: 'asc' },
          });
          if (eventNodes.length > 0) {
            await tx.booklistItem.createMany({
              data: eventNodes.map((n, i) => ({
                booklistId,
                targetType: n.targetType,
                targetId: n.targetId,
                storyId,
                section: getSection(n.targetType),
                chapterId: n.targetType === 'chapter' ? n.targetId : undefined,
                parentItemId: parent.id,
                orderIndex: orderIndex + 1 + i,
                notes: n.note || undefined,
              })),
            });
            orderIndex += eventNodes.length;
          }
        }
      }
    });

    return {
      added: added.length,
      skipped: skipped.length,
      skippedDetails: skipped,
    };
  }

  /**
   * Reorder items within a booklist by updating their orderIndex in bulk.
   * Only the booklist creator (or admin) may reorder.
   */
  static async reorderItems(booklistId: string, creatorId: string, userRole: string, data: any) {
    const booklist = await prisma.booklist.findUnique({ where: { id: booklistId } });
    if (!booklist) throw new AppError(404, 'NOT_FOUND', 'Booklist not found');
    if (booklist.creatorId !== creatorId && userRole !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    const items: { id: string; orderIndex: number }[] = Array.isArray(data?.items) ? data.items : [];
    if (items.length === 0) {
      throw new AppError(400, 'BAD_REQUEST', 'items 不能为空');
    }

    // Verify all item ids belong to this booklist to prevent cross-booklist tampering
    const itemIds = items.map(i => i.id);
    const ownedItems = await prisma.booklistItem.findMany({
      where: { id: { in: itemIds }, booklistId },
      select: { id: true },
    });
    const ownedSet = new Set(ownedItems.map(i => i.id));
    const valid = items.filter(i => ownedSet.has(i.id));
    if (valid.length === 0) {
      throw new AppError(400, 'BAD_REQUEST', '没有属于该书单的有效条目');
    }

    await prisma.$transaction(
      valid.map(item =>
        prisma.booklistItem.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        }),
      ),
    );

    return { success: true, reordered: valid.length };
  }
}

/** Check that a polymorphic target entity exists. Runs inside the caller's transaction client. */
async function validateTargetExists(tx: any, targetType: string, targetId: string): Promise<boolean> {
  if (targetType === 'story') {
    return !!(await tx.story.findUnique({ where: { id: targetId }, select: { id: true } }));
  }
  if (targetType === 'chapter') {
    return !!(await tx.chapter.findUnique({ where: { id: targetId }, select: { id: true } }));
  }
  if (targetType === 'branch') {
    return !!(await tx.branch.findUnique({ where: { id: targetId }, select: { id: true } }));
  }
  if (targetType === 'spinoff') {
    return !!(await tx.spinoff.findUnique({ where: { id: targetId }, select: { id: true } }));
  }
  if (targetType === 'event') {
    return !!(await tx.storyEvent.findUnique({ where: { id: targetId }, select: { id: true } }));
  }
  if (targetType === 'wiki') {
    return !!(await tx.wikiPage.findUnique({ where: { id: targetId }, select: { id: true } }));
  }
  return false;
}
