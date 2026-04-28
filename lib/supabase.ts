import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase 환경변수가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 추가해주세요."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
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

export type DrivingLogInput = Omit<DrivingLog, "id" | "created_at">;
