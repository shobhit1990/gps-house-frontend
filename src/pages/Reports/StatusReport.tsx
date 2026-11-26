import {useEffect, useMemo, useState, useRef} from "react";
import { useCloseDetailsOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
	Activity,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Columns3,
	Fan,
	Gauge,
	Play,
	Power,
	RefreshCw,
	Search,
	Timer,
	WifiOff,
	X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import type { StatusReportRow } from "@/interfaces/StatusReport";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import {
	useGetClientMasterQuery,
	useGetTransporterMasterQuery,
	useGetVehicleMasterQuery,
} from "@/store/services/api/Master";
import { useLazyGetStatusReportQuery } from "@/store/services/api/StatusReport";

type StatusName = "Ignition On" | "Ignition Off" | "Idle" | "Overspeed" | "Ac On" | "Unreachable";

type ColumnKey =
	| "sn"
	| "status"
	| "startDateTime"
	| "startAddress"
	| "startCoordinate"
	| "endDateTime"
	| "endAddress"
	| "endCoordinate"
	| "sPoi"
	| "ePoi"
	| "maxSpeed"
	| "avgSpeed"
	| "totalDistance"
	| "duration"
	| "play";

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

const pad = (value: number) => String(value).padStart(2, "0");

const todayRange = () => {
	const now = new Date();
	const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
	return { from: `${day}T00:00`, to: `${day}T23:59` };
};

/** datetime-local (YYYY-MM-DDTHH:mm) → API format DD/MM/YYYY HH:mm */
const toApiDateTime = (value: string) => {
	const [datePart, timePart = "00:00"] = value.split("T");
	const [year, month, day] = datePart.split("-");
	if (!year || !month || !day) return value;
	return `${day}/${month}/${year} ${timePart}`;
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

const toStatusName = (value: string): StatusName | null => {
	const exact = statuses.find((status) => status === value);
	if (exact) return exact;
	const normalized = value.trim().toLowerCase();
	return statuses.find((status) => status.toLowerCase() === normalized) ?? null;
};

function StatusMark({ status }: { status: string }) {
	const known = toStatusName(status);
	const color = known ? statusColor[known] : "#94a3b8";
	const Icon =
		known === "Idle"
			? Timer
			: known === "Overspeed"
				? Gauge
				: known === "Unreachable"
					? WifiOff
					: known === "Ac On"
						? Fan
						: Power;
	return (
		<span
			className="inline-flex h-7 w-7 items-center justify-center rounded-full"
			style={{ backgroundColor: `${color}22`, color }}
			aria-label={status}
			title={status}
		>
			<Icon className="h-3.5 w-3.5" />
		</span>
	);
}

function StatusChart({ rows }: { rows: StatusReportRow[] }) {
	const days = [...new Set(rows.map((row) => dayOf(row.startDateTime)).filter(Boolean))];
	const bars = days.map((day) => ({
		day,
		segments: legendStatuses
			.map((status) => ({
				status,
				hours:
					rows
						.filter((row) => dayOf(row.startDateTime) === day && toStatusName(row.status) === status)
						.reduce((sum, row) => sum + row.durationSeconds, 0) / 3600,
			}))
			.filter((segment) => segment.hours > 0),
	}));
	const maxHours = Math.max(...bars.flatMap((bar) => [bar.segments.reduce((sum, segment) => sum + segment.hours, 0)]), 0);
	const axisMax = maxHours <= 24 ? 24 : Math.ceil(maxHours);
	const ticks = Array.from({ length: axisMax + 1 }, (_, index) => index);

	if (days.length === 0) return null;

	return (
		<div className="rounded-xl bg-[#070d1c] px-4 py-6 sm:px-6">
			<p className="mb-6 text-center text-sm font-semibold tracking-wide text-white sm:text-base">
				Status Bar Chart According to Status Type
			</p>
			<div className="overflow-x-auto">
				<div className="min-w-[760px]">
					<div className="flex gap-3">
						<div className="flex w-[92px] shrink-0 flex-col pb-8">
							{bars.map((bar) => (
								<div key={bar.day} className="flex h-12 items-center justify-end text-[11px] text-slate-300">
									{bar.day}
								</div>
							))}
						</div>
						<div className="relative min-w-0 flex-1">
							<div className="pointer-events-none absolute inset-x-0 top-0 bottom-8">
								{ticks.map((tick) => (
									<span
										key={tick}
										className="absolute top-0 h-full w-px bg-white/15"
										style={{ left: `${(tick / axisMax) * 100}%` }}
									/>
								))}
							</div>
							<div>
								{bars.map((bar) => (
									<div key={bar.day} className="relative flex h-12 items-center">
										<div className="flex h-6 w-full overflow-hidden">
											{bar.segments.map((segment) => {
												const width = `${(segment.hours / axisMax) * 100}%`;
												return (
													<div
														key={segment.status}
														className="h-full shrink-0 transition-[width] duration-300"
														style={{ width, flexBasis: width, backgroundColor: statusColor[segment.status] }}
														title={`${legendLabel[segment.status]} ${segment.hours.toFixed(2)} h`}
													/>
												);
											})}
										</div>
									</div>
								))}
							</div>
							<div className="relative mt-2 h-4">
								{ticks.map((tick) => (
									<span
										key={tick}
										className="absolute -translate-x-1/2 text-[10px] text-slate-400"
										style={{ left: `${(tick / axisMax) * 100}%` }}
									>
										{tick}
									</span>
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
	const { data: clients = [], isLoading: clientsLoading } = useGetClientMasterQuery();
	const { data: allVehicles = [], isLoading: vehiclesLoading } = useGetVehicleMasterQuery();
	const [fetchStatusReport, { isFetching }] = useLazyGetStatusReportQuery();
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const initialRange = todayRange();

	const [rows, setRows] = useState<StatusReportRow[]>([]);
	const columnVisibilityRef = useRef<HTMLDetailsElement>(null);
	useCloseDetailsOnOutsideClick(columnVisibilityRef);
	const [searched, setSearched] = useState(false);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [client, setClient] = useState("");
	const [transporter, setTransporter] = useState("");
	const [vehicle, setVehicle] = useState("");
	const [status, setStatus] = useState("");
	const [from, setFrom] = useState(initialRange.from);
	const [to, setTo] = useState(initialRange.to);

	const {
		data: transporters = [],
		isLoading: transportersLoading,
		isFetching: transportersFetching,
	} = useGetTransporterMasterQuery(client ? { client } : undefined, { skip: !client });

	const vehicles = useMemo(() => {
		if (!client || !transporter) return [];
		return allVehicles.filter((item) => {
			const clientOk = !item.clientId || item.clientId === client;
			return clientOk && item.transporterId === transporter;
		});
	}, [allVehicles, client, transporter]);

	useEffect(() => {
		if (!transporter) return;
		if (transporters.some((item) => item.id === transporter)) return;
		setTransporter("");
		setVehicle("");
	}, [transporter, transporters]);

	useEffect(() => {
		if (!vehicle) return;
		if (vehicles.some((item) => item.id === vehicle)) return;
		setVehicle("");
	}, [vehicle, vehicles]);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		if (!searched) return [];
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) =>
			[
				row.status,
				row.startDateTime,
				row.startAddress,
				row.startCoordinate,
				row.endDateTime,
				row.endAddress,
				row.endCoordinate,
				row.sPoi,
				row.ePoi,
				row.maxSpeed,
				row.avgSpeed,
				formatDistance(row.totalDistance),
				formatDuration(row.durationSeconds),
			]
				.join(" ")
				.toLowerCase()
				.includes(query),
		);
	}, [rows, search, searched]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);
	const totalDistance = filteredRows.reduce((sum, row) => sum + row.totalDistance, 0);
	const totalSeconds = filteredRows.reduce((sum, row) => sum + row.durationSeconds, 0);
	const totalAnchor = visibleColumns.findIndex((column) => column.key === "totalDistance" || column.key === "duration");

	const selectClass = `h-10 w-full appearance-none rounded-lg border px-3 pr-9 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-200 focus:border-cyan-300/35 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-800 focus:border-cyan-400 [color-scheme:light]"
	}`;

	const onClientChange = (next: string) => {
		setClient(next);
		setTransporter("");
		setVehicle("");
	};

	const onTransporterChange = (next: string) => {
		setTransporter(next);
		setVehicle("");
	};

	const applyFilters = async () => {
		if (!client || !transporter || !vehicle) {
			toast.error("Select client, transporter, and vehicle.");
			return;
		}
		if (!status) {
			toast.error("Select status.");
			return;
		}
		if (!from || !to) {
			toast.error("Select from and to date.");
			return;
		}

		try {
			const data = await fetchStatusReport({
				client,
				transporter,
				vehicle,
				status,
				from: toApiDateTime(from),
				to: toApiDateTime(to),
			}).unwrap();
			setRows(data);
			setSearched(true);
			setPage(0);
			if (data.length === 0) {
				toast.message("No status records for this range.");
			} else {
				toast.success("Status report loaded");
			}
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not load status report."));
		}
	};

	const refresh = () => {
		const range = todayRange();
		setRows([]);
		setSearched(false);
		setSearch("");
		setClient("");
		setTransporter("");
		setVehicle("");
		setStatus("");
		setFrom(range.from);
		setTo(range.to);
		setHiddenColumns([]);
		setPage(0);
		setPageSize(10);
	};

	const SelectField = ({
		id,
		label,
		value,
		onChange,
		disabled,
		placeholder,
		options,
	}: {
		id: string;
		label: string;
		value: string;
		onChange: (value: string) => void;
		disabled?: boolean;
		placeholder: string;
		options: { id: string; name: string }[];
	}) => (
		<label className="relative block min-w-0 flex-1">
			<span className="sr-only">{label}</span>
			<select
				id={id}
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(event.target.value)}
				className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-55`}
			>
				<option value="">{placeholder}</option>
				{options.map((option) => (
					<option key={option.id} value={option.id}>
						{option.name}
					</option>
				))}
			</select>
			<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
		</label>
	);

	const cell = (key: ColumnKey, row: StatusReportRow, serial: number) => {
		if (key === "sn") return String(row.sn || serial);
		if (key === "status") return <StatusMark status={row.status} />;
		if (key === "startDateTime") return row.startDateTime;
		if (key === "startAddress") {
			return <span className="block max-w-[240px] whitespace-normal leading-4">{row.startAddress}</span>;
		}
		if (key === "startCoordinate") {
			return <span className={isDark ? "text-cyan-300" : "text-cyan-700"}>{row.startCoordinate}</span>;
		}
		if (key === "endDateTime") return row.endDateTime;
		if (key === "endAddress") {
			return <span className="block max-w-[240px] whitespace-normal leading-4">{row.endAddress}</span>;
		}
		if (key === "endCoordinate") {
			return <span className={isDark ? "text-cyan-300" : "text-cyan-700"}>{row.endCoordinate}</span>;
		}
		if (key === "sPoi") return row.sPoi;
		if (key === "ePoi") return row.ePoi;
		if (key === "maxSpeed") return row.maxSpeed;
		if (key === "avgSpeed") return row.avgSpeed;
		if (key === "totalDistance") return formatDistance(row.totalDistance);
		if (key === "duration") return formatDuration(row.durationSeconds);
		return (
			<button
				type="button"
				aria-label={`Play ${row.startDateTime}`}
				className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#3ddc97] text-black"
			>
				<Play className="h-3.5 w-3.5 fill-current" />
			</button>
		);
	};

	return (
		<div
			className={`relative min-h-screen overflow-hidden font-sans ${isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"}`}
		>
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.12] blur-[160px]" />
				<div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.08] blur-[170px]" />
			</div>
			<Sidebar onLogout={logout} />

			<main className="relative mx-auto max-w-[1900px] px-4 pb-8 pt-6 sm:px-6 lg:px-7 lg:pt-7">
				<section className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						<p
							className={`mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}
						>
							<Activity className="h-3.5 w-3.5" /> Reports
						</p>
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>
							Status Report
						</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>
							{searched ? filteredRows.length : 0} reports
						</p>
					</div>
					<button
						type="button"
						onClick={refresh}
						aria-label="Refresh status report"
						title="Refresh status report"
						className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section
					aria-label="Status report filters"
					className={`mb-4 rounded-xl border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-4 ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}
				>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_auto]">
						<SelectField
							id="status-report-client"
							label="Client"
							value={client}
							onChange={onClientChange}
							disabled={clientsLoading}
							placeholder={clientsLoading ? "Loading clients…" : "Select Client"}
							options={clients}
						/>
						<SelectField
							id="status-report-transporter"
							label="Transporter"
							value={transporter}
							onChange={onTransporterChange}
							disabled={!client || transportersLoading || transportersFetching}
							placeholder={
								!client
									? "Select client first"
									: transportersLoading || transportersFetching
										? "Loading transporters…"
										: transporters.length === 0
											? "No transporters"
											: "Select Transporter"
							}
							options={transporters}
						/>
						<SelectField
							id="status-report-vehicle"
							label="Vehicle"
							value={vehicle}
							onChange={setVehicle}
							disabled={!transporter || vehiclesLoading}
							placeholder={
								!transporter
									? "Select transporter first"
									: vehiclesLoading
										? "Loading vehicles…"
										: vehicles.length === 0
											? "No vehicles"
											: "Select Vehicle"
							}
							options={vehicles}
						/>
						<label className="relative block min-w-0 flex-1">
							<span className="sr-only">Status</span>
							<select
								id="status-report-status"
								aria-label="Select Status"
								value={status}
								onChange={(event) => setStatus(event.target.value)}
								className={selectClass}
							>
								<option value="">Select Status</option>
								{statuses.map((item) => (
									<option key={item} value={item}>
										{item}
									</option>
								))}
							</select>
							<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
						</label>
						<div
							className={`flex h-10 min-w-0 items-center gap-2 rounded-lg border px-2 ${isDark ? "border-white/[0.08] bg-[#03091c]/70" : "border-slate-200 bg-white"}`}
						>
							<input
								type="datetime-local"
								aria-label="From date"
								value={from}
								onChange={(event) => setFrom(event.target.value)}
								className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`}
							/>
							<span className="text-slate-500">-</span>
							<input
								type="datetime-local"
								aria-label="To date"
								value={to}
								onChange={(event) => setTo(event.target.value)}
								className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`}
							/>
						</div>
						<button
							type="button"
							onClick={() => void applyFilters()}
							disabled={isFetching}
							className={`h-10 rounded-lg border px-5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
						>
							{isFetching ? "Searching..." : "Search"}
						</button>
					</div>
				</section>

				{searched && filteredRows.length > 0 && (
					<section
						className={`mb-4 overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09]" : "border-slate-200"}`}
						aria-label="Status Bar Chart According to Status Type"
					>
						<StatusChart rows={filteredRows} />
					</section>
				)}

				<section
					className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}
				>
					<div
						className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}
					>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search
								className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`}
							/>
							<input
								type="search"
								value={search}
								onChange={(event) => {
									setSearch(event.target.value);
									setPage(0);
								}}
								placeholder="Search"
								aria-label="Search status report"
								className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`}
							/>
							{search && (
								<button
									type="button"
									onClick={() => setSearch("")}
									aria-label="Clear search"
									className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
								>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<details ref={columnVisibilityRef} className="relative">
								<summary
									className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
								>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Column Visibility
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div
									className={`absolute right-0 top-11 z-30 max-h-64 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
								>
									{columns.map((column) => (
										<label
											key={column.key}
											className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}
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
									className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 [color-scheme:dark]" : "border-slate-200 bg-white text-slate-700"}`}
								>
									{[10, 25, 50].map((size) => (
										<option key={size} value={size}>
											{size} rows
										</option>
									))}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
						</div>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1480px] border-collapse text-left">
							<thead>
								<tr
									className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}
								>
									{visibleColumns.map((column) => (
										<th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">
											{column.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row, index) => (
									<tr
										key={row.id}
										className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
									>
										{visibleColumns.map((column) => (
											<td key={column.key} className="px-3 py-3 align-top first:px-4">
												{cell(column.key, row, safePage * pageSize + index + 1)}
											</td>
										))}
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-sm text-slate-500">
											{searched ? "No data available" : "Select filters and search"}
										</td>
									</tr>
								)}
							</tbody>
							{searched && (
								<tfoot>
									<tr className={`text-[11px] font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
										{visibleColumns.map((column, index) => {
											if (index === Math.max(totalAnchor - 1, 0) && totalAnchor > 0) {
												return (
													<td key={column.key} className="whitespace-nowrap px-3 py-3 text-right">
														Total :
													</td>
												);
											}
											if (column.key === "totalDistance") {
												return (
													<td key={column.key} className="whitespace-nowrap px-3 py-3">
														{filteredRows.length === 0 ? "--" : `${formatDistance(totalDistance)} km`}
													</td>
												);
											}
											if (column.key === "duration") {
												return (
													<td key={column.key} className="whitespace-nowrap px-3 py-3">
														{filteredRows.length === 0 ? "--" : formatDuration(totalSeconds)}
													</td>
												);
											}
											return <td key={column.key} className="px-3 py-3" />;
										})}
									</tr>
								</tfoot>
							)}
						</table>
					</div>
					<footer
						className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}
					>
						<span>
							Showing{" "}
							<span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								{filteredRows.length === 0 ? 0 : safePage * pageSize + 1} to{" "}
								{Math.min((safePage + 1) * pageSize, filteredRows.length)}
							</span>{" "}
							of {filteredRows.length} entries
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								onClick={() => setPage((current) => Math.max(0, current - 1))}
								disabled={safePage === 0}
								aria-label="Previous page"
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
							>
								<ChevronLeft className="h-4 w-4" />
							</button>
							<span className={`min-w-12 text-center ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								{filteredRows.length === 0 ? "0 / 0" : `${safePage + 1} / ${pageCount}`}
							</span>
							<button
								type="button"
								onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
								disabled={safePage >= pageCount - 1 || filteredRows.length === 0}
								aria-label="Next page"
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
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
