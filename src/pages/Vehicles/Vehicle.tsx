import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { autoTable } from "jspdf-autotable";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
	Activity,
	CarFront,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Columns3,
	FileDown,
	FileSpreadsheet,
	Plus,
	RefreshCw,
	RotateCcw,
	Search,
	Settings2,
	X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddVehicleForm } from "@/components/VehicleForm/AddVehicleForm";
import { useAuth } from "@/contexts/AuthContext";
import { vehicles } from "@/components/data/vehicles";

type VehicleState =
	| "Running"
	| "Stopped"
	| "Overspeed"
	| "Idle"
	| "Unreachable"
	| "New"
	| "Inactive"
	| "Unreported";

type VehicleRecord = Record<string, string> & {
	filterStatus: VehicleState;
	month: string;
};

const columns: { key: string; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "vehicleNo", label: "Vehicle No." },
	{ key: "imei", label: "IMEI" },
	{ key: "sim", label: "SIM" },
	{ key: "client", label: "Client" },
	{ key: "transporter", label: "Transporter" },
	{ key: "company", label: "Company" },
	{ key: "deviceType", label: "D_Type" },
	{ key: "state", label: "State" },
	{ key: "vehicleType", label: "V_Type" },
	{ key: "operator", label: "Operator" },
	{ key: "lastUpdated", label: "Last Updated" },
	{ key: "vehicleStatus", label: "V_Status" },
	{ key: "deviceStatus", label: "D_Status" },
	{ key: "sensors", label: "Sensors" },
	{ key: "added", label: "Added" },
	{ key: "subscriptionStart", label: "Sub_Start" },
	{ key: "subscriptionDue", label: "Sub_Due" },
	{ key: "odometer", label: "Odometer (km)" },
	{ key: "inactiveDate", label: "Inactive Date" },
	{ key: "modifiedDate", label: "Modified Date" },
	{ key: "overspeed", label: "Overspeed" },
	{ key: "mileage", label: "Mileage" },
	{ key: "port", label: "Port" },
	{ key: "nickname", label: "Vehicle Nickname" },
	{ key: "remark", label: "Remark" },
	{ key: "driverAssigned", label: "D_Assigned" },
	{ key: "ignitionWire", label: "Ign Wire" },
	{ key: "loadingStatus", label: "Loading Status" },
	{ key: "address", label: "Address" },
	{ key: "vehicleLog", label: "Vehicle Log" },
	{ key: "certificate", label: "Certificate" },
	{ key: "command", label: "Command" },
	{ key: "technician", label: "Assign To Technician" },
];

const chartOptions = [
	"Added",
	"Subscription Start",
	"Subscription Due",
	"Inactive Date",
	"Modified Date",
	"Device Type",
	"Vehicle Status",
];

const statusOptions: (VehicleState | "All")[] = [
	"All",
	"Running",
	"Stopped",
	"Overspeed",
	"Idle",
	"Unreachable",
	"New",
	"Inactive",
	"Unreported",
];

const initialRows: VehicleRecord[] = vehicles.map((vehicle, index) => {
	const [date = "", time = ""] = vehicle.updatedAt.split(" ");
	const [, month = "", year = ""] = date.split("/");

	return {
		sn: String(index + 1),
		vehicleNo: vehicle.vehicle,
		imei: "—",
		sim: vehicle.iccid ?? "—",
		client: "Unassigned",
		transporter: vehicle.branch || "Unassigned",
		company: vehicle.branch || "—",
		deviceType: "—",
		state: "—",
		vehicleType: vehicle.kind === "car" ? "Personal Car" : "Bike",
		operator: "—",
		lastUpdated: `${date} ${time}`.trim(),
		vehicleStatus: "—",
		deviceStatus: "—",
		sensors: vehicle.gps || vehicle.gsm ? "GPS / GSM" : "—",
		added: "—",
		subscriptionStart: "—",
		subscriptionDue: "—",
		odometer: "—",
		inactiveDate: "—",
		modifiedDate: "—",
		overspeed: "—",
		mileage: "—",
		port: "—",
		nickname: "—",
		remark: "—",
		driverAssigned: "—",
		ignitionWire: "—",
		loadingStatus: "—",
		address: vehicle.address,
		vehicleLog: "—",
		certificate: "—",
		command: "—",
		technician: "—",
		filterStatus: "Unreported",
		month: year && month ? `${year}-${month}` : "",
	};
});

