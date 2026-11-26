import {useMemo, useState, useRef} from "react";
import { useCloseDetailsOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Activity, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Columns3, Loader2, RefreshCw, Search, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useGetClientMasterQuery, useGetTransporterMasterQuery } from "@/store/services/api/Master";
import {
	useLazyGetSubscriptionExpiredVehiclesQuery,
	type SubscriptionExpiredVehicle,
} from "@/store/services/api/Vehicle";

type ExpiredRow = SubscriptionExpiredVehicle;

type ColumnKey = "sn" | "vehicleNo" | "active" | "transporter" | "subscriptionStart" | "subscriptionDue";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "vehicleNo", label: "Vehicle No." },
	{ key: "active", label: "Active" },
	{ key: "transporter", label: "Transporter" },
	{ key: "subscriptionStart", label: "Subscription Start" },
	{ key: "subscriptionDue", label: "Subscription Due" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ringColors = ["#06b6d4", "#8b5cf6", "#3b82f6", "#14b8a6", "#22c55e", "#f59e0b", "#f43f5e", "#a78bfa", "#38bdf8", "#f472b6"];

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

type RingHover = { level: string; label: string; count: number; color: string } | null;

function ExpiredRings({ rows, isDark }: { rows: ExpiredRow[]; isDark: boolean }) {
	const [hover, setHover] = useState<RingHover>(null);
	const [activeLevel, setActiveLevel] = useState<"year" | "month" | "date">("year");

	const { parts, yearItems, monthItems, dateItems } = useMemo(() => {
		const parsed = rows
			.map((row) => dueParts(row.subscriptionDue))
			.filter((part): part is NonNullable<ReturnType<typeof dueParts>> => part != null);
		const group = (key: (part: NonNullable<ReturnType<typeof dueParts>>) => string) => {
			const counts = new Map<string, number>();
			parsed.forEach((part) => counts.set(key(part), (counts.get(key(part)) ?? 0) + 1));
			return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
		};
		return {
			parts: parsed,
			yearItems: group((part) => part.year),
			monthItems: group((part) => `${part.month} ${part.year}`),
			dateItems: group((part) => part.date),
		};
	}, [rows]);

	const theme = isDark
		? {
				center: "#0a1530",
				centerStroke: "rgba(34,211,238,0.35)",
				centerText: "#f8fafc",
				centerSub: "#94a3b8",
				track: "rgba(255,255,255,0.045)",
				label: "#0f172a",
				glow: "rgba(34,211,238,0.18)",
				guide: "rgba(148,163,184,0.18)",
			}
		: {
				center: "#ffffff",
				centerStroke: "rgba(8,145,178,0.28)",
				centerText: "#0f172a",
				centerSub: "#64748b",
				track: "rgba(15,23,42,0.045)",
				label: "#ffffff",
				glow: "rgba(6,182,212,0.14)",
				guide: "rgba(100,116,139,0.16)",
			};

	const levels = [
		{ name: "year" as const, label: "Year", radius: 96, width: 42, accent: "#06b6d4", items: yearItems },
		{ name: "month" as const, label: "Month", radius: 152, width: 46, accent: "#8b5cf6", items: monthItems },
		{ name: "date" as const, label: "Date", radius: 212, width: 50, accent: "#3b82f6", items: dateItems },
	];

	const signature = levels.map((level) => level.items.map(([label, count]) => `${label}:${count}`).join(",")).join("|");
	const totalVehicles = parts.length;
	const activeCount = rows.filter((row) => row.active === "Yes").length;
	const inactiveCount = rows.length - activeCount;
	const topYear = yearItems[0];
	const breakdown = levels.find((level) => level.name === activeLevel) ?? levels[0];
	const maxBreakdown = Math.max(...breakdown.items.map(([, count]) => count), 1);
	const centerTitle = hover ? hover.count : totalVehicles;
	const centerSub = hover ? hover.label : "Expired vehicles";

	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-center">
			<div className="relative">
				<div
					className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
					style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 68%)` }}
				/>
				<svg key={signature} viewBox="0 0 640 560" className="relative mx-auto h-auto w-full max-w-[520px]" role="img" aria-label="Subscription Expired Vehicle Year Wise">
					<defs>
						<filter id="expired-glow" x="-40%" y="-40%" width="180%" height="180%">
							<feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
							<feMerge>
								<feMergeNode in="coloredBlur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>

					{levels.map((level) => (
						<circle key={`track-${level.name}`} cx="320" cy="280" r={level.radius} fill="none" stroke={theme.track} strokeWidth={level.width} />
					))}

					{levels.map((level, levelIndex) => {
						const total = level.items.reduce((sum, [, count]) => sum + count, 0);
						let angle = -Math.PI / 2;
						const full = level.items.length === 1;
						return level.items.map(([label, count], index) => {
							const sweep = total === 0 ? 0 : (count / total) * Math.PI * 2;
							const gap = full ? 0 : Math.min(0.04, sweep * 0.12);
							const start = angle + gap;
							const end = angle + sweep - gap;
							angle += sweep;
							const mid = full ? -Math.PI / 2 : start + (end - start) / 2;
							const length = level.radius * (full ? Math.PI * 2 : Math.max(end - start, 0));
							const color = ringColors[index % ringColors.length];
							const isHovered = hover?.level === level.name && hover.label === label;
							const dimmed = hover != null && !isHovered;
							const x = 320 + Math.cos(mid) * level.radius;
							const y = 280 + Math.sin(mid) * level.radius;
							const shown = level.name === "month" ? label.split(" ")[0] : level.name === "date" ? label.slice(0, 5) : label;
							const draw = {
								animation: `expired-ring 900ms cubic-bezier(0.22, 1, 0.36, 1) ${levelIndex * 140 + index * 35}ms both`,
								opacity: dimmed ? 0.28 : 1,
								filter: isHovered ? "url(#expired-glow)" : undefined,
								transition: "opacity 180ms ease, stroke-width 180ms ease",
								cursor: "pointer",
							};
							const strokeWidth = isHovered ? level.width + 6 : level.width;
							const common = {
								fill: "none" as const,
								stroke: color,
								strokeWidth,
								strokeLinecap: "round" as const,
								strokeDasharray: `${length} ${length}`,
								style: draw,
								onMouseEnter: () => setHover({ level: level.name, label, count, color }),
								onMouseLeave: () => setHover(null),
								onFocus: () => setHover({ level: level.name, label, count, color }),
								onBlur: () => setHover(null),
							};
							return (
								<g key={`${level.name}-${label}`}>
									{full ? (
										<circle cx="320" cy="280" r={level.radius} {...common} />
									) : (
										<path d={ringArc(320, 280, level.radius, start, end)} {...common} />
									)}
									{(end - start > 0.28 || full) && (
										<text
											x={x}
											y={y + 4}
											textAnchor="middle"
											fill={theme.label}
											fontSize={shown.length > 7 ? 10 : 12}
											fontWeight="700"
											pointerEvents="none"
											style={{ animation: `expired-label 420ms ease ${420 + levelIndex * 120}ms both`, opacity: dimmed ? 0.35 : 1 }}
										>
											{shown}
										</text>
									)}
								</g>
							);
						});
					})}

					<circle cx="320" cy="280" r="78" fill={theme.center} stroke={theme.centerStroke} strokeWidth="2.5" />
					<circle cx="320" cy="280" r="68" fill="none" stroke={theme.guide} strokeWidth="1" strokeDasharray="3 5" />
					<text x="320" y="268" textAnchor="middle" fill={theme.centerText} fontSize={String(centerTitle).length > 4 ? 20 : 26} fontWeight="800">
						{centerTitle}
					</text>
					<text x="320" y="292" textAnchor="middle" fill={hover?.color ?? theme.centerSub} fontSize="11" fontWeight="600">
						{centerSub.length > 18 ? `${centerSub.slice(0, 16)}…` : centerSub}
					</text>
				</svg>
			</div>

			<div className="flex flex-col gap-3">
				<div className="grid grid-cols-3 gap-2.5">
					{[
						{ label: "Total", value: rows.length, tone: isDark ? "text-cyan-200" : "text-cyan-700" },
						{ label: "Active", value: activeCount, tone: isDark ? "text-emerald-300" : "text-emerald-600" },
						{ label: "Inactive", value: inactiveCount, tone: isDark ? "text-rose-300" : "text-rose-600" },
					].map((stat) => (
						<div
							key={stat.label}
							className={`rounded-xl border px-3 py-3 text-center ${
								isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-slate-200 bg-slate-50/80"
							}`}
						>
							<p className={`text-lg font-bold tracking-tight ${stat.tone}`}>{stat.value}</p>
							<p className={`mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${isDark ? "text-slate-500" : "text-slate-500"}`}>{stat.label}</p>
						</div>
					))}
				</div>

				{topYear && (
					<div className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${isDark ? "border-cyan-300/15 bg-cyan-300/[0.06]" : "border-cyan-100 bg-cyan-50/70"}`}>
						<div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isDark ? "bg-cyan-300/10 text-cyan-200" : "bg-white text-cyan-700 shadow-sm"}`}>
							<CalendarDays className="h-4 w-4" />
						</div>
						<div className="min-w-0">
							<p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Peak expiry year</p>
							<p className={`truncate text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
								{topYear[0]} · {topYear[1]} vehicles
							</p>
						</div>
					</div>
				)}

				<div className={`rounded-xl border p-3 ${isDark ? "border-white/[0.08] bg-white/[0.025]" : "border-slate-200 bg-white"}`}>
					<div className={`mb-3 flex gap-1 rounded-lg p-1 ${isDark ? "bg-[#03091c]/70" : "bg-slate-100"}`}>
						{levels.map((level) => {
							const selected = activeLevel === level.name;
							return (
								<button
									key={level.name}
									type="button"
									onClick={() => setActiveLevel(level.name)}
									className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
										selected
											? isDark
												? "bg-cyan-300/15 text-cyan-100 shadow-sm"
												: "bg-white text-cyan-700 shadow-sm"
											: isDark
												? "text-slate-400 hover:text-slate-200"
												: "text-slate-500 hover:text-slate-700"
									}`}
								>
									{level.label}
								</button>
							);
						})}
					</div>

					<div className="max-h-[220px] space-y-2.5 overflow-y-auto pr-1">
						{breakdown.items.slice(0, 8).map(([label, count], index) => {
							const color = ringColors[index % ringColors.length];
							const pct = Math.round((count / totalVehicles) * 100);
							return (
								<div key={label} className="group">
									<div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
										<span className={`truncate font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{label}</span>
										<span className={isDark ? "text-slate-400" : "text-slate-500"}>
											{count} <span className="text-[10px] opacity-70">({pct}%)</span>
										</span>
									</div>
									<div className={`h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/[0.06]" : "bg-slate-100"}`}>
										<div
											className="h-full rounded-full transition-all duration-500"
											style={{
												width: `${(count / maxBreakdown) * 100}%`,
												background: `linear-gradient(90deg, ${color}, ${color}aa)`,
												animation: `expired-bar 700ms ease ${index * 45}ms both`,
											}}
										/>
									</div>
								</div>
							);
						})}
						{breakdown.items.length === 0 && (
							<p className={`py-6 text-center text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>No breakdown available</p>
						)}
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					{levels.map((level) => (
						<div
							key={level.name}
							className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
								isDark ? "border-white/[0.08] bg-white/[0.03] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"
							}`}
						>
							<span className="h-2 w-2 rounded-full" style={{ backgroundColor: level.accent }} />
							{level.label} ring · {level.items.length}
						</div>
					))}
				</div>
			</div>

			<style>{`
				@keyframes expired-ring { from { stroke-dasharray: 0 1400; opacity: 0.25; } }
				@keyframes expired-label { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
				@keyframes expired-bar { from { width: 0; opacity: 0.4; } }
				@media (prefers-reduced-motion: reduce) {
					path, circle, text, div { animation: none !important; }
				}
			`}</style>
		</div>
	);
}

