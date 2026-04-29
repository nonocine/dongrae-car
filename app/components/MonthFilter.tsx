"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function MonthFilter({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("month", next);
    else params.delete("month");
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/?${qs}` : "/");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-sm font-medium text-slate-700">월별 조회</label>
      <input
        type="month"
        value={value}
        onChange={(e) => update(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand)]"
      />
      {value && (
        <button
          type="button"
          onClick={() => update("")}
          className="text-xs text-slate-500 underline hover:text-slate-700"
        >
          전체보기
        </button>
      )}
      {pending && <span className="text-xs text-slate-400">불러오는 중…</span>}
    </div>
  );
}
