import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  Gauge,
  History,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Timer,
  Truck,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { VehicleHistoryTrackingModal } from "@/components/Dashboard/VehicleHistoryTrackingModal";
import {
  HistoryRouteMap,
  type BaseLayer,
} from "@/pages/HistoryTracking/HistoryRouteMap";
import type {
  VehicleHistoryPoint,
  VehicleHistoryResult,
} from "@/interfaces/VehicleHistoryTracking";
import { useGetVehicleLiveTrackingQuery } from "@/store/services/api/VehicleLiveTracking";

type PlaybackSpeed = 1 | 2 | 4 | 8 | 16;

const PLAYBACK_SPEEDS: PlaybackSpeed[] = [1, 2, 4, 8, 16];

const formatKm = (meters?: number, digits = 2) => {
  if (meters == null || !Number.isFinite(meters)) return "—";
  return `${(meters / 1000).toFixed(digits)} km`;
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

const pad = (value: number) => String(value).padStart(2, "0");

const formatDisplayDate = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
};

const formatDisplayTime = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatClock = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const pointTimeMs = (point: VehicleHistoryPoint) => {
  const raw = point.locationTime || point.gpsTime || point.deviceTime || point.createdAt;
  if (!raw) return null;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : null;
};

const pointSpeed = (point: VehicleHistoryPoint) => {
  const value = Number(point.speed);
  return Number.isFinite(value) ? value : 0;
};

const countStops = (points: VehicleHistoryPoint[], minStopMinutes: number) => {
  if (points.length === 0 || minStopMinutes <= 0) return 0;
  const minMs = minStopMinutes * 60_000;
  let stops = 0;
  let stopStart: number | null = null;

  for (const point of points) {
    const time = pointTimeMs(point);
    const stopped = pointSpeed(point) <= 2;
    if (stopped) {
      if (stopStart == null && time != null) stopStart = time;
      continue;
    }
    if (stopStart != null && time != null && time - stopStart >= minMs) stops += 1;
    stopStart = null;
  }

  const lastTime = pointTimeMs(points[points.length - 1]);
  if (stopStart != null && lastTime != null && lastTime - stopStart >= minMs) stops += 1;
  return stops;
};

const samplePointAtDistance = (
  points: VehicleHistoryPoint[],
  distanceM: number,
  totalDistanceM: number,
) => {
  if (points.length === 0) return null;
  if (totalDistanceM <= 0) return points[0];
  const ratio = Math.min(1, Math.max(0, distanceM / totalDistanceM));
  const index = Math.min(points.length - 1, Math.floor(ratio * (points.length - 1)));
  return points[index] ?? null;
};

