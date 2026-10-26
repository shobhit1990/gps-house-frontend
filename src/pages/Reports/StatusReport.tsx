import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useTheme } from "next-themes";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, Fan, Gauge, Play, Power, RefreshCw, Search, Timer, WifiOff, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { vehicles } from "@/components/data/vehicles";
import { useAuth } from "@/contexts/AuthContext";

type StatusName = "Ignition On" | "Ignition Off" | "Idle" | "Overspeed" | "Ac On" | "Unreachable";

type StatusRow = {
	id: string;
	status: StatusName;
	startDateTime: string;
	startAddress: string;
	startCoordinate: string;
	endDateTime: string;
	endAddress: string;
	endCoordinate: string;
	sPoi: string;
	ePoi: string;
	maxSpeed: string;
	avgSpeed: string;
	totalDistance: number;
	durationSeconds: number;
};

type ColumnKey = "sn" | "status" | "startDateTime" | "startAddress" | "startCoordinate" | "endDateTime" | "endAddress" | "endCoordinate" | "sPoi" | "ePoi" | "maxSpeed" | "avgSpeed" | "totalDistance" | "duration" | "play";

type MenuKind = "client" | "transporter" | "vehicle" | "status";

type AppliedFilters = {
	clients: string[];
	transporters: string[];
	vehicles: string[];
	statuses: StatusName[];
	from: string;
	to: string;
};

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "status", label: "Status" },
	{ key: "startDateTime", label: "Start Date Time" },
	{ key: "startAddress", label: "Start Address" },
	{ key: "startCoordinate", label: "Start Coordinate" },
	{ key: "endDateTime", label: "End Date Time" },
	{ key: "endAddress", label: "End Address" },
	{ key: "endCoordinate", label: "End Coordinate" },
	{ key: "sPoi", label: "S_Poi" },
	{ key: "ePoi", label: "E_Poi" },
	{ key: "maxSpeed", label: "Max Speed" },
	{ key: "avgSpeed", label: "Avg. Speed" },
	{ key: "totalDistance", label: "Total Distance" },
	{ key: "duration", label: "Duration" },
	{ key: "play", label: "Play" },
];

const clients = ["gpshouse", "arun.singh", "tushar.shukla"];
const transporters = ["Aviator", "vicky.9", "vga", "rahul.sharma"];
const vehicleOptions = vehicles.map((vehicle) => vehicle.vehicle);
const statuses: StatusName[] = ["Ignition On", "Ignition Off", "Idle", "Overspeed", "Ac On", "Unreachable"];
const legendStatuses: StatusName[] = ["Ignition On", "Idle", "Overspeed", "Unreachable", "Ignition Off", "Ac On"];

const statusColor: Record<StatusName, string> = {
	"Ignition On": "#3ddc97",
	Idle: "#e6c84a",
	Overspeed: "#f08a24",
	Unreachable: "#3b82f6",
	"Ignition Off": "#ff6b6b",
	"Ac On": "#a78bfa",
};

const legendLabel: Record<StatusName, string> = {
	"Ignition On": "Ignition On",
	Idle: "Idle",
	Overspeed: "OverSpeed",
	Unreachable: "Unreachable",
	"Ignition Off": "Ignition Off",
	"Ac On": "Ac On",
};

