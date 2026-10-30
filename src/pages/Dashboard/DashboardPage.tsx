import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  Activity,
  CarFront,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  MapPin,
  Search,
  Settings2,
  Signal,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { Sidebar } from "../../components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { vehicles, type VehicleKind } from "@/components/data/vehicles";
import { VehicleMap } from "@/pages/Dashboard/VehicleMap";
import { VehicleGlyph } from "@/pages/Dashboard/VehicleGlyph";

type VehicleFilter = "all" | VehicleKind;
type TelemetryValue = string | number | boolean | undefined;

const displayTelemetry = (value: TelemetryValue) => {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "On" : "Off";
  return value;
};

const vehicleCounts = {
  car: vehicles.filter((vehicle) => vehicle.kind === "car").length,
  bike: vehicles.filter((vehicle) => vehicle.kind === "bike").length,
  mapped: vehicles.filter(
    (vehicle) => Number.isFinite(vehicle.lat) && Number.isFinite(vehicle.lng),
  ).length,
};

function Metric({
  icon: Icon,
  label,
  value,
  accent,
  isDark,
}: {
  icon: typeof CarFront;
  label: string;
  value: number;
  accent: "cyan" | "violet" | "blue";
  isDark: boolean;
}) {
  const accentClass = isDark
    ? {
        cyan: "text-cyan-200 bg-cyan-300/10 border-cyan-300/15",
        violet: "text-violet-200 bg-violet-300/10 border-violet-300/15",
        blue: "text-blue-200 bg-blue-300/10 border-blue-300/15",
      }[accent]
    : {
        cyan: "text-cyan-700 bg-cyan-100 border-cyan-200",
        violet: "text-violet-700 bg-violet-100 border-violet-200",
        blue: "text-blue-700 bg-blue-100 border-blue-200",
      }[accent];

  return (
    <div className={`group flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.12)] transition ${
      isDark
        ? "border-white/[0.08] bg-[#08142e]/70 hover:border-cyan-200/20 hover:bg-[#0a1937]/85"
        : "border-slate-200 bg-white/90 hover:border-cyan-200 hover:bg-slate-50"
    }`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accentClass}`}>
        <Icon className="h-[17px] w-[17px]" />
      </span>
      <div className="min-w-0">
        <p className={`truncate text-[10px] font-medium uppercase tracking-[0.12em] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
          {label}
        </p>
        <p className={`mt-0.5 text-xl font-semibold leading-none tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
          {String(value).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VehicleFilter>("all");
  const [selectedVehicleSn, setSelectedVehicleSn] = useState<number | null>(
    vehicles[0]?.sn ?? null,
  );

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesType = filter === "all" || vehicle.kind === filter;
      const matchesSearch =
        !query ||
        [
          vehicle.sn,
          vehicle.branch,
          vehicle.vehicle,
          vehicle.address,
          vehicle.poi,
          vehicle.updatedAt,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesType && matchesSearch;
    });
  }, [filter, search]);

  const selectedVehicle =
    filteredVehicles.find((vehicle) => vehicle.sn === selectedVehicleSn) ??
    filteredVehicles[0] ??
    null;

  const filterOptions = [
    ["all", "All", vehicles.length],
    ["car", "Four-wheelers", vehicleCounts.car],
    ["bike", "Two-wheelers", vehicleCounts.bike],
  ] as const;

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

      <main id="overview" className="mx-auto max-w-[1900px] px-4 pb-6 pt-6 sm:px-6 lg:px-7 lg:pt-7">
          <section className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-gradient-to-r from-cyan-300/[0.09] to-violet-400/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100">
                <Activity className="h-3 w-3" />
                Fleet overview
              </div>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-[#08142e]/70 px-3 py-2 text-[11px] text-slate-300 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
              <Clock3 className="h-3.5 w-3.5 text-violet-200" />
              <span>
                {new Date().toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </div>
          </section>

          <section aria-label="Fleet summary" className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Metric icon={CarFront} label="Total vehicles" value={vehicles.length} accent="cyan" isDark={isDark} />
            <Metric icon={Command} label="Four-wheelers" value={vehicleCounts.car} accent="violet" isDark={isDark} />
            <Metric icon={Users} label="Two-wheelers" value={vehicleCounts.bike} accent="blue" isDark={isDark} />
            <Metric icon={Signal} label="GPS records" value={vehicleCounts.mapped} accent="cyan" isDark={isDark} />
          </section>

          <section className={`overflow-hidden rounded-[22px] border ring-1 ring-cyan-200/[0.025] ${
            isDark
              ? "border-white/[0.10] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90 shadow-[0_24px_90px_rgba(0,0,0,0.30)]"
              : "border-slate-200 bg-white/90 shadow-[0_24px_90px_rgba(15,23,42,0.08)]"
          }`}>
            <div className={`flex flex-col gap-4 border-b p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between ${
              isDark
                ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.05]"
                : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  isDark
                    ? "border-cyan-300/15 bg-gradient-to-br from-cyan-300/10 to-violet-400/10 text-cyan-100"
                    : "border-cyan-200 bg-gradient-to-br from-cyan-100 to-violet-100 text-cyan-700"
                }`}>
                  <CarFront className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Vehicle directory</h2>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      isDark
                        ? "border-violet-300/15 bg-violet-300/[0.08] text-violet-100"
                        : "border-violet-200 bg-violet-50 text-violet-700"
                    }`}>
                      {filteredVehicles.length} vehicles
                    </span>
                  </div>
                  <p className={`mt-0.5 text-[11px] ${isDark ? "text-slate-500" : "text-slate-600"}`}>
                    Search, filter and select a vehicle on the map.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="relative block min-w-0 sm:min-w-[250px]">
                  <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/55" : "text-cyan-600/70"}`} />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search vehicle, branch, address..."
                    className={`h-10 w-full rounded-xl border pl-9 pr-9 text-xs outline-none transition ${
                      isDark
                        ? "border-white/[0.09] bg-[#03091c]/65 text-white placeholder:text-slate-600 hover:border-white/[0.14] focus:border-cyan-300/40 focus:bg-[#03091c]/85 focus:ring-2 focus:ring-cyan-300/10"
                        : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                    }`}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className={`mr-1 hidden items-center gap-1.5 text-[10px] sm:flex ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filter
                  </span>
                  {filterOptions.map(([value, label, count]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      aria-pressed={filter === value}
                      className={`rounded-lg border px-2.5 py-2 text-[10px] font-medium transition sm:px-3 ${
                        filter === value
                          ? isDark
                            ? "border-cyan-300/25 bg-gradient-to-r from-cyan-300/10 to-violet-400/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.06)]"
                            : "border-cyan-200 bg-gradient-to-r from-cyan-50 to-violet-50 text-cyan-700 shadow-[0_0_18px_rgba(34,211,238,0.04)]"
                          : isDark
                            ? "border-white/[0.07] bg-white/[0.025] text-slate-400 hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-slate-200"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                      <span className="ml-1 opacity-60">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_minmax(350px,0.62fr)]">
              <div id="fleet" className="min-w-0 border-b border-white/[0.07] xl:border-b-0 xl:border-r xl:border-white/[0.07]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1900px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/[0.07] bg-white/[0.025] text-[9px] font-semibold uppercase tracking-[0.14em] text-black-500">
                        <th className="px-4 py-3.5 font-medium sm:px-5">Vehicle</th>
                        <th className="px-3 py-3.5 font-medium">Branch</th>
                        <th className="px-3 py-3.5 font-medium">Last known location</th>
                        <th className="px-3 py-3.5 font-medium">POI</th>
                        <th className="px-4 py-3.5 font-medium">Last update</th>
                        <th className="px-3 py-3.5 font-medium">Parking</th>
                        <th className="px-3 py-3.5 font-medium">SPD (kmph)</th>
                        <th className="px-3 py-3.5 font-medium">Km Since AC</th>
                        <th className="px-3 py-3.5 font-medium">AC</th>
                        <th className="px-3 py-3.5 font-medium">BTR</th>
                        <th className="px-3 py-3.5 font-medium">GSM</th>
                        <th className="px-3 py-3.5 font-medium">GPS</th>
                        <th className="px-3 py-3.5 font-medium">Lock Status</th>
                        <th className="px-3 py-3.5 font-medium">ICCID</th>
                        <th className="px-3 py-3.5 font-medium">Driver Name</th>
                        <th className="px-3 py-3.5 font-medium">SOC (%)</th>
                        <th className="px-3 py-3.5 font-medium">Exc Power (volt)</th>
                        <th className="px-3 py-3.5 font-medium">Panic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVehicles.map((vehicle) => {
                        const isSelected = selectedVehicle?.sn === vehicle.sn;
                        const [date, time] = vehicle.updatedAt.split(" ");

                        return (
                          <tr
                            key={vehicle.sn}
                            onClick={() => setSelectedVehicleSn(vehicle.sn)}
                            aria-selected={isSelected}
                            className={`group cursor-pointer border-b border-white/[0.055] transition last:border-0 ${
                              isSelected
                                ? "bg-gradient-to-r from-cyan-300/[0.085] via-cyan-300/[0.035] to-violet-400/[0.035]"
                                : "hover:bg-white/[0.035]"
                            }`}
                          >
                            <td className={`border-l-2 px-4 py-3.5 sm:px-5 ${isSelected ? "border-cyan-300" : "border-transparent"}`}>
                              <div className="flex items-center gap-3">
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                                  isSelected
                                    ? "border-cyan-200/20 bg-cyan-200/[0.08] shadow-[0_0_20px_rgba(34,211,238,0.08)]"
                                    : "border-white/[0.07] bg-[#03091c]/65 group-hover:border-white/[0.12]"
                                }`}>
                                  <VehicleGlyph kind={vehicle.kind} color={vehicle.color} />
                                </span>
                                <div>
                                  <p className={`text-[11px] font-semibold ${isSelected ? "text-black-900" : "text-black-900"}`}>
                                    {vehicle.vehicle}
                                  </p>
                                  <p className="mt-1 text-[9px] capitalize text-black-900">
                                    {vehicle.kind === "car" ? "Four-wheeler" : "Two-wheeler"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-[11px] text-black-300">
                              {vehicle.branch || <span className="text-black-600">—</span>}
                            </td>
                            <td className="max-w-[230px] px-3 py-3.5">
                              <div className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-cyan-200/65" />
                                <span className="line-clamp-2 text-[10px] leading-[1.55] text-black-400">
                                  {vehicle.address}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-[11px] text-black-400">{vehicle.poi}</td>
                            <td className="px-4 py-3.5">
                              <p className="text-[10px] text-black-300">{date}</p>
                              <p className="mt-1 text-[9px] text-black-500">{time}</p>
                            </td>
                            <td className="px-3 py-3.5 text-[10px] text-black-300">{displayTelemetry(vehicle.parking)}</td>
                            <td className="px-3 py-3.5 text-[10px] text-black-300">{displayTelemetry(vehicle.speedKmph)}</td>
                            <td className="px-3 py-3.5 text-[10px] text-black-300">{displayTelemetry(vehicle.kmSinceAc)}</td>
                            <td className="px-3 py-3.5 text-[10px] text-black-300">{displayTelemetry(vehicle.ac)}</td>
                            <td className="px-3 py-3.5 text-[10px] text-black-300">{displayTelemetry(vehicle.btr)}</td>
                            <td className="px-3 py-3.5 text-[10px] text-black-300">{displayTelemetry(vehicle.gsm)}</td>
                            <td className="px-3 py-3.5 text-[10px] text-black-300">{displayTelemetry(vehicle.gps)}</td>
                            <td className="px-3 py-3.5 text-[10px] text-black-300">{displayTelemetry(vehicle.lockStatus)}</td>
                            <td className="px-3 py-3.5 text-[10px] text-black-300">{displayTelemetry(vehicle.iccid)}</td>
                            <td className="px-3 py-3.5 text-[10px] text-black-300">{displayTelemetry(vehicle.driverName)}</td>
                            <td className="px-3 py-3.5 text-[10px] text-black-300">{displayTelemetry(vehicle.socPercent)}</td>
                            <td className="px-3 py-3.5 text-[10px] text-black-300">{displayTelemetry(vehicle.excPowerVolt)}</td>
                            <td className="px-3 py-3.5 text-[10px] text-black-300">{displayTelemetry(vehicle.panic)}</td>
                          </tr>
                        );
                      })}
                      {filteredVehicles.length === 0 && (
                        <tr>
                          <td colSpan={18} className="px-5 py-16 text-center">
                            <Search className="mx-auto h-5 w-5 text-slate-600" />
                            <p className="mt-3 text-sm font-medium text-slate-300">No vehicles found</p>
                            <p className="mt-1 text-xs text-slate-500">Change your search or filter and try again.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-4 py-3 text-[10px] text-slate-500 sm:px-5">
                  <span>
                    Showing <span className="font-medium text-slate-300">{filteredVehicles.length}</span> of {vehicles.length}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                    Vehicle records
                  </span>
                </div>
              </div>

              <section id="map" aria-label="Vehicle map" className="min-w-0 bg-[#071229]/45">
                <div className="flex items-center justify-between border-b border-white/[0.07] bg-gradient-to-r from-violet-400/[0.06] to-transparent px-4 py-3.5 sm:px-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-cyan-200" />
                      <h2 className="text-xs font-semibold text-white">Fleet map</h2>
                      <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.08] px-2 py-0.5 text-[9px] text-cyan-100">
                        {filteredVehicles.length} locations
                      </span>
                    </div>
                    <p className="mt-1 pl-5 text-[10px] text-slate-500">Lucknow &amp; surrounding region</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Map settings"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-slate-400 transition hover:border-violet-300/20 hover:bg-violet-300/[0.08] hover:text-violet-100"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="relative h-[350px] sm:h-[420px] xl:h-[calc(100%-57px)] xl:min-h-[495px]">
                  <VehicleMap
                    vehicles={filteredVehicles}
                    selectedVehicleSn={selectedVehicle?.sn ?? null}
                    onVehicleSelect={setSelectedVehicleSn}
                  />
                  {selectedVehicle && (
                    <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[500] rounded-xl border border-white/15 bg-[#07142f]/90 p-3 shadow-[0_12px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-200/15 bg-gradient-to-br from-cyan-200/10 to-violet-300/10">
                          <VehicleGlyph kind={selectedVehicle.kind} color={selectedVehicle.color} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-white">{selectedVehicle.vehicle}</p>
                          <p className="mt-1 truncate text-[9px] text-slate-400">{selectedVehicle.address}</p>
                        </div>
                        <span className="ml-auto hidden shrink-0 rounded-full border border-cyan-200/15 bg-cyan-200/[0.07] px-2 py-1 text-[9px] font-medium text-cyan-100 sm:block">
                          Selected
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </section>

          <footer className="mt-4 flex flex-col items-center justify-between gap-2 px-1 text-[9px] text-slate-600 sm:flex-row">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70" />
              GPS Fleet Monitoring
            </span>
            <span className="flex items-center gap-1.5">
              <CircleHelp className="h-3 w-3" />
              Map tiles © OpenStreetMap
            </span>
          </footer>
      </main>
    </div>
  );
}
