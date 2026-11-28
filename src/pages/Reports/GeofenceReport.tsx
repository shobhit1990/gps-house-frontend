import { useEffect, useMemo, useRef, useState } from "react";
import { useCloseDetailsOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, RefreshCw, Search, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { VehicleMultiSelect } from "@/components/Reports/VehicleMultiSelect";
import { useAuth } from "@/contexts/AuthContext";
import type { GeofenceReportRow } from "@/interfaces/GeofenceReport";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useLazyGetGeofenceReportQuery } from "@/store/services/api/GeofenceReport";
import {
	useGetClientMasterQuery,
	useGetTransporterMasterQuery,
	useGetVehicleMasterQuery,
} from "@/store/services/api/Master";
import { Duration } from "@/enums/duration";

type ColumnKey = "sn" | "vehicle" | "geoName" | "inTime" | "outTime" | "inLoc" | "outLoc" | "haltTime" | "distance" | "reportType" | "remark";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "vehicle", label: "Vehicle" },
	{ key: "geoName", label: "Geo_Name" },
	{ key: "inTime", label: "In_Time" },
	{ key: "outTime", label: "Out_Time" },
	{ key: "inLoc", label: "In_Loc" },
	{ key: "outLoc", label: "Out_Loc" },
	{ key: "haltTime", label: "Halt_Time" },
	{ key: "distance", label: "Distance" },
	{ key: "reportType", label: "Report Type" },
	{ key: "remark", label: "Remark" },
];

const durations = Object.values(Duration);

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

