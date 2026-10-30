import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useTheme } from "next-themes";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, RefreshCw, Search, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { vehicles } from "@/components/data/vehicles";
import { useAuth } from "@/contexts/AuthContext";

type SubscriptionChange = {
	id: string;
	client: string;
	transporter: string;
	vehicleNo: string;
	changedBy: string;
	changedOn: string;
	preSubDueDate: string;
	newSubDueDate: string;
	preExtendedDate: string;
	newExtendedDate: string;
};

type ColumnKey = "sn" | "vehicleNo" | "changedBy" | "changedOn" | "preSubDueDate" | "newSubDueDate" | "preExtendedDate" | "newExtendedDate";

type MenuKind = "client" | "transporter";

type AppliedFilters = {
	clients: string[];
	transporters: string[];
};

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "vehicleNo", label: "Vehicle No." },
	{ key: "changedBy", label: "Changed By" },
	{ key: "changedOn", label: "Changed On" },
	{ key: "preSubDueDate", label: "Pre Sub_Due Date" },
	{ key: "newSubDueDate", label: "New Sub_Due Date" },
	{ key: "preExtendedDate", label: "Pre. Subscription Extended Date" },
	{ key: "newExtendedDate", label: "New Subscription Extended Date" },
];

const clients = ["gpshouse", "arun.singh", "tushar.shukla"];
const transporters = ["Aviator", "vicky.9", "vga", "rahul.sharma"];

const yearOrder = ["2026", "2022", "2023", "2024", "2025"];
const yearColor: Record<string, string> = { "2022": "#3dbe86", "2023": "#c6d64a", "2024": "#2fd3ea", "2025": "#f2d431", "2026": "#f5a024" };
const yearShade: Record<string, string> = { "2022": "#1f8f5e", "2023": "#8f9a22", "2024": "#149fb3", "2025": "#b89b12", "2026": "#c56d0a" };

const dummySubscriptionChanges: SubscriptionChange[] = [
	{ id: "sub-1", client: "gpshouse", transporter: "Aviator", vehicleNo: "UP32HN8013", changedBy: "gpshouse", changedOn: "23/10/2026 10:15", preSubDueDate: "01/11/2026", newSubDueDate: "01/12/2026", preExtendedDate: "01/11/2026", newExtendedDate: "15/12/2026" },
	{ id: "sub-2", client: "gpshouse", transporter: "Aviator", vehicleNo: "UP45AC5536", changedBy: "Aviator", changedOn: "22/10/2025 16:40", preSubDueDate: "15/10/2025", newSubDueDate: "30/10/2025", preExtendedDate: "--", newExtendedDate: "--" },
	{ id: "sub-3", client: "gpshouse", transporter: "vicky.9", vehicleNo: "UP32LU6158", changedBy: "vicky.9", changedOn: "21/10/2024 09:05", preSubDueDate: "20/11/2024", newSubDueDate: "05/11/2024", preExtendedDate: "20/11/2024", newExtendedDate: "20/11/2024" },
	{ id: "sub-4", client: "arun.singh", transporter: "vga", vehicleNo: "UP45AC6533", changedBy: "arun.singh", changedOn: "20/10/2023 14:22", preSubDueDate: "12/10/2023", newSubDueDate: "12/11/2023", preExtendedDate: "--", newExtendedDate: "--" },
	{ id: "sub-5", client: "arun.singh", transporter: "vga", vehicleNo: "UPHK8143", changedBy: "vga", changedOn: "19/10/2022 11:48", preSubDueDate: "02/11/2022", newSubDueDate: "02/11/2022", preExtendedDate: "02/11/2022", newExtendedDate: "02/01/2023" },
	{ id: "sub-6", client: "tushar.shukla", transporter: "rahul.sharma", vehicleNo: "UP32ER2711", changedBy: "rahul.sharma", changedOn: "18/10/2026 18:03", preSubDueDate: "28/10/2026", newSubDueDate: "18/10/2026", preExtendedDate: "28/10/2026", newExtendedDate: "28/10/2026" },
	{ id: "sub-7", client: "gpshouse", transporter: "rahul.sharma", vehicleNo: "UP32HN8013", changedBy: "gpshouse", changedOn: "17/10/2024 08:30", preSubDueDate: "10/10/2024", newSubDueDate: "25/10/2024", preExtendedDate: "10/10/2024", newExtendedDate: "25/11/2024" },
	{ id: "sub-8", client: "tushar.shukla", transporter: "Aviator", vehicleNo: "UP45AC5536", changedBy: "tushar.shukla", changedOn: "16/10/2025 13:12", preSubDueDate: "30/11/2025", newSubDueDate: "10/11/2025", preExtendedDate: "--", newExtendedDate: "--" },
];

