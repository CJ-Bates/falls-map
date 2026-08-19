-- Anonymous usage analytics for The Falls app.
--
-- Security posture matches `feedback`: RLS is ON and there are NO policies,
-- so the anon/publishable key cannot read or write this table at all. All
-- access goes through server routes using the service-role key:
--   write -> /api/track          (rate-limited, bot-filtered, allow-listed events)
--   read  -> /api/admin/analytics (ADMIN_KEY gated)
--
-- Privacy: no IP addresses, no user agents, no names, no free text. The
-- visitor_hash is sha256(dailySalt + ip + ua) truncated, where the salt
-- changes every UTC day — it supports "unique visitors today" without being
-- reversible to a person or linkable across days.

create table if not exists public.analytics_events (
  id           bigserial primary key,
  created_at   timestamptz not null default now(),
  event        text        not null,
  path         text,
  session_id   text,
  visitor_hash text,
  device       text,
  standalone   boolean,
  referrer     text,
  cabin_slug   text,
  props        jsonb
);

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_idx      on public.analytics_events (event);
create index if not exists analytics_events_path_idx       on public.analytics_events (path);

alter table public.analytics_events enable row level security;

-- Intentionally NO policies. Service role bypasses RLS; everyone else is denied.

-- Optional housekeeping: drop raw events older than a year. Run manually, or
-- schedule with pg_cron if you ever enable it.
--   delete from public.analytics_events where created_at < now() - interval '365 days';
