import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ChevronDown, ChevronLeft, ChevronRight, Columns3, Loader2, Pencil, Plus, Power, RefreshCw, Search, Trash2 } from "lucide-react";
import { AddRoleDialog } from "@/components/Master/AddRoleDialog";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Status } from "@/enums/Status";
import type { RoleRecord } from "@/interfaces/RoleManagement";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useDeleteRoleMutation, useGetRolesQuery, useUpdateRoleMutation } from "@/store/services/api/Role";

type ColumnKey = "sn" | "roleCode" | "name" | "status";
type StatusFilter = "all" | Status.ACTIVE | Status.INACTIVE;
type PendingAction = { type: "status" | "delete"; role: RoleRecord };

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "roleCode", label: "Role Code" },
	{ key: "name", label: "Name" },
	{ key: "status", label: "Status" },
];

const statusFilters: { id: StatusFilter; label: string }[] = [
	{ id: "all", label: "All Status" },
	{ id: Status.ACTIVE, label: "Active" },
	{ id: Status.INACTIVE, label: "Inactive" },
];

const statusLabel = (status: Status) => status.charAt(0).toUpperCase() + status.slice(1);

const inputClass = (isDark: boolean) =>
	`h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-200 placeholder:text-slate-500 focus:border-cyan-300/35 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 [color-scheme:light]"
	}`;

