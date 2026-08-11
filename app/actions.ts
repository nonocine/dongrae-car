"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  supabase,
  type Driver,
  type DrivingLog,
} from "@/lib/supabase";
import {
  hashPassword,
  sessionVerifier,
  verifierMatches,
  verifyPassword,
} from "@/lib/password";
import { VEHICLE } from "@/lib/vehicle";

const ADMIN_COOKIE = "dongrae_admin";
const DRIVER_COOKIE = "dongrae_driver";
const DEFAULT_INITIAL_DISTANCE = 4341;

// =====================================================================
// 재직 여부 (drivers.is_active)
// =====================================================================
// drivers 는 인사관리(동업자씨) 앱과 공유하는 테이블이고, 그쪽에서 퇴사를
// is_active = false 로 표시한다. 컬럼은 nullable(default true)이라
// "false 인 사람만 퇴사"로 판정한다. null 을 퇴사로 보면 컬럼이 생기기 전에
// 만들어진 기존 계정이 전부 잠긴다.
function isRetired(isActive: unknown): boolean {
  return isActive === false;
}

/**
 * 퇴사자(is_active = false)만 제외하는 쿼리 필터.
 * `.eq("is_active", true)` 는 쓰면 안 된다 — null 인 재직자가 함께 빠진다.
 * PostgREST 로는 `is_active=not.is.false` 로 나가고, SQL 의
 * `NOT (is_active IS FALSE)` 이므로 null 과 true 가 모두 남는다.
 */
function excludeRetired<T extends { not(c: string, o: string, v: unknown): T }>(
  query: T
): T {
  return query.not("is_active", "is", false);
}

// =====================================================================
// Admin session
// =====================================================================
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return store.get(ADMIN_COOKIE)?.value === expected;
}

async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { ok: false, message: "ADMIN_PASSWORD 환경변수가 설정되지 않았습니다." };
  }
  if (password !== expected) {
    return { ok: false, message: "비밀번호가 올바르지 않습니다." };
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, password, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/admin");
}

export async function adminLogout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/");
}

// =====================================================================
// Driver session (httpOnly cookie)
// =====================================================================
export type DriverSessionInfo = { id: string; name: string };

export async function getDriverSession(): Promise<DriverSessionInfo | null> {
  const store = await cookies();
  const raw = store.get(DRIVER_COOKIE)?.value;
  if (!raw) return null;
  // v = 저장된 비밀번호에서 파생한 검증자. 비밀번호 자체는 쿠키에 넣지 않는다.
  // password 필드를 담고 있던 구버전 쿠키는 무효로 처리되어 재로그인이 필요하다.
  let parsed: { name?: string; v?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed.name || !parsed.v) return null;
  const { data, error } = await supabase
    .from("drivers")
    .select("id,name,password,is_active")
    .eq("name", parsed.name)
    .maybeSingle();
  if (error || !data) return null;
  if (!verifierMatches(String(data.password), parsed.v)) return null;
  // 퇴사자는 쿠키가 아직 살아 있어도 이 시점에서 미인증으로 떨어진다.
  // 로그인 입구만 막으면 이미 발급된 30일짜리 쿠키가 그대로 통과한다.
  if (isRetired(data.is_active)) return null;
  return { id: data.id, name: data.name };
}

async function requireDriver(): Promise<DriverSessionInfo> {
  const driver = await getDriverSession();
  if (!driver) {
    throw new Error("운전자 로그인이 필요합니다.");
  }
  return driver;
}

export async function loginDriver(
  formData: FormData
): Promise<{ ok: true; driver: { id: string; name: string } } | { ok: false; message: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!name || !password) {
    return { ok: false, message: "이름과 비밀번호를 입력해주세요." };
  }
  const { data, error } = await supabase
    .from("drivers")
    .select("id,name,password,is_active")
    .eq("name", name)
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data || !(await verifyPassword(password, String(data.password)))) {
    return { ok: false, message: "이름 또는 비밀번호가 올바르지 않습니다." };
  }
  // 자격 증명이 맞은 뒤에만 재직 여부를 본다. 순서를 뒤집으면 비밀번호를
  // 모르는 사람도 "퇴사 처리된 계정" 응답으로 계정 존재를 확인할 수 있다.
  if (isRetired(data.is_active)) {
    return { ok: false, message: "퇴사 처리된 계정입니다. 관리자에게 문의하세요." };
  }
  const store = await cookies();
  const payload = { name: data.name as string, v: sessionVerifier(String(data.password)) };
  store.set(DRIVER_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
  return { ok: true, driver: { id: data.id, name: data.name } };
}

