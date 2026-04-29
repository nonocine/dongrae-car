"use client";

import { useState, useTransition } from "react";
import {
  addDriver,
  deleteDriver,
  setInitialDistance,
  updateDriverPassword,
  type AdminStats,
} from "@/app/actions";
import type { Driver } from "@/lib/supabase";

const labelCls = "block text-sm font-medium text-slate-700";
const inputCls =
  "mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand)]";
const cardCls =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";
const sectionTitle = "text-sm font-semibold text-slate-900";

function formatNumber(n: number) {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(n);
}

export default function AdminDashboard({
  drivers,
  initialDistance,
  stats,
}: {
  drivers: Driver[];
  initialDistance: number;
  stats: AdminStats;
}) {
  return (
    <div className="space-y-5">
      <StatsCard stats={stats} />
      <InitialDistanceCard initial={initialDistance} />
      <AddDriverCard />
      <DriversListCard drivers={drivers} />
    </div>
  );
}

function StatsCard({ stats }: { stats: AdminStats }) {
  return (
    <section className={cardCls}>
      <h3 className={sectionTitle}>운행 통계</h3>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-medium text-slate-500">이번 달 운행거리</p>
          <p className="mt-1 text-xl font-bold text-[color:var(--brand-strong)]">
            {formatNumber(stats.thisMonthDistance)}{" "}
            <span className="text-xs font-medium text-[color:var(--brand)]">km</span>
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-medium text-slate-500">전체 누적 운행거리</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {formatNumber(stats.totalDistance)}{" "}
            <span className="text-xs font-medium text-slate-500">km</span>
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RecentDestinationsBox items={stats.recentDestinations} />
        <TopDestinationsBox items={stats.topDestinations} />
      </div>

      <div className="mt-3">
        <TopDriversBox items={stats.topDrivers} />
      </div>
    </section>
  );
}

