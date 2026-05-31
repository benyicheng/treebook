-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activities_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "orderIndex" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booklist_items_booklistId_fkey" FOREIGN KEY ("booklistId") REFERENCES "booklists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booklist_items_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_booklist_items" ("booklistId", "chapterId", "createdAt", "id", "notes", "orderIndex", "updatedAt") SELECT "booklistId", "chapterId", "createdAt", "id", "notes", "orderIndex", "updatedAt" FROM "booklist_items";
DROP TABLE "booklist_items";
ALTER TABLE "new_booklist_items" RENAME TO "booklist_items";
CREATE INDEX "booklist_items_booklistId_idx" ON "booklist_items"("booklistId");
CREATE INDEX "booklist_items_targetType_targetId_idx" ON "booklist_items"("targetType", "targetId");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "profile" TEXT,
    "role" TEXT NOT NULL DEFAULT 'reader',
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("avatarUrl", "createdAt", "email", "id", "passwordHash", "profile", "role", "updatedAt", "username") SELECT "avatarUrl", "createdAt", "email", "id", "passwordHash", "profile", "role", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "follows_followerId_idx" ON "follows"("followerId");

-- CreateIndex
CREATE INDEX "follows_followingId_idx" ON "follows"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "activities_actorId_createdAt_idx" ON "activities"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "activities_type_createdAt_idx" ON "activities"("type", "createdAt");
