import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. Vercel 또는 .env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 설정해주세요."
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
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
  driver: string;
  purpose: string;
  departure: string;
  waypoint: string | null;
  destination: string;
  distance: number;
  total_distance: number;
  confirmed_by: string;
  created_at: string;
};

export type Driver = {
  id: string;
  name: string;
  created_at: string;
};

export type DriverWithPassword = Driver & { password: string };
