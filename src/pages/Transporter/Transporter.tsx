import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { autoTable } from "jspdf-autotable";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { ChevronDown, ChevronLeft, ChevronRight, Columns3, FileDown, FileSpreadsheet, Plus, RefreshCw, Search } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddTransporterDialog } from "@/components/Transporter/AddTransporterDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useGetClientMasterQuery } from "@/store/services/api/Master";
import { useGetTransportersQuery } from "@/store/services/api/Transporter";

type TransporterRecord = {
	id: number;
	username: string;
	client: string;
	vehicleCount: number;
	payment: string;
	contactPerson: string;
	phone: string;
	email: string;
	company: string;
	inactiveTime: string;
	timezone: string;
};

type ColumnKey = keyof TransporterRecord;

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "id", label: "SN" },
	{ key: "username", label: "Username" },
	{ key: "client", label: "Client" },
	{ key: "vehicleCount", label: "No. of vehicles" },
	{ key: "payment", label: "Payment" },
	{ key: "contactPerson", label: "Contact Person" },
	{ key: "phone", label: "Phone No." },
	{ key: "email", label: "Email" },
	{ key: "company", label: "Company" },
	{ key: "inactiveTime", label: "Inactive Time" },
	{ key: "timezone", label: "Timezone" },
];

const inputClass = (isDark: boolean) =>
	`h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-200 placeholder:text-slate-500 focus:border-cyan-300/35 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 [color-scheme:light]"
	}`;

const actionButtonClass = (isDark: boolean) =>
	`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-semibold transition ${
		isDark
			? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50 hover:bg-cyan-300/[0.22]"
			: "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
	}`;

