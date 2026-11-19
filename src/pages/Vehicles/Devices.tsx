import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Columns3,
	Loader2,
	Plus,
	RefreshCw,
	RotateCcw,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import AddDeviceForm from "@/components/Devices/AddDeviceForm";
import { useAuth } from "@/contexts/AuthContext";
import type { Device } from "@/interfaces/AddDevice";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useDeleteDeviceMutation, useGetDevicesQuery } from "@/store/services/api/AddDevice";
import { useGetClientMasterQuery, useGetDeviceTypeMasterQuery } from "@/store/services/api/Master";

type DeviceStatus = "Active" | "Inactive";

type DeviceRecord = {
	externalId: string;
	imei: string;
	sim: string;
	operator: string;
	type: string;
	client: string;
	password: string;
	status: DeviceStatus;
	ignitionWire: "C" | "P";
	assigned: "Y" | "N";
	addedMonth: string;
	added?: string;
	delete?: boolean;
};

const columns: { key: keyof DeviceRecord; label: string }[] = [
	{ key: "imei", label: "IMEI" },
	{ key: "sim", label: "SIM" },
	{ key: "operator", label: "Operator" },
	{ key: "type", label: "Type" },
	{ key: "client", label: "Client" },
	{ key: "password", label: "Password" },
	{ key: "status", label: "Status" },
	{ key: "ignitionWire", label: "Ign Wire" },
	{ key: "assigned", label: "Assigned" },
	{ key: "added", label: "Added" },
	{ key: "delete", label: "Delete" },
];

const refId = (value: unknown): string => {
	if (typeof value === "string" || typeof value === "number") return String(value);
	if (value && typeof value === "object") {
		const record = value as { externalId?: string; id?: string | number; name?: string; deviceName?: string };
		return String(record.externalId ?? record.id ?? record.name ?? record.deviceName ?? "");
	}
	return "";
};

const formatAdded = (value?: string) => {
	if (!value) return { added: "—", addedMonth: "" };
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return { added: value, addedMonth: "" };
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();
	return {
		added: `${day}/${month}/${year}`,
		addedMonth: `${year}-${month}`,
	};
};

const inputClass = (isDark: boolean) =>
	`h-10 min-w-0 rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 focus:border-cyan-300/35"
			: "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
	}`;

