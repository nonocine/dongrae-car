"use client";

import Link from "next/link";
import { useDriverSession } from "@/app/components/DriverSession";

export default function DriverBar() {
  const { ready, driver, signOut } = useDriverSession();

  if (!ready) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-400">
        세션 확인 중…
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <span className="text-slate-500">로그인 후 운행일지를 작성할 수 있습니다.</span>
        <Link
          href="/login"
          className="rounded-md bg-[color:var(--brand)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[color:var(--brand-strong)]"
        >
          운전자 로그인
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--brand-soft)] bg-[color:var(--brand-soft)]/40 p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--brand)] text-xs font-bold text-white">
          {driver.name.slice(0, 1)}
        </span>
        <span className="text-slate-700">
          <span className="font-semibold text-[color:var(--brand-strong)]">
            {driver.name}
          </span>{" "}
          운전자로 로그인됨
        </span>
      </div>
      <button
        type="button"
        onClick={signOut}
        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        로그아웃
      </button>
    </div>
  );
}
