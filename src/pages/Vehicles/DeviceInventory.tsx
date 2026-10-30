import { useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, Download, Plus, RotateCcw, Search, Trash2, Upload, X } from "lucide-react";
import * as XLSX from "xlsx";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddInventory, type InventoryFormValues } from "@/components/DeviceInventory/AddInventory";
import { useAuth } from "@/contexts/AuthContext";
import { useGetClientMasterQuery } from "@/store/services/api/Master";

type InventoryRecord = InventoryFormValues & {
	id: number;
	client: string;
	technician: string;
	inventoryStatus: string;
	transferBy: string;
	transferTime: string;
	added: string;
	packet: string;
	prt: string;
	transfer: string;
};

type ColumnKey =
	| "inventoryType"
	| "imei"
	| "sim"
	| "operator"
	| "secondarySim"
	| "secondarySimOperator"
	| "deviceType"
	| "client"
	| "technician"
	| "inventoryStatus"
	| "transferBy"
	| "transferTime"
	| "password"
	| "status"
	| "wirePlus"
	| "assigned"
	| "added"
	| "packet"
	| "prt"
	| "transfer";

type SummaryRow = {
	client: string;
	technician: string;
	inStock: number;
	used: number;
};

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "inventoryType", label: "Inventory Type" },
	{ key: "imei", label: "Imei" },
	{ key: "sim", label: "Sim" },
	{ key: "operator", label: "Operator" },
	{ key: "secondarySim", label: "Secondary Sim Number" },
	{ key: "secondarySimOperator", label: "Secondary Sim Operator" },
	{ key: "deviceType", label: "Device Type" },
	{ key: "client", label: "Client" },
	{ key: "technician", label: "Technician" },
	{ key: "inventoryStatus", label: "Inventory Status" },
	{ key: "transferBy", label: "Transfer By" },
	{ key: "transferTime", label: "Transfer Time" },
	{ key: "password", label: "Password" },
	{ key: "status", label: "Status" },
	{ key: "wirePlus", label: "Wire+" },
	{ key: "assigned", label: "Assigned" },
	{ key: "added", label: "Added" },
	{ key: "packet", label: "Packet" },
	{ key: "prt", label: "PRT" },
	{ key: "transfer", label: "Transfer" },
];

const statusOptions = ["All", "In Stock", "Used"];
const demoHeaders = ["Inventory Type", "Imei", "Sim", "Operator", "Secondary Sim Number", "Secondary Sim Operator", "Device Type", "Client", "Technician", "Inventory Status", "Password", "Status", "Wire+", "Assigned", "Added"] as const;

const textValue = (value: string) => (value.trim() ? value : "—");

