"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase, type DrivingLog } from "@/lib/supabase";

const SESSION_COOKIE = "dongrae_admin";

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return store.get(SESSION_COOKIE)?.value === expected;
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
  store.set(SESSION_COOKIE, password, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/");
}

export async function adminLogout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}

export async function getLatestCumulative(): Promise<number> {
  const { data, error } = await supabase
    .from("driving_logs")
    .select("total_distance")
    .order("driven_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return 0;
  return Number(data[0].total_distance) || 0;
}

export async function createDrivingLog(formData: FormData) {
  const driven_at = String(formData.get("driven_at") ?? "");
  const driver = String(formData.get("driver") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim();
  const departure = String(formData.get("departure") ?? "").trim();
  const waypointRaw = String(formData.get("waypoint") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const distance = Number(formData.get("distance") ?? 0);
  const confirmed_by = String(formData.get("confirmed_by") ?? "").trim();

  if (
    !driven_at ||
    !driver ||
    !purpose ||
    !departure ||
    !destination ||
    !confirmed_by ||
    !Number.isFinite(distance) ||
    distance < 0
  ) {
    throw new Error("필수 항목을 모두 올바르게 입력해주세요.");
  }

  const previous = await getLatestCumulative();
  const total_distance = Math.round((previous + distance) * 10) / 10;

  const { error } = await supabase.from("driving_logs").insert({
    driven_at,
    driver,
    purpose,
    departure,
    waypoint: waypointRaw || null,
    destination,
    distance,
    total_distance,
    confirmed_by,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect("/");
}

export async function deleteDrivingLog(formData: FormData) {
  if (!(await isAdmin())) {
    throw new Error("관리자 권한이 필요합니다.");
  }
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("삭제할 항목 ID가 없습니다.");

  const { error } = await supabase.from("driving_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function listDrivingLogs(month?: string): Promise<DrivingLog[]> {
  let query = supabase
    .from("driving_logs")
    .select("*")
    .order("driven_at", { ascending: false })
    .order("created_at", { ascending: false });

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
