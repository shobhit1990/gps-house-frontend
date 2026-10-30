import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowUpDown, ChevronDown, Columns3, RefreshCw, Search } from "lucide-react";
import { EmptyTableRow, TableFooter } from "@/components/Alert/AlertTable";
import {
	cardClass,
	filterCardClass,
	inputClass,
	primaryButtonClass,
	refreshButtonClass,
	searchIconClass,
	searchInputClass,
	tableHeadRowClass,
	tableRowClass,
	thClass,
	toolbarClass,
} from "@/components/Alert/alertTheme";
import { Sidebar } from "@/components/layout/Sidebar";
import { useGetClientMasterQuery, useGetTransporterMasterQuery, useGetVehicleMasterQuery } from "@/store/services/api/Master";
import { useAuth } from "@/contexts/AuthContext";

type NotificationRow = {
	id: number;
	vehicleNo: string;
	type: string;
	location: string;
	message: string;
	address: string;
	added: string;
	client: string;
	transporter: string;
};

type ColumnKey = "sn" | "vehicleNo" | "type" | "location" | "message" | "address" | "added";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "vehicleNo", label: "Vehicle No." },
	{ key: "type", label: "Type" },
	{ key: "location", label: "Location" },
	{ key: "message", label: "Message" },
	{ key: "address", label: "Address" },
	{ key: "added", label: "Added" },
];

const notificationTypes = ["Overspeed", "Ignition On", "Ignition Off", "Vehicle Start", "Geofence Entry", "Power Disconnect", "Low Battery"];

