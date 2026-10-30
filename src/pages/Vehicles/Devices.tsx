import { useMemo, useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Columns3,
	Plus,
	RefreshCw,
	RotateCcw,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddDevice } from "@/components/VehicleForm/AddDeviceForm";
import { AddSensorForm } from "@/components/VehicleForm/AddSensorForm";
import { useAuth } from "@/contexts/AuthContext";

type DeviceStatus = "Active" | "Inactive";

type DeviceRecord = {
	imei: string;
	sim: string;
	operator: string;
	type: string;
	client: string;
	password: string;
	status: DeviceStatus;
	ignitionWire: "C" | "P";
	assigned: "Y" | "N";
	addedMonth: string;
    added?: string;
    delete?: boolean;
};

const columns: { key: keyof DeviceRecord; label: string }[] = [
	{ key: "imei", label: "IMEI" },
	{ key: "sim", label: "SIM" },
	{ key: "operator", label: "Operator" },
	{ key: "type", label: "Type" },
	{ key: "client", label: "Client" },
	{ key: "password", label: "Password" },
	{ key: "status", label: "Status" },
	{ key: "ignitionWire", label: "Ign Wire" },
	{ key: "assigned", label: "Assigned" },
	{ key: "added", label: "Added" },
	{ key: "delete", label: "Delete" },
];

const previewDevices: DeviceRecord[] = ([
	{ imei: "12341234", sim: "1234123412342", operator: "Airtel Gprs", type: "Concox", client: "arun.singh", password: "", status: "Active", ignitionWire: "C", assigned: "N", addedMonth: "2026-02" },
	{ imei: "000000000000", sim: "0000000000001", operator: "Airtel Gprs", type: "Concox", client: "arun.singh", password: "", status: "Active", ignitionWire: "C", assigned: "N", addedMonth: "2026-02" },
	{ imei: "0000000000001", sim: "0000000000002", operator: "Airtel Gprs", type: "Concox", client: "arun.singh", password: "", status: "Active", ignitionWire: "C", assigned: "N", addedMonth: "2026-03" },
	{ imei: "0000000000002", sim: "0000000000003", operator: "Airtel Gprs", type: "Concox", client: "arun.singh", password: "", status: "Active", ignitionWire: "C", assigned: "N", addedMonth: "2026-03" },
	{ imei: "0000000000003", sim: "0000000000004", operator: "Airtel Gprs", type: "Concox", client: "arun.singh", password: "", status: "Active", ignitionWire: "C", assigned: "N", addedMonth: "2026-04" },
	{ imei: "356857100874929", sim: "5754190080205", operator: "Airtel lot", type: "EV-02", client: "gpshouse", password: "654321", status: "Active", ignitionWire: "P", assigned: "N", addedMonth: "2026-04" },
	{ imei: "354778340022949", sim: "5754190209563", operator: "Airtel lot", type: "S102A", client: "gpshouse", password: "", status: "Active", ignitionWire: "P", assigned: "Y", addedMonth: "2026-05" },
	{ imei: "35865710108871", sim: "12541412541251", operator: "Airtel lot", type: "EV-02", client: "gpshouse", password: "", status: "Active", ignitionWire: "P", assigned: "N", addedMonth: "2026-05" },
	{ imei: "356857101099179", sim: "57541900803017", operator: "Airtel lot", type: "EV-02", client: "gpshouse", password: "", status: "Active", ignitionWire: "C", assigned: "N", addedMonth: "2026-06" },
	{ imei: "123123123123123", sim: "3213213213213", operator: "Airtel Gprs", type: "Concox", client: "gpshouse", password: "", status: "Active", ignitionWire: "C", assigned: "N", addedMonth: "2026-06" },
	{ imei: "8672305202312965", sim: "5754190080000", operator: "Airtel lot", type: "Concox GT06F", client: "gpshouse", password: "", status: "Active", ignitionWire: "P", assigned: "N", addedMonth: "2026-07" },
	{ imei: "352887075130470", sim: "5754190080205", operator: "Airtel lot", type: "TK-06A", client: "gpshouse", password: "", status: "Active", ignitionWire: "P", assigned: "Y", addedMonth: "2026-08" },
] as DeviceRecord[]).map((device) => ({
	...device,
	added: `01/${device.addedMonth.slice(5)}/${device.addedMonth.slice(0, 4)}`,
	delete: true,
}));

