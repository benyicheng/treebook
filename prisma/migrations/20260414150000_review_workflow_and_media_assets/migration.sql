-- CreateTable
CREATE TABLE "moderation_cases" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "moderation_case_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "moderation_case_actions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "moderation_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_assets" (
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "media_risk_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT,
    "kind" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_risk_logs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "media_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "moderation_cases_target_idx" ON "moderation_cases"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "moderation_cases_status_updatedAt_idx" ON "moderation_cases"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "moderation_case_actions_caseId_createdAt_idx" ON "moderation_case_actions"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "media_assets_owner_createdAt_idx" ON "media_assets"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "media_assets_status_updatedAt_idx" ON "media_assets"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "media_assets_sha256_idx" ON "media_assets"("sha256");

-- CreateIndex
CREATE INDEX "media_risk_logs_assetId_createdAt_idx" ON "media_risk_logs"("assetId", "createdAt");
