import { prisma } from '../prisma';
import { NotificationService } from '../services/NotificationService';

/**
 * Send a notification directly to a specific user.
 * Errors are silently caught and logged to avoid breaking the main flow.
 */
export async function notifyUser(
  userId: string,
  actorId: string,
  type: string,
  targetType: string,
  targetId: string,
  message: string,
): Promise<void> {
  if (userId === actorId) return;
  try {
    await NotificationService.createNotification({
      userId,
      actorId,
      type,
      targetType,
      targetId,
      message,
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

/**
 * Notify the author of a story that someone has performed an action on it
 * (e.g., created a branch, published a spinoff, requested a merge).
 *
 * The `buildMessage` callback receives the story title so callers can
 * construct a localized message that includes the story name.
 * If the actor is also the story author, no notification is sent.
 * Errors are silently caught and logged to avoid breaking the main flow.
 */
export async function notifyStoryAuthor(
  storyId: string,
  actorId: string,
  type: string,
  targetType: string,
  targetId: string,
  buildMessage: (storyTitle: string) => string,
): Promise<void> {
  try {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { authorId: true, title: true },
    });
    if (story) {
      await notifyUser(story.authorId, actorId, type, targetType, targetId, buildMessage(story.title));
    }
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
