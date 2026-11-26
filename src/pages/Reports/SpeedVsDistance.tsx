import {useEffect, useMemo, useState, useRef} from "react";
import { useCloseDetailsOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, RefreshCw, Search, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import type { SpeedVsDistanceRow } from "@/interfaces/SpeedVsDistanceReport";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import {
	useGetClientMasterQuery,
	useGetTransporterMasterQuery,
	useGetVehicleMasterQuery,
} from "@/store/services/api/Master";
import { useLazyGetSpeedVsDistanceReportQuery } from "@/store/services/api/SpeedVsDistanceReport";

type SpeedRow = SpeedVsDistanceRow;
type ColumnKey = "sn" | "vehicle" | "km0" | "km40" | "km60" | "km80" | "total";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "vehicle", label: "Vehicle" },
	{ key: "km0", label: "0-40 kmph" },
	{ key: "km40", label: "40-60 kmph" },
	{ key: "km60", label: "60-80 kmph" },
	{ key: "km80", label: "80+ kmph" },
	{ key: "total", label: "Total Distance Kms" },
];

const bands = [
	{ key: "km0" as const, legend: "Speed: 0-40 kmph", color: "#3ddc97" },
	{ key: "km40" as const, legend: "Speed: 40-60 kmph", color: "#e6c84a" },
	{ key: "km60" as const, legend: "Speed: 60-80 kmph", color: "#f08a24" },
	{ key: "km80" as const, legend: "Speed: 80+ kmph", color: "#e23b3b" },
];

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

const totalKm = (row: SpeedRow) => row.total || Math.round((row.km0 + row.km40 + row.km60 + row.km80) * 10) / 10;

const ringRadius = (km: number, max: number) => (km <= 0 || max <= 0 ? 0 : 22 + (km / max) * 74);

