import {useMemo, useState, useRef} from "react";
import { useCloseOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ChevronDown, ChevronLeft, ChevronRight, Columns3, Loader2, Pencil, Plus, Power, RefreshCw, Search, Trash2 } from "lucide-react";
import { ChangeStatusDialog } from "@/components/common/ChangeStatusDialog";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddLicenseDialog } from "@/components/Master/AddLicenseDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Status, StatusFilter, statusFilters, statusLabel } from "@/enums/Status";
import type { License } from "@/interfaces/License";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useDeleteLicenseMutation, useGetLicensesQuery, useUpdateLicenseStatusMutation } from "@/store/services/api/License";

type ColumnKey = "sn" | "license" | "status" | "reason";
type PendingAction = { type: "status" | "delete"; license: License };

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "license", label: "License" },
	{ key: "status", label: "Status" },
	{ key: "reason", label: "Reason" },
];

const inputClass = (isDark: boolean) =>
	`h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-200 placeholder:text-slate-500 focus:border-cyan-300/35 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 [color-scheme:light]"
	}`;

const toolbarButtonClass = (isDark: boolean) =>
	`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition ${
		isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/20" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"
	}`;

const primaryButtonClass = (isDark: boolean) =>
	`flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[11px] font-semibold transition disabled:opacity-60 ${
		isDark ? "border-cyan-300/35 bg-cyan-300/[0.16] text-cyan-50 hover:bg-cyan-300/[0.24]" : "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
	}`;

