import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  Activity,
  Antenna,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Bike,
  CarFront,
  Copy,
  Crosshair,
  Filter,
  Gauge,
  History,
  MapPin,
  MoreHorizontal,
  Navigation2,
  Radio,
  Route,
  Search,
  Snowflake,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import {
  vehicles,
  type VehicleRow,
  type VehicleStatus,
} from "@/components/data/vehicles";
import { VehicleMap } from "@/pages/Dashboard/VehicleMap";
import { VehicleGlyph } from "@/pages/Dashboard/VehicleGlyph";

type StatusFilter = "all" | VehicleStatus;
type DetailTab = "overview" | "track" | "history" | "more";

const STATUS_META: Record<
  StatusFilter,
  { label: string; dot: string; active: string; idle: string }
> = {
  all: {
    label: "All",
    dot: "bg-sky-400",
    active: "border-sky-300/40 bg-sky-400/15 text-sky-100",
    idle: "border-white/[0.08] text-slate-400 hover:border-sky-300/25 hover:text-sky-200",
  },
  running: {
    label: "Running",
    dot: "bg-emerald-400",
    active: "border-emerald-300/40 bg-emerald-400/15 text-emerald-100",
    idle: "border-white/[0.08] text-slate-400 hover:border-emerald-300/25 hover:text-emerald-200",
  },
  stopped: {
    label: "Stopped",
    dot: "bg-rose-400",
    active: "border-rose-300/40 bg-rose-400/15 text-rose-100",
    idle: "border-white/[0.08] text-slate-400 hover:border-rose-300/25 hover:text-rose-200",
  },
  overspeed: {
    label: "Overspeed",
    dot: "bg-orange-400",
    active: "border-orange-300/40 bg-orange-400/15 text-orange-100",
    idle: "border-white/[0.08] text-slate-400 hover:border-orange-300/25 hover:text-orange-200",
  },
  idle: {
    label: "Idle",
    dot: "bg-amber-400",
    active: "border-amber-300/40 bg-amber-400/15 text-amber-100",
    idle: "border-white/[0.08] text-slate-400 hover:border-amber-300/25 hover:text-amber-200",
  },
  unreachable: {
    label: "Unreachable",
    dot: "bg-cyan-400",
    active: "border-cyan-300/40 bg-cyan-400/15 text-cyan-100",
    idle: "border-white/[0.08] text-slate-400 hover:border-cyan-300/25 hover:text-cyan-200",
  },
  new: {
    label: "New",
    dot: "bg-slate-400",
    active: "border-slate-300/40 bg-slate-400/15 text-slate-100",
    idle: "border-white/[0.08] text-slate-400 hover:border-slate-300/25 hover:text-slate-200",
  },
};

const STATUS_ORDER: StatusFilter[] = [
  "all",
  "running",
  "stopped",
  "overspeed",
  "idle",
  "unreachable",
  "new",
];

const STATUS_RAIL: Record<VehicleStatus, string> = {
  running: "from-emerald-400 to-emerald-500",
  stopped: "from-rose-400 to-rose-500",
  overspeed: "from-orange-400 to-orange-500",
  idle: "from-amber-400 to-amber-500",
  unreachable: "from-cyan-400 to-cyan-500",
  new: "from-slate-400 to-slate-500",
};

function statusTone(status: VehicleStatus, isDark: boolean) {
  const map = {
    running: isDark
      ? "text-emerald-300 bg-emerald-400/10 border-emerald-300/20"
      : "text-emerald-700 bg-emerald-50 border-emerald-200",
    stopped: isDark
      ? "text-rose-300 bg-rose-400/10 border-rose-300/20"
      : "text-rose-700 bg-rose-50 border-rose-200",
    overspeed: isDark
      ? "text-orange-300 bg-orange-400/10 border-orange-300/20"
      : "text-orange-700 bg-orange-50 border-orange-200",
    idle: isDark
      ? "text-amber-300 bg-amber-400/10 border-amber-300/20"
      : "text-amber-700 bg-amber-50 border-amber-200",
    unreachable: isDark
      ? "text-cyan-300 bg-cyan-400/10 border-cyan-300/20"
      : "text-cyan-700 bg-cyan-50 border-cyan-200",
    new: isDark
      ? "text-slate-300 bg-slate-400/10 border-slate-300/20"
      : "text-slate-700 bg-slate-100 border-slate-200",
  } as const;
  return map[status];
}

