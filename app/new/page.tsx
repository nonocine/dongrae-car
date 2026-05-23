import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/app/components/Header";
import NewLogForm from "@/app/new/NewLogForm";
import {
  getDriverSession,
  getLatestCumulative,
  listOtherDriverNames,
} from "@/app/actions";

export const dynamic = "force-dynamic";

function todayKR(): string {
  const now = new Date();
  const tz = new Date(now.getTime() + 9 * 60 * 60 * 1000); // KST
  return tz.toISOString().slice(0, 10);
}

export default async function NewLogPage() {
  const driver = await getDriverSession();
  if (!driver) redirect("/");

  const [previous, passengerCandidates] = await Promise.all([
    getLatestCumulative(),
    listOtherDriverNames(driver.name),
  ]);
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5 sm:py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="block h-6 w-1 rounded-full bg-[color:var(--dongrae-blue)]"
            />
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              운행일지 작성
            </h2>
          </div>
          <Link href="/" className="text-sm text-slate-500 hover:underline">
            ← 목록
          </Link>
        </div>
        <NewLogForm
          defaultDate={todayKR()}
          previousCumulative={previous}
          driverName={driver.name}
          passengerCandidates={passengerCandidates}
        />
      </main>
    </>
  );
}
