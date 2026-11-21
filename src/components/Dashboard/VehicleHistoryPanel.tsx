import { History, Loader2, MapPin, X } from "lucide-react";
import {
  todayHistoryRangeIso,
  useGetVehicleHistoryTrackingQuery,
} from "@/store/services/api/VehicleHistoryTracking";

type VehicleHistoryPanelProps = {
  vehicleId: string;
  vehicleName: string;
  isDark: boolean;
  onClose: () => void;
  from?: string;
  to?: string;
};

export function VehicleHistoryPanel({
  vehicleId,
  vehicleName,
  isDark,
  onClose,
  from,
  to,
}: VehicleHistoryPanelProps) {
  const range = from && to ? { from, to } : todayHistoryRangeIso();
  const { data, isLoading, isFetching, isError, refetch } =
    useGetVehicleHistoryTrackingQuery({
      vehicleId,
      from: range.from,
      to: range.to,
      limit: 5000,
    });
  const rows = data?.rows ?? [];

  return (
    <section
      className={`mt-5 overflow-hidden rounded-[22px] border ${
        isDark
          ? "border-white/[0.10] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90 shadow-[0_24px_90px_rgba(0,0,0,0.30)]"
          : "border-slate-200 bg-white/90 shadow-[0_24px_90px_rgba(15,23,42,0.08)]"
      }`}
    >
      <div
        className={`flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
          isDark
            ? "border-white/[0.07] bg-gradient-to-r from-violet-400/[0.05] via-transparent to-cyan-300/[0.04]"
            : "border-slate-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              isDark
                ? "border-violet-300/20 bg-violet-300/[0.10] text-violet-100"
                : "border-violet-200 bg-violet-50 text-violet-700"
            }`}
          >
            <History className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                Vehicle history
              </h2>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  isDark
                    ? "border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-100"
                    : "border-cyan-200 bg-cyan-50 text-cyan-700"
                }`}
              >
                {vehicleName}
              </span>
              <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                {isLoading || isFetching ? "Loading…" : `${rows.length} points`}
              </span>
            </div>
            <p className={`mt-0.5 text-[11px] ${isDark ? "text-slate-500" : "text-slate-600"}`}>
              Tracking path and telemetry for the selected vehicle.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className={`h-9 rounded-lg border px-3 text-[11px] font-medium transition disabled:opacity-60 ${
              isDark
                ? "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close vehicle history"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
              isDark
                ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-white"
                : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr
              className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${
                isDark
                  ? "border-white/[0.07] bg-white/[0.025] text-slate-500"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-3 py-3 font-medium">Location</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">SPD</th>
              <th className="px-3 py-3 font-medium">Ignition</th>
              <th className="px-3 py-3 font-medium">GSM</th>
              <th className="px-3 py-3 font-medium">Odometer</th>
              <th className="px-3 py-3 font-medium">Lat</th>
              <th className="px-3 py-3 font-medium">Lng</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={`border-b text-[11px] last:border-0 ${
                  isDark
                    ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.03]"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3">{row.time || "—"}</td>
                <td className="max-w-[280px] px-3 py-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-cyan-200/70" />
                    <span className="line-clamp-2 text-[10px] leading-[1.5]">{row.address}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3">{row.status}</td>
                <td className="whitespace-nowrap px-3 py-3">{row.speed}</td>
                <td className="whitespace-nowrap px-3 py-3">{row.ignition}</td>
                <td className="whitespace-nowrap px-3 py-3">{row.gsm}</td>
                <td className="whitespace-nowrap px-3 py-3">{row.odometer}</td>
                <td className="whitespace-nowrap px-3 py-3 font-mono text-[10px]">{row.lat}</td>
                <td className="whitespace-nowrap px-3 py-3 font-mono text-[10px]">{row.lng}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-14 text-center">
                  {isLoading || isFetching ? (
                    <span className={`inline-flex items-center gap-2 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading history…
                    </span>
                  ) : (
                    <>
                      <p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        {isError ? "Could not load vehicle history" : "No history points yet"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {isError
                          ? "Check the API response or try another vehicle."
                          : "History will appear here after tracking points are available."}
                      </p>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
