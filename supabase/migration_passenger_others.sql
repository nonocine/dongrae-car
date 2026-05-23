-- 동승자 외부인(직원 명단에 없는 사람) 기록 추가
-- Supabase SQL Editor에서 실행하세요. (IF NOT EXISTS 기반이라 재실행 안전)

alter table driving_logs
  add column if not exists passenger_others text[] not null default '{}';
