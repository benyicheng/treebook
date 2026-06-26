-- AlterTable: Booklist
ALTER TABLE "booklists" ADD COLUMN "content" TEXT;

-- AlterTable: ReadingPath
ALTER TABLE "reading_paths" ADD COLUMN "guideType" TEXT;

-- AlterTable: ReadingPathNode
ALTER TABLE "reading_path_nodes" ADD COLUMN "introduction" TEXT;

-- CreateTable: BooklistWikiRef
CREATE TABLE "booklist_wiki_refs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "booklistId" TEXT NOT NULL,
    "wikiPageId" TEXT NOT NULL,
    "section" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booklist_wiki_refs_booklistId_fkey" FOREIGN KEY ("booklistId") REFERENCES "booklists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booklist_wiki_refs_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "wiki_pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: PathWikiRef
CREATE TABLE "path_wiki_refs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pathId" TEXT NOT NULL,
    "wikiPageId" TEXT NOT NULL,
    "nodeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "path_wiki_refs_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "reading_paths" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "path_wiki_refs_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "wiki_pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "path_wiki_refs_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "reading_path_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "booklist_wiki_refs_booklistId_wikiPageId_key" ON "booklist_wiki_refs"("booklistId", "wikiPageId");
CREATE INDEX "booklist_wiki_refs_wikiPageId_idx" ON "booklist_wiki_refs"("wikiPageId");
CREATE INDEX "path_wiki_refs_wikiPageId_idx" ON "path_wiki_refs"("wikiPageId");
