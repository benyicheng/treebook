import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; ftsInitialized?: boolean };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

const FTS_TRIGGERS = [
  'content_fts_ai_story', 'content_fts_ad_story', 'content_fts_au_story',
  'content_fts_ai_chapter', 'content_fts_ad_chapter', 'content_fts_au_chapter',
  'content_fts_ai_branch', 'content_fts_ad_branch', 'content_fts_au_branch',
  'content_fts_ai_spinoff', 'content_fts_ad_spinoff', 'content_fts_au_spinoff',
] as const;

/**
 * Initialize FTS5 full-text search virtual table and triggers.
 * Called once on first app startup.
 *
 * 安全/性能要点：
 * - 全部使用 prisma.$executeRaw(Prisma.raw(...)) 或 prisma.$queryRaw(Prisma.raw(...))。
 *   相比 $executeRawUnsafe，$executeRaw 要求 SQL 为 Prisma.Raw 类型，Prisma 这样
 *   可以在编译期追踪模板字面量中的参数占位。由于 FTS5 的 SQL 全部是静态常量
 *   （无用户输入插值），我们用 Prisma.raw() 包装即可获得同等安全性，同时
 *   消除了 $executeRawUnsafe 的误用风险。
 * - 仅在 content_fts 不存在时重建表并做全量回填；后续冷启动只做"幂等增量补齐"，
 *   避免每次重启都 DROP + 重建导致索引膨胀和启动延迟。
 * - UPDATE/DELETE 触发器使用 DELETE FROM content_fts WHERE ... 而非 FTS5 的
 *   INSERT ... VALUES('delete', ...) 命令，因为 Prisma 自带的 SQLite 引擎
 *   在处理该命令时会报 "SQL logic error"（extended_code: 1）。
 */
