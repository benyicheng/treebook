-- 大事件评论表 — 让读者围绕事件展开讨论
-- 独立于 chapter 评论，避免污染现有 comments 表

CREATE TABLE "event_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_comments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "story_events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "event_comments_eventId_idx" ON "event_comments"("eventId");
CREATE INDEX "event_comments_authorId_idx" ON "event_comments"("authorId");