export async function logoutDriver() {
  const store = await cookies();
  store.delete(DRIVER_COOKIE);
  redirect("/");
}

// =====================================================================
// Settings (key/value) — initial cumulative distance
// =====================================================================
export async function getInitialDistance(): Promise<number> {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "initial_mileage")
    .maybeSingle();
  if (error) throw new Error(error.message);
  const v = data?.value;
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_INITIAL_DISTANCE;
}

export async function setInitialDistance(formData: FormData) {
  await requireAdmin();
  const raw = String(formData.get("initial_distance") ?? "");
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("올바른 숫자를 입력해주세요.");
  }
  const value = String(Math.round(n * 10) / 10);

  const { error } = await supabase
    .from("settings")
    .upsert({ key: "initial_mileage", value, updated_at: new Date().toISOString() }, {
      onConflict: "key",
    });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
}

// =====================================================================
// Cumulative distance helpers
//   현재 누적거리 = settings.initial_mileage + Σ driving_logs.distance
// =====================================================================
export async function getLatestCumulative(): Promise<number> {
  const [initial, { data, error }] = await Promise.all([
    getInitialDistance(),
    supabase.from("driving_logs").select("distance"),
  ]);
  if (error) throw new Error(error.message);
  const sum = (data ?? []).reduce(
    (acc, r) => acc + (Number(r.distance) || 0),
    0
  );
  return Math.round((initial + sum) * 10) / 10;
}

