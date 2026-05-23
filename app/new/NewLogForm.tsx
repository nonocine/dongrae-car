"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Gauge,
  MapPin,
  UserCircle,
  Users,
} from "lucide-react";
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

const PURPOSE_PRESETS = [
  "기관방문",
  "외부회의",
  "사직동온나 방문",
  "사업 물품구매",
  "행사참여",
] as const;
const PURPOSE_OTHER = "__other__";

type Place = { selected: string; custom: string };
type Palette =
  | "blue"
  | "red"
  | "yellow"
  | "green"
  | "teal"
  | "slate";

function resolvePlace(p: Place): string {
  return p.selected === CUSTOM ? p.custom.trim() : p.selected;
}

const PALETTE_STYLES: Record<
  Palette,
  {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    titleColor: string;
    ring: string;
    chipActiveBg: string;
    chipActiveBorder: string;
  }
> = {
  blue: {
    bg: "bg-[color:var(--dongrae-blue-soft)]",
    border: "border-[color:var(--dongrae-blue)]/20",
    iconBg: "bg-[color:var(--dongrae-blue)]",
    iconColor: "text-white",
    titleColor: "text-[color:var(--dongrae-blue-strong)]",
    ring: "focus:border-[color:var(--dongrae-blue)] focus:ring-[color:var(--dongrae-blue)]",
    chipActiveBg: "bg-[color:var(--dongrae-blue)]",
    chipActiveBorder: "border-[color:var(--dongrae-blue)]",
  },
  red: {
    bg: "bg-[color:var(--dongrae-red-soft)]",
    border: "border-[color:var(--dongrae-red)]/20",
    iconBg: "bg-[color:var(--dongrae-red)]",
    iconColor: "text-white",
    titleColor: "text-[color:var(--dongrae-red-strong)]",
    ring: "focus:border-[color:var(--dongrae-red)] focus:ring-[color:var(--dongrae-red)]",
    chipActiveBg: "bg-[color:var(--dongrae-red)]",
    chipActiveBorder: "border-[color:var(--dongrae-red)]",
  },
  yellow: {
    bg: "bg-[color:var(--dongrae-yellow-soft)]",
    border: "border-[color:var(--dongrae-yellow-strong)]/30",
    iconBg: "bg-[color:var(--dongrae-yellow-strong)]",
    iconColor: "text-white",
    titleColor: "text-[color:var(--dongrae-yellow-strong)]",
    ring: "focus:border-[color:var(--dongrae-yellow-strong)] focus:ring-[color:var(--dongrae-yellow-strong)]",
    chipActiveBg: "bg-[color:var(--dongrae-yellow-strong)]",
    chipActiveBorder: "border-[color:var(--dongrae-yellow-strong)]",
  },
  green: {
    bg: "bg-[color:var(--dongrae-green-soft)]",
    border: "border-[color:var(--dongrae-green)]/25",
    iconBg: "bg-[color:var(--dongrae-green)]",
    iconColor: "text-white",
    titleColor: "text-[color:var(--dongrae-green-strong)]",
    ring: "focus:border-[color:var(--dongrae-green)] focus:ring-[color:var(--dongrae-green)]",
    chipActiveBg: "bg-[color:var(--dongrae-green)]",
    chipActiveBorder: "border-[color:var(--dongrae-green)]",
  },
  teal: {
    bg: "bg-[color:var(--dongrae-teal-soft)]",
    border: "border-[color:var(--dongrae-teal)]/25",
    iconBg: "bg-[color:var(--dongrae-teal)]",
    iconColor: "text-white",
    titleColor: "text-[color:var(--dongrae-teal-strong)]",
    ring: "focus:border-[color:var(--dongrae-teal)] focus:ring-[color:var(--dongrae-teal)]",
    chipActiveBg: "bg-[color:var(--dongrae-teal)]",
    chipActiveBorder: "border-[color:var(--dongrae-teal)]",
  },
  slate: {
    bg: "bg-slate-100",
    border: "border-slate-300",
    iconBg: "bg-slate-500",
    iconColor: "text-white",
    titleColor: "text-slate-700",
    ring: "focus:border-slate-500 focus:ring-slate-500",
    chipActiveBg: "bg-slate-500",
    chipActiveBorder: "border-slate-500",
  },
};

