-- AlterTable
ALTER TABLE "moderation_cases" ADD COLUMN "dueAt" DATETIME;
ALTER TABLE "moderation_cases" ADD COLUMN "reopenedCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "editorial_changes" (
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "editorial_change_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "changeId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "editorial_change_actions_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "editorial_changes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "moderation_cases_dueAt_idx" ON "moderation_cases"("dueAt");

-- CreateIndex
CREATE INDEX "editorial_changes_target_idx" ON "editorial_changes"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "editorial_changes_status_updatedAt_idx" ON "editorial_changes"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "editorial_change_actions_changeId_createdAt_idx" ON "editorial_change_actions"("changeId", "createdAt");
