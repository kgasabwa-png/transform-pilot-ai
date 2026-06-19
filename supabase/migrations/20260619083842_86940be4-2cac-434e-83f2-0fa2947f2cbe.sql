
-- Extensions for cron + http
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Enum for promise status
do $$ begin
  create type public.promise_status as enum ('open','kept','missed','dismissed');
exception when duplicate_object then null; end $$;

-- updated_at helper
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles self read"   on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- CONNECTIONS (Google OAuth tokens; service-role only access)
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google',
  google_email text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text,
  last_synced_at timestamptz,
  status text not null default 'connected',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);
grant all on public.connections to service_role;
-- authenticated can see *that* they are connected, but never tokens. We expose via a server fn instead.
grant select (id, user_id, provider, google_email, last_synced_at, status, created_at) on public.connections to authenticated;
grant delete on public.connections to authenticated;
alter table public.connections enable row level security;
create policy "connections self read"   on public.connections for select to authenticated using (auth.uid() = user_id);
create policy "connections self delete" on public.connections for delete to authenticated using (auth.uid() = user_id);
create trigger connections_updated_at before update on public.connections
  for each row execute function public.tg_set_updated_at();

-- SOURCES (raw imported items)
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('calendar_event','gmail_message')),
  external_id text not null,
  subject text,
  participants text[],
  body text,
  raw jsonb,
  occurred_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, kind, external_id)
);
create index sources_user_processed_idx on public.sources (user_id, processed_at);
create index sources_user_occurred_idx on public.sources (user_id, occurred_at desc);
grant select on public.sources to authenticated;
grant all on public.sources to service_role;
alter table public.sources enable row level security;
create policy "sources self read" on public.sources for select to authenticated using (auth.uid() = user_id);

-- PROMISES
create table public.promises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  summary text not null,
  owed_to text,
  channel text,
  due_at timestamptz,
  status public.promise_status not null default 'open',
  confidence numeric(3,2) default 0.7,
  draft_reply text,
  evidence_snippet text,
  last_nudged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index promises_user_status_idx on public.promises (user_id, status, due_at);
create index promises_user_created_idx on public.promises (user_id, created_at desc);
grant select, insert, update, delete on public.promises to authenticated;
grant all on public.promises to service_role;
alter table public.promises enable row level security;
create policy "promises self all" on public.promises for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger promises_updated_at before update on public.promises
  for each row execute function public.tg_set_updated_at();

-- MEMORY ITEMS (searchable timeline)
create table public.memory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  kind text not null default 'note',
  title text not null,
  snippet text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index memory_user_occurred_idx on public.memory_items (user_id, occurred_at desc);
grant select, insert, update, delete on public.memory_items to authenticated;
grant all on public.memory_items to service_role;
alter table public.memory_items enable row level security;
create policy "memory self all" on public.memory_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- AGENT RUNS (background job log)
create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null check (kind in ('sync','extract','recap','score')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb,
  error text
);
create index agent_runs_user_started_idx on public.agent_runs (user_id, started_at desc);
grant select on public.agent_runs to authenticated;
grant all on public.agent_runs to service_role;
alter table public.agent_runs enable row level security;
create policy "agent_runs self read" on public.agent_runs for select to authenticated using (auth.uid() = user_id);

-- RELIABILITY SNAPSHOTS
create table public.reliability_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,
  score numeric(4,3) not null,
  kept int not null default 0,
  missed int not null default 0,
  open_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);
grant select on public.reliability_snapshots to authenticated;
grant all on public.reliability_snapshots to service_role;
alter table public.reliability_snapshots enable row level security;
create policy "reliability self read" on public.reliability_snapshots for select to authenticated using (auth.uid() = user_id);