export async function ensureFts5Table(): Promise<void> {
  if (globalForPrisma.ftsInitialized) return;

  try {
    // 1. 清理旧版触发器（旧触发器用了 FTS5 的 INSERT ... VALUES('delete', ...) 语法，
    //    但该命令在 Prisma 自带的 SQLite 引擎中会报 "SQL logic error"。
    //    替换为 DELETE FROM content_fts 可兼容所有 SQLite 版本。）
    //    触发器名称来自编译期常量（FTS_TRIGGERS），不含用户输入，可安全拼接。
    //    DDL 语句不支持 Prisma 参数占位，故仍用 Prisma.raw 拼接。
    for (const name of FTS_TRIGGERS) {
      await prisma.$executeRaw(Prisma.raw(`DROP TRIGGER IF EXISTS ${name}`));
    }

    // 2. 仅在表不存在时创建并全量回填；已存在则跳过重建
    const existsRows = await prisma.$queryRaw<Array<{ cnt: bigint }>>(
      Prisma.raw(`SELECT count(*) AS cnt FROM sqlite_master WHERE type='table' AND name='content_fts'`),
    );
    const tableExists = Number(existsRows[0]?.cnt ?? 0n) > 0;

    if (!tableExists) {
      await prisma.$executeRaw(Prisma.raw(`
        CREATE VIRTUAL TABLE content_fts USING fts5(
          title, content, type UNINDEXED, sourceId UNINDEXED, metadata UNINDEXED,
          tokenize='unicode61'
        );
      `));

      // 全量回填（仅首次建表）
      await prisma.$executeRaw(Prisma.raw(`
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        SELECT title, IFNULL(description, ''), 'story', id, json_object('storyId', id, 'authorId', authorId) FROM stories;
      `));
      await prisma.$executeRaw(Prisma.raw(`
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        SELECT title, content, 'chapter', id, json_object('storyId', storyId, 'chapterId', id) FROM chapters;
      `));
      await prisma.$executeRaw(Prisma.raw(`
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        SELECT title, IFNULL(description, ''), 'branch', id, json_object('storyId', parentStoryId, 'authorId', authorId, 'branchId', id) FROM branches;
      `));
      await prisma.$executeRaw(Prisma.raw(`
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        SELECT title, IFNULL(summary, ''), 'spinoff', id, json_object('storyId', originalStoryId, 'authorId', authorId, 'spinoffId', id) FROM spinoffs;
      `));
    } else {
      // 3. 幂等增量补齐：补上"源表有、索引没有"的行，避免重复插入造成膨胀。
      //    content_fts 无主键，但 (type, sourceId) 可作为业务唯一键。
      await prisma.$executeRaw(Prisma.raw(`
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        SELECT s.title, IFNULL(s.description, ''), 'story', s.id, json_object('storyId', s.id, 'authorId', s.authorId)
        FROM stories s
        WHERE NOT EXISTS (SELECT 1 FROM content_fts f WHERE f.type='story' AND f.sourceId=s.id);
      `));
      await prisma.$executeRaw(Prisma.raw(`
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        SELECT c.title, c.content, 'chapter', c.id, json_object('storyId', c.storyId, 'chapterId', c.id)
        FROM chapters c
        WHERE NOT EXISTS (SELECT 1 FROM content_fts f WHERE f.type='chapter' AND f.sourceId=c.id);
      `));
      await prisma.$executeRaw(Prisma.raw(`
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        SELECT b.title, IFNULL(b.description, ''), 'branch', b.id, json_object('storyId', b.parentStoryId, 'authorId', b.authorId, 'branchId', b.id)
        FROM branches b
        WHERE NOT EXISTS (SELECT 1 FROM content_fts f WHERE f.type='branch' AND f.sourceId=b.id);
      `));
      await prisma.$executeRaw(Prisma.raw(`
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        SELECT sp.title, IFNULL(sp.summary, ''), 'spinoff', sp.id, json_object('storyId', sp.originalStoryId, 'authorId', sp.authorId, 'spinoffId', sp.id)
        FROM spinoffs sp
        WHERE NOT EXISTS (SELECT 1 FROM content_fts f WHERE f.type='spinoff' AND f.sourceId=sp.id);
      `));
    }

    // 4. 创建幂等触发器（IF NOT EXISTS）
    //    注意：UPDATE / DELETE 触发器使用 DELETE FROM content_fts 而非 FTS5 的 'delete' 命令，
    //    因为 Prisma 自带的 SQLite 引擎在处理 'delete' 命令时会报 SQL logic error。
    await prisma.$executeRaw(Prisma.raw(`
      CREATE TRIGGER IF NOT EXISTS content_fts_ai_story AFTER INSERT ON stories BEGIN
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        VALUES (NEW.title, IFNULL(NEW.description, ''), 'story', NEW.id, json_object('storyId', NEW.id, 'authorId', NEW.authorId));
      END;
    `));
    await prisma.$executeRaw(Prisma.raw(`
      CREATE TRIGGER IF NOT EXISTS content_fts_au_story AFTER UPDATE ON stories BEGIN
        DELETE FROM content_fts WHERE type='story' AND sourceId=NEW.id;
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        VALUES (NEW.title, IFNULL(NEW.description, ''), 'story', NEW.id, json_object('storyId', NEW.id, 'authorId', NEW.authorId));
      END;
    `));
    await prisma.$executeRaw(Prisma.raw(`
      CREATE TRIGGER IF NOT EXISTS content_fts_ai_chapter AFTER INSERT ON chapters BEGIN
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        VALUES (NEW.title, NEW.content, 'chapter', NEW.id, json_object('storyId', NEW.storyId, 'chapterId', NEW.id));
      END;
    `));
    await prisma.$executeRaw(Prisma.raw(`
      CREATE TRIGGER IF NOT EXISTS content_fts_au_chapter AFTER UPDATE ON chapters BEGIN
        DELETE FROM content_fts WHERE type='chapter' AND sourceId=NEW.id;
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        VALUES (NEW.title, NEW.content, 'chapter', NEW.id, json_object('storyId', NEW.storyId, 'chapterId', NEW.id));
      END;
    `));
    await prisma.$executeRaw(Prisma.raw(`
      CREATE TRIGGER IF NOT EXISTS content_fts_ai_branch AFTER INSERT ON branches BEGIN
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        VALUES (NEW.title, IFNULL(NEW.description, ''), 'branch', NEW.id, json_object('storyId', NEW.parentStoryId, 'authorId', NEW.authorId, 'branchId', NEW.id));
      END;
    `));
    await prisma.$executeRaw(Prisma.raw(`
      CREATE TRIGGER IF NOT EXISTS content_fts_au_branch AFTER UPDATE ON branches BEGIN
        DELETE FROM content_fts WHERE type='branch' AND sourceId=NEW.id;
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        VALUES (NEW.title, IFNULL(NEW.description, ''), 'branch', NEW.id, json_object('storyId', NEW.parentStoryId, 'authorId', NEW.authorId, 'branchId', NEW.id));
      END;
    `));
    await prisma.$executeRaw(Prisma.raw(`
      CREATE TRIGGER IF NOT EXISTS content_fts_ai_spinoff AFTER INSERT ON spinoffs BEGIN
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        VALUES (NEW.title, IFNULL(NEW.summary, ''), 'spinoff', NEW.id, json_object('storyId', NEW.originalStoryId, 'authorId', NEW.authorId, 'spinoffId', NEW.id));
      END;
    `));
    await prisma.$executeRaw(Prisma.raw(`
      CREATE TRIGGER IF NOT EXISTS content_fts_au_spinoff AFTER UPDATE ON spinoffs BEGIN
        DELETE FROM content_fts WHERE type='spinoff' AND sourceId=NEW.id;
        INSERT INTO content_fts(title, content, type, sourceId, metadata)
        VALUES (NEW.title, IFNULL(NEW.summary, ''), 'spinoff', NEW.id, json_object('storyId', NEW.originalStoryId, 'authorId', NEW.authorId, 'spinoffId', NEW.id));
      END;
    `));

    // 5. AFTER DELETE 触发器 — 保持 FTS5 索引与源表同步，防止脏数据残留
    await prisma.$executeRaw(Prisma.raw(`
      CREATE TRIGGER IF NOT EXISTS content_fts_ad_story AFTER DELETE ON stories BEGIN
        DELETE FROM content_fts WHERE type='story' AND sourceId=OLD.id;
      END;
    `));
    await prisma.$executeRaw(Prisma.raw(`
      CREATE TRIGGER IF NOT EXISTS content_fts_ad_chapter AFTER DELETE ON chapters BEGIN
        DELETE FROM content_fts WHERE type='chapter' AND sourceId=OLD.id;
      END;
    `));
    await prisma.$executeRaw(Prisma.raw(`
      CREATE TRIGGER IF NOT EXISTS content_fts_ad_branch AFTER DELETE ON branches BEGIN
        DELETE FROM content_fts WHERE type='branch' AND sourceId=OLD.id;
      END;
    `));
    await prisma.$executeRaw(Prisma.raw(`
      CREATE TRIGGER IF NOT EXISTS content_fts_ad_spinoff AFTER DELETE ON spinoffs BEGIN
        DELETE FROM content_fts WHERE type='spinoff' AND sourceId=OLD.id;
      END;
    `));

    globalForPrisma.ftsInitialized = true;
    console.log('[FTS5] Search index initialized successfully');
  } catch (err: unknown) {
    console.error('[FTS5] Initialization error:', err instanceof Error ? err.message : String(err));
  }
}

