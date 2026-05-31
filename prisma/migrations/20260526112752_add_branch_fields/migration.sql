-- CreateTable
CREATE TABLE "merge_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'branch_merge',
    "branchId" TEXT,
    "spinoffId" TEXT,
    "storyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "reviewComment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "merge_requests_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "merge_requests_spinoffId_fkey" FOREIGN KEY ("spinoffId") REFERENCES "spinoffs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "merge_requests_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'UNIV',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reading_savepoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "branchId" TEXT,
    "chapterId" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reading_savepoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reading_savepoints_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reading_savepoints_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reading_savepoints_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "booklist_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "booklistId" TEXT NOT NULL,
    "currentItemIndex" INTEGER NOT NULL DEFAULT -1,
    "completedItemIds" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "booklist_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booklist_progress_booklistId_fkey" FOREIGN KEY ("booklistId") REFERENCES "booklists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reading_paths" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'community',
    "status" TEXT NOT NULL DEFAULT 'published',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "startCount" INTEGER NOT NULL DEFAULT 0,
    "completionCount" INTEGER NOT NULL DEFAULT 0,
    "avgDurationMin" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reading_paths_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reading_paths_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reading_path_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pathId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "nodeCategory" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentTitle" TEXT,
    "note" TEXT,
    "estimatedMin" INTEGER,
    CONSTRAINT "reading_path_nodes_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "reading_paths" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reading_trails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pathId" TEXT,
    "storyId" TEXT NOT NULL,
    "currentNodeId" TEXT,
    "currentNodeIndex" INTEGER NOT NULL DEFAULT -1,
    "trailNodes" TEXT NOT NULL DEFAULT '[]',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "durationMin" INTEGER,
    CONSTRAINT "reading_trails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reading_trails_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "reading_paths" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_booklists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT DEFAULT 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800',
    "type" TEXT NOT NULL DEFAULT 'COLLECTION',
    "tags" TEXT DEFAULT '',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isIncentiveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "totalEarnings" REAL NOT NULL DEFAULT 0.0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booklists_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_booklists" ("createdAt", "creatorId", "description", "id", "isPublic", "title", "updatedAt", "viewCount") SELECT "createdAt", "creatorId", "description", "id", "isPublic", "title", "updatedAt", "viewCount" FROM "booklists";
