-- AlterTable
ALTER TABLE "reading_path_nodes" ADD COLUMN "storyId" TEXT;
ALTER TABLE "reading_path_nodes" ADD COLUMN "storyTitle" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "wiki_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "attributes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wiki_pages_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wiki_pages_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wiki_aliases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wikiPageId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "language" TEXT,
    CONSTRAINT "wiki_aliases_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "wiki_pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wiki_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourcePageId" TEXT NOT NULL,
    "targetPageId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    CONSTRAINT "wiki_links_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "wiki_pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wiki_links_targetPageId_fkey" FOREIGN KEY ("targetPageId") REFERENCES "wiki_pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "booklist_item_relations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceItemId" TEXT NOT NULL,
    "targetItemId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booklist_item_relations_sourceItemId_fkey" FOREIGN KEY ("sourceItemId") REFERENCES "booklist_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booklist_item_relations_targetItemId_fkey" FOREIGN KEY ("targetItemId") REFERENCES "booklist_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "booklist_story_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "booklistId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booklist_story_links_booklistId_fkey" FOREIGN KEY ("booklistId") REFERENCES "booklists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booklist_story_links_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "branches_parentStoryId_fkey" FOREIGN KEY ("parentStoryId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branches_parentChapterId_fkey" FOREIGN KEY ("parentChapterId") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branches_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branches_parentBranchId_fkey" FOREIGN KEY ("parentBranchId") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_branches" ("authorId", "branchType", "certifiedAt", "conditions", "contributionScore", "createdAt", "description", "id", "isCertified", "isOfficial", "parentChapterId", "parentStoryId", "status", "title", "updatedAt", "viewCount") SELECT "authorId", "branchType", "certifiedAt", "conditions", "contributionScore", "createdAt", "description", "id", "isCertified", "isOfficial", "parentChapterId", "parentStoryId", "status", "title", "updatedAt", "viewCount" FROM "branches";
DROP TABLE "branches";
ALTER TABLE "new_branches" RENAME TO "branches";
CREATE INDEX "branches_authorId_idx" ON "branches"("authorId");
CREATE INDEX "branches_parentStoryId_idx" ON "branches"("parentStoryId");
CREATE INDEX "branches_parentChapterId_idx" ON "branches"("parentChapterId");
CREATE TABLE "new_reading_paths" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'community',
    "booklistId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "startCount" INTEGER NOT NULL DEFAULT 0,
    "completionCount" INTEGER NOT NULL DEFAULT 0,
    "avgDurationMin" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reading_paths_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reading_paths_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reading_paths_booklistId_fkey" FOREIGN KEY ("booklistId") REFERENCES "booklists" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_reading_paths" ("avgDurationMin", "completionCount", "createdAt", "creatorId", "description", "id", "origin", "startCount", "status", "storyId", "title", "updatedAt", "viewCount") SELECT "avgDurationMin", "completionCount", "createdAt", "creatorId", "description", "id", "origin", "startCount", "status", "storyId", "title", "updatedAt", "viewCount" FROM "reading_paths";
DROP TABLE "reading_paths";
ALTER TABLE "new_reading_paths" RENAME TO "reading_paths";
CREATE INDEX "reading_paths_storyId_viewCount_idx" ON "reading_paths"("storyId", "viewCount");
CREATE INDEX "reading_paths_creatorId_idx" ON "reading_paths"("creatorId");
CREATE TABLE "new_spinoffs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "originalStoryId" TEXT NOT NULL,
    "originalBranchId" TEXT,
    "originalChapterId" TEXT,
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
    CONSTRAINT "spinoffs_originalChapterId_fkey" FOREIGN KEY ("originalChapterId") REFERENCES "chapters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_spinoffs" ("authorId", "characterRelationships", "content", "createdAt", "id", "isOfficial", "originalBranchId", "originalChapterId", "originalStoryId", "referencedCharacters", "revenueShareRate", "status", "summary", "title", "type", "updatedAt", "viewCount") SELECT "authorId", "characterRelationships", "content", "createdAt", "id", "isOfficial", "originalBranchId", "originalChapterId", "originalStoryId", "referencedCharacters", "revenueShareRate", "status", "summary", "title", "type", "updatedAt", "viewCount" FROM "spinoffs";
DROP TABLE "spinoffs";
ALTER TABLE "new_spinoffs" RENAME TO "spinoffs";
CREATE INDEX "spinoffs_originalStoryId_idx" ON "spinoffs"("originalStoryId");
CREATE INDEX "spinoffs_authorId_idx" ON "spinoffs"("authorId");
CREATE INDEX "spinoffs_originalBranchId_idx" ON "spinoffs"("originalBranchId");
CREATE INDEX "spinoffs_originalChapterId_idx" ON "spinoffs"("originalChapterId");
CREATE TABLE "new_stories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "metadata" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "branchCount" INTEGER NOT NULL DEFAULT 0,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "stories_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_stories" ("authorId", "branchCount", "coverImage", "createdAt", "description", "id", "metadata", "status", "title", "updatedAt", "viewCount") SELECT "authorId", "branchCount", "coverImage", "createdAt", "description", "id", "metadata", "status", "title", "updatedAt", "viewCount" FROM "stories";
DROP TABLE "stories";
ALTER TABLE "new_stories" RENAME TO "stories";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_pages_storyId_slug_key" ON "wiki_pages"("storyId", "slug");

-- CreateIndex
CREATE INDEX "wiki_aliases_alias_idx" ON "wiki_aliases"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_links_sourcePageId_targetPageId_linkType_key" ON "wiki_links"("sourcePageId", "targetPageId", "linkType");

-- CreateIndex
CREATE UNIQUE INDEX "booklist_item_relations_sourceItemId_targetItemId_relationType_key" ON "booklist_item_relations"("sourceItemId", "targetItemId", "relationType");

-- CreateIndex
CREATE UNIQUE INDEX "booklist_story_links_booklistId_storyId_key" ON "booklist_story_links"("booklistId", "storyId");

