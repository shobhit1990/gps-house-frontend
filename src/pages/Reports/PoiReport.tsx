import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useCloseDetailsOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
	Activity,
	ArrowDownUp,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Columns3,
	RefreshCw,
	Search,
	X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { VehicleMultiSelect } from "@/components/Reports/VehicleMultiSelect";
import { useAuth } from "@/contexts/AuthContext";
import type { PoiReportRow } from "@/interfaces/PoiReport";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useGetGeofencesQuery } from "@/store/services/api/Geofence";
import { useGetGroupsQuery } from "@/store/services/api/Group";
import {
	useGetTransporterMasterQuery,
	useGetVehicleMasterQuery,
} from "@/store/services/api/Master";
import { useLazyGetPoiReportQuery } from "@/store/services/api/PoiReport";

type ColumnKey = "sn" | "vehicle" | "visits" | "stop";

type MenuKind = "transporter" | "group";

const reportTypes = ["Vehicle Wise", "Geofence Wise"] as const;

/** Filter Type options that unlock after a Report Type is chosen (image cascade). */
const filterTypesByReport: Record<string, string[]> = {
	"Vehicle Wise": ["Transporter", "Group"],
	"Geofence Wise": ["GeoFence"],
};

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "vehicle", label: "Vehicle" },
	{ key: "visits", label: "No. of visits" },
	{ key: "stop", label: "Stop" },
];

/** Parse duration strings like `2H 15M` / `45M` into minutes for summary totals. */
const durationToMinutes = (value: string) => {
	const raw = value.trim();
	if (!raw || raw === "—") return 0;
	const hourMatch = raw.match(/(\d+)\s*H/i);
	const minMatch = raw.match(/(\d+)\s*M/i);
	if (hourMatch || minMatch) {
		return (hourMatch ? Number(hourMatch[1]) * 60 : 0) + (minMatch ? Number(minMatch[1]) : 0);
	}
	const asNum = Number(raw);
	return Number.isFinite(asNum) ? asNum : 0;
};

const formatMinutes = (totalMinutes: number) => {
	if (totalMinutes <= 0) return "—";
	const h = Math.floor(totalMinutes / 60);
	const m = Math.round(totalMinutes % 60);
	if (h > 0 && m > 0) return `${h}H ${m}M`;
	if (h > 0) return `${h}H`;
	return `${m}M`;
};

/**
 * Image columns: SN | Vehicle | No. of visits | Stop.
 * Vehicle Wise → one row per vehicle (visits counted, stop = halt duration).
 */
const toSummaryRows = (rows: PoiReportRow[]): PoiReportRow[] => {
	const byVehicle = new Map<string, { row: PoiReportRow; stopMinutes: number }>();
	for (const row of rows) {
		const key = row.vehicle.trim() || row.id;
		const addMinutes =
			durationToMinutes(row.duration) ||
			durationToMinutes(row.stop) ||
			0;
		const existing = byVehicle.get(key);
		if (!existing) {
			byVehicle.set(key, {
				row: {
					...row,
					id: key,
					externalId: key,
					visits: Math.max(1, Number(row.visits) || 1),
					stop: row.stop,
				},
				stopMinutes: addMinutes,
			});
			continue;
		}
		existing.row.visits += Math.max(1, Number(row.visits) || 1);
		existing.stopMinutes += addMinutes;
	}
	return Array.from(byVehicle.values()).map(({ row, stopMinutes }, index) => ({
		...row,
		sn: index + 1,
		stop: formatMinutes(stopMinutes) !== "—" ? formatMinutes(stopMinutes) : row.stop || "—",
	}));
};

const pad = (value: number) => String(value).padStart(2, "0");

const toInput = (date: Date, end: boolean) => {
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	return `${day}T${end ? "23:59" : "00:00"}`;
};

const todayRange = () => {
	const now = new Date();
	return { from: toInput(now, false), to: toInput(now, true) };
};