export default function DriverLicense() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: licenses = [], isLoading, isFetching, isError, refetch } = useGetLicensesQuery();
	const [updateLicenseStatus, { isLoading: isUpdatingStatus }] = useUpdateLicenseStatusMutation();
	const [deleteLicense, { isLoading: isDeleting }] = useDeleteLicenseMutation();

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>(StatusFilter.ALL);
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showColumns, setShowColumns] = useState(false);
	const columnVisibilityRef = useRef<HTMLDivElement>(null);
	useCloseOnOutsideClick(columnVisibilityRef, showColumns, () => setShowColumns(false));
	const [dialogLicense, setDialogLicense] = useState<License | null>(null);
	const [showDialog, setShowDialog] = useState(false);
	const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<Status>(Status.INACTIVE);
	const [reason, setReason] = useState("");

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredLicenses = useMemo(() => {
		const query = search.trim().toLowerCase();
		return licenses.filter(
			(item) =>
				(!query || item.license.toLowerCase().includes(query)) &&
				(statusFilter === StatusFilter.ALL || item.status === statusFilter),
		);
	}, [licenses, search, statusFilter]);
	const pageCount = Math.max(1, Math.ceil(filteredLicenses.length / pageSize));
	const currentPage = Math.min(page, pageCount - 1);
	const pageRows = filteredLicenses.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
	const isConfirming = isDeleting;

	const toggleColumn = (key: ColumnKey) => {
		setHiddenColumns((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
	};

	const openDialog = (item: License | null) => {
		setDialogLicense(item);
		setShowDialog(true);
	};

	const closeConfirm = () => {
		setPendingAction(null);
		setReason("");
	};

	const confirmDelete = async () => {
		if (!pendingAction || pendingAction.type !== "delete") return;
		try {
			await deleteLicense(pendingAction.license.externalId).unwrap();
			toast.success(`${pendingAction.license.license} deleted.`);
			closeConfirm();
		} catch (error) {
			console.error("Failed to delete license.", error);
			toast.error(apiErrorMessage(error, "Could not delete the license."));
		}
	};

	const confirmStatusChange = async () => {
		if (!pendingAction || pendingAction.type !== "status") return;
		const { license } = pendingAction;
		if (selectedStatus === license.status) {
			toast.error("Select a different status to change.");
			return;
		}
		if (selectedStatus === Status.INACTIVE && !reason.trim()) {
			toast.error("Please enter a reason when setting Inactive.");
			return;
		}
		try {
			await updateLicenseStatus({
				externalId: license.externalId,
				status: selectedStatus,
				reason: selectedStatus === Status.INACTIVE ? reason.trim() : "",
			}).unwrap();
			toast.success(`${license.license} is now ${statusLabel(selectedStatus).toLowerCase()}.`);
			closeConfirm();
		} catch (error) {
			console.error("Failed to update license status.", error);
			toast.error(apiErrorMessage(error, "Could not update the license status."));
		}
	};

	const renderCell = (item: License, key: ColumnKey, index: number) => {
		switch (key) {
			case "sn":
				return currentPage * pageSize + index + 1;
			case "license":
				return <span className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{item.license || "—"}</span>;
			case "status": {
				const isActive = item.status === Status.ACTIVE;
				return (
					<span
						className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
							isActive
								? isDark ? "border-emerald-300/25 bg-emerald-300/[0.10] text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-700"
								: isDark ? "border-rose-300/25 bg-rose-300/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"
						}`}
					>
						<span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-rose-400"}`} />
						{statusLabel(item.status)}
					</span>
				);
			}
			case "reason":
				return item.reason || "—";
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
							<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Driver License</h1>
							<span className={`rounded-full border px-2.5 py-1 text-[10px] ${isDark ? "border-white/[0.08] bg-white/[0.04] text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>{licenses.length} records</span>
						</div>
					</div>
					<button type="button" onClick={() => void refetch()} disabled={isFetching} aria-label="Refresh licenses" className={`flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-60 ${isDark ? "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<div className="flex flex-col gap-2 sm:flex-row">
							<label className="relative block min-w-0 sm:w-[300px]">
								<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
								<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search license..." aria-label="Search licenses" className={`h-10 w-full rounded-lg border pl-9 pr-3 text-xs outline-none ${isDark ? "border-white/[0.12] bg-[#03091c]/80 text-white placeholder:text-slate-400 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
							</label>
							<label className="sr-only" htmlFor="license-status-filter">Status</label>
							<div className="relative sm:w-[160px]">
								<select id="license-status-filter" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as StatusFilter); setPage(0); }} className={`${inputClass(isDark)} appearance-none pr-8`}>
									{statusFilters.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative">
								<select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
									{[10, 25, 50].map((size) => <option key={size} value={size}>{size} rows</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<div ref={columnVisibilityRef} className="relative">
								<button type="button" onClick={() => setShowColumns((visible) => !visible)} aria-expanded={showColumns} className={toolbarButtonClass(isDark)}>
									<Columns3 className="h-3.5 w-3.5" /> Column Visibility <ChevronDown className="h-3 w-3" />
								</button>
								{showColumns && (
									<div className={`absolute right-0 z-30 mt-2 w-48 rounded-lg border p-2 shadow-xl ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
										{columns.map((column) => (
											<label key={column.key} className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.05]" : "text-slate-700 hover:bg-slate-50"}`}>
												<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => toggleColumn(column.key)} className="h-3.5 w-3.5 accent-cyan-400" />
												{column.label}
											</label>
										))}
									</div>
								)}
							</div>
							<button type="button" onClick={() => openDialog(null)} className={primaryButtonClass(isDark)}>
								<Plus className="h-3.5 w-3.5" /> Add License
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{column.label}</th>)}
									<th scope="col" className="w-[140px] whitespace-nowrap px-4 py-3 text-center font-medium">Actions</th>
								</tr>
							</thead>
							<tbody>
								{isLoading || isError || pageRows.length === 0 ? (
									<tr>
										<td colSpan={visibleColumns.length + 1} className={`px-4 py-10 text-center text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
											{isLoading ? (
												<span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading licenses...</span>
											) : isError ? (
												<span className={isDark ? "text-rose-300" : "text-rose-600"}>
													Could not load licenses.{" "}
													<button type="button" onClick={() => void refetch()} className="font-semibold underline underline-offset-2">Try again</button>
												</span>
											) : licenses.length === 0 ? (
												"No licenses yet. Click “Add License” to create one."
											) : (
												"No licenses match your filters."
											)}
										</td>
									</tr>
								) : pageRows.map((item, index) => (
									<tr key={item.externalId} className={`border-b ${isDark ? "border-white/[0.06] text-slate-300 hover:bg-white/[0.025]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => (
											<td key={column.key} className="whitespace-nowrap px-4 py-3 text-xs">{renderCell(item, column.key, index)}</td>
										))}
										<td className="px-4 py-2.5">
											<div className="flex items-center justify-center gap-2">
												<button type="button" title="Edit license" aria-label={`Edit ${item.license}`} onClick={() => openDialog(item)} className={iconButtonClass("neutral")}>
													<Pencil className="h-3.5 w-3.5" />
												</button>
												<button type="button" title="Change status" aria-label={`Change status of ${item.license}`} onClick={() => { setSelectedStatus(item.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE); setReason(""); setPendingAction({ type: "status", license: item }); }} className={iconButtonClass("violet")}>
													<Power className="h-3.5 w-3.5" />
												</button>
												<button type="button" title="Delete license" aria-label={`Delete ${item.license}`} onClick={() => setPendingAction({ type: "delete", license: item })} className={iconButtonClass("rose")}>
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between ${isDark ? "text-slate-400" : "text-slate-600"}`}>
						<span>Showing {filteredLicenses.length === 0 ? 0 : currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, filteredLicenses.length)} of {filteredLicenses.length} entries</span>
						<div className="flex items-center gap-2">
							<button type="button" onClick={() => setPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} aria-label="Previous page" className="rounded p-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
							<span>{currentPage + 1} of {pageCount} pages</span>
							<button type="button" onClick={() => setPage(Math.min(pageCount - 1, currentPage + 1))} disabled={currentPage >= pageCount - 1} aria-label="Next page" className="rounded p-1 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
						</div>
					</footer>
				</section>
			</main>

			{showDialog && (
				<AddLicenseDialog
					isDark={isDark}
					license={dialogLicense}
					onClose={() => setShowDialog(false)}
				/>
			)}

			{pendingAction?.type === "delete" && (
				<div className="fixed inset-0 z-[810] flex items-center justify-center bg-[#020718]/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isConfirming) closeConfirm(); }}>
					<section role="alertdialog" aria-modal="true" aria-labelledby="license-confirm-title" className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
						<h3 id="license-confirm-title" className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Delete license?</h3>
						<p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							This will permanently remove <strong className={isDark ? "text-white" : "text-slate-900"}>{pendingAction.license.license}</strong>.
						</p>
						<div className="mt-5 flex justify-end gap-2">
							<button type="button" onClick={closeConfirm} disabled={isConfirming} className={`h-9 rounded-lg border px-4 text-[12px] disabled:opacity-40 ${isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"}`}>Cancel</button>
							<button type="button" onClick={() => void confirmDelete()} disabled={isConfirming} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold disabled:opacity-60 ${isDark ? "border-rose-300/30 bg-rose-400/[0.16] text-rose-100 hover:bg-rose-400/[0.24]" : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}>
								{isConfirming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
								Delete
							</button>
						</div>
					</section>
				</div>
			)}

			<ChangeStatusDialog
				isDark={isDark}
				open={pendingAction?.type === "status"}
				title="Change license status"
				entityName={pendingAction?.license.license || "this license"}
				entityNoun="license"
				currentStatus={pendingAction?.license.status ?? Status.ACTIVE}
				selectedStatus={selectedStatus}
				onSelectedStatusChange={setSelectedStatus}
				reason={reason}
				onReasonChange={setReason}
				isSubmitting={isUpdatingStatus}
				onCancel={closeConfirm}
				onConfirm={() => void confirmStatusChange()}
				titleId="license-status-title"
			/>
		</div>
	);
}
