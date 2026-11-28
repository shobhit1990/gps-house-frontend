import {useMemo, useState, useRef} from "react";
import { useCloseDetailsOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, Loader2, Pencil, Plus, Power, RefreshCw, RotateCcw, Search, Trash2, X } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddClientForm } from "@/components/Client/AddClientForm";
import { useAuth } from "@/contexts/AuthContext";
import { Status, StatusFilter, statusFilters, statusLabel } from "@/enums/Status";
import { UserType } from "@/enums/UserType";
import type { Client as ClientEntity } from "@/interfaces/Client";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useDeleteClientMutation, useGetClientsQuery, useUpdateClientMutation } from "@/store/services/api/Client";

type ClientRecord = {
	id: string;
	username: string;
	name: string;
	phone: string;
	vehicleCount: number;
	added: string;
	inactiveDate: string;
	email: string;
	company: string;
	language: string;
	timezone: string;
	owner: string;
	password: string;
	suspended: boolean;
	active: boolean;
	reason: string;
	address: string;
	source: ClientEntity;
};

type ColumnKey = Exclude<keyof ClientRecord, "active" | "source"> | "accountStatus";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "id", label: "SN" },
	{ key: "username", label: "Username" },
	{ key: "name", label: "Name" },
	{ key: "phone", label: "Phone No" },
	{ key: "vehicleCount", label: "No. of vehicles" },
	{ key: "added", label: "Added" },
	// { key: "inactiveDate", label: "Inactive Date" },
	{ key: "email", label: "Email" },
	{ key: "company", label: "Company" },
	{ key: "language", label: "Language" },
	{ key: "timezone", label: "Timezone" },
	{ key: "accountStatus", label: "Status" },
	{ key: "reason", label: "Reason" },
	{ key: "owner", label: "Owner" },
	{ key: "address", label: "Address" },
];

const isClientActive = (client: ClientEntity) => {
	if (typeof client.active === "boolean") return client.active;
	return String(client.status ?? "").toLowerCase() !== Status.INACTIVE;
};

const toRecord = (client: ClientEntity): ClientRecord => ({
	id: client.externalId,
	username: client.userName ?? "",
	name: client.name ?? "",
	phone: client.phone != null ? String(client.phone) : "",
	vehicleCount: client.vehicleCount ?? 0,
	added: client.createdAt?.slice(0, 10) ?? "",
	inactiveDate: client.inactiveDate?.slice(0, 10) ?? "",
	email: client.email ?? "",
	company: client.companyName ?? "",
	language: client.language ?? "",
	timezone: client.timezone ?? "",
	owner: client.owner_name ?? "",
	password: client.password ?? "",
	suspended: Boolean(client.suspended),
	active: isClientActive(client),
	reason: isClientActive(client) ? "" : client.reason?.trim() ?? "",
	address: client.address ?? "",
	source: client,
});

const inputClass = (isDark: boolean) =>
	`h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 placeholder:text-slate-600 focus:border-cyan-300/35"
			: "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-cyan-400"
	}`;

const formatDate = (value: string) => {
	if (!value) return "—";
	const [year, month, day] = value.split("-");
	if (!year || !month || !day) return value;
	return `${day}/${month}/${year}`;
};

const displayCell = (key: Exclude<ColumnKey, "accountStatus">, row: ClientRecord) => {
	if (key === "added" || key === "inactiveDate") return formatDate(row[key]);
	if (key === "vehicleCount") return String(row.vehicleCount);
	if (key === "suspended") return row.suspended ? "Suspended" : "Active";
	if (key === "reason") return row.reason.trim() ? row.reason : "—";
	const value = row[key];
	return value === "" ? "—" : String(value);
};

