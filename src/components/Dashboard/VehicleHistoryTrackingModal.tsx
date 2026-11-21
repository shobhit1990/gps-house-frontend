import { useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Clock3, Loader2, MapPin, Truck, X } from "lucide-react";
import { toast } from "sonner";
import type { VehicleRow } from "@/components/data/vehicles";
import type { VehicleHistoryResult } from "@/interfaces/VehicleHistoryTracking";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useLazyGetVehicleHistoryTrackingQuery } from "@/store/services/api/VehicleHistoryTracking";

type VehicleHistoryTrackingModalProps = {
  vehicles: VehicleRow[];
  initialVehicleId?: string | null;
  isDark?: boolean;
  onClose: () => void;
  onRouteReady: (payload: VehicleHistoryResult & { vehicleId: string; vehicleSn: number | null }) => void;
};

const pad = (value: number) => String(value).padStart(2, "0");

const todayDateInput = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/**
 * Local date `YYYY-MM-DD` + time `HH:mm` → ISO UTC.
 * End times use end-of-minute (`.999`) to match API range examples.
 */
const toIsoDateTime = (date: string, time: string, endOfMinute = false) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = (time || "00:00").split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return "";
  const local = new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    endOfMinute ? 59 : 0,
    endOfMinute ? 999 : 0,
  );
  if (Number.isNaN(local.getTime())) return "";
  return local.toISOString();
};

export function VehicleHistoryTrackingModal({
  vehicles,
  initialVehicleId = null,
  isDark = true,
  onClose,
  onRouteReady,
}: VehicleHistoryTrackingModalProps) {
  const vehicleOptions = useMemo(
    () =>
      vehicles
        .filter((vehicle) => Boolean(vehicle.id))
        .map((vehicle) => ({
          id: vehicle.id as string,
          sn: vehicle.sn,
          label: vehicle.vehicle || vehicle.alias || `Vehicle ${vehicle.sn}`,
        })),
    [vehicles],
  );

  const [vehicleId, setVehicleId] = useState(
    () => initialVehicleId || vehicleOptions[0]?.id || "",
  );
  const [date, setDate] = useState(todayDateInput);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [formError, setFormError] = useState("");
  const [fetchHistory, { isFetching }] = useLazyGetVehicleHistoryTrackingQuery();

  const inputClass = `h-10 w-full min-w-0 rounded-lg border px-3 text-[12px] outline-none transition focus:ring-2 ${
    isDark
      ? "border-white/[0.09] bg-[#03091c]/70 text-white [color-scheme:dark] placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08]"
      : "border-slate-200 bg-white text-slate-900 [color-scheme:light] placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
  }`;

  const labelClass = `mb-1.5 block text-[11px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;
  const iconClass = `pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
    isDark ? "text-slate-500" : "text-slate-400"
  }`;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!vehicleId) {
      setFormError("Please select a vehicle.");
      return;
    }
    if (!date) {
      setFormError("Please select a date.");
      return;
    }
    if (!startTime || !endTime) {
      setFormError("Please select start and end time.");
      return;
    }

    const from = toIsoDateTime(date, startTime, false);
    const to = toIsoDateTime(date, endTime, true);
    if (!from || !to) {
      setFormError("Invalid date or time.");
      return;
    }
    if (new Date(from).getTime() > new Date(to).getTime()) {
      setFormError("Start time must be before end time.");
      return;
    }

    try {
      const result = await fetchHistory({ vehicleId, from, to, limit: 5000 }).unwrap();
      if (result.route.length === 0) {
        setFormError("No tracking points found for this range.");
        toast.error("No tracking points found for this range.");
        return;
      }

      const selected = vehicleOptions.find((option) => option.id === vehicleId);
      onRouteReady({
        ...result,
        vehicleId,
        vehicleSn: selected?.sn ?? null,
      });
      toast.success(`Route loaded · ${result.route.length} points`);
      onClose();
    } catch (error) {
      console.error("Failed to load vehicle history route.", error);
      setFormError(apiErrorMessage(error, "Could not load route. Please try again."));
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[800] flex items-center justify-center p-3 backdrop-blur-sm sm:p-6 ${
        isDark ? "bg-[#020718]/75" : "bg-slate-900/45"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isFetching) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !isFetching) onClose();
      }}
    >
      <form
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-history-tracking-title"
        className={`w-full max-w-[440px] overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
          isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
        }`}
      >
        <header
          className={`flex items-start justify-between gap-3 border-b px-5 py-4 ${
            isDark ? "border-white/[0.08] bg-[#08142e]" : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                isDark
                  ? "border-cyan-300/20 bg-cyan-300/[0.10] text-cyan-100"
                  : "border-cyan-200 bg-cyan-50 text-cyan-700"
              }`}
            >
              <Truck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="vehicle-history-tracking-title"
                className={`text-[15px] font-semibold tracking-tight ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Vehicle History Tracking
              </h2>
              <p className={`mt-0.5 text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                Replay a vehicle&apos;s path on the map
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isFetching}
            aria-label="Close dialog"
            className={`rounded-lg p-1.5 transition disabled:opacity-40 ${
              isDark
                ? "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          <label className="block">
            <span className={labelClass}>
              Vehicle<span className="text-rose-400"> *</span>
            </span>
            <div className="relative">
              <Truck className={iconClass} />
              <select
                value={vehicleId}
                onChange={(event) => setVehicleId(event.target.value)}
                className={`${inputClass} appearance-none pl-9 pr-9`}
                required
              >
                <option value="">Select vehicle...</option>
                {vehicleOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span
                className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                ▾
              </span>
            </div>
          </label>

          <label className="block">
            <span className={labelClass}>
              Date<span className="text-rose-400"> *</span>
            </span>
            <div className="relative">
              <CalendarDays className={iconClass} />
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={`${inputClass} pl-9`}
                required
              />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block min-w-0">
              <span className={labelClass}>
                Start Time<span className="text-rose-400"> *</span>
              </span>
              <div className="relative">
                <Clock3 className={iconClass} />
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className={`${inputClass} pl-9`}
                  required
                />
              </div>
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>
                End Time<span className="text-rose-400"> *</span>
              </span>
              <div className="relative">
                <Clock3 className={iconClass} />
                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className={`${inputClass} pl-9`}
                  required
                />
              </div>
            </label>
          </div>

          {formError && (
            <p
              role="alert"
              className={`rounded-lg border px-3 py-2 text-[11px] ${
                isDark
                  ? "border-rose-300/20 bg-rose-400/10 text-rose-200"
                  : "border-rose-200 bg-rose-50 text-rose-600"
              }`}
            >
              {formError}
            </p>
          )}
        </div>

        <footer
          className={`border-t px-5 py-3 ${
            isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-slate-50"
          }`}
        >
          <button
            type="submit"
            disabled={isFetching}
            className={`flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
              isDark
                ? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50 hover:bg-cyan-300/[0.22]"
                : "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
            }`}
          >
            {isFetching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading route…
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                Get route
              </>
            )}
          </button>
        </footer>
      </form>
    </div>
  );
}
