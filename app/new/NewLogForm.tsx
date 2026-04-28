"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createDrivingLog } from "@/app/actions";

type Props = {
  defaultDate: string;
  previousCumulative: number;
};

const labelCls = "block text-sm font-medium text-slate-700";
const inputCls =
  "mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

export default function NewLogForm({ defaultDate, previousCumulative }: Props) {
  const [distance, setDistance] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const distanceNum = Number(distance);
  const projected =
    Number.isFinite(distanceNum) && distance !== ""
      ? Math.round((previousCumulative + distanceNum) * 10) / 10
      : null;

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await createDrivingLog(formData);
          } catch (e) {
            const msg = e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.";
            // redirect() throws an internal NEXT_REDIRECT error — let it propagate.
            if (msg.includes("NEXT_REDIRECT")) throw e;
            setError(msg);
          }
        });
      }}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-sm"
    >
      <div>
        <label htmlFor="driven_at" className={labelCls}>
          운행 일자 <span className="text-red-500">*</span>
        </label>
        <input
          id="driven_at"
          name="driven_at"
          type="date"
          required
          defaultValue={defaultDate}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="driver" className={labelCls}>
            운전자 이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="driver"
            name="driver"
            type="text"
            required
            placeholder="홍길동"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="confirmed_by" className={labelCls}>
            확인 / 결재 <span className="text-red-500">*</span>
          </label>
          <input
            id="confirmed_by"
            name="confirmed_by"
            type="text"
            required
            placeholder="담당자명"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="purpose" className={labelCls}>
          용무 (운행 목적) <span className="text-red-500">*</span>
        </label>
        <input
          id="purpose"
          name="purpose"
          type="text"
          required
          placeholder="예) 청소년 행사 물품 운반"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="departure" className={labelCls}>
          출발지 <span className="text-red-500">*</span>
        </label>
        <input
          id="departure"
          name="departure"
          type="text"
          required
          placeholder="예) 동래구청소년센터"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="waypoint" className={labelCls}>
          경유지 <span className="text-slate-400">(선택)</span>
        </label>
        <input
          id="waypoint"
          name="waypoint"
          type="text"
          placeholder="여러 경유지는 쉼표로 구분"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="destination" className={labelCls}>
          도착지 <span className="text-red-500">*</span>
        </label>
        <input
          id="destination"
          name="destination"
          type="text"
          required
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="distance" className={labelCls}>
            운행거리 (km) <span className="text-red-500">*</span>
          </label>
          <input
            id="distance"
            name="distance"
            type="number"
            min="0"
            step="0.1"
            required
            inputMode="decimal"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>운행거리 누적 (km)</label>
          <div className="mt-1 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="text-slate-500">이전 누적</span>{" "}
            <span className="font-medium">
              {previousCumulative.toLocaleString("ko-KR", {
                maximumFractionDigits: 1,
              })}
            </span>{" "}
            <span className="text-slate-500">→ 신규 누적</span>{" "}
            <span className="font-bold text-blue-700">
              {projected !== null
                ? projected.toLocaleString("ko-KR", {
                    maximumFractionDigits: 1,
                  })
                : "—"}
            </span>{" "}
            km
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Link
          href="/"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:opacity-60"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
