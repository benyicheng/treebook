import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting tag migration...');

  // 1. Create the join table if it doesn't exist
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_BooklistToTag" (
      "A" TEXT NOT NULL REFERENCES "booklists"("id") ON DELETE CASCADE,
      "B" TEXT NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
      PRIMARY KEY ("A", "B")
    )
  `);
  console.log('Created _BooklistToTag join table');

  // 2. Get all booklists with tags
  const booklists = await prisma.$queryRawUnsafe<Array<{ id: string; tags: string | null }>>(
    `SELECT id, tags FROM booklists WHERE tags IS NOT NULL AND tags != ''`
  );
  console.log(`Found ${booklists.length} booklists with tags`);

  let totalConnections = 0;

  for (const bl of booklists) {
    const tagNames = bl.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    for (const name of tagNames) {
      // 3. Find or create tag
      const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM tags WHERE name = ?`, name
      );
      let tagId: string;
      if (existing.length > 0) {
        tagId = existing[0].id;
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO tags (id, name) VALUES (?, ?)`, crypto.randomUUID(), name
        );
        tagId = (await prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM tags WHERE name = ?`, name
        ))[0].id;
      }

      // 4. Create connection
      try {
        await prisma.$executeRawUnsafe(
          `INSERT OR IGNORE INTO "_BooklistToTag" ("A", "B") VALUES (?, ?)`, bl.id, tagId
        );
        totalConnections++;
      } catch (e) {
        console.warn(`Failed to connect tag "${name}" to booklist ${bl.id}:`, e);
      }
    }
  }

  console.log(`Created ${totalConnections} tag-booklist connections`);
  console.log('Tag migration complete!');
}

migrate()
  .catch(e => { console.error('Migration failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
