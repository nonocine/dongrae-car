"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createDrivingLog } from "@/app/actions";
import { VEHICLE } from "@/lib/vehicle";

type Props = {
  defaultDate: string;
  previousCumulative: number;
  driverName: string;
  passengerCandidates: string[];
};

const FREQUENT_PLACES = [
  VEHICLE.centerName,
  "동래구청",
  "부산시청",
  "양정청소년수련관",
  "동래시장",
  "사직동 온나",
] as const;
const CUSTOM = "__custom__";
const MAX_STOPS = 5;

type Place = { selected: string; custom: string };

function resolvePlace(p: Place): string {
  return p.selected === CUSTOM ? p.custom.trim() : p.selected;
}

const labelCls = "block text-sm font-medium text-slate-700";
const inputBase =
  "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand)]";
const inputCls = `mt-1 ${inputBase}`;
const fixedBoxCls =
  "mt-1 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm";

function formatNumber(n: number) {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(n);
}

export default function NewLogForm({
  defaultDate,
  previousCumulative,
  driverName,
  passengerCandidates,
}: Props) {
  const [odometer, setOdometer] = useState<string>("");
  const [stops, setStops] = useState<Place[]>([{ selected: "", custom: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [isMultiDay, setIsMultiDay] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>(defaultDate);
  const [endDate, setEndDate] = useState<string>(defaultDate);

  const [passengers, setPassengers] = useState<string[]>([]);

  function togglePassenger(name: string) {
    setPassengers((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  }

  const periodInfo = (() => {
    if (!isMultiDay || !startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffMs = e.getTime() - s.getTime();
    if (!Number.isFinite(diffMs) || diffMs < 0) return null;
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const nights = days - 1;
    return { days, nights };
  })();

  const resolvedStops = stops.map(resolvePlace).filter((s) => s.length > 0);

  const odometerNum = Number(odometer);
  const rounded =
    Number.isFinite(odometerNum) && odometer !== ""
      ? Math.round(odometerNum * 10) / 10
      : null;
  const distance =
    rounded !== null ? Math.round((rounded - previousCumulative) * 10) / 10 : null;
  const distanceInvalid = distance !== null && distance < 0;

  function addStop() {
    if (stops.length >= MAX_STOPS) return;
    setStops([...stops, { selected: "", custom: "" }]);
  }
  function updateStop(i: number, next: Place) {
    setStops(stops.map((w, idx) => (idx === i ? next : w)));
  }
  function removeStop(i: number) {
    setStops(stops.filter((_, idx) => idx !== i));
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        if (resolvedStops.length === 0) {
          setError("최소 1개의 목적지를 입력해주세요.");
          return;
        }
        if (isMultiDay && endDate && startDate && endDate < startDate) {
          setError("종료일은 시작일 이후여야 합니다.");
          return;
        }
        if (distanceInvalid) {
          setError(
            `입력한 누적거리(${formatNumber(rounded ?? 0)} km)가 직전 누적(${formatNumber(
              previousCumulative
            )} km)보다 작습니다.`
          );
          return;
        }
        formData.set("departure", VEHICLE.centerName);
        formData.set("destination", VEHICLE.centerName);
        formData.set("waypoint", resolvedStops.join(", "));
        formData.set("is_multi_day", isMultiDay ? "true" : "false");
        formData.set("start_date", startDate);
        formData.set("end_date", isMultiDay ? endDate : startDate);
        formData.delete("passengers");
        for (const p of passengers) {
          formData.append("passengers", p);
        }
        startTransition(async () => {
          try {
            await createDrivingLog(formData);
          } catch (e) {
            const msg = e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.";
            if (msg.includes("NEXT_REDIRECT")) throw e;
            setError(msg);
          }
        });
      }}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="rounded-lg bg-[color:var(--brand-soft)]/60 px-3 py-2 text-sm">
        <p className="text-xs text-[color:var(--brand)]">로그인 운전자</p>
        <p className="font-semibold text-[color:var(--brand-strong)]">
          {driverName}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className={labelCls}>동승자</label>
          <span className="text-xs font-medium text-slate-500">
            {passengers.length > 0
              ? `동승자 ${passengers.length}명`
              : "단독 운행"}
          </span>
        </div>
        {passengerCandidates.length === 0 ? (
          <p className="mt-1 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            등록된 다른 직원이 없습니다.
          </p>
        ) : (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {passengerCandidates.map((name) => {
              const active = passengers.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => togglePassenger(name)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "border-[color:var(--brand)] bg-[color:var(--brand)] text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>
          운행 일자 <span className="text-[color:var(--accent)]">*</span>
        </label>
        <div className="mt-1 inline-flex rounded-md border border-slate-300 bg-slate-50 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setIsMultiDay(false);
              setEndDate(startDate);
            }}
            className={`rounded px-3 py-1.5 transition ${
              !isMultiDay
                ? "bg-white text-[color:var(--brand-strong)] shadow-sm"
                : "text-slate-500"
            }`}
          >
            당일
          </button>
          <button
            type="button"
            onClick={() => setIsMultiDay(true)}
            className={`rounded px-3 py-1.5 transition ${
              isMultiDay
                ? "bg-white text-[color:var(--brand-strong)] shadow-sm"
                : "text-slate-500"
            }`}
          >
            기간 (1박 이상)
          </button>
        </div>

        {!isMultiDay ? (
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setEndDate(e.target.value);
            }}
            className={inputCls}
          />
        ) : (
          <div className="mt-1 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-500">시작일</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStartDate(v);
                    if (endDate && endDate < v) setEndDate(v);
                  }}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">종료일</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            {periodInfo && (
              <p className="text-xs text-[color:var(--brand-strong)]">
                총 {periodInfo.days}일
                {periodInfo.nights > 0 ? ` (${periodInfo.nights}박)` : ""}
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>확인 / 결재</label>
        <div className={fixedBoxCls}>
          <span className="font-medium text-slate-800">허일수</span>
          <span className="text-xs text-slate-400">고정</span>
        </div>
        <input type="hidden" name="confirmed_by" value="허일수" />
      </div>

      <div>
        <label htmlFor="purpose" className={labelCls}>
          용무 (운행 목적) <span className="text-[color:var(--accent)]">*</span>
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
        <label className={labelCls}>출발지</label>
        <div className={fixedBoxCls}>
          <span className="font-medium text-slate-800">{VEHICLE.centerName}</span>
          <span className="text-xs text-slate-400">고정</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className={labelCls}>
            목적지 <span className="text-[color:var(--accent)]">*</span>
          </label>
          <span className="text-xs text-slate-400">
            {stops.length}/{MAX_STOPS}
          </span>
        </div>
        <div className="mt-1 space-y-2">
          {stops.map((wp, i) => (
            <PlacePicker
              key={i}
              value={wp}
              onChange={(next) => updateStop(i, next)}
              onRemove={
                stops.length > 1 ? () => removeStop(i) : undefined
              }
              placeholder="목적지를 선택해주세요"
              showRemoveSlot
            />
          ))}
          {stops.length < MAX_STOPS && (
            <button
              type="button"
              onClick={addStop}
              className="w-full rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              + 목적지 추가
            </button>
          )}
        </div>
      </div>

      <div>
        <label className={labelCls}>도착지</label>
        <div className={fixedBoxCls}>
          <span className="font-medium text-slate-800">{VEHICLE.centerName}</span>
          <span className="text-xs text-slate-400">고정</span>
        </div>
      </div>

      <div>
        <label htmlFor="odometer" className={labelCls}>
          운행 후 계기판 누적거리 (km){" "}
          <span className="text-[color:var(--accent)]">*</span>
        </label>
        <input
          id="odometer"
          name="odometer"
          type="number"
          min="0"
          step="0.1"
          required
          inputMode="decimal"
          value={odometer}
          onChange={(e) => setOdometer(e.target.value)}
          placeholder={`${previousCumulative} 이상`}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-slate-500">
          차량 계기판에 표시된 전체 누적 km를 그대로 입력해주세요.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-slate-500">이전 누적</p>
            <p className="mt-0.5 font-semibold text-slate-700">
              {formatNumber(previousCumulative)} km
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">이번 운행</p>
            <p
              className={`mt-0.5 font-bold ${
                distanceInvalid
                  ? "text-[color:var(--accent)]"
                  : "text-[color:var(--brand)]"
              }`}
            >
              {distance !== null ? `${formatNumber(distance)} km` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">신규 누적</p>
            <p className="mt-0.5 font-semibold text-slate-900">
              {rounded !== null ? `${formatNumber(rounded)} km` : "—"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-[color:var(--accent-soft)] px-3 py-2 text-sm text-[color:var(--accent)]">
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
          disabled={pending || distanceInvalid}
          className="rounded-md bg-[color:var(--brand)] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--brand-strong)] disabled:opacity-60"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}

function PlacePicker({
  value,
  onChange,
  required,
  placeholder,
  onRemove,
  showRemoveSlot,
}: {
  value: Place;
  onChange: (next: Place) => void;
  required?: boolean;
  placeholder?: string;
  onRemove?: () => void;
  showRemoveSlot?: boolean;
}) {
  const inline = !!showRemoveSlot;
  const select = (
    <select
      value={value.selected}
      onChange={(e) =>
        onChange({ selected: e.target.value, custom: value.custom })
      }
      required={required}
      className={`${inputBase} ${inline ? "min-w-0 flex-1" : ""}`}
    >
      <option value="" disabled>
        {placeholder ?? "선택해주세요"}
      </option>
      {FREQUENT_PLACES.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
      <option value={CUSTOM}>기타 (직접입력)</option>
    </select>
  );

  return (
    <div className={inline ? "space-y-2" : "mt-1 space-y-2"}>
      {inline ? (
        <div className="flex items-stretch gap-2">
          {select}
          <button
            type="button"
            onClick={onRemove}
            disabled={!onRemove}
            aria-label="목적지 삭제"
            className="shrink-0 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-500 hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--accent)] disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-500"
          >
            ✕
          </button>
        </div>
      ) : (
        select
      )}
      {value.selected === CUSTOM && (
        <input
          type="text"
          value={value.custom}
          onChange={(e) =>
            onChange({ selected: CUSTOM, custom: e.target.value })
          }
          required={required}
          placeholder="장소를 직접 입력해주세요"
          className={inputBase}
        />
      )}
    </div>
  );
}