export default function SubscriptionExpiredDate() {
	const { data: clients = [] } = useGetClientMasterQuery();
	const [selectedClient, setSelectedClient] = useState("");
	const columnVisibilityRef = useRef<HTMLDetailsElement>(null);
	useCloseDetailsOnOutsideClick(columnVisibilityRef);
	const [selectedTransporter, setSelectedTransporter] = useState("");
	const { data: transporters = [], isFetching: transportersLoading } = useGetTransporterMasterQuery(
		selectedClient ? { client: selectedClient } : undefined,
		{ skip: !selectedClient },
	);
	const [fetchExpired, { isFetching }] = useLazyGetSubscriptionExpiredVehiclesQuery();
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [rows, setRows] = useState<ExpiredRow[]>([]);
	const [searched, setSearched] = useState(false);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) =>
			[row.vehicleNo, row.active, row.transporter, row.subscriptionStart, row.subscriptionDue, row.client]
				.join(" ")
				.toLowerCase()
				.includes(query),
		);
	}, [rows, search]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const applyFilters = async () => {
		if (!selectedClient || !selectedTransporter) {
			toast.error("Select Client and Transporter to search.");
			return;
		}
		try {
			const matched = await fetchExpired({
				client: selectedClient,
				transporter: selectedTransporter,
			}).unwrap();
			setRows(matched);
			setSearched(true);
			setPage(0);
		} catch (error) {
			console.error("Failed to load subscription expired report.", error);
			toast.error(apiErrorMessage(error, "Could not load subscription expired report."));
			setRows([]);
			setSearched(true);
		}
	};

	const refresh = () => {
		setRows([]);
		setSearched(false);
		setSearch("");
		setSelectedClient("");
		setSelectedTransporter("");
		setHiddenColumns([]);
		setPage(0);
		setPageSize(10);
	};

	const labelClass = `mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;
	const selectClass = `h-10 w-full appearance-none rounded-lg border px-3 pr-8 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/35 [color-scheme:dark]" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400"}`;

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
					<div className="flex flex-col gap-2 sm:flex-row sm:items-end">
						<label className="relative block min-w-0 flex-1 sm:max-w-[220px]">
							<span className={labelClass}>Client</span>
							<select
								aria-label="Select Client"
								value={selectedClient}
								onChange={(event) => {
									setSelectedClient(event.target.value);
									setSelectedTransporter("");
								}}
								className={selectClass}
							>
								<option value="">Select Client</option>
								{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
							</select>
							<ChevronDown className="pointer-events-none absolute bottom-3 right-3 h-3.5 w-3.5 text-slate-500" />
						</label>
						<label className="relative block min-w-0 flex-1 sm:max-w-[220px]">
							<span className={labelClass}>Transporter</span>
							<select
								aria-label="Select Transporter"
								value={selectedTransporter}
								onChange={(event) => setSelectedTransporter(event.target.value)}
								disabled={!selectedClient || transportersLoading}
								className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-60`}
							>
								<option value="">{!selectedClient ? "Select Client first" : transportersLoading ? "Loading…" : "Select Transporter"}</option>
								{transporters.map((transporter) => <option key={transporter.id} value={transporter.id}>{transporter.name}</option>)}
							</select>
							<ChevronDown className="pointer-events-none absolute bottom-3 right-3 h-3.5 w-3.5 text-slate-500" />
						</label>
						<button type="button" onClick={() => void applyFilters()} disabled={isFetching} className={`flex h-10 items-center gap-2 rounded-lg border px-5 text-[12px] font-semibold transition disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
							{isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
							Search
						</button>
					</div>
				</section>

				{searched && filteredRows.length > 0 && (
					<section className={`mb-4 overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.18)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
						<header className={`flex flex-col gap-2 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.05] via-transparent to-violet-400/[0.05]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
							<div>
								<p className={`text-sm font-semibold tracking-tight sm:text-base ${isDark ? "text-white" : "text-slate-900"}`}>Subscription Expired Vehicle Year Wise</p>
								<p className={`mt-0.5 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Hover rings for segment details · switch tabs for breakdown</p>
							</div>
							<span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${isDark ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}>
								<span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
								Live chart
							</span>
						</header>
						<div className="px-4 py-5 sm:px-6 sm:py-6">
							<ExpiredRings rows={filteredRows} isDark={isDark} />
						</div>
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
							<details ref={columnVisibilityRef} className="relative">
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
										<td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-sm text-slate-500">
											{isFetching ? "Loading…" : searched ? "No data available" : "Select Client and Transporter, then Search"}
										</td>
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
