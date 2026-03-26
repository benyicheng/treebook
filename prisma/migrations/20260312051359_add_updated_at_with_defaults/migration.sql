-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_booklist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "booklistId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booklist_items_booklistId_fkey" FOREIGN KEY ("booklistId") REFERENCES "booklists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booklist_items_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_booklist_items" ("booklistId", "chapterId", "createdAt", "id", "notes", "orderIndex") SELECT "booklistId", "chapterId", "createdAt", "id", "notes", "orderIndex" FROM "booklist_items";
DROP TABLE "booklist_items";
ALTER TABLE "new_booklist_items" RENAME TO "booklist_items";
CREATE TABLE "new_booklists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booklists_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_booklists" ("createdAt", "creatorId", "description", "id", "isPublic", "title", "viewCount") SELECT "createdAt", "creatorId", "description", "id", "isPublic", "title", "viewCount" FROM "booklists";
DROP TABLE "booklists";
ALTER TABLE "new_booklists" RENAME TO "booklists";
CREATE TABLE "new_branches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentStoryId" TEXT NOT NULL,
    "parentChapterId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "branchType" TEXT NOT NULL DEFAULT 'parallel',
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "conditions" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "branches_parentStoryId_fkey" FOREIGN KEY ("parentStoryId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branches_parentChapterId_fkey" FOREIGN KEY ("parentChapterId") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branches_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_branches" ("authorId", "branchType", "conditions", "createdAt", "description", "id", "isOfficial", "parentChapterId", "parentStoryId", "title", "viewCount") SELECT "authorId", "branchType", "conditions", "createdAt", "description", "id", "isOfficial", "parentChapterId", "parentStoryId", "title", "viewCount" FROM "branches";
DROP TABLE "branches";
ALTER TABLE "new_branches" RENAME TO "branches";
CREATE TABLE "new_collaborations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "permissions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "collaborations_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "collaborations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_collaborations" ("createdAt", "id", "permissions", "role", "status", "storyId", "userId") SELECT "createdAt", "id", "permissions", "role", "status", "storyId", "userId" FROM "collaborations";
DROP TABLE "collaborations";
ALTER TABLE "new_collaborations" RENAME TO "collaborations";
CREATE TABLE "new_spinoffs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "originalStoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "characterRelationships" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "spinoffs_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "spinoffs_originalStoryId_fkey" FOREIGN KEY ("originalStoryId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_spinoffs" ("authorId", "characterRelationships", "content", "createdAt", "id", "isOfficial", "originalStoryId", "title", "viewCount") SELECT "authorId", "characterRelationships", "content", "createdAt", "id", "isOfficial", "originalStoryId", "title", "viewCount" FROM "spinoffs";
DROP TABLE "spinoffs";
ALTER TABLE "new_spinoffs" RENAME TO "spinoffs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
