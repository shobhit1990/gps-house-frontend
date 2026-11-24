import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, Loader2, Pencil, Plus, Power, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddTechnicianList } from "@/components/ManageTechnician/AddTechnicianList";
import { useAuth } from "@/contexts/AuthContext";
import { Status, statusLabel } from "@/enums/Status";
import type { Technician } from "@/interfaces/Technician";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useGetClientMasterQuery, useGetTimezonesQuery } from "@/store/services/api/Master";
import {
	useDeleteTechnicianMutation,
	useGetTechniciansQuery,
	useUpdateTechnicianMutation,
} from "@/store/services/api/Technician";

type TechnicianRecord = {
	id: string;
	username: string;
	contactPerson: string;
	phone: string;
	client: string;
	email: string;
	company: string;
	timezone: string;
	password: string;
	active: boolean;
};

type ColumnKey =
	| "username"
	| "contactPerson"
	| "phone"
	| "client"
	| "email"
	| "company"
	| "timezone"
	| "status"
	| "action";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "username", label: "Username" },
	{ key: "contactPerson", label: "Contact Person" },
	{ key: "phone", label: "Phone No" },
	{ key: "client", label: "Client" },
	{ key: "email", label: "Email" },
	{ key: "company", label: "Company" },
	{ key: "timezone", label: "Timezone" },
	{ key: "status", label: "Status" },
	{ key: "action", label: "Action" },
];

const inputClass = (isDark: boolean) =>
	`h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 placeholder:text-slate-600 focus:border-cyan-300/35 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-cyan-400"
	}`;

const stringValue = (value: unknown): string => {
	if (value == null) return "";
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (Array.isArray(value)) return value.map(stringValue).filter(Boolean).join(", ");
	if (typeof value === "object") {
		const record = value as Record<string, unknown>;
		return stringValue(record.name ?? record.timezone ?? record.userName ?? record.externalId ?? record.id);
	}
	return "";
};

const referenceValue = (value: unknown): string => {
	if (typeof value === "string" || typeof value === "number") return String(value);
	if (value && typeof value === "object") {
		const reference = value as Record<string, unknown>;
		return stringValue(reference.externalId ?? reference.id);
	}
	return "";
};

const textValue = (value: unknown) => {
	const text = stringValue(value);
	return text.trim() ? text : "—";
};

