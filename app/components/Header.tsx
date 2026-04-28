import Link from "next/link";
import { VEHICLE } from "@/lib/vehicle";
import { isAdmin, adminLogout } from "@/app/actions";

export default async function Header() {
  const admin = await isAdmin();
  return (
    <header className="bg-blue-700 text-white shadow-sm">
      <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <Link href="/" className="block">
            <p className="text-xs font-medium text-blue-100">{VEHICLE.centerName}</p>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              차량 운행일지
            </h1>
          </Link>
          <div className="flex items-center gap-2 text-xs">
            {admin ? (
              <form action={adminLogout}>
                <button
                  type="submit"
                  className="rounded-full bg-blue-800/40 px-3 py-1.5 font-medium hover:bg-blue-800/60"
                >
                  관리자 로그아웃
                </button>
              </form>
            ) : (
              <Link
                href="/admin"
                className="rounded-full bg-blue-800/40 px-3 py-1.5 font-medium hover:bg-blue-800/60"
              >
                관리자
              </Link>
            )}
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-blue-50">
          <div className="flex gap-2">
            <dt className="text-blue-200">차종</dt>
            <dd className="font-medium">{VEHICLE.model}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-blue-200">차량번호</dt>
            <dd className="font-medium">{VEHICLE.plate}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-blue-200">보험사</dt>
            <dd className="font-medium">
              {VEHICLE.insurer}{" "}
              <a href={`tel:${VEHICLE.insurerPhone}`} className="underline">
                {VEHICLE.insurerPhone}
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