function BatteryIcon({ value }: { value?: string | number }) {
  const volts = Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(volts) || volts >= 12.4) {
    return <BatteryFull className="h-3.5 w-3.5 text-emerald-400" />;
  }
  if (volts >= 12) return <BatteryMedium className="h-3.5 w-3.5 text-amber-400" />;
  return <BatteryLow className="h-3.5 w-3.5 text-rose-400" />;
}

function SignalBars({ strength }: { strength?: string | number }) {
  const level = Math.max(0, Math.min(5, Number(strength) || 0));
  return (
    <span className="inline-flex items-end gap-[2px]" aria-label={`GSM ${level}`}>
      {[1, 2, 3, 4, 5].map((bar) => (
        <span
          key={bar}
          className={`w-[2.5px] rounded-sm ${bar <= level ? "bg-cyan-300" : "bg-white/15"}`}
          style={{ height: `${6 + bar * 2}px` }}
        />
      ))}
    </span>
  );
}

function SpeedRing({
  speed,
  isDark,
}: {
  speed: number;
  isDark: boolean;
}) {
  const capped = Math.min(speed, 120);
  const pct = capped / 120;
  const circumference = 2 * Math.PI * 18;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}
          strokeWidth="3.5"
        />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke={speed > 0 ? "#34d399" : "#fb7185"}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-[11px] font-bold leading-none ${isDark ? "text-white" : "text-slate-900"}`}>
          {speed}
        </span>
        <span className="text-[7px] uppercase tracking-wider text-slate-500">km/h</span>
      </div>
    </div>
  );
}

function TelemetryChip({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-2.5 py-2 ${
        isDark
          ? "border-white/[0.07] bg-white/[0.03]"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-[11px] font-semibold ${
          isDark ? "text-slate-100" : "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function VehicleCard({
  vehicle,
  selected,
  isDark,
  onSelect,
}: {
  vehicle: VehicleRow;
  selected: boolean;
  isDark: boolean;
  onSelect: () => void;
}) {
  const accentColor =
    vehicle.status === "running"
      ? "#34d399"
      : vehicle.status === "stopped"
        ? "#fb7185"
        : vehicle.status === "unreachable"
          ? "#22d3ee"
          : vehicle.color;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative w-full overflow-hidden rounded-2xl border text-left transition duration-300 ${
        selected
          ? isDark
            ? "border-cyan-300/40 bg-gradient-to-br from-cyan-400/[0.14] via-[#0a1836] to-violet-500/[0.1] shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_18px_40px_rgba(0,0,0,0.35)]"
            : "border-cyan-300 bg-gradient-to-br from-cyan-50 via-white to-sky-50 shadow-[0_14px_36px_rgba(14,165,233,0.14)]"
          : isDark
            ? "border-white/[0.08] bg-[#08142e]/75 hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-[#0a1937]/92"
            : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <span
        className={`absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full bg-gradient-to-b ${STATUS_RAIL[vehicle.status]} ${
          selected ? "opacity-100" : "opacity-70"
        }`}
      />

      <div className="p-3.5 pl-4">
        <div className="flex items-start gap-3">
          <VehicleGlyph kind={vehicle.kind} color={accentColor} size="lg" />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  className={`truncate text-[13px] font-semibold tracking-wide ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {vehicle.vehicle}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                  {vehicle.kind === "bike" ? (
                    <Bike className="h-3 w-3" />
                  ) : (
                    <CarFront className="h-3 w-3" />
                  )}
                  <span className="truncate">
                    {vehicle.branch || vehicle.alias || "Unassigned"}
                  </span>
                </p>
              </div>
              <SpeedRing speed={vehicle.speedKmph ?? 0} isDark={isDark} />
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${statusTone(
                  vehicle.status,
                  isDark,
                )}`}
              >
                {vehicle.status === "running" && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                )}
                {vehicle.status}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-slate-400">
                <SignalBars strength={vehicle.gsm} />
                <Antenna
                  className={`h-3 w-3 ${vehicle.gps === "On" ? "text-cyan-300" : "text-slate-500"}`}
                />
                <Snowflake
                  className={`h-3 w-3 ${vehicle.ac ? "text-sky-300" : "text-slate-500"}`}
                />
                <BatteryIcon value={vehicle.btr} />
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <TelemetryChip label="Last update" value={vehicle.updatedAt} isDark={isDark} />
          <TelemetryChip label="Since" value={vehicle.since} isDark={isDark} />
          <TelemetryChip
            label="Distance"
            value={`${vehicle.distanceKm.toFixed(1)} km`}
            isDark={isDark}
          />
          <TelemetryChip label="POI" value={vehicle.poi} isDark={isDark} />
        </div>

        <p
          className={`mt-3 line-clamp-2 border-t pt-2.5 text-[10px] leading-relaxed ${
            isDark
              ? "border-white/[0.06] text-slate-400"
              : "border-slate-100 text-slate-600"
          }`}
        >
          <MapPin className="mr-1 inline h-3 w-3 text-cyan-400/80" />
          {vehicle.address}
        </p>
      </div>
    </button>
  );
}

function DetailRow({
  label,
  value,
  isDark,
  accent = false,
}: {
  label: string;
  value: string;
  isDark: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 border-b py-2.5 last:border-0 ${
        isDark ? "border-white/[0.06]" : "border-slate-100"
      }`}
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      <span
        className={`max-w-[58%] text-right text-[11px] ${
          accent
            ? "font-semibold text-cyan-300"
            : isDark
              ? "text-slate-200"
              : "text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function AdvanceDashboard() {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const isDark = theme !== "light";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [kindFilter, setKindFilter] = useState<"all" | "car" | "bike">("all");
  const [selectedVehicleSn, setSelectedVehicleSn] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: vehicles.length,
      running: 0,
      stopped: 0,
      overspeed: 0,
      idle: 0,
      unreachable: 0,
      new: 0,
    };
    for (const vehicle of vehicles) counts[vehicle.status] += 1;
    return counts;
  }, []);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesStatus =
        statusFilter === "all" || vehicle.status === statusFilter;
      const matchesKind = kindFilter === "all" || vehicle.kind === kindFilter;
      const matchesSearch =
        !query ||
        [
          vehicle.vehicle,
          vehicle.branch,
          vehicle.address,
          vehicle.poi,
          vehicle.driverName,
          vehicle.alias,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesStatus && matchesKind && matchesSearch;
    });
  }, [search, statusFilter, kindFilter]);

  useEffect(() => {
    if (
      selectedVehicleSn != null &&
      !filteredVehicles.some((vehicle) => vehicle.sn === selectedVehicleSn)
    ) {
      setSelectedVehicleSn(null);
    }
  }, [filteredVehicles, selectedVehicleSn]);

  const selectedVehicle =
    filteredVehicles.find((vehicle) => vehicle.sn === selectedVehicleSn) ?? null;

  const fleetHealth = useMemo(() => {
    const online = vehicles.filter((v) => v.status !== "unreachable").length;
    return Math.round((online / Math.max(vehicles.length, 1)) * 100);
  }, []);

  const handleSelectVehicle = (sn: number) => {
    setSelectedVehicleSn(sn);
    setDetailTab("overview");
  };

  const copyCoords = async () => {
    if (!selectedVehicle) return;
    const text = `${selectedVehicle.lat}, ${selectedVehicle.lng}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden font-sans ${
        isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"
      }`}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.14] blur-[160px]" />
        <div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.10] blur-[170px]" />
        <div className="absolute bottom-[-300px] left-[30%] h-[500px] w-[700px] rounded-full bg-blue-700/[0.08] blur-[180px]" />
      </div>

      <Sidebar onLogout={logout} />

      <main className="relative mx-auto max-w-[1900px] space-y-3 px-3 pb-4 pt-4 sm:px-5 lg:px-6 lg:pt-5">
        <header
          className={`flex flex-col gap-3 rounded-[22px] border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
            isDark
              ? "border-white/[0.10] bg-gradient-to-r from-[#0b1835]/95 via-[#08142e]/90 to-[#10102d]/90 shadow-[0_18px_60px_rgba(0,0,0,0.25)]"
              : "border-slate-200 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
          }`}
        >
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Live ops · Advance dashboard
            </div>
            <h1 className={`text-lg font-semibold tracking-tight sm:text-xl ${isDark ? "text-white" : "text-slate-900"}`}>
              Fleet command view
            </h1>
            <p className="mt-1 text-[11px] text-slate-500">
              Pick a vehicle to zoom the map and open live telemetry.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[340px]">
            <div
              className={`rounded-2xl border px-3 py-2.5 ${
                isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Fleet</p>
              <p className={`mt-1 text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                {String(vehicles.length).padStart(2, "0")}
              </p>
            </div>
            <div
              className={`rounded-2xl border px-3 py-2.5 ${
                isDark ? "border-emerald-300/20 bg-emerald-400/[0.08]" : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Running</p>
              <p className="mt-1 text-lg font-semibold text-emerald-300">
                {String(statusCounts.running).padStart(2, "0")}
              </p>
            </div>
            <div
              className={`rounded-2xl border px-3 py-2.5 ${
                isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Health</p>
              <p className={`mt-1 text-lg font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>
                {fleetHealth}%
              </p>
            </div>
          </div>
        </header>

        <section
          className={`overflow-hidden rounded-[22px] border ${
            isDark
              ? "border-white/[0.10] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90 shadow-[0_24px_90px_rgba(0,0,0,0.30)]"
              : "border-slate-200 bg-white/90 shadow-[0_24px_90px_rgba(15,23,42,0.08)]"
          }`}
        >
          <div
            className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${
              isDark
                ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.04] via-transparent to-violet-400/[0.05]"
                : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"
            }`}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative block min-w-0 sm:max-w-[300px] sm:flex-1">
                <Search
                  className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                    isDark ? "text-cyan-200/55" : "text-cyan-600/70"
                  }`}
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search plate, driver, branch..."
                  className={`h-10 w-full rounded-xl border pl-9 pr-9 text-xs outline-none transition ${
                    isDark
                      ? "border-white/[0.09] bg-[#03091c]/65 text-white placeholder:text-slate-600 hover:border-white/[0.14] focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/10"
                      : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                  }`}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 ${
                      isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </label>

              <button
                type="button"
                onClick={() => setShowFilters((value) => !value)}
                className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-[11px] font-semibold uppercase tracking-[0.1em] transition ${
                  showFilters
                    ? isDark
                      ? "border-violet-300/30 bg-violet-400/10 text-violet-100"
                      : "border-violet-200 bg-violet-50 text-violet-700"
                    : isDark
                      ? "border-white/[0.09] bg-white/[0.03] text-slate-300 hover:border-white/[0.16]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Type
              </button>

              <div
                className={`hidden items-center gap-2 rounded-xl border px-3 py-2 text-[10px] sm:flex ${
                  isDark
                    ? "border-white/[0.08] bg-white/[0.03] text-slate-400"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                <Radio className="h-3.5 w-3.5 text-cyan-300" />
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_ORDER.map((key) => {
                const meta = STATUS_META[key];
                const active = statusFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition ${
                      active ? meta.active : isDark ? meta.idle : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                    <span className="rounded-md bg-black/10 px-1.5 py-0.5 tabular-nums dark:bg-white/10">
                      {statusCounts[key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {showFilters && (
            <div
              className={`flex flex-wrap items-center gap-2 border-b px-3 py-2.5 sm:px-4 ${
                isDark ? "border-white/[0.07] bg-white/[0.02]" : "border-slate-200 bg-slate-50/80"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Vehicle type
              </span>
              {(
                [
                  ["all", "All", Activity],
                  ["car", "Cars", CarFront],
                  ["bike", "Bikes", Bike],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setKindFilter(value)}
                  aria-pressed={kindFilter === value}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition ${
                    kindFilter === value
                      ? isDark
                        ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                        : "border-cyan-200 bg-cyan-50 text-cyan-700"
                      : isDark
                        ? "border-white/[0.08] text-slate-400 hover:border-white/[0.14]"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="grid xl:grid-cols-[380px_minmax(0,1fr)]">
            <aside
              className={`flex h-[600px] min-h-0 flex-col border-b xl:border-b-0 xl:border-r ${
                isDark ? "border-white/[0.07] bg-[#071229]/45" : "border-slate-200 bg-slate-50/70"
              }`}
            >
              <div
                className={`flex items-center justify-between border-b px-4 py-3 ${
                  isDark ? "border-white/[0.07]" : "border-slate-200"
                }`}
              >
                <div>
                  <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Unit list
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {filteredVehicles.length} matching · click to focus
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-300">
                  <Zap className="h-3 w-3" />
                  Live
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-3">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.sn}
                    vehicle={vehicle}
                    selected={selectedVehicleSn === vehicle.sn}
                    isDark={isDark}
                    onSelect={() => handleSelectVehicle(vehicle.sn)}
                  />
                ))}
                {filteredVehicles.length === 0 && (
                  <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                    <Search className="h-5 w-5 text-slate-500" />
                    <p className={`mt-3 text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      No vehicles found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try another status or search term.
                    </p>
                  </div>
                )}
              </div>
            </aside>

            <section className="relative h-[600px]">
              <VehicleMap
                vehicles={filteredVehicles}
                selectedVehicleSn={selectedVehicleSn}
                onVehicleSelect={handleSelectVehicle}
                focusZoom={16}
                showPopup={Boolean(selectedVehicle)}
                lockFitOnSelect
              />

              {selectedVehicle && (
                <div
                  className={`absolute left-3 top-3 z-[1100] w-[min(340px,calc(100%-1.5rem))] overflow-hidden rounded-[22px] border shadow-[0_28px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:left-4 sm:top-4 ${
                    isDark
                      ? "border-white/15 bg-[#07142f]/95"
                      : "border-slate-200 bg-white/96"
                  }`}
                >
                  <div
                    className={`relative overflow-hidden border-b px-3.5 py-3 ${
                      isDark ? "border-white/[0.08]" : "border-slate-100"
                    }`}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-transparent to-violet-400/10" />
                    <div className="relative flex items-start gap-3">
                      <VehicleGlyph
                        kind={selectedVehicle.kind}
                        color={
                          selectedVehicle.status === "running" ? "#34d399" : selectedVehicle.color
                        }
                        size="lg"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className={`truncate text-[13px] font-semibold ${
                                isDark ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {selectedVehicle.vehicle}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] text-slate-500">
                              {selectedVehicle.alias || selectedVehicle.branch || "Vehicle detail"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedVehicleSn(null)}
                            aria-label="Close details"
                            className={`rounded-lg p-1.5 transition ${
                              isDark
                                ? "text-slate-400 hover:bg-white/10 hover:text-white"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${statusTone(
                              selectedVehicle.status,
                              isDark,
                            )}`}
                          >
                            {selectedVehicle.status}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] px-2 py-0.5 text-[9px] text-slate-400">
                            <Gauge className="h-3 w-3 text-cyan-300" />
                            {selectedVehicle.speedKmph ?? 0} km/h
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-3 grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectVehicle(selectedVehicle.sn)}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-[10px] font-semibold transition ${
                          isDark
                            ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15"
                            : "border-cyan-200 bg-cyan-50 text-cyan-700"
                        }`}
                      >
                        <Crosshair className="h-3.5 w-3.5" />
                        Re-focus map
                      </button>
                      <button
                        type="button"
                        onClick={copyCoords}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-[10px] font-semibold transition ${
                          isDark
                            ? "border-white/[0.1] bg-white/[0.04] text-slate-200 hover:bg-white/[0.07]"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copied ? "Copied" : "Copy coords"}
                      </button>
                    </div>
                  </div>

                  <div
                    className={`grid grid-cols-4 border-b text-[10px] font-semibold uppercase tracking-[0.08em] ${
                      isDark ? "border-white/[0.08]" : "border-slate-100"
                    }`}
                  >
                    {(
                      [
                        ["overview", "Overview", UserRound],
                        ["track", "Track", Navigation2],
                        ["history", "History", History],
                        ["more", "More", MoreHorizontal],
                      ] as const
                    ).map(([key, label, Icon]) => {
                      const active = detailTab === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setDetailTab(key)}
                          className={`flex flex-col items-center gap-1 px-1 py-2.5 transition ${
                            active
                              ? isDark
                                ? "bg-cyan-300/[0.1] text-cyan-100"
                                : "bg-cyan-50 text-cyan-700"
                              : isDark
                                ? "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
                                : "text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="max-h-[min(48vh,400px)] overflow-y-auto px-3 py-1">
                    {detailTab === "overview" && (
                      <>
                        <DetailRow
                          label="Distance from last stop"
                          value={`${selectedVehicle.distanceFromLastStopKm ?? 0} km`}
                          isDark={isDark}
                        />
                        <DetailRow
                          label="Duration"
                          value={selectedVehicle.duration || "—"}
                          isDark={isDark}
                        />
                        <DetailRow
                          label="Speed"
                          value={`${selectedVehicle.speedKmph ?? 0} kmph`}
                          isDark={isDark}
                        />
                        <DetailRow
                          label="Odometer"
                          value={`${selectedVehicle.odometerKm?.toLocaleString() ?? "—"} km`}
                          isDark={isDark}
                        />
                        <DetailRow
                          label="Today distance"
                          value={`${selectedVehicle.todayDistanceKm ?? 0} km`}
                          isDark={isDark}
                        />
                        <DetailRow
                          label="Coordinates"
                          value={`${selectedVehicle.lat.toFixed(5)}, ${selectedVehicle.lng.toFixed(5)}`}
                          isDark={isDark}
                          accent
                        />
                        <DetailRow
                          label="EL lock"
                          value={selectedVehicle.lockStatus || "—"}
                          isDark={isDark}
                        />
                        <DetailRow
                          label="Panic"
                          value={selectedVehicle.panic ? "Active" : "Normal"}
                          isDark={isDark}
                        />
                        <DetailRow
                          label="Driver"
                          value={selectedVehicle.driverName || "—"}
                          isDark={isDark}
                        />
                      </>
                    )}

                    {detailTab === "track" && (
                      <div className="space-y-3 py-3">
                        <div
                          className={`rounded-xl border p-3 ${
                            isDark
                              ? "border-cyan-300/20 bg-cyan-300/[0.06]"
                              : "border-cyan-200 bg-cyan-50"
                          }`}
                        >
                          <p className={`text-[11px] font-semibold ${isDark ? "text-cyan-100" : "text-cyan-800"}`}>
                            Live track ready
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {selectedVehicle.speedKmph ?? 0} kmph · ignition{" "}
                            {selectedVehicle.ignition ? "on" : "off"}
                          </p>
                        </div>
                      </div>
                    )}

                    {detailTab === "history" && (
                      <div className="space-y-2 py-3 text-[11px] text-slate-400">
                        <p>Recent stop: {selectedVehicle.since}</p>
                        <p>Last update: {selectedVehicle.updatedAt}</p>
                        <p>Today distance: {selectedVehicle.todayDistanceKm ?? 0} km</p>
                      </div>
                    )}

                    {detailTab === "more" && (
                      <div className="space-y-1 py-1">
                        <DetailRow label="Branch" value={selectedVehicle.branch || "—"} isDark={isDark} />
                        <DetailRow label="Alias" value={selectedVehicle.alias || "—"} isDark={isDark} />
                        <DetailRow label="GSM" value={String(selectedVehicle.gsm ?? "—")} isDark={isDark} />
                        <DetailRow label="GPS" value={selectedVehicle.gps || "—"} isDark={isDark} />
                        <DetailRow label="Battery" value={String(selectedVehicle.btr ?? "—")} isDark={isDark} />
                        <DetailRow
                          label="AC"
                          value={selectedVehicle.ac ? "On" : "Off"}
                          isDark={isDark}
                        />
                      </div>
                    )}

                    <div
                      className={`mb-3 mt-2 rounded-xl border p-3 ${
                        isDark
                          ? "border-white/[0.08] bg-white/[0.03]"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Route className="h-3.5 w-3.5 text-violet-300" />
                        <p
                          className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${
                            isDark ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          Current trip
                        </p>
                      </div>
                      <div className="relative space-y-4 pl-5">
                        <span className="absolute bottom-1 left-[7px] top-1 w-px bg-gradient-to-b from-rose-400 via-slate-500 to-emerald-400" />
                        <div className="relative">
                          <span className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full bg-rose-400 ring-4 ring-rose-400/20" />
                          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                            Source
                          </p>
                          <p className={`mt-0.5 text-[11px] ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                            {selectedVehicle.tripSource || "—"}
                          </p>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                            Destination
                          </p>
                          <p className={`mt-0.5 text-[11px] ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                            {selectedVehicle.tripDestination || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!selectedVehicle && (
                <div
                  className={`pointer-events-none absolute bottom-4 left-1/2 z-[520] -translate-x-1/2 rounded-full border px-3 py-1.5 text-[10px] shadow-lg backdrop-blur-md ${
                    isDark
                      ? "border-white/15 bg-[#07142f]/85 text-slate-300"
                      : "border-slate-200 bg-white/90 text-slate-600"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-cyan-300" />
                    Select a unit to zoom and inspect telemetry
                  </span>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