export default function TechnicianList() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: technicians = [], isLoading, isFetching, isError, refetch } = useGetTechniciansQuery();
	const { data: clients = [] } = useGetClientMasterQuery();
	const { data: timezones = [] } = useGetTimezonesQuery();
	const [deleteTechnician, { isLoading: isDeleting }] = useDeleteTechnicianMutation();
	const [updateTechnician, { isLoading: isUpdatingStatus }] = useUpdateTechnicianMutation();
	const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
	const [pendingDelete, setPendingDelete] = useState<TechnicianRecord | null>(null);
	const [pendingStatusTechnician, setPendingStatusTechnician] = useState<TechnicianRecord | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<Status>(Status.ACTIVE);
	const [statusReason, setStatusReason] = useState("");
	const rows = useMemo<TechnicianRecord[]>(() => {
		const clientNames = new Map(
			clients.flatMap((client) => [
				[String(client.id), client.name],
				[client.externalId, client.name],
			]),
		);
		const timezoneNames = new Map(
			timezones.map((timezone) => [timezone.externalId ?? String(timezone.id ?? ""), timezone.timezone ?? ""]),
		);
		return technicians.map((technician) => ({
			id: stringValue(technician.externalId || technician.id),
			username: stringValue(technician.userName),
			contactPerson: stringValue(technician.name),
			phone: stringValue(technician.phone),
			client: clientNames.get(referenceValue(technician.client)) ?? stringValue(technician.client),
			email: stringValue(technician.email),
			company: stringValue(technician.companyName),
			timezone: timezoneNames.get(referenceValue(technician.timezone)) || stringValue(technician.timezone),
			password: stringValue(technician.password),
			active: technician.status !== Status.INACTIVE,
		}));
	}, [technicians, clients, timezones]);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) =>
			[row.username, row.contactPerson, row.phone, row.client, row.email, row.company, row.timezone]
				.join(" ")
				.toLowerCase()
				.includes(query),
		);
	}, [rows, search]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const saveTechnician = () => {
		setSearch("");
		setPage(0);
		setShowAddDialog(false);
		setEditingTechnician(null);
		void refetch();
	};

	const openEdit = (id: string) => {
		const technician = technicians.find((item) => String(item.externalId || item.id) === id) ?? null;
		if (!technician) {
			toast.error("Could not find this technician.");
			return;
		}
		setShowAddDialog(false);
		setEditingTechnician(technician);
	};

	const openStatusChange = (row: TechnicianRecord) => {
		setPendingStatusTechnician(row);
		setSelectedStatus(row.active ? Status.INACTIVE : Status.ACTIVE);
		setStatusReason("");
	};

	const closeStatusDialog = () => {
		if (isUpdatingStatus) return;
		setPendingStatusTechnician(null);
		setStatusReason("");
	};

	const confirmStatusChange = async () => {
		if (!pendingStatusTechnician) return;
		const currentStatus = pendingStatusTechnician.active ? Status.ACTIVE : Status.INACTIVE;
		if (selectedStatus === currentStatus) {
			toast.error("Select a different status to change.");
			return;
		}
		if (!statusReason.trim()) {
			toast.error("Please enter a reason for the status change.");
			return;
		}
		try {
			await updateTechnician({
				externalId: pendingStatusTechnician.id,
				body: {
					status: selectedStatus,
					reason: statusReason.trim(),
				},
			}).unwrap();
			toast.success(
				`${pendingStatusTechnician.username} is now ${statusLabel(selectedStatus).toLowerCase()}.`,
			);
			closeStatusDialog();
			void refetch();
		} catch (error) {
			console.error("Failed to update technician status.", error);
			toast.error(apiErrorMessage(error, "Could not update the technician status."));
		}
	};

	const confirmDelete = async () => {
		if (!pendingDelete?.id) return;
		try {
			await deleteTechnician(pendingDelete.id).unwrap();
			toast.success(`${pendingDelete.username} deleted.`);
			setPendingDelete(null);
			void refetch();
		} catch (error) {
			console.error("Failed to delete technician.", error);
			toast.error(apiErrorMessage(error, "Could not delete the technician."));
		}
	};

	const cell = (key: ColumnKey, row: TechnicianRecord) => {
		if (key === "username") {
			return <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{row.username}</span>;
		}
		if (key === "status") {
			return (
				<button
					type="button"
					onClick={() => openStatusChange(row)}
					disabled={isUpdatingStatus}
					aria-label={`Change status of ${row.username}`}
					title="Change status"
					className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold transition disabled:opacity-50 ${
						row.active
							? isDark
								? "bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25"
								: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
							: isDark
								? "bg-white/[0.06] text-slate-400 hover:bg-white/[0.10]"
								: "bg-slate-100 text-slate-600 hover:bg-slate-200"
					}`}
				>
					{row.active ? "Active" : "Inactive"}
				</button>
			);
		}
		if (key === "action") {
			return (
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={() => openEdit(row.id)}
						aria-label={`Edit ${row.username}`}
						title="Edit"
						className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${
							isDark
								? "border-white/[0.10] text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-300/[0.10] hover:text-cyan-100"
								: "border-slate-200 text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
						}`}
					>
						<Pencil className="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onClick={() => openStatusChange(row)}
						disabled={isUpdatingStatus}
						aria-label={`Change status of ${row.username}`}
						title="Change status"
						className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition disabled:opacity-50 ${
							isDark
								? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.14]"
								: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
						}`}
					>
						<Power className="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onClick={() => setPendingDelete(row)}
						disabled={isDeleting}
						aria-label={`Delete ${row.username}`}
						title="Delete"
						className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition disabled:opacity-50 ${
							isDark
								? "border-rose-300/20 bg-rose-300/[0.08] text-rose-200 hover:bg-rose-300/[0.14]"
								: "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
						}`}
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
				</div>
			);
		}
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
							<Activity className="h-3.5 w-3.5" /> Fleet operations
						</p>
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Technician List</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{rows.length} technicians</p>
					</div>
					<button
						type="button"
						onClick={() => refetch()}
						disabled={isFetching}
						aria-label="Refresh technicians"
						title="Refresh technicians"
						className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:opacity-60 ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section
					className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${
						isDark
							? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90"
							: "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
					}`}
				>
					<div
						className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${
							isDark
								? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]"
								: "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"
						}`}
					>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input
								type="search"
								value={search}
								onChange={(event) => {
									setSearch(event.target.value);
									setPage(0);
								}}
								placeholder="Search"
								aria-label="Search technician"
								className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${
									isDark
										? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]"
										: "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
								}`}
							/>
							{search && (
								<button
									type="button"
									onClick={() => setSearch("")}
									aria-label="Clear search"
									className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
								>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative">
								<select
									aria-label="Rows per page"
									value={pageSize}
									onChange={(event) => {
										setPageSize(Number(event.target.value));
										setPage(0);
									}}
									className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${
										isDark
											? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 [color-scheme:dark]"
											: "border-slate-200 bg-white text-slate-700"
									}`}
								>
									{[10, 25, 50].map((size) => (
										<option key={size} value={size}>
											{size} rows
										</option>
									))}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<details className="relative">
								<summary
									className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${
										isDark
											? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]"
											: "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
									}`}
								>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Column Visibility
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div
									className={`absolute right-0 top-11 z-30 max-h-52 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${
										isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
									}`}
								>
									{columns.map((column) => (
										<label
											key={column.key}
											className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${
												isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"
											}`}
										>
											<input
												type="checkbox"
												checked={!hiddenColumns.includes(column.key)}
												onChange={() =>
													setHiddenColumns((current) =>
														current.includes(column.key)
															? current.filter((item) => item !== column.key)
															: [...current, column.key],
													)
												}
												className="h-3.5 w-3.5 accent-cyan-300"
											/>
											{column.label}
										</label>
									))}
								</div>
							</details>
							<button
								type="button"
								onClick={() => {
									setEditingTechnician(null);
									setShowAddDialog(true);
								}}
								className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${
									isDark
										? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]"
										: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
								}`}
							>
								<Plus className="h-3.5 w-3.5" /> Add
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1200px] border-collapse text-left">
							<thead>
								<tr
									className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${
										isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"
									}`}
								>
									{visibleColumns.map((column) => (
										<th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">
											{column.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row) => (
									<tr
										key={row.id}
										className={`border-b text-[11px] transition last:border-0 ${
											isDark
												? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]"
												: "border-slate-200 text-slate-700 hover:bg-slate-50"
										}`}
									>
										{visibleColumns.map((column) => (
											<td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">
												{cell(column.key, row)}
											</td>
										))}
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
												{isLoading ? "Loading technicians…" : isError ? "Could not load technicians" : "No technicians available"}
											</p>
											<p className="mt-1 text-xs text-slate-500">
												{isError ? "Use refresh to try again." : "Add a technician to see them here."}
											</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer
						className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${
							isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"
						}`}
					>
						<span>
							Showing{" "}
							<span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–
								{Math.min((safePage + 1) * pageSize, filteredRows.length)}
							</span>{" "}
							of {filteredRows.length} technicians
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								onClick={() => setPage((current) => Math.max(0, current - 1))}
								disabled={safePage === 0}
								aria-label="Previous page"
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${
									isDark
										? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]"
										: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
								}`}
							>
								<ChevronLeft className="h-4 w-4" />
							</button>
							<span className={`min-w-12 text-center ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								{safePage + 1} / {pageCount}
							</span>
							<button
								type="button"
								onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
								disabled={safePage >= pageCount - 1}
								aria-label="Next page"
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${
									isDark
										? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]"
										: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
								}`}
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</footer>
				</section>
			</main>

			{(showAddDialog || editingTechnician) && (
				<AddTechnicianList
					technician={editingTechnician}
					onClose={() => {
						setShowAddDialog(false);
						setEditingTechnician(null);
					}}
					onSaved={saveTechnician}
				/>
			)}

			{pendingStatusTechnician ? (
				<div className="fixed inset-0 z-[820] flex items-center justify-center p-4">
					<button
						type="button"
						aria-label="Close status dialog"
						className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]"
						onClick={closeStatusDialog}
					/>
					<section
						role="dialog"
						aria-modal="true"
						aria-labelledby="technician-status-title"
						className={`relative w-full max-w-md rounded-2xl border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
							isDark ? "border-white/[0.10] bg-[#0a1630] text-white" : "border-slate-200 bg-white text-slate-900"
						}`}
					>
						<h2 id="technician-status-title" className="text-[15px] font-semibold">
							Change technician status
						</h2>
						<p className={`mt-2 text-[12px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							Current status of <span className="font-medium">{pendingStatusTechnician.username}</span> is{" "}
							<span className="font-medium">{pendingStatusTechnician.active ? "Active" : "Inactive"}</span>.
							Choose Active or Inactive, then enter a reason.
						</p>
						<label className="mt-4 block">
							<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								Status <span className="text-rose-400">*</span>
							</span>
							<select
								value={selectedStatus}
								onChange={(event) => setSelectedStatus(event.target.value as Status)}
								className={inputClass(isDark)}
							>
								<option value={Status.ACTIVE}>Active</option>
								<option value={Status.INACTIVE}>Inactive</option>
							</select>
						</label>
						<label className="mt-4 block">
							<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								Reason <span className="text-rose-400">*</span>
							</span>
							<textarea
								value={statusReason}
								onChange={(event) => setStatusReason(event.target.value)}
								rows={3}
								placeholder={`Why is this technician being set ${statusLabel(selectedStatus).toLowerCase()}?`}
								className={`${inputClass(isDark)} h-auto resize-none py-2`}
							/>
						</label>
						<div className="mt-5 flex justify-end gap-2">
							<button
								type="button"
								onClick={closeStatusDialog}
								disabled={isUpdatingStatus}
								className={`h-9 rounded-lg border px-4 text-[12px] disabled:opacity-40 ${
									isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"
								}`}
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

			{pendingDelete ? (
				<div className="fixed inset-0 z-[820] flex items-center justify-center p-4">
					<button
						type="button"
						aria-label="Close delete dialog"
						className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]"
						onClick={() => {
							if (!isDeleting) setPendingDelete(null);
						}}
					/>
					<section
						role="dialog"
						aria-modal="true"
						aria-labelledby="technician-delete-title"
						className={`relative w-full max-w-md rounded-2xl border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
							isDark ? "border-white/[0.10] bg-[#0a1630] text-white" : "border-slate-200 bg-white text-slate-900"
						}`}
					>
						<h2 id="technician-delete-title" className="text-[15px] font-semibold">
							Delete technician
						</h2>
						<p className={`mt-2 text-[12px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							Delete <span className="font-medium">{pendingDelete.username}</span>? This cannot be undone.
						</p>
						<div className="mt-5 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setPendingDelete(null)}
								disabled={isDeleting}
								className={`h-9 rounded-lg border px-4 text-[12px] disabled:opacity-40 ${
									isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"
								}`}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => void confirmDelete()}
								disabled={isDeleting}
								className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold disabled:opacity-60 ${
									isDark
										? "border-rose-300/30 bg-rose-300/[0.14] text-rose-50"
										: "border-rose-300 bg-rose-50 text-rose-700"
								}`}
							>
								{isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
								Delete
							</button>
						</div>
					</section>
				</div>
			) : null}
		</div>
	);
}
