import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
	Activity,
	ArrowDownRight,
	ArrowUpRight,
	CalendarDays,
	CarFront,
	ChevronDown,
	Clock3,
	Gauge,
	Loader2,
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
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import type { AnalyticsDashboardResult, AnalyticsHighlight } from "@/interfaces/AnalyticsDashboard";
import {
	useGetClientMasterQuery,
	useGetTransporterMasterQuery,
	useGetVehicleMasterQuery,
} from "@/store/services/api/Master";
import { useLazyGetAnalyticsDashboardQuery } from "@/store/services/api/AnalyticsDashboard";

type FilterMenu = "client" | "transporter" | "vehicle" | null;

/** YYYY-MM-DD → DD/MM/YYYY HH:mm (from 00:00, to 23:59). */
const toApiDateTime = (date: string, endOfDay = false) => {
	const [year, month, day] = date.split("-");
	if (!year || !month || !day) return "";
	return `${day}/${month}/${year} ${endOfDay ? "23:59" : "00:00"}`;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

/** Local calendar day as DD/MM/YYYY. */
const formatDayKey = (date: Date) =>
	`${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;

/** Every day in the filter range (YYYY-MM-DD from/to) as DD/MM/YYYY — max 62 days. */
const daysInFilterRange = (fromYmd: string, toYmd: string): string[] => {
	const [fy, fm, fd] = fromYmd.split("-").map(Number);
	const [ty, tm, td] = toYmd.split("-").map(Number);
	if (![fy, fm, fd, ty, tm, td].every((n) => Number.isFinite(n))) return [];
	const cursor = new Date(fy, fm - 1, fd);
	const last = new Date(ty, tm - 1, td);
	if (cursor > last) return [];
	const days: string[] = [];
	while (cursor <= last && days.length < 62) {
		days.push(formatDayKey(cursor));
		cursor.setDate(cursor.getDate() + 1);
	}
	return days;
};

const emptyAnalytics = (): AnalyticsDashboardResult => ({
	totalDistanceKm: 0,
	totalDurationLabel: "0h 0m",
	totalDurationHours: 0,
	dailyAverageKm: 0,
	vehiclesTracked: 0,
	chartData: [],
	longestDistance: null,
	shortestDistance: null,
	longestDuration: null,
	shortestDuration: null,
});

const panelClass = (isDark: boolean) =>
	`rounded-2xl border shadow-[0_20px_55px_rgba(0,0,0,0.12)] ${
		isDark
			? "border-white/[0.08] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90"
			: "border-slate-200/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
	}`;

/**
 * Nice axis steps like 0, 25, 50… km or 0, 1, 2… hr.
 * `minMax` keeps a readable scale even when daily values are tiny (e.g. 1 km).
 */
const buildStepTicks = (maxValue: number, step: number, minMax: number) => {
	const safeStep = step > 0 ? step : 1;
	const ceil = Math.max(
		minMax,
		safeStep,
		Math.ceil(Math.max(0, maxValue) / safeStep) * safeStep,
	);
	return Array.from({ length: Math.floor(ceil / safeStep) + 1 }, (_, index) => index * safeStep);
};

function MetricTile({
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
		<article className={`rounded-xl border p-4 ${isDark ? "border-white/[0.07] bg-[#03091c]/35" : "border-slate-100 bg-slate-50/70"}`}>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
					<p className={`mt-2 text-xl font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>{value}</p>
					<p className={`mt-1.5 text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>{detail}</p>
				</div>
				<span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${colors[tone]}`}>
					<Icon className="h-[18px] w-[18px]" />
				</span>
			</div>
		</article>
	);
}