export default function Roles() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: roles = [], isLoading, isFetching, isError, refetch } = useGetRolesQuery();
	const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
	const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showColumns, setShowColumns] = useState(false);
	const [dialogRole, setDialogRole] = useState<RoleRecord | null>(null);
	const [showDialog, setShowDialog] = useState(false);
	const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRoles = useMemo(() => {
		const query = search.trim().toLowerCase();
		return roles.filter((role) =>
			(!query || `${role.roleCode} ${role.name}`.toLowerCase().includes(query)) &&
			(statusFilter === "all" || role.status === statusFilter),
		);
	}, [roles, search, statusFilter]);
	const pageCount = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
	const currentPage = Math.min(page, pageCount - 1);
	const pageRows = filteredRoles.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
	const isConfirming = isUpdating || isDeleting;
	const nextStatus = pendingAction?.role.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE;

	const toggleColumn = (key: ColumnKey) => {
		setHiddenColumns((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
	};

	const openDialog = (role: RoleRecord | null) => {
		setDialogRole(role);
		setShowDialog(true);
	};

	const confirmAction = async () => {
		if (!pendingAction) return;
		try {
			if (pendingAction.type === "delete") {
				await deleteRole(pendingAction.role.externalId).unwrap();
				toast.success(`${pendingAction.role.name} deleted.`);
			} else {
				await updateRole({
					externalId: pendingAction.role.externalId,
					roleCode: pendingAction.role.roleCode,
					name: pendingAction.role.name,
					status: nextStatus,
				}).unwrap();
				toast.success(`${pendingAction.role.name} is now ${statusLabel(nextStatus).toLowerCase()}.`);
			}
			setPendingAction(null);
		} catch (error) {
			console.error(`Failed to ${pendingAction.type} role.`, error);
			toast.error(apiErrorMessage(error, pendingAction.type === "delete" ? "Could not delete the role." : "Could not update role status."));
		}
	};

	const cell = (role: RoleRecord, key: ColumnKey, index: number) => {
		switch (key) {
			case "sn":
				return currentPage * pageSize + index + 1;
			case "roleCode":
				return <span className={`font-mono font-medium ${isDark ? "text-cyan-100" : "text-cyan-800"}`}>{role.roleCode || "—"}</span>;
			case "name":
				return <span className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{role.name || "—"}</span>;
			case "status": {
				const active = role.status === Status.ACTIVE;
				return (
					<span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${active ? isDark ? "border-emerald-300/25 bg-emerald-300/[0.10] text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-700" : isDark ? "border-rose-300/25 bg-rose-300/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
						<span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-rose-400"}`} />
						{statusLabel(role.status)}
					</span>
				);
			}
		}
	};

	const iconButtonClass = (tone: "neutral" | "violet" | "rose") => {
		const tones = {
			neutral: isDark ? "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-cyan-300/25 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700",
			violet: isDark ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-200 hover:bg-violet-300/[0.16]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
			rose: isDark ? "border-rose-300/20 bg-rose-400/[0.06] text-rose-300 hover:bg-rose-400/[0.15]" : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100",
		};
		return `flex h-8 w-8 items-center justify-center rounded-lg border transition ${tones[tone]}`;
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
						<p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Master</p>
						<div className="flex items-center gap-3">
							<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Roles</h1>
							<span className={`rounded-full border px-2.5 py-1 text-[10px] ${isDark ? "border-white/[0.08] bg-white/[0.04] text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>{roles.length} records</span>
						</div>
					</div>
					<button type="button" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh roles" className={`flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-60 ${isDark ? "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<div className="flex flex-col gap-2 sm:flex-row">
							<label className="relative block min-w-0 sm:w-[300px]">
								<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
								<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search role code or name..." aria-label="Search roles" className={`h-10 w-full rounded-lg border pl-9 pr-3 text-xs outline-none ${isDark ? "border-white/[0.12] bg-[#03091c]/80 text-white placeholder:text-slate-400 focus:border-cyan-300/40" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus:border-cyan-400"}`} />
							</label>
							<label className="sr-only" htmlFor="role-status-filter">Status</label>
							<select id="role-status-filter" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as StatusFilter); setPage(0); }} className={`${inputClass(isDark)} sm:w-[160px]`}>
								{statusFilters.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
							</select>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<div className="relative">
								<select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
									{[10, 25, 50].map((size) => <option key={size} value={size}>{size} rows</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<div className="relative">
								<button type="button" onClick={() => setShowColumns((current) => !current)} aria-expanded={showColumns} className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/20" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"}`}>
									<Columns3 className="h-3.5 w-3.5" /> Column Visibility <ChevronDown className="h-3 w-3" />
								</button>
								{showColumns && (
									<div className={`absolute right-0 z-30 mt-2 w-48 rounded-lg border p-2 shadow-xl ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
										{columns.map((column) => <label key={column.key} className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.05]" : "text-slate-700 hover:bg-slate-50"}`}><input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => toggleColumn(column.key)} className="h-3.5 w-3.5 accent-cyan-400" />{column.label}</label>)}
									</div>
								)}
							</div>
							<button type="button" onClick={() => openDialog(null)} className={`flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/35 bg-cyan-300/[0.16] text-cyan-50 hover:bg-cyan-300/[0.24]" : "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"}`}>
								<Plus className="h-3.5 w-3.5" /> Add Role
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px] border-collapse text-left">
							<thead><tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
								{visibleColumns.map((column) => <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{column.label}</th>)}
								<th scope="col" className="w-[140px] whitespace-nowrap px-4 py-3 text-center font-medium">Actions</th>
							</tr></thead>
							<tbody>
								{isLoading || isError || pageRows.length === 0 ? (
									<tr><td colSpan={visibleColumns.length + 1} className={`px-4 py-10 text-center text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
										{isLoading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading roles...</span> : isError ? <span className={isDark ? "text-rose-300" : "text-rose-600"}>Could not load roles. <button type="button" onClick={() => refetch()} className="font-semibold underline underline-offset-2">Try again</button></span> : roles.length === 0 ? "No roles yet. Click “Add Role” to create one." : "No roles match your filters."}
									</td></tr>
								) : pageRows.map((role, index) => (
									<tr key={role.externalId} className={`border-b ${isDark ? "border-white/[0.06] text-slate-300 hover:bg-white/[0.025]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => <td key={column.key} className="whitespace-nowrap px-4 py-3 text-xs">{cell(role, column.key, index)}</td>)}
										<td className="px-4 py-2.5"><div className="flex items-center justify-center gap-2">
											<button type="button" title="Edit role" aria-label={`Edit ${role.name}`} onClick={() => openDialog(role)} className={iconButtonClass("neutral")}><Pencil className="h-3.5 w-3.5" /></button>
											<button type="button" title="Change status" aria-label={`Change status of ${role.name}`} onClick={() => setPendingAction({ type: "status", role })} className={iconButtonClass("violet")}><Power className="h-3.5 w-3.5" /></button>
											<button type="button" title="Delete role" aria-label={`Delete ${role.name}`} onClick={() => setPendingAction({ type: "delete", role })} className={iconButtonClass("rose")}><Trash2 className="h-3.5 w-3.5" /></button>
										</div></td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between ${isDark ? "text-slate-400" : "text-slate-600"}`}>
						<span>Showing {filteredRoles.length === 0 ? 0 : currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, filteredRoles.length)} of {filteredRoles.length} entries</span>
						<div className="flex items-center gap-2">
							<button type="button" onClick={() => setPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} aria-label="Previous page" className="rounded p-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
							<span>{currentPage + 1} of {pageCount} pages</span>
							<button type="button" onClick={() => setPage(Math.min(pageCount - 1, currentPage + 1))} disabled={currentPage >= pageCount - 1} aria-label="Next page" className="rounded p-1 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
						</div>
					</footer>
				</section>
			</main>

			{showDialog && <AddRoleDialog isDark={isDark} role={dialogRole} onClose={() => setShowDialog(false)} />}
			{pendingAction && (
				<div className="fixed inset-0 z-[810] flex items-center justify-center bg-[#020718]/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isConfirming) setPendingAction(null); }}>
					<section role="alertdialog" aria-modal="true" aria-labelledby="role-confirm-title" className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
						<h3 id="role-confirm-title" className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{pendingAction.type === "delete" ? "Delete role?" : "Change role status?"}</h3>
						<p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							{pendingAction.type === "delete" ? <>This will permanently remove <strong>{pendingAction.role.name}</strong>.</> : <>Change <strong>{pendingAction.role.name}</strong> status to {statusLabel(nextStatus)}?</>}
						</p>
						<div className="mt-5 flex justify-end gap-2">
							<button type="button" onClick={() => setPendingAction(null)} disabled={isConfirming} className={`h-9 rounded-lg border px-4 text-[12px] disabled:opacity-40 ${isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"}`}>Cancel</button>
							<button type="button" onClick={confirmAction} disabled={isConfirming} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold disabled:opacity-60 ${pendingAction.type === "delete" ? isDark ? "border-rose-300/30 bg-rose-400/[0.16] text-rose-100" : "border-rose-300 bg-rose-50 text-rose-700" : isDark ? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50" : "border-cyan-300 bg-cyan-50 text-cyan-800"}`}>
								{isConfirming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
								{pendingAction.type === "delete" ? "Delete" : "Confirm"}
							</button>
						</div>
					</section>
				</div>
			)}
		</div>
	);
}
