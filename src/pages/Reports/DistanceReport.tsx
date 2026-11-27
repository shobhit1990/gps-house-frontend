import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { ReportType } from "@/enums/ReportType";
import { SortOrder } from "@/enums/SortOrder";
import type { DistanceReportRow } from "@/interfaces/DistanceReport";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useLazyGetDistanceReportQuery } from "@/store/services/api/DistanceReport";
import {
	useGetClientMasterQuery,
	useGetTransporterMasterQuery,
	useGetVehicleMasterQuery,
} from "@/store/services/api/Master";

type DistanceRow = DistanceReportRow;

type AppliedFilters = {
	days: string[];
};

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

const fillDays = (row: DistanceReportRow, days: string[], clientName: string, transporterName: string, vehicleName: string): DistanceRow => {
	const byDay = Object.fromEntries(days.map((day) => [day, recordedKm(row.byDay[day] ?? 0)]));
	const totalFromDays = days.reduce((sum, day) => sum + (byDay[day] ?? 0), 0);
	return {
		...row,
		client: row.client || clientName,
		transporter: row.transporter || transporterName,
		vehicle: row.vehicle || vehicleName,
		alias: row.alias || "—",
		byDay,
		total: recordedKm(row.total) || totalFromDays,
	};
};

export default function DistanceReport() {
	const { data: clients = [], isLoading: clientsLoading } = useGetClientMasterQuery();
	const { data: allVehicles = [], isLoading: vehiclesLoading } = useGetVehicleMasterQuery();
	const [fetchDistanceReport, { isFetching }] = useLazyGetDistanceReportQuery();
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const initialRange = todayRange();

	const [rows, setRows] = useState<DistanceRow[]>([]);
	const [searched, setSearched] = useState(false);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(25);
	const [page, setPage] = useState(0);
	const [client, setClient] = useState("");
	const [transporter, setTransporter] = useState("");
	const [vehicle, setVehicle] = useState("");
	const [from, setFrom] = useState(initialRange.from);
	const [to, setTo] = useState(initialRange.to);
	const [applied, setApplied] = useState<AppliedFilters>({ days: [] });
	const [reportType, setReportType] = useState<ReportType>(ReportType.VEHICLE_WISE);
	const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ASCENDING);

	const {
		data: transporters = [],
		isLoading: transportersLoading,
		isFetching: transportersFetching,
	} = useGetTransporterMasterQuery(client ? { client } : undefined);

	const vehicles = useMemo(() => {
		return allVehicles.filter((item) => {
			const clientOk = !client || !item.clientId || item.clientId === client;
			const transporterOk = !transporter || item.transporterId === transporter;
			return clientOk && transporterOk;
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

	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		const matched = rows.filter((row) => {
			if (!query) return true;
			const dayText = applied.days.map((day) => formatKm(row.byDay[day] ?? 0)).join(" ");
			return [row.vehicle, row.alias, dayText, formatKm(row.total)].join(" ").toLowerCase().includes(query);
		});
		const direction = sortOrder === SortOrder.ASCENDING ? 1 : -1;
		return [...matched].sort((left, right) => (left.total - right.total) * direction || left.vehicle.localeCompare(right.vehicle));
	}, [applied.days, rows, search, sortOrder]);

	const chartItems = useMemo(() => {
		const items =
			reportType === ReportType.DAY_WISE
				? applied.days.map((day) => ({
						id: day,
						label: day,
						km: filteredRows.reduce((sum, row) => sum + (row.byDay[day] ?? 0), 0),
					}))
				: filteredRows.map((row) => ({ id: row.id, label: row.vehicle, km: row.total }));
		if (reportType !== ReportType.DAY_WISE) return items;
		const direction = sortOrder === SortOrder.ASCENDING ? 1 : -1;
		return [...items].sort((left, right) => (left.km - right.km) * direction || left.label.localeCompare(right.label));
	}, [applied.days, filteredRows, reportType, sortOrder]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);
	const dayTotals = applied.days.map((day) => filteredRows.reduce((sum, row) => sum + (row.byDay[day] ?? 0), 0));
	const grandTotal = filteredRows.reduce((sum, row) => sum + row.total, 0);
	const hasResult = searched && rows.length > 0;
	const chartTitle =
		reportType === ReportType.DAY_WISE
			? "Total Distance Covered By Each Day In KM"
			: "Total Distance Covered By Each Vehicle In KM";

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
		if (!from || !to) {
			toast.error("Select from and to date.");
			return;
		}

		const days = daysInRange(from, to);
		if (days.length === 0) {
			toast.error("Invalid date range.");
			return;
		}

		const apiFrom = toApiDateTime(from);
		const apiTo = toApiDateTime(to);
		const clientName = clients.find((option) => option.id === client)?.name ?? "";
		const transporterName = transporters.find((option) => option.id === transporter)?.name ?? "";
		const vehicleName = vehicles.find((option) => option.id === vehicle)?.name ?? vehicle;

		try {
			const result = await fetchDistanceReport({
				client,
				transporter,
				vehicle,
				from: apiFrom,
				to: apiTo,
				reportType,
				sortOrder,
			}).unwrap();

			const nextRows =
				result.length === 0
					? [
							fillDays(
								{
									id: vehicle,
									externalId: vehicle,
									client: clientName,
									transporter: transporterName,
									vehicle: vehicleName,
									alias: "—",
									byDay: {},
									total: 0,
								},
								days,
								clientName,
								transporterName,
								vehicleName,
							),
						]
					: result.map((row) =>
							fillDays(
								{ ...row, id: row.vehicle || row.id || vehicle, externalId: row.externalId || vehicle },
								days,
								clientName,
								transporterName,
								vehicleName,
							),
						);

			setRows(nextRows);
			setApplied({ days });
			setSearched(true);
			setPage(0);
			if (nextRows.every((row) => row.total <= 0 && Object.values(row.byDay).every((km) => km <= 0))) {
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
		setClient("");
		setTransporter("");
		setVehicle("");
		setFrom(range.from);
		setTo(range.to);
		setApplied({ days: [] });
		setReportType(ReportType.VEHICLE_WISE);
		setSortOrder(SortOrder.ASCENDING);
		setPage(0);
		setPageSize(25);
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
					<button
						type="button"
						onClick={refresh}
						aria-label="Refresh distance report"
						title="Refresh distance report"
						className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section
					aria-label="Distance report filters"
					className={`mb-4 rounded-xl border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-4 ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}
				>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]">
						<SelectField
							id="distance-client"
							label="Client"
							value={client}
							onChange={onClientChange}
							disabled={clientsLoading}
							placeholder={clientsLoading ? "Loading clients…" : "Select Client"}
							options={clients}
						/>
						<SelectField
							id="distance-transporter"
							label="Transporter"
							value={transporter}
							onChange={onTransporterChange}
							disabled={transportersLoading || transportersFetching}
							placeholder={
								transportersLoading || transportersFetching
									? "Loading transporters…"
									: transporters.length === 0
										? "No transporters"
										: "Select Transporter"
							}
							options={transporters}
						/>
						<SelectField
							id="distance-vehicle"
							label="Vehicle"
							value={vehicle}
							onChange={setVehicle}
							disabled={vehiclesLoading}
							placeholder={
								vehiclesLoading
									? "Loading vehicles…"
									: vehicles.length === 0
										? "No vehicles"
										: "Select Vehicle"
							}
							options={vehicles}
						/>
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

					<div className="mt-3 grid gap-2 sm:grid-cols-2">
						<label className="relative block min-w-0">
							<span className={`mb-1.5 block text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Select Type</span>
							<select
								aria-label="Select Type"
								value={reportType}
								onChange={(event) => setReportType(event.target.value as ReportType)}
								className={selectClass}
							>
								{reportTypes.map((type) => (
									<option key={type} value={type}>
										{type}
									</option>
								))}
							</select>
							<ChevronDown className="pointer-events-none absolute right-3 bottom-3 h-3.5 w-3.5 text-slate-500" />
						</label>
						<label className="relative block min-w-0">
							<span className={`mb-1.5 block text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Sort By</span>
							<select
								aria-label="Sort By"
								value={sortOrder}
								onChange={(event) => {
									setSortOrder(event.target.value as SortOrder);
									setPage(0);
								}}
								className={selectClass}
							>
								{sortOptions.map((order) => (
									<option key={order} value={order}>
										{order}
									</option>
								))}
							</select>
							<ChevronDown className="pointer-events-none absolute right-3 bottom-3 h-3.5 w-3.5 text-slate-500" />
						</label>
					</div>
				</section>

				{hasResult && (
					<section
						className={`mb-4 overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09]" : "border-slate-200"}`}
						aria-label={chartTitle}
					>
						<DistanceChart title={chartTitle} items={chartItems} />
					</section>
				)}

				{hasResult && (
					<section
						className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}
					>
						<div className={`flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${isDark ? "border-white/[0.07]" : "border-slate-200"}`}>
							<label className="relative block min-w-0 sm:w-[280px]">
								<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
								<input
									type="search"
									value={search}
									onChange={(event) => {
										setSearch(event.target.value);
										setPage(0);
									}}
									placeholder="Search"
									aria-label="Search distance report"
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
							<label className={`flex items-center gap-2 text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
								Show
								<span className="relative">
									<select
										aria-label="Show rows"
										value={pageSize}
										onChange={(event) => {
											setPageSize(Number(event.target.value));
											setPage(0);
										}}
										className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 [color-scheme:dark]" : "border-slate-200 bg-white text-slate-700"}`}
									>
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
									<tr
										className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}
									>
										<th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">
											Vehicle
										</th>
										<th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
											Vehicle Alias
										</th>
										{applied.days.map((day) => (
											<th key={day} scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
												{day}
											</th>
										))}
										<th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
											TotalDistance
										</th>
									</tr>
								</thead>
								<tbody>
									{pageRows.map((row) => (
										<tr
											key={row.id}
											className={`border-b text-[11px] transition ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
										>
											<td className={`whitespace-nowrap px-4 py-3 font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{row.vehicle}</td>
											<td className="whitespace-nowrap px-3 py-3">{row.alias}</td>
											{applied.days.map((day) => (
												<td key={day} className="whitespace-nowrap px-3 py-3">
													{formatKm(row.byDay[day] ?? 0)}
												</td>
											))}
											<td className="whitespace-nowrap px-3 py-3">{formatKm(row.total)}</td>
										</tr>
									))}
									{pageRows.length > 0 && (
										<tr className={`text-[11px] font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
											<td className="whitespace-nowrap px-4 py-3">Total</td>
											<td className="px-3 py-3" />
											{dayTotals.map((total, index) => (
												<td key={applied.days[index]} className="whitespace-nowrap px-3 py-3">
													{formatKm(total)}
												</td>
											))}
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
						<footer
							className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}
						>
							<span>
								Showing{" "}
								<span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
									{filteredRows.length === 0 ? 0 : safePage * pageSize + 1} to {Math.min((safePage + 1) * pageSize, filteredRows.length)}
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
									{safePage + 1} / {pageCount}
								</span>
								<button
									type="button"
									onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
									disabled={safePage >= pageCount - 1}
									aria-label="Next page"
									className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
								>
									<ChevronRight className="h-4 w-4" />
								</button>
							</div>
						</footer>
					</section>
				)}

				{!hasResult && (
					<section
						className={`rounded-xl border px-6 py-16 text-center ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}
					>
						<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No distance reports available</p>
						<p className="mt-1 text-xs text-slate-500">Select client, transporter, and vehicle, then search.</p>
					</section>
				)}
			</main>
		</div>
	);
}