function ChartBlock({ title, description, isDark, children }: { title: string; description: string; isDark: boolean; children: ReactNode }) {
	return (
		<section className={`min-w-0 overflow-hidden rounded-xl border ${isDark ? "border-white/[0.07] bg-[#03091c]/25" : "border-slate-100 bg-slate-50/50"}`}>
			<div className={`flex items-start justify-between gap-4 border-b px-4 py-3.5 ${isDark ? "border-white/[0.07]" : "border-slate-100"}`}>
				<div>
					<h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h3>
					<p className={`mt-0.5 text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>{description}</p>
				</div>
				<span className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium ${isDark ? "border-white/[0.08] bg-white/[0.03] text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>Daily</span>
			</div>
			<div className="h-[300px] w-full px-1 pb-2 pt-3 sm:h-[340px] sm:px-2">{children}</div>
		</section>
	);
}

export default function AnalyticsDashboard() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const {
		data: clients = [],
		isLoading: clientsLoading,
		isError: clientsError,
		refetch: refetchClients,
	} = useGetClientMasterQuery();
	const [client, setClient] = useState("");
	const [transporter, setTransporter] = useState("");
	const [vehicle, setVehicle] = useState("");
	const [clientQuery, setClientQuery] = useState("");
	const [transporterQuery, setTransporterQuery] = useState("");
	const [vehicleQuery, setVehicleQuery] = useState("");
	const [openMenu, setOpenMenu] = useState<FilterMenu>(null);
	const [filtersApplied, setFiltersApplied] = useState(false);
	const [appliedVehicleLabel, setAppliedVehicleLabel] = useState("");
	const [appliedDates, setAppliedDates] = useState({ from: "", to: "" });
	const [analytics, setAnalytics] = useState<AnalyticsDashboardResult | null>(null);
	const [dates, setDates] = useState(() => {
		const to = new Date();
		const from = new Date();
		from.setDate(to.getDate() - 6);
		return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
	});

	const clientRef = useRef<HTMLDivElement>(null);
	const transporterRef = useRef<HTMLDivElement>(null);
	const vehicleRef = useRef<HTMLDivElement>(null);

	/** Full lists always available so dropdowns stay selectable without prior picks. */
	const {
		data: allTransporters = [],
		isLoading: transportersLoading,
		isError: transportersError,
		refetch: refetchTransporters,
	} = useGetTransporterMasterQuery();
	/** Optional client filter when a client is chosen. */
	const { data: transportersByClient = [] } = useGetTransporterMasterQuery(
		client ? { client } : undefined,
		{ skip: !client },
	);
	/** Master vehicle IDs are UUIDs — required by `/analytics-dashboard`. */
	const {
		data: allVehicles = [],
		isLoading: vehiclesLoading,
		refetch: refetchVehicles,
	} = useGetVehicleMasterQuery();
	const [fetchAnalytics, { isFetching }] = useLazyGetAnalyticsDashboardQuery();

	/** X-axis = every day in the applied from→to filter; API values merged by day. */
	const chartData = useMemo(() => {
		const points = analytics?.chartData ?? [];
		const rangeDays = appliedDates.from && appliedDates.to
			? daysInFilterRange(appliedDates.from, appliedDates.to)
			: [];

		if (rangeDays.length === 0) {
			return points.map((point) => ({
				...point,
				axisLabel: point.dayKey || point.date || "—",
			}));
		}

		const byKey = new Map<string, (typeof points)[number]>();
		for (const point of points) {
			const key = point.dayKey || point.date;
			if (key) byKey.set(key, point);
		}
		const matchedCount = rangeDays.filter((day) => byKey.has(day)).length;
		/** If API dates did not parse into the filter keys, align by index. */
		const alignByIndex = matchedCount === 0 && points.length > 0;

		return rangeDays.map((dayKey, index) => {
			const hit = alignByIndex ? points[index] : byKey.get(dayKey);
			return {
				dayKey,
				date: dayKey,
				axisLabel: dayKey,
				mileage: hit?.mileage ?? 0,
				duration: hit?.duration ?? 0,
			};
		});
	}, [analytics?.chartData, appliedDates.from, appliedDates.to]);
	const hasChart = chartData.length > 0;
	const xAxisAngle = chartData.length > 7 ? -35 : 0;
	const xAxisHeight = chartData.length > 7 ? 48 : 28;
	/** Match reference scale: 0 / 25 / 50 / 75 / 100 / 125 km (grows if data is higher). */
	const mileageTicks = useMemo(
		() => buildStepTicks(Math.max(0, ...chartData.map((point) => point.mileage), 0), 25, 125),
		[chartData],
	);
	/** Match reference scale: 0 … 6 hr (grows if data is higher). */
	const durationTicks = useMemo(
		() => buildStepTicks(Math.max(0, ...chartData.map((point) => point.duration), 0), 1, 6),
		[chartData],
	);

	/** Full list by default; narrow when client is selected. */
	const transporters = useMemo(() => {
		if (!client) return allTransporters;
		const byId = new Map(transportersByClient.map((item) => [item.id, item]));
		for (const item of allVehicles) {
			if (item.clientId !== client || !item.transporterId || byId.has(item.transporterId)) continue;
			const linked = allTransporters.find((row) => row.id === item.transporterId);
			if (linked) byId.set(linked.id, linked);
		}
		return byId.size > 0 ? [...byId.values()] : allTransporters;
	}, [allTransporters, allVehicles, client, transportersByClient]);

	/** Full list by default; narrow when transporter (and optional client) is selected. */
	const vehicles = useMemo(() => {
		if (!transporter && !client) return allVehicles;
		return allVehicles.filter((item) => {
			const clientOk = !client || !item.clientId || item.clientId === client;
			const transporterOk = !transporter || item.transporterId === transporter;
			return clientOk && transporterOk;
		});
	}, [allVehicles, client, transporter]);

	const visibleClients = useMemo(
		() => clients.filter((item) => item.name.toLowerCase().includes(clientQuery.trim().toLowerCase())),
		[clientQuery, clients],
	);
	const visibleTransporters = useMemo(
		() => transporters.filter((item) => item.name.toLowerCase().includes(transporterQuery.trim().toLowerCase())),
		[transporterQuery, transporters],
	);
	const visibleVehicles = useMemo(
		() => vehicles.filter((item) => item.name.toLowerCase().includes(vehicleQuery.trim().toLowerCase())),
		[vehicleQuery, vehicles],
	);

	useEffect(() => {
		if (!transporter) return;
		if (transporters.some((item) => item.id === transporter)) return;
		setTransporter("");
		setVehicle("");
		setVehicleQuery("");
	}, [transporter, transporters]);

	useEffect(() => {
		if (!vehicle) return;
		if (vehicles.some((item) => item.id === vehicle)) return;
		setVehicle("");
	}, [vehicle, vehicles]);

	useEffect(() => {
		if (clientsError) toast.error("Could not load clients. Try refresh.");
	}, [clientsError]);

	useEffect(() => {
		if (transportersError) toast.error("Could not load transporters. Try refresh.");
	}, [transportersError]);

	useEffect(() => {
		if (!openMenu) return;
		const onPointerDown = (event: MouseEvent) => {
			const target = event.target as Node;
			const refs: Record<Exclude<FilterMenu, null>, RefObject<HTMLDivElement | null>> = {
				client: clientRef,
				transporter: transporterRef,
				vehicle: vehicleRef,
			};
			const active = refs[openMenu];
			if (active.current && !active.current.contains(target)) setOpenMenu(null);
		};
		document.addEventListener("mousedown", onPointerDown);
		return () => document.removeEventListener("mousedown", onPointerDown);
	}, [openMenu]);

	const optionLabel = (id: string, options: { id: string; name: string }[], fallback: string) =>
		options.find((item) => item.id === id)?.name ?? fallback;

	const applyFilters = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setOpenMenu(null);
		if (!client || !transporter || !vehicle) {
			toast.error("Select client, transporter, and vehicle.");
			return;
		}
		if (!dates.from || !dates.to) {
			toast.error("Select from and to dates.");
			return;
		}
		if (dates.from > dates.to) {
			toast.error("From date must be before to date.");
			return;
		}

		const from = toApiDateTime(dates.from, false);
		const to = toApiDateTime(dates.to, true);
		if (!from || !to) {
			toast.error("Invalid date range.");
			return;
		}

		const vehicleLabel = optionLabel(vehicle, vehicles, vehicle);

		try {
			const result = await fetchAnalytics({
				client,
				transporter,
				vehicle,
				from,
				to,
			}).unwrap();
			setAnalytics(result);
			setAppliedVehicleLabel(vehicleLabel);
			setAppliedDates({ from: dates.from, to: dates.to });
			setFiltersApplied(true);
			if (result.chartData.length === 0) {
				toast.message("No analytics points for this range.");
			} else {
				toast.success("Analytics loaded");
			}
		} catch (error) {
			console.error("Failed to load analytics dashboard.", error);
			setAnalytics(emptyAnalytics());
			setAppliedVehicleLabel(vehicleLabel);
			setAppliedDates({ from: dates.from, to: dates.to });
			setFiltersApplied(true);
			toast.error(apiErrorMessage(error, "Could not load analytics. Please try again."));
		}
	};

	const resetFilters = () => {
		const to = new Date();
		const from = new Date();
		from.setDate(to.getDate() - 6);
		setClient("");
		setTransporter("");
		setVehicle("");
		setClientQuery("");
		setTransporterQuery("");
		setVehicleQuery("");
		setOpenMenu(null);
		setDates({ from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) });
		setFiltersApplied(false);
		setAppliedVehicleLabel("");
		setAppliedDates({ from: "", to: "" });
		setAnalytics(null);
		void refetchClients();
		void refetchTransporters();
		void refetchVehicles();
	};

	const controlClass = `flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-left text-xs outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/65 text-slate-200 hover:border-cyan-300/35 focus:border-cyan-300/35"
			: "border-slate-200 bg-white text-slate-700 hover:border-cyan-400 focus:border-cyan-400"
	}`;
	const menuClass = `absolute left-0 top-[calc(100%+6px)] z-[70] w-full min-w-[220px] overflow-hidden rounded-xl border shadow-[0_18px_40px_rgba(0,0,0,0.35)] ${
		isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
	}`;
	const searchInputClass = `h-9 w-full rounded-md border px-3 text-xs outline-none ${
		isDark
			? "border-white/[0.10] bg-[#03091c]/70 text-white focus:border-cyan-300/35"
			: "border-slate-200 bg-white text-slate-900 focus:border-cyan-400"
	}`;

	const fieldLabelClass = `mb-1.5 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`;

	const filterSelect = (
		kind: Exclude<FilterMenu, null>,
		ref: RefObject<HTMLDivElement | null>,
		label: string,
		value: string,
		placeholder: string,
		allOptions: { id: string; name: string }[],
		visibleOptions: { id: string; name: string }[],
		query: string,
		setQuery: (next: string) => void,
		onChoose: (id: string) => void,
		disabled = false,
		fieldLabel?: string,
	) => (
		<div className="min-w-0">
			{fieldLabel ? <span className={fieldLabelClass}>{fieldLabel}</span> : null}
			<div ref={ref} className="relative z-[60] min-w-0">
			<button
				type="button"
				aria-expanded={openMenu === kind}
				aria-haspopup="listbox"
				aria-label={label}
				disabled={disabled}
				onClick={() => setOpenMenu((current) => (current === kind ? null : kind))}
				className={controlClass}
			>
				<span className={`min-w-0 truncate ${value ? "" : isDark ? "text-slate-500" : "text-slate-400"}`}>
					{value ? optionLabel(value, allOptions, placeholder) : placeholder}
				</span>
				<ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${openMenu === kind ? "rotate-180" : ""}`} />
			</button>
			{openMenu === kind && !disabled && (
				<div className={menuClass}>
					<div className="p-2">
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							aria-label={`Search ${label}`}
							placeholder="Search…"
							className={searchInputClass}
							autoFocus
						/>
					</div>
					<ul role="listbox" aria-label={label} className="max-h-52 overflow-y-auto p-1">
						{visibleOptions.map((item) => (
							<li key={item.id}>
								<button
									type="button"
									role="option"
									aria-selected={value === item.id}
									onClick={() => {
										onChoose(item.id);
										setOpenMenu(null);
										setQuery("");
									}}
									className={`w-full rounded-md px-2.5 py-2 text-left text-xs ${
										value === item.id
											? isDark
												? "bg-cyan-300/[0.16] text-cyan-50"
												: "bg-cyan-50 text-cyan-800"
											: isDark
												? "text-slate-300 hover:bg-white/[0.04]"
												: "text-slate-700 hover:bg-slate-100"
									}`}
								>
									{item.name}
								</button>
							</li>
						))}
						{visibleOptions.length === 0 && (
							<li className="px-2 py-3 text-center text-[11px] text-slate-500">
								{kind === "client"
									? clientsLoading
										? "Loading clients…"
										: clientsError
											? "Failed to load clients"
											: "Nothing found"
									: kind === "transporter"
										? transportersLoading
											? "Loading transporters…"
											: transportersError
												? "Failed to load transporters"
												: "Nothing found"
										: vehiclesLoading
											? "Loading vehicles…"
											: "Nothing found"}
							</li>
						)}
					</ul>
				</div>
			)}
			</div>
		</div>
	);

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

	const statusLabel = useMemo(() => {
		if (isFetching) return "Loading…";
		if (filtersApplied) return "Live data";
		return "Select filters";
	}, [filtersApplied, isFetching]);

	const fallbackHighlight = (positive: boolean): AnalyticsHighlight => ({
		vehicle: appliedVehicleLabel || "—",
		value: "—",
		note: filtersApplied ? "No data" : "Apply filters",
		positive,
	});

	/** Prefer the searched vehicle number over API/fallback placeholders like "Selected vehicle". */
	const highlightFor = (highlight: AnalyticsHighlight | null, positive: boolean): AnalyticsHighlight => {
		const base = highlight ?? fallbackHighlight(positive);
		const raw = base.vehicle?.trim();
		const isPlaceholder = !raw || raw === "—" || /^(selected vehicle|vehicle)$/i.test(raw);
		return {
			...base,
			vehicle: isPlaceholder ? appliedVehicleLabel || "—" : raw,
		};
	};

	const clientPlaceholder = clientsLoading
		? "Loading clients…"
		: clientsError
			? "Failed to load clients"
			: clients.length === 0
				? "No clients found"
				: "Select client";
	const transporterPlaceholder = transportersLoading
		? "Loading transporters…"
		: transportersError
			? "Failed to load transporters"
			: transporters.length === 0
				? "No transporters found"
				: "Select transporter";
	const vehiclePlaceholder = vehiclesLoading
		? "Loading vehicles…"
		: vehicles.length === 0
			? "No vehicles found"
			: "Select vehicle";

	return (
		<div className={`relative min-h-screen overflow-x-hidden font-sans ${isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"}`}>
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.13] blur-[160px]" />
				<div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.09] blur-[170px]" />
				<div className="absolute bottom-[-320px] left-[35%] h-[500px] w-[700px] rounded-full bg-blue-700/[0.08] blur-[180px]" />
			</div>

			<Sidebar onLogout={logout} />

			<main className="relative mx-auto max-w-[1900px] px-4 pb-8 pt-6 sm:px-6 lg:px-7 lg:pt-8">
				<header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						{/* <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] ${isDark ? "border-cyan-300/15 bg-gradient-to-r from-cyan-300/[0.09] to-violet-400/[0.08] text-cyan-100" : "border-cyan-200 bg-gradient-to-r from-cyan-50 to-violet-50 text-cyan-800"}`}>
							<Sparkles className="h-3 w-3" /> Fleet insights
						</div> */}
						<h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${isDark ? "text-white" : "text-slate-900"}`}>Analytics Dashboard</h1>
						<p className={`mt-1.5 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Understand distance and driving time across your fleet.</p>
					</div>
					<div className={`inline-flex w-fit items-center gap-2 rounded-xl border px-3 py-2 text-xs ${isDark ? "border-white/[0.08] bg-[#08142e]/70 text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>
						{isFetching ? (
							<Loader2 className={`h-3.5 w-3.5 animate-spin ${isDark ? "text-cyan-200" : "text-cyan-700"}`} />
						) : (
							<Activity className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200" : "text-cyan-700"}`} />
						)}
						{statusLabel}
					</div>
				</header>

				<form onSubmit={applyFilters} className={`${panelClass(isDark)} relative z-30 mb-5 overflow-visible p-4 sm:p-5`}>
					<div className="mb-3 flex items-center justify-between gap-3">
						<div className="flex items-center gap-2">
							<span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isDark ? "bg-cyan-300/[0.09] text-cyan-200" : "bg-cyan-50 text-cyan-700"}`}><CalendarDays className="h-4 w-4" /></span>
							<div>
								<h2 className={`text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Filter analytics</h2>
								<p className={`mt-0.5 text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>Choose a fleet segment and time period</p>
							</div>
						</div>
						{filtersApplied && <span className={`text-[10px] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Filters applied</span>}
					</div>
					<div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)_minmax(160px,1fr)_minmax(280px,1.4fr)_auto_auto]">
						{filterSelect(
							"client",
							clientRef,
							"Select client",
							client,
							clientPlaceholder,
							clients,
							visibleClients,
							clientQuery,
							setClientQuery,
							(id) => {
								setClient(id);
								setTransporter("");
								setVehicle("");
								setTransporterQuery("");
								setVehicleQuery("");
							},
							clientsLoading,
							"Client",
						)}
						{filterSelect(
							"transporter",
							transporterRef,
							"Select transporter",
							transporter,
							transporterPlaceholder,
							transporters,
							visibleTransporters,
							transporterQuery,
							setTransporterQuery,
							(id) => {
								setTransporter(id);
								setVehicle("");
								setVehicleQuery("");
							},
							transportersLoading,
							"Transporter",
						)}
						{filterSelect(
							"vehicle",
							vehicleRef,
							"Select vehicle",
							vehicle,
							vehiclePlaceholder,
							vehicles,
							visibleVehicles,
							vehicleQuery,
							setVehicleQuery,
							(id) => setVehicle(id),
							vehiclesLoading,
							"Vehicle",
						)}
						<div className="min-w-0">
							<span className={`${fieldLabelClass} invisible select-none`} aria-hidden>
								Date
							</span>
							<div className={`flex h-11 min-w-0 items-center gap-2 overflow-hidden rounded-xl border px-2.5 ${isDark ? "border-white/[0.09] bg-[#03091c]/65" : "border-slate-200 bg-white"}`}>
								<input
									aria-label="From date"
									type="date"
									value={dates.from}
									onChange={(event) => setDates((current) => ({ ...current, from: event.target.value }))}
									className={`min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700 [color-scheme:light]"}`}
								/>
								<span className="shrink-0 text-[10px] text-slate-500">to</span>
								<input
									aria-label="To date"
									type="date"
									value={dates.to}
									onChange={(event) => setDates((current) => ({ ...current, to: event.target.value }))}
									className={`min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700 [color-scheme:light]"}`}
								/>
							</div>
						</div>
						<div className="min-w-0">
							<span className={`${fieldLabelClass} invisible select-none`} aria-hidden>
								Apply
							</span>
							<button
								type="submit"
								disabled={isFetching}
								className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-xs font-semibold transition disabled:opacity-60 ${isDark ? "bg-cyan-300 text-[#061328] shadow-[0_8px_24px_rgba(34,211,238,0.16)] hover:bg-cyan-200" : "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(14,116,144,0.18)] hover:bg-primary/90"}`}
							>
								{isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
								Apply
							</button>
						</div>
						<div className="min-w-0">
							<span className={`${fieldLabelClass} invisible select-none`} aria-hidden>
								Reset
							</span>
							<button type="button" onClick={resetFilters} aria-label="Reset filters" title="Reset filters" className={`inline-flex h-11 w-full items-center justify-center rounded-xl border px-3 transition ${isDark ? "border-white/[0.09] bg-white/[0.03] text-slate-400 hover:text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>
								<RefreshCw className="h-4 w-4" />
							</button>
						</div>
					</div>
				</form>

				{filtersApplied && analytics && (
					<section aria-label="Fleet analytics results" className={`${panelClass(isDark)} overflow-hidden p-4 sm:p-5`}>
						<div className={`mb-5 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07]" : "border-slate-100"}`}>
							<div className="flex min-w-0 items-center gap-3">
								<span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isDark ? "bg-cyan-300/[0.09] text-cyan-200" : "bg-cyan-50 text-cyan-700"}`}>
									<CarFront className="h-5 w-5" />
								</span>
								<div className="min-w-0">
									<p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? "text-slate-500" : "text-slate-500"}`}>Vehicle number</p>
									<p className={`mt-1 truncate text-lg font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
										{appliedVehicleLabel || "—"}
									</p>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
								<div className={`rounded-xl border px-3.5 py-3 ${isDark ? "border-white/[0.07] bg-[#03091c]/35" : "border-slate-100 bg-slate-50/80"}`}>
									<p className={`flex items-center gap-1.5 text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>
										<Route className="h-3 w-3" /> Distance
									</p>
									<p className={`mt-1 text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
										{analytics.totalDistanceKm.toLocaleString()} km
									</p>
								</div>
								<div className={`rounded-xl border px-3.5 py-3 ${isDark ? "border-white/[0.07] bg-[#03091c]/35" : "border-slate-100 bg-slate-50/80"}`}>
									<p className={`flex items-center gap-1.5 text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>
										<Clock3 className="h-3 w-3" /> Time
									</p>
									<p className={`mt-1 text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
										{analytics.totalDurationLabel}
									</p>
								</div>
							</div>
						</div>

						<div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
							<MetricTile
								label="Distance travelled"
								value={`${analytics.totalDistanceKm.toLocaleString()} km`}
								detail="Selected period"
								icon={Route}
								tone="cyan"
								isDark={isDark}
							/>
							<MetricTile
								label="Total duration"
								value={analytics.totalDurationLabel}
								detail="Across selected vehicle"
								icon={Clock3}
								tone="violet"
								isDark={isDark}
							/>
							<MetricTile
								label="Daily average"
								value={`${analytics.dailyAverageKm} km`}
								detail="Average distance per day"
								icon={Gauge}
								tone="blue"
								isDark={isDark}
							/>
							<MetricTile
								label="Vehicles tracked"
								value={String(analytics.vehiclesTracked).padStart(2, "0")}
								detail="Active in this period"
								icon={CarFront}
								tone="emerald"
								isDark={isDark}
							/>
						</div>

						<div className="mb-5 grid gap-4 xl:grid-cols-2">
							<ChartBlock title="Mileage" description="Daily distance travelled · kilometres" isDark={isDark}>
								{hasChart ? (
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={chartData} margin={{ top: 10, right: 16, left: 8, bottom: xAxisHeight }} barCategoryGap="26%">
											<defs>
												<linearGradient id="mileageFill" x1="0" y1="0" x2="0" y2="1">
													<stop offset="0%" stopColor="#facc15" />
													<stop offset="55%" stopColor="#84cc16" />
													<stop offset="100%" stopColor="#65a30d" />
												</linearGradient>
											</defs>
											<CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 4" />
											<XAxis
												dataKey="axisLabel"
												axisLine={false}
												tickLine={false}
												tick={{ fill: axisColor, fontSize: 10 }}
												dy={10}
												interval={0}
												minTickGap={4}
												angle={xAxisAngle}
												textAnchor={xAxisAngle ? "end" : "middle"}
												height={xAxisHeight}
											/>
											<YAxis
												domain={[0, mileageTicks[mileageTicks.length - 1] ?? 125]}
												ticks={mileageTicks}
												axisLine={false}
												tickLine={false}
												width={62}
												tick={{ fill: axisColor, fontSize: 11 }}
												tickFormatter={(value: number) => `${value} km`}
											/>
											<Tooltip
												cursor={{ fill: isDark ? "rgba(132,204,22,0.08)" : "rgba(132,204,22,0.08)" }}
												contentStyle={tooltipStyle}
												formatter={(value) => [`${Number(value).toLocaleString()} km`, "Distance"]}
												labelFormatter={(label) => String(label)}
											/>
											<Bar dataKey="mileage" fill="url(#mileageFill)" radius={[8, 8, 2, 2]} maxBarSize={34} minPointSize={3} />
										</BarChart>
									</ResponsiveContainer>
								) : (
									<EmptyChart isDark={isDark} fetching={isFetching} />
								)}
							</ChartBlock>
							<ChartBlock title="Duration" description="Daily driving time · hours" isDark={isDark}>
								{hasChart ? (
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={chartData} margin={{ top: 10, right: 16, left: 8, bottom: xAxisHeight }} barCategoryGap="26%">
											<defs>
												<linearGradient id="durationFill" x1="0" y1="0" x2="0" y2="1">
													<stop offset="0%" stopColor="#fde047" />
													<stop offset="55%" stopColor="#a3e635" />
													<stop offset="100%" stopColor="#65a30d" />
												</linearGradient>
											</defs>
											<CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 4" />
											<XAxis
												dataKey="axisLabel"
												axisLine={false}
												tickLine={false}
												tick={{ fill: axisColor, fontSize: 10 }}
												dy={10}
												interval={0}
												minTickGap={4}
												angle={xAxisAngle}
												textAnchor={xAxisAngle ? "end" : "middle"}
												height={xAxisHeight}
											/>
											<YAxis
												domain={[0, durationTicks[durationTicks.length - 1] ?? 6]}
												ticks={durationTicks}
												axisLine={false}
												tickLine={false}
												width={48}
												tick={{ fill: axisColor, fontSize: 11 }}
												tickFormatter={(value: number) => `${value} hr`}
											/>
											<Tooltip
												cursor={{ fill: isDark ? "rgba(163,230,53,0.08)" : "rgba(163,230,53,0.08)" }}
												contentStyle={tooltipStyle}
												formatter={(value) => [`${Number(value).toFixed(1)} hr`, "Duration"]}
												labelFormatter={(label) => String(label)}
											/>
											<Bar dataKey="duration" fill="url(#durationFill)" radius={[8, 8, 2, 2]} maxBarSize={34} minPointSize={3} />
										</BarChart>
									</ResponsiveContainer>
								) : (
									<EmptyChart isDark={isDark} fetching={isFetching} />
								)}
							</ChartBlock>
						</div>

						<div className="grid gap-4 xl:grid-cols-2">
							<HighlightPanel title="Distance Travelled" subtitle="Top and low mileage in this period" icon={MapPinned} isDark={isDark}>
								<Highlight {...highlightFor(analytics.longestDistance, true)} label="Longest distance" isDark={isDark} />
								<Highlight {...highlightFor(analytics.shortestDistance, false)} label="Shortest distance" isDark={isDark} />
							</HighlightPanel>
							<HighlightPanel title="Total Duration" subtitle="Longest and shortest driving time" icon={Clock3} isDark={isDark}>
								<Highlight {...highlightFor(analytics.longestDuration, true)} label="Longest duration" isDark={isDark} />
								<Highlight {...highlightFor(analytics.shortestDuration, false)} label="Shortest duration" isDark={isDark} />
							</HighlightPanel>
						</div>
					</section>
				)}
			</main>
		</div>
	);
}

function EmptyChart({ isDark, fetching }: { isDark: boolean; fetching: boolean }) {
	return (
		<div className={`flex h-full items-center justify-center text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
			{fetching ? "Loading chart…" : "No chart data for this range"}
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
		<section className={`rounded-xl border p-4 ${isDark ? "border-white/[0.07] bg-[#03091c]/25" : "border-slate-100 bg-slate-50/50"}`}>
			<div className="mb-4 flex items-center gap-2.5">
				<span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? "bg-cyan-300/[0.09] text-cyan-200" : "bg-cyan-50 text-cyan-700"}`}><Icon className="h-4 w-4" /></span>
				<div>
					<h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h3>
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
