import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, Plus, RefreshCw, RotateCcw, Search, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddVehicleDetailForm, type VehicleDetailFormValues } from "@/components/VehicleForm/AddVehicleDetailForm";
import type { ServiceMaintenanceValues } from "@/components/VehicleForm/ServiceMaintenanceForm";
import { ServiceMaintenanceDialog, type ServiceRecord } from "@/components/VehicleForm/ServiceMaintenanceDialog";
import { useAuth } from "@/contexts/AuthContext";

type VehicleDetailRecord = {
	id: number;
	vehicleNo: string;
	ownerName: string;
	ownedBy: string;
	vehicleBrand: string;
	vehicleModel: string;
	vehicleBody: string;
	capacity: number;
	manufactureDate: string;
	purchaseDate: string;
};

type ColumnKey = keyof VehicleDetailRecord | "service";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "vehicleNo", label: "Vehicle No" },
	{ key: "ownerName", label: "Owner Name" },
	{ key: "ownedBy", label: "Owned By" },
	{ key: "vehicleBrand", label: "Vehicle Brand" },
	{ key: "vehicleModel", label: "Vehicle Model" },
	{ key: "vehicleBody", label: "Vehicle Body" },
	{ key: "capacity", label: "Capacity" },
	{ key: "manufactureDate", label: "Manufacture Date" },
	{ key: "purchaseDate", label: "Purchase Date" },
	{ key: "service", label: "Service & Maintenance" },
];

const seedRows: VehicleDetailRecord[] = [
	{
		id: 1,
		vehicleNo: "UP32ER2711",
		ownerName: "",
		ownedBy: "",
		vehicleBrand: "",
		vehicleModel: "",
		vehicleBody: "",
		capacity: 0,
		manufactureDate: "2025-10-26",
		purchaseDate: "2025-10-26",
	},
	{
		id: 2,
		vehicleNo: "UP45AC5536",
		ownerName: "neeraj",
		ownedBy: "market",
		vehicleBrand: "",
		vehicleModel: "",
		vehicleBody: "Lowbed",
		capacity: 0,
		manufactureDate: "2026-10-21",
		purchaseDate: "2026-10-21",
	},
	{
		id: 3,
		vehicleNo: "UP32HN8013",
		ownerName: "neeraj",
		ownedBy: "market",
		vehicleBrand: "",
		vehicleModel: "",
		vehicleBody: "Lowbed",
		capacity: 0,
		manufactureDate: "2026-10-21",
		purchaseDate: "2026-10-21",
	},
];

const inputClass = (isDark: boolean) =>
	`h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 placeholder:text-slate-600 focus:border-cyan-300/35"
			: "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-cyan-400"
	}`;

const formatDate = (value: string) => {
	if (!value) return "—";
	const [year, month, day] = value.split("-");
	if (!year || !month || !day) return value;
	return `${day}/${month}/${year}`;
};

const addNumbers = (left: string, right: string) => {
	if (left === "" || right === "") return "";
	const total = Number(left) + Number(right);
	return Number.isFinite(total) ? String(total) : "";
};

const subtractNumbers = (left: string, right: string) => {
	if (left === "" || right === "") return "";
	const total = Number(left) - Number(right);
	return Number.isFinite(total) ? String(total) : "";
};

const toIsoDate = (date: Date) => {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
};

const addDays = (date: string, days: string) => {
	const count = Number(days);
	if (!date || days === "" || !Number.isFinite(count)) return "";
	const next = new Date(`${date}T00:00:00`);
	next.setDate(next.getDate() + count);
	return toIsoDate(next);
};

const daysUntil = (date: string) => {
	if (!date) return "";
	const target = new Date(`${date}T00:00:00`);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	return String(Math.round((target.getTime() - today.getTime()) / 86400000));
};

const displayCell = (key: keyof VehicleDetailRecord, row: VehicleDetailRecord) => {
	if (key === "manufactureDate" || key === "purchaseDate") return formatDate(row[key]);
	if (key === "capacity") return String(row.capacity);
	const value = row[key];
	return value === "" ? "—" : String(value);
};