const inputBase =
  "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1";
const labelCls = "block text-sm font-medium text-slate-700";

function formatNumber(n: number) {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(n);
}

function SectionCard({
  palette,
  icon,
  title,
  subtitle,
  children,
}: {
  palette: Palette;
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  const p = PALETTE_STYLES[palette];
  return (
    <section
      className={`rounded-2xl border ${p.border} ${p.bg} p-4 shadow-sm transition hover:shadow-md sm:p-5`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${p.iconBg} ${p.iconColor} shadow-sm`}
          >
            {icon}
          </span>
          <h3 className={`text-sm font-bold ${p.titleColor}`}>{title}</h3>
        </div>
        {subtitle ? (
          <span className="shrink-0 text-xs font-medium text-slate-500">
            {subtitle}
          </span>
        ) : null}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
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
  const [otherInputOpen, setOtherInputOpen] = useState<boolean>(false);
  const [otherDraft, setOtherDraft] = useState<string>("");
  const [otherPassengers, setOtherPassengers] = useState<string[]>([]);

  const [purposeChoice, setPurposeChoice] = useState<string>("");
  const [purposeCustom, setPurposeCustom] = useState<string>("");

  function togglePassenger(name: string) {
    setPassengers((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  }

  function addOtherPassenger() {
    const v = otherDraft.trim();
    if (!v) return;
    setOtherPassengers((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setOtherDraft("");
  }

  function removeOtherPassenger(name: string) {
    setOtherPassengers((prev) => prev.filter((p) => p !== name));
  }

  const totalPassengerCount = passengers.length + otherPassengers.length;

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

  const resolvedPurpose =
    purposeChoice === PURPOSE_OTHER
      ? purposeCustom.trim()
      : purposeChoice;

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

  const tealRing = PALETTE_STYLES.teal.ring;
  const yellowRing = PALETTE_STYLES.yellow.ring;
  const slateRing = PALETTE_STYLES.slate.ring;

  return (
    <form
      action={(formData) => {
        setError(null);
        if (!resolvedPurpose) {
          setError("용무를 선택하거나 입력해주세요.");
          return;
        }
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
        formData.set("purpose", resolvedPurpose);
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
        formData.delete("passenger_others");
        for (const o of otherPassengers) {
          formData.append("passenger_others", o);
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
      className="space-y-3"
    >
      <SectionCard
        palette="blue"
        icon={<UserCircle size={18} strokeWidth={2.2} />}
        title="로그인 운전자"
      >
        <p className="text-base font-semibold text-[color:var(--dongrae-blue-strong)]">
          {driverName}
        </p>
      </SectionCard>

      <SectionCard
        palette="red"
        icon={<Users size={18} strokeWidth={2.2} />}
        title="동승자"
        subtitle={
          totalPassengerCount > 0 ? `동승자 ${totalPassengerCount}명` : "단독 운행"
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {passengerCandidates.length === 0 && otherPassengers.length === 0 ? (
            <p className="w-full rounded-md border border-dashed border-slate-300 bg-white/80 px-3 py-2 text-xs text-slate-500">
              등록된 다른 직원이 없습니다.
            </p>
          ) : null}

          {passengerCandidates.map((name) => {
            const active = passengers.includes(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => togglePassenger(name)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-[color:var(--dongrae-red)] bg-[color:var(--dongrae-red)] text-white shadow-sm"
                    : "border-slate-300 bg-white text-slate-700 hover:border-[color:var(--dongrae-red)]/50"
                }`}
              >
                {name}
              </button>
            );
          })}

          {otherPassengers.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900"
            >
              {name}
              <span className="text-[10px] opacity-70">(외부)</span>
              <button
                type="button"
                onClick={() => removeOtherPassenger(name)}
                aria-label={`${name} 제거`}
                className="ml-0.5 rounded-full text-amber-900 hover:bg-amber-200"
              >
                <span className="block px-1 leading-none">×</span>
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={() => setOtherInputOpen((v) => !v)}
            className={`rounded-full border border-dashed px-3 py-1.5 text-xs font-medium transition ${
              otherInputOpen
                ? "border-amber-500 bg-amber-50 text-amber-700"
                : "border-slate-400 bg-white/60 text-slate-600 hover:bg-white"
            }`}
          >
            + 기타 입력
          </button>
        </div>

        {otherInputOpen && (
          <div className="flex gap-2">
            <input
              type="text"
              value={otherDraft}
              onChange={(e) => setOtherDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOtherPassenger();
                }
              }}
              placeholder="외부 동승자 이름"
              className={`${inputBase} ${PALETTE_STYLES.red.ring} flex-1`}
            />
            <button
              type="button"
              onClick={addOtherPassenger}
              className="rounded-md bg-amber-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
            >
              추가
            </button>
          </div>
        )}
      </SectionCard>

      <SectionCard
        palette="yellow"
        icon={<Calendar size={18} strokeWidth={2.2} />}
        title="운행 일자"
      >
        <div className="inline-flex rounded-md border border-[color:var(--dongrae-yellow-strong)]/30 bg-white/70 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setIsMultiDay(false);
              setEndDate(startDate);
            }}
            className={`rounded px-3 py-1.5 transition ${
              !isMultiDay
                ? "bg-[color:var(--dongrae-yellow-strong)] text-white shadow-sm"
                : "text-slate-600"
            }`}
          >
            당일
          </button>
          <button
            type="button"
            onClick={() => setIsMultiDay(true)}
            className={`rounded px-3 py-1.5 transition ${
              isMultiDay
                ? "bg-[color:var(--dongrae-yellow-strong)] text-white shadow-sm"
                : "text-slate-600"
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
            className={`${inputBase} ${yellowRing}`}
          />
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-600">시작일</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStartDate(v);
                    if (endDate && endDate < v) setEndDate(v);
                  }}
                  className={`mt-1 ${inputBase} ${yellowRing}`}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600">종료일</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`mt-1 ${inputBase} ${yellowRing}`}
                />
              </div>
            </div>
            {periodInfo && (
              <p className="text-xs font-semibold text-[color:var(--dongrae-yellow-strong)]">
                총 {periodInfo.days}일
                {periodInfo.nights > 0 ? ` (${periodInfo.nights}박)` : ""}
              </p>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard
        palette="green"
        icon={<Briefcase size={18} strokeWidth={2.2} />}
        title="용무 (운행 목적)"
        subtitle={<span className="text-[color:var(--dongrae-red)]">*</span>}
      >
        <div className="flex flex-wrap gap-1.5">
          {PURPOSE_PRESETS.map((p) => {
            const active = purposeChoice === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPurposeChoice(p);
                  setPurposeCustom("");
                }}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-[color:var(--dongrae-green)] bg-[color:var(--dongrae-green)] text-white shadow-sm"
                    : "border-slate-300 bg-white text-slate-700 hover:border-[color:var(--dongrae-green)]/50"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setPurposeChoice(PURPOSE_OTHER)}
            aria-pressed={purposeChoice === PURPOSE_OTHER}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              purposeChoice === PURPOSE_OTHER
                ? "border-[color:var(--dongrae-green)] bg-[color:var(--dongrae-green)] text-white shadow-sm"
                : "border-dashed border-slate-400 bg-white text-slate-600 hover:border-[color:var(--dongrae-green)]/50"
            }`}
          >
            기타 (직접입력)
          </button>
        </div>

        <div
          style={{
            maxHeight: purposeChoice === PURPOSE_OTHER ? 60 : 0,
            opacity: purposeChoice === PURPOSE_OTHER ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 200ms ease, opacity 200ms ease",
          }}
        >
          <input
            type="text"
            value={purposeCustom}
            onChange={(e) => setPurposeCustom(e.target.value)}
            placeholder="용무를 직접 입력해주세요"
            className={`${inputBase} ${PALETTE_STYLES.green.ring} mt-2`}
          />
        </div>
      </SectionCard>

      <SectionCard
        palette="teal"
        icon={<MapPin size={18} strokeWidth={2.2} />}
        title="출발지 · 목적지 · 도착지"
        subtitle={
          <span className="text-xs text-slate-500">
            {stops.length}/{MAX_STOPS}
          </span>
        }
      >
        <div className="rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-sm">
          <span className="mr-2 text-xs text-slate-500">출발</span>
          <span className="font-medium text-slate-800">{VEHICLE.centerName}</span>
          <span className="ml-2 text-xs text-slate-400">고정</span>
        </div>

        <div className="space-y-2">
          {stops.map((wp, i) => (
            <PlacePicker
              key={i}
              value={wp}
              onChange={(next) => updateStop(i, next)}
              onRemove={stops.length > 1 ? () => removeStop(i) : undefined}
              placeholder={`목적지 ${i + 1}`}
              ringCls={tealRing}
              showRemoveSlot
            />
          ))}
          {stops.length < MAX_STOPS && (
            <button
              type="button"
              onClick={addStop}
              className="w-full rounded-md border border-dashed border-[color:var(--dongrae-teal)]/50 bg-white px-3 py-2 text-sm font-medium text-[color:var(--dongrae-teal-strong)] hover:bg-[color:var(--dongrae-teal-soft)]"
            >
              + 목적지 추가
            </button>
          )}
        </div>

        <div className="rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-sm">
          <span className="mr-2 text-xs text-slate-500">도착</span>
          <span className="font-medium text-slate-800">{VEHICLE.centerName}</span>
          <span className="ml-2 text-xs text-slate-400">고정</span>
        </div>
      </SectionCard>

      <SectionCard
        palette="slate"
        icon={<Gauge size={18} strokeWidth={2.2} />}
        title="누적거리"
        subtitle={
          <span className="text-xs text-slate-500">
            이전 {formatNumber(previousCumulative)} km
          </span>
        }
      >
        <label htmlFor="odometer" className={labelCls}>
          운행 후 계기판 누적거리 (km){" "}
          <span className="text-[color:var(--dongrae-red)]">*</span>
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
          className={`${inputBase} ${slateRing}`}
        />
        <p className="text-xs text-slate-500">
          차량 계기판에 표시된 전체 누적 km를 그대로 입력해주세요.
        </p>

        <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-3 text-center text-sm">
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
                  ? "text-[color:var(--dongrae-red)]"
                  : "text-[color:var(--dongrae-blue)]"
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
      </SectionCard>

      <SectionCard
        palette="blue"
        icon={<CheckCircle2 size={18} strokeWidth={2.2} />}
        title="확인 / 결재"
      >
        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-sm">
          <span className="font-medium text-slate-800">허일수</span>
          <span className="text-xs text-slate-400">고정</span>
        </div>
        <input type="hidden" name="confirmed_by" value="허일수" />
      </SectionCard>

      {error && (
        <p className="rounded-md bg-[color:var(--dongrae-red-soft)] px-3 py-2 text-sm text-[color:var(--dongrae-red-strong)]">
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
          className="rounded-md bg-[color:var(--dongrae-blue)] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--dongrae-blue-strong)] disabled:opacity-60"
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
  ringCls,
}: {
  value: Place;
  onChange: (next: Place) => void;
  required?: boolean;
  placeholder?: string;
  onRemove?: () => void;
  showRemoveSlot?: boolean;
  ringCls: string;
}) {
  const inline = !!showRemoveSlot;
  const select = (
    <select
      value={value.selected}
      onChange={(e) =>
        onChange({ selected: e.target.value, custom: value.custom })
      }
      required={required}
      className={`${inputBase} ${ringCls} ${inline ? "min-w-0 flex-1" : ""}`}
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
    <div className="space-y-2">
      {inline ? (
        <div className="flex items-stretch gap-2">
          {select}
          <button
            type="button"
            onClick={onRemove}
            disabled={!onRemove}
            aria-label="목적지 삭제"
            className="shrink-0 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-500 hover:bg-[color:var(--dongrae-red-soft)] hover:text-[color:var(--dongrae-red)] disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-500"
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
          className={`${inputBase} ${ringCls}`}
        />
      )}
    </div>
  );
}
