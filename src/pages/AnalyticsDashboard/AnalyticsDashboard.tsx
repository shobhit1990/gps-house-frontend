import { useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import {
	Activity,
	ArrowDownRight,
	ArrowUpRight,
	BarChart3,
	CalendarDays,
	CarFront,
	Clock3,
	Gauge,
	MapPinned,
	RefreshCw,
	Route,
	Search,
	Sparkles,
	type LucideIcon,
} from "lucide-react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import {
	useGetClientMasterQuery,
	useGetTransporterMasterQuery,
	useGetVehicleMasterQuery,
} from "@/store/services/api/Master";

const mileage = [34, 24, 61, 44, 120, 350, 480];
const duration = [2.4, 1.3, 3.2, 2.1, 3.2, 8.5, 11.4];
const chartData = mileage.map((distance, index) => {
	const day = new Date();
	day.setDate(day.getDate() - (mileage.length - index - 1));
	return {
		date: day.toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
		mileage: distance,
		duration: duration[index],
	};
});

const totalDistance = mileage.reduce((sum, value) => sum + value, 0);
const totalHours = duration.reduce((sum, value) => sum + value, 0);
const totalDuration = `${Math.floor(totalHours)}h ${Math.round((totalHours % 1) * 60)}m`;

const panelClass = (isDark: boolean) =>
	`rounded-2xl border shadow-[0_20px_55px_rgba(0,0,0,0.12)] ${
		isDark
			? "border-white/[0.08] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90"
			: "border-slate-200/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
	}`;

