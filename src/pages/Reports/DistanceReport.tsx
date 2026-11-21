import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { ReportType } from "@/enums/ReportType";
import { SortOrder } from "@/enums/SortOrder";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useLazyGetAnalyticsDashboardQuery } from "@/store/services/api/AnalyticsDashboard";
import {
	useGetClientMasterQuery,
	useGetTransporterMasterQuery,
	useGetVehicleMasterQuery,
} from "@/store/services/api/Master";

type DistanceRow = {
	id: string;
	client: string;
	transporter: string;
	vehicle: string;
	alias: string;
	byDay: Record<string, number>;
	total: number;
};

type AppliedFilters = {
	days: string[];
};

type MenuKind = "client" | "transporter" | "vehicle" | "type" | "sort";
type SortOrderValue = "" | SortOrder;

const reportTypes = Object.values(ReportType);
const sortOptions = Object.values(SortOrder);

const pad = (value: number) => String(value).padStart(2, "0");

const toInput = (date: Date, end: boolean) => {
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	return `${day}T${end ? "23:59" : "00:00"}`;
};

const todayRange = () => {
	const now = new Date();
	return { from: toInput(now, false), to: toInput(now, true) };
};

/** datetime-local (YYYY-MM-DDTHH:mm) → API format DD/MM/YYYY HH:mm */
const toApiDateTime = (value: string) => {
	const [datePart, timePart = "00:00"] = value.split("T");
	const [year, month, day] = datePart.split("-");
	if (!year || !month || !day) return value;
	return `${day}/${month}/${year} ${timePart}`;
};

