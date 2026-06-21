-- Phase 4: 阅读路径叉路（fork）支持
-- 给 reading_path_nodes 加 forkGroupId（叉路分组）+ isForkPrimary（组内主选）
-- 同一 forkGroupId 的多个节点构成"选择点"，阅读器在该处让用户选 A/B/C 路。
--
-- 注意：prisma migrate diff 同样误把 content_fts* 当作孤儿表 DROP，
-- 已手工剔除以保护 FTS5 全文搜索（同 Phase 3 处理）。

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_reading_path_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pathId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "nodeCategory" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "storyId" TEXT,
    "storyTitle" TEXT,
    "contentTitle" TEXT,
    "introduction" TEXT,
    "note" TEXT,
    "estimatedMin" INTEGER,
    "eventId" TEXT,
    "forkGroupId" TEXT,
    "isForkPrimary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "reading_path_nodes_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "reading_paths" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reading_path_nodes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "story_events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_reading_path_nodes" ("contentId", "contentTitle", "estimatedMin", "eventId", "id", "introduction", "nodeCategory", "note", "pathId", "sortOrder", "storyId", "storyTitle") SELECT "contentId", "contentTitle", "estimatedMin", "eventId", "id", "introduction", "nodeCategory", "note", "pathId", "sortOrder", "storyId", "storyTitle" FROM "reading_path_nodes";
DROP TABLE "reading_path_nodes";
ALTER TABLE "new_reading_path_nodes" RENAME TO "reading_path_nodes";
CREATE INDEX "reading_path_nodes_pathId_sortOrder_idx" ON "reading_path_nodes"("pathId", "sortOrder");
CREATE INDEX "reading_path_nodes_forkGroupId_idx" ON "reading_path_nodes"("forkGroupId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
