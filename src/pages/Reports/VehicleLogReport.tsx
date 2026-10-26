import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, RefreshCw, Search } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";

type VehicleLog = {
	id: number;
	vehicle: string;
	modifiedType: string;
	modifiedDate: string;
};

type SortKey = "sn" | "vehicle" | "modifiedDate";

const modifiedTypes = ["Vehicle", "Device", "Subscription", "Driver", "Status"];
const pageSizes = [10, 25, 50];

const logs: VehicleLog[] = [
	{ id: 1, vehicle: "UP32HN8013", modifiedType: "Vehicle", modifiedDate: "2026-10-23T10:15:00" },
	{ id: 2, vehicle: "UP45AC5536", modifiedType: "Device", modifiedDate: "2026-10-22T16:40:00" },
	{ id: 3, vehicle: "UP32LU6158", modifiedType: "Subscription", modifiedDate: "2026-09-18T09:05:00" },
	{ id: 4, vehicle: "UP45AC6533", modifiedType: "Driver", modifiedDate: "2026-08-12T14:22:00" },
	{ id: 5, vehicle: "UPHK8143", modifiedType: "Status", modifiedDate: "2026-10-19T11:48:00" },
	{ id: 6, vehicle: "UP32ER2711", modifiedType: "Vehicle", modifiedDate: "2026-07-04T18:03:00" },
];

const monthOptions = Array.from({ length: 12 }, (_, index) => {
	const date = new Date();
	date.setDate(1);
	date.setMonth(date.getMonth() - index);
	const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
	const label = date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
	return { value, label };
});

const formatDate = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleString("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

export default function VehicleLogReport() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [modifiedType, setModifiedType] = useState("");
	const [month, setMonth] = useState("");
	const [applied, setApplied] = useState({ modifiedType: "", month: "" });
	const [searched, setSearched] = useState(false);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [sortKey, setSortKey] = useState<SortKey>("modifiedDate");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

	const filteredRows = useMemo(() => {
		if (!searched) return [];
		const query = search.trim().toLowerCase();
		const matched = logs.filter((row) => {
			if (applied.modifiedType && row.modifiedType !== applied.modifiedType) return false;
			if (applied.month && !row.modifiedDate.startsWith(applied.month)) return false;
			if (!query) return true;
			return [row.vehicle, row.modifiedType, formatDate(row.modifiedDate)].join(" ").toLowerCase().includes(query);
		});
		return [...matched].sort((left, right) => {
			const result = sortKey === "vehicle"
				? left.vehicle.localeCompare(right.vehicle)
				: sortKey === "sn"
					? left.id - right.id
					: left.modifiedDate.localeCompare(right.modifiedDate);
			return sortDir === "asc" ? result : -result;
		});
	}, [applied, search, searched, sortDir, sortKey]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);
	const fromEntry = filteredRows.length === 0 ? 0 : safePage * pageSize + 1;
	const toEntry = Math.min((safePage + 1) * pageSize, filteredRows.length);

	const inputClass = `h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-slate-200 [color-scheme:dark] focus:border-cyan-300/35"
			: "border-slate-200 bg-white text-slate-800 [color-scheme:light] focus:border-cyan-400"
	}`;

	const sortBy = (key: SortKey) => {
		setSortDir((current) => (sortKey === key && current === "asc" ? "desc" : "asc"));
		setSortKey(key);
	};

	const headerCell = (key: SortKey, label: string) => (
		<th scope="col" className="whitespace-nowrap px-4 py-3 font-medium" aria-sort={sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
			<button type="button" onClick={() => sortBy(key)} className="inline-flex items-center gap-1.5">
				{label}
				<ChevronsUpDown className={`h-3.5 w-3.5 ${sortKey === key ? (isDark ? "text-cyan-200" : "text-cyan-700") : "opacity-70"}`} />
			</button>
		</th>
	);

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
						<p className={`mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>
							<Activity className="h-3.5 w-3.5" /> Reports
						</p>
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Vehicle Log Report</h1>
					</div>
					<button type="button" onClick={() => window.location.reload()} aria-label="Refresh vehicle log report" className={`flex h-9 w-9 items-center justify-center rounded-lg border ${isDark ? "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
						<RefreshCw className="h-4 w-4" />
					</button>
				</section>

				<section aria-label="Vehicle log filters" className={`mb-4 rounded-xl border p-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/65" : "border-slate-200 bg-white/90 shadow-sm"}`}>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
						<label className="sr-only" htmlFor="modified-type">Modified type</label>
						<select id="modified-type" value={modifiedType} onChange={(event) => setModifiedType(event.target.value)} className={inputClass}>
							<option value="">Select Modified Type</option>
							{modifiedTypes.map((type) => <option key={type}>{type}</option>)}
						</select>
						<label className="sr-only" htmlFor="log-month">Month</label>
						<select id="log-month" value={month} onChange={(event) => setMonth(event.target.value)} className={inputClass}>
							<option value="">Select Month</option>
							{monthOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
						</select>
						<button
							type="button"
							onClick={() => {
								setApplied({ modifiedType, month });
								setSearched(true);
								setPage(0);
							}}
							className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-5 text-xs font-semibold transition ${isDark ? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50 hover:bg-cyan-300/[0.22]" : "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"}`}
						>
							<Search className="h-3.5 w-3.5" /> Search
						</button>
					</div>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
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
								aria-label="Search vehicle logs"
								className={`h-10 w-full rounded-lg border pl-9 pr-3 text-xs outline-none ${isDark ? "border-white/[0.12] bg-[#03091c]/80 text-white placeholder:text-slate-400 focus:border-cyan-300/40" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus:border-cyan-400"}`}
							/>
						</label>
						<div className="relative sm:w-36">
							<span className={`pointer-events-none absolute inset-y-0 left-3 flex items-center text-[11px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>No of Rows</span>
							<select aria-label="No of Rows" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className={`h-9 w-full appearance-none rounded-lg border pl-3 pr-8 text-[11px] text-transparent outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 [color-scheme:dark]" : "border-slate-200 bg-white [color-scheme:light]"}`}>
								{pageSizes.map((size) => <option key={size} value={size} className={isDark ? "text-slate-200" : "text-slate-800"}>{size}</option>)}
							</select>
							<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{headerCell("sn", "SN")}
									{headerCell("vehicle", "Vehicle")}
									{headerCell("modifiedDate", "Modified Date")}
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row, index) => (
									<tr key={row.id} className={`border-b text-xs ${isDark ? "border-white/[0.06] text-slate-300 hover:bg-white/[0.025]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										<td className="px-4 py-3">{safePage * pageSize + index + 1}</td>
										<td className="px-4 py-3">{row.vehicle}</td>
										<td className="px-4 py-3">{formatDate(row.modifiedDate)}</td>
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={3} className={`px-4 py-3 text-center text-xs font-medium ${isDark ? "bg-white/[0.025] text-rose-300" : "bg-slate-50 text-rose-600"}`}>
											No data available
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between ${isDark ? "text-slate-400" : "text-slate-600"}`}>
						<span>Showing {fromEntry} to {toEntry} of {filteredRows.length} entries</span>
						<div className="flex items-center gap-2">
							<button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={safePage === 0} aria-label="Previous page" className="rounded p-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
							<button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={safePage >= pageCount - 1} aria-label="Next page" className="rounded p-1 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
						</div>
					</footer>
				</section>
			</main>
		</div>
	);
}
