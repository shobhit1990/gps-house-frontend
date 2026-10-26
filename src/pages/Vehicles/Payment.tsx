import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddPayment, type PaymentFormValues } from "@/components/Payment/AddPayment";
import { useAuth } from "@/contexts/AuthContext";

type PaymentRecord = PaymentFormValues & {
	id: number;
	vehicle: string;
	invoice: string;
};

type ColumnKey = "vehicle" | "invoice" | "sellingPrice" | "transporter" | "paymentTerm" | "installationDate" | "rentalDueDate" | "technicianName" | "rental" | "remark";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "vehicle", label: "Vehicle" },
	{ key: "invoice", label: "Invoice" },
	{ key: "sellingPrice", label: "Selling Price" },
	{ key: "transporter", label: "Transporter Name" },
	{ key: "paymentTerm", label: "Payment Term" },
	{ key: "installationDate", label: "Installation Date" },
	{ key: "rentalDueDate", label: "Rental Due Date" },
	{ key: "technicianName", label: "Technician Name" },
	{ key: "rental", label: "Rental" },
	{ key: "remark", label: "Remark" },
];

const transporters = ["Aviator", "vicky.9", "vga", "rahul.sharma"];

const displayDate = (value: string) => {
	const [year, month, day] = value.split("-");
	if (!year || !month || !day) return value.trim() ? value : "—";
	return `${day}/${month}/${year}`;
};

const textValue = (value: string) => (value.trim() ? value : "—");