const statusTone: Record<VehicleState | "All", string> = {
	All: "cyan",
	Running: "emerald",
	Stopped: "rose",
	Overspeed: "orange",
	Idle: "amber",
	Unreachable: "blue",
	New: "slate",
	Inactive: "neutral",
	Unreported: "violet",
};

export default function Vehicle() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [rows, setRows] = useState(initialRows);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<VehicleState | "All">("All");
	const [clientFilter, setClientFilter] = useState("All clients");
	const [vehicleTypeFilter, setVehicleTypeFilter] = useState("All types");
	const [transporterFilter, setTransporterFilter] = useState("All transporters");
	const [monthFilter, setMonthFilter] = useState("");
	const [chartOption, setChartOption] = useState("Added");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);

	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();

		return rows.filter((row) => {
			const matchesSearch =
				!query ||
				[row.vehicleNo, row.imei, row.sim, row.client, row.transporter, row.company, row.address]
					.join(" ")
					.toLowerCase()
					.includes(query);
			const matchesStatus = statusFilter === "All" || row.filterStatus === statusFilter;
			const matchesClient = clientFilter === "All clients" || row.client === clientFilter;
			const matchesVehicleType =
				vehicleTypeFilter === "All types" || row.vehicleType === vehicleTypeFilter;
			const matchesTransporter =
				transporterFilter === "All transporters" || row.transporter === transporterFilter;
			const matchesMonth = !monthFilter || row.month === monthFilter;

			return (
				matchesSearch &&
				matchesStatus &&
				matchesClient &&
				matchesVehicleType &&
				matchesTransporter &&
				matchesMonth
			);
		});
	}, [
		rows,
		search,
		statusFilter,
		clientFilter,
		vehicleTypeFilter,
		transporterFilter,
		monthFilter,
	]);

	const statusCounts = useMemo(() => {
		const counts = Object.fromEntries(statusOptions.map((status) => [status, 0])) as Record<
			VehicleState | "All",
			number
		>;
		counts.All = rows.length;
		rows.forEach((row) => {
			counts[row.filterStatus] += 1;
		});
		return counts;
	}, [rows]);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

	const exportRows = filteredRows.map((row, index) => ({
		row,
		values: visibleColumns.map((column) =>
			column.key === "sn"
				? String(index + 1).padStart(2, "0")
				: column.key === "vehicleStatus"
					? row.filterStatus
					: row[column.key] || "—",
		),
	}));

	const downloadPdf = () => {
		try {
			const pdf = new jsPDF({ orientation: "landscape" });
			autoTable(pdf, {
				head: [visibleColumns.map((column) => column.label)],
				body: exportRows.map(({ values }) => values),
				styles: { fontSize: 7 },
				headStyles: { fillColor: [74, 32, 99] },
			});
			pdf.save("vehicles.pdf");
		} catch (error) {
			console.error("Failed to export vehicle data as PDF.", error);
			toast.error("Could not download the vehicle PDF.");
		}
	};

	const downloadExcel = () => {
		try {
			const data = exportRows.map(({ values }) =>
				Object.fromEntries(visibleColumns.map((column, index) => [column.label, values[index]])),
			);
			const worksheet = XLSX.utils.json_to_sheet(data);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicles");
			XLSX.writeFile(workbook, "vehicles.xlsx");
		} catch (error) {
			console.error("Failed to export vehicle data as Excel.", error);
			toast.error("Could not download the vehicle Excel file.");
		}
	};

	const resetFilters = () => {
		setSearch("");
		setStatusFilter("All");
		setClientFilter("All clients");
		setVehicleTypeFilter("All types");
		setTransporterFilter("All transporters");
		setMonthFilter("");
		setPage(0);
	};

	const handleAddVehicle = (values: Record<string, string>) => {
		const vehicleNo = values.vehicleNo.trim().toUpperCase();
		if (!vehicleNo) return;

		setRows((currentRows) => [
			...currentRows,
			{
				...initialRows[0],
				sn: String(currentRows.length + 1),
				vehicleNo,
				imei: values.imei || "—",
				sim: values.sim || "—",
				client: values.vehicleClient || values.client || "Unassigned",
				transporter: values.vehicleTransporter || values.company || "Unassigned",
				company: values.company || "—",
				deviceType: values.vehicleDevice || values.deviceType || "—",
				operator: values.operator || "—",
				vehicleType: values.vehicleType || "Personal Car",
				mileage: values.mileage || "—",
				overspeed: values.overspeed || "—",
				odometer: values.currentOdometer || "—",
				subscriptionStart: values.subscriptionStart || "—",
				subscriptionDue: values.subscriptionDue || "—",
				nickname: values.nickname || "—",
				remark: values.remark || "—",
				idleTimeHour: values.idleTimeHour || "",
				idleTimeMinute: values.idleTimeMinute || "",
				fuelType: values.fuelType || "",
				durationOdometer: values.durationOdometer || "",
				remark2: values.remark2 || "",
				parkingViolationAlarm: values.parkingViolationAlarm || "false",
				address: values.vehicleAddress || values.address || "—",
				filterStatus: "New",
				lastUpdated: "—",
				month: "",
			},
		]);
		setShowAddDialog(false);
		setStatusFilter("All");
		setPage(0);
	};

	const toggleColumn = (key: string) => {
		setHiddenColumns((current) =>
			current.includes(key) ? current.filter((column) => column !== key) : [...current, key],
		);
	};

	const toneClasses: Record<string, string> = {
		cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
		emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
		rose: "border-rose-200 bg-rose-50 text-rose-700",
		orange: "border-orange-200 bg-orange-50 text-orange-700",
		amber: "border-amber-200 bg-amber-50 text-amber-700",
		blue: "border-blue-200 bg-blue-50 text-blue-700",
		slate: "border-slate-200 bg-slate-100 text-slate-700",
		neutral: "border-slate-200 bg-slate-100 text-slate-700",
		violet: "border-violet-200 bg-violet-50 text-violet-700",
	};

	return (
		<div
			className={`relative min-h-screen overflow-hidden font-sans ${
				isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"
			}`}
		>
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Vehicles</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>Vehicle inventory, device status and subscriptions</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={resetFilters}
							aria-label="Refresh vehicle list"
							title="Refresh vehicle list"
							className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
								isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
							}`}
						>
							<RefreshCw className="h-4 w-4" />
						</button>
						<button
							type="button"
							aria-label="Vehicle page settings"
							title="Vehicle page settings"
							className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
								isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
							}`}
						>
							<Settings2 className="h-4 w-4" />
						</button>
					</div>
				</section>

				<section aria-label="Vehicle status filters" className="mb-4 overflow-x-auto scrollbar-none">
					<div className="flex min-w-max items-center gap-2 pb-1">
						{statusOptions.map((status) => {
							const isSelected = statusFilter === status;
							const tone = statusTone[status];
							return (
								<button
									key={status}
									type="button"
									onClick={() => {
										setStatusFilter(status);
										setPage(0);
									}}
									aria-pressed={isSelected}
									className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[10px] font-semibold transition ${
										isSelected
											? toneClasses[tone]
											: isDark
												? "border-white/[0.07] bg-[#08142e]/60 text-slate-400 hover:border-white/[0.14] hover:text-slate-200"
												: "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
									}`}
								>
									<span>{status === "All" ? "All" : status}</span>
									<span className="opacity-70">{statusCounts[status]}</span>
								</button>
							);
						})}
					</div>
				</section>

				<section aria-label="Vehicle filters" className={`mb-4 rounded-xl border p-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/65" : "border-slate-200 bg-white/90 shadow-sm"}`}>
					<div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-[1.1fr_1fr_1.1fr_1fr_1fr_auto]">
						<label className="sr-only" htmlFor="client-filter">Client</label>
						<select
							id="client-filter"
							value={clientFilter}
							onChange={(event) => { setClientFilter(event.target.value); setPage(0); }}
							className={`h-10 min-w-0 rounded-lg border px-3 text-xs outline-none transition ${
								isDark ? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
							}`}
						>
							<option>All clients</option>
							{[...new Set(rows.map((row) => row.client))].map((client) => <option key={client}>{client}</option>)}
						</select>
						<label className="sr-only" htmlFor="vehicle-type-filter">Vehicle type</label>
						<select
							id="vehicle-type-filter"
							value={vehicleTypeFilter}
							onChange={(event) => { setVehicleTypeFilter(event.target.value); setPage(0); }}
							className={`h-10 min-w-0 rounded-lg border px-3 text-xs outline-none transition ${
								isDark ? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
							}`}
						>
							<option>All types</option>
							{[...new Set(rows.map((row) => row.vehicleType))].map((type) => <option key={type}>{type}</option>)}
						</select>
						<label className="sr-only" htmlFor="transporter-filter">Transporter</label>
						<select
							id="transporter-filter"
							value={transporterFilter}
							onChange={(event) => { setTransporterFilter(event.target.value); setPage(0); }}
							className={`h-10 min-w-0 rounded-lg border px-3 text-xs outline-none transition ${
								isDark ? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
							}`}
						>
							<option>All transporters</option>
							{[...new Set(rows.map((row) => row.transporter))].map((transporter) => <option key={transporter}>{transporter}</option>)}
						</select>
						<label className="sr-only" htmlFor="state-filter">Vehicle state</label>
						<select
							id="state-filter"
							value={statusFilter}
							onChange={(event) => { setStatusFilter(event.target.value as VehicleState | "All"); setPage(0); }}
							className={`h-10 min-w-0 rounded-lg border px-3 text-xs outline-none transition ${
								isDark ? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
							}`}
						>
							{statusOptions.map((status) => <option key={status}>{status}</option>)}
						</select>
						<label className="sr-only" htmlFor="month-filter">Month</label>
						<input
							id="month-filter"
							type="month"
							value={monthFilter}
							onChange={(event) => { setMonthFilter(event.target.value); setPage(0); }}
							className={`h-10 min-w-0 rounded-lg border px-3 text-xs outline-none transition ${
								isDark ? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 focus:border-cyan-300/35 [color-scheme:dark]" : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
							}`}
						/>
						<button
							type="button"
							onClick={resetFilters}
							className={`col-span-2 flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-medium transition md:col-span-1 ${
								isDark ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.13]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
							}`}
						>
							<RotateCcw className="h-3.5 w-3.5" /> Reset
						</button>
					</div>
				</section>

				<section aria-label="Chart view options" className={`mb-4 overflow-hidden rounded-xl border ${isDark ? "border-white/[0.08] bg-[#08142e]/55" : "border-slate-200 bg-white/90"}`}>
					<div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
						<span className="shrink-0 px-1 text-xs font-medium text-slate-400">Chart view</span>
						<div className="flex min-w-0 gap-1.5 overflow-x-auto scrollbar-none">
							{chartOptions.map((option) => (
								<button
									key={option}
									type="button"
									onClick={() => setChartOption(option)}
									aria-pressed={chartOption === option}
									className={`h-9 shrink-0 rounded-lg border px-3 text-[11px] font-medium transition ${
										chartOption === option
											? isDark ? "border-cyan-300/25 bg-cyan-300/[0.09] text-cyan-100" : "border-cyan-200 bg-cyan-50 text-cyan-700"
											: isDark ? "border-white/[0.07] bg-white/[0.025] text-slate-400 hover:border-white/[0.14] hover:text-slate-200" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
									}`}
								>
									{option}
								</button>
							))}
						</div>
					</div>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input
								type="search"
								value={search}
								onChange={(event) => { setSearch(event.target.value); setPage(0); }}
								placeholder="Search vehicle, IMEI, client..."
								className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${
									isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
								}`}
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
							<label className="sr-only" htmlFor="page-size">Rows per page</label>
							<div className="relative">
								<select
									id="page-size"
									value={pageSize}
									onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }}
									className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${
										isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
									}`}
								>
									{[10, 25, 50].map((size) => <option key={size} value={size}>{size} rows</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>

							<details className="relative">
								<summary className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${
									isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
								}`}>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Columns
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div className={`absolute right-0 top-11 z-20 max-h-72 w-60 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${
									isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
								}`}>
									{columns.map((column) => (
										<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
											<input
												type="checkbox"
												checked={!hiddenColumns.includes(column.key)}
												onChange={() => toggleColumn(column.key)}
												className="h-3.5 w-3.5 accent-cyan-300"
											/>
											{column.label}
										</label>
									))}
								</div>
							</details>

							<button
								type="button"
								onClick={downloadPdf}
								className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition ${
									isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/20" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"
								}`}
							>
								<FileDown className="h-3.5 w-3.5" /> Download PDF
							</button>
							<button
								type="button"
								onClick={downloadExcel}
								className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition ${
									isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/20" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"
								}`}
							>
								<FileSpreadsheet className="h-3.5 w-3.5" /> Download Excel
							</button>

							<button
								type="button"
								onClick={() => setShowAddDialog(true)}
								className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${
									isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
								}`}
							>
								<Plus className="h-3.5 w-3.5" /> Add Vehicle
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[2500px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => (
										<th key={column.key} className="whitespace-nowrap px-3 py-3 font-medium first:px-4">
											{column.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row, rowIndex) => (
									<tr key={`${row.vehicleNo}-${row.sn}`} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => {
											const value = row[column.key] || "—";
											const isVehicleNumber = column.key === "vehicleNo";
											const isStatus = column.key === "vehicleStatus";
											return (
												<td key={column.key} className="max-w-[280px] whitespace-nowrap px-3 py-3 first:px-4">
													{isVehicleNumber ? (
														<span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{value}</span>
													) : isStatus ? (
														<span className={`rounded-md border px-2 py-1 text-[9px] ${isDark ? "border-violet-300/15 bg-violet-300/[0.07] text-violet-100" : "border-violet-200 bg-violet-50 text-violet-700"}`}>
															{row.filterStatus}
														</span>
													) : column.key === "sn" ? (
														<span className={isDark ? "text-slate-500" : "text-slate-500"}>{String(page * pageSize + rowIndex + 1).padStart(2, "0")}</span>
													) : column.key === "address" ? (
														<span className="block max-w-[250px] truncate" title={value}>{value}</span>
													) : (
														value
													)}
												</td>
											);
										})}
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
											<CarFront className={`mx-auto h-6 w-6 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
											<p className={`mt-3 text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No vehicles match these filters</p>
											<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>Try clearing a filter or changing your search.</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} vehicles
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								onClick={() => setPage((current) => Math.max(0, current - 1))}
								disabled={page === 0}
								aria-label="Previous page"
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-35`}
							>
								<ChevronLeft className="h-4 w-4" />
							</button>
							<span className={`min-w-12 text-center ${isDark ? "text-slate-300" : "text-slate-700"}`}>{page + 1} / {pageCount}</span>
							<button
								type="button"
								onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
								disabled={page >= pageCount - 1}
								aria-label="Next page"
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-35`}
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</footer>
				</section>
			</main>

			{showAddDialog && (
				<AddVehicleForm
					onClose={() => setShowAddDialog(false)}
					onSubmit={handleAddVehicle}
				/>
			)}
		</div>
	);
}