DROP TABLE "booklists";
ALTER TABLE "new_booklists" RENAME TO "booklists";
CREATE INDEX "booklists_creatorId_idx" ON "booklists"("creatorId");
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "branches_parentStoryId_fkey" FOREIGN KEY ("parentStoryId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branches_parentChapterId_fkey" FOREIGN KEY ("parentChapterId") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branches_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_branches" ("authorId", "branchType", "conditions", "createdAt", "description", "id", "isOfficial", "parentChapterId", "parentStoryId", "title", "updatedAt", "viewCount") SELECT "authorId", "branchType", "conditions", "createdAt", "description", "id", "isOfficial", "parentChapterId", "parentStoryId", "title", "updatedAt", "viewCount" FROM "branches";
DROP TABLE "branches";
ALTER TABLE "new_branches" RENAME TO "branches";
CREATE INDEX "branches_authorId_idx" ON "branches"("authorId");
CREATE INDEX "branches_parentStoryId_idx" ON "branches"("parentStoryId");
CREATE INDEX "branches_parentChapterId_idx" ON "branches"("parentChapterId");
CREATE TABLE "new_editorial_changes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "original" TEXT,
    "proposed" TEXT NOT NULL,
    "appliedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_editorial_changes" ("appliedBy", "createdAt", "createdBy", "field", "id", "original", "proposed", "status", "targetId", "targetType", "updatedAt") SELECT "appliedBy", "createdAt", "createdBy", "field", "id", "original", "proposed", "status", "targetId", "targetType", "updatedAt" FROM "editorial_changes";
DROP TABLE "editorial_changes";
ALTER TABLE "new_editorial_changes" RENAME TO "editorial_changes";
CREATE INDEX "editorial_changes_targetType_targetId_idx" ON "editorial_changes"("targetType", "targetId");
CREATE INDEX "editorial_changes_status_updatedAt_idx" ON "editorial_changes"("status", "updatedAt");
CREATE TABLE "new_media_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerUserId" TEXT,
    "purpose" TEXT,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_media_assets" ("createdAt", "durationMs", "height", "id", "mimeType", "originalName", "ownerUserId", "purpose", "sha256", "sizeBytes", "status", "storagePath", "storageProvider", "updatedAt", "width") SELECT "createdAt", "durationMs", "height", "id", "mimeType", "originalName", "ownerUserId", "purpose", "sha256", "sizeBytes", "status", "storagePath", "storageProvider", "updatedAt", "width" FROM "media_assets";
DROP TABLE "media_assets";
ALTER TABLE "new_media_assets" RENAME TO "media_assets";
CREATE INDEX "media_assets_ownerUserId_createdAt_idx" ON "media_assets"("ownerUserId", "createdAt");
CREATE INDEX "media_assets_status_updatedAt_idx" ON "media_assets"("status", "updatedAt");
CREATE INDEX "media_assets_sha256_idx" ON "media_assets"("sha256");
CREATE TABLE "new_moderation_cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessLine" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "field" TEXT,
    "status" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "assigneeUserId" TEXT,
    "sourceDecisionId" TEXT,
    "snapshot" TEXT,
    "dueAt" DATETIME,
    "reopenedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_moderation_cases" ("assigneeUserId", "businessLine", "contentType", "createdAt", "dueAt", "field", "id", "level", "reopenedCount", "snapshot", "sourceDecisionId", "status", "targetId", "targetType", "updatedAt") SELECT "assigneeUserId", "businessLine", "contentType", "createdAt", "dueAt", "field", "id", "level", "reopenedCount", "snapshot", "sourceDecisionId", "status", "targetId", "targetType", "updatedAt" FROM "moderation_cases";
DROP TABLE "moderation_cases";
ALTER TABLE "new_moderation_cases" RENAME TO "moderation_cases";
CREATE INDEX "moderation_cases_targetType_targetId_idx" ON "moderation_cases"("targetType", "targetId");
CREATE INDEX "moderation_cases_status_updatedAt_idx" ON "moderation_cases"("status", "updatedAt");
CREATE TABLE "new_reading_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "progress" REAL NOT NULL DEFAULT 0,
    "referralBooklistId" TEXT,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reading_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reading_history_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reading_history_referralBooklistId_fkey" FOREIGN KEY ("referralBooklistId") REFERENCES "booklists" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_reading_history" ("chapterId", "id", "progress", "readAt", "userId") SELECT "chapterId", "id", "progress", "readAt", "userId" FROM "reading_history";
DROP TABLE "reading_history";
ALTER TABLE "new_reading_history" RENAME TO "reading_history";
CREATE INDEX "reading_history_referralBooklistId_idx" ON "reading_history"("referralBooklistId");
CREATE INDEX "reading_history_chapterId_idx" ON "reading_history"("chapterId");
CREATE UNIQUE INDEX "reading_history_userId_chapterId_key" ON "reading_history"("userId", "chapterId");
CREATE TABLE "new_spinoffs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "originalStoryId" TEXT NOT NULL,
    "originalBranchId" TEXT,
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
    CONSTRAINT "spinoffs_originalBranchId_fkey" FOREIGN KEY ("originalBranchId") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_spinoffs" ("authorId", "characterRelationships", "content", "createdAt", "id", "isOfficial", "originalStoryId", "title", "updatedAt", "viewCount") SELECT "authorId", "characterRelationships", "content", "createdAt", "id", "isOfficial", "originalStoryId", "title", "updatedAt", "viewCount" FROM "spinoffs";
DROP TABLE "spinoffs";
ALTER TABLE "new_spinoffs" RENAME TO "spinoffs";
CREATE INDEX "spinoffs_originalStoryId_idx" ON "spinoffs"("originalStoryId");
CREATE INDEX "spinoffs_authorId_idx" ON "spinoffs"("authorId");
CREATE INDEX "spinoffs_originalBranchId_idx" ON "spinoffs"("originalBranchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE INDEX "transactions_userId_type_idx" ON "transactions"("userId", "type");

-- CreateIndex
CREATE INDEX "reading_savepoints_userId_idx" ON "reading_savepoints"("userId");

-- CreateIndex
CREATE INDEX "reading_savepoints_storyId_idx" ON "reading_savepoints"("storyId");

-- CreateIndex
CREATE INDEX "reading_savepoints_chapterId_idx" ON "reading_savepoints"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "booklist_progress_userId_booklistId_key" ON "booklist_progress"("userId", "booklistId");

-- CreateIndex
CREATE INDEX "reading_paths_storyId_viewCount_idx" ON "reading_paths"("storyId", "viewCount");

-- CreateIndex
CREATE INDEX "reading_paths_creatorId_idx" ON "reading_paths"("creatorId");

-- CreateIndex
CREATE INDEX "reading_path_nodes_pathId_sortOrder_idx" ON "reading_path_nodes"("pathId", "sortOrder");

-- CreateIndex
CREATE INDEX "reading_trails_userId_storyId_idx" ON "reading_trails"("userId", "storyId");

-- CreateIndex
CREATE INDEX "reading_trails_pathId_idx" ON "reading_trails"("pathId");

-- CreateIndex
CREATE INDEX "reading_trails_currentNodeId_idx" ON "reading_trails"("currentNodeId");

-- CreateIndex
CREATE INDEX "booklist_items_booklistId_idx" ON "booklist_items"("booklistId");

-- CreateIndex
CREATE INDEX "booklist_items_chapterId_idx" ON "booklist_items"("chapterId");

-- CreateIndex
CREATE INDEX "chapters_branchId_idx" ON "chapters"("branchId");

-- CreateIndex
CREATE INDEX "chapters_storyId_orderIndex_idx" ON "chapters"("storyId", "orderIndex");

-- CreateIndex
CREATE INDEX "comments_chapterId_idx" ON "comments"("chapterId");

-- CreateIndex
CREATE INDEX "comments_authorId_idx" ON "comments"("authorId");

-- CreateIndex
CREATE INDEX "likes_userId_idx" ON "likes"("userId");

-- CreateIndex
CREATE INDEX "moderation_decisions_jobId_idx" ON "moderation_decisions"("jobId");

-- CreateIndex
CREATE INDEX "ratings_userId_idx" ON "ratings"("userId");

-- RedefineIndex
DROP INDEX "moderation_audit_logs_target_idx";
CREATE INDEX "moderation_audit_logs_targetType_targetId_idx" ON "moderation_audit_logs"("targetType", "targetId");

-- RedefineIndex
DROP INDEX "moderation_decisions_target_idx";
CREATE INDEX "moderation_decisions_targetType_targetId_idx" ON "moderation_decisions"("targetType", "targetId");
