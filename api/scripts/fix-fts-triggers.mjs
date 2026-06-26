import { PrismaClient } from '@prisma/client';

// 根因：FTS5 的 'delete' 命令（INSERT INTO content_fts(content_fts, rowid, ...) VALUES('delete', ...)）不适用于无 content= 的虚拟表，
// 导致 UPDATE/DELETE 章节时触发器抛 "SQL logic error"。
// 修复：将 'delete' 命令替换为 DELETE FROM content_fts。

const prisma = new PrismaClient();

const triggerDefs = [
  // ── stories ──
  {
    name: 'content_fts_ai_story',
    sql: `CREATE TRIGGER content_fts_ai_story AFTER INSERT ON stories BEGIN
      INSERT INTO content_fts(title, content, type, sourceId, metadata)
      VALUES (NEW.title, IFNULL(NEW.description, ''), 'story', NEW.id, json_object('storyId', NEW.id, 'authorId', NEW.authorId));
    END`,
  },
  {
    name: 'content_fts_au_story',
    sql: `CREATE TRIGGER content_fts_au_story AFTER UPDATE ON stories BEGIN
      DELETE FROM content_fts WHERE type='story' AND sourceId=NEW.id;
      INSERT INTO content_fts(title, content, type, sourceId, metadata)
      VALUES (NEW.title, IFNULL(NEW.description, ''), 'story', NEW.id, json_object('storyId', NEW.id, 'authorId', NEW.authorId));
    END`,
  },
  {
    name: 'content_fts_ad_story',
    sql: `CREATE TRIGGER content_fts_ad_story AFTER DELETE ON stories BEGIN
      DELETE FROM content_fts WHERE type='story' AND sourceId=OLD.id;
    END`,
  },
  // ── chapters ──
  {
    name: 'content_fts_ai_chapter',
    sql: `CREATE TRIGGER content_fts_ai_chapter AFTER INSERT ON chapters BEGIN
      INSERT INTO content_fts(title, content, type, sourceId, metadata)
      VALUES (NEW.title, NEW.content, 'chapter', NEW.id, json_object('storyId', NEW.storyId, 'chapterId', NEW.id));
    END`,
  },
  {
    name: 'content_fts_au_chapter',
    sql: `CREATE TRIGGER content_fts_au_chapter AFTER UPDATE ON chapters BEGIN
      DELETE FROM content_fts WHERE type='chapter' AND sourceId=NEW.id;
      INSERT INTO content_fts(title, content, type, sourceId, metadata)
      VALUES (NEW.title, NEW.content, 'chapter', NEW.id, json_object('storyId', NEW.storyId, 'chapterId', NEW.id));
    END`,
  },
  {
    name: 'content_fts_ad_chapter',
    sql: `CREATE TRIGGER content_fts_ad_chapter AFTER DELETE ON chapters BEGIN
      DELETE FROM content_fts WHERE type='chapter' AND sourceId=OLD.id;
    END`,
  },
  // ── branches ──
  {
    name: 'content_fts_ai_branch',
    sql: `CREATE TRIGGER content_fts_ai_branch AFTER INSERT ON branches BEGIN
      INSERT INTO content_fts(title, content, type, sourceId, metadata)
      VALUES (NEW.title, IFNULL(NEW.description, ''), 'branch', NEW.id, json_object('storyId', NEW.parentStoryId, 'authorId', NEW.authorId, 'branchId', NEW.id));
    END`,
  },
  {
    name: 'content_fts_au_branch',
    sql: `CREATE TRIGGER content_fts_au_branch AFTER UPDATE ON branches BEGIN
      DELETE FROM content_fts WHERE type='branch' AND sourceId=NEW.id;
      INSERT INTO content_fts(title, content, type, sourceId, metadata)
      VALUES (NEW.title, IFNULL(NEW.description, ''), 'branch', NEW.id, json_object('storyId', NEW.parentStoryId, 'authorId', NEW.authorId, 'branchId', NEW.id));
    END`,
  },
  {
    name: 'content_fts_ad_branch',
    sql: `CREATE TRIGGER content_fts_ad_branch AFTER DELETE ON branches BEGIN
      DELETE FROM content_fts WHERE type='branch' AND sourceId=OLD.id;
    END`,
  },
  // ── spinoffs ──
  {
    name: 'content_fts_ai_spinoff',
    sql: `CREATE TRIGGER content_fts_ai_spinoff AFTER INSERT ON spinoffs BEGIN
      INSERT INTO content_fts(title, content, type, sourceId, metadata)
      VALUES (NEW.title, IFNULL(NEW.summary, ''), 'spinoff', NEW.id, json_object('storyId', NEW.originalStoryId, 'authorId', NEW.authorId, 'spinoffId', NEW.id));
    END`,
  },
  {
    name: 'content_fts_au_spinoff',
    sql: `CREATE TRIGGER content_fts_au_spinoff AFTER UPDATE ON spinoffs BEGIN
      DELETE FROM content_fts WHERE type='spinoff' AND sourceId=NEW.id;
      INSERT INTO content_fts(title, content, type, sourceId, metadata)
      VALUES (NEW.title, IFNULL(NEW.summary, ''), 'spinoff', NEW.id, json_object('storyId', NEW.originalStoryId, 'authorId', NEW.authorId, 'spinoffId', NEW.id));
    END`,
  },
  {
    name: 'content_fts_ad_spinoff',
    sql: `CREATE TRIGGER content_fts_ad_spinoff AFTER DELETE ON spinoffs BEGIN
      DELETE FROM content_fts WHERE type='spinoff' AND sourceId=OLD.id;
    END`,
  },
];

async function main() {
  // Drop all existing triggers
  for (const t of triggerDefs) {
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${t.name}`);
    console.log(`Dropped ${t.name}`);
  }

  // Recreate with fixed SQL
  for (const t of triggerDefs) {
    await prisma.$executeRawUnsafe(t.sql);
    console.log(`Created ${t.name}`);
  }

  console.log('\nAll triggers fixed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