// =====================================================================
// Driving logs
// =====================================================================
export async function createDrivingLog(formData: FormData) {
  const driver = await requireDriver();

  const isMultiDay = String(formData.get("is_multi_day") ?? "") === "true";
  const startDate = String(formData.get("start_date") ?? "");
  const endDateRaw = String(formData.get("end_date") ?? "");
  const endDate = isMultiDay ? endDateRaw : startDate;

  const purpose = String(formData.get("purpose") ?? "").trim();
  const departure = String(formData.get("departure") ?? "").trim();
  const waypointRaw = String(formData.get("waypoint") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const odometer = Number(formData.get("odometer") ?? NaN);
  const confirmed_by = String(formData.get("confirmed_by") ?? "").trim();

  const passengersRaw = formData.getAll("passengers");
  const passenger_names = Array.from(
    new Set(
      passengersRaw
        .map((v) => String(v).trim())
        .filter((s) => s.length > 0 && s !== driver.name)
    )
  );

  const othersRaw = formData.getAll("passenger_others");
  const passenger_others = Array.from(
    new Set(
      othersRaw
        .map((v) => String(v).trim())
        .filter((s) => s.length > 0)
    )
  );

  if (
    !startDate ||
    !endDate ||
    !purpose ||
    !departure ||
    !destination ||
    !confirmed_by ||
    !Number.isFinite(odometer) ||
    odometer < 0
  ) {
    throw new Error("필수 항목을 모두 올바르게 입력해주세요.");
  }

  if (isMultiDay && endDate < startDate) {
    throw new Error("종료일은 시작일 이후여야 합니다.");
  }

  const previous = await getLatestCumulative();
  const total_distance = Math.round(odometer * 10) / 10;
  const distance = Math.round((total_distance - previous) * 10) / 10;

  if (distance < 0) {
    throw new Error(
      `입력한 누적거리(${total_distance} km)가 직전 누적(${previous} km)보다 작습니다.`
    );
  }

  const { error } = await supabase.from("driving_logs").insert({
    driven_at: startDate,
    start_date: startDate,
    end_date: endDate,
    is_multi_day: isMultiDay && endDate > startDate,
    driver: driver.name,
    purpose,
    departure,
    waypoint: waypointRaw || null,
    destination,
    passenger_names,
    passenger_others,
    distance,
    total_distance,
    confirmed_by,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect("/");
}

export async function listOtherDriverNames(
  excludeName: string
): Promise<string[]> {
  const { data, error } = await excludeRetired(
    supabase.from("drivers").select("name")
  ).order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((d) => d.name as string)
    .filter((n) => n !== excludeName);
}

export async function deleteDrivingLog(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("삭제할 항목 ID가 없습니다.");

  const { error } = await supabase.from("driving_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function listDrivingLogs(month?: string): Promise<DrivingLog[]> {
  const admin = await isAdmin();
  const driver = admin ? null : await getDriverSession();
  if (!admin && !driver) return [];

  let query = supabase
    .from("driving_logs")
    .select("*")
    .order("driven_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (!admin && driver) {
    query = query.eq("driver", driver.name);
  }

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    const start = `${month}-01`;
    const endDate = new Date(Date.UTC(y, m, 1));
    const end = endDate.toISOString().slice(0, 10);
    query = query.gte("driven_at", start).lt("driven_at", end);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as DrivingLog[];
}

// =====================================================================
// Admin stats
// =====================================================================
export type AdminStats = {
  recentDestinations: { destinations: string[]; driven_at: string }[];
  topDestinations: { destination: string; count: number }[];
  topDrivers: { driver: string; count: number }[];
  thisMonthDistance: number;
  totalDistance: number;
};

function extractDestinations(row: {
  waypoint?: string | null;
  destination?: string | null;
}): string[] {
  const raw = (row.waypoint ?? "").trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  const dest = (row.destination ?? "").trim();
  return dest ? [dest] : [];
}

function todayMonthStartKR(): string {
  const now = new Date();
  const tz = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = tz.getUTCFullYear();
  const m = String(tz.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();

  const [initial, logsRes] = await Promise.all([
    getInitialDistance(),
    supabase
      .from("driving_logs")
      .select("destination, waypoint, driver, distance, driven_at, created_at")
      .order("driven_at", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (logsRes.error) throw new Error(logsRes.error.message);
  const rows = logsRes.data ?? [];

  const recentDestinations = rows.slice(0, 5).map((r) => ({
    destinations: extractDestinations({
      waypoint: r.waypoint as string | null,
      destination: r.destination as string,
    }),
    driven_at: r.driven_at as string,
  }));

  const destCount = new Map<string, number>();
  for (const r of rows) {
    const stops = extractDestinations({
      waypoint: r.waypoint as string | null,
      destination: r.destination as string,
    });
    for (const s of stops) {
      if (s === VEHICLE.centerName) continue;
      destCount.set(s, (destCount.get(s) ?? 0) + 1);
    }
  }
  const topDestinations = [...destCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([destination, count]) => ({ destination, count }));

  const driverCount = new Map<string, number>();
  for (const r of rows) {
    const d = r.driver as string;
    driverCount.set(d, (driverCount.get(d) ?? 0) + 1);
  }
  const topDrivers = [...driverCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([driver, count]) => ({ driver, count }));

  const monthStart = todayMonthStartKR();
  let thisMonth = 0;
  let total = 0;
  for (const r of rows) {
    const dist = Number(r.distance) || 0;
    total += dist;
    if ((r.driven_at as string) >= monthStart) thisMonth += dist;
  }

  return {
    recentDestinations,
    topDestinations,
    topDrivers,
    thisMonthDistance: Math.round(thisMonth * 10) / 10,
    totalDistance: Math.round((initial + total) * 10) / 10,
  };
}

// =====================================================================
// Drivers (admin management)
// =====================================================================
export async function listDrivers(): Promise<Driver[]> {
  await requireAdmin();
  // 삭제가 소프트 삭제로 바뀌었으므로 여기서도 퇴사자를 제외한다. 그러지 않으면
  // 관리자가 삭제한 운전자가 목록에 그대로 남아 삭제가 안 된 것처럼 보인다.
  const { data, error } = await excludeRetired(
    supabase.from("drivers").select("id,name,created_at")
  ).order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Driver[];
}

export async function listDriverNames(): Promise<string[]> {
  const { data, error } = await excludeRetired(
    supabase.from("drivers").select("name")
  ).order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => d.name as string);
}

export async function addDriver(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!name || !password) {
    throw new Error("이름과 비밀번호를 모두 입력해주세요.");
  }
  const { error } = await supabase
    .from("drivers")
    .insert({ name, password: await hashPassword(password) });
  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 같은 이름의 운전자가 있습니다.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/admin");
}

/**
 * 운전자 비활성화(소프트 삭제).
 *
 * drivers 는 인사관리(동업자씨) 앱과 공유하는 테이블이므로 물리삭제 금지.
 * 행을 지우면 그쪽 인사기록이 FK 로 함께 날아가거나 고아가 된다.
 * 퇴사 처리는 양쪽 모두 is_active = false 로 통일한다.
 * (복구는 인사관리 앱에서 is_active 를 되돌린다 — 이 앱에는 복구 경로가 없다.)
 */
export async function deleteDriver(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("운전자 ID가 없습니다.");
  const { error } = await supabase
    .from("drivers")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function updateDriverPassword(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!id || !password) {
    throw new Error("운전자 ID와 새 비밀번호가 필요합니다.");
  }
  const { error } = await supabase
    .from("drivers")
    .update({ password: await hashPassword(password) })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