const statusLog: StatusRow[] = [
	{
		id: "status-1",
		status: "Ignition Off",
		startDateTime: "23/10/2026 00:00",
		startAddress: "SH 34, Sarai Meer, Uttar Pradesh 276305, India",
		startCoordinate: "26.8649, 81.08636",
		endDateTime: "23/10/2026 06:12",
		endAddress: "Lucknow Outer Ring Road, Lucknow, Uttar Pradesh, 226028, India",
		endCoordinate: "26.86493, 81.08611",
		sPoi: "--",
		ePoi: "--",
		maxSpeed: "--",
		avgSpeed: "--",
		totalDistance: 0.02,
		durationSeconds: 6 * 3600 + 12 * 60 + 33,
	},
	{
		id: "status-2",
		status: "Ignition Off",
		startDateTime: "23/10/2026 06:18",
		startAddress: "Lucknow Outer Ring Road, Lucknow, Uttar Pradesh, 226028, India",
		startCoordinate: "26.86785, 81.08429",
		endDateTime: "23/10/2026 06:53",
		endAddress: "Satrikh Rd, Juggaur, Uttar Pradesh 226010, India",
		endCoordinate: "26.86926, 81.08436",
		sPoi: "--",
		ePoi: "--",
		maxSpeed: "--",
		avgSpeed: "--",
		totalDistance: 0,
		durationSeconds: 35 * 60 + 2,
	},
	{
		id: "status-3",
		status: "Ignition Off",
		startDateTime: "23/10/2026 07:20",
		startAddress: "182, Shiv Sagar Nagar, Hasangarden Colony, Kamta, Lucknow, Uttar Pradesh 226028, India",
		startCoordinate: "26.8788, 81.02478",
		endDateTime: "23/10/2026 14:49",
		endAddress: "182, Shiv Sagar Nagar, Hasangarden Colony, Kamta, Lucknow, Uttar Pradesh 226028, India",
		endCoordinate: "26.8788, 81.02478",
		sPoi: "--",
		ePoi: "--",
		maxSpeed: "--",
		avgSpeed: "--",
		totalDistance: 0,
		durationSeconds: 7 * 3600 + 29 * 60,
	},
	{
		id: "status-4",
		status: "Ignition On",
		startDateTime: "23/10/2026 08:05",
		startAddress: "Gomti Nagar, Lucknow, Uttar Pradesh 226010, India",
		startCoordinate: "26.8621, 81.0094",
		endDateTime: "23/10/2026 12:05",
		endAddress: "Hazratganj, Lucknow, Uttar Pradesh 226001, India",
		endCoordinate: "26.8501, 80.9462",
		sPoi: "Office",
		ePoi: "Market",
		maxSpeed: "62",
		avgSpeed: "41",
		totalDistance: 18.4,
		durationSeconds: 4 * 3600,
	},
	{
		id: "status-5",
		status: "Idle",
		startDateTime: "23/10/2026 12:10",
		startAddress: "Hazratganj, Lucknow, Uttar Pradesh 226001, India",
		startCoordinate: "26.8501, 80.9462",
		endDateTime: "23/10/2026 14:10",
		endAddress: "Hazratganj, Lucknow, Uttar Pradesh 226001, India",
		endCoordinate: "26.8501, 80.9462",
		sPoi: "Market",
		ePoi: "Market",
		maxSpeed: "0",
		avgSpeed: "0",
		totalDistance: 0,
		durationSeconds: 2 * 3600,
	},
	{
		id: "status-6",
		status: "Overspeed",
		startDateTime: "23/10/2026 15:02",
		startAddress: "Faizabad Road, Lucknow, Uttar Pradesh 226016, India",
		startCoordinate: "26.8744, 80.9951",
		endDateTime: "23/10/2026 16:07",
		endAddress: "Chinhat, Lucknow, Uttar Pradesh 226028, India",
		endCoordinate: "26.8782, 81.0416",
		sPoi: "--",
		ePoi: "--",
		maxSpeed: "98",
		avgSpeed: "86",
		totalDistance: 12.6,
		durationSeconds: 1 * 3600 + 5 * 60,
	},
	{
		id: "status-7",
		status: "Unreachable",
		startDateTime: "23/10/2026 16:20",
		startAddress: "Chinhat, Lucknow, Uttar Pradesh 226028, India",
		startCoordinate: "26.8782, 81.0416",
		endDateTime: "23/10/2026 19:20",
		endAddress: "Chinhat, Lucknow, Uttar Pradesh 226028, India",
		endCoordinate: "26.8782, 81.0416",
		sPoi: "--",
		ePoi: "--",
		maxSpeed: "--",
		avgSpeed: "--",
		totalDistance: 0,
		durationSeconds: 3 * 3600,
	},
	{
		id: "status-8",
		status: "Ac On",
		startDateTime: "23/10/2026 19:40",
		startAddress: "Kamta, Lucknow, Uttar Pradesh 226028, India",
		startCoordinate: "26.8894, 81.0218",
		endDateTime: "23/10/2026 21:10",
		endAddress: "Viraj Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010, India",
		endCoordinate: "26.862, 81.012",
		sPoi: "--",
		ePoi: "Home",
		maxSpeed: "48",
		avgSpeed: "32",
		totalDistance: 8.2,
		durationSeconds: 1 * 3600 + 30 * 60,
	},
];

const pad = (value: number) => String(value).padStart(2, "0");

const toInput = (date: Date, end: boolean) => {
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	return `${day}T${end ? "23:59" : "00:00"}`;
};

