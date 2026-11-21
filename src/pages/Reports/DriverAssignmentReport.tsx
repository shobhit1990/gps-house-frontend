import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, RefreshCw, Search, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import type { DriverAssignment } from "@/interfaces/DriverAssignmentReport";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useLazyGetDriverAssignmentReportQuery } from "@/store/services/api/DriverAssignmentReport";
import {
	useGetClientMasterQuery,
	useGetTransporterMasterQuery,
	useGetVehicleMasterQuery,
} from "@/store/services/api/Master";

type ColumnKey = "sn" | "driverName" | "phone" | "vehicleNo" | "assignedOn" | "unassignedOn" | "assignedBy" | "duration" | "distanceKm";
type MenuKind = "client" | "transporter" | "vehicle";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "driverName", label: "Driver Name" },
	{ key: "phone", label: "Phone Number" },
	{ key: "vehicleNo", label: "Vehicle No." },
	{ key: "assignedOn", label: "Assigned On" },
	{ key: "unassignedOn", label: "Unassigned On" },
	{ key: "assignedBy", label: "Assigned By" },
	{ key: "duration", label: "Duration" },
	{ key: "distanceKm", label: "Distance(km)" },
];

const pad = (value: number) => String(value).padStart(2, "0");

const todayRange = () => {
	const now = new Date();
	const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
	return { from: `${day}T00:00`, to: `${day}T23:59` };
};

/** datetime-local (YYYY-MM-DDTHH:mm) → API format DD/MM/YYYY HH:mm */
const toApiDateTime = (value: string) => {
	const [datePart, timePart = "00:00"] = value.split("T");
	const [year, month, day] = datePart.split("-");
	if (!year || !month || !day) return value;
	return `${day}/${month}/${year} ${timePart}`;
};

const selectionLabel = (selected: string[], options: { id: string; name: string }[]) =>
	selected.length === 1 ? options.find((option) => option.id === selected[0])?.name ?? selected[0] : `${selected.length} selected`;

const textValue = (value: string) => (value.trim() ? value : "—");

