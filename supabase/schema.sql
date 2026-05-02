-- ==========================================
-- Farm Monitor — Supabase SQL Schema
-- Run this in Supabase SQL Editor
-- ==========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- PROFILES (extends Supabase auth.users)
-- ==========================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  phone      text,
  full_name  text,
  role       text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- RLS: Users can read their own profile; admins can read all
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_admin_read" on public.profiles
  for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, phone, role)
  values (new.id, new.phone, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- PARTITIONS (e.g., P1, P2, P3)
-- ==========================================
create table if not exists public.partitions (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  created_at timestamptz default now()
);
alter table public.partitions enable row level security;
create policy "partitions_read_all" on public.partitions for select using (auth.role() = 'authenticated');
create policy "partitions_admin_write" on public.partitions for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ==========================================
-- LINES (belong to partitions)
-- ==========================================
create table if not exists public.lines (
  id           uuid primary key default uuid_generate_v4(),
  partition_id uuid not null references public.partitions(id) on delete cascade,
  line_number  integer not null,
  host_plant   text,
  label        text,
  created_at   timestamptz default now(),
  unique(partition_id, line_number)
);
alter table public.lines enable row level security;
create policy "lines_read_all" on public.lines for select using (auth.role() = 'authenticated');
create policy "lines_admin_write" on public.lines for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ==========================================
-- PLANT MASTER (reusable plant names)
-- ==========================================
create table if not exists public.plant_master (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  created_at timestamptz default now()
);
alter table public.plant_master enable row level security;
create policy "plant_master_read_all" on public.plant_master for select using (auth.role() = 'authenticated');
create policy "plant_master_admin_write" on public.plant_master for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ==========================================
-- PLANTS (placed under lines)
-- ==========================================
create table if not exists public.plants (
  id              uuid primary key default uuid_generate_v4(),
  line_id         uuid not null references public.lines(id) on delete cascade,
  plant_master_id uuid not null references public.plant_master(id),
  position        integer not null default 1,
  plantation_year integer,
  label           text,
  created_at      timestamptz default now()
);
alter table public.plants enable row level security;
create policy "plants_read_all" on public.plants for select using (auth.role() = 'authenticated');
create policy "plants_admin_write" on public.plants for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ==========================================
-- PLANT STATUS LOGS
-- ==========================================
create type plant_status as enum ('good', 'medium', 'no_growth', 'replace', 'pest_attack');

create table if not exists public.plant_status_logs (
  id          uuid primary key default uuid_generate_v4(),
  plant_id    uuid not null references public.plants(id) on delete cascade,
  status      plant_status not null,
  recorded_by uuid references public.profiles(id),
  notes       text,
  timestamp   timestamptz not null default now(),
  created_at  timestamptz default now()
);
alter table public.plant_status_logs enable row level security;
create policy "status_logs_read_all" on public.plant_status_logs for select using (auth.role() = 'authenticated');
create policy "status_logs_workers_insert" on public.plant_status_logs for insert with check (auth.role() = 'authenticated');

-- Index for fast latest status lookup
create index plant_status_logs_plant_ts on public.plant_status_logs (plant_id, timestamp desc);

-- ==========================================
-- PLANT ACTIVITIES
-- ==========================================
create type activity_type as enum ('input', 'pruning', 'harvest', 'water_check');

create table if not exists public.plant_activities (
  id            uuid primary key default uuid_generate_v4(),
  plant_id      uuid not null references public.plants(id) on delete cascade,
  activity_type activity_type not null,
  recorded_by   uuid references public.profiles(id),
  notes         text,
  timestamp     timestamptz not null default now(),
  created_at    timestamptz default now()
);
alter table public.plant_activities enable row level security;
create policy "activities_read_all" on public.plant_activities for select using (auth.role() = 'authenticated');
create policy "activities_workers_insert" on public.plant_activities for insert with check (auth.role() = 'authenticated');

create index plant_activities_plant_ts on public.plant_activities (plant_id, timestamp desc);

-- ==========================================
-- SEED DATA — Sample partition + line + plant master
-- ==========================================
insert into public.partitions (name) values ('P1'), ('P2'), ('P3') on conflict do nothing;
insert into public.plant_master (name) values ('Tomato'), ('Pepper'), ('Basil'), ('Lettuce'), ('Cucumber') on conflict do nothing;

-- ==========================================
-- Helper view: latest status per plant
-- ==========================================
create or replace view public.plants_with_latest_status as
select
  pl.id,
  pl.line_id,
  pl.plant_master_id,
  pl.position,
  pl.label,
  pm.name as plant_name,
  psl.status as latest_status,
  psl.timestamp as status_updated_at
from public.plants pl
join public.plant_master pm on pm.id = pl.plant_master_id
left join lateral (
  select status, timestamp
  from public.plant_status_logs
  where plant_id = pl.id
  order by timestamp desc
  limit 1
) psl on true;