const todayRange = () => {
	const now = new Date();
	return { from: toInput(now, false), to: toInput(now, true) };
};

const selectionLabel = (selected: string[]) => (selected.length === 1 ? selected[0] : `${selected.length} selected`);

const parseStamp = (value: string) => {
	const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
	if (!match) return null;
	return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4]), Number(match[5]), Number(match[6] ?? 0));
};

const inRange = (stamp: string, from: string, to: string) => {
	const time = parseStamp(stamp)?.getTime();
	const start = new Date(from).getTime();
	const end = new Date(to).getTime();
	if (time == null || Number.isNaN(start) || Number.isNaN(end)) return false;
	return time >= Math.min(start, end) && time <= Math.max(start, end);
};

const formatDuration = (seconds: number) => {
	const safe = Math.max(0, Math.round(seconds));
	const hours = Math.floor(safe / 3600);
	const minutes = Math.floor((safe % 3600) / 60);
	const remain = safe % 60;
	const parts: string[] = [];
	if (hours > 0) parts.push(`${hours}H`);
	if (minutes > 0 || hours > 0) parts.push(`${minutes}M`);
	if (remain > 0 || parts.length === 0) parts.push(`${remain}S`);
	return parts.join(" ");
};

const formatDistance = (value: number) => {
	const rounded = Math.round(value * 100) / 100;
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
};

const dayOf = (stamp: string) => stamp.slice(0, 10);

function StatusMark({ status }: { status: StatusName }) {
	const color = statusColor[status];
	const Icon = status === "Idle" ? Timer : status === "Overspeed" ? Gauge : status === "Unreachable" ? WifiOff : status === "Ac On" ? Fan : Power;
	return (
		<span className="inline-flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: `${color}22`, color }} aria-label={status} title={status}>
			<Icon className="h-3.5 w-3.5" />
		</span>
	);
}

function StatusChart({ rows }: { rows: StatusRow[] }) {
	const days = [...new Set(rows.map((row) => dayOf(row.startDateTime)))];
	const bars = days.map((day) => ({
		day,
		segments: legendStatuses
			.map((status) => ({
				status,
				hours: rows.filter((row) => dayOf(row.startDateTime) === day && row.status === status).reduce((sum, row) => sum + row.durationSeconds, 0) / 3600,
			}))
			.filter((segment) => segment.hours > 0),
	}));
	const maxHours = Math.max(...bars.flatMap((bar) => [bar.segments.reduce((sum, segment) => sum + segment.hours, 0)]), 0);
	const axisMax = maxHours <= 24 ? 24 : Math.ceil(maxHours);
	const ticks = Array.from({ length: axisMax + 1 }, (_, index) => index);

	return (
		<div className="rounded-xl bg-[#070d1c] px-4 py-6 sm:px-6">
			<p className="mb-6 text-center text-sm font-semibold tracking-wide text-white sm:text-base">Status Bar Chart According to Status Type</p>
			<div className="overflow-x-auto">
				<div className="min-w-[760px]">
					<div className="flex gap-3">
						<div className="flex w-[92px] shrink-0 flex-col pb-8">
							{bars.map((bar) => (
								<div key={bar.day} className="flex h-12 items-center justify-end text-[11px] text-slate-300">{bar.day}</div>
							))}
						</div>
						<div className="relative min-w-0 flex-1">
							<div className="pointer-events-none absolute inset-x-0 top-0 bottom-8">
								{ticks.map((tick) => (
									<span key={tick} className="absolute top-0 h-full w-px bg-white/15" style={{ left: `${(tick / axisMax) * 100}%` }} />
								))}
							</div>
							<div>
								{bars.map((bar) => (
									<div key={bar.day} className="relative flex h-12 items-center">
										<div className="flex h-6 w-full overflow-hidden">
											{bar.segments.map((segment) => {
												const width = `${(segment.hours / axisMax) * 100}%`;
												return <div key={segment.status} className="h-full shrink-0 transition-[width] duration-300" style={{ width, flexBasis: width, backgroundColor: statusColor[segment.status] }} title={`${legendLabel[segment.status]} ${segment.hours.toFixed(2)} h`} />;
											})}
										</div>
									</div>
								))}
							</div>
							<div className="relative mt-2 h-4">
								{ticks.map((tick) => (
									<span key={tick} className="absolute -translate-x-1/2 text-[10px] text-slate-400" style={{ left: `${(tick / axisMax) * 100}%` }}>{tick}</span>
								))}
							</div>
						</div>
					</div>
					<p className="mt-3 text-center text-[11px] text-slate-300">Total Time Taken By Each Status Type</p>
				</div>
			</div>
			<ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
				{legendStatuses.map((status) => (
					<li key={status} className="flex items-center gap-1.5 text-[11px] text-slate-300">
						<span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor[status] }} />
						{legendLabel[status]}
					</li>
				))}
			</ul>
		</div>
	);
}