const emptyDeviceForm = (): Record<string, string> => ({
	imei: "",
	sim: "",
	simOperator: "Airtel Gprs (airtelgprs.com)",
	secondarySim: "",
	secondarySimOperator: "Airtel Gprs (airtelgprs.com)",
	deviceType: "Concox (8505)",
	deviceClient: "",
	devicePassword: "",
	deviceActive: "true",
	ignitionPositive: "false",
	ignitionDisconnected: "false",
	airConditionPositive: "false",
	attendance: "false",
	timezoneSetting: "false",
});

const inputClass = (isDark: boolean) =>
	`h-10 min-w-0 rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 focus:border-cyan-300/35"
			: "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
	}`;

export default function Devices() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [rows, setRows] = useState(previewDevices);
	const [search, setSearch] = useState("");
	const [clientFilter, setClientFilter] = useState("All clients");
	const [statusFilter, setStatusFilter] = useState("All");
	const [monthFilter, setMonthFilter] = useState("");
	const [pageSize, setPageSize] = useState(25);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<(keyof DeviceRecord)[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [deviceStep, setDeviceStep] = useState<"device" | "sensors">("device");
	const [savedImei, setSavedImei] = useState<string | null>(null);
	const [addedSensors, setAddedSensors] = useState<string[]>([]);
	const [showSensorForm, setShowSensorForm] = useState(false);
	const [deviceForm, setDeviceForm] = useState(emptyDeviceForm);

	const clients = [...new Set(rows.map((row) => row.client))];
	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));

	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return rows.filter((row) => {
			const matchesSearch =
				!query ||
				[row.imei, row.sim, row.operator, row.type, row.client, row.password]
					.join(" ")
					.toLowerCase()
					.includes(query);
			const matchesClient = clientFilter === "All clients" || row.client === clientFilter;
			const matchesStatus = statusFilter === "All" || row.status === statusFilter;
			const matchesMonth = !monthFilter || row.addedMonth === monthFilter;
			return matchesSearch && matchesClient && matchesStatus && matchesMonth;
		});
	}, [rows, search, clientFilter, statusFilter, monthFilter]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);
	const activeCount = rows.filter((row) => row.status === "Active").length;

	const resetFilters = () => {
		setSearch("");
		setClientFilter("All clients");
		setStatusFilter("All");
		setMonthFilter("");
		setPage(0);
	};

	const toggleColumn = (key: keyof DeviceRecord) => {
		setHiddenColumns((current) =>
			current.includes(key) ? current.filter((column) => column !== key) : [...current, key],
		);
	};

	const closeAddDialog = () => {
		setShowAddDialog(false);
		setDeviceStep("device");
		setSavedImei(null);
		setAddedSensors([]);
		setShowSensorForm(false);
		setDeviceForm(emptyDeviceForm());
	};

	const handleAddDevice = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const imei = deviceForm.imei.trim();
		if (!imei) return;
		const now = new Date();
		const addedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
		const added = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
		const record: DeviceRecord = {
			imei,
			sim: deviceForm.sim.trim() || "—",
			operator: deviceForm.simOperator || "—",
			type: deviceForm.deviceType || "—",
			client: deviceForm.deviceClient || "—",
			password: deviceForm.devicePassword || "",
			status: deviceForm.deviceActive === "true" ? "Active" : "Inactive",
			ignitionWire: deviceForm.ignitionPositive === "true" ? "C" : "P",
			assigned: "N",
			addedMonth,
			added,
			delete: true,
		};

		setRows((current) => {
			if (savedImei && current.some((row) => row.imei === savedImei)) {
				return current.map((row) => (row.imei === savedImei ? record : row));
			}
			return [record, ...current];
		});
		setSavedImei(imei);
		setDeviceStep("sensors");
		setPage(0);
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
						<p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Fleet operations</p>
						<div className="flex flex-wrap items-center gap-3">
							<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Devices</h1>
							<span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${isDark ? "border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-100" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}>
								{rows.length} registered
							</span>
						</div>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>SIM, operator and device assignment inventory</p>
					</div>
					<div className="flex items-center gap-2 text-[11px] text-slate-500">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.5)]" />
						{activeCount} active devices
						<button
							type="button"
							onClick={resetFilters}
							aria-label="Refresh device list"
							title="Refresh device list"
							className={`ml-2 flex h-9 w-9 items-center justify-center rounded-lg border transition ${
								isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
							}`}
						>
							<RefreshCw className="h-4 w-4" />
						</button>
					</div>
				</section>

				<section aria-label="Device filters" className={`mb-4 rounded-xl border p-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/65" : "border-slate-200 bg-white/90 shadow-sm"}`}>
					<div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-[1fr_1fr_1fr_auto]">
						<label className="sr-only" htmlFor="device-client">Client</label>
						<select
							id="device-client"
							value={clientFilter}
							onChange={(event) => { setClientFilter(event.target.value); setPage(0); }}
							className={inputClass(isDark)}
						>
							<option>All clients</option>
							{clients.map((client) => <option key={client}>{client}</option>)}
						</select>
						<label className="sr-only" htmlFor="device-status">Status</label>
						<select
							id="device-status"
							value={statusFilter}
							onChange={(event) => { setStatusFilter(event.target.value); setPage(0); }}
							className={inputClass(isDark)}
						>
							<option>All</option>
							<option>Active</option>
							<option>Inactive</option>
						</select>
						<label className="sr-only" htmlFor="device-month">Added month</label>
						<input
							id="device-month"
							type="month"
							value={monthFilter}
							onChange={(event) => { setMonthFilter(event.target.value); setPage(0); }}
							className={`${inputClass(isDark)} ${isDark ? "[color-scheme:dark]" : "[color-scheme:light]"}`}
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

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input
								type="search"
								value={search}
								onChange={(event) => { setSearch(event.target.value); setPage(0); }}
								placeholder="Search IMEI, SIM, client..."
								className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`}
							/>
							{search && (
								<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>

						<div className="flex flex-wrap items-center gap-2">
							<label className="sr-only" htmlFor="device-page-size">Rows per page</label>
							<div className="relative">
								<select
									id="device-page-size"
									value={pageSize}
									onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }}
									className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"}`}
								>
									{[10, 25, 50].map((size) => <option key={size} value={size}>{size} rows</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>

							<details className="relative">
								<summary className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} /> Columns
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div className={`absolute right-0 top-11 z-20 w-52 rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
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
								onClick={() => setShowAddDialog(true)}
								className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
							>
								<Plus className="h-3.5 w-3.5" /> Add device
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1120px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => (
										<th key={column.key} className="whitespace-nowrap px-4 py-3 font-medium">{column.label}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{pageRows.map((device) => (
									<tr key={device.imei} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => (
											<td key={column.key} className="whitespace-nowrap px-4 py-2.5">
												{column.key === "delete" ? (
													device.delete ? (
														<button
															type="button"
															onClick={() => setRows((current) => current.filter((row) => row !== device))}
															aria-label={`Delete device ${device.imei}`}
															className={`flex h-7 w-7 items-center justify-center rounded-md transition ${isDark ? "text-slate-500 hover:bg-rose-300/[0.09] hover:text-rose-200" : "text-slate-500 hover:bg-rose-100 hover:text-rose-600"}`}
														>
															<Trash2 className="h-3.5 w-3.5" />
														</button>
													) : "—"
												) : column.key === "imei" || column.key === "sim" ? (
													<span className={`font-medium ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{device[column.key] || "—"}</span>
												) : column.key === "status" ? (
													<span className={`rounded-md border px-2 py-1 text-[9px] font-semibold ${device.status === "Active" ? (isDark ? "border-emerald-300/20 bg-emerald-300/[0.10] text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-700") : (isDark ? "border-slate-300/15 bg-slate-300/[0.06] text-slate-300" : "border-slate-200 bg-slate-100 text-slate-700")}`}>
														{device.status}
													</span>
												) : column.key === "ignitionWire" || column.key === "assigned" ? (
													<span className={`inline-flex min-w-5 justify-center rounded px-1.5 py-0.5 text-[9px] font-bold ${device[column.key] === "C" || device[column.key] === "Y" ? (isDark ? "bg-emerald-300/20 text-emerald-200" : "bg-emerald-100 text-emerald-700") : (isDark ? "bg-amber-300/20 text-amber-200" : "bg-amber-100 text-amber-700")}`}>
														{device[column.key]}
													</span>
												) : column.key === "added" ? (
													device.added || "—"
												) : (
													device[column.key] || "—"
												)}
											</td>
										))}
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
											<Search className={`mx-auto h-5 w-5 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
											<p className={`mt-3 text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No devices found</p>
											<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>Adjust the filters or search terms and try again.</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} devices
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
				<div
					className={`fixed inset-0 z-[800] flex items-center justify-center p-2 backdrop-blur-sm sm:p-4 ${
						isDark ? "bg-[#020718]/80" : "bg-slate-900/50"
					}`}
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) closeAddDialog();
					}}
				>
					<div
						className={`flex max-h-[96vh] w-full max-w-[1160px] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
							isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
						}`}
						role="dialog"
						aria-modal="true"
						aria-labelledby="device-add-title"
					>
						<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${
							isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"
						}`}>
							<div>
								<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Fleet operations</p>
								<h2 id="device-add-title" className="text-[15px] font-semibold">Add device</h2>
							</div>
							<button
								type="button"
								onClick={closeAddDialog}
								aria-label="Close device form"
								className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
							>
								<X className="h-5 w-5 stroke-[3]" />
							</button>
						</header>
						{deviceStep === "device" ? (
							<form onSubmit={handleAddDevice} className="flex min-h-0 flex-1 flex-col">
								<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
									<AddDevice
										isDark={isDark}
										values={deviceForm}
										onChange={(name, value) => setDeviceForm((current) => ({ ...current, [name]: value }))}
									/>
								</div>
								<footer className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${
									isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"
								}`}>
									<button
										type="button"
										onClick={() => setDeviceForm(emptyDeviceForm())}
										className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition ${
											isDark ? "border-white/[0.08] text-slate-300 hover:bg-white/[0.04]" : "border-slate-200 text-slate-700 hover:bg-slate-50"
										}`}
									>
										Reset
									</button>
									<button
										type="submit"
										className={`flex h-9 items-center gap-2 rounded-lg border px-4 text-[12px] font-semibold transition ${
											isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
										}`}
									>
										<Plus className="h-3.5 w-3.5" /> Save
									</button>
								</footer>
							</form>
						) : (
							<div className="flex min-h-[320px] flex-1 flex-col">
								<div className={`grid grid-cols-2 border-b text-[13px] ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
									<button
										type="button"
										onClick={() => setDeviceStep("device")}
										className={`h-12 ${isDark ? "text-slate-300 hover:bg-white/[0.03]" : "text-slate-700 hover:bg-slate-50"}`}
									>
										Add Device
									</button>
									<button
										type="button"
										aria-current="page"
										className={`h-12 font-medium ${isDark ? "bg-white/[0.06] text-white" : "bg-slate-100 text-slate-900"}`}
									>
										Add Sensor Details
									</button>
								</div>
								<div className="flex flex-1 flex-col px-5 py-5">
									{addedSensors.length > 0 && (
										<ul className={`mb-4 space-y-2 text-[12px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>
											{addedSensors.map((sensor) => (
												<li key={sensor} className={`rounded-lg border px-3 py-2 ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-slate-200 bg-slate-50"}`}>
													{sensor}
												</li>
											))}
										</ul>
									)}
									<div className="mt-auto flex justify-end">
										<button
											type="button"
											onClick={() => setShowSensorForm(true)}
											className={`inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-[12px] font-semibold transition ${
												isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
											}`}
										>
											<Plus className="h-3.5 w-3.5" /> Add Sensor
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
					{showSensorForm && (
						<AddSensorForm
							onClose={() => setShowSensorForm(false)}
							onSubmit={(sensorValues) => {
								const name = sensorValues.sensorName || "Sensor";
								setAddedSensors((current) => [...current, sensorValues.sensorType ? `${name} · ${sensorValues.sensorType}` : name]);
								setShowSensorForm(false);
							}}
						/>
					)}
				</div>
			)}
		</div>
	);
}
