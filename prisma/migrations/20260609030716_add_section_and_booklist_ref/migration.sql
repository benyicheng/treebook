-- CreateTable
CREATE TABLE "reading_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "source" TEXT,
    "sourceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'reading',
    "progress" REAL NOT NULL DEFAULT 0,
    "currentPage" INTEGER,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reading_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reading_progress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_booklist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "booklistId" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "chapterId" TEXT,
    "section" TEXT NOT NULL DEFAULT 'general',
    "orderIndex" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booklist_items_booklistId_fkey" FOREIGN KEY ("booklistId") REFERENCES "booklists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booklist_items_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_booklist_items" ("booklistId", "chapterId", "createdAt", "id", "notes", "orderIndex", "targetId", "targetType", "updatedAt") SELECT "booklistId", "chapterId", "createdAt", "id", "notes", "orderIndex", "targetId", "targetType", "updatedAt" FROM "booklist_items";
DROP TABLE "booklist_items";
ALTER TABLE "new_booklist_items" RENAME TO "booklist_items";
CREATE INDEX "booklist_items_booklistId_idx" ON "booklist_items"("booklistId");
CREATE INDEX "booklist_items_targetType_targetId_idx" ON "booklist_items"("targetType", "targetId");
CREATE TABLE "new_reading_trails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pathId" TEXT,
    "storyId" TEXT,
    "currentNodeId" TEXT,
    "currentNodeIndex" INTEGER NOT NULL DEFAULT -1,
    "trailNodes" TEXT NOT NULL DEFAULT '[]',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "durationMin" INTEGER,
    CONSTRAINT "reading_trails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reading_trails_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "reading_paths" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reading_trails_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_reading_trails" ("completedAt", "currentNodeId", "currentNodeIndex", "durationMin", "id", "pathId", "startedAt", "storyId", "trailNodes", "userId") SELECT "completedAt", "currentNodeId", "currentNodeIndex", "durationMin", "id", "pathId", "startedAt", "storyId", "trailNodes", "userId" FROM "reading_trails";
DROP TABLE "reading_trails";
ALTER TABLE "new_reading_trails" RENAME TO "reading_trails";
CREATE INDEX "reading_trails_userId_storyId_idx" ON "reading_trails"("userId", "storyId");
CREATE INDEX "reading_trails_pathId_idx" ON "reading_trails"("pathId");
CREATE INDEX "reading_trails_currentNodeId_idx" ON "reading_trails"("currentNodeId");
CREATE TABLE "new_wiki_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT,
    "booklistId" TEXT,
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
    CONSTRAINT "wiki_pages_booklistId_fkey" FOREIGN KEY ("booklistId") REFERENCES "booklists" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "wiki_pages_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_wiki_pages" ("attributes", "content", "contentType", "createdAt", "createdBy", "id", "slug", "status", "storyId", "summary", "title", "updatedAt", "version") SELECT "attributes", "content", "contentType", "createdAt", "createdBy", "id", "slug", "status", "storyId", "summary", "title", "updatedAt", "version" FROM "wiki_pages";
DROP TABLE "wiki_pages";
ALTER TABLE "new_wiki_pages" RENAME TO "wiki_pages";
CREATE UNIQUE INDEX "wiki_pages_storyId_slug_key" ON "wiki_pages"("storyId", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "reading_progress_userId_status_idx" ON "reading_progress"("userId", "status");

-- CreateIndex
CREATE INDEX "reading_progress_chapterId_idx" ON "reading_progress"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "reading_progress_userId_chapterId_key" ON "reading_progress"("userId", "chapterId");
