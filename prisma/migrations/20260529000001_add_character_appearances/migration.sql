-- CreateTable
CREATE TABLE "character_appearances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "appearanceType" TEXT NOT NULL DEFAULT 'appears',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "character_appearances_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "character_appearances_targetType_targetId_idx" ON "character_appearances"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "character_appearances_characterId_targetType_targetId_key" ON "character_appearances"("characterId", "targetType", "targetId");
