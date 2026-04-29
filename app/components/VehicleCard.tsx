import { VEHICLE } from "@/lib/vehicle";
import VehicleImage from "@/app/components/VehicleImage";

function formatNumber(n: number) {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(n);
}

export default function VehicleCard({
  cumulative,
}: {
  cumulative: number;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--brand)]">
              차량번호
            </p>
            <div className="mt-0.5 flex items-center gap-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {VEHICLE.plate}
              </p>
              <VehicleImage />
            </div>
            <p className="mt-1 text-sm text-slate-600">{VEHICLE.model}</p>

            <dl className="mt-3 grid grid-cols-1 gap-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <dt className="w-12 shrink-0 text-slate-500">보험사</dt>
                <dd className="font-medium text-slate-800">
                  {VEHICLE.insurer}{" "}
                  <a
                    href={`tel:${VEHICLE.insurerPhone}`}
                    className="ml-1 font-semibold text-[color:var(--accent)] underline-offset-2 hover:underline"
                  >
                    {VEHICLE.insurerPhone}
                  </a>
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="w-12 shrink-0 text-slate-500">소속</dt>
                <dd className="font-medium text-slate-800">
                  {VEHICLE.centerName}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col justify-center rounded-xl bg-[color:var(--brand-soft)] px-4 py-3 text-right">
            <p className="text-[11px] font-medium text-[color:var(--brand)]">
              현재 누적거리
            </p>
            <p className="mt-0.5 text-xl font-bold leading-tight text-[color:var(--brand-strong)]">
              {formatNumber(cumulative)}{" "}
              <span className="text-xs font-medium text-[color:var(--brand)]">
                km
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
