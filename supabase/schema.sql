-- 동래구청소년센터 차량 운행일지 스키마
-- Supabase SQL Editor에서 실행하세요. (CREATE IF NOT EXISTS 기반이라 재실행 안전)

create extension if not exists "pgcrypto";

-- =========================================================
-- 운행일지 테이블
-- =========================================================
create table if not exists driving_logs (
  id uuid primary key default gen_random_uuid(),
  driven_at date not null,
  driver text not null,
  purpose text not null,
  departure text not null,
  waypoint text,
  destination text not null,
  distance numeric(8,1) not null check (distance >= 0),
  total_distance numeric(10,1) not null check (total_distance >= 0),
  confirmed_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists driving_logs_driven_at_idx on driving_logs (driven_at desc);
create index if not exists driving_logs_created_at_idx on driving_logs (created_at desc);

alter table driving_logs enable row level security;

drop policy if exists "anon read driving_logs" on driving_logs;
create policy "anon read driving_logs"
  on driving_logs for select
  using (true);

drop policy if exists "anon insert driving_logs" on driving_logs;
create policy "anon insert driving_logs"
  on driving_logs for insert
  with check (true);

drop policy if exists "anon delete driving_logs" on driving_logs;
create policy "anon delete driving_logs"
  on driving_logs for delete
  using (true);

-- =========================================================
-- 운전자 계정 테이블 (이름 + 비밀번호)
-- =========================================================
create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  password text not null,
  created_at timestamptz not null default now()
);

create index if not exists drivers_name_idx on drivers (name);

alter table drivers enable row level security;

drop policy if exists "anon read drivers" on drivers;
create policy "anon read drivers"
  on drivers for select
  using (true);

drop policy if exists "anon insert drivers" on drivers;
create policy "anon insert drivers"
  on drivers for insert
  with check (true);

drop policy if exists "anon update drivers" on drivers;
create policy "anon update drivers"
  on drivers for update
  using (true)
  with check (true);

drop policy if exists "anon delete drivers" on drivers;
create policy "anon delete drivers"
  on drivers for delete
  using (true);

-- =========================================================
-- 시스템 설정 테이블 (key/value)
--   - initial_distance: 차량 인수 시점의 누적거리 (기본 4341 km)
-- =========================================================
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table settings enable row level security;

drop policy if exists "anon read settings" on settings;
create policy "anon read settings"
  on settings for select
  using (true);

drop policy if exists "anon upsert settings" on settings;
create policy "anon upsert settings"
  on settings for insert
  with check (true);

drop policy if exists "anon update settings" on settings;
create policy "anon update settings"
  on settings for update
  using (true)
  with check (true);

insert into settings (key, value)
values ('initial_distance', '4341')
on conflict (key) do nothing;
