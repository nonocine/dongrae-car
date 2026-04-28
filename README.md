# 동래구청소년센터 차량 운행일지

레이 EV(04거 4911) 차량 운행일지를 입력·조회·관리하는 모바일 친화 웹앱입니다.

- **차종**: 레이 EV (흰색)
- **차량번호**: 04거 4911
- **보험사**: KB손해보험 (1544-0077)

## 기능

- 운행일지 입력 (이전 누적거리 자동 합산)
- 누적 운행일지 목록 (최신순)
- 월별 필터링
- 엑셀(.xlsx) 다운로드
- 비밀번호 기반 관리자 로그인 (관리자만 삭제 가능)

## 사전 준비

1. [Supabase](https://supabase.com) 프로젝트를 새로 만듭니다.
2. SQL Editor를 열고 [`supabase/schema.sql`](supabase/schema.sql) 파일의 내용을 그대로 실행합니다.
3. 프로젝트 설정 → **API** 메뉴에서 다음 두 값을 복사합니다.
   - `Project URL`
   - `anon public` API key

## 환경변수 설정

`.env.local.example`을 복사해 `.env.local`을 만들고 값을 채워주세요.

```bash
cp .env.local.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
ADMIN_PASSWORD=원하는_관리자_비밀번호
```

> `ADMIN_PASSWORD`는 서버에서만 사용되며 클라이언트로 노출되지 않습니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다.

## 페이지

| 경로 | 설명 |
| --- | --- |
| `/` | 운행일지 목록 (최신순), 월별 필터, 엑셀 다운로드 |
| `/new` | 운행일지 신규 등록 |
| `/admin` | 관리자 비밀번호 로그인 |
| `/api/export?month=YYYY-MM` | 엑셀 파일 다운로드 (month 미지정 시 전체) |

## 데이터베이스 스키마

`driving_logs` 테이블 — 자세한 정의는 [`supabase/schema.sql`](supabase/schema.sql) 참고.

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| `id` | uuid (PK) | 자동 생성 |
| `driven_at` | date | 운행 일자 |
| `driver` | text | 운전자 이름 |
| `purpose` | text | 용무 |
| `departure` | text | 출발지 |
| `waypoint` | text (nullable) | 경유지 |
| `destination` | text | 도착지 |
| `distance` | numeric(8,1) | 운행거리 (km) |
| `total_distance` | numeric(10,1) | 누적 거리 (km) - 입력 시 이전 누적과 합산 |
| `confirmed_by` | text | 확인/결재 담당자명 |
| `created_at` | timestamptz | 작성 시각 |

기본적으로 RLS는 익명 키로 select/insert/delete를 허용하도록 설정되어 있습니다. 필요 시 정책을 더 좁게 조정하세요.

## 배포 (Vercel 권장)

1. GitHub 저장소에 푸시 후 Vercel에서 import.
2. Environment Variables 에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PASSWORD` 세 개를 등록.
3. Build 명령어와 Output 디렉터리는 기본값 그대로 사용.

## 폴더 구조

```
app/
  actions.ts                 서버 액션 (CRUD, 로그인)
  layout.tsx, globals.css    레이아웃 / 전역 스타일
  page.tsx                   목록 페이지
  new/                       운행일지 작성
  admin/                     관리자 로그인
  api/export/route.ts        엑셀 다운로드 라우트
  components/                공용 UI 컴포넌트
lib/
  supabase.ts                Supabase 클라이언트 + 타입
  vehicle.ts                 차량 정보 상수
supabase/
  schema.sql                 DB 스키마
```