export default function StatusReport() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const initialRange = todayRange();
	const clientRef = useRef<HTMLDivElement>(null);
	const transporterRef = useRef<HTMLDivElement>(null);
	const vehicleRef = useRef<HTMLDivElement>(null);
	const statusRef = useRef<HTMLDivElement>(null);
	const [rows, setRows] = useState<StatusRow[]>([]);
	const [searched, setSearched] = useState(false);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [selectedClients, setSelectedClients] = useState<string[]>([]);
	const [selectedTransporters, setSelectedTransporters] = useState<string[]>([]);
	const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
	const [selectedStatuses, setSelectedStatuses] = useState<StatusName[]>([]);
	const [from, setFrom] = useState(initialRange.from);
	const [to, setTo] = useState(initialRange.to);
	const [applied, setApplied] = useState<AppliedFilters>({ clients: [], transporters: [], vehicles: [], statuses: [], from: initialRange.from, to: initialRange.to });
	const [openMenu, setOpenMenu] = useState<MenuKind | null>(null);
	const [clientQuery, setClientQuery] = useState("");
	const [transporterQuery, setTransporterQuery] = useState("");
	const [vehicleQuery, setVehicleQuery] = useState("");
	const [statusQuery, setStatusQuery] = useState("");
	const pageSize = 10;

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return rows.filter((row) => {
			if (applied.statuses.length > 0 && !applied.statuses.includes(row.status)) return false;
			if (!inRange(row.startDateTime, applied.from, applied.to)) return false;
			if (!query) return true;
			return [row.status, row.startDateTime, row.startAddress, row.startCoordinate, row.endDateTime, row.endAddress, row.endCoordinate, row.sPoi, row.ePoi, row.maxSpeed, row.avgSpeed, formatDistance(row.totalDistance), formatDuration(row.durationSeconds)].join(" ").toLowerCase().includes(query);
		});
	}, [applied, rows, search]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);
	const totalDistance = filteredRows.reduce((sum, row) => sum + row.totalDistance, 0);
	const totalSeconds = filteredRows.reduce((sum, row) => sum + row.durationSeconds, 0);
	const visibleClients = clients.filter((name) => name.toLowerCase().includes(clientQuery.trim().toLowerCase()));
	const visibleTransporters = transporters.filter((name) => name.toLowerCase().includes(transporterQuery.trim().toLowerCase()));
	const visibleVehicles = vehicleOptions.filter((name) => name.toLowerCase().includes(vehicleQuery.trim().toLowerCase()));
	const visibleStatuses = statuses.filter((name) => name.toLowerCase().includes(statusQuery.trim().toLowerCase()));
	const totalAnchor = visibleColumns.findIndex((column) => column.key === "totalDistance" || column.key === "duration");

	useEffect(() => {
		if (!openMenu) return;
		const onPointer = (event: MouseEvent) => {
			const target = event.target as Node;
			const menuRef = openMenu === "client" ? clientRef : openMenu === "transporter" ? transporterRef : openMenu === "vehicle" ? vehicleRef : statusRef;
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

	const toggleValue = <T extends string>(value: T, selected: T[], setSelected: (next: T[]) => void) => {
		setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
	};

	const applyFilters = () => {
		const ready = selectedClients.length > 0 && selectedTransporters.length > 0 && selectedVehicles.length > 0;
		const allowed = selectedStatuses.length > 0 ? selectedStatuses : statuses;
		const matched = ready ? statusLog.filter((row) => allowed.includes(row.status) && inRange(row.startDateTime, from, to)) : [];
		setRows(matched);
		setApplied({ clients: selectedClients, transporters: selectedTransporters, vehicles: selectedVehicles, statuses: selectedStatuses, from, to });
		setSearched(true);
		setOpenMenu(null);
		setPage(0);
	};

	const refresh = () => {
		const range = todayRange();
		setRows([]);
		setSearched(false);
		setSearch("");
		setSelectedClients([]);
		setSelectedTransporters([]);
		setSelectedVehicles([]);
		setSelectedStatuses([]);
		setFrom(range.from);
		setTo(range.to);
		setApplied({ clients: [], transporters: [], vehicles: [], statuses: [], from: range.from, to: range.to });
		setClientQuery("");
		setTransporterQuery("");
		setVehicleQuery("");
		setStatusQuery("");
		setHiddenColumns([]);
		setOpenMenu(null);
		setPage(0);
	};

	const menuClass = `absolute left-0 top-12 z-40 w-full min-w-[200px] overflow-hidden rounded-xl border shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`;
	const controlClass = `flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400"}`;

	const multiSelect = (
		kind: MenuKind,
		ref: RefObject<HTMLDivElement | null>,
		emptyLabel: string,
		selected: string[],
		setSelected: (next: string[]) => void,
		options: string[],
		query: string,
		setQuery: (value: string) => void,
	) => (
		<div ref={ref} className="relative min-w-0 flex-1 sm:max-w-[180px]">
			<button type="button" aria-expanded={openMenu === kind} aria-haspopup="listbox" aria-label={emptyLabel} onClick={() => setOpenMenu((current) => (current === kind ? null : kind))} className={controlClass}>
				<span className={`truncate ${selected.length === 0 ? (isDark ? "text-slate-500" : "text-slate-400") : ""}`}>{selected.length === 0 ? emptyLabel : selectionLabel(selected)}</span>
				<ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${openMenu === kind ? "rotate-180" : ""}`} />
			</button>
			{openMenu === kind && (
				<div className={menuClass}>
					<div className="p-2">
						<input value={query} onChange={(event) => setQuery(event.target.value)} aria-label={`Search ${emptyLabel}`} className={`h-9 w-full rounded-md border px-3 text-xs outline-none ${isDark ? "border-white/[0.10] bg-[#03091c]/70 text-white focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-900 focus:border-cyan-400"}`} />
					</div>
					<div className={`grid grid-cols-2 border-y text-[11px] ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
						<button type="button" onClick={() => setSelected([...new Set([...selected, ...options])])} className={`h-9 border-r font-medium transition ${isDark ? "border-white/[0.08] text-slate-300 hover:bg-cyan-300/[0.08] hover:text-cyan-100" : "border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800"}`}>
							Select All
						</button>
						<button type="button" onClick={() => setSelected([])} className={`h-9 font-medium transition ${isDark ? "text-slate-300 hover:bg-white/[0.04] hover:text-white" : "text-slate-700 hover:bg-slate-50"}`}>
							Deselect All
						</button>
					</div>
					<ul role="listbox" aria-label={emptyLabel} aria-multiselectable="true" className="max-h-48 overflow-y-auto p-1">
						{options.map((name) => (
							<li key={name}>
								<label className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
									<input type="checkbox" checked={selected.includes(name)} onChange={() => toggleValue(name, selected, setSelected)} className="h-3.5 w-3.5 accent-cyan-300" />
									{name}
								</label>
							</li>
						))}
						{options.length === 0 && <li className="px-2 py-3 text-center text-[11px] text-slate-500">Nothing found</li>}
					</ul>
				</div>
			)}
		</div>
	);

	const cell = (key: ColumnKey, row: StatusRow, serial: number) => {
		if (key === "sn") return String(serial);
		if (key === "status") return <StatusMark status={row.status} />;
		if (key === "startDateTime") return row.startDateTime;
		if (key === "startAddress") return <span className="block max-w-[240px] whitespace-normal leading-4">{row.startAddress}</span>;
		if (key === "startCoordinate") return <span className={isDark ? "text-cyan-300" : "text-cyan-700"}>{row.startCoordinate}</span>;
		if (key === "endDateTime") return row.endDateTime;
		if (key === "endAddress") return <span className="block max-w-[240px] whitespace-normal leading-4">{row.endAddress}</span>;
		if (key === "endCoordinate") return <span className={isDark ? "text-cyan-300" : "text-cyan-700"}>{row.endCoordinate}</span>;
		if (key === "sPoi") return row.sPoi;
		if (key === "ePoi") return row.ePoi;
		if (key === "maxSpeed") return row.maxSpeed;
		if (key === "avgSpeed") return row.avgSpeed;
		if (key === "totalDistance") return formatDistance(row.totalDistance);
		if (key === "duration") return formatDuration(row.durationSeconds);
		return (
			<button type="button" aria-label={`Play ${row.startDateTime}`} className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#3ddc97] text-black">
				<Play className="h-3.5 w-3.5 fill-current" />
			</button>
		);
	};

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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Status Report</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{searched ? filteredRows.length : 0} reports</p>
					</div>
					<button type="button" onClick={refresh} aria-label="Refresh status report" title="Refresh status report" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}>
						<RefreshCw className="h-4 w-4" />
					</button>
				</section>

				<section className={`mb-4 rounded-xl border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-4 ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}>
					<div className="flex flex-col gap-2 xl:flex-row xl:items-center">
						{multiSelect("client", clientRef, "Select Client", selectedClients, setSelectedClients, visibleClients, clientQuery, setClientQuery)}
						{multiSelect("transporter", transporterRef, "Select Transporter", selectedTransporters, setSelectedTransporters, visibleTransporters, transporterQuery, setTransporterQuery)}
						{multiSelect("vehicle", vehicleRef, "Select Vehicle", selectedVehicles, setSelectedVehicles, visibleVehicles, vehicleQuery, setVehicleQuery)}
						{multiSelect("status", statusRef, "Select Status", selectedStatuses, setSelectedStatuses as (next: string[]) => void, visibleStatuses, statusQuery, setStatusQuery)}
						<div className={`flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border px-2 sm:max-w-[360px] ${isDark ? "border-white/[0.08] bg-[#03091c]/65" : "border-slate-200 bg-white"}`}>
							<input type="datetime-local" aria-label="From date" value={from} onChange={(event) => setFrom(event.target.value)} className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
							<span className="text-slate-500">-</span>
							<input type="datetime-local" aria-label="To date" value={to} onChange={(event) => setTo(event.target.value)} className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
						</div>
						<button type="button" onClick={applyFilters} className={`h-10 rounded-lg border px-5 text-[12px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
							Search
						</button>
					</div>
				</section>

				{searched && filteredRows.length > 0 && (
					<section className={`mb-4 overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09]" : "border-slate-200"}`} aria-label="Status Bar Chart According to Status Type">
						<StatusChart rows={filteredRows} />
					</section>
				)}

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${isDark ? "border-white/[0.07]" : "border-slate-200"}`}>
						<label className="relative block min-w-0 sm:w-[280px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search" aria-label="Search status report" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
							{search && (
								<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<details className="relative">
							<summary className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
								<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
								Column Visibility
								<ChevronDown className="h-3 w-3 text-slate-500" />
							</summary>
							<div className={`absolute right-0 top-11 z-30 max-h-64 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
								{columns.map((column) => (
									<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
										<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => setHiddenColumns((current) => (current.includes(column.key) ? current.filter((item) => item !== column.key) : [...current, column.key]))} className="h-3.5 w-3.5 accent-cyan-300" />
										{column.label}
									</label>
								))}
							</div>
						</details>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1480px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => <th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">{column.label}</th>)}
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row, index) => (
									<tr key={row.id} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => <td key={column.key} className="px-3 py-3 align-top first:px-4">{cell(column.key, row, safePage * pageSize + index + 1)}</td>)}
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-sm text-slate-500">No data available</td>
									</tr>
								)}
							</tbody>
							<tfoot>
								<tr className={`text-[11px] font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
									{visibleColumns.map((column, index) => {
										if (index === Math.max(totalAnchor - 1, 0) && totalAnchor > 0) return <td key={column.key} className="whitespace-nowrap px-3 py-3 text-right">Total :</td>;
										if (column.key === "totalDistance") return <td key={column.key} className="whitespace-nowrap px-3 py-3">{filteredRows.length === 0 ? "--" : `${formatDistance(totalDistance)} km`}</td>;
										if (column.key === "duration") return <td key={column.key} className="whitespace-nowrap px-3 py-3">{filteredRows.length === 0 ? "--" : formatDuration(totalSeconds)}</td>;
										return <td key={column.key} className="px-3 py-3" />;
									})}
								</tr>
							</tfoot>
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
							<span className={`min-w-12 text-center ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? "0 / 0" : `${safePage + 1} / ${pageCount}`}</span>
							<button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={safePage >= pageCount - 1 || filteredRows.length === 0} aria-label="Next page" className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</footer>
				</section>
			</main>
		</div>
	);
}