export default function Client() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: clients = [], isLoading, isFetching, isError, refetch } = useGetClientsQuery();
	const [updateClient, { isLoading: isUpdatingStatus }] = useUpdateClientMutation();
	const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();
	const rows = useMemo(() => clients.map(toRecord), [clients]);
	const [status, setStatus] = useState<StatusFilter>(StatusFilter.ALL);
	const columnVisibilityRef = useRef<HTMLDetailsElement>(null);
	useCloseDetailsOnOutsideClick(columnVisibilityRef);
	const [month, setMonth] = useState("");
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [visiblePasswords, setVisiblePasswords] = useState<string[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [editingClient, setEditingClient] = useState<ClientEntity | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<ClientRecord | null>(null);
	const [pendingStatusClient, setPendingStatusClient] = useState<ClientRecord | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<Status>(Status.ACTIVE);
	const [statusReason, setStatusReason] = useState("");
	const [suspendingId, setSuspendingId] = useState<string | null>(null);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return rows.filter((row) => {
			const matchesStatus = status === StatusFilter.ALL || (status === StatusFilter.INACTIVE ? !row.active : row.active);
			const matchesMonth = !month || row.added.startsWith(month);
			const matchesSearch = !query || [row.username, row.name, row.phone, row.email, row.company, row.language, row.timezone, row.owner, row.address].join(" ").toLowerCase().includes(query);
			return matchesStatus && matchesMonth && matchesSearch;
		});
	}, [rows, search, status, month]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const toggleColumn = (key: ColumnKey) => {
		setHiddenColumns((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
	};

	const resetFilters = () => {
		setStatus(StatusFilter.ALL);
		setMonth("");
		setPage(0);
	};

	const openForm = (client: ClientEntity | null) => {
		setEditingClient(client);
		setShowAddDialog(true);
	};

	const openStatusChange = (row: ClientRecord) => {
		setPendingStatusClient(row);
		setSelectedStatus(row.active ? Status.INACTIVE : Status.ACTIVE);
		setStatusReason("");
	};

	const closeStatusDialog = () => {
		if (isUpdatingStatus) return;
		setPendingStatusClient(null);
		setStatusReason("");
	};

	const confirmStatusChange = async () => {
		if (!pendingStatusClient) return;
		const currentStatus = pendingStatusClient.active ? Status.ACTIVE : Status.INACTIVE;
		if (selectedStatus === currentStatus) {
			toast.error("Select a different status to change.");
			return;
		}
		if (selectedStatus === Status.INACTIVE && !statusReason.trim()) {
			toast.error("Please enter a reason when setting Inactive.");
			return;
		}
		try {
			await updateClient({
				externalId: pendingStatusClient.id,
				body: {
					active: selectedStatus === Status.ACTIVE,
					status: selectedStatus,
					reason: selectedStatus === Status.INACTIVE ? statusReason.trim() : "",
					userType: UserType.USER,
				},
			}).unwrap();
			toast.success(`Client "${pendingStatusClient.username}" is now ${statusLabel(selectedStatus).toLowerCase()}.`);
			setPendingStatusClient(null);
			setStatusReason("");
			void refetch();
		} catch (error) {
			console.error("Failed to update client status.", error);
			toast.error(apiErrorMessage(error, "Could not update the client status."));
		}
	};

	const toggleSuspend = async (row: ClientRecord) => {
		setSuspendingId(row.id);
		try {
			await updateClient({ externalId: row.id, body: { suspended: !row.suspended } }).unwrap();
			toast.success(`Client "${row.username}" ${row.suspended ? "unsuspended" : "suspended"} successfully.`);
		} catch (error) {
			console.error("Failed to update client suspension.", error);
			toast.error(apiErrorMessage(error, "Could not update the client."));
		} finally {
			setSuspendingId(null);
		}
	};

	const confirmDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deleteClient(deleteTarget.id).unwrap();
			toast.success(`Client "${deleteTarget.username}" deleted successfully.`);
			setDeleteTarget(null);
		} catch (error) {
			console.error("Failed to delete client.", error);
			toast.error(apiErrorMessage(error, "Could not delete the client."));
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
				<section className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						<p className={`mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>
							<Activity className="h-3.5 w-3.5" /> Fleet operations
						</p>
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Client</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{rows.length} clients</p>
					</div>
					<button type="button" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh clients" title="Refresh clients" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:opacity-60 ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section aria-label="Client filters" className={`mb-4 rounded-xl border p-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/65" : "border-slate-200 bg-white/90 shadow-sm"}`}>
					<div className="flex flex-wrap items-center gap-2">
						<label className="sr-only" htmlFor="client-status-filter">Status</label>
						<select id="client-status-filter" value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(0); }} className={`${inputClass(isDark)} w-full sm:w-[180px]`}>
							{statusFilters.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
						</select>
						<label className="sr-only" htmlFor="client-month-filter">Month</label>
						<input id="client-month-filter" type="month" value={month} onChange={(event) => { setMonth(event.target.value); setPage(0); }} className={`${inputClass(isDark)} w-full sm:w-[220px] ${isDark ? "[color-scheme:dark]" : ""}`} />
						<button type="button" onClick={resetFilters} className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-medium transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.13]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
							<RotateCcw className="h-3.5 w-3.5" /> Reset
						</button>
					</div>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search username, company, phone..." aria-label="Search clients" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
							{search && (
								<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative">
								<select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
									{[10, 25, 50].map((size) => <option key={size} value={size}>{size} rows</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<details ref={columnVisibilityRef} className="relative">
								<summary className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Columns
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div className={`absolute right-0 top-11 z-20 max-h-72 w-60 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
									{columns.map((column) => (
										<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
											<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => toggleColumn(column.key)} className="h-3.5 w-3.5 accent-cyan-300" />
											{column.label}
										</label>
									))}
								</div>
							</details>
							<button type="button" onClick={() => openForm(null)} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
								<Plus className="h-3.5 w-3.5" /> Add Client
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1680px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => (
										<th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">{column.label}</th>
									))}
									<th scope="col" className="whitespace-nowrap px-3 py-3 text-center font-medium">Actions</th>
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row, rowIndex) => (
									<tr key={row.id} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => (
											<td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">
												{column.key === "username" || column.key === "owner" ? (
													<span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{displayCell(column.key, row)}</span>
												) : column.key === "id" ? (
													<span className="text-slate-500">{String(safePage * pageSize + rowIndex + 1).padStart(2, "0")}</span>
												) : column.key === "accountStatus" ? (
													<button
														type="button"
														onClick={() => openStatusChange(row)}
														disabled={isUpdatingStatus}
														aria-label={`Change status of ${row.username}`}
														title="Change status"
														className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold transition disabled:opacity-50 ${
															!row.active
																? isDark
																	? "bg-rose-400/15 text-rose-200 hover:bg-rose-400/25"
																	: "bg-rose-50 text-rose-700 hover:bg-rose-100"
																: isDark
																	? "bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25"
																	: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
														}`}
													>
														{row.active ? "Active" : "Inactive"}
													</button>
												) : column.key === "password" ? (
													<button
														type="button"
														onClick={() => setVisiblePasswords((current) => (current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id]))}
														className={`h-7 rounded-md border px-3 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
													>
														{visiblePasswords.includes(row.id) ? row.password || "—" : "Show"}
													</button>
												) : column.key === "suspended" ? (
													<button
														type="button"
														onClick={() => toggleSuspend(row)}
														disabled={suspendingId === row.id}
														className={`inline-flex h-7 items-center gap-1 rounded-md border px-3 disabled:opacity-60 text-[11px] font-semibold transition ${row.suspended ? (isDark ? "border-rose-300/25 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100") : (isDark ? "border-violet-300/20 bg-violet-300/[0.10] text-violet-100 hover:bg-violet-300/[0.16]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100")}`}
													>
														{suspendingId === row.id && <Loader2 className="h-3 w-3 animate-spin" />}
														{row.suspended ? "Suspended" : "Suspend"}
													</button>
												) : (
													displayCell(column.key, row)
												)}
											</td>
										))}
										<td className="whitespace-nowrap px-3 py-2">
											<div className="flex items-center justify-center gap-1">
												<button
													type="button"
													title="Edit"
													aria-label={`Edit ${row.username}`}
													onClick={() => openForm(row.source)}
													className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100 hover:bg-cyan-300/[0.14]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
												>
													<Pencil className="h-3.5 w-3.5" />
												</button>
												<button
													type="button"
													title="Change status"
													aria-label={`Change status of ${row.username}`}
													onClick={() => openStatusChange(row)}
													disabled={isUpdatingStatus}
													className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-50 ${
														isDark
															? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.14]"
															: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
													}`}
												>
													<Power className="h-3.5 w-3.5" />
												</button>
												<button
													type="button"
													title="Delete"
													aria-label={`Delete ${row.username}`}
													onClick={() => setDeleteTarget(row)}
													className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-rose-300/20 bg-rose-300/[0.08] text-rose-200 hover:bg-rose-300/[0.14]" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											</div>
										</td>
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length + 1} className="px-6 py-16 text-center">
											{isLoading ? (
												<p className={`inline-flex items-center gap-2 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}><Loader2 className="h-4 w-4 animate-spin" /> Loading clients...</p>
											) : isError ? (
												<p className={`text-sm ${isDark ? "text-rose-300" : "text-rose-600"}`}>
													Could not load clients.{" "}
													<button type="button" onClick={() => refetch()} className="font-semibold underline underline-offset-2">Try again</button>
												</p>
											) : (
												<>
													<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{rows.length === 0 ? "No clients yet" : "No clients match these filters"}</p>
													<p className="mt-1 text-xs text-slate-500">{rows.length === 0 ? "Click “Add Client” to create one." : "Try clearing a filter or changing your search."}</p>
												</>
											)}
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} clients
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

			{showAddDialog && (
				<AddClientForm
					client={editingClient}
					onClose={() => setShowAddDialog(false)}
				/>
			)}

			{pendingStatusClient ? (
				<div
					className={`fixed inset-0 z-[820] flex items-center justify-center p-4 backdrop-blur-sm ${isDark ? "bg-[#020718]/80" : "bg-slate-900/50"}`}
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) closeStatusDialog();
					}}
				>
					<section
						role="alertdialog"
						aria-modal="true"
						aria-labelledby="client-status-title"
						className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
					>
						<h3 id="client-status-title" className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
							Change client status
						</h3>
						<p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							Current status of{" "}
							<strong className={isDark ? "text-white" : "text-slate-900"}>{pendingStatusClient.username}</strong>
							{" "}is{" "}
							<strong className={isDark ? "text-white" : "text-slate-900"}>
								{pendingStatusClient.active ? "Active" : "Inactive"}
							</strong>
							. Choose Active or Inactive. Reason is required only when setting Inactive.
						</p>
						<label className="mt-4 block">
							<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								Status <span className="text-rose-400">*</span>
							</span>
							<select
								value={selectedStatus}
								onChange={(event) => setSelectedStatus(event.target.value as Status)}
								className={`${inputClass(isDark)} ${isDark ? "[color-scheme:dark]" : ""}`}
							>
								<option value={Status.ACTIVE}>Active</option>
								<option value={Status.INACTIVE}>Inactive</option>
							</select>
						</label>
						{selectedStatus === Status.INACTIVE ? (
							<label className="mt-4 block">
								<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
									Reason <span className="text-rose-400">*</span>
								</span>
								<textarea
									value={statusReason}
									onChange={(event) => setStatusReason(event.target.value)}
									rows={3}
									placeholder={`Why is this client being set ${statusLabel(selectedStatus).toLowerCase()}?`}
									className={`${inputClass(isDark)} h-auto resize-none py-2`}
								/>
							</label>
						) : null}
						<div className="mt-5 flex justify-end gap-2">
							<button
								type="button"
								onClick={closeStatusDialog}
								disabled={isUpdatingStatus}
								className={`h-9 rounded-lg border px-4 text-[12px] disabled:opacity-40 ${isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"}`}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => void confirmStatusChange()}
								disabled={isUpdatingStatus}
								className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold disabled:opacity-60 ${
									isDark
										? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50"
										: "border-cyan-300 bg-cyan-50 text-cyan-800"
								}`}
							>
								{isUpdatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
								Update Status
							</button>
						</div>
					</section>
				</div>
			) : null}

			<DeleteConfirmDialog
				isDark={isDark}
				open={!!deleteTarget}
				title="Delete client?"
				entityName={deleteTarget?.username || "this client"}
				isSubmitting={isDeleting}
				onCancel={() => {
					if (!isDeleting) setDeleteTarget(null);
				}}
				onConfirm={() => void confirmDelete()}
				titleId="client-delete-title"
				zIndexClassName="z-[810]"
			/>
		</div>
	);
}
