create table if not exists "moderation_jobs" (
  "id" text primary key,
  "status" text not null,
  "request" text not null,
  "attempts" integer not null default 0,
  "nextRunAt" timestamptz null,
  "lockedAt" timestamptz null,
  "lockedBy" text null,
  "lastError" text null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "moderation_decisions" (
  "id" text primary key,
  "jobId" text not null,
  "businessLine" text not null,
  "targetType" text not null,
  "targetId" text not null,
  "contentType" text not null,
  "field" text null,
  "status" text not null,
  "labels" text not null,
  "reasons" text not null,
  "score" double precision null,
  "provider" text null,
  "traceId" text null,
  "createdAt" timestamptz not null default now()
);

create table if not exists "moderation_audit_logs" (
  "id" text primary key,
  "action" text not null,
  "actorUserId" text null,
  "targetType" text not null,
  "targetId" text not null,
  "decisionId" text null,
  "payload" text null,
  "traceId" text null,
  "createdAt" timestamptz not null default now()
);

create index if not exists "moderation_jobs_status_nextRunAt_idx" on "moderation_jobs" ("status", "nextRunAt");
create index if not exists "moderation_jobs_createdAt_idx" on "moderation_jobs" ("createdAt");
create index if not exists "moderation_decisions_createdAt_idx" on "moderation_decisions" ("createdAt");
create index if not exists "moderation_decisions_target_idx" on "moderation_decisions" ("targetType", "targetId");
create index if not exists "moderation_decisions_status_idx" on "moderation_decisions" ("status");
create index if not exists "moderation_audit_logs_createdAt_idx" on "moderation_audit_logs" ("createdAt");
create index if not exists "moderation_audit_logs_target_idx" on "moderation_audit_logs" ("targetType", "targetId");

