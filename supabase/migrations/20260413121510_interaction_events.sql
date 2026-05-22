create table if not exists interaction_events (
  id text primary key,
  type text not null,
  targetType text not null,
  targetId text not null,
  userId text null,
  platform text null,
  score double precision null,
  reasonTags text null,
  traceId text null,
  ip text null,
  userAgent text null,
  createdAt timestamptz not null default now()
);

create index if not exists interaction_events_createdAt_idx on interaction_events (createdAt);
create index if not exists interaction_events_type_createdAt_idx on interaction_events (type, createdAt);
create index if not exists interaction_events_targetType_targetId_idx on interaction_events (targetType, targetId);
create index if not exists interaction_events_userId_idx on interaction_events (userId);
