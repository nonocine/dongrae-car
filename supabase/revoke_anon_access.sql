-- =====================================================================
-- SEC-2: anon 권한 회수
-- =====================================================================
-- 목적
--   drivers / driving_logs / settings 세 테이블의 anon 정책이 전부
--   using(true) 라서, anon 키만 있으면 외부에서 전체 덤프와 임의 변조가
--   가능하다. 이 스크립트는 그 정책들을 제거한다.
--
--   RLS 는 계속 enable 상태로 두므로, 정책이 사라지면 anon 은 어떤 행에도
--   접근할 수 없게 된다(정책 없음 = 전부 거부).
--   service_role 은 RLS 를 우회하므로 서버 경유 앱은 영향을 받지 않는다.
--
-- =====================================================================
-- ⚠ 실행 전 반드시 확인할 것
-- =====================================================================
--   1. 이 Supabase 프로젝트는 출장일지(dongrae-business-trip) 앱과
--      공유된다. 그 앱이 아직 anon 키로 접근하고 있다면 이 스크립트를
--      실행하는 순간 그쪽이 즉시 깨진다.
--      → 양쪽 앱이 모두 service_role(또는 인증된 역할)로 전환된 뒤에 실행할 것.
--
--   2. 이 앱(dongrae-car)은 SEC-2 커밋에서 이미 service_role 로 전환됐다.
--      단, Vercel 환경변수에 SUPABASE_SERVICE_ROLE_KEY 가 등록되고
--      재배포까지 끝난 상태여야 한다.
--
--   3. 실행 후 롤백이 필요하면 supabase/schema.sql 의 policy 정의를
--      다시 실행하면 된다.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- drivers : 비밀번호 해시가 들어 있는 테이블. 가장 시급하다.
-- ---------------------------------------------------------------------
drop policy if exists "anon read drivers"   on drivers;
drop policy if exists "anon insert drivers" on drivers;
drop policy if exists "anon update drivers" on drivers;
drop policy if exists "anon delete drivers" on drivers;

-- ---------------------------------------------------------------------
-- driving_logs : 운행 기록
-- ---------------------------------------------------------------------
drop policy if exists "anon read driving_logs"   on driving_logs;
drop policy if exists "anon insert driving_logs" on driving_logs;
drop policy if exists "anon delete driving_logs" on driving_logs;

-- ---------------------------------------------------------------------
-- settings : 누적거리 등 공유 설정
-- ---------------------------------------------------------------------
drop policy if exists "anon read settings"   on settings;
drop policy if exists "anon upsert settings" on settings;
drop policy if exists "anon update settings" on settings;

-- ---------------------------------------------------------------------
-- RLS 가 켜져 있는지 재확인 (정책을 지워도 RLS 가 꺼져 있으면 무의미하다)
-- ---------------------------------------------------------------------
alter table drivers      enable row level security;
alter table driving_logs enable row level security;
alter table settings     enable row level security;

-- ---------------------------------------------------------------------
-- 테이블 수준 GRANT 회수 (선택이지만 권장)
--   Supabase 는 기본적으로 anon / authenticated 역할에 테이블 권한을
--   GRANT 해 둔다. RLS 정책이 없으면 행은 못 보지만, 권한 자체를 회수하면
--   실수로 정책이 다시 생겨도 노출되지 않는다(이중 방어).
--   앞으로 이 프로젝트에 Supabase Auth 기반 클라이언트 접근을 추가할
--   계획이 있다면 authenticated 부분은 빼고 실행할 것.
-- ---------------------------------------------------------------------
revoke all on table drivers      from anon;
revoke all on table driving_logs from anon;
revoke all on table settings     from anon;

commit;

-- =====================================================================
-- 실행 후 검증
-- =====================================================================
-- 1) 남아 있는 정책 확인 — anon 대상 정책이 0건이어야 한다.
--
-- select schemaname, tablename, policyname, roles, cmd
-- from pg_policies
-- where tablename in ('drivers', 'driving_logs', 'settings')
-- order by tablename, policyname;
--
-- 2) RLS 활성 상태 확인 — rowsecurity 가 셋 다 true 여야 한다.
--
-- select relname, relrowsecurity
-- from pg_class
-- where relname in ('drivers', 'driving_logs', 'settings');
--
-- 3) 실제 차단 확인 — anon 키로 REST 호출 시 빈 배열이나 권한 오류가
--    떠야 한다. (터미널에서, ANON_KEY 는 본인 값으로)
--
-- curl "https://YOUR_PROJECT.supabase.co/rest/v1/drivers?select=*" \
--   -H "apikey: ANON_KEY" -H "Authorization: Bearer ANON_KEY"
--
-- 4) 앱 정상 동작 확인 — 운전자 로그인, 운행일지 작성, 관리자 대시보드.
-- =====================================================================