function RecentDestinationsBox({
  items,
}: {
  items: AdminStats["recentDestinations"];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--brand)]">
        최근 운행 목적지
      </p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">운행 기록이 없습니다.</p>
      ) : (
        <ol className="mt-2 space-y-1 text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <span className="truncate font-medium text-slate-800">
                {it.destination}
              </span>
              <span className="shrink-0 text-xs text-slate-500">
                {it.driven_at.replaceAll("-", ".")}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function TopDestinationsBox({
  items,
}: {
  items: AdminStats["topDestinations"];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--brand)]">
        자주 가는 목적지 TOP 5
      </p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">운행 기록이 없습니다.</p>
      ) : (
        <ol className="mt-2 space-y-1 text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-soft)] text-[10px] font-bold text-[color:var(--brand-strong)]">
                  {i + 1}
                </span>
                <span className="truncate font-medium text-slate-800">
                  {it.destination}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-slate-700">
                {it.count}회
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function TopDriversBox({ items }: { items: AdminStats["topDrivers"] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--brand)]">
        운행 많이 한 운전자 TOP 3
      </p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">운행 기록이 없습니다.</p>
      ) : (
        <ol className="mt-2 grid grid-cols-3 gap-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex flex-col items-center rounded-md bg-white p-2 text-center"
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  i === 0
                    ? "bg-[color:var(--accent)] text-white"
                    : "bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]"
                }`}
              >
                {i + 1}
              </span>
              <span className="mt-1 truncate text-sm font-semibold text-slate-900">
                {it.driver}
              </span>
              <span className="text-xs text-slate-500">{it.count}회</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function InitialDistanceCard({ initial }: { initial: number }) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <section className={cardCls}>
      <div className="flex items-center justify-between">
        <h3 className={sectionTitle}>초기 누적거리</h3>
        <span className="rounded-full bg-[color:var(--brand-soft)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--brand-strong)]">
          현재 {formatNumber(initial)} km
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        운행일지가 한 건도 없을 때 사용되는 출발 누적거리입니다. (차량 인수 시점 odometer)
      </p>
      <form
        action={(formData) => {
          setError(null);
          setOk(false);
          startTransition(async () => {
            try {
              await setInitialDistance(formData);
              setOk(true);
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "저장 중 오류가 발생했습니다."
              );
            }
          });
        }}
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="initial_distance" className={labelCls}>
            초기 누적거리 (km)
          </label>
          <input
            id="initial_distance"
            name="initial_distance"
            type="number"
            min="0"
            step="0.1"
            required
            inputMode="decimal"
            defaultValue={initial}
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-[38px] rounded-md bg-[color:var(--brand)] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--brand-strong)] disabled:opacity-60"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </form>
      {error && (
        <p className="mt-2 rounded-md bg-[color:var(--accent-soft)] px-3 py-2 text-xs text-[color:var(--accent)]">
          {error}
        </p>
      )}
      {ok && (
        <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          저장되었습니다.
        </p>
      )}
    </section>
  );
}

function AddDriverCard() {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className={cardCls}>
      <h3 className={sectionTitle}>운전자 추가</h3>
      <p className="mt-1 text-xs text-slate-500">
        등록된 운전자만 운행일지 작성을 할 수 있습니다.
      </p>
      <form
        action={(formData) => {
          setError(null);
          setOk(null);
          const name = String(formData.get("name") ?? "").trim();
          startTransition(async () => {
            try {
              await addDriver(formData);
              setOk(`${name} 추가됨`);
              (document.getElementById("add-driver-form") as HTMLFormElement)?.reset();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "추가 중 오류가 발생했습니다."
              );
            }
          });
        }}
        id="add-driver-form"
        className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div>
          <label htmlFor="add-name" className={labelCls}>
            이름
          </label>
          <input
            id="add-name"
            name="name"
            type="text"
            required
            placeholder="홍길동"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="add-password" className={labelCls}>
            비밀번호
          </label>
          <input
            id="add-password"
            name="password"
            type="text"
            required
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-[38px] rounded-md bg-[color:var(--brand)] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--brand-strong)] disabled:opacity-60"
        >
          {pending ? "추가 중…" : "추가"}
        </button>
      </form>
      {error && (
        <p className="mt-2 rounded-md bg-[color:var(--accent-soft)] px-3 py-2 text-xs text-[color:var(--accent)]">
          {error}
        </p>
      )}
      {ok && (
        <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {ok}
        </p>
      )}
    </section>
  );
}

function DriversListCard({ drivers }: { drivers: Driver[] }) {
  return (
    <section className={cardCls}>
      <h3 className={sectionTitle}>운전자 목록</h3>
      {drivers.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
          등록된 운전자가 없습니다.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {drivers.map((d) => (
            <DriverRow key={d.id} driver={d} />
          ))}
        </ul>
      )}
    </section>
  );
}

function DriverRow({ driver }: { driver: Driver }) {
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwOk, setPwOk] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);
  const [pwPending, pwStart] = useTransition();
  const [delPending, delStart] = useTransition();

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{driver.name}</p>
          <p className="text-xs text-slate-500">
            등록 {new Date(driver.created_at).toLocaleDateString("ko-KR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowPw((s) => !s);
              setPwError(null);
              setPwOk(false);
            }}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {showPw ? "닫기" : "비밀번호 변경"}
          </button>
          <form
            action={(formData) => {
              if (!confirm(`${driver.name} 운전자를 삭제하시겠습니까?`)) return;
              setDelError(null);
              delStart(async () => {
                try {
                  await deleteDriver(formData);
                } catch (e) {
                  setDelError(
                    e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다."
                  );
                }
              });
            }}
          >
            <input type="hidden" name="id" value={driver.id} />
            <button
              type="submit"
              disabled={delPending}
              className="rounded-md border border-[color:var(--accent)] bg-white px-2.5 py-1 text-xs font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] disabled:opacity-60"
            >
              {delPending ? "삭제 중…" : "삭제"}
            </button>
          </form>
        </div>
      </div>

      {showPw && (
        <form
          action={(formData) => {
            setPwError(null);
            setPwOk(false);
            pwStart(async () => {
              try {
                await updateDriverPassword(formData);
                setPwOk(true);
                setShowPw(false);
              } catch (e) {
                setPwError(
                  e instanceof Error ? e.message : "변경 중 오류가 발생했습니다."
                );
              }
            });
          }}
          className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3"
        >
          <input type="hidden" name="id" value={driver.id} />
          <div className="flex-1 min-w-[160px]">
            <label
              htmlFor={`pw-${driver.id}`}
              className="block text-xs font-medium text-slate-600"
            >
              새 비밀번호
            </label>
            <input
              id={`pw-${driver.id}`}
              name="password"
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand)]"
            />
          </div>
          <button
            type="submit"
            disabled={pwPending}
            className="h-[34px] rounded-md bg-[color:var(--brand)] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[color:var(--brand-strong)] disabled:opacity-60"
          >
            {pwPending ? "변경 중…" : "저장"}
          </button>
        </form>
      )}

      {pwOk && (
        <p className="mt-2 text-xs text-emerald-700">비밀번호가 변경되었습니다.</p>
      )}
      {pwError && (
        <p className="mt-2 text-xs text-[color:var(--accent)]">{pwError}</p>
      )}
      {delError && (
        <p className="mt-2 text-xs text-[color:var(--accent)]">{delError}</p>
      )}
    </li>
  );
}
