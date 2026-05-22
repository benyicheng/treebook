-- CreateTable
CREATE TABLE "moderation_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRunAt" DATETIME,
    "lockedAt" DATETIME,
    "lockedBy" TEXT,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "moderation_decisions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "businessLine" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "field" TEXT,
    "status" TEXT NOT NULL,
    "labels" TEXT NOT NULL,
    "reasons" TEXT NOT NULL,
    "score" REAL,
    "provider" TEXT,
    "traceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "moderation_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "decisionId" TEXT,
    "payload" TEXT,
    "traceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "moderation_jobs_status_nextRunAt_idx" ON "moderation_jobs"("status", "nextRunAt");

-- CreateIndex
CREATE INDEX "moderation_jobs_createdAt_idx" ON "moderation_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "moderation_decisions_createdAt_idx" ON "moderation_decisions"("createdAt");

-- CreateIndex
CREATE INDEX "moderation_decisions_target_idx" ON "moderation_decisions"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "moderation_decisions_status_idx" ON "moderation_decisions"("status");

-- CreateIndex
CREATE INDEX "moderation_audit_logs_createdAt_idx" ON "moderation_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "moderation_audit_logs_target_idx" ON "moderation_audit_logs"("targetType", "targetId");

