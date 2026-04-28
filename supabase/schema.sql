-- 동래구청소년센터 차량 운행일지 스키마
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists "pgcrypto";

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

-- RLS: 익명 키로 읽기/쓰기 허용 (관리자 비밀번호는 앱 단에서 제어)
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