export default function Devices() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: devices = [], isLoading, isFetching, refetch } = useGetDevicesQuery();
	const { data: clientMaster = [] } = useGetClientMasterQuery();
	const { data: deviceTypeMaster = [] } = useGetDeviceTypeMasterQuery();
	const [deleteDevice, { isLoading: isDeleting }] = useDeleteDeviceMutation();
	const [search, setSearch] = useState("");
	const [clientFilter, setClientFilter] = useState("All clients");
	const [statusFilter, setStatusFilter] = useState("All");
	const [monthFilter, setMonthFilter] = useState("");
	const [pageSize, setPageSize] = useState(25);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<(keyof DeviceRecord)[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const clientNameById = useMemo(() => {
		const map = new Map<string, string>();
		clientMaster.forEach((client) => {
			const id = String(client.id ?? "");
			if (id) map.set(id, client.name ?? id);
		});
		return map;
	}, [clientMaster]);

	const deviceTypeNameById = useMemo(() => {
		const map = new Map<string, string>();
		deviceTypeMaster.forEach((deviceType) => {
			const id = String(deviceType.externalId ?? deviceType.id ?? "");
			const name = deviceType.deviceName ?? deviceType.deviceTypeName ?? id;
			if (id) map.set(id, name);
		});
		return map;
	}, [deviceTypeMaster]);

	const rows = useMemo<DeviceRecord[]>(() => {
		return devices.map((device: Device) => {
			const clientId = refId(device.client);
			const typeId = refId(device.deviceType);
			const { added, addedMonth } = formatAdded(device.createdAt);
			return {
				externalId: device.externalId,
				imei: device.imei || "—",
				sim: device.simNumber || "—",
				operator: device.simOperator || "—",
				type: deviceTypeNameById.get(typeId) || typeId || "—",
				client: clientNameById.get(clientId) || clientId || "—",
				password: device.password || "",
				status: device.active === false ? "Inactive" : "Active",
				ignitionWire: device.ignitionWireConnected ? "C" : "P",
				assigned: "N",
				addedMonth,
				added,
				delete: true,
			};
		});
	}, [devices, clientNameById, deviceTypeNameById]);

	const clients = [...new Set(rows.map((row) => row.client).filter((client) => client && client !== "—"))];
	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));

	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return rows.filter((row) => {
			const matchesSearch =
				!query ||
				[row.imei, row.sim, row.operator, row.type, row.client, row.password]
					.join(" ")
					.toLowerCase()
					.includes(query);
			const matchesClient = clientFilter === "All clients" || row.client === clientFilter;
			const matchesStatus = statusFilter === "All" || row.status === statusFilter;
			const matchesMonth = !monthFilter || row.addedMonth === monthFilter;
			return matchesSearch && matchesClient && matchesStatus && matchesMonth;
		});
	}, [rows, search, clientFilter, statusFilter, monthFilter]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);
	const activeCount = rows.filter((row) => row.status === "Active").length;

	const resetFilters = () => {
		setSearch("");
		setClientFilter("All clients");
		setStatusFilter("All");
		setMonthFilter("");
		setPage(0);
	};

	const toggleColumn = (key: keyof DeviceRecord) => {
		setHiddenColumns((current) =>
			current.includes(key) ? current.filter((column) => column !== key) : [...current, key],
		);
	};

	const closeAddDialog = () => {
		setShowAddDialog(false);
	};

	const handleDelete = async (device: DeviceRecord) => {
		if (!device.externalId) return;
		setDeletingId(device.externalId);
		try {
			await deleteDevice(device.externalId).unwrap();
			toast.success("Device deleted.");
		} catch (error) {
			console.error("Failed to delete device.", error);
			toast.error(apiErrorMessage(error, "Could not delete the device."));
		} finally {
			setDeletingId(null);
		}
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
				<section className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						<p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Fleet operations</p>
						<div className="flex flex-wrap items-center gap-3">
							<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Devices</h1>
							<span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${isDark ? "border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-100" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}>
								{rows.length} registered
							</span>
						</div>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>SIM, operator and device assignment inventory</p>
					</div>
					<div className="flex items-center gap-2 text-[11px] text-slate-500">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.5)]" />
						{activeCount} active devices
						<button
							type="button"
							onClick={() => void refetch()}
							aria-label="Refresh device list"
							title="Refresh device list"
							disabled={isFetching}
							className={`ml-2 flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:opacity-50 ${
								isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
							}`}
						>
							<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
						</button>
					</div>
				</section>

				<section aria-label="Device filters" className={`mb-4 rounded-xl border p-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/65" : "border-slate-200 bg-white/90 shadow-sm"}`}>
					<div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-[1fr_1fr_1fr_auto]">
						<label className="sr-only" htmlFor="device-client">Client</label>
						<select
							id="device-client"
							value={clientFilter}
							onChange={(event) => { setClientFilter(event.target.value); setPage(0); }}
							className={inputClass(isDark)}
						>
							<option>All clients</option>
							{clients.map((client) => <option key={client}>{client}</option>)}
						</select>
						<label className="sr-only" htmlFor="device-status">Status</label>
						<select
							id="device-status"
							value={statusFilter}
							onChange={(event) => { setStatusFilter(event.target.value); setPage(0); }}
							className={inputClass(isDark)}
						>
							<option>All</option>
							<option>Active</option>
							<option>Inactive</option>
						</select>
						<label className="sr-only" htmlFor="device-month">Added month</label>
						<input
							id="device-month"
							type="month"
							value={monthFilter}
							onChange={(event) => { setMonthFilter(event.target.value); setPage(0); }}
							className={`${inputClass(isDark)} ${isDark ? "[color-scheme:dark]" : "[color-scheme:light]"}`}
						/>
						<button
							type="button"
							onClick={resetFilters}
							className={`col-span-2 flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-medium transition md:col-span-1 ${
								isDark ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.13]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
							}`}
						>
							<RotateCcw className="h-3.5 w-3.5" /> Reset
						</button>
					</div>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input
								type="search"
								value={search}
								onChange={(event) => { setSearch(event.target.value); setPage(0); }}
								placeholder="Search IMEI, SIM, client..."
								className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`}
							/>
							{search && (
								<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>

						<div className="flex flex-wrap items-center gap-2">
							<label className="sr-only" htmlFor="device-page-size">Rows per page</label>
							<div className="relative">
								<select
									id="device-page-size"
									value={pageSize}
									onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }}
									className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"}`}
								>
									{[10, 25, 50].map((size) => <option key={size} value={size}>{size} rows</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>

							<details className="relative">
								<summary className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} /> Columns
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div className={`absolute right-0 top-11 z-20 w-52 rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
									{columns.map((column) => (
										<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
											<input
												type="checkbox"
												checked={!hiddenColumns.includes(column.key)}
												onChange={() => toggleColumn(column.key)}
												className="h-3.5 w-3.5 accent-cyan-300"
											/>
											{column.label}
										</label>
									))}
								</div>
							</details>

							<button
								type="button"
								onClick={() => setShowAddDialog(true)}
								className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
							>
								<Plus className="h-3.5 w-3.5" /> Add device
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1120px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => (
										<th key={column.key} className="whitespace-nowrap px-4 py-3 font-medium">{column.label}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{isLoading ? (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
											<Loader2 className={`mx-auto h-5 w-5 animate-spin ${isDark ? "text-cyan-300" : "text-cyan-600"}`} />
											<p className={`mt-3 text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Loading devices...</p>
										</td>
									</tr>
								) : (
									<>
										{pageRows.map((device) => (
											<tr key={device.externalId || device.imei} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
												{visibleColumns.map((column) => (
													<td key={column.key} className="whitespace-nowrap px-4 py-2.5">
														{column.key === "delete" ? (
															device.delete ? (
																<button
																	type="button"
																	onClick={() => void handleDelete(device)}
																	disabled={isDeleting && deletingId === device.externalId}
																	aria-label={`Delete device ${device.imei}`}
																	className={`flex h-7 w-7 items-center justify-center rounded-md transition disabled:opacity-50 ${isDark ? "text-slate-500 hover:bg-rose-300/[0.09] hover:text-rose-200" : "text-slate-500 hover:bg-rose-100 hover:text-rose-600"}`}
																>
																	{isDeleting && deletingId === device.externalId ? (
																		<Loader2 className="h-3.5 w-3.5 animate-spin" />
																	) : (
																		<Trash2 className="h-3.5 w-3.5" />
																	)}
																</button>
															) : "—"
														) : column.key === "imei" || column.key === "sim" ? (
															<span className={`font-medium ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{device[column.key] || "—"}</span>
														) : column.key === "status" ? (
															<span className={`rounded-md border px-2 py-1 text-[9px] font-semibold ${device.status === "Active" ? (isDark ? "border-emerald-300/20 bg-emerald-300/[0.10] text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-700") : (isDark ? "border-slate-300/15 bg-slate-300/[0.06] text-slate-300" : "border-slate-200 bg-slate-100 text-slate-700")}`}>
																{device.status}
															</span>
														) : column.key === "ignitionWire" || column.key === "assigned" ? (
															<span className={`inline-flex min-w-5 justify-center rounded px-1.5 py-0.5 text-[9px] font-bold ${device[column.key] === "C" || device[column.key] === "Y" ? (isDark ? "bg-emerald-300/20 text-emerald-200" : "bg-emerald-100 text-emerald-700") : (isDark ? "bg-amber-300/20 text-amber-200" : "bg-amber-100 text-amber-700")}`}>
																{device[column.key]}
															</span>
														) : column.key === "added" ? (
															device.added || "—"
														) : (
															String(device[column.key] ?? "—")
														)}
													</td>
												))}
											</tr>
										))}
										{pageRows.length === 0 && (
											<tr>
												<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
													<Search className={`mx-auto h-5 w-5 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
													<p className={`mt-3 text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No devices found</p>
													<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>Adjust the filters or search terms and try again.</p>
												</td>
											</tr>
										)}
									</>
								)}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} devices
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								onClick={() => setPage((current) => Math.max(0, current - 1))}
								disabled={page === 0}
								aria-label="Previous page"
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-35`}
							>
								<ChevronLeft className="h-4 w-4" />
							</button>
							<span className={`min-w-12 text-center ${isDark ? "text-slate-300" : "text-slate-700"}`}>{page + 1} / {pageCount}</span>
							<button
								type="button"
								onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
								disabled={page >= pageCount - 1}
								aria-label="Next page"
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-35`}
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</footer>
				</section>
			</main>

			{showAddDialog && (
				<div
					className={`fixed inset-0 z-[800] flex items-center justify-center p-2 backdrop-blur-sm sm:p-4 ${
						isDark ? "bg-[#020718]/80" : "bg-slate-900/50"
					}`}
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) closeAddDialog();
					}}
				>
					<div className="w-full max-w-[1160px]" role="dialog" aria-modal="true">
						<AddDeviceForm
							isDark={isDark}
							onClose={closeAddDialog}
							onSaved={() => {
								setPage(0);
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