export default function Payment() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [rows, setRows] = useState<PaymentRecord[]>([]);
	const [search, setSearch] = useState("");
	const [selectedTransporters, setSelectedTransporters] = useState<string[]>([]);
	const [appliedTransporters, setAppliedTransporters] = useState<string[]>([]);
	const [transporterOpen, setTransporterOpen] = useState(false);
	const [transporterQuery, setTransporterQuery] = useState("");
	const transporterRef = useRef<HTMLDivElement>(null);
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return rows.filter((row) => {
			if (appliedTransporters.length > 0 && !appliedTransporters.includes(row.transporter)) return false;
			if (!query) return true;
			return [row.vehicle, row.invoice, row.sellingPrice, row.transporter, row.paymentTerm, row.technicianName, row.rental, row.remark, row.type].join(" ").toLowerCase().includes(query);
		});
	}, [appliedTransporters, rows, search]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const savePayment = (values: PaymentFormValues) => {
		setRows((current) => [
			...current,
			{
				...values,
				id: current.reduce((max, row) => Math.max(max, row.id), 0) + 1,
				vehicle: "",
				invoice: "",
			},
		]);
		setSearch("");
		setPage(0);
		setShowAddDialog(false);
	};

	const cell = (key: ColumnKey, row: PaymentRecord) => {
		if (key === "transporter") return <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{textValue(row.transporter)}</span>;
		if (key === "installationDate" || key === "rentalDueDate") return displayDate(row[key]);
		if (key === "sellingPrice") return textValue(row.sellingPrice);
		return textValue(row[key]);
	};

	const visibleTransporters = transporters.filter((name) => name.toLowerCase().includes(transporterQuery.trim().toLowerCase()));
	const transporterLabel = selectedTransporters.length === 0 ? "Select Transporter" : selectedTransporters.length === 1 ? selectedTransporters[0] : `${selectedTransporters.length} transporters`;

	useEffect(() => {
		if (!transporterOpen) return;
		const onPointer = (event: MouseEvent) => {
			if (!transporterRef.current?.contains(event.target as Node)) setTransporterOpen(false);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setTransporterOpen(false);
		};
		document.addEventListener("mousedown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [transporterOpen]);

	const toggleTransporter = (name: string) => {
		setSelectedTransporters((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Payment Detail</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{rows.length} payments</p>
					</div>
					<button type="button" onClick={() => { setSearch(""); setSelectedTransporters([]); setAppliedTransporters([]); setTransporterQuery(""); setTransporterOpen(false); setPage(0); }} aria-label="Refresh payments" title="Refresh payments" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}>
						<RefreshCw className="h-4 w-4" />
					</button>
				</section>

				<div className="mb-4 flex flex-wrap items-center gap-2">
					<div ref={transporterRef} className="relative w-full sm:w-[280px]">
						<button type="button" aria-expanded={transporterOpen} aria-haspopup="listbox" onClick={() => setTransporterOpen((open) => !open)} className={`flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400"}`}>
							<span className={`truncate ${selectedTransporters.length === 0 ? (isDark ? "text-slate-500" : "text-slate-400") : ""}`}>{transporterLabel}</span>
							<ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${transporterOpen ? "rotate-180" : ""}`} />
						</button>
						{transporterOpen && (
							<div className={`absolute left-0 top-12 z-40 w-full overflow-hidden rounded-xl border shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
								<div className="p-2">
									<input value={transporterQuery} onChange={(event) => setTransporterQuery(event.target.value)} placeholder="" aria-label="Search transporter" className={`h-9 w-full rounded-md border px-3 text-xs outline-none ${isDark ? "border-white/[0.10] bg-[#03091c]/70 text-white placeholder:text-slate-600 focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-900 focus:border-cyan-400"}`} />
								</div>
								<div className={`grid grid-cols-2 border-y text-[11px] ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
									<button type="button" onClick={() => setSelectedTransporters((current) => [...new Set([...current, ...visibleTransporters])])} className={`h-9 border-r font-medium transition ${isDark ? "border-white/[0.08] text-slate-300 hover:bg-cyan-300/[0.08] hover:text-cyan-100" : "border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800"}`}>
										Select All
									</button>
									<button type="button" onClick={() => setSelectedTransporters([])} className={`h-9 font-medium transition ${isDark ? "text-slate-300 hover:bg-white/[0.04] hover:text-white" : "text-slate-700 hover:bg-slate-50"}`}>
										Deselect All
									</button>
								</div>
								<ul role="listbox" aria-label="Transporters" aria-multiselectable="true" className="max-h-48 overflow-y-auto p-1">
									{visibleTransporters.map((name) => {
										const checked = selectedTransporters.includes(name);
										return (
											<li key={name}>
												<label className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
													<input type="checkbox" checked={checked} onChange={() => toggleTransporter(name)} className="h-3.5 w-3.5 accent-cyan-300" />
													{name}
												</label>
											</li>
										);
									})}
									{visibleTransporters.length === 0 && <li className="px-2 py-3 text-center text-[11px] text-slate-500">No transporter found</li>}
								</ul>
							</div>
						)}
					</div>
					<button type="button" onClick={() => { setAppliedTransporters(selectedTransporters); setPage(0); setTransporterOpen(false); }} className={`h-10 rounded-lg border px-4 text-[12px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
						Search
					</button>
				</div>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search" aria-label="Search payment" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
							{search && (
								<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative">
								<select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 [color-scheme:dark]" : "border-slate-200 bg-white text-slate-700"}`}>
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
								<div className={`absolute right-0 top-11 z-30 max-h-52 w-52 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
									{columns.map((column) => (
										<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
											<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => setHiddenColumns((current) => (current.includes(column.key) ? current.filter((item) => item !== column.key) : [...current, column.key]))} className="h-3.5 w-3.5 accent-cyan-300" />
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
									<th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">Delete</th>
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row) => (
									<tr key={row.id} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => (
											<td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">{cell(column.key, row)}</td>
										))}
										<td className="px-3 py-3">
											<button type="button" aria-label={`Delete payment ${row.id}`} onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.14]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										</td>
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length + 1} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No payments available</p>
											<p className="mt-1 text-xs text-slate-500">Add a payment or change the transporter filter.</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} payments
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

			{showAddDialog && <AddPayment onClose={() => setShowAddDialog(false)} onSubmit={savePayment} />}
		</div>
	);
}
