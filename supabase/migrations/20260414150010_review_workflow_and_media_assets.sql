create table if not exists public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  "businessLine" text not null,
  "targetType" text not null,
  "targetId" text not null,
  "contentType" text not null,
  "field" text null,
  status text not null,
  level int not null default 1,
  "assigneeUserId" uuid null,
  "sourceDecisionId" uuid null,
  snapshot text null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists moderation_cases_target_idx on public.moderation_cases ("targetType", "targetId");
create index if not exists moderation_cases_status_updatedat_idx on public.moderation_cases (status, "updatedAt");

create table if not exists public.moderation_case_actions (
  id uuid primary key default gen_random_uuid(),
  "caseId" uuid not null references public.moderation_cases(id) on delete cascade,
  action text not null,
  "actorUserId" uuid null,
  payload text null,
  "createdAt" timestamptz not null default now()
);

create index if not exists moderation_case_actions_caseid_createdat_idx on public.moderation_case_actions ("caseId", "createdAt");

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  "ownerUserId" uuid null,
  purpose text null,
  "originalName" text not null,
  "mimeType" text not null,
  "sizeBytes" int not null,
  sha256 text not null,
  "storageProvider" text not null,
  "storagePath" text not null,
  status text not null,
  width int null,
  height int null,
  "durationMs" int null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists media_assets_owner_createdat_idx on public.media_assets ("ownerUserId", "createdAt");
create index if not exists media_assets_status_updatedat_idx on public.media_assets (status, "updatedAt");
create index if not exists media_assets_sha256_idx on public.media_assets (sha256);

create table if not exists public.media_risk_logs (
  id uuid primary key default gen_random_uuid(),
  "assetId" uuid null references public.media_assets(id) on delete cascade,
  kind text not null,
  severity text not null,
  message text not null,
  payload text null,
  "createdAt" timestamptz not null default now()
);

create index if not exists media_risk_logs_assetid_createdat_idx on public.media_risk_logs ("assetId", "createdAt");