/** datetime-local → API `YYYY-MM-DDTHH:mm:ss` */
const toApiDateTime = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) return "";
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) return trimmed.slice(0, 19);
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
	return trimmed;
};

const textValue = (value: string) => (value.trim() ? value : "—");

const optionLabel = (id: string, options: { id: string; name: string }[]) => {
	const match = options.find((option) => option.id === id)?.name;
	return typeof match === "string" && match.trim() ? match : typeof id === "string" ? id : "";
};

export default function PoiReport() {
	const { data: transporterMaster = [], isLoading: transportersLoading } = useGetTransporterMasterQuery();
	const { data: vehicleMaster = [], isLoading: vehiclesLoading } = useGetVehicleMasterQuery();
	const { data: groups = [], isLoading: groupsLoading } = useGetGroupsQuery();
	const { data: geofences = [], isLoading: geofencesLoading } = useGetGeofencesQuery();
	const [fetchPoiReport, { isFetching }] = useLazyGetPoiReportQuery();
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const initialRange = todayRange();

	const transporterRef = useRef<HTMLDivElement>(null);
	const groupRef = useRef<HTMLDivElement>(null);
	const columnVisibilityRef = useRef<HTMLDetailsElement>(null);
	useCloseDetailsOnOutsideClick(columnVisibilityRef);

	const [rows, setRows] = useState<PoiReportRow[]>([]);
	const [searched, setSearched] = useState(false);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [reportType, setReportType] = useState("");
	const [filterType, setFilterType] = useState("");
	const [transporter, setTransporter] = useState("");
	const [group, setGroup] = useState("");
	const [vehicles, setVehicles] = useState<string[]>([]);
	const [selectedGeofences, setSelectedGeofences] = useState<string[]>([]);
	const [from, setFrom] = useState(initialRange.from);
	const [to, setTo] = useState(initialRange.to);
	const [openMenu, setOpenMenu] = useState<MenuKind | null>(null);
	const [transporterQuery, setTransporterQuery] = useState("");
	const [groupQuery, setGroupQuery] = useState("");

	/** After Report Type is selected, Filter Type options are set for that report. */
	const filterTypeOptions = reportType ? (filterTypesByReport[reportType] ?? []) : [];
	const showFilter = filterTypeOptions.length > 0;
	const showTransporter = filterType === "Transporter";
	const showGroup = filterType === "Group";
	const showGeofenceSelect = filterType === "GeoFence";
	const showAssignments = showTransporter || showGroup;

	const groupOptions = useMemo(
		() =>
			groups
				.map((item) => ({
					id: item.externalId || String(item.id ?? ""),
					name: item.groupName?.trim() || item.externalId || String(item.id ?? ""),
				}))
				.filter((item) => item.id && item.name),
		[groups],
	);

	const geofenceOptions = useMemo(
		() =>
			geofences
				.map((item) => ({
					id: item.externalId || String(item.id ?? ""),
					name: item.name?.trim() || item.geofenceCode?.trim() || item.externalId || String(item.id ?? ""),
				}))
				.filter((item) => item.id && item.name),
		[geofences],
	);

	const vehicleOptions = useMemo(() => {
		if (showTransporter) {
			if (!transporter) return [];
			return vehicleMaster.filter((item) => !item.transporterId || item.transporterId === transporter);
		}
		if (showGroup) {
			if (!group) return [];
			const selected = groups.find((item) => (item.externalId || String(item.id ?? "")) === group);
			const allowed = new Set((selected?.vehicles ?? []).map(String));
			if (allowed.size === 0) return vehicleMaster;
			return vehicleMaster.filter((item) => allowed.has(item.id) || allowed.has(String(item.externalId ?? "")));
		}
		return [];
	}, [groups, group, showGroup, showTransporter, transporter, vehicleMaster]);

	useEffect(() => {
		if (vehicles.length === 0) return;
		const allowed = new Set(vehicleOptions.map((option) => option.id));
		const next = vehicles.filter((id) => allowed.has(id));
		if (next.length !== vehicles.length) setVehicles(next);
	}, [vehicleOptions, vehicles]);

	useEffect(() => {
		if (selectedGeofences.length === 0) return;
		const allowed = new Set(geofenceOptions.map((option) => option.id));
		const next = selectedGeofences.filter((id) => allowed.has(id));
		if (next.length !== selectedGeofences.length) setSelectedGeofences(next);
	}, [geofenceOptions, selectedGeofences]);

	useEffect(() => {
		if (!openMenu) return;
		const onPointer = (event: MouseEvent) => {
			const target = event.target as Node;
			const menuRef = openMenu === "transporter" ? transporterRef : groupRef;
			if (!menuRef.current?.contains(target)) setOpenMenu(null);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpenMenu(null);
		};
		document.addEventListener("mousedown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [openMenu]);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		if (!searched) return [];
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) =>
			[row.vehicle, String(row.visits), row.stop].join(" ").toLowerCase().includes(query),
		);
	}, [rows, search, searched]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const visibleTransporters = transporterMaster.filter((option) =>
		option.name.toLowerCase().includes(transporterQuery.trim().toLowerCase()),
	);
	const visibleGroups = groupOptions.filter((option) =>
		option.name.toLowerCase().includes(groupQuery.trim().toLowerCase()),
	);

	const chooseReport = (value: string) => {
		setReportType(value);
		/** Reset next selects — Filter Type options re-set from the chosen report type. */
		setFilterType("");
		setTransporter("");
		setGroup("");
		setVehicles([]);
		setSelectedGeofences([]);
		setTransporterQuery("");
		setGroupQuery("");
		setOpenMenu(null);
	};

	const chooseFilter = (value: string) => {
		setFilterType(value);
		/** Whichever filter column is chosen unlocks that select next. */
		setTransporter("");
		setGroup("");
		setVehicles([]);
		setSelectedGeofences([]);
		setTransporterQuery("");
		setGroupQuery("");
		setOpenMenu(null);
	};

	const applyFilters = async () => {
		if (!reportType) {
			toast.error("Select report type.");
			return;
		}
		if (!filterType) {
			toast.error("Select filter type.");
			return;
		}
		if (filterType === "Transporter" && !transporter) {
			toast.error("Select transporter.");
			return;
		}
		if (filterType === "Group" && !group) {
			toast.error("Select group.");
			return;
		}
		if (showGeofenceSelect && selectedGeofences.length === 0) {
			toast.error("Select at least one geofence.");
			return;
		}
		if (showAssignments && vehicles.length === 0) {
			toast.error("Select at least one vehicle.");
			return;
		}
		if (!from || !to) {
			toast.error("Select from and to date.");
			return;
		}

		const apiFrom = toApiDateTime(from);
		const apiTo = toApiDateTime(to);
		if (!apiFrom || !apiTo) {
			toast.error("Invalid date range.");
			return;
		}

		const vehicleParam = vehicles.join(",");
		const geofenceParam = selectedGeofences.join(",");

		try {
			const data = await fetchPoiReport({
				type: reportType,
				filterType,
				...(filterType === "Transporter" ? { transporter } : {}),
				...(filterType === "Group" ? { group } : {}),
				...(showAssignments ? { vehicle: vehicleParam } : {}),
				...(showGeofenceSelect ? { geofence: geofenceParam } : {}),
				from: apiFrom,
				to: apiTo,
			}).unwrap();

			const vehicleName = vehicleOptions.find((option) => option.id === vehicles[0])?.name ?? "";
			const rowKey = showGeofenceSelect ? geofenceParam : vehicleParam;
			const nextRows = toSummaryRows(
				data.map((row, index) => ({
					...row,
					id: row.id || `${rowKey}-${index}`,
					vehicle: row.vehicle && row.vehicle !== "—" ? row.vehicle : vehicleName || row.vehicle,
					reportType: row.reportType && row.reportType !== "—" ? row.reportType : reportType,
				})),
			);
			setRows(nextRows);
			setSearched(true);
			setPage(0);
			setOpenMenu(null);
			if (nextRows.length === 0) {
				toast.message("No POI records for this range.");
			} else {
				toast.success("POI report loaded");
			}
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not load POI report."));
		}
	};

	const refresh = () => {
		const range = todayRange();
		setRows([]);
		setSearched(false);
		setSearch("");
		setReportType("");
		setFilterType("");
		setTransporter("");
		setGroup("");
		setVehicles([]);
		setSelectedGeofences([]);
		setFrom(range.from);
		setTo(range.to);
		setTransporterQuery("");
		setGroupQuery("");
		setHiddenColumns([]);
		setPage(0);
		setPageSize(10);
		setOpenMenu(null);
	};

	const menuClass = `absolute left-0 top-12 z-40 w-full min-w-[200px] overflow-hidden rounded-xl border shadow-[0_12px_28px_rgba(15,23,42,0.12)] ${isDark ? "border-slate-600/40 bg-[#132038]" : "border-slate-200 bg-white"}`;
	const controlClass = `flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-xs outline-none transition ${isDark ? "border-slate-600/50 bg-[#15243a] text-slate-200 hover:border-cyan-400/40" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400"}`;
	const optionClass = (selected: boolean) =>
		`w-full rounded-md px-2.5 py-2 text-left text-xs leading-5 transition ${selected ? (isDark ? "bg-cyan-400/15 text-cyan-100" : "bg-cyan-50 text-cyan-800") : isDark ? "text-slate-300 hover:bg-white/[0.06]" : "text-slate-700 hover:bg-slate-100"}`;

	const entitySelect = (
		kind: MenuKind,
		ref: RefObject<HTMLDivElement | null>,
		emptyLabel: string,
		value: string,
		setValue: (next: string) => void,
		options: { id: string; name: string }[],
		query: string,
		setQuery: (value: string) => void,
		loading?: boolean,
	) => (
		<div ref={ref} className="relative min-w-0 flex-1 sm:max-w-[190px]">
			<button
				type="button"
				aria-expanded={openMenu === kind}
				aria-haspopup="listbox"
				aria-label={emptyLabel}
				onClick={() => setOpenMenu((current) => (current === kind ? null : kind))}
				className={controlClass}
			>
				<span className={`truncate ${value ? "" : isDark ? "text-slate-500" : "text-slate-400"}`}>
					{value ? optionLabel(value, options) : loading ? "Loading…" : emptyLabel}
				</span>
				<ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${openMenu === kind ? "rotate-180" : ""}`} />
			</button>
			{openMenu === kind && (
				<div className={menuClass}>
					<div className="p-2">
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							aria-label={`Search ${emptyLabel}`}
							className={`h-9 w-full rounded-md border px-3 text-xs outline-none ${isDark ? "border-slate-600/50 bg-[#1a2d48] text-slate-100 focus:border-cyan-400/50" : "border-slate-200 bg-white text-slate-900 focus:border-cyan-400"}`}
						/>
					</div>
					<ul role="listbox" aria-label={emptyLabel} className="max-h-48 overflow-y-auto p-1">
						{options.map((option) => (
							<li key={option.id}>
								<button
									type="button"
									role="option"
									aria-selected={value === option.id}
									onClick={() => {
										setValue(option.id);
										setOpenMenu(null);
										setQuery("");
									}}
									className={optionClass(value === option.id)}
								>
									{typeof option.name === "string" ? option.name : String(option.name ?? "")}
								</button>
							</li>
						))}
						{options.length === 0 && (
							<li className="px-2 py-3 text-center text-[11px] text-slate-500">
								{loading ? "Loading…" : "Nothing found"}
							</li>
						)}
					</ul>
				</div>
			)}
		</div>
	);

	const cell = (key: ColumnKey, row: PoiReportRow, serial: number) => {
		if (key === "sn") return String(row.sn || serial).padStart(2, "0");
		if (key === "vehicle") {
			return (
				<span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>
					{textValue(row.vehicle)}
				</span>
			);
		}
		if (key === "visits") return String(Number(row.visits) || 0);
		return textValue(row.stop);
	};

	return (
		<div className={`relative min-h-screen overflow-hidden font-sans ${isDark ? "bg-[#0c1424] text-slate-100" : "bg-[#f5f8ff] text-slate-900"}`}>
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-cyan-400/[0.08] blur-[160px]" />
				<div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-sky-400/[0.07] blur-[170px]" />
			</div>
			<Sidebar onLogout={logout} />

			<main className="relative mx-auto max-w-[1900px] px-4 pb-8 pt-6 sm:px-6 lg:px-7 lg:pt-7">
				<section className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						<p className={`mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-300/80" : "text-cyan-700"}`}>
							<Activity className="h-3.5 w-3.5" /> Reports
						</p>
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-slate-50" : "text-slate-900"}`}>
							POI Report
						</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							{searched ? filteredRows.length : 0} reports
						</p>
					</div>
					<button
						type="button"
						onClick={refresh}
						aria-label="Refresh POI report"
						title="Refresh POI report"
						className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-slate-600/50 bg-[#15243a] text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section
					aria-label="POI report filters"
					className={`mb-4 rounded-xl border p-3 shadow-[0_12px_36px_rgba(15,23,42,0.08)] sm:p-4 ${isDark ? "border-slate-600/40 bg-[#15243a]/95" : "border-slate-200 bg-white/95"}`}
				>
					<div className="flex flex-col gap-2 xl:flex-row xl:items-center">
						{/* Report Type — selected value stays set in this select (image: "Vehicle Wise") */}
						<label className="relative block min-w-0 flex-1 sm:max-w-[200px]">
							<span className="sr-only">Report Type</span>
							<select
								aria-label="Select Report Type"
								value={reportType}
								onChange={(event) => chooseReport(event.target.value)}
								className={`h-10 w-full appearance-none rounded-lg border px-3 pr-9 text-xs outline-none transition ${
									isDark
										? "border-slate-600/50 bg-[#1a2d48] text-slate-200 focus:border-cyan-400/50 [color-scheme:dark]"
										: "border-slate-200 bg-white text-slate-800 focus:border-cyan-400"
								} ${reportType ? "" : isDark ? "text-slate-400" : "text-slate-400"}`}
							>
								<option value="">Select Report Type</option>
								{reportTypes.map((item) => (
									<option key={item} value={item}>
										{item}
									</option>
								))}
							</select>
							<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
						</label>

						{/* Filter Type — options set from chosen Report Type (image: "Select Filter Type") */}
						{showFilter && (
							<label className="relative block min-w-0 flex-1 sm:max-w-[200px]">
								<span className="sr-only">Filter Type</span>
								<select
									aria-label="Select Filter Type"
									value={filterType}
									onChange={(event) => chooseFilter(event.target.value)}
									className={`h-10 w-full appearance-none rounded-lg border px-3 pr-9 text-xs outline-none transition ${
										isDark
											? "border-slate-600/50 bg-[#1a2d48] text-slate-200 focus:border-cyan-400/50 [color-scheme:dark]"
											: "border-slate-200 bg-white text-slate-800 focus:border-cyan-400"
									} ${filterType ? "" : isDark ? "text-slate-400" : "text-slate-400"}`}
								>
									<option value="">Select Filter Type</option>
									{filterTypeOptions.map((item) => (
										<option key={item} value={item}>
											{item}
										</option>
									))}
								</select>
								<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</label>
						)}

						{/* Next select matches Filter Type column: Transporter or Group */}
						{showTransporter &&
							entitySelect(
								"transporter",
								transporterRef,
								"Select Transporter",
								transporter,
								(next) => {
									setTransporter(next);
									setVehicles([]);
								},
								visibleTransporters,
								transporterQuery,
								setTransporterQuery,
								transportersLoading,
							)}
						{showGroup &&
							entitySelect(
								"group",
								groupRef,
								"Select Group",
								group,
								(next) => {
									setGroup(next);
									setVehicles([]);
								},
								visibleGroups,
								groupQuery,
								setGroupQuery,
								groupsLoading,
							)}
						{showAssignments && (
							<VehicleMultiSelect
								id="poi-report-vehicle"
								options={vehicleOptions}
								values={vehicles}
								onValuesChange={setVehicles}
								disabled={
									vehiclesLoading ||
									(showTransporter && !transporter) ||
									(showGroup && !group)
								}
								placeholder={
									(showTransporter && !transporter) || (showGroup && !group)
										? "Select Vehicle"
										: vehiclesLoading
											? "Loading vehicles…"
											: vehicleOptions.length === 0
												? "No vehicles"
												: "Select Vehicle"
								}
								emptyText="No vehicles"
								isDark={isDark}
								compact
							/>
						)}

						{/* Geofence Wise → GeoFence → multi-select with search + Select/Deselect All */}
						{showGeofenceSelect && (
							<VehicleMultiSelect
								id="poi-report-geofence"
								options={geofenceOptions}
								values={selectedGeofences}
								onValuesChange={setSelectedGeofences}
								disabled={geofencesLoading}
								placeholder={
									geofencesLoading
										? "Loading geofences…"
										: geofenceOptions.length === 0
											? "No geofences"
											: "Select Geofence"
								}
								emptyText="No geofences"
								entityLabel="geofences"
								searchLabel="Search geofences"
								isDark={isDark}
								compact
							/>
						)}

						<div
							className={`flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border px-2 sm:max-w-[360px] ${isDark ? "border-slate-600/50 bg-[#1a2d48]" : "border-slate-200 bg-white"}`}
						>
							<input
								type="datetime-local"
								aria-label="From date"
								value={from}
								onChange={(event) => setFrom(event.target.value)}
								className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-200 [color-scheme:dark]" : "text-slate-700"}`}
							/>
							<span className="text-slate-400">-</span>
							<input
								type="datetime-local"
								aria-label="To date"
								value={to}
								onChange={(event) => setTo(event.target.value)}
								className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-200 [color-scheme:dark]" : "text-slate-700"}`}
							/>
						</div>
						<button
							type="button"
							onClick={() => void applyFilters()}
							disabled={isFetching}
							className={`h-10 rounded-lg border px-5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "border-cyan-400/35 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
						>
							{isFetching ? (
								"Searching..."
							) : (
								<>
									<Search className="mr-1.5 inline h-3.5 w-3.5" />
									Search
								</>
							)}
						</button>
					</div>
				</section>

				<section
					className={`overflow-hidden rounded-xl border shadow-[0_12px_36px_rgba(15,23,42,0.08)] ${isDark ? "border-slate-600/40 bg-[#15243a]/95" : "border-slate-200 bg-white/95"}`}
				>
					<div
						className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-slate-600/35 bg-[#1a2d48]/60" : "border-slate-200 bg-slate-50/80"}`}
					>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search
								className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-300/70" : "text-cyan-600/70"}`}
							/>
							<input
								type="search"
								value={search}
								onChange={(event) => {
									setSearch(event.target.value);
									setPage(0);
								}}
								placeholder="Search"
								aria-label="Search POI report"
								className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-slate-600/50 bg-[#1a2d48] text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`}
							/>
							{search && (
								<button
									type="button"
									onClick={() => setSearch("")}
									aria-label="Clear search"
									className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400 hover:text-slate-100" : "text-slate-500 hover:text-slate-900"}`}
								>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<details ref={columnVisibilityRef} className="relative">
								<summary
									className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-slate-600/50 bg-[#1a2d48] text-slate-300 hover:border-cyan-400/40" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
								>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-300/80" : "text-cyan-600"}`} />
									Column Visibility
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div
									className={`absolute right-0 top-11 z-30 max-h-52 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_12px_28px_rgba(15,23,42,0.12)] ${isDark ? "border-slate-600/40 bg-[#132038]" : "border-slate-200 bg-white"}`}
								>
									{columns.map((column) => (
										<label
											key={column.key}
											className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.06]" : "text-slate-700 hover:bg-slate-100"}`}
										>
											<input
												type="checkbox"
												checked={!hiddenColumns.includes(column.key)}
												onChange={() =>
													setHiddenColumns((current) =>
														current.includes(column.key)
															? current.filter((item) => item !== column.key)
															: [...current, column.key],
													)
												}
												className="h-3.5 w-3.5 accent-cyan-300"
											/>
											{column.label}
										</label>
									))}
								</div>
							</details>
							<div className="relative">
								<select
									aria-label="No of Rows"
									value={pageSize}
									onChange={(event) => {
										setPageSize(Number(event.target.value));
										setPage(0);
									}}
									className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-slate-600/50 bg-[#1a2d48] text-slate-300 [color-scheme:dark]" : "border-slate-200 bg-white text-slate-700"}`}
								>
									<option value={10}>10 rows</option>
									<option value={25}>25 rows</option>
									<option value={50}>50 rows</option>
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px] border-collapse text-left">
							<thead>
								<tr
									className={`border-b text-[11px] font-semibold tracking-wide ${isDark ? "border-slate-600/35 bg-transparent text-slate-300" : "border-slate-200 bg-transparent text-slate-700"}`}
								>
									{visibleColumns.map((column) => (
										<th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold first:pl-5">
											<span className="inline-flex items-center gap-1.5">
												{column.label}
												<ArrowDownUp className="h-3 w-3 opacity-50" aria-hidden />
											</span>
										</th>
									))}
								</tr>
							</thead>
							<tbody className={isDark ? "bg-[#15243a]/40" : "bg-white"}>
								{isFetching && pageRows.length === 0 && (
									<tr>
										<td colSpan={Math.max(visibleColumns.length, 1)} className="px-6 py-16 text-center text-sm text-slate-500">
											Loading POI report…
										</td>
									</tr>
								)}
								{pageRows.map((row, index) => (
									<tr
										key={row.id || row.externalId || String(index)}
										className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-slate-600/30 text-slate-200 hover:bg-cyan-400/[0.06]" : "border-slate-100 text-slate-700 hover:bg-cyan-50/60"}`}
									>
										{visibleColumns.map((column) => (
											<td key={column.key} className="whitespace-nowrap px-4 py-3 first:pl-5">
												{cell(column.key, row, safePage * pageSize + index + 1)}
											</td>
										))}
									</tr>
								))}
								{!isFetching && pageRows.length === 0 && (
									<tr>
										<td
											colSpan={Math.max(visibleColumns.length, 1)}
											className="px-6 py-16 text-center text-sm font-medium text-red-500"
										>
											No data available
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer
						className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-slate-600/35 text-slate-400" : "border-slate-200 text-slate-500"}`}
					>
						<span>
							Showing{" "}
							<span className={`font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>
								{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–
								{Math.min((safePage + 1) * pageSize, filteredRows.length)}
							</span>{" "}
							of {filteredRows.length} reports
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								onClick={() => setPage((current) => Math.max(0, current - 1))}
								disabled={safePage === 0}
								aria-label="Previous page"
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-slate-600/50 text-slate-300 hover:bg-[#1a2d48]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
							>
								<ChevronLeft className="h-4 w-4" />
							</button>
							<span className={`min-w-12 text-center ${isDark ? "text-slate-200" : "text-slate-700"}`}>
								{safePage + 1} / {pageCount}
							</span>
							<button
								type="button"
								onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
								disabled={safePage >= pageCount - 1}
								aria-label="Next page"
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-slate-600/50 text-slate-300 hover:bg-[#1a2d48]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</footer>
				</section>
			</main>
		</div>
	);
}