export default function Transporter() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: transporterList = [], isFetching, refetch } = useGetTransportersQuery();
	const { data: clientMaster = [] } = useGetClientMasterQuery();
	const rows = useMemo<TransporterRecord[]>(() => {
		const clientNames = new Map(clientMaster.map((client) => [client.id, client.name]));
		return transporterList.map((transporter, index) => ({
			id: index + 1,
			username: transporter.username ?? "",
			client: clientNames.get(transporter.client) ?? transporter.client ?? "",
			vehicleCount: 0,
			payment: "",
			contactPerson: transporter.name ?? "",
			phone: transporter.phone ?? "",
			email: transporter.email ?? "",
			company: transporter.company ?? "",
			inactiveTime: transporter.inactiveTime == null ? "" : String(transporter.inactiveTime),
			timezone: transporter.timezone ?? "",
		}));
	}, [transporterList, clientMaster]);
	const [clientFilter, setClientFilter] = useState("");
	const [transporterFilter, setTransporterFilter] = useState("");
	const [activeFilters, setActiveFilters] = useState({ client: "", transporter: "" });
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showColumns, setShowColumns] = useState(false);
	const [showAddDialog, setShowAddDialog] = useState(false);

	const clients = [...new Set(rows.map((row) => row.client).filter(Boolean))];
	const transporters = [...new Set(rows.map((row) => row.username).filter(Boolean))];
	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return rows.filter((row) => {
			const matchesSearch = !query || Object.values(row).join(" ").toLowerCase().includes(query);
			return matchesSearch &&
				(!activeFilters.client || row.client === activeFilters.client) &&
				(!activeFilters.transporter || row.username === activeFilters.transporter);
		});
	}, [rows, search, activeFilters]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

	const saveTransporter = () => {
		setShowAddDialog(false);
	};

	const toggleColumn = (key: ColumnKey) => {
		setHiddenColumns((current) =>
			current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
		);
	};

	const downloadPdf = () => {
		try {
			const pdf = new jsPDF({ orientation: "landscape" });
			autoTable(pdf, {
				head: [visibleColumns.map((column) => column.label)],
				body: filteredRows.map((row) =>
					visibleColumns.map((column) => String(row[column.key] ?? "")),
				),
				styles: { fontSize: 8 },
				headStyles: { fillColor: [74, 32, 99] },
			});
			pdf.save("transporters.pdf");
		} catch (error) {
			console.error("Failed to export transporter data as PDF.", error);
			toast.error("Could not download the transporter PDF.");
		}
	};

	const downloadExcel = () => {
		try {
			const data = filteredRows.map((row) =>
				Object.fromEntries(
					visibleColumns.map((column) => [column.label, row[column.key]]),
				),
			);
			const worksheet = XLSX.utils.json_to_sheet(data);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, "Transporters");
			XLSX.writeFile(workbook, "transporters.xlsx");
		} catch (error) {
			console.error("Failed to export transporter data as Excel.", error);
			toast.error("Could not download the transporter Excel file.");
		}
	};

	return (
		<div className={`relative min-h-screen overflow-hidden font-sans ${isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"}`}>
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.12] blur-[160px]" />
				<div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.08] blur-[170px]" />
			</div>
			<Sidebar onLogout={logout} />

			<main className="relative mx-auto max-w-[1900px] px-4 pb-8 pt-6 sm:px-6 lg:px-7 lg:pt-7">
				<section className="mb-5 flex items-center justify-between">
					<div>
						<p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Fleet operations</p>
						<div className="flex items-center gap-3">
							<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Transporter</h1>
							<span className={`rounded-full border px-2.5 py-1 text-[10px] ${isDark ? "border-white/[0.08] bg-white/[0.04] text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>{rows.length} records</span>
						</div>
					</div>
					<button type="button" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh transporters" className={`flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-60 ${isDark ? "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section aria-label="Transporter filters" className={`mb-4 rounded-xl border p-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/65" : "border-slate-200 bg-white/90 shadow-sm"}`}>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
						<label className="sr-only" htmlFor="transporter-client-filter">Client</label>
						<select id="transporter-client-filter" value={clientFilter} onChange={(event) => setClientFilter(event.target.value)} className={inputClass(isDark)}>
							<option value="">Select Client</option>
							{clients.map((client) => <option key={client}>{client}</option>)}
						</select>
						<label className="sr-only" htmlFor="transporter-name-filter">Transporter</label>
						<select id="transporter-name-filter" value={transporterFilter} onChange={(event) => setTransporterFilter(event.target.value)} className={inputClass(isDark)}>
							<option value="">Select Transporter</option>
							{transporters.map((name) => <option key={name}>{name}</option>)}
						</select>
						<button type="button" onClick={() => { setActiveFilters({ client: clientFilter, transporter: transporterFilter }); setPage(0); }} className={actionButtonClass(isDark)}>
							<Search className="h-3.5 w-3.5" /> Search
						</button>
					</div>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search transporter, client, phone..." aria-label="Search transporters" className={`h-10 w-full rounded-lg border pl-9 pr-3 text-xs outline-none ${isDark ? "border-white/[0.12] bg-[#03091c]/80 text-white placeholder:text-slate-400 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative">
								<select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
									{[10, 25, 50].map((size) => <option key={size} value={size}>{size} rows</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<div className="relative">
								<button type="button" onClick={() => setShowColumns((visible) => !visible)} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-medium ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
									<Columns3 className="h-3.5 w-3.5" /> Column Visibility <ChevronDown className="h-3 w-3" />
								</button>
								{showColumns && (
									<div className={`absolute right-0 z-30 mt-2 max-h-72 w-56 overflow-y-auto rounded-lg border p-2 shadow-xl ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
										{columns.map((column) => (
											<label key={column.key} className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.05]" : "text-slate-700 hover:bg-slate-50"}`}>
												<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => toggleColumn(column.key)} className="h-3.5 w-3.5 accent-cyan-400" />
												{column.label}
											</label>
										))}
									</div>
								)}
							</div>
							<button type="button" onClick={downloadPdf} className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/20" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"}`}>
								<FileDown className="h-3.5 w-3.5" /> Download PDF
							</button>
							<button type="button" onClick={downloadExcel} className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/20" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"}`}>
								<FileSpreadsheet className="h-3.5 w-3.5" /> Download Excel
							</button>
							<button type="button" onClick={() => setShowAddDialog(true)} className={`flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/35 bg-cyan-300/[0.16] text-cyan-50 hover:bg-cyan-300/[0.24]" : "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"}`}>
								<Plus className="h-3.5 w-3.5" /> Add
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1100px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{column.label}</th>)}
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row) => (
									<tr key={row.id} className={`border-b ${isDark ? "border-white/[0.06] text-slate-300 hover:bg-white/[0.025]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => <td key={column.key} className="whitespace-nowrap px-4 py-3 text-xs">{String(row[column.key] || "—")}</td>)}
									</tr>
								))}
								{pageRows.length === 0 && <tr><td colSpan={visibleColumns.length} className={`h-11 ${isDark ? "bg-white/[0.025]" : "bg-slate-50"}`} /></tr>}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between ${isDark ? "text-slate-400" : "text-slate-600"}`}>
						<span>Showing {filteredRows.length === 0 ? 0 : page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredRows.length)} of {filteredRows.length} entries</span>
						<div className="flex items-center gap-2">
							<button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0} aria-label="Previous page" className="rounded p-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
							<span>{page + 1} of {pageCount} pages</span>
							<button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page >= pageCount - 1} aria-label="Next page" className="rounded p-1 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
						</div>
					</footer>
				</section>
			</main>

			{showAddDialog && (
				<AddTransporterDialog isDark={isDark} onClose={() => setShowAddDialog(false)} onSave={saveTransporter} />
			)}
		</div>
	);
}
