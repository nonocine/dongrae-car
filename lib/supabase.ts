// 이 모듈은 service_role 키를 읽으므로 절대 클라이언트 번들에 들어가면 안 된다.
// "server-only" 는 클라이언트 컴포넌트가 이 파일을 (타입이 아닌) 값으로
// import 하는 순간 빌드를 실패시킨다. 타입만 필요한 클라이언트 컴포넌트는
// 반드시 `import type { ... }` 형태로 가져와야 한다(컴파일 시 소거됨).
import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  // URL 은 비밀값이 아니라 기존 NEXT_PUBLIC_ 변수도 그대로 허용한다.
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  // 키는 서버 전용 service_role 만 사용한다.
  // anon 키로 조용히 폴백하지 않는다 — 폴백하면 anon 권한 회수 후
  // 런타임에 조용히 빈 결과를 받게 되고, 그게 훨씬 찾기 어렵다.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) {
    throw new Error(
      "Supabase URL 이 설정되지 않았습니다. Vercel 또는 .env.local 에 SUPABASE_URL (또는 기존 NEXT_PUBLIC_SUPABASE_URL) 을 설정해주세요."
    );
  }
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다. Supabase 대시보드 > Project Settings > API > service_role 키를 Vercel 환경변수와 .env.local 에 추가해주세요. (NEXT_PUBLIC_ 접두사를 붙이면 안 됩니다.)"
    );
  }
  // service_role 은 RLS 를 우회한다. 따라서 이 앱의 접근 통제는 전적으로
  // app/actions.ts 의 requireAdmin() / requireDriver() 가 책임진다.
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop as string];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : Reflect.get(client as object, prop, receiver);
  },
});

export type DrivingLog = {
  id: string;
  driven_at: string;
  start_date: string;
  end_date: string;
  is_multi_day: boolean;
  driver: string;
  purpose: string;
  departure: string;
  waypoint: string | null;
  destination: string;
  passenger_names: string[];
  passenger_others: string[];
  distance: number;
  total_distance: number;
  confirmed_by: string;
  created_at: string;
};

// password 는 서버 검증 경로(lib/password.ts)에서만 다루며 클라이언트로 나가는
// 타입에는 포함하지 않는다.
export type Driver = {
  id: string;
  name: string;
  created_at: string;
};
