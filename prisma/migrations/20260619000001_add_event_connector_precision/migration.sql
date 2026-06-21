-- Phase 3: 事件卡六向连接器 — 精度升级
-- 1) story_events 加 storyTime（in-universe 编年史序号）
-- 2) Branch 加 parentEventId（精确分支起点）+ FK + 索引（需要 SQLite 重建）
-- 3) Spinoff 加 originalEventId（精确番外起点）+ FK + 索引（需要 SQLite 重建）
-- 4) 新建 wiki_entity_mentions 表（Wiki ↔ Event/Chapter/Branch/Spinoff 提及关系）
--
-- 注意：原 prisma migrate diff 输出包含对 content_fts*（FTS5 虚拟表 + 影子表）的
-- DROP 语句，那些表是 prisma.ts:ensureFts5Table() 运行时创建的，schema.prisma 中
-- 不可见。已手工剔除 DROP 语句以保护全文搜索功能。

-- AlterTable: story_events.storyTime
ALTER TABLE "story_events" ADD COLUMN "storyTime" INTEGER;

-- CreateTable: wiki_entity_mentions
CREATE TABLE "wiki_entity_mentions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wikiPageId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "mentionType" TEXT NOT NULL DEFAULT 'reference',
    "eventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wiki_entity_mentions_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "wiki_pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wiki_entity_mentions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "story_events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables: branches & spinoffs（SQLite 不支持直接加 FK，需重建）
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_branches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentStoryId" TEXT NOT NULL,
    "parentChapterId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "branchType" TEXT NOT NULL DEFAULT 'parallel',
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "isCertified" BOOLEAN NOT NULL DEFAULT false,
    "certifiedAt" DATETIME,
    "contributionScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "conditions" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "parentBranchId" TEXT,
    "treeDepth" INTEGER NOT NULL DEFAULT 0,
    "parentEventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "branches_parentStoryId_fkey" FOREIGN KEY ("parentStoryId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branches_parentChapterId_fkey" FOREIGN KEY ("parentChapterId") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branches_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branches_parentBranchId_fkey" FOREIGN KEY ("parentBranchId") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "branches_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "story_events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_branches" ("authorId", "branchType", "certifiedAt", "conditions", "contributionScore", "createdAt", "description", "id", "isCertified", "isOfficial", "parentBranchId", "parentChapterId", "parentStoryId", "status", "title", "treeDepth", "updatedAt", "viewCount") SELECT "authorId", "branchType", "certifiedAt", "conditions", "contributionScore", "createdAt", "description", "id", "isCertified", "isOfficial", "parentBranchId", "parentChapterId", "parentStoryId", "status", "title", "treeDepth", "updatedAt", "viewCount" FROM "branches";
DROP TABLE "branches";
ALTER TABLE "new_branches" RENAME TO "branches";
CREATE INDEX "branches_authorId_idx" ON "branches"("authorId");
CREATE INDEX "branches_parentStoryId_idx" ON "branches"("parentStoryId");
CREATE INDEX "branches_parentChapterId_idx" ON "branches"("parentChapterId");
CREATE INDEX "branches_parentEventId_idx" ON "branches"("parentEventId");

CREATE TABLE "new_spinoffs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "originalStoryId" TEXT NOT NULL,
    "originalBranchId" TEXT,
    "originalChapterId" TEXT,
    "originalEventId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'if_timeline',
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "revenueShareRate" REAL NOT NULL DEFAULT 0.1,
    "referencedCharacters" TEXT,
    "characterRelationships" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "spinoffs_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "spinoffs_originalStoryId_fkey" FOREIGN KEY ("originalStoryId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "spinoffs_originalBranchId_fkey" FOREIGN KEY ("originalBranchId") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "spinoffs_originalChapterId_fkey" FOREIGN KEY ("originalChapterId") REFERENCES "chapters" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "spinoffs_originalEventId_fkey" FOREIGN KEY ("originalEventId") REFERENCES "story_events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_spinoffs" ("authorId", "characterRelationships", "content", "createdAt", "id", "isOfficial", "originalBranchId", "originalChapterId", "originalStoryId", "referencedCharacters", "revenueShareRate", "status", "summary", "title", "type", "updatedAt", "viewCount") SELECT "authorId", "characterRelationships", "content", "createdAt", "id", "isOfficial", "originalBranchId", "originalChapterId", "originalStoryId", "referencedCharacters", "revenueShareRate", "status", "summary", "title", "type", "updatedAt", "viewCount" FROM "spinoffs";
DROP TABLE "spinoffs";
ALTER TABLE "new_spinoffs" RENAME TO "spinoffs";
CREATE INDEX "spinoffs_originalStoryId_idx" ON "spinoffs"("originalStoryId");
CREATE INDEX "spinoffs_authorId_idx" ON "spinoffs"("authorId");
CREATE INDEX "spinoffs_originalBranchId_idx" ON "spinoffs"("originalBranchId");
CREATE INDEX "spinoffs_originalChapterId_idx" ON "spinoffs"("originalChapterId");
CREATE INDEX "spinoffs_originalEventId_idx" ON "spinoffs"("originalEventId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex: 剩余索引
CREATE INDEX "wiki_entity_mentions_targetType_targetId_idx" ON "wiki_entity_mentions"("targetType", "targetId");
CREATE INDEX "wiki_entity_mentions_eventId_idx" ON "wiki_entity_mentions"("eventId");
CREATE UNIQUE INDEX "wiki_entity_mentions_wikiPageId_targetType_targetId_key" ON "wiki_entity_mentions"("wikiPageId", "targetType", "targetId");
CREATE INDEX "story_events_storyTime_idx" ON "story_events"("storyTime");
