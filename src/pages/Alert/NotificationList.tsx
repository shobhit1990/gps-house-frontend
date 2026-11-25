import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowUpDown, ChevronDown, Columns3, Loader2, RefreshCw, Search } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { notificationTypeOptions } from "@/enums/NotificationType";
import type { NotificationListParams } from "@/interfaces/NotificationList";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useGetNotificationListQuery } from "@/store/services/api/AddAlert";
import { useGetClientMasterQuery, useGetTransporterMasterQuery, useGetVehicleMasterQuery } from "@/store/services/api/Master";

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

export default function NotificationList() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";

	const { data: clients = [], isLoading: clientsLoading } = useGetClientMasterQuery();
	const [client, setClient] = useState("");
	const [transporter, setTransporter] = useState("");
	const [vehicle, setVehicle] = useState("");
	const [notification, setNotification] = useState("");
	const [applied, setApplied] = useState<NotificationListParams | null>(null);
	const [search, setSearch] = useState("");
	const [pageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showColumns, setShowColumns] = useState(false);
	const [sortKey, setSortKey] = useState<ColumnKey>("sn");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [filterError, setFilterError] = useState("");

	const {
		data: transportersByClient = [],
		isLoading: transportersLoading,
		isFetching: transportersFetching,
	} = useGetTransporterMasterQuery(client ? { client } : undefined, { skip: !client });

	const { data: allVehicles = [], isLoading: vehiclesLoading } = useGetVehicleMasterQuery();

	const {
		data: rows = [],
		isLoading: notificationsLoading,
		isFetching: notificationsFetching,
		isError: notificationsError,
		error: notificationsQueryError,
		refetch,
	} = useGetNotificationListQuery(applied ?? {}, { skip: !applied });

	const transporters = useMemo(() => {
		if (!client) return [];
		return transportersByClient;
	}, [client, transportersByClient]);

	const vehicles = useMemo(() => {
		if (!client || !transporter) return [];
		return allVehicles.filter((item) => {
			const clientOk = !item.clientId || item.clientId === client;
			const transporterOk = item.transporterId === transporter;
			return clientOk && transporterOk;
		});
	}, [allVehicles, client, transporter]);

	useEffect(() => {
		if (!transporter) return;
		if (transporters.some((item) => item.id === transporter)) return;
		setTransporter("");
		setVehicle("");
	}, [transporter, transporters]);

	useEffect(() => {
		if (!vehicle) return;
		if (vehicles.some((item) => item.id === vehicle)) return;
		setVehicle("");
	}, [vehicle, vehicles]);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));

	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		const matched = rows.filter((row) => {
			if (!query) return true;
			return [row.vehicleNo, row.type, row.location, row.message, row.address, row.added]
				.join(" ")
				.toLowerCase()
				.includes(query);
		});
		return [...matched].sort((left, right) => {
			const leftValue = sortKey === "sn" ? left.id : left[sortKey];
			const rightValue = sortKey === "sn" ? right.id : right[sortKey];
			return sortDir === "asc"
				? String(leftValue).localeCompare(String(rightValue))
				: String(rightValue).localeCompare(String(leftValue));
		});
	}, [rows, search, sortKey, sortDir]);

	const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);
	const isLoadingList = Boolean(applied) && (notificationsLoading || notificationsFetching);
	const listError =
		notificationsError && applied
			? apiErrorMessage(notificationsQueryError, "Could not load notifications. Please try again.")
			: "";

	const toggleColumn = (key: ColumnKey) => {
		setHiddenColumns((current) =>
			current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
		);
	};

	const sortBy = (key: ColumnKey) => {
		if (sortKey === key) setSortDir((current) => (current === "asc" ? "desc" : "asc"));
		else {
			setSortKey(key);
			setSortDir("asc");
		}
	};

	const onClientChange = (next: string) => {
		setClient(next);
		setTransporter("");
		setVehicle("");
		setFilterError("");
	};

	const onTransporterChange = (next: string) => {
		setTransporter(next);
		setVehicle("");
		setFilterError("");
	};

	const runSearch = () => {
		if (!client) {
			setFilterError("Select a client to search notifications.");
			return;
		}
		setFilterError("");
		setApplied({
			client,
			...(transporter ? { transporter } : {}),
			...(vehicle ? { vehicle } : {}),
			...(notification ? { notification } : {}),
		});
		setPage(0);
	};

	return (
		<div
			className={`relative min-h-screen overflow-hidden font-sans ${
				isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"
			}`}
		>
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.12] blur-[160px]" />
				<div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.08] blur-[170px]" />
			</div>
			<Sidebar onLogout={logout} />

			<main className="relative mx-auto max-w-[1900px] px-4 pb-8 pt-6 sm:px-6 lg:px-7 lg:pt-7">
				<section className="mb-5 flex items-center justify-between">
					<div>
						<p
							className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${
								isDark ? "text-cyan-200/70" : "text-cyan-700"
							}`}
						>
							Alerts
						</p>
						<div className="flex items-center gap-3">
							<h1
								className={`text-xl font-semibold tracking-tight sm:text-2xl ${
									isDark ? "text-white" : "text-slate-900"
								}`}
							>
								Notification List
							</h1>
							<span
								className={`rounded-full border px-2.5 py-1 text-[10px] ${
									isDark
										? "border-white/[0.08] bg-white/[0.04] text-slate-300"
										: "border-slate-200 bg-white text-slate-600"
								}`}
							>
								{rows.length} records
							</span>
						</div>
					</div>
					<button
						type="button"
						onClick={() => {
							if (applied) void refetch();
							else window.location.reload();
						}}
						aria-label="Refresh notifications"
						className={refreshButtonClass(isDark)}
					>
						<RefreshCw className={`h-4 w-4 ${isLoadingList ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section aria-label="Notification filters" className={filterCardClass(isDark)}>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
						<label className="sr-only" htmlFor="notification-client">
							Client
						</label>
						<select
							id="notification-client"
							value={client}
							onChange={(event) => onClientChange(event.target.value)}
							disabled={clientsLoading}
							className={inputClass(isDark)}
						>
							<option value="">{clientsLoading ? "Loading clients…" : "Select Client"}</option>
							{clients.map((item) => (
								<option key={item.id} value={item.id}>
									{item.name}
								</option>
							))}
						</select>

						<label className="sr-only" htmlFor="notification-transporter">
							Transporter
						</label>
						<select
							id="notification-transporter"
							value={transporter}
							onChange={(event) => onTransporterChange(event.target.value)}
							disabled={!client || transportersLoading || transportersFetching}
							className={inputClass(isDark)}
						>
							<option value="">
								{!client
									? "Select client first"
									: transportersLoading || transportersFetching
										? "Loading transporters…"
										: "Select Transporter"}
							</option>
							{transporters.map((item) => (
								<option key={item.id} value={item.id}>
									{item.name}
								</option>
							))}
						</select>

						<label className="sr-only" htmlFor="notification-vehicle">
							Vehicle
						</label>
						<select
							id="notification-vehicle"
							value={vehicle}
							onChange={(event) => {
								setVehicle(event.target.value);
								setFilterError("");
							}}
							disabled={!transporter || vehiclesLoading}
							className={inputClass(isDark)}
						>
							<option value="">
								{!transporter
									? "Select transporter first"
									: vehiclesLoading
										? "Loading vehicles…"
										: "Select Vehicle"}
							</option>
							{vehicles.map((item) => (
								<option key={item.id} value={item.id}>
									{item.name}
								</option>
							))}
						</select>

						<label className="sr-only" htmlFor="notification-type">
							Notification
						</label>
						<select
							id="notification-type"
							value={notification}
							onChange={(event) => {
								setNotification(event.target.value);
								setFilterError("");
							}}
							className={inputClass(isDark)}
						>
							<option value="">Select Notification</option>
							{notificationTypeOptions.map((item) => (
								<option key={item.value} value={item.value}>
									{item.label}
								</option>
							))}
						</select>

						<button type="button" onClick={runSearch} className={primaryButtonClass(isDark)}>
							{isLoadingList ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
							Search
						</button>
					</div>
					{(filterError || listError) && (
						<p className={`mt-2 text-xs ${isDark ? "text-rose-300" : "text-rose-600"}`}>
							{filterError || listError}
						</p>
					)}
				</section>

				<section className={cardClass(isDark)}>
					<div className={toolbarClass(isDark)}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={searchIconClass(isDark)} />
							<input
								type="search"
								value={search}
								onChange={(event) => {
									setSearch(event.target.value);
									setPage(0);
								}}
								placeholder="Search vehicle, type, message..."
								aria-label="Search notifications"
								className={searchInputClass(isDark)}
							/>
						</label>
						<div className="relative">
							<button
								type="button"
								onClick={() => setShowColumns((visible) => !visible)}
								aria-expanded={showColumns}
								className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-medium ${
									isDark
										? "border-white/[0.08] bg-[#03091c]/65 text-slate-300"
										: "border-slate-200 bg-white text-slate-700"
								}`}
							>
								<Columns3 className="h-3.5 w-3.5" /> Column Visibility <ChevronDown className="h-3 w-3" />
							</button>
							{showColumns && (
								<div
									className={`absolute right-0 z-30 mt-2 w-52 rounded-lg border p-2 shadow-xl ${
										isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
									}`}
								>
									{columns.map((column) => (
										<label
											key={column.key}
											className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs ${
												isDark ? "text-slate-300 hover:bg-white/[0.05]" : "text-slate-700 hover:bg-slate-50"
											}`}
										>
											<input
												type="checkbox"
												checked={!hiddenColumns.includes(column.key)}
												onChange={() => toggleColumn(column.key)}
												className="h-3.5 w-3.5 accent-cyan-400"
											/>
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
											<button
												type="button"
												onClick={() => sortBy(column.key)}
												className="inline-flex items-center gap-1.5 uppercase"
											>
												{column.label}
												<ArrowUpDown
													className={`h-3 w-3 ${sortKey === column.key ? "opacity-100" : "opacity-50"}`}
												/>
											</button>
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{isLoadingList ? (
									<tr>
										<td
											colSpan={Math.max(visibleColumns.length, 1)}
											className={`px-4 py-10 text-center text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
										>
											<span className="inline-flex items-center gap-2">
												<Loader2 className="h-4 w-4 animate-spin" /> Loading notifications…
											</span>
										</td>
									</tr>
								) : pageRows.length === 0 ? (
									<EmptyTableRow
										isDark={isDark}
										colSpan={Math.max(visibleColumns.length, 1)}
										title={
											!applied
												? "Select filters and search"
												: rows.length === 0
													? "No notifications found"
													: "No notifications match this search"
										}
										hint={
											!applied
												? "Choose a client (and optional transporter, vehicle, notification), then search."
												: rows.length === 0
													? "Try different filters."
													: "Try clearing the table search."
										}
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

					<TableFooter
						isDark={isDark}
						page={page}
						pageSize={pageSize}
						total={filteredRows.length}
						onPageChange={setPage}
					/>
				</section>
			</main>
		</div>
	);
}
