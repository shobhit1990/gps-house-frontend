import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { ArrowLeft, History, MapPin, Pause, Play, RotateCcw, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { VehicleHistoryTrackingModal } from "@/components/Dashboard/VehicleHistoryTrackingModal";
import {
  HistoryRouteMap,
  type BaseLayer,
} from "@/pages/HistoryTracking/HistoryRouteMap";
import type { VehicleHistoryResult } from "@/interfaces/VehicleHistoryTracking";
import { useGetVehicleLiveTrackingQuery } from "@/store/services/api/VehicleLiveTracking";

const formatKm = (meters?: number) => {
  if (meters == null || !Number.isFinite(meters)) return "—";
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatDuration = (ms?: number) => {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return "—";
  const totalMin = Math.round(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

export default function HistoryTrackingPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const { data: vehicles = [] } = useGetVehicleLiveTrackingQuery();

  const [modalOpen, setModalOpen] = useState(true);
  const [history, setHistory] = useState<
    (VehicleHistoryResult & { vehicleId: string; vehicleKind?: "car" | "bike" }) | null
  >(null);
  const [playing, setPlaying] = useState(false);
  const [distanceM, setDistanceM] = useState(0);
  const [totalDistanceM, setTotalDistanceM] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1);
  const [baseLayer, setBaseLayer] = useState<BaseLayer>("street");
  const [showTraffic, setShowTraffic] = useState(false);

  const routeLength = history?.route.length ?? 0;
  const hasRoute = routeLength > 1;
  const finished = hasRoute && totalDistanceM > 0 && distanceM >= totalDistanceM - 0.5;
  const progress =
    hasRoute && totalDistanceM > 0 ? Math.min(100, (distanceM / totalDistanceM) * 100) : 0;

  useEffect(() => {
    setPlaying(false);
    setDistanceM(0);
    setTotalDistanceM(0);
  }, [history?.route]);

  const matchedLive = useMemo(() => {
    if (!history?.vehicleId) return null;
    return vehicles.find((vehicle) => vehicle.id === history.vehicleId) ?? null;
  }, [history?.vehicleId, vehicles]);

  const vehicleLabel = useMemo(() => {
    if (!history) return null;
    return (
      history.vehicle?.vehicleNumber ||
      matchedLive?.vehicle ||
      "Selected vehicle"
    );
  }, [history, matchedLive]);

  const vehicleKind = history?.vehicleKind ?? matchedLive?.kind ?? "car";
  const vehicleStatus = matchedLive?.status ?? (playing ? "running" : "stopped");

  const clearRoute = () => {
    setHistory(null);
    setPlaying(false);
    setDistanceM(0);
    setTotalDistanceM(0);
    setModalOpen(true);
  };

  const togglePlay = () => {
    if (!hasRoute) return;
    if (finished) {
      setDistanceM(0);
      setPlaying(true);
      return;
    }
    setPlaying((value) => !value);
  };

  const restart = () => {
    if (!hasRoute) return;
    setDistanceM(0);
    setPlaying(true);
  };

  const handleRouteMeta = useCallback(({ totalDistanceM: total }: { totalDistanceM: number }) => {
    setTotalDistanceM(total);
  }, []);

  const chipClass = isDark
    ? "border-white/15 bg-[#07142f]/92 text-slate-200 shadow-lg backdrop-blur-md"
    : "border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur";

  return (
    <div
      className={`relative min-h-[100dvh] overflow-hidden font-sans ${
        isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"
      }`}
    >
      <Sidebar onLogout={logout} />

      <main className="relative h-[100dvh] min-h-[640px]">
        <div className="absolute inset-0">
          <HistoryRouteMap
            routePath={history?.route ?? null}
            playing={playing}
            distanceM={distanceM}
            playbackSpeed={playbackSpeed}
            vehicleKind={vehicleKind}
            vehicleStatus={playing || distanceM > 0 ? "running" : vehicleStatus}
            baseLayer={baseLayer}
            showTraffic={showTraffic}
            onDistanceChange={setDistanceM}
            onPlayingChange={setPlaying}
            onRouteMeta={handleRouteMeta}
          />
        </div>

        <div className="pointer-events-none absolute left-0 top-0 z-[600] flex max-w-[min(100%,300px)] flex-col items-stretch gap-2 p-3 sm:p-4">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[11px] font-semibold ${chipClass}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[11px] font-semibold ${
                isDark
                  ? "border-cyan-300/35 bg-cyan-300/[0.14] text-cyan-50 shadow-lg"
                  : "border-cyan-200 bg-cyan-50 text-cyan-800 shadow-lg"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              {history ? "Change filters" : "History Tracking"}
            </button>
            {history && (
              <button
                type="button"
                onClick={clearRoute}
                className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[11px] font-medium ${chipClass}`}
              >
                <X className="h-3.5 w-3.5" />
                Clear route
              </button>
            )}
          </div>

          {history && (
            <div
              className={`pointer-events-auto w-full rounded-xl border p-2.5 shadow-xl backdrop-blur ${
                isDark
                  ? "border-white/15 bg-[#07142f]/92"
                  : "border-slate-200 bg-white/95"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                    isDark
                      ? "border-cyan-300/20 bg-cyan-300/[0.10] text-cyan-100"
                      : "border-cyan-200 bg-cyan-50 text-cyan-700"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-[11px] font-semibold ${
                      isDark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {vehicleLabel}
                  </p>
                  <p className={`truncate text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {history.route.length} pts · {formatKm(history.stats?.totalDistanceMeters)} ·{" "}
                    {formatDuration(history.stats?.durationMs)}
                  </p>
                </div>
              </div>

              {hasRoute && (
                <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
                  <div
                    className={`h-1.5 overflow-hidden rounded-full ${
                      isDark ? "bg-white/10" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-[width] duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={restart}
                      aria-label="Restart tracking"
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                        isDark
                          ? "border-white/10 bg-white/[0.05] text-slate-100 hover:bg-white/[0.1]"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={togglePlay}
                      className={`inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-[11px] font-semibold transition ${
                        playing
                          ? isDark
                            ? "border-amber-300/35 bg-amber-300/[0.18] text-amber-50"
                            : "border-amber-300 bg-amber-50 text-amber-800"
                          : isDark
                            ? "border-cyan-300/40 bg-cyan-300/[0.16] text-cyan-50"
                            : "border-cyan-300 bg-cyan-50 text-cyan-800"
                      }`}
                    >
                      {playing ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          {finished ? "Replay" : "Start"}
                        </>
                      )}
                    </button>
                    <div
                      className={`flex shrink-0 overflow-hidden rounded-lg border ${
                        isDark ? "border-white/10" : "border-slate-200"
                      }`}
                    >
                      {([1, 2] as const).map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => setPlaybackSpeed(speed)}
                          className={`h-8 min-w-[34px] px-1.5 text-[10px] font-semibold transition ${
                            playbackSpeed === speed
                              ? isDark
                                ? "bg-cyan-300/20 text-cyan-100"
                                : "bg-cyan-50 text-cyan-800"
                              : isDark
                                ? "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                                : "text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {(distanceM / 1000).toFixed(2)}/{(totalDistanceM / 1000).toFixed(2)} km ·{" "}
                    {playbackSpeed}x
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute right-3 top-3 z-[600]">
          <div className="pointer-events-auto w-[152px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Base
            </div>
            <div className="space-y-1 p-2">
              {(
                [
                  { id: "street", label: "Street" },
                  { id: "satellite", label: "Satellite" },
                ] as const
              ).map((option) => {
                const active = baseLayer === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setBaseLayer(option.id)}
                    className={`flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[11px] font-semibold transition ${
                      active ? "bg-cyan-50 text-cyan-800" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                        active ? "border-cyan-600 bg-cyan-600" : "border-slate-400"
                      }`}
                    >
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    {option.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowTraffic((value) => !value)}
                className={`flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[11px] font-semibold transition ${
                  showTraffic ? "bg-cyan-50 text-cyan-800" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                    showTraffic ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-400"
                  }`}
                >
                  {showTraffic && (
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
                      <path
                        d="M2.5 6.2 4.8 8.5 9.5 3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                Traffic
              </button>
            </div>
          </div>
        </div>

        {!history && !modalOpen && (
          <div className="pointer-events-none absolute inset-0 z-[550] flex items-center justify-center p-4">
            <div
              className={`pointer-events-auto rounded-2xl border px-5 py-4 text-center shadow-xl ${
                isDark ? "border-white/10 bg-[#0a1630]" : "border-slate-200 bg-white"
              }`}
            >
              <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
                No route loaded
              </p>
              <p className={`mt-1 text-[12px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                Choose a vehicle and time range to show tracking.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className={`mt-3 inline-flex h-9 items-center justify-center rounded-lg border px-4 text-[12px] font-semibold ${
                  isDark
                    ? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50"
                    : "border-cyan-300 bg-cyan-50 text-cyan-800"
                }`}
              >
                Open filters
              </button>
            </div>
          </div>
        )}
      </main>

      {modalOpen && (
        <VehicleHistoryTrackingModal
          vehicles={vehicles}
          initialVehicleId={history?.vehicleId}
          isDark={isDark}
          onClose={() => setModalOpen(false)}
          onRouteReady={(payload) => {
            const selected = vehicles.find((v) => v.id === payload.vehicleId);
            setHistory({
              ...payload,
              vehicleId: payload.vehicleId,
              vehicleKind: selected?.kind ?? "car",
            });
          }}
        />
      )}
    </div>
  );
}
