-- CreateTable
CREATE TABLE "interaction_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "userId" TEXT,
    "platform" TEXT,
    "score" REAL,
    "reasonTags" TEXT,
    "traceId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "interaction_events_createdAt_idx" ON "interaction_events"("createdAt");

-- CreateIndex
CREATE INDEX "interaction_events_type_createdAt_idx" ON "interaction_events"("type", "createdAt");

-- CreateIndex
CREATE INDEX "interaction_events_targetType_targetId_idx" ON "interaction_events"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "interaction_events_userId_idx" ON "interaction_events"("userId");