export default function VehicleDetail() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [rows, setRows] = useState<VehicleDetailRecord[]>(seedRows);
	const [month, setMonth] = useState("");
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [serviceRow, setServiceRow] = useState<VehicleDetailRecord | null>(null);
	const [services, setServices] = useState<ServiceRecord[]>([]);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return rows.filter((row) => {
			const matchesMonth = !month || row.purchaseDate.startsWith(month);
			const matchesSearch = !query || [row.vehicleNo, row.ownerName, row.ownedBy, row.vehicleBrand, row.vehicleModel, row.vehicleBody].join(" ").toLowerCase().includes(query);
			return matchesMonth && matchesSearch;
		});
	}, [rows, search, month]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const toggleColumn = (key: ColumnKey) => {
		setHiddenColumns((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
	};

	const resetFilters = () => {
		setMonth("");
		setSearch("");
		setPage(0);
	};

	const saveVehicle = (values: VehicleDetailFormValues) => {
		const capacity = Number(values.capacity);
		setRows((current) => [
			...current,
			{
				id: current.reduce((max, row) => Math.max(max, row.id), 0) + 1,
				vehicleNo: values.vehicleNo,
				ownerName: values.ownerName,
				ownedBy: values.ownedBy,
				vehicleBrand: values.vehicleBrand,
				vehicleModel: values.vehicleModel,
				vehicleBody: values.vehicleBody,
				capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : 0,
				manufactureDate: values.manufactureDate,
				purchaseDate: values.purchaseDate,
			},
		]);
		setShowAddDialog(false);
	};

	const saveService = (values: ServiceMaintenanceValues) => {
		const odometerInterval = values.mode === "template" ? values.thresholdKm : values.odometerEnabled ? values.odometerInterval : "";
		const lastServiceOdometer = values.mode === "custom" && values.odometerEnabled ? values.lastServiceOdometer : "";
		const engineInterval = values.mode === "custom" && values.engineEnabled ? values.engineInterval : "";
		const lastEngine = values.mode === "custom" && values.engineEnabled ? values.lastServiceEngine : "";
		const daysInterval = values.mode === "template" ? values.thresholdDays : values.daysEnabled ? values.daysInterval : "";
		const lastServiceOn = values.mode === "template" ? values.purchaseDate : values.daysEnabled ? values.lastServiceDate : "";
		const nextOdometer = addNumbers(lastServiceOdometer, odometerInterval);
		const nextEngineHour = addNumbers(lastEngine, engineInterval);
		const nextServiceDate = addDays(lastServiceOn, daysInterval);
		const daysRemaining = values.mode === "custom" && values.daysLeftEnabled ? values.daysLeft : daysUntil(nextServiceDate);
		setServices((current) => [
			...current,
			{
				id: current.reduce((max, row) => Math.max(max, row.id), 0) + 1,
				vehicleNo: values.vehicleNo,
				serviceName: values.mode === "template" ? values.templateName : values.serviceName,
				odometerInterval,
				lastServiceOdometer,
				nextServiceDueOdometer: nextOdometer,
				currentOdometer: "",
				kmLeftForNextService: subtractNumbers(nextOdometer, lastServiceOdometer),
				odometerLeft: values.odometerLeftEnabled ? values.odometerLeft : "",
				engineHoursInterval: engineInterval,
				lastServiceEngineHour: lastEngine,
				nextServiceDueEngineHour: nextEngineHour,
				engineHourLeft: values.engineLeftEnabled ? values.engineLeft : "",
				daysInterval,
				lastServiceOn,
				nextServiceDueOn: nextServiceDate,
				daysLeftForNextService: daysRemaining,
				daysLeft: daysRemaining,
				remark: values.remark,
				documentName: values.documentName,
			},
		]);
		setShowAddDialog(false);
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
							<Activity className="h-3.5 w-3.5" /> Fleet operations
						</p>
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Vehicle Detail</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{rows.length} vehicles</p>
					</div>
					<button type="button" onClick={resetFilters} aria-label="Refresh vehicle details" title="Refresh vehicle details" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}>
						<RefreshCw className="h-4 w-4" />
					</button>
				</section>

				<section aria-label="Vehicle detail filters" className={`mb-4 rounded-xl border p-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/65" : "border-slate-200 bg-white/90 shadow-sm"}`}>
					<div className="flex flex-wrap items-center gap-2">
						<label className="sr-only" htmlFor="vehicle-detail-month">Purchase month</label>
						<input id="vehicle-detail-month" type="month" value={month} onChange={(event) => { setMonth(event.target.value); setPage(0); }} className={`${inputClass(isDark)} w-full sm:w-[220px] ${isDark ? "[color-scheme:dark]" : ""}`} />
						<button type="button" onClick={resetFilters} className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-medium transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.13]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
							<RotateCcw className="h-3.5 w-3.5" /> Reset
						</button>
					</div>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search vehicle, owner, body..." aria-label="Search vehicle details" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
							{search && (
								<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative">
								<select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
									{[10, 25, 50].map((size) => <option key={size} value={size}>{size} rows</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<details className="relative">
								<summary className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Columns
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div className={`absolute right-0 top-11 z-20 max-h-72 w-60 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
									{columns.map((column) => (
										<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
											<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => toggleColumn(column.key)} className="h-3.5 w-3.5 accent-cyan-300" />
											{column.label}
										</label>
									))}
								</div>
							</details>
							<button type="button" onClick={() => setShowAddDialog(true)} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
								<Plus className="h-3.5 w-3.5" /> Add
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1280px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => (
										<th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">{column.label}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row) => (
									<tr key={row.id} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => (
											<td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">
												{column.key === "vehicleNo" ? (
													<span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{row.vehicleNo}</span>
												) : column.key === "service" ? (
													<button type="button" onClick={() => setServiceRow(row)} className={`text-[11px] font-semibold underline underline-offset-2 ${isDark ? "text-cyan-200 hover:text-cyan-100" : "text-cyan-700 hover:text-cyan-800"}`}>
														View
													</button>
												) : (
													displayCell(column.key, row)
												)}
											</td>
										))}
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No vehicles match these filters</p>
											<p className="mt-1 text-xs text-slate-500">Try clearing a filter or changing your search.</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} vehicles
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

			{showAddDialog && (
				<AddVehicleDetailForm onClose={() => setShowAddDialog(false)} onSubmit={saveVehicle} onSaveService={saveService} />
			)}

			{serviceRow && (
				<ServiceMaintenanceDialog
					vehicleNo={serviceRow.vehicleNo}
					records={services.filter((record) => record.vehicleNo === serviceRow.vehicleNo)}
					onClose={() => setServiceRow(null)}
				/>
			)}
		</div>
	);
}
