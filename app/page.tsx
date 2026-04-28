import Link from "next/link";
import Header from "@/app/components/Header";
import MonthFilter from "@/app/components/MonthFilter";
import LogList from "@/app/components/LogList";
import { isAdmin, listDrivingLogs } from "@/app/actions";

export const dynamic = "force-dynamic";

function thisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: rawMonth } = await searchParams;
  const month =
    rawMonth && /^\d{4}-\d{2}$/.test(rawMonth) ? rawMonth : "";
  const [logs, admin] = await Promise.all([
    listDrivingLogs(month),
    isAdmin(),
  ]);

  const totalKm = logs.reduce((sum, l) => sum + Number(l.distance), 0);
  const downloadHref = month
    ? `/api/export?month=${encodeURIComponent(month)}`
    : `/api/export`;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:py-6">
        <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <MonthFilter value={month} />
          <div className="flex items-center gap-2">
            <a
              href={downloadHref}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              엑셀 다운로드
            </a>
            <Link
              href="/new"
              className="rounded-md bg-blue-700 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
            >
              + 운행일지 작성
            </Link>
          </div>
        </section>

        <section className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">조회 건수</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {logs.length.toLocaleString("ko-KR")} 건
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">기간 운행거리</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {new Intl.NumberFormat("ko-KR", {
                maximumFractionDigits: 1,
              }).format(totalKm)}{" "}
              km
            </p>
          </div>
        </section>

        <LogList logs={logs} isAdmin={admin} />

        <p className="mt-6 text-center text-xs text-slate-400">
          현재 월: {thisMonth()}
        </p>
      </main>
    </>
  );
}