const uniqueAddresses = (points: VehicleHistoryPoint[], limit = 8) => {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const point of points) {
    const address = (point.address || "").trim();
    if (!address || seen.has(address)) continue;
    seen.add(address);
    list.push(address);
    if (list.length >= limit) break;
  }
  return list;
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
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [baseLayer, setBaseLayer] = useState<BaseLayer>("street");
  const [showTraffic, setShowTraffic] = useState(false);
  const [minStopMinutes, setMinStopMinutes] = useState(15);

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

  const stopCount = useMemo(
    () => (history ? countStops(history.points, minStopMinutes) : 0),
    [history, minStopMinutes],
  );

  const addresses = useMemo(
    () => (history ? uniqueAddresses(history.points) : []),
    [history],
  );

  const startAddress = addresses[0] || matchedLive?.address || "—";
  const routeSummary = addresses.length > 0 ? addresses.join(", ") : "—";

  const currentPoint = useMemo(
    () =>
      history
        ? samplePointAtDistance(history.points, distanceM, totalDistanceM)
        : null,
    [history, distanceM, totalDistanceM],
  );

  const currentSpeed = currentPoint ? Math.round(pointSpeed(currentPoint)) : 0;
  const currentMoving = currentSpeed > 2;
  const currentTimeLabel = formatClock(
    currentPoint?.locationTime ||
      currentPoint?.gpsTime ||
      currentPoint?.deviceTime ||
      currentPoint?.createdAt,
  );

  const dateLabel = formatDisplayDate(history?.from);
  const timeRangeLabel =
    history?.from && history?.to
      ? `${formatDisplayTime(history.from)} - ${formatDisplayTime(history.to)}`
      : "00:00 - 23:59";

  const maxSpeedLabel =
    history?.stats?.maxSpeed != null && Number.isFinite(history.stats.maxSpeed)
      ? `${Math.round(history.stats.maxSpeed)} km/h`
      : "—";

  const totalDistanceLabel = formatKm(
    history?.stats?.totalDistanceMeters ?? totalDistanceM,
  );
  const durationLabel = formatDuration(history?.stats?.durationMs);

  const openNewSearch = () => {
    setPlaying(false);
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

  const handleProgressSeek = (value: number) => {
    if (!hasRoute || totalDistanceM <= 0) return;
    const next = Math.min(totalDistanceM, Math.max(0, (value / 100) * totalDistanceM));
    setDistanceM(next);
    if (finished && value < 100) setPlaying(false);
  };

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

        {/* Top actions when no route yet */}
        {!history && (
          <div className="pointer-events-none absolute left-0 top-0 z-[600] flex max-w-[min(100%,320px)] flex-col gap-2 p-3 sm:p-4">
            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[11px] font-semibold shadow-lg backdrop-blur-md ${
                  isDark
                    ? "border-white/15 bg-[#07142f]/92 text-slate-200"
                    : "border-slate-200 bg-white/95 text-slate-700"
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[11px] font-semibold shadow-lg ${
                  isDark
                    ? "border-cyan-300/35 bg-cyan-300/[0.14] text-cyan-50"
                    : "border-cyan-200 bg-cyan-50 text-cyan-800"
                }`}
              >
                <History className="h-3.5 w-3.5" />
                History Tracking
              </button>
            </div>
          </div>
        )}

        {/* Top playback panel when route is loaded */}
        {history && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[600] p-2 sm:p-3">
            <div
              className={`pointer-events-auto mx-auto w-full max-w-[1280px] overflow-hidden rounded-2xl border shadow-[0_16px_48px_rgba(15,23,42,0.18)] backdrop-blur-md ${
                isDark
                  ? "border-white/12 bg-[#07142f]/94 text-slate-100"
                  : "border-slate-200/90 bg-white/95 text-slate-800"
              }`}
            >
              {/* Header row */}
              <div
                className={`flex flex-col gap-3 border-b px-3 py-2.5 sm:px-4 lg:flex-row lg:items-center lg:justify-between ${
                  isDark ? "border-white/[0.08]" : "border-slate-100"
                }`}
              >
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition ${
                      isDark
                        ? "border-white/12 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>

                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isDark
                          ? "bg-cyan-300/10 text-cyan-200"
                          : "bg-sky-50 text-sky-600"
                      }`}
                    >
                      <Truck className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold leading-tight">
                        {vehicleLabel}
                      </p>
                      <p
                        className={`truncate text-[10px] ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {dateLabel} · {timeRangeLabel}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`hidden h-8 w-px shrink-0 sm:block ${
                      isDark ? "bg-white/10" : "bg-slate-200"
                    }`}
                  />

                  <div className="min-w-0 max-w-[220px]">
                    <p
                      className={`flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                        isDark ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      <MapPin className="h-3 w-3" />
                      Location
                    </p>
                    <p className="truncate text-[11px] font-medium">{startAddress}</p>
                  </div>

                  <div className="hidden min-w-0 flex-1 md:block md:max-w-[280px] xl:max-w-[360px]">
                    <p
                      className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${
                        isDark ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Route
                    </p>
                    <p className="truncate text-[11px]">{routeSummary}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        isDark
                          ? "border-white/10 bg-white/[0.04] text-slate-300"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      <Gauge className="h-3 w-3" />
                      Max: {maxSpeedLabel}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        isDark
                          ? "border-white/10 bg-white/[0.04] text-slate-300"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      Total: {totalDistanceLabel}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        isDark
                          ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-100"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {stopCount} stops
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        isDark
                          ? "border-white/10 bg-white/[0.04] text-slate-300"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      <Timer className="h-3 w-3" />
                      {durationLabel} total
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openNewSearch}
                  className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border px-3 text-[11px] font-semibold transition ${
                    isDark
                      ? "border-cyan-300/35 bg-cyan-300/[0.14] text-cyan-50 hover:bg-cyan-300/[0.22]"
                      : "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                  }`}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  New search
                </button>
              </div>

              {/* Playback row */}
              {hasRoute && (
                <div className="flex flex-col gap-3 px-3 py-2.5 sm:px-4 lg:flex-row lg:items-center lg:gap-4">
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={playing ? "Pause" : finished ? "Replay" : "Play"}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md transition ${
                        playing
                          ? "bg-amber-500 hover:bg-amber-600"
                          : "bg-sky-500 hover:bg-sky-600"
                      }`}
                    >
                      {playing ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 translate-x-[1px]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={restart}
                      aria-label="Restart"
                      className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                        isDark
                          ? "border-white/12 text-slate-300 hover:bg-white/[0.06]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <div
                      className={`flex overflow-hidden rounded-full border ${
                        isDark ? "border-white/12" : "border-slate-200"
                      }`}
                    >
                      {PLAYBACK_SPEEDS.map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => setPlaybackSpeed(speed)}
                          className={`h-8 min-w-[36px] px-2 text-[10px] font-bold transition ${
                            playbackSpeed === speed
                              ? isDark
                                ? "bg-sky-400/20 text-sky-100"
                                : "bg-sky-50 text-sky-700"
                              : isDark
                                ? "text-slate-400 hover:bg-white/[0.04]"
                                : "text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {speed}X
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p
                        className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Progress
                      </p>
                      <p
                        className={`text-[10px] font-medium tabular-nums ${
                          isDark ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {(distanceM / 1000).toFixed(2)} km / {(totalDistanceM / 1000).toFixed(2)} km
                      </p>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.1}
                      value={progress}
                      onChange={(event) => handleProgressSeek(Number(event.target.value))}
                      aria-label="Playback progress"
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-500 dark:bg-white/15"
                    />
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                      <span
                        className={`font-semibold tabular-nums ${
                          isDark ? "text-slate-200" : "text-slate-700"
                        }`}
                      >
                        {currentTimeLabel}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          currentMoving
                            ? isDark
                              ? "bg-emerald-400/15 text-emerald-200"
                              : "bg-emerald-50 text-emerald-700"
                            : isDark
                              ? "bg-slate-500/20 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {currentMoving ? "Moving" : "Stopped"} · {currentSpeed} km/h
                      </span>
                    </div>
                  </div>

                  <div
                    className={`flex shrink-0 items-end gap-2 rounded-xl border px-2.5 py-1.5 ${
                      isDark
                        ? "border-white/10 bg-white/[0.03]"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <label className="block">
                      <span
                        className={`mb-0.5 block text-[9px] font-semibold uppercase tracking-[0.12em] ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Min stop
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={minStopMinutes}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            if (!Number.isFinite(next)) return;
                            setMinStopMinutes(Math.min(180, Math.max(1, Math.round(next))));
                          }}
                          className={`h-8 w-14 rounded-lg border px-2 text-[12px] font-semibold outline-none ${
                            isDark
                              ? "border-white/12 bg-[#03091c]/70 text-white"
                              : "border-slate-200 bg-white text-slate-800"
                          }`}
                        />
                        <span
                          className={`text-[10px] ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          min
                        </span>
                      </div>
                    </label>
                    <span
                      className={`mb-0.5 inline-flex h-8 items-center rounded-lg border px-2 text-[10px] font-semibold ${
                        isDark
                          ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-100"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {stopCount} stops
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute right-3 top-3 z-[600]">
          <div
            className={`pointer-events-auto w-[152px] overflow-hidden rounded-xl border shadow-[0_12px_40px_rgba(0,0,0,0.28)] ${
              history ? "mt-[148px] sm:mt-[132px]" : ""
            } ${isDark ? "border-white/15 bg-[#07142f]/95" : "border-slate-200 bg-white"}`}
          >
            <div
              className={`border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                isDark
                  ? "border-white/10 bg-white/[0.04] text-slate-400"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
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
                      active
                        ? isDark
                          ? "bg-cyan-300/15 text-cyan-100"
                          : "bg-cyan-50 text-cyan-800"
                        : isDark
                          ? "text-slate-300 hover:bg-white/[0.04]"
                          : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                        active
                          ? "border-cyan-500 bg-cyan-500"
                          : isDark
                            ? "border-slate-500"
                            : "border-slate-400"
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
                  showTraffic
                    ? isDark
                      ? "bg-cyan-300/15 text-cyan-100"
                      : "bg-cyan-50 text-cyan-800"
                    : isDark
                      ? "text-slate-300 hover:bg-white/[0.04]"
                      : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                    showTraffic
                      ? "border-cyan-500 bg-cyan-500 text-white"
                      : isDark
                        ? "border-slate-500"
                        : "border-slate-400"
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