const knownVehicles = new Set(vehicles.map((vehicle) => vehicle.vehicle));

const selectionLabel = (selected: string[]) => (selected.length === 1 ? selected[0] : `${selected.length} selected`);

const donutSlice = (start: number, end: number, outer: number, inner: number) => {
	const large = end - start > Math.PI ? 1 : 0;
	const point = (radius: number, angle: number) => [Math.cos(angle) * radius, Math.sin(angle) * radius];
	const [x1, y1] = point(outer, start);
	const [x2, y2] = point(outer, end);
	const [x3, y3] = point(inner, end);
	const [x4, y4] = point(inner, start);
	return `M ${x1} ${y1} A ${outer} ${outer} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`;
};

function YearDonut({ rows }: { rows: SubscriptionChange[] }) {
	const counts = new Map<string, number>();
	rows.forEach((row) => {
		const year = row.changedOn.match(/\d{4}/)?.[0];
		if (!year) return;
		counts.set(year, (counts.get(year) ?? 0) + 1);
	});
	const years = [...yearOrder.filter((year) => counts.has(year)), ...[...counts.keys()].filter((year) => !yearOrder.includes(year)).sort()];
	const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
	const outer = 150;
	const inner = 52;
	const scaleY = 0.62;
	let angle = -Math.PI / 2;
	const slices = years.map((year) => {
		const sweep = total === 0 ? 0 : ((counts.get(year) ?? 0) / total) * Math.PI * 2;
		const start = angle;
		const end = angle + Math.max(sweep, 0.001);
		angle = end;
		return { year, count: counts.get(year) ?? 0, start, end, mid: start + sweep / 2 };
	});
	const signature = slices.map((slice) => `${slice.year}:${slice.count}`).join("|");

	return (
		<div>
			<svg key={signature} viewBox="0 0 760 470" className="mx-auto h-auto w-full max-w-[820px]" role="img" aria-label="Subscription Changed Vehicle Year Wise">
				<g transform="translate(380 196)">
					<g transform={`scale(1 ${scaleY})`}>
						<g transform="translate(0 36)">
							{slices.map((slice) => <path key={`side-${slice.year}`} d={donutSlice(slice.start, slice.end, outer, inner)} fill={yearShade[slice.year] ?? "#334155"} />)}
							<ellipse cx="0" cy="0" rx={inner - 1} ry={inner - 1} fill="#070d1c" />
						</g>
						{slices.map((slice, index) => (
							<g key={slice.year} style={{ transformBox: "view-box", transformOrigin: "0px 0px", animation: `year-slice 760ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 90}ms both` }}>
								<path d={donutSlice(slice.start, slice.end, outer, inner)} fill={yearColor[slice.year] ?? "#67e8f9"} />
							</g>
						))}
						<ellipse cx="0" cy="0" rx={inner - 1} ry={inner - 1} fill="#070d1c" />
					</g>
					{slices.map((slice, index) => {
						const cos = Math.cos(slice.mid);
						const sin = Math.sin(slice.mid);
						const x1 = cos * (outer + 4);
						const y1 = sin * (outer + 4) * scaleY;
						const x2 = cos * (outer + 58);
						const y2 = sin * (outer + 28) * scaleY;
						const left = cos < 0;
						const x3 = left ? Math.min(x2 - 18, -outer - 78) : Math.max(x2 + 18, outer + 78);
						return (
							<g key={`label-${slice.year}`} style={{ animation: `year-label 480ms ease ${260 + index * 70}ms both` }}>
								<polyline points={`${x1},${y1} ${x2},${y2} ${x3},${y2}`} fill="none" stroke={yearColor[slice.year] ?? "#cbd5e1"} strokeWidth="1.5" />
								<text x={left ? x3 - 8 : x3 + 8} y={y2 + 5} textAnchor={left ? "end" : "start"} fill="#f8fafc" fontSize="16" fontWeight="600">{slice.year}</text>
							</g>
						);
					})}
				</g>
			</svg>
			<style>{`@keyframes year-slice { from { opacity: 0; transform: scale(0.84); } to { opacity: 1; transform: scale(1); } } @keyframes year-label { from { opacity: 0; } to { opacity: 1; } } @media (prefers-reduced-motion: reduce) { path, g { animation: none !important; } }`}</style>
		</div>
	);
}