export default function DriverAssignmentReport() {
	const { data: clientMaster = [] } = useGetClientMasterQuery();
	const { data: transporterMaster = [] } = useGetTransporterMasterQuery();
	const { data: vehicleMaster = [] } = useGetVehicleMasterQuery();
	const [fetchAssignments, { isFetching }] = useLazyGetDriverAssignmentReportQuery();
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const initialRange = todayRange();
	const clientRef = useRef<HTMLDivElement>(null);
	const transporterRef = useRef<HTMLDivElement>(null);
	const vehicleRef = useRef<HTMLDivElement>(null);
	const [rows, setRows] = useState<DriverAssignment[]>([]);
	const [searched, setSearched] = useState(false);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [selectedClients, setSelectedClients] = useState<string[]>([]);
	const [selectedTransporters, setSelectedTransporters] = useState<string[]>([]);
	const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
	const [from, setFrom] = useState(initialRange.from);
	const [to, setTo] = useState(initialRange.to);
	const [openMenu, setOpenMenu] = useState<MenuKind | null>(null);
	const [clientQuery, setClientQuery] = useState("");
	const [transporterQuery, setTransporterQuery] = useState("");
	const [vehicleQuery, setVehicleQuery] = useState("");

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		if (!searched) return [];
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) =>
			[
				row.driverName,
				row.phone,
				row.vehicleNo,
				row.assignedOn,
				row.unassignedOn,
				row.assignedBy,
				row.duration,
				row.distanceKm,
			]
				.join(" ")
				.toLowerCase()
				.includes(query),
		);
	}, [rows, search, searched]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);
	const visibleClients = clientMaster.filter((option) => option.name.toLowerCase().includes(clientQuery.trim().toLowerCase()));
	const visibleTransporters = transporterMaster.filter((option) => option.name.toLowerCase().includes(transporterQuery.trim().toLowerCase()));
	const visibleVehicles = vehicleMaster.filter((option) => option.name.toLowerCase().includes(vehicleQuery.trim().toLowerCase()));

	useEffect(() => {
		if (!openMenu) return;
		const onPointer = (event: MouseEvent) => {
			const target = event.target as Node;
			const menuRef = openMenu === "client" ? clientRef : openMenu === "transporter" ? transporterRef : vehicleRef;
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

	const applyFilters = async () => {
		if (selectedClients.length !== 1 || selectedTransporters.length !== 1 || selectedVehicles.length === 0) {
			toast.error("Select one client, one transporter, and at least one vehicle.");
			return;
		}
		if (!from || !to) {
			toast.error("Select from and to date.");
			return;
		}

		const client = selectedClients[0];
		const transporter = selectedTransporters[0];
		const apiFrom = toApiDateTime(from);
		const apiTo = toApiDateTime(to);
		const vehicleNameById = new Map(vehicleMaster.map((option) => [option.id, option.name]));

		try {
			const batches = await Promise.all(
				selectedVehicles.map(async (vehicle) => {
					const data = await fetchAssignments({
						client,
						transporter,
						vehicle,
						from: apiFrom,
						to: apiTo,
					}).unwrap();
					const vehicleName = vehicleNameById.get(vehicle) ?? "";
					return data.map((row, index) => ({
						...row,
						id: row.id || `${vehicle}-${index}`,
						vehicleNo: row.vehicleNo || vehicleName,
					}));
				}),
			);
			const nextRows = batches.flat();
			setRows(nextRows);
			setSearched(true);
			setOpenMenu(null);
			setPage(0);
			if (nextRows.length === 0) {
				toast.message("No driver assignments for this range.");
			} else {
				toast.success("Driver assignment report loaded");
			}
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not load driver assignment report."));
		}
	};

	const refresh = () => {
		const range = todayRange();
		setRows([]);
		setSearched(false);
		setSearch("");
		setSelectedClients([]);
		setSelectedTransporters([]);
		setSelectedVehicles([]);
		setFrom(range.from);
		setTo(range.to);
		setClientQuery("");
		setTransporterQuery("");
		setVehicleQuery("");
		setHiddenColumns([]);
		setOpenMenu(null);
		setPage(0);
		setPageSize(10);
	};

	const menuClass = `absolute left-0 top-12 z-40 w-full min-w-[220px] overflow-hidden rounded-xl border shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`;

	const multiSelect = (
		kind: MenuKind,
		ref: RefObject<HTMLDivElement | null>,
		emptyLabel: string,
		ariaLabel: string,
		selected: string[],
		setSelected: (next: string[]) => void,
		options: { id: string; name: string }[],
		query: string,
		setQuery: (value: string) => void,
	) => (
		<div ref={ref} className="relative min-w-0 flex-1 sm:max-w-[220px]">
			<button type="button" aria-expanded={openMenu === kind} aria-haspopup="listbox" aria-label={ariaLabel} onClick={() => setOpenMenu((current) => (current === kind ? null : kind))} className={`flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400"}`}>
				<span className={`truncate ${selected.length === 0 ? (isDark ? "text-slate-500" : "text-slate-400") : ""}`}>{selected.length === 0 ? emptyLabel : selectionLabel(selected, options)}</span>
				<ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${openMenu === kind ? "rotate-180" : ""}`} />
			</button>
			{openMenu === kind && (
				<div className={menuClass}>
					<div className="p-2">
						<input value={query} onChange={(event) => setQuery(event.target.value)} aria-label={`Search ${ariaLabel}`} className={`h-9 w-full rounded-md border px-3 text-xs outline-none ${isDark ? "border-white/[0.10] bg-[#03091c]/70 text-white focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-900 focus:border-cyan-400"}`} />
					</div>
					<div className={`grid grid-cols-2 border-y text-[11px] ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
						<button type="button" onClick={() => setSelected([...new Set([...selected, ...options.map((option) => option.id)])])} className={`h-9 border-r font-medium transition ${isDark ? "border-white/[0.08] text-slate-300 hover:bg-cyan-300/[0.08] hover:text-cyan-100" : "border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800"}`}>
							Select All
						</button>
						<button type="button" onClick={() => setSelected([])} className={`h-9 font-medium transition ${isDark ? "text-slate-300 hover:bg-white/[0.04] hover:text-white" : "text-slate-700 hover:bg-slate-50"}`}>
							Deselect All
						</button>
					</div>
					<ul role="listbox" aria-label={ariaLabel} aria-multiselectable="true" className="max-h-48 overflow-y-auto p-1">
						{options.map((option) => (
							<li key={option.id}>
								<label className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
									<input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggleValue(option.id, selected, setSelected)} className="h-3.5 w-3.5 accent-cyan-300" />
									{option.name}
								</label>
							</li>
						))}
						{options.length === 0 && <li className="px-2 py-3 text-center text-[11px] text-slate-500">Nothing found</li>}
					</ul>
				</div>
			)}
		</div>
	);

	const cell = (key: ColumnKey, row: DriverAssignment, serial: number) => {
		if (key === "sn") return String(serial).padStart(2, "0");
		if (key === "driverName" || key === "vehicleNo") return <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{textValue(row[key])}</span>;
		return textValue(row[key]);
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Driver Assignment Report</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{searched ? filteredRows.length : 0} assignments</p>
					</div>
					<button type="button" onClick={refresh} aria-label="Refresh driver assignment report" title="Refresh driver assignment report" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section className={`mb-4 rounded-xl border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-4 ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}>
					<div className="flex flex-col gap-2 xl:flex-row xl:items-center">
						{multiSelect("client", clientRef, "Select Client", "Select Client", selectedClients, setSelectedClients, visibleClients, clientQuery, setClientQuery)}
						{multiSelect("transporter", transporterRef, "Select Transporter", "Select transporter", selectedTransporters, setSelectedTransporters, visibleTransporters, transporterQuery, setTransporterQuery)}
						{multiSelect("vehicle", vehicleRef, "Select Vehicle", "Select vehicle", selectedVehicles, setSelectedVehicles, visibleVehicles, vehicleQuery, setVehicleQuery)}
						<div className={`flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border px-2 sm:max-w-[360px] ${isDark ? "border-white/[0.08] bg-[#03091c]/65" : "border-slate-200 bg-white"}`}>
							<input type="datetime-local" aria-label="From date" value={from} onChange={(event) => setFrom(event.target.value)} className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
							<span className="text-slate-500">-</span>
							<input type="datetime-local" aria-label="To date" value={to} onChange={(event) => setTo(event.target.value)} className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
						</div>
						<button type="button" onClick={() => void applyFilters()} disabled={isFetching} className={`h-10 rounded-lg border px-5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
							{isFetching ? "Searching..." : "Search"}
						</button>
					</div>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search" aria-label="Search driver assignment" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
							{search && (
								<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<details className="relative">
							<summary className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
								<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
								Column Visibility
								<ChevronDown className="h-3 w-3 text-slate-500" />
							</summary>
							<div className={`absolute right-0 top-11 z-30 max-h-52 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
								{columns.map((column) => (
									<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
										<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => setHiddenColumns((current) => (current.includes(column.key) ? current.filter((item) => item !== column.key) : [...current, column.key]))} className="h-3.5 w-3.5 accent-cyan-300" />
										{column.label}
									</label>
								))}
							</div>
						</details>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1100px] border-collapse text-left">
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
										<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No driver assignments available</p>
											<p className="mt-1 text-xs text-slate-500">Select client, transporter, and vehicle, then search.</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} assignments
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
		</div>
	);
}