export default function GeofenceReport() {
	const { data: clients = [], isLoading: clientsLoading } = useGetClientMasterQuery();
	const { data: allVehicles = [], isLoading: vehiclesLoading } = useGetVehicleMasterQuery();
	const [fetchGeofenceReport, { isFetching }] = useLazyGetGeofenceReportQuery();
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const initialRange = todayRange();
	const columnVisibilityRef = useRef<HTMLDetailsElement>(null);
	useCloseDetailsOnOutsideClick(columnVisibilityRef);

	const [rows, setRows] = useState<GeofenceReportRow[]>([]);
	const [searched, setSearched] = useState(false);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [client, setClient] = useState("");
	const [transporter, setTransporter] = useState("");
	const [vehicles, setVehicles] = useState<string[]>([]);
	const [duration, setDuration] = useState(Duration.ALL);
	const [from, setFrom] = useState(initialRange.from);
	const [to, setTo] = useState(initialRange.to);

	const {
		data: transporters = [],
		isLoading: transportersLoading,
		isFetching: transportersFetching,
	} = useGetTransporterMasterQuery(client ? { client } : undefined, { skip: !client });

	const vehicleOptions = useMemo(() => {
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
		setVehicles([]);
	}, [transporter, transporters]);

	useEffect(() => {
		if (vehicles.length === 0) return;
		const allowed = new Set(vehicleOptions.map((option) => option.id));
		const next = vehicles.filter((id) => allowed.has(id));
		if (next.length !== vehicles.length) setVehicles(next);
	}, [vehicleOptions, vehicles]);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		if (!searched) return [];
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) =>
			[
				row.vehicle,
				row.geoName,
				row.inTime,
				row.outTime,
				row.inLoc,
				row.outLoc,
				row.haltTime,
				row.distance,
				row.reportType,
				row.remark,
			]
				.join(" ")
				.toLowerCase()
				.includes(query),
		);
	}, [rows, search, searched]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const selectClass = `h-10 w-full appearance-none rounded-lg border px-3 pr-9 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-200 focus:border-cyan-300/35 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-800 focus:border-cyan-400 [color-scheme:light]"
	}`;

	const onClientChange = (next: string) => {
		setClient(next);
		setTransporter("");
		setVehicles([]);
	};

	const onTransporterChange = (next: string) => {
		setTransporter(next);
		setVehicles([]);
	};

	const applyFilters = async () => {
		if (!client || !transporter || vehicles.length === 0) {
			toast.error("Select client, transporter, and at least one vehicle.");
			return;
		}
		if (!from || !to) {
			toast.error("Select from and to date.");
			return;
		}

		const vehicleParam = vehicles.join(",");
		try {
			const data = await fetchGeofenceReport({
				client,
				transporter,
				vehicle: vehicleParam,
				duration,
				from: toApiDateTime(from),
				to: toApiDateTime(to),
			}).unwrap();
			const vehicleName = vehicles
				.map((id) => vehicleOptions.find((option) => option.id === id)?.name ?? id)
				.join(", ");
			const nextRows = data.map((row, index) => ({
				...row,
				id: row.id || `${vehicleParam}-${index}`,
				vehicle: row.vehicle && row.vehicle !== "—" ? row.vehicle : vehicleName || row.vehicle,
			}));
			setRows(nextRows);
			setSearched(true);
			setPage(0);
			if (nextRows.length === 0) {
				toast.message("No geofence reports for this range.");
			} else {
				toast.success("Geofence report loaded");
			}
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not load geofence report."));
		}
	};

	const refresh = () => {
		const range = todayRange();
		setRows([]);
		setSearched(false);
		setSearch("");
		setClient("");
		setTransporter("");
		setVehicles([]);
		setDuration(Duration.ALL);
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

	const cell = (key: ColumnKey, row: GeofenceReportRow, serial: number) => {
		if (key === "sn") return String(row.sn || serial).padStart(2, "0");
		if (key === "vehicle" || key === "geoName") {
			return <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{textValue(row[key])}</span>;
		}
		return textValue(row[key]);
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Geofence Report</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>
							{searched ? filteredRows.length : 0} reports
						</p>
					</div>
					<button
						type="button"
						onClick={refresh}
						aria-label="Refresh geofence report"
						title="Refresh geofence report"
						className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section
					aria-label="Geofence report filters"
					className={`mb-4 rounded-xl border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-4 ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}
				>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_auto]">
						<SelectField
							id="geofence-client"
							label="Client"
							value={client}
							onChange={onClientChange}
							disabled={clientsLoading}
							placeholder={clientsLoading ? "Loading clients…" : "Select Client"}
							options={clients}
						/>
						<SelectField
							id="geofence-transporter"
							label="Transporter"
							value={transporter}
							onChange={onTransporterChange}
							disabled={!client || transportersLoading || transportersFetching}
							placeholder={
								!client
									? "Select Transporter"
									: transportersLoading || transportersFetching
										? "Loading transporters…"
										: transporters.length === 0
											? "No transporters"
											: "Select Transporter"
							}
							options={transporters}
						/>
						<VehicleMultiSelect
							id="geofence-vehicle"
							options={vehicleOptions}
							values={vehicles}
							onValuesChange={setVehicles}
							disabled={!transporter || vehiclesLoading}
							placeholder={
								!transporter
									? "Select Vehicle"
									: vehiclesLoading
										? "Loading vehicles…"
										: vehicleOptions.length === 0
											? "No vehicles"
											: "Select Vehicle"
							}
							emptyText="No vehicles"
							isDark={isDark}
						/>
						<label className="relative block min-w-0 flex-1">
							<span className="sr-only">Duration</span>
							<select
								id="geofence-duration"
								aria-label="Select Duration"
								value={duration}
								onChange={(event) => setDuration(event.target.value as Duration)}
								className={selectClass}
							>
								<option value={Duration.ALL}>Select Duration</option>
								{durations
									.filter((item) => item !== Duration.ALL)
									.map((item) => (
										<option key={item} value={item}>
											{item}
										</option>
									))}
							</select>
							<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
						</label>
						<div className={`flex h-10 min-w-0 items-center gap-2 rounded-lg border px-2 ${isDark ? "border-white/[0.08] bg-[#03091c]/70" : "border-slate-200 bg-white"}`}>
							<input type="datetime-local" aria-label="From date" value={from} onChange={(event) => setFrom(event.target.value)} className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
							<span className="text-slate-500">-</span>
							<input type="datetime-local" aria-label="To date" value={to} onChange={(event) => setTo(event.target.value)} className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
						</div>
						<button
							type="button"
							onClick={() => void applyFilters()}
							disabled={isFetching}
							className={`h-10 rounded-lg border px-5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
						>
							{isFetching ? "Searching…" : "Search"}
						</button>
					</div>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search" aria-label="Search geofence report" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
							{search && (
								<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<details ref={columnVisibilityRef} className="relative">
								<summary className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Column Visibility
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div className={`absolute right-0 top-11 z-30 max-h-52 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
									{columns.map((column) => (
										<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
											<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => setHiddenColumns((current) => (current.includes(column.key) ? current.filter((item) => item !== column.key) : [...current, column.key]))} className="h-3.5 w-3.5 accent-cyan-300" />
											{column.label}
										</label>
									))}
								</div>
							</details>
							<div className="relative">
								<select aria-label="No of Rows" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 [color-scheme:dark]" : "border-slate-200 bg-white text-slate-700"}`}>
									<option value={10}>No of Rows</option>
									<option value={25}>25 rows</option>
									<option value={50}>50 rows</option>
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1200px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => <th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">{column.label}</th>)}
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row, index) => (
									<tr key={row.id} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => <td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">{cell(column.key, row, safePage * pageSize + index + 1)}</td>)}
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
												{isFetching
													? "Loading geofence reports…"
													: searched
														? "No geofence reports available"
														: "Select filters and search"}
											</p>
											<p className="mt-1 text-xs text-slate-500">
												{searched
													? "Change the filters or search to see reports."
													: "Choose client, transporter, vehicle, and date range, then Search."}
											</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} reports
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
			</main>
		</div>
	);
}
