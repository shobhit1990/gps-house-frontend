import { useEffect, useRef, useState, type RefObject } from "react";
import { useTheme } from "next-themes";
import { Activity, ChevronDown, RefreshCw, Search } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { vehicles } from "@/components/data/vehicles";
import { useAuth } from "@/contexts/AuthContext";

type MenuKind = "report" | "filter" | "transporter" | "vehicle";

const reportTypes = ["Vehicle Wise", "Geofence Wise"];
const filterTypes = ["Transporter", "Group"];
const transporters = ["Aviator", "vicky.9", "vga", "rahul.sharma"];
const vehicleOptions = vehicles.map((vehicle) => vehicle.vehicle);

const pad = (value: number) => String(value).padStart(2, "0");

const toInput = (date: Date, end: boolean) => {
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	return `${day}T${end ? "23:59" : "00:00"}`;
};

const todayRange = () => {
	const now = new Date();
	return { from: toInput(now, false), to: toInput(now, true) };
};

const selectionLabel = (selected: string[]) => (selected.length === 1 ? selected[0] : `${selected.length} selected`);

export default function PoiReport() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const initialRange = todayRange();
	const reportRef = useRef<HTMLDivElement>(null);
	const filterRef = useRef<HTMLDivElement>(null);
	const transporterRef = useRef<HTMLDivElement>(null);
	const vehicleRef = useRef<HTMLDivElement>(null);
	const [reportType, setReportType] = useState("");
	const [filterType, setFilterType] = useState("");
	const [selectedTransporters, setSelectedTransporters] = useState<string[]>([]);
	const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
	const [from, setFrom] = useState(initialRange.from);
	const [to, setTo] = useState(initialRange.to);
	const [openMenu, setOpenMenu] = useState<MenuKind | null>(null);
	const [transporterQuery, setTransporterQuery] = useState("");
	const [vehicleQuery, setVehicleQuery] = useState("");

	const showFilter = reportType !== "";
	const showAssignments = filterType === "Transporter";
	const visibleTransporters = transporters.filter((name) => name.toLowerCase().includes(transporterQuery.trim().toLowerCase()));
	const visibleVehicles = vehicleOptions.filter((name) => name.toLowerCase().includes(vehicleQuery.trim().toLowerCase()));

	useEffect(() => {
		if (!openMenu) return;
		const onPointer = (event: MouseEvent) => {
			const target = event.target as Node;
			const menuRef = openMenu === "report" ? reportRef : openMenu === "filter" ? filterRef : openMenu === "transporter" ? transporterRef : vehicleRef;
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

	const chooseReport = (value: string) => {
		setReportType(value);
		setFilterType("");
		setSelectedTransporters([]);
		setSelectedVehicles([]);
		setOpenMenu(null);
	};

	const chooseFilter = (value: string) => {
		setFilterType(value);
		setSelectedTransporters([]);
		setSelectedVehicles([]);
		setOpenMenu(null);
	};

	const toggleValue = (value: string, selected: string[], setSelected: (next: string[]) => void) => {
		setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
	};

	const refresh = () => {
		const range = todayRange();
		setReportType("");
		setFilterType("");
		setSelectedTransporters([]);
		setSelectedVehicles([]);
		setFrom(range.from);
		setTo(range.to);
		setTransporterQuery("");
		setVehicleQuery("");
		setOpenMenu(null);
	};

	const menuClass = `absolute left-0 top-12 z-40 w-full min-w-[200px] overflow-hidden rounded-xl border shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`;
	const controlClass = `flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400"}`;
	const optionClass = (selected: boolean) => `w-full rounded-md px-2.5 py-2 text-left text-xs leading-5 transition ${selected ? (isDark ? "bg-cyan-300/[0.16] text-cyan-50" : "bg-cyan-50 text-cyan-800") : isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`;

	const singleSelect = (
		kind: MenuKind,
		ref: RefObject<HTMLDivElement | null>,
		emptyLabel: string,
		value: string,
		options: string[],
		onPick: (next: string) => void,
	) => (
		<div ref={ref} className="relative min-w-0 flex-1 sm:max-w-[200px]">
			<button type="button" aria-expanded={openMenu === kind} aria-haspopup="listbox" aria-label={emptyLabel} onClick={() => setOpenMenu((current) => (current === kind ? null : kind))} className={controlClass}>
				<span className={`truncate ${value ? "" : isDark ? "text-slate-500" : "text-slate-400"}`}>{value || emptyLabel}</span>
				<ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${openMenu === kind ? "rotate-180" : ""}`} />
			</button>
			{openMenu === kind && (
				<ul role="listbox" aria-label={emptyLabel} className={`${menuClass} p-1`}>
					{options.map((item) => (
						<li key={item}>
							<button type="button" role="option" aria-selected={value === item} onClick={() => onPick(item)} className={optionClass(value === item)}>
								{item}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);

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
		<div ref={ref} className="relative min-w-0 flex-1 sm:max-w-[190px]">
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>POI Report</h1>
					</div>
					<button type="button" onClick={refresh} aria-label="Refresh POI report" title="Refresh POI report" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}>
						<RefreshCw className="h-4 w-4" />
					</button>
				</section>

				<section className={`rounded-xl border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-4 ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}>
					<div className="flex flex-col gap-2 xl:flex-row xl:items-center">
						{singleSelect("report", reportRef, "Select Report Type", reportType, reportTypes, chooseReport)}
						{showFilter && singleSelect("filter", filterRef, "Select Filter Type", filterType, filterTypes, chooseFilter)}
						{showAssignments && multiSelect("transporter", transporterRef, "Select Transporter", selectedTransporters, setSelectedTransporters, visibleTransporters, transporterQuery, setTransporterQuery)}
						{showAssignments && multiSelect("vehicle", vehicleRef, "Select Vehicle", selectedVehicles, setSelectedVehicles, visibleVehicles, vehicleQuery, setVehicleQuery)}
						<div className={`flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border px-2 sm:max-w-[360px] ${isDark ? "border-white/[0.08] bg-[#03091c]/65" : "border-slate-200 bg-white"}`}>
							<input type="datetime-local" aria-label="From date" value={from} onChange={(event) => setFrom(event.target.value)} className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
							<span className="text-slate-500">-</span>
							<input type="datetime-local" aria-label="To date" value={to} onChange={(event) => setTo(event.target.value)} className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
						</div>
						<button type="button" onClick={() => setOpenMenu(null)} className={`h-10 rounded-lg border px-5 text-[12px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
							<Search className="mr-1.5 inline h-3.5 w-3.5" />
							Search
						</button>
					</div>
				</section>
			</main>
		</div>
	);
}
