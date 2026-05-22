alter table if exists public.moderation_cases add column if not exists "dueAt" timestamptz null;
alter table if exists public.moderation_cases add column if not exists "reopenedCount" int not null default 0;

create index if not exists moderation_cases_dueat_idx on public.moderation_cases ("dueAt");

create table if not exists public.editorial_changes (
  id uuid primary key default gen_random_uuid(),
  "targetType" text not null,
  "targetId" text not null,
  "field" text not null,
  status text not null,
  original text null,
  proposed text not null,
  "appliedBy" uuid null,
  "createdBy" uuid null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists editorial_changes_target_idx on public.editorial_changes ("targetType", "targetId");
create index if not exists editorial_changes_status_updatedat_idx on public.editorial_changes (status, "updatedAt");

create table if not exists public.editorial_change_actions (
  id uuid primary key default gen_random_uuid(),
  "changeId" uuid not null references public.editorial_changes(id) on delete cascade,
  action text not null,
  "actorUserId" uuid null,
  payload text null,
  "createdAt" timestamptz not null default now()
);

create index if not exists editorial_change_actions_changeid_createdat_idx on public.editorial_change_actions ("changeId", "createdAt");
