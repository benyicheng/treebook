-- Create Feedback model
CREATE TABLE IF NOT EXISTS "feedbacks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'other',
    "content" TEXT NOT NULL,
    "contact" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Report model
CREATE TABLE IF NOT EXISTS "reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "targetType" TEXT,
    "targetUrl" TEXT,
    "reason" TEXT,
    "description" TEXT NOT NULL,
    "contact" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