export default function NotificationList() {
	const { data: clientMaster = [] } = useGetClientMasterQuery();
	const clients = clientMaster.map((client) => client.name);
	const { data: transporterMaster = [] } = useGetTransporterMasterQuery();
	const transporters = transporterMaster.map((transporter) => transporter.name);
	const { data: vehicles = [] } = useGetVehicleMasterQuery();
	const vehicleOptions = vehicles.map((vehicle) => vehicle.name);
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [rows] = useState<NotificationRow[]>([]);
	const [client, setClient] = useState("");
	const [transporter, setTransporter] = useState("");
	const [vehicle, setVehicle] = useState("");
	const [notification, setNotification] = useState("");
	const [applied, setApplied] = useState({ client: "", transporter: "", vehicle: "", notification: "" });
	const [search, setSearch] = useState("");
	const [pageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showColumns, setShowColumns] = useState(false);
	const [sortKey, setSortKey] = useState<ColumnKey>("sn");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));

	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		const matched = rows.filter((row) => {
			const matchesFilters =
				(!applied.client || row.client === applied.client) &&
				(!applied.transporter || row.transporter === applied.transporter) &&
				(!applied.vehicle || row.vehicleNo === applied.vehicle) &&
				(!applied.notification || row.type === applied.notification);
			const matchesSearch =
				!query ||
				[row.vehicleNo, row.type, row.location, row.message, row.address, row.added].join(" ").toLowerCase().includes(query);
			return matchesFilters && matchesSearch;
		});
		return [...matched].sort((left, right) => {
			const leftValue = sortKey === "sn" ? String(left.id) : left[sortKey];
			const rightValue = sortKey === "sn" ? String(right.id) : right[sortKey];
			return sortDir === "asc" ? leftValue.localeCompare(rightValue) : rightValue.localeCompare(leftValue);
		});
	}, [rows, applied, search, sortKey, sortDir]);

	const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

	const toggleColumn = (key: ColumnKey) => {
		setHiddenColumns((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
	};

	const sortBy = (key: ColumnKey) => {
		if (sortKey === key) setSortDir((current) => (current === "asc" ? "desc" : "asc"));
		else {
			setSortKey(key);
			setSortDir("asc");
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
						<p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Alerts</p>
						<div className="flex items-center gap-3">
							<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Notification List</h1>
							<span className={`rounded-full border px-2.5 py-1 text-[10px] ${isDark ? "border-white/[0.08] bg-white/[0.04] text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>{rows.length} records</span>
						</div>
					</div>
					<button type="button" onClick={() => window.location.reload()} aria-label="Refresh notifications" className={refreshButtonClass(isDark)}>
						<RefreshCw className="h-4 w-4" />
					</button>
				</section>

				<section aria-label="Notification filters" className={filterCardClass(isDark)}>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
						<label className="sr-only" htmlFor="notification-client">Client</label>
						<select id="notification-client" value={client} onChange={(event) => setClient(event.target.value)} className={inputClass(isDark)}>
							<option value="">Select Client</option>
							{clients.map((name) => <option key={name} value={name}>{name}</option>)}
						</select>
						<label className="sr-only" htmlFor="notification-transporter">Transporter</label>
						<select id="notification-transporter" value={transporter} onChange={(event) => setTransporter(event.target.value)} className={inputClass(isDark)}>
							<option value="">Select Transporter</option>
							{transporters.map((name) => <option key={name} value={name}>{name}</option>)}
						</select>
						<label className="sr-only" htmlFor="notification-vehicle">Vehicle</label>
						<select id="notification-vehicle" value={vehicle} onChange={(event) => setVehicle(event.target.value)} className={inputClass(isDark)}>
							<option value="">Select Vehicle</option>
							{vehicleOptions.map((name) => <option key={name} value={name}>{name}</option>)}
						</select>
						<label className="sr-only" htmlFor="notification-type">Notification</label>
						<select id="notification-type" value={notification} onChange={(event) => setNotification(event.target.value)} className={inputClass(isDark)}>
							<option value="">Select Notification</option>
							{notificationTypes.map((name) => <option key={name} value={name}>{name}</option>)}
						</select>
						<button
							type="button"
							onClick={() => {
								setApplied({ client, transporter, vehicle, notification });
								setPage(0);
							}}
							className={primaryButtonClass(isDark)}
						>
							<Search className="h-3.5 w-3.5" /> Search
						</button>
					</div>
				</section>

				<section className={cardClass(isDark)}>
					<div className={toolbarClass(isDark)}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={searchIconClass(isDark)} />
							<input
								type="search"
								value={search}
								onChange={(event) => { setSearch(event.target.value); setPage(0); }}
								placeholder="Search vehicle, type, message..."
								aria-label="Search notifications"
								className={searchInputClass(isDark)}
							/>
						</label>
						<div className="relative">
							<button type="button" onClick={() => setShowColumns((visible) => !visible)} aria-expanded={showColumns} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-medium ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
								<Columns3 className="h-3.5 w-3.5" /> Column Visibility <ChevronDown className="h-3 w-3" />
							</button>
							{showColumns && (
								<div className={`absolute right-0 z-30 mt-2 w-52 rounded-lg border p-2 shadow-xl ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
									{columns.map((column) => (
										<label key={column.key} className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.05]" : "text-slate-700 hover:bg-slate-50"}`}>
											<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => toggleColumn(column.key)} className="h-3.5 w-3.5 accent-cyan-400" />
											{column.label}
										</label>
									))}
								</div>
							)}
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[980px] border-collapse text-left">
							<thead>
								<tr className={tableHeadRowClass(isDark)}>
									{visibleColumns.map((column) => (
										<th key={column.key} scope="col" className={thClass}>
											<button type="button" onClick={() => sortBy(column.key)} className="inline-flex items-center gap-1.5 uppercase">
												{column.label}
												<ArrowUpDown className={`h-3 w-3 ${sortKey === column.key ? "opacity-100" : "opacity-50"}`} />
											</button>
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{pageRows.length === 0 ? (
									<EmptyTableRow
										isDark={isDark}
										colSpan={Math.max(visibleColumns.length, 1)}
										title={rows.length === 0 ? "No notifications yet" : "No notifications match these filters"}
										hint={rows.length === 0 ? undefined : "Try clearing a filter or changing your search."}
									/>
								) : (
									pageRows.map((row, index) => (
										<tr key={row.id} className={tableRowClass(isDark)}>
											{visibleColumns.map((column) => (
												<td key={column.key} className="whitespace-nowrap px-4 py-3">
													{column.key === "sn" ? page * pageSize + index + 1 : row[column.key] || "—"}
												</td>
											))}
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					<TableFooter isDark={isDark} page={page} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
				</section>
			</main>
		</div>
	);
}