function MetricCard({
	label,
	value,
	detail,
	icon: Icon,
	tone,
	isDark,
}: {
	label: string;
	value: string;
	detail: string;
	icon: LucideIcon;
	tone: "cyan" | "violet" | "blue" | "emerald";
	isDark: boolean;
}) {
	const colors = {
		cyan: isDark ? "border-cyan-300/15 bg-cyan-300/[0.09] text-cyan-200" : "border-cyan-200 bg-cyan-50 text-cyan-700",
		violet: isDark ? "border-violet-300/15 bg-violet-300/[0.09] text-violet-200" : "border-violet-200 bg-violet-50 text-violet-700",
		blue: isDark ? "border-blue-300/15 bg-blue-300/[0.09] text-blue-200" : "border-blue-200 bg-blue-50 text-blue-700",
		emerald: isDark ? "border-emerald-300/15 bg-emerald-300/[0.09] text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-700",
	};
	return (
		<article className={`${panelClass(isDark)} group relative overflow-hidden p-4 transition duration-200 hover:-translate-y-0.5`}>
			<div className={`absolute -right-7 -top-8 h-24 w-24 rounded-full opacity-30 blur-2xl ${tone === "cyan" ? "bg-cyan-400" : tone === "violet" ? "bg-violet-400" : tone === "blue" ? "bg-blue-400" : "bg-emerald-400"}`} />
			<div className="relative flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
					<p className={`mt-2 text-2xl font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>{value}</p>
					<p className={`mt-1.5 text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>{detail}</p>
				</div>
				<span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${colors[tone]}`}>
					<Icon className="h-[18px] w-[18px]" />
				</span>
			</div>
		</article>
	);
}

function ChartPanel({ title, description, isDark, children }: { title: string; description: string; isDark: boolean; children: ReactNode }) {
	return (
		<section className={`${panelClass(isDark)} min-w-0 overflow-hidden`}>
			<div className={`flex items-start justify-between gap-4 border-b px-5 py-4 ${isDark ? "border-white/[0.07]" : "border-slate-100"}`}>
				<div>
					<h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h2>
					<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>{description}</p>
				</div>
				<span className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium ${isDark ? "border-white/[0.08] bg-white/[0.03] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>Daily</span>
			</div>
			<div className="h-[300px] w-full px-2 pb-3 pt-5 sm:h-[340px] sm:px-4">{children}</div>
		</section>
	);
}


export default function AnalyticsDashboard() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: clients = [] } = useGetClientMasterQuery();
	const { data: transporters = [] } = useGetTransporterMasterQuery();
	const { data: vehicles = [] } = useGetVehicleMasterQuery();
	const [client, setClient] = useState("");
	const [transporter, setTransporter] = useState("");
	const [vehicle, setVehicle] = useState("");
	const [filtersApplied, setFiltersApplied] = useState(false);
	const [dates, setDates] = useState(() => {
		const to = new Date();
		const from = new Date();
		from.setDate(to.getDate() - 6);
		return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
	});

	const applyFilters = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFiltersApplied(true);
	};
	const resetFilters = () => {
		setClient("");
		setTransporter("");
		setVehicle("");
		setFiltersApplied(false);
	};

	const selectClass = `h-11 w-full appearance-none rounded-xl border px-3.5 text-xs outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/65 text-slate-200 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08]"
			: "border-slate-200 bg-white text-slate-700 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const axisColor = isDark ? "#64748b" : "#94a3b8";
	const gridColor = isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.2)";
	const tooltipStyle = {
		background: isDark ? "#0b1835" : "#ffffff",
		border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0"}`,
		borderRadius: 12,
		color: isDark ? "#e2e8f0" : "#0f172a",
		fontSize: 12,
		boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
	};

	return (
		<div className={`relative min-h-screen overflow-hidden font-sans ${isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"}`}>
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.13] blur-[160px]" />
				<div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.09] blur-[170px]" />
				<div className="absolute bottom-[-320px] left-[35%] h-[500px] w-[700px] rounded-full bg-blue-700/[0.08] blur-[180px]" />
			</div>

			<Sidebar onLogout={logout} />

			<main className="relative mx-auto max-w-[1900px] px-4 pb-8 pt-6 sm:px-6 lg:px-7 lg:pt-8">
				<header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						<div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] ${isDark ? "border-cyan-300/15 bg-gradient-to-r from-cyan-300/[0.09] to-violet-400/[0.08] text-cyan-100" : "border-cyan-200 bg-gradient-to-r from-cyan-50 to-violet-50 text-cyan-800"}`}>
							<Sparkles className="h-3 w-3" /> Fleet insights
						</div>
						<h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${isDark ? "text-white" : "text-slate-900"}`}>Analytics Dashboard</h1>
						<p className={`mt-1.5 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Understand distance and driving time across your fleet.</p>
					</div>
					<div className={`inline-flex w-fit items-center gap-2 rounded-xl border px-3 py-2 text-xs ${isDark ? "border-white/[0.08] bg-[#08142e]/70 text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>
						<Activity className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200" : "text-cyan-700"}`} /> Preview data
					</div>
				</header>

				<form onSubmit={applyFilters} className={`${panelClass(isDark)} mb-5 p-4 sm:p-5`}>
					<div className="mb-3 flex items-center justify-between gap-3">
						<div className="flex items-center gap-2">
							<span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isDark ? "bg-cyan-300/[0.09] text-cyan-200" : "bg-cyan-50 text-cyan-700"}`}><CalendarDays className="h-4 w-4" /></span>
							<div>
								<h2 className={`text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Filter analytics</h2>
								<p className={`mt-0.5 text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>Choose a fleet segment and time period</p>
							</div>
						</div>
						{filtersApplied && <span className={`text-[10px] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Filters selected</span>}
					</div>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto_auto]">
						<select aria-label="Select client" value={client} onChange={(event) => setClient(event.target.value)} className={selectClass}>
							<option value="">All clients</option>
							{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
						</select>
						<select aria-label="Select transporter" value={transporter} onChange={(event) => setTransporter(event.target.value)} className={selectClass}>
							<option value="">All transporters</option>
							{transporters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
						</select>
						<select aria-label="Select vehicle" value={vehicle} onChange={(event) => setVehicle(event.target.value)} className={selectClass}>
							<option value="">All vehicles</option>
							{vehicles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
						</select>
						<div className={`flex h-11 min-w-0 items-center gap-2 rounded-xl border px-3 ${isDark ? "border-white/[0.09] bg-[#03091c]/65" : "border-slate-200 bg-white"}`}>
							<input aria-label="From date" type="date" value={dates.from} onChange={(event) => setDates((current) => ({ ...current, from: event.target.value }))} className={`min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
							<span className="text-[10px] text-slate-500">to</span>
							<input aria-label="To date" type="date" value={dates.to} onChange={(event) => setDates((current) => ({ ...current, to: event.target.value }))} className={`min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
						</div>
						<button type="submit" className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-semibold transition ${isDark ? "bg-cyan-300 text-[#061328] shadow-[0_8px_24px_rgba(34,211,238,0.16)] hover:bg-cyan-200" : "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(14,116,144,0.18)] hover:bg-primary/90"}`}>
							<Search className="h-4 w-4" /> Apply
						</button>
						<button type="button" onClick={resetFilters} aria-label="Reset filters" title="Reset filters" className={`inline-flex h-11 items-center justify-center rounded-xl border px-3 transition ${isDark ? "border-white/[0.09] bg-white/[0.03] text-slate-400 hover:text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>
							<RefreshCw className="h-4 w-4" />
						</button>
					</div>
				</form>

				<section aria-label="Fleet analytics summary" className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<MetricCard label="Distance travelled" value={`${totalDistance.toLocaleString()} km`} detail="↑ 14.8% vs previous period" icon={Route} tone="cyan" isDark={isDark} />
					<MetricCard label="Total duration" value={totalDuration} detail="Across selected vehicles" icon={Clock3} tone="violet" isDark={isDark} />
					<MetricCard label="Daily average" value={`${Math.round(totalDistance / chartData.length)} km`} detail="Average distance per day" icon={Gauge} tone="blue" isDark={isDark} />
					<MetricCard label="Vehicles tracked" value={vehicle ? "01" : "07"} detail="Active in this period" icon={CarFront} tone="emerald" isDark={isDark} />
				</section>

				<section aria-label="Daily analytics charts" className="mb-5 grid gap-4 xl:grid-cols-2">
					<ChartPanel title="Mileage" description="Daily distance travelled · kilometres" isDark={isDark}>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap="34%">
								<defs><linearGradient id="mileageFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs>
								<CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="4 5" />
								<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 11 }} dy={10} />
								<YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} tickFormatter={(value: number) => `${value} km`} width={56} />
								<Tooltip cursor={{ fill: isDark ? "rgba(34,211,238,0.05)" : "rgba(14,116,144,0.05)" }} contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toLocaleString()} km`, "Distance"]} />
								<Bar dataKey="mileage" fill="url(#mileageFill)" radius={[7, 7, 2, 2]} maxBarSize={38} />
							</BarChart>
						</ResponsiveContainer>
					</ChartPanel>
					<ChartPanel title="Duration" description="Daily driving time · hours" isDark={isDark}>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap="34%">
								<defs><linearGradient id="durationFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
								<CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="4 5" />
								<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 11 }} dy={10} />
								<YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} tickFormatter={(value: number) => `${value} hr`} width={48} />
								<Tooltip cursor={{ fill: isDark ? "rgba(129,140,248,0.06)" : "rgba(99,102,241,0.05)" }} contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toFixed(1)} hr`, "Duration"]} />
								<Bar dataKey="duration" fill="url(#durationFill)" radius={[7, 7, 2, 2]} maxBarSize={38} />
							</BarChart>
						</ResponsiveContainer>
					</ChartPanel>
				</section>

				<section aria-label="Trip highlights" className="grid gap-4 xl:grid-cols-2">
					<HighlightPanel title="Distance Travelled" subtitle="Top and low mileage in this period" icon={MapPinned} isDark={isDark}>
						<Highlight label="Longest distance" vehicle="UP32 HN 8013" value="480 km" note="+18.4%" positive isDark={isDark} />
						<Highlight label="Shortest distance" vehicle="UP32 HN 8013" value="24 km" note="Low usage" positive={false} isDark={isDark} />
					</HighlightPanel>
					<HighlightPanel title="Total Duration" subtitle="Longest and shortest driving time" icon={Clock3} isDark={isDark}>
						<Highlight label="Longest duration" vehicle="UP32 HN 8013" value="11h 24m" note="+12.6%" positive isDark={isDark} />
						<Highlight label="Shortest duration" vehicle="UP32 HN 8013" value="1h 18m" note="Low activity" positive={false} isDark={isDark} />
					</HighlightPanel>
				</section>
				<p className={`mt-4 text-center text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>Charts and summary values are illustrative UI preview data.</p>
			</main>
		</div>
	);
}

function HighlightPanel({ title, subtitle, icon: Icon, isDark, children }: {
	title: string;
	subtitle: string;
	icon: LucideIcon;
	isDark: boolean;
	children: ReactNode;
}) {
	return (
		<section className={`${panelClass(isDark)} p-5`}>
			<div className="mb-4 flex items-center gap-2.5">
				<span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? "bg-cyan-300/[0.09] text-cyan-200" : "bg-cyan-50 text-cyan-700"}`}><Icon className="h-4 w-4" /></span>
				<div>
					<h2 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h2>
					<p className={`mt-0.5 text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>{subtitle}</p>
				</div>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">{children}</div>
		</section>
	);
}

function Highlight({ label, vehicle, value, note, positive, isDark }: {
	label: string;
	vehicle: string;
	value: string;
	note: string;
	positive: boolean;
	isDark: boolean;
}) {
	const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;
	return (
		<div className={`rounded-xl border p-3.5 ${isDark ? "border-white/[0.07] bg-[#03091c]/40" : "border-slate-100 bg-slate-50/80"}`}>
			<p className={`text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>{label}</p>
			<div className="mt-2 flex items-center justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2">
					<span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${positive ? (isDark ? "bg-emerald-300/[0.09] text-emerald-200" : "bg-emerald-50 text-emerald-700") : (isDark ? "bg-amber-300/[0.09] text-amber-200" : "bg-amber-50 text-amber-700")}`}>
						<TrendIcon className="h-4 w-4" />
					</span>
					<span className={`truncate text-[11px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{vehicle}</span>
				</div>
				<span className={`shrink-0 text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{value}</span>
			</div>
			<p className={`mt-2 text-[10px] ${positive ? (isDark ? "text-emerald-300" : "text-emerald-700") : (isDark ? "text-amber-300" : "text-amber-700")}`}>{note}</p>
		</div>
	);
}