import { prisma } from '../src/prisma';

async function main() {
  const items = await prisma.booklistItem.findMany({
    where: { targetType: 'event', storyId: null },
  });

  console.log(`Found ${items.length} event items with null storyId`);

  for (const item of items) {
    const event = await prisma.storyEvent.findUnique({
      where: { id: item.targetId! },
      select: { storyId: true },
    });
    if (event?.storyId) {
      await prisma.booklistItem.update({
        where: { id: item.id },
        data: { storyId: event.storyId },
      });
      console.log(`  Updated item ${item.id} → storyId ${event.storyId}`);
    } else {
      console.log(`  Skipped item ${item.id}: event not found or has no storyId`);
    }
  }

  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
