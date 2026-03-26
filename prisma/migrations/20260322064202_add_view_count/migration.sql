-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_interaction_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "ratingSum" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_interaction_stats" ("id", "likeCount", "ratingCount", "ratingSum", "shareCount", "targetId", "targetType", "updatedAt") SELECT "id", "likeCount", "ratingCount", "ratingSum", "shareCount", "targetId", "targetType", "updatedAt" FROM "interaction_stats";
DROP TABLE "interaction_stats";
ALTER TABLE "new_interaction_stats" RENAME TO "interaction_stats";
CREATE INDEX "interaction_stats_targetType_targetId_idx" ON "interaction_stats"("targetType", "targetId");
CREATE UNIQUE INDEX "interaction_stats_targetType_targetId_key" ON "interaction_stats"("targetType", "targetId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
