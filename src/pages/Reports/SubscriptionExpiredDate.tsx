import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useTheme } from "next-themes";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, RefreshCw, Search, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { vehicles } from "@/components/data/vehicles";
import { useAuth } from "@/contexts/AuthContext";

type ExpiredRow = {
	id: string;
	client: string;
	vehicleNo: string;
	active: "Yes" | "No";
	transporter: string;
	subscriptionStart: string;
	subscriptionDue: string;
};

type ColumnKey = "sn" | "vehicleNo" | "active" | "transporter" | "subscriptionStart" | "subscriptionDue";
type MenuKind = "client" | "transporter";
type AppliedFilters = { clients: string[]; transporters: string[] };

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "vehicleNo", label: "Vehicle No." },
	{ key: "active", label: "Active" },
	{ key: "transporter", label: "Transporter" },
	{ key: "subscriptionStart", label: "Subscription Start" },
	{ key: "subscriptionDue", label: "Subscription Due" },
];

const clients = ["gpshouse", "arun.singh", "tushar.shukla"];
const transporters = ["Aviator", "vicky.9", "vga", "rahul.sharma"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const knownVehicles = new Set(vehicles.map((vehicle) => vehicle.vehicle));

const dummyExpiredSubscriptions: ExpiredRow[] = [
	{ id: "exp-1", client: "tushar.shukla", transporter: "rahul.sharma", vehicleNo: "UP32ER2711", active: "No", subscriptionStart: "05/08/2024", subscriptionDue: "05/08/2025" },
	{ id: "exp-2", client: "gpshouse", transporter: "Aviator", vehicleNo: "UP32HN8013", active: "Yes", subscriptionStart: "05/08/2024", subscriptionDue: "05/08/2025" },
	{ id: "exp-3", client: "gpshouse", transporter: "Aviator", vehicleNo: "UP45AC5536", active: "Yes", subscriptionStart: "18/08/2024", subscriptionDue: "18/08/2025" },
	{ id: "exp-4", client: "gpshouse", transporter: "vicky.9", vehicleNo: "UP32LU6158", active: "No", subscriptionStart: "12/03/2023", subscriptionDue: "12/03/2024" },
	{ id: "exp-5", client: "arun.singh", transporter: "vga", vehicleNo: "UP45AC6533", active: "No", subscriptionStart: "02/01/2022", subscriptionDue: "02/01/2023" },
	{ id: "exp-6", client: "arun.singh", transporter: "vga", vehicleNo: "UPHK8143", active: "Yes", subscriptionStart: "22/11/2024", subscriptionDue: "22/11/2025" },
	{ id: "exp-7", client: "gpshouse", transporter: "rahul.sharma", vehicleNo: "UP32HN8013", active: "Yes", subscriptionStart: "09/06/2025", subscriptionDue: "09/06/2026" },
	{ id: "exp-8", client: "tushar.shukla", transporter: "Aviator", vehicleNo: "UP45AC5536", active: "No", subscriptionStart: "14/02/2021", subscriptionDue: "14/02/2022" },
];

const selectionLabel = (selected: string[]) => (selected.length === 1 ? selected[0] : `${selected.length} selected`);

const dueParts = (value: string) => {
	const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
	if (!match) return null;
	return { date: value, day: match[1], month: months[Number(match[2]) - 1] ?? match[2], year: match[3] };
};

const ringArc = (cx: number, cy: number, radius: number, start: number, end: number) => {
	const large = end - start > Math.PI ? 1 : 0;
	const x1 = cx + Math.cos(start) * radius;
	const y1 = cy + Math.sin(start) * radius;
	const x2 = cx + Math.cos(end) * radius;
	const y2 = cy + Math.sin(end) * radius;
	return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
};

function ExpiredRings({ rows }: { rows: ExpiredRow[] }) {
	const parts = rows.map((row) => dueParts(row.subscriptionDue)).filter((part): part is NonNullable<ReturnType<typeof dueParts>> => part != null);
	const group = (key: (part: NonNullable<ReturnType<typeof dueParts>>) => string) => {
		const counts = new Map<string, number>();
		parts.forEach((part) => counts.set(key(part), (counts.get(key(part)) ?? 0) + 1));
		return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
	};
	const levels = [
		{ name: "year", radius: 98, width: 50, color: "#3dcea8", items: group((part) => part.year) },
		{ name: "month", radius: 156, width: 54, color: "#b6f26a", items: group((part) => `${part.month} ${part.year}`) },
		{ name: "date", radius: 218, width: 58, color: "#d4ff4a", items: group((part) => part.date) },
	];
	const signature = levels.map((level) => level.items.map(([label, count]) => `${label}:${count}`).join(",")).join("|");

	return (
		<div>
			<svg key={signature} viewBox="0 0 640 560" className="mx-auto h-auto w-full max-w-[640px]" role="img" aria-label="Subscription Expired Vehicle Year Wise">
				{levels.map((level, levelIndex) => {
					const total = level.items.reduce((sum, [, count]) => sum + count, 0);
					let angle = -Math.PI / 2;
					const full = level.items.length === 1;
					return level.items.map(([label, count], index) => {
						const sweep = total === 0 ? 0 : (count / total) * Math.PI * 2;
						const start = angle + (full ? 0 : 0.035);
						const end = angle + sweep - (full ? 0 : 0.035);
						angle += sweep;
						const mid = full ? -Math.PI / 2 : start + (end - start) / 2;
						const length = level.radius * (full ? Math.PI * 2 : Math.max(end - start, 0));
						const x = 320 + Math.cos(mid) * level.radius;
						const y = 280 + Math.sin(mid) * level.radius;
						const shown = level.name === "month" ? label.split(" ")[0] : label;
						const draw = { animation: `expired-ring 800ms cubic-bezier(0.22, 1, 0.36, 1) ${levelIndex * 160 + index * 40}ms both` };
						return (
							<g key={`${level.name}-${label}`}>
								{full ? (
									<circle cx="320" cy="280" r={level.radius} fill="none" stroke={level.color} strokeWidth={level.width} strokeDasharray={`${length} ${length}`} style={draw} />
								) : (
									<path d={ringArc(320, 280, level.radius, start, end)} fill="none" stroke={level.color} strokeWidth={level.width} strokeDasharray={`${length} ${length}`} style={draw} />
								)}
								<text x={x} y={y + 5} textAnchor="middle" fill="#102016" fontSize={shown.length > 8 ? 12 : 15} fontWeight="700" style={{ animation: `expired-label 420ms ease ${420 + levelIndex * 140}ms both` }}>
									{shown}
								</text>
							</g>
						);
					});
				})}
				<circle cx="320" cy="280" r="68" fill="#070d1c" />
				<text x="320" y="286" textAnchor="middle" fill="#f8fafc" fontSize="16" fontWeight="700">All Years</text>
			</svg>
			<style>{`@keyframes expired-ring { from { stroke-dasharray: 0 1400; opacity: 0.35; } } @keyframes expired-label { from { opacity: 0; } to { opacity: 1; } } @media (prefers-reduced-motion: reduce) { path, circle, text { animation: none !important; } }`}</style>
		</div>
	);
}

export default function SubscriptionExpiredDate() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const clientRef = useRef<HTMLDivElement>(null);
	const transporterRef = useRef<HTMLDivElement>(null);
	const [rows, setRows] = useState<ExpiredRow[]>([]);
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
			return [row.vehicleNo, row.active, row.transporter, row.subscriptionStart, row.subscriptionDue, row.client].join(" ").toLowerCase().includes(query);
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
			? dummyExpiredSubscriptions.filter((row) => knownVehicles.has(row.vehicleNo) && (selectedClients.length === 0 || selectedClients.includes(row.client)) && (selectedTransporters.length === 0 || selectedTransporters.includes(row.transporter)))
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

	const cell = (key: ColumnKey, row: ExpiredRow, serial: number) => {
		if (key === "sn") return String(serial);
		if (key === "vehicleNo") return <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{row.vehicleNo}</span>;
		if (key === "active") {
			const on = row.active === "Yes";
			return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${on ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"}`}>{row.active}</span>;
		}
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Subscription Expired Report</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{searched ? filteredRows.length : 0} reports</p>
					</div>
					<button type="button" onClick={refresh} aria-label="Refresh subscription expired report" title="Refresh subscription expired report" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}>
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
					<section className={`mb-4 rounded-xl border px-4 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:px-6 ${isDark ? "border-white/[0.09] bg-[#070d1c]" : "border-slate-200 bg-slate-950"}`}>
						<p className="mb-2 text-center text-base font-semibold tracking-wide text-white sm:text-lg">Subscription Expired Vehicle Year Wise</p>
						<ExpiredRings rows={filteredRows} />
					</section>
				)}

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${isDark ? "border-white/[0.07]" : "border-slate-200"}`}>
						<label className="relative block min-w-0 sm:w-[280px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search" aria-label="Search expired subscriptions" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
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
								<div className={`absolute right-0 top-11 z-30 max-h-64 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
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
						<table className="w-full min-w-[860px] border-collapse text-left">
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