const formatDay = (date: Date) => `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

const daysInRange = (from: string, to: string) => {
	const start = new Date(from);
	const end = new Date(to);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
	const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
	const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
	if (cursor > last) return [];
	const days: string[] = [];
	while (cursor <= last && days.length < 31) {
		days.push(formatDay(cursor));
		cursor.setDate(cursor.getDate() + 1);
	}
	return days;
};

const recordedKm = (distance: number | undefined) => {
	const km = Number(distance ?? 0);
	if (!Number.isFinite(km) || km <= 0) return 0;
	return Math.round(km * 10) / 10;
};

const formatKm = (value: number) => (Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10));

const selectionLabel = (selected: string[], options: { id: string; name: string }[]) =>
	selected.length === 1 ? options.find((option) => option.id === selected[0])?.name ?? selected[0] : `${selected.length} selected`;

const axisMaxFor = (max: number) => (max <= 0 ? 10 : Math.max(1, Math.ceil(max)));

const axisTicks = (max: number) => {
	if (max <= 10) return Array.from({ length: max + 1 }, (_, index) => index);
	const step = Math.ceil(max / 10);
	const ticks: number[] = [];
	for (let value = 0; value <= max; value += step) ticks.push(value);
	if (ticks[ticks.length - 1] !== max) ticks.push(max);
	return ticks;
};

function DistanceChart({ title, items }: { title: string; items: { id: string; label: string; km: number }[] }) {
	const max = Math.max(...items.map((item) => item.km), 0);
	const axisMax = axisMaxFor(max);
	const ticks = axisTicks(axisMax);

	return (
		<div className="rounded-xl bg-[#070d1c] px-4 py-6 sm:px-6">
			<p className="mb-6 text-center text-sm font-semibold tracking-wide text-white sm:text-base">{title}</p>
			{items.length === 0 ? (
				<p className="py-10 text-center text-xs text-slate-400">No bars. The chart updates when matching rows are removed or restored.</p>
			) : (
				<div className="flex gap-3">
					<div className="flex w-[124px] shrink-0 flex-col pb-10">
						{items.map((item) => (
							<div key={item.id} className="flex h-11 items-center justify-end pr-1 text-right text-[11px] leading-tight text-slate-300">
								{item.label}
							</div>
						))}
					</div>
					<div className="relative min-w-0 flex-1">
						<div className="pointer-events-none absolute inset-x-0 top-0 bottom-10">
							{ticks.map((tick) => (
								<span key={tick} className="absolute top-0 h-full w-px bg-white/15" style={{ left: `${(tick / axisMax) * 100}%` }} />
							))}
						</div>
						<div className="relative">
							{items.map((item) => {
								const width = axisMax === 0 ? 0 : (item.km / axisMax) * 100;
								return (
									<div key={item.id} className="relative flex h-11 items-center">
										<div className="relative h-7 transition-[width] duration-300" style={{ width: `${width}%` }}>
											{item.km > 0 && <div className="absolute inset-0 rounded-[2px] bg-[#b6ff2e]" />}
											{item.km > 0 && width >= 12 && <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-black">{formatKm(item.km)}</span>}
										</div>
										{(item.km <= 0 || width < 12) && <span className="pl-2 text-[12px] font-semibold text-white">{formatKm(item.km)}</span>}
									</div>
								);
							})}
						</div>
						<div className="relative mt-2 h-5">
							{ticks.map((tick) => (
								<span key={tick} className="absolute -translate-x-1/2 text-[10px] text-slate-400" style={{ left: `${(tick / axisMax) * 100}%` }}>
									{tick}
								</span>
							))}
						</div>
						<p className="mt-1 text-center text-[11px] text-slate-400">Covered</p>
					</div>
				</div>
			)}
		</div>
	);
}

export default function DistanceReport() {
	const { data: clientMaster = [] } = useGetClientMasterQuery();
	const { data: transporterMaster = [] } = useGetTransporterMasterQuery();
	const { data: vehicleMaster = [] } = useGetVehicleMasterQuery();
	const [fetchAnalytics, { isFetching }] = useLazyGetAnalyticsDashboardQuery();
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const initialRange = todayRange();
	const clientRef = useRef<HTMLDivElement>(null);
	const transporterRef = useRef<HTMLDivElement>(null);
	const vehicleRef = useRef<HTMLDivElement>(null);
	const typeRef = useRef<HTMLDivElement>(null);
	const sortRef = useRef<HTMLDivElement>(null);
	const [rows, setRows] = useState<DistanceRow[]>([]);
	const [searched, setSearched] = useState(false);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(25);
	const [page, setPage] = useState(0);
	const [selectedClients, setSelectedClients] = useState<string[]>([]);
	const [selectedTransporters, setSelectedTransporters] = useState<string[]>([]);
	const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
	const [from, setFrom] = useState(initialRange.from);
	const [to, setTo] = useState(initialRange.to);
	const [applied, setApplied] = useState<AppliedFilters>({ days: [] });
	const [reportType, setReportType] = useState<ReportType>(ReportType.VEHICLE_WISE);
	const [sortOrder, setSortOrder] = useState<SortOrderValue>("");
	const [openMenu, setOpenMenu] = useState<MenuKind | null>(null);
	const [clientQuery, setClientQuery] = useState("");
	const [transporterQuery, setTransporterQuery] = useState("");
	const [vehicleQuery, setVehicleQuery] = useState("");

	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		const matched = rows.filter((row) => {
			if (!query) return true;
			const dayText = applied.days.map((day) => formatKm(row.byDay[day] ?? 0)).join(" ");
			return [row.vehicle, row.alias, dayText, formatKm(row.total)].join(" ").toLowerCase().includes(query);
		});
		if (!sortOrder) return matched;
		const direction = sortOrder === SortOrder.ASCENDING ? 1 : -1;
		return [...matched].sort((left, right) => (left.total - right.total) * direction || left.vehicle.localeCompare(right.vehicle));
	}, [applied.days, rows, search, sortOrder]);

	const chartItems = useMemo(() => {
		const items = reportType === ReportType.DAY_WISE
			? applied.days.map((day) => ({ id: day, label: day, km: filteredRows.reduce((sum, row) => sum + (row.byDay[day] ?? 0), 0) }))
			: filteredRows.map((row) => ({ id: row.id, label: row.vehicle, km: row.total }));
		if (!sortOrder || reportType !== ReportType.DAY_WISE) return items;
		const direction = sortOrder === SortOrder.ASCENDING ? 1 : -1;
		return [...items].sort((left, right) => (left.km - right.km) * direction || left.label.localeCompare(right.label));
	}, [applied.days, filteredRows, reportType, sortOrder]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);
	const dayTotals = applied.days.map((day) => filteredRows.reduce((sum, row) => sum + (row.byDay[day] ?? 0), 0));
	const grandTotal = filteredRows.reduce((sum, row) => sum + row.total, 0);
	const visibleClients = clientMaster.filter((option) => option.name.toLowerCase().includes(clientQuery.trim().toLowerCase()));
	const visibleTransporters = transporterMaster.filter((option) => option.name.toLowerCase().includes(transporterQuery.trim().toLowerCase()));
	const visibleVehicles = vehicleMaster.filter((option) => option.name.toLowerCase().includes(vehicleQuery.trim().toLowerCase()));
	const hasResult = searched && rows.length > 0;
	const chartTitle = reportType === ReportType.DAY_WISE ? "Total Distance Covered By Each Day In KM" : "Total Distance Covered By Each Vehicle In KM";

	useEffect(() => {
		if (!openMenu) return;
		const onPointer = (event: MouseEvent) => {
			const target = event.target as Node;
			const menuRef = openMenu === "client" ? clientRef : openMenu === "transporter" ? transporterRef : openMenu === "vehicle" ? vehicleRef : openMenu === "type" ? typeRef : sortRef;
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

	const toggleValue = (value: string, selected: string[], setSelected: (next: string[]) => void) => {
		setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
	};

	const applyFilters = async () => {
		if (selectedClients.length !== 1 || selectedTransporters.length !== 1 || selectedVehicles.length === 0) {
			toast.error("Select one client, one transporter, and at least one vehicle.");
			return;
		}
		if (!from || !to) {
			toast.error("Select from and to date.");
			return;
		}

		const days = daysInRange(from, to);
		if (days.length === 0) {
			toast.error("Invalid date range.");
			return;
		}

		const client = selectedClients[0];
		const transporter = selectedTransporters[0];
		const apiFrom = toApiDateTime(from);
		const apiTo = toApiDateTime(to);
		const clientName = clientMaster.find((option) => option.id === client)?.name ?? "";
		const transporterName = transporterMaster.find((option) => option.id === transporter)?.name ?? "";
		const vehicleNameById = new Map(vehicleMaster.map((option) => [option.id, option.name]));

		try {
			const batches = await Promise.all(
				selectedVehicles.map(async (vehicle) => {
					const result = await fetchAnalytics({
						client,
						transporter,
						vehicle,
						from: apiFrom,
						to: apiTo,
					}).unwrap();
					const vehicleName = vehicleNameById.get(vehicle) ?? vehicle;
					const byDay = Object.fromEntries(days.map((day) => [day, 0]));
					for (const point of result.chartData) {
						const key = point.dayKey && days.includes(point.dayKey) ? point.dayKey : undefined;
						if (key) byDay[key] = recordedKm(point.mileage);
					}
					const totalFromDays = days.reduce((sum, day) => sum + (byDay[day] ?? 0), 0);
					return {
						id: vehicle,
						client: clientName,
						transporter: transporterName,
						vehicle: vehicleName,
						alias: "—",
						byDay,
						total: recordedKm(result.totalDistanceKm) || totalFromDays,
					} satisfies DistanceRow;
				}),
			);
			setRows(batches);
			setApplied({ days });
			setSearched(true);
			setOpenMenu(null);
			setPage(0);
			if (batches.every((row) => row.total <= 0 && Object.values(row.byDay).every((km) => km <= 0))) {
				toast.message("No distance data for this range.");
			} else {
				toast.success("Distance report loaded");
			}
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not load distance report."));
		}
	};

	const refresh = () => {
		const range = todayRange();
		setRows([]);
		setSearched(false);
		setSearch("");
		setSelectedClients([]);
		setSelectedTransporters([]);
		setSelectedVehicles([]);
		setFrom(range.from);
		setTo(range.to);
		setApplied({ days: [] });
		setReportType(ReportType.VEHICLE_WISE);
		setSortOrder("");
		setClientQuery("");
		setTransporterQuery("");
		setVehicleQuery("");
		setOpenMenu(null);
		setPage(0);
		setPageSize(25);
	};

	const menuClass = `absolute left-0 top-12 z-40 w-full min-w-[200px] overflow-hidden rounded-xl border shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`;
	const controlClass = `flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400"}`;

	const multiSelect = (
		kind: MenuKind,
		ref: RefObject<HTMLDivElement | null>,
		emptyLabel: string,
		selected: string[],
		setSelected: (next: string[]) => void,
		options: { id: string; name: string }[],
		query: string,
		setQuery: (value: string) => void,
	) => (
		<div ref={ref} className="relative min-w-0 flex-1 sm:max-w-[180px]">
			<button type="button" aria-expanded={openMenu === kind} aria-haspopup="listbox" aria-label={emptyLabel} onClick={() => setOpenMenu((current) => (current === kind ? null : kind))} className={controlClass}>
				<span className={`truncate ${selected.length === 0 ? (isDark ? "text-slate-500" : "text-slate-400") : ""}`}>{selected.length === 0 ? emptyLabel : selectionLabel(selected, options)}</span>
				<ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${openMenu === kind ? "rotate-180" : ""}`} />
			</button>
			{openMenu === kind && (
				<div className={menuClass}>
					<div className="p-2">
						<input value={query} onChange={(event) => setQuery(event.target.value)} aria-label={`Search ${emptyLabel}`} className={`h-9 w-full rounded-md border px-3 text-xs outline-none ${isDark ? "border-white/[0.10] bg-[#03091c]/70 text-white focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-900 focus:border-cyan-400"}`} />
					</div>
					<div className={`grid grid-cols-2 border-y text-[11px] ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
						<button type="button" onClick={() => setSelected([...new Set([...selected, ...options.map((option) => option.id)])])} className={`h-9 border-r font-medium transition ${isDark ? "border-white/[0.08] text-slate-300 hover:bg-cyan-300/[0.08] hover:text-cyan-100" : "border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800"}`}>
							Select All
						</button>
						<button type="button" onClick={() => setSelected([])} className={`h-9 font-medium transition ${isDark ? "text-slate-300 hover:bg-white/[0.04] hover:text-white" : "text-slate-700 hover:bg-slate-50"}`}>
							Deselect All
						</button>
					</div>
					<ul role="listbox" aria-label={emptyLabel} aria-multiselectable="true" className="max-h-48 overflow-y-auto p-1">
						{options.map((option) => (
							<li key={option.id}>
								<label className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
									<input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggleValue(option.id, selected, setSelected)} className="h-3.5 w-3.5 accent-cyan-300" />
									{option.name}
								</label>
							</li>
						))}
						{options.length === 0 && <li className="px-2 py-3 text-center text-[11px] text-slate-500">Nothing found</li>}
					</ul>
				</div>
			)}
		</div>
	);

	const choiceSelect = (kind: "type" | "sort", ref: RefObject<HTMLDivElement | null>, label: string, value: string, placeholder: string, options: string[], onChoose: (next: string) => void) => (
		<div ref={ref} className="relative min-w-0 flex-1">
			<p className={`mb-1.5 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
			<button type="button" aria-expanded={openMenu === kind} aria-haspopup="listbox" aria-label={label} onClick={() => setOpenMenu((current) => (current === kind ? null : kind))} className={controlClass}>
				<span className={`truncate ${value ? "" : isDark ? "text-slate-500" : "text-slate-400"}`}>{value || placeholder}</span>
				<ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${openMenu === kind ? "rotate-180" : ""}`} />
			</button>
			{openMenu === kind && (
				<ul role="listbox" aria-label={label} className={`${menuClass} max-h-52 overflow-y-auto p-1`}>
					{options.map((name) => (
						<li key={name}>
							<button type="button" role="option" aria-selected={value === name} onClick={() => { onChoose(name); setOpenMenu(null); }} className={`w-full rounded-md px-2.5 py-2 text-left text-xs ${value === name ? (isDark ? "bg-cyan-300/[0.16] text-cyan-50" : "bg-cyan-50 text-cyan-800") : isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
								{name}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);

	return (
		<div className={`relative min-h-screen overflow-hidden font-sans ${isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"}`}>
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.12] blur-[160px]" />
				<div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.08] blur-[170px]" />
			</div>
			<Sidebar onLogout={logout} />

			<main className="relative mx-auto max-w-[1900px] px-4 pb-8 pt-6 sm:px-6 lg:px-7 lg:pt-7">
				<section className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						<p className={`mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>
							<Activity className="h-3.5 w-3.5" /> Reports
						</p>
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Distance Report</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{hasResult ? filteredRows.length : 0} reports</p>
					</div>
					<button type="button" onClick={refresh} aria-label="Refresh distance report" title="Refresh distance report" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section className={`mb-4 rounded-xl border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-4 ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}>
					<div className="flex flex-col gap-2 xl:flex-row xl:items-center">
						{multiSelect("client", clientRef, "Select Client", selectedClients, setSelectedClients, visibleClients, clientQuery, setClientQuery)}
						{multiSelect("transporter", transporterRef, "Select Transporter", selectedTransporters, setSelectedTransporters, visibleTransporters, transporterQuery, setTransporterQuery)}
						{multiSelect("vehicle", vehicleRef, "Select Vehicle", selectedVehicles, setSelectedVehicles, visibleVehicles, vehicleQuery, setVehicleQuery)}
						<div className={`flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border px-2 sm:max-w-[360px] ${isDark ? "border-white/[0.08] bg-[#03091c]/65" : "border-slate-200 bg-white"}`}>
							<input type="datetime-local" aria-label="From date" value={from} onChange={(event) => setFrom(event.target.value)} className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
							<span className="text-slate-500">-</span>
							<input type="datetime-local" aria-label="To date" value={to} onChange={(event) => setTo(event.target.value)} className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
						</div>
						<button type="button" onClick={() => void applyFilters()} disabled={isFetching} className={`h-10 rounded-lg border px-5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
							{isFetching ? "Searching..." : "Search"}
						</button>
					</div>
				</section>

				{hasResult && (
					<section className={`mb-4 rounded-xl border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-4 ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}>
						<div className="grid gap-3 sm:grid-cols-2">
							{choiceSelect("type", typeRef, "Select Type", reportType, "Select Type", reportTypes, (next) => setReportType(next as ReportType))}
							{choiceSelect("sort", sortRef, "Sort By", sortOrder, "Select Sorting", sortOptions, (next) => { setSortOrder(next as SortOrder); setPage(0); })}
						</div>
					</section>
				)}

				{hasResult && (
					<section className={`mb-4 overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09]" : "border-slate-200"}`} aria-label={chartTitle}>
						<DistanceChart title={chartTitle} items={chartItems} />
					</section>
				)}

				{hasResult && (
					<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
						<div className={`flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${isDark ? "border-white/[0.07]" : "border-slate-200"}`}>
							<label className="relative block min-w-0 sm:w-[280px]">
								<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
								<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search" aria-label="Search distance report" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
								{search && (
									<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
										<X className="h-3.5 w-3.5" />
									</button>
								)}
							</label>
							<label className={`flex items-center gap-2 text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
								Show
								<span className="relative">
									<select aria-label="Show rows" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 [color-scheme:dark]" : "border-slate-200 bg-white text-slate-700"}`}>
										<option value={10}>10</option>
										<option value={25}>25</option>
										<option value={50}>50</option>
									</select>
									<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								</span>
							</label>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full min-w-[720px] border-collapse text-left">
								<thead>
									<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
										<th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">Vehicle</th>
										<th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">Vehicle Alias</th>
										{applied.days.map((day) => <th key={day} scope="col" className="whitespace-nowrap px-3 py-3 font-medium">{day}</th>)}
										<th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">TotalDistance</th>
									</tr>
								</thead>
								<tbody>
									{pageRows.map((row) => (
										<tr key={row.id} className={`border-b text-[11px] transition ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
											<td className={`whitespace-nowrap px-4 py-3 font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{row.vehicle}</td>
											<td className="whitespace-nowrap px-3 py-3">{row.alias}</td>
											{applied.days.map((day) => <td key={day} className="whitespace-nowrap px-3 py-3">{formatKm(row.byDay[day] ?? 0)}</td>)}
											<td className="whitespace-nowrap px-3 py-3">{formatKm(row.total)}</td>
										</tr>
									))}
									{pageRows.length > 0 && (
										<tr className={`text-[11px] font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
											<td className="whitespace-nowrap px-4 py-3">Total</td>
											<td className="px-3 py-3" />
											{dayTotals.map((total, index) => <td key={applied.days[index]} className="whitespace-nowrap px-3 py-3">{formatKm(total)}</td>)}
											<td className="whitespace-nowrap px-3 py-3">{formatKm(grandTotal)}</td>
										</tr>
									)}
									{pageRows.length === 0 && (
										<tr>
											<td colSpan={3 + applied.days.length} className="px-6 py-16 text-center">
												<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No distance reports match this search</p>
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
						<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
							<span>
								Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : safePage * pageSize + 1} to {Math.min((safePage + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} entries
							</span>
							<div className="flex items-center gap-1.5">
								<button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={safePage === 0} aria-label="Previous page" className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
									<ChevronLeft className="h-4 w-4" />
								</button>
								<span className={`min-w-12 text-center ${isDark ? "text-slate-300" : "text-slate-700"}`}>{safePage + 1} / {pageCount}</span>
								<button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={safePage >= pageCount - 1} aria-label="Next page" className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
									<ChevronRight className="h-4 w-4" />
								</button>
							</div>
						</footer>
					</section>
				)}

				{!hasResult && (
					<section className={`rounded-xl border px-6 py-16 text-center ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}>
						<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No distance reports available</p>
						<p className="mt-1 text-xs text-slate-500">Select client, transporter, and vehicle, then search. The chart follows the covered kilometres.</p>
					</section>
				)}
			</main>
		</div>
	);
}