function SpeedChart({ row }: { row: SpeedRow }) {
	const items = bands.map((band) => ({ ...band, km: row[band.key] }));
	const max = Math.max(...items.map((item) => item.km), 0);
	const rings = items
		.map((item) => ({ ...item, radius: ringRadius(item.km, max) }))
		.filter((item) => item.radius > 0)
		.sort((left, right) => right.radius - left.radius);

	return (
		<div className="relative">
			<p className="mb-3 text-center text-[11px] font-semibold tracking-wide text-slate-200">Km Distance Covered According To Speed</p>
			<div className="relative mx-auto h-[250px] w-[250px]">
				<svg viewBox="0 0 250 250" className="h-full w-full" role="img" aria-label={`Speed distance chart for ${row.vehicle}`}>
					<circle cx="125" cy="132" r="104" fill="#070d1c" />
					{rings.map((ring) => (
						<circle key={ring.key} cx="125" cy="132" r={ring.radius} fill="none" stroke={ring.color} strokeWidth="7" />
					))}
					<circle cx="125" cy="132" r="18" fill="#070d1c" />
					<text x="125" y="137" textAnchor="middle" fill="#f8fafc" fontSize="16" fontWeight="600">
						{totalKm(row)}
					</text>
				</svg>
				<ul className="absolute right-0 top-2 space-y-1 text-[9px] leading-tight text-slate-200">
					{items.map((item) => (
						<li key={item.key} className="flex items-start gap-1.5">
							<span className="mt-1 h-0.5 w-4 shrink-0" style={{ backgroundColor: item.color }} />
							<span>
								{item.legend}
								<br />({item.km}km)
							</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

export default function SpeedVsDistance() {
	const { data: clients = [], isLoading: clientsLoading } = useGetClientMasterQuery();
	const { data: allVehicles = [], isLoading: vehiclesLoading } = useGetVehicleMasterQuery();
	const [fetchSpeedReport, { isFetching }] = useLazyGetSpeedVsDistanceReportQuery();
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const initialRange = todayRange();

	const [rows, setRows] = useState<SpeedRow[]>([]);
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
	const [from, setFrom] = useState(initialRange.from);
	const [to, setTo] = useState(initialRange.to);
	const [chartVehicle, setChartVehicle] = useState("");

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
			[row.vehicle, String(row.km0), String(row.km40), String(row.km60), String(row.km80), String(totalKm(row))]
				.join(" ")
				.toLowerCase()
				.includes(query),
		);
	}, [rows, search, searched]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);
	const chartRow = filteredRows.find((row) => row.vehicle === chartVehicle) ?? filteredRows[0];

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

		try {
			const data = await fetchSpeedReport({
				client,
				transporter,
				vehicle,
				from: toApiDateTime(from),
				to: toApiDateTime(to),
				search: search.trim(),
			}).unwrap();
			const vehicleName = vehicles.find((option) => option.id === vehicle)?.name ?? "";
			const nextRows = data.map((row, index) => ({
				...row,
				id: row.id || `${vehicle}-${index}`,
				vehicle: row.vehicle || vehicleName,
			}));
			setRows(nextRows);
			setChartVehicle(nextRows[0]?.vehicle ?? "");
			setSearched(true);
			setPage(0);
			if (nextRows.length === 0) {
				toast.message("No speed vs distance data for this range.");
			} else {
				toast.success("Speed vs distance report loaded");
			}
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not load speed vs distance report."));
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
		setChartVehicle("");
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

	const cell = (key: ColumnKey, row: SpeedRow, serial: number) => {
		if (key === "sn") return String(row.sn || serial).padStart(2, "0");
		if (key === "vehicle") {
			return <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{row.vehicle}</span>;
		}
		if (key === "total") return String(totalKm(row));
		return String(row[key]);
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Speed vs Distance</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>
							{searched ? filteredRows.length : 0} reports
						</p>
					</div>
					<button
						type="button"
						onClick={refresh}
						aria-label="Refresh speed vs distance"
						title="Refresh speed vs distance"
						className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section
					aria-label="Speed vs distance filters"
					className={`mb-4 rounded-xl border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-4 ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}
				>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]">
						<SelectField
							id="speed-distance-client"
							label="Client"
							value={client}
							onChange={onClientChange}
							disabled={clientsLoading}
							placeholder={clientsLoading ? "Loading clients…" : "Select Client"}
							options={clients}
						/>
						<SelectField
							id="speed-distance-transporter"
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
							id="speed-distance-vehicle"
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

				<section
					className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}
				>
					<div
						className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}
					>
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
								aria-label="Search speed vs distance"
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
									<option value={10}>10 rows</option>
									<option value={25}>25 rows</option>
									<option value={50}>50 rows</option>
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<details ref={columnVisibilityRef} className="relative">
								<summary
									className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
								>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Column Visibility
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div
									className={`absolute right-0 top-11 z-30 max-h-52 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
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
							<label className="relative w-[180px]">
								<span className="sr-only">Chart vehicle</span>
								<select
									aria-label="Chart vehicle"
									value={chartVehicle}
									onChange={(event) => setChartVehicle(event.target.value)}
									disabled={filteredRows.length === 0}
									className={`h-9 w-full appearance-none rounded-lg border px-3 pr-8 text-[11px] outline-none disabled:opacity-55 ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}
								>
									<option value="">{filteredRows.length === 0 ? "Select Vehicle" : "Select Vehicle"}</option>
									{filteredRows.map((row) => (
										<option key={row.id} value={row.vehicle}>
											{row.vehicle}
										</option>
									))}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</label>
						</div>
					</div>

					<div className="flex flex-col xl:flex-row">
						<div className="min-w-0 flex-1 overflow-x-auto">
							<table className="w-full min-w-[860px] border-collapse text-left">
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
												<td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">
													{cell(column.key, row, safePage * pageSize + index + 1)}
												</td>
											))}
										</tr>
									))}
									{pageRows.length === 0 && (
										<tr>
											<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
												<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
													No speed reports available
												</p>
												<p className="mt-1 text-xs text-slate-500">
													Select client, transporter, and vehicle, then search.
												</p>
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
						{chartRow && (
							<aside
								className={`border-t p-4 xl:w-[340px] xl:border-l xl:border-t-0 ${isDark ? "border-white/[0.07] bg-[#070d1c]" : "border-slate-200 bg-slate-950"}`}
							>
								<SpeedChart row={chartRow} />
							</aside>
						)}
					</div>

					<footer
						className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}
					>
						<span>
							Showing{" "}
							<span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
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
			</main>
		</div>
	);
}