export default function SubscriptionChangedReport() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const clientRef = useRef<HTMLDivElement>(null);
	const transporterRef = useRef<HTMLDivElement>(null);
	const [rows, setRows] = useState<SubscriptionChange[]>([]);
	const [searched, setSearched] = useState(false);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [selectedClients, setSelectedClients] = useState<string[]>([]);
	const [selectedTransporters, setSelectedTransporters] = useState<string[]>([]);
	const [applied, setApplied] = useState<AppliedFilters>({ clients: [], transporters: [] });
	const [openMenu, setOpenMenu] = useState<MenuKind | null>(null);
	const [clientQuery, setClientQuery] = useState("");
	const [transporterQuery, setTransporterQuery] = useState("");

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return rows.filter((row) => {
			if (applied.clients.length > 0 && !applied.clients.includes(row.client)) return false;
			if (applied.transporters.length > 0 && !applied.transporters.includes(row.transporter)) return false;
			if (!query) return true;
			return [row.vehicleNo, row.changedBy, row.changedOn, row.preSubDueDate, row.newSubDueDate, row.preExtendedDate, row.newExtendedDate, row.client, row.transporter].join(" ").toLowerCase().includes(query);
		});
	}, [applied, rows, search]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);
	const visibleClients = clients.filter((name) => name.toLowerCase().includes(clientQuery.trim().toLowerCase()));
	const visibleTransporters = transporters.filter((name) => name.toLowerCase().includes(transporterQuery.trim().toLowerCase()));

	useEffect(() => {
		if (!openMenu) return;
		const onPointer = (event: MouseEvent) => {
			const target = event.target as Node;
			const menuRef = openMenu === "client" ? clientRef : transporterRef;
			if (!menuRef.current?.contains(target)) setOpenMenu(null);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpenMenu(null);
		};
		document.addEventListener("mousedown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [openMenu]);

	const toggleValue = (value: string, selected: string[], setSelected: (next: string[]) => void) => {
		setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
	};

	const applyFilters = () => {
		const ready = selectedClients.length > 0 || selectedTransporters.length > 0;
		const matched = ready
			? dummySubscriptionChanges.filter((row) => knownVehicles.has(row.vehicleNo) && (selectedClients.length === 0 || selectedClients.includes(row.client)) && (selectedTransporters.length === 0 || selectedTransporters.includes(row.transporter)))
			: [];
		setRows(matched);
		setApplied({ clients: selectedClients, transporters: selectedTransporters });
		setSearched(true);
		setOpenMenu(null);
		setPage(0);
	};

	const refresh = () => {
		setRows([]);
		setSearched(false);
		setSearch("");
		setSelectedClients([]);
		setSelectedTransporters([]);
		setApplied({ clients: [], transporters: [] });
		setClientQuery("");
		setTransporterQuery("");
		setHiddenColumns([]);
		setOpenMenu(null);
		setPage(0);
		setPageSize(10);
	};

	const menuClass = `absolute left-0 top-12 z-40 w-full min-w-[200px] overflow-hidden rounded-xl border shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`;
	const controlClass = `flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400"}`;

	const multiSelect = (
		kind: MenuKind,
		ref: RefObject<HTMLDivElement | null>,
		emptyLabel: string,
		selected: string[],
		setSelected: (next: string[]) => void,
		options: string[],
		query: string,
		setQuery: (value: string) => void,
	) => (
		<div ref={ref} className="relative min-w-0 flex-1 sm:max-w-[220px]">
			<button type="button" aria-expanded={openMenu === kind} aria-haspopup="listbox" aria-label={emptyLabel} onClick={() => setOpenMenu((current) => (current === kind ? null : kind))} className={controlClass}>
				<span className={`truncate ${selected.length === 0 ? (isDark ? "text-slate-500" : "text-slate-400") : ""}`}>{selected.length === 0 ? emptyLabel : selectionLabel(selected)}</span>
				<ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${openMenu === kind ? "rotate-180" : ""}`} />
			</button>
			{openMenu === kind && (
				<div className={menuClass}>
					<div className="p-2">
						<input value={query} onChange={(event) => setQuery(event.target.value)} aria-label={`Search ${emptyLabel}`} className={`h-9 w-full rounded-md border px-3 text-xs outline-none ${isDark ? "border-white/[0.10] bg-[#03091c]/70 text-white focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-900 focus:border-cyan-400"}`} />
					</div>
					<div className={`grid grid-cols-2 border-y text-[11px] ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
						<button type="button" onClick={() => setSelected([...new Set([...selected, ...options])])} className={`h-9 border-r font-medium transition ${isDark ? "border-white/[0.08] text-slate-300 hover:bg-cyan-300/[0.08] hover:text-cyan-100" : "border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800"}`}>
							Select All
						</button>
						<button type="button" onClick={() => setSelected([])} className={`h-9 font-medium transition ${isDark ? "text-slate-300 hover:bg-white/[0.04] hover:text-white" : "text-slate-700 hover:bg-slate-50"}`}>
							Deselect All
						</button>
					</div>
					<ul role="listbox" aria-label={emptyLabel} aria-multiselectable="true" className="max-h-48 overflow-y-auto p-1">
						{options.map((name) => (
							<li key={name}>
								<label className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
									<input type="checkbox" checked={selected.includes(name)} onChange={() => toggleValue(name, selected, setSelected)} className="h-3.5 w-3.5 accent-cyan-300" />
									{name}
								</label>
							</li>
						))}
						{options.length === 0 && <li className="px-2 py-3 text-center text-[11px] text-slate-500">Nothing found</li>}
					</ul>
				</div>
			)}
		</div>
	);

	const cell = (key: ColumnKey, row: SubscriptionChange, serial: number) => {
		if (key === "sn") return String(serial);
		if (key === "vehicleNo") return <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{row.vehicleNo}</span>;
		return row[key];
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Subscription Changed Report</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{searched ? filteredRows.length : 0} reports</p>
					</div>
					<button type="button" onClick={refresh} aria-label="Refresh subscription changed report" title="Refresh subscription changed report" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}>
						<RefreshCw className="h-4 w-4" />
					</button>
				</section>

				<section className={`mb-4 rounded-xl border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-4 ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						{multiSelect("client", clientRef, "Select Client", selectedClients, setSelectedClients, visibleClients, clientQuery, setClientQuery)}
						{multiSelect("transporter", transporterRef, "Select Transporter", selectedTransporters, setSelectedTransporters, visibleTransporters, transporterQuery, setTransporterQuery)}
						<button type="button" onClick={applyFilters} className={`h-10 rounded-lg border px-5 text-[12px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
							Search
						</button>
					</div>
				</section>

				{searched && filteredRows.length > 0 && (
					<section className={`mb-4 rounded-xl border p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-6 ${isDark ? "border-white/[0.09] bg-[#070d1c]" : "border-slate-200 bg-slate-950 text-white"}`}>
						<p className="mb-2 text-center text-base font-semibold tracking-wide text-white sm:text-lg">Subscription Changed Vehicle Year Wise</p>
						<YearDonut rows={filteredRows} />
					</section>
				)}

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${isDark ? "border-white/[0.07]" : "border-slate-200"}`}>
						<label className="relative block min-w-0 sm:w-[280px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search" aria-label="Search subscription changes" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
							{search && (
								<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<details className="relative">
								<summary className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Column Visibility
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div className={`absolute right-0 top-11 z-30 max-h-64 w-64 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
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
						<table className="w-full min-w-[1180px] border-collapse text-left">
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
										<td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-sm text-slate-500">No data available</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : safePage * pageSize + 1} to {Math.min((safePage + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} entries
						</span>
						<div className="flex items-center gap-1.5">
							<button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={safePage === 0} aria-label="Previous page" className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
								<ChevronLeft className="h-4 w-4" />
							</button>
							<span className={`min-w-12 text-center ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? "0 / 0" : `${safePage + 1} / ${pageCount}`}</span>
							<button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={safePage >= pageCount - 1 || filteredRows.length === 0} aria-label="Next page" className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</footer>
				</section>
			</main>
		</div>
	);
}