const currentMonth = () => {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const displayMonth = (value: string) => {
	const [year, month] = value.split("-");
	if (!year || !month) return textValue(value);
	return `${month}/${year}`;
};

const sheetValue = (row: Record<string, unknown>, header: string) => String(row[header] ?? "").trim();

export default function DeviceInventory() {
	const { data: clientMaster = [] } = useGetClientMasterQuery();
	const clients = clientMaster.map((client) => client.name);
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const fileRef = useRef<HTMLInputElement>(null);
	const [tab, setTab] = useState<"Details" | "Summary">("Details");
	const [rows, setRows] = useState<InventoryRecord[]>([]);
	const [search, setSearch] = useState("");
	const [summarySearch, setSummarySearch] = useState("");
	const [clientFilter, setClientFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [month, setMonth] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [summaryPage, setSummaryPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [uploadError, setUploadError] = useState("");

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return rows.filter((row) => {
			if (clientFilter && row.client !== clientFilter) return false;
			if (statusFilter !== "All" && row.inventoryStatus !== statusFilter) return false;
			if (month && row.added !== month) return false;
			if (!query) return true;
			return [row.inventoryType, row.imei, row.sim, row.operator, row.deviceType, row.client, row.technician, row.inventoryStatus, row.password].join(" ").toLowerCase().includes(query);
		});
	}, [clientFilter, month, rows, search, statusFilter]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const summaryRows = useMemo(() => {
		const groups = new Map<string, SummaryRow>();
		rows.forEach((row) => {
			const key = `${row.client}|${row.technician}`;
			const current = groups.get(key) ?? { client: row.client, technician: row.technician, inStock: 0, used: 0 };
			if (row.inventoryStatus === "Used") current.used += 1;
			else current.inStock += 1;
			groups.set(key, current);
		});
		const query = summarySearch.trim().toLowerCase();
		return [...groups.values()].filter((row) => !query || `${row.client} ${row.technician}`.toLowerCase().includes(query));
	}, [rows, summarySearch]);
	const summaryPageCount = Math.max(1, Math.ceil(summaryRows.length / pageSize));
	const safeSummaryPage = Math.min(summaryPage, summaryPageCount - 1);
	const summaryPageRows = summaryRows.slice(safeSummaryPage * pageSize, (safeSummaryPage + 1) * pageSize);
	const inStock = rows.filter((row) => row.inventoryStatus !== "Used").length;
	const used = rows.filter((row) => row.inventoryStatus === "Used").length;
	const totalAssigned = rows.filter((row) => row.assignType.trim()).length;
	const assignedToSelf = rows.filter((row) => row.assignType === "Self").length;
	const assignedToTechnician = rows.filter((row) => row.assignType === "Technician").length;

	const nextId = (current: InventoryRecord[]) => current.reduce((max, row) => Math.max(max, row.id), 0) + 1;

	const saveInventory = (values: InventoryFormValues) => {
		setRows((current) => [
			...current,
			{
				...values,
				id: nextId(current),
				client: "",
				technician: "",
				inventoryStatus: "In Stock",
				transferBy: "",
				transferTime: "",
				added: currentMonth(),
				packet: "",
				prt: "",
				transfer: "",
			},
		]);
		setSearch("");
		setPage(0);
		setShowAddDialog(false);
	};

	const downloadDemo = () => {
		const sheet = XLSX.utils.json_to_sheet([
			{
				"Inventory Type": "GPS Device",
				Imei: "356857100874929",
				Sim: "5754190080205123",
				Operator: "Airtel Gprs (airtelgprs.com)",
				"Secondary Sim Number": "",
				"Secondary Sim Operator": "Airtel Gprs (airtelgprs.com)",
				"Device Type": "Concox (8505)",
				Client: "arun.singh",
				Technician: "",
				"Inventory Status": "In Stock",
				Password: "",
				Status: "Active",
				"Wire+": "No",
				Assigned: "Self",
				Added: currentMonth(),
			},
		], { header: [...demoHeaders] });
		const book = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(book, sheet, "Inventory");
		XLSX.writeFile(book, "inventory-demo.xlsx");
	};

	const uploadInventory = async (file: File) => {
		try {
			const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
			const sheet = book.Sheets[book.SheetNames[0]];
			const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
			const imported = parsed
				.map((row) => ({
					inventoryType: sheetValue(row, "Inventory Type"),
					imei: sheetValue(row, "Imei"),
					sim: sheetValue(row, "Sim"),
					operator: sheetValue(row, "Operator") || "Airtel Gprs (airtelgprs.com)",
					secondarySim: sheetValue(row, "Secondary Sim Number"),
					secondarySimOperator: sheetValue(row, "Secondary Sim Operator"),
					deviceType: sheetValue(row, "Device Type") || "Concox (8505)",
					assignType: sheetValue(row, "Assigned"),
					password: sheetValue(row, "Password"),
					active: sheetValue(row, "Status").toLowerCase() !== "inactive",
					ignitionWire: ["yes", "y", "true", "1"].includes(sheetValue(row, "Wire+").toLowerCase()),
					airConditionWire: false,
					analogSensor: false,
					client: sheetValue(row, "Client"),
					technician: sheetValue(row, "Technician"),
					inventoryStatus: sheetValue(row, "Inventory Status") || "In Stock",
					added: sheetValue(row, "Added") || currentMonth(),
				}))
				.filter((row) => row.inventoryType || row.imei);
			if (imported.length === 0) {
				setUploadError("The file has no inventory rows.");
				return;
			}
			setRows((current) => {
				let id = nextId(current);
				return [
					...current,
					...imported.map((row) => ({
						...row,
						id: id++,
						transferBy: "",
						transferTime: "",
						packet: "",
						prt: "",
						transfer: "",
					})),
				];
			});
			setUploadError("");
			setPage(0);
		} catch {
			setUploadError("That file could not be read. Use the demo workbook.");
		}
	};

	const resetFilters = () => {
		setClientFilter("");
		setStatusFilter("All");
		setMonth("");
		setSearch("");
		setPage(0);
	};

	const cell = (key: ColumnKey, row: InventoryRecord) => {
		if (key === "imei") return <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{textValue(row.imei)}</span>;
		if (key === "status") {
			const active = row.active;
			return <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${active ? (isDark ? "bg-emerald-400/15 text-emerald-300" : "bg-emerald-100 text-emerald-700") : (isDark ? "bg-white/[0.06] text-slate-400" : "bg-slate-100 text-slate-600")}`}>{active ? "Active" : "Inactive"}</span>;
		}
		if (key === "wirePlus") return row.ignitionWire ? "Yes" : "No";
		if (key === "assigned") return textValue(row.assignType);
		if (key === "added") return displayMonth(row.added);
		if (key === "password") return textValue(row.password);
		return textValue(String(row[key] ?? ""));
	};

	const selectClass = `h-10 w-full appearance-none rounded-lg border pl-3 pr-8 text-xs outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 [color-scheme:dark] focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"}`;
	const cardClass = `overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`;
	const quietButton = `flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-medium transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`;
	const cyanButton = `flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`;

	const pager = (currentPage: number, count: number, total: number, onPage: (page: number) => void, label: string) => (
		<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
			<span>
				Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{total === 0 ? 0 : currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, total)}</span> of {total} {label}
			</span>
			<div className="flex items-center gap-1.5">
				<button type="button" onClick={() => onPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} aria-label="Previous page" className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className={`min-w-12 text-center ${isDark ? "text-slate-300" : "text-slate-700"}`}>{currentPage + 1} / {count}</span>
				<button type="button" onClick={() => onPage(Math.min(count - 1, currentPage + 1))} disabled={currentPage >= count - 1} aria-label="Next page" className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>
		</footer>
	);

	return (
		<div className={`relative min-h-screen overflow-hidden font-sans ${isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"}`}>
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.12] blur-[160px]" />
				<div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.08] blur-[170px]" />
			</div>
			<Sidebar onLogout={logout} />

			<main className="relative mx-auto max-w-[1900px] px-4 pb-8 pt-6 sm:px-6 lg:px-7 lg:pt-7">
				<section className="mb-5">
					<p className={`mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>
						<Activity className="h-3.5 w-3.5" /> Fleet operations
					</p>
					<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Device Inventory</h1>
					<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{rows.length} devices</p>
				</section>

				<div className={`mb-4 flex w-fit rounded-lg border p-1 ${isDark ? "border-white/[0.08] bg-[#0a1630]" : "border-slate-200 bg-white"}`} role="tablist" aria-label="Inventory views">
					{(["Details", "Summary"] as const).map((item) => (
						<button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`h-8 rounded-md px-4 text-[12px] font-medium transition ${tab === item ? (isDark ? "bg-cyan-300/[0.12] text-cyan-100" : "bg-cyan-50 text-cyan-800") : (isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")}`}>
							{item}
						</button>
					))}
				</div>

				{tab === "Details" ? (
					<>
						<div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
							<div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
								<div className="relative">
									<select aria-label="Select Client" value={clientFilter} onChange={(event) => { setClientFilter(event.target.value); setPage(0); }} className={selectClass}>
										<option value="">Select Client</option>
										{clients.map((name) => <option key={name} value={name}>{name}</option>)}
									</select>
									<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								</div>
								<div className="relative">
									<select aria-label="Inventory status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(0); }} className={selectClass}>
										{statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
									</select>
									<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								</div>
								<input type="month" aria-label="Select Month" value={month} onChange={(event) => { setMonth(event.target.value); setPage(0); }} className={selectClass} />
							</div>
							<button type="button" onClick={resetFilters} className={`h-10 shrink-0 rounded-lg border px-4 text-[12px] font-semibold transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.10] text-violet-100 hover:bg-violet-300/[0.16]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
								<span className="inline-flex items-center gap-2"><RotateCcw className="h-3.5 w-3.5" /> Reset</span>
							</button>
						</div>

						<section className={cardClass}>
							<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
								<label className="relative block min-w-0 sm:w-[280px]">
									<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
									<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search" aria-label="Search inventory" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
									{search && (
										<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
											<X className="h-3.5 w-3.5" />
										</button>
									)}
								</label>
								<div className="flex flex-wrap items-center gap-2">
									<button type="button" onClick={downloadDemo} className={quietButton}><Download className="h-3.5 w-3.5" /> Download Demo Inventory</button>
									<button type="button" onClick={() => fileRef.current?.click()} className={cyanButton}><Upload className="h-3.5 w-3.5" /> Upload Inventory</button>
									<input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" aria-label="Upload inventory file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadInventory(file); event.target.value = ""; }} />
									<div className="relative">
										<select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); setSummaryPage(0); }} className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 [color-scheme:dark]" : "border-slate-200 bg-white text-slate-700"}`}>
											{[10, 25, 50].map((size) => <option key={size} value={size}>{size} rows</option>)}
										</select>
										<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
									</div>
									<details className="relative">
										<summary className={quietButton}><Columns3 className="h-3.5 w-3.5" /> Column Visibility <ChevronDown className="h-3 w-3 text-slate-500" /></summary>
										<div className={`absolute right-0 top-11 z-30 max-h-52 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
											{columns.map((column) => (
												<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
													<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => setHiddenColumns((current) => (current.includes(column.key) ? current.filter((item) => item !== column.key) : [...current, column.key]))} className="h-3.5 w-3.5 accent-cyan-300" />
													{column.label}
												</label>
											))}
										</div>
									</details>
									<button type="button" onClick={() => setShowAddDialog(true)} className={cyanButton}><Plus className="h-3.5 w-3.5" /> Add</button>
								</div>
							</div>
							{uploadError && <p role="alert" className={`mx-4 mt-3 rounded-lg border px-3 py-2 text-[12px] ${isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{uploadError}</p>}
							<div className="overflow-x-auto">
								<table className="w-full min-w-[1800px] border-collapse text-left">
									<thead>
										<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
											{visibleColumns.map((column) => <th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">{column.label}</th>)}
											<th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">Delete</th>
										</tr>
									</thead>
									<tbody>
										{pageRows.map((row) => (
											<tr key={row.id} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
												{visibleColumns.map((column) => <td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">{cell(column.key, row)}</td>)}
												<td className="px-3 py-3">
													<button type="button" aria-label={`Delete ${row.imei || row.inventoryType || "inventory"}`} onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.14]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
														<Trash2 className="h-3.5 w-3.5" />
													</button>
												</td>
											</tr>
										))}
										{pageRows.length === 0 && (
											<tr>
												<td colSpan={visibleColumns.length + 1} className="px-6 py-16 text-center">
													<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No inventory available</p>
													<p className="mt-1 text-xs text-slate-500">Add a device or change the filters.</p>
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
							{pager(safePage, pageCount, filteredRows.length, setPage, "devices")}
						</section>
					</>
				) : (
					<div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
						<section className={`${cardClass} p-4`}>
							<div className="flex flex-col items-center py-4">
								<StockDonut inStock={inStock} used={used} isDark={isDark} />
								<div className="mt-4 flex items-center gap-4 text-[10px] font-semibold tracking-wide">
									<span className="inline-flex items-center gap-1.5 text-emerald-300"><span className="h-2 w-2 rounded-sm bg-emerald-400" /> In Stock</span>
									<span className="inline-flex items-center gap-1.5 text-rose-300"><span className="h-2 w-2 rounded-sm bg-rose-400" /> Used</span>
								</div>
							</div>
							<div className="mt-2 space-y-2">
								{[
									["Total Assigned", totalAssigned],
									["Assigned to Self", assignedToSelf],
									["Assigned to Technician", assignedToTechnician],
								].map(([label, value]) => (
									<div key={String(label)} className={`rounded-lg border px-3 py-2.5 ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-slate-200 bg-slate-50"}`}>
										<p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">{label}</p>
										<p className={`mt-1 text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{value}</p>
									</div>
								))}
							</div>
						</section>

						<section className={cardClass}>
							<div className={`border-b p-3 sm:p-4 ${isDark ? "border-white/[0.07]" : "border-slate-200"}`}>
								<label className="relative block sm:w-[280px]">
									<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
									<input type="search" value={summarySearch} onChange={(event) => { setSummarySearch(event.target.value); setSummaryPage(0); }} placeholder="Search" aria-label="Search summary" className={`h-10 w-full rounded-lg border pl-9 pr-3 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400"}`} />
								</label>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full min-w-[640px] border-collapse text-left">
									<thead>
										<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
											{["SN", "Client", "Technician", "In Stock", "Used", "Total"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">{label}</th>)}
										</tr>
									</thead>
									<tbody>
										{summaryPageRows.map((row, index) => (
											<tr key={`${row.client}-${row.technician}`} className={`border-b text-[11px] last:border-0 ${isDark ? "border-white/[0.055] text-slate-300" : "border-slate-200 text-slate-700"}`}>
												<td className="px-4 py-3 text-slate-500">{String(safeSummaryPage * pageSize + index + 1).padStart(2, "0")}</td>
												<td className={`px-3 py-3 font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{textValue(row.client)}</td>
												<td className="px-3 py-3">{textValue(row.technician)}</td>
												<td className="px-3 py-3">{row.inStock}</td>
												<td className="px-3 py-3">{row.used}</td>
												<td className="px-3 py-3">{row.inStock + row.used}</td>
											</tr>
										))}
										{summaryPageRows.length === 0 && (
											<tr>
												<td colSpan={6} className="px-6 py-16 text-center">
													<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No summary available</p>
													<p className="mt-1 text-xs text-slate-500">Add inventory to see stock by client.</p>
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
							{pager(safeSummaryPage, summaryPageCount, summaryRows.length, setSummaryPage, "rows")}
						</section>
					</div>
				)}
			</main>

			{showAddDialog && <AddInventory onClose={() => setShowAddDialog(false)} onSubmit={saveInventory} />}
		</div>
	);
}

function StockDonut({ inStock, used, isDark }: { inStock: number; used: number; isDark: boolean }) {
	const total = inStock + used;
	const radius = 68;
	const circumference = 2 * Math.PI * radius;
	const stockLength = total === 0 ? 0 : (inStock / total) * circumference;
	const usedLength = total === 0 ? 0 : circumference - stockLength;
	return (
		<svg viewBox="0 0 180 180" className="h-44 w-44" role="img" aria-label={`${inStock} in stock, ${used} used`}>
			<circle cx="90" cy="90" r={radius} fill="none" stroke={isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1"} strokeWidth="12" />
			{total > 0 && (
				<>
					<circle cx="90" cy="90" r={radius} fill="none" stroke="#34d399" strokeWidth="12" strokeDasharray={`${stockLength} ${circumference - stockLength}`} transform="rotate(-90 90 90)" />
					<circle cx="90" cy="90" r={radius} fill="none" stroke="#fb7185" strokeWidth="12" strokeDasharray={`${usedLength} ${circumference - usedLength}`} strokeDashoffset={-stockLength} transform="rotate(-90 90 90)" />
				</>
			)}
		</svg>
	);
}
