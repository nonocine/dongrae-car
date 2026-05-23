-- 운행기간(다일) + 동승자 기능 추가 마이그레이션
-- Supabase SQL Editor에서 실행하세요. (IF NOT EXISTS 기반이라 재실행 안전)

-- =========================================================
-- 1) 운행 기간 컬럼 추가
--   - start_date / end_date: 시작일/종료일 (기간 운행 지원)
--   - is_multi_day: 1박 이상 여부
--   - 기존 driven_at 컬럼은 호환성을 위해 유지하고, start_date로 복사
-- =========================================================
alter table driving_logs
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists is_multi_day boolean not null default false;

-- 기존 데이터 보정: start_date / end_date 가 비어있는 행은 driven_at 으로 채움
update driving_logs
  set start_date = driven_at
  where start_date is null;

update driving_logs
  set end_date = driven_at
  where end_date is null;

-- 인덱스 (운행 기간 검색용)
create index if not exists driving_logs_start_date_idx
  on driving_logs (start_date desc);

-- =========================================================
-- 2) 동승자 컬럼 추가
--   - passenger_names: 동승한 직원 이름 배열 (drivers.name 기준)
-- =========================================================
alter table driving_logs
  add column if not exists passenger_names text[] not null default '{}';
