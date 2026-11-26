import {useMemo, useState, useRef} from "react";
import { useCloseDetailsOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, Loader2, Pencil, Plus, Power, RefreshCw, Search, Trash2, X } from "lucide-react";
import { ChangeStatusDialog } from "@/components/common/ChangeStatusDialog";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddJobSheet } from "@/components/ManageTechnician/AddJobSheet";
import { useAuth } from "@/contexts/AuthContext";
import { Status, statusLabel } from "@/enums/Status";
import type { JobSheet as JobSheetEntity } from "@/interfaces/JobSheet";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useDeleteJobSheetMutation, useGetJobSheetsQuery, useUpdateJobSheetMutation } from "@/store/services/api/JobSheet";
import { useGetTechnicianMasterQuery, useGetTransporterMasterQuery, useGetVehicleMasterQuery } from "@/store/services/api/Master";
import { useGetVehiclesQuery } from "@/store/services/api/Vehicle";

type JobStatus = "Active" | "Inactive";

type JobSheetRecord = {
	id: string;
	technicianName: string;
	vehicle: string;
	transporter: string;
	contactPerson: string;
	phone: string;
	instruction: string;
	task: string;
	remark: string;
	orderNo: string;
	assignOn: string;
	doneOn: string;
	status: JobStatus;
	reason: string;
	closedBy: string;
};

type ColumnKey = "technicianName" | "vehicle" | "transporter" | "contactPerson" | "phone" | "instruction" | "task" | "remark" | "orderNo" | "assignOn" | "doneOn" | "status" | "reason" | "closedBy" | "action";
type StatusFilter = "All" | JobStatus;

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "technicianName", label: "Technician Name" },
	{ key: "vehicle", label: "Vehicle No." },
	{ key: "transporter", label: "Transporter" },
	{ key: "contactPerson", label: "Contact Person" },
	{ key: "phone", label: "Phone No." },
	{ key: "instruction", label: "Instruction" },
	{ key: "task", label: "Task" },
	{ key: "remark", label: "Remark" },
	{ key: "orderNo", label: "Order No." },
	{ key: "assignOn", label: "Assign On" },
	{ key: "doneOn", label: "Done On" },
	{ key: "status", label: "Status" },
	{ key: "reason", label: "Reason" },
	{ key: "closedBy", label: "Closed By" },
	{ key: "action", label: "Action" },
];

const textValue = (value: unknown) => {
	const text = value == null ? "" : String(value);
	return text.trim() ? text : "—";
};

const dateLabel = (value?: string) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

export default function JobSheet() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: jobSheets = [], isLoading, isFetching, isError, refetch } = useGetJobSheetsQuery();
	const { data: vehicleOptions = [] } = useGetVehicleMasterQuery();
	const { data: technicians = [] } = useGetTechnicianMasterQuery();
	const { data: transporters = [] } = useGetTransporterMasterQuery();
	const { data: vehicles = [] } = useGetVehiclesQuery();
	const [updateJobSheet, { isLoading: isUpdatingStatus }] = useUpdateJobSheetMutation();
	const [deleteJobSheet, { isLoading: isDeleting }] = useDeleteJobSheetMutation();
	const [editingJob, setEditingJob] = useState<JobSheetEntity | null>(null);
	const columnVisibilityRef = useRef<HTMLDetailsElement>(null);
	useCloseDetailsOnOutsideClick(columnVisibilityRef);
	const [pendingStatusJob, setPendingStatusJob] = useState<JobSheetRecord | null>(null);
	const [pendingDeleteJob, setPendingDeleteJob] = useState<JobSheetRecord | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<Status>(Status.INACTIVE);
	const [statusReason, setStatusReason] = useState("");
	const rows = useMemo<JobSheetRecord[]>(() => {
		const vehicleNames = new Map(
			vehicleOptions.flatMap((vehicle) => {
				const entries: [string, string][] = [[vehicle.id, vehicle.name]];
				if (vehicle.externalId) entries.push([vehicle.externalId, vehicle.name]);
				return entries;
			}),
		);
		const technicianNames = new Map(
			technicians.flatMap((technician) => {
				const entries: [string, string][] = [[technician.id, technician.name]];
				if (technician.externalId) entries.push([technician.externalId, technician.name]);
				return entries;
			}),
		);
		const transporterNames = new Map(
			transporters.flatMap((transporter) => {
				const entries: [string, string][] = [[transporter.id, transporter.name]];
				if (transporter.externalId) entries.push([transporter.externalId, transporter.name]);
				return entries;
			}),
		);
		const vehicleTransporterIds = new Map(
			vehicles.flatMap((vehicle) => {
				const vehicleId = String(vehicle.externalId || vehicle.id || "");
				const transporterRef = vehicle.transporter as unknown;
				let transporterId = "";
				if (typeof transporterRef === "string" || typeof transporterRef === "number") {
					transporterId = String(transporterRef);
				} else if (transporterRef && typeof transporterRef === "object") {
					const ref = transporterRef as { externalId?: string; id?: string | number; name?: string; userName?: string; companyName?: string };
					transporterId = String(ref.externalId ?? ref.id ?? "");
					const nestedName = ref.name?.trim() || ref.userName?.trim() || ref.companyName?.trim() || "";
					if (transporterId && nestedName) transporterNames.set(transporterId, nestedName);
				}
				return vehicleId && transporterId ? [[vehicleId, transporterId] as [string, string]] : [];
			}),
		);
		return jobSheets.map((job) => {
			const inactive = String(job.status ?? "").toLowerCase() !== Status.ACTIVE;
			const technicianName =
				job.technicianName?.trim() ||
				technicianNames.get(job.technician) ||
				job.technician ||
				"";
			const vehicleNo =
				job.vehicleNo?.trim() ||
				vehicleNames.get(job.vehicle) ||
				job.vehicle ||
				"";
			const transporterId = vehicleTransporterIds.get(job.vehicle) ?? "";
			const transporter =
				job.transporterName?.trim() ||
				(transporterId ? transporterNames.get(transporterId) : "") ||
				"";
			const reason = String(job.reason ?? "").trim();
			const systemReasons = new Set(["New jobsheet created", "Job completed", "Jobsheet updated"]);
			const inactiveReason = inactive && reason && !systemReasons.has(reason) ? reason : "";
			return {
				id: job.externalId || String(job.id),
				technicianName,
				vehicle: vehicleNo,
				transporter,
				contactPerson: job.contactPersonName ?? "",
				phone: job.phone ?? "",
				instruction: job.instruction ?? "",
				task: "",
				remark: "",
				orderNo: job.orderNo ?? "",
				assignOn: dateLabel(job.createdAt),
				doneOn: inactive ? dateLabel(job.updatedAt) : "",
				status: inactive ? "Inactive" : "Active",
				reason: inactiveReason,
				closedBy: inactive ? technicianName : "",
			};
		});
	}, [jobSheets, vehicleOptions, technicians, transporters, vehicles]);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);

	const activeCount = rows.filter((row) => row.status === "Active").length;
	const inactiveCount = rows.filter((row) => row.status === "Inactive").length;
	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return rows.filter((row) => {
			if (statusFilter !== "All" && row.status !== statusFilter) return false;
			if (!query) return true;
			return [row.technicianName, row.vehicle, row.transporter, row.contactPerson, row.phone, row.instruction, row.task, row.remark, row.orderNo, row.status, row.reason].join(" ").toLowerCase().includes(query);
		});
	}, [rows, search, statusFilter]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const saveJob = () => {
		setSearch("");
		setStatusFilter("All");
		setPage(0);
		setShowAddDialog(false);
		setEditingJob(null);
		void refetch();
	};

	const openEdit = (id: string) => {
		const job = jobSheets.find((item) => (item.externalId || String(item.id)) === id) ?? null;
		if (!job) {
			toast.error("Could not find this job sheet.");
			return;
		}
		setShowAddDialog(false);
		setEditingJob(job);
	};

	const closeStatusDialog = () => {
		setPendingStatusJob(null);
		setStatusReason("");
	};

	const closeDeleteDialog = () => {
		if (isDeleting) return;
		setPendingDeleteJob(null);
	};

	const confirmDelete = async () => {
		if (!pendingDeleteJob?.id) return;
		try {
			await deleteJobSheet(pendingDeleteJob.id).unwrap();
			toast.success("Job sheet deleted.");
			setPendingDeleteJob(null);
			void refetch();
		} catch (error) {
			console.error("Failed to delete job sheet.", error);
			toast.error(apiErrorMessage(error, "Could not delete the job sheet."));
		}
	};

	const jobSheetCurrentStatus = (row: JobSheetRecord) =>
		row.status === "Active" ? Status.ACTIVE : Status.INACTIVE;

	const openStatusChange = (row: JobSheetRecord) => {
		const currentStatus = jobSheetCurrentStatus(row);
		setSelectedStatus(currentStatus === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE);
		setStatusReason("");
		setPendingStatusJob(row);
	};

	const confirmStatusChange = async () => {
		if (!pendingStatusJob) return;
		const currentStatus = jobSheetCurrentStatus(pendingStatusJob);
		if (selectedStatus === currentStatus) {
			toast.error("Select a different status to change.");
			return;
		}
		if (selectedStatus === Status.INACTIVE && !statusReason.trim()) {
			toast.error("Please enter a reason when setting Inactive.");
			return;
		}
		try {
			await updateJobSheet({
				externalId: pendingStatusJob.id,
				body: {
					status: selectedStatus,
					reason: selectedStatus === Status.INACTIVE ? statusReason.trim() : "",
				},
			}).unwrap();
			toast.success(`Job sheet is now ${statusLabel(selectedStatus).toLowerCase()}.`);
			closeStatusDialog();
			void refetch();
		} catch (error) {
			console.error("Failed to update job sheet status.", error);
			toast.error(apiErrorMessage(error, "Could not update the job sheet status."));
		}
	};

	const cell = (key: ColumnKey, row: JobSheetRecord) => {
		if (key === "technicianName" || key === "vehicle") return <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{textValue(row[key])}</span>;
		if (key === "reason") return row.reason.trim() ? row.reason : "—";
		if (key === "status") {
			const active = row.status === "Active";
			return (
				<button
					type="button"
					onClick={() => openStatusChange(row)}
					disabled={isUpdatingStatus}
					aria-label={`Change status of ${row.vehicle}`}
					title="Change status"
					className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold transition disabled:opacity-50 ${
						active
							? isDark
								? "bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25"
								: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
							: isDark
								? "bg-rose-400/15 text-rose-200 hover:bg-rose-400/25"
								: "bg-rose-50 text-rose-700 hover:bg-rose-100"
					}`}
				>
					{row.status}
				</button>
			);
		}
		if (key === "action") {
			return (
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={() => openEdit(row.id)}
						aria-label={`Edit job sheet ${row.vehicle}`}
						title="Edit"
						className={`inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-semibold transition ${isDark ? "border-white/[0.10] text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-300/[0.10] hover:text-cyan-100" : "border-slate-200 text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"}`}
					>
						<Pencil className="h-3.5 w-3.5" /> Edit
					</button>
					<button
						type="button"
						onClick={() => openStatusChange(row)}
						disabled={isUpdatingStatus}
						aria-label={`Change status of ${row.vehicle}`}
						title="Change status"
						className={`inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-semibold transition disabled:opacity-50 ${
							isDark
								? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.14]"
								: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
						}`}
					>
						<Power className="h-3.5 w-3.5" /> Status
					</button>
					<button
						type="button"
						onClick={() => setPendingDeleteJob(row)}
						disabled={isDeleting}
						aria-label={`Delete job sheet ${row.vehicle}`}
						title="Delete"
						className={`inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-semibold transition disabled:opacity-50 ${
							isDark
								? "border-rose-300/20 bg-rose-300/[0.08] text-rose-200 hover:bg-rose-300/[0.14]"
								: "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
						}`}
					>
						<Trash2 className="h-3.5 w-3.5" /> Delete
					</button>
				</div>
			);
		}
		return textValue(row[key]);
	};

	const filters: { key: StatusFilter; label: string; className: string }[] = [
		{ key: "All", label: `All : ${rows.length}`, className: isDark ? "border-cyan-300/30 text-cyan-100" : "border-cyan-300 text-cyan-700" },
		{ key: "Active", label: `Active : ${activeCount}`, className: isDark ? "border-emerald-300/30 text-emerald-200" : "border-emerald-300 text-emerald-700" },
		{ key: "Inactive", label: `Inactive : ${inactiveCount}`, className: isDark ? "border-rose-300/30 text-rose-200" : "border-rose-300 text-rose-700" },
	];

	const inputClass = `h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-200 placeholder:text-slate-500 focus:border-cyan-300/35 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 [color-scheme:light]"
	}`;

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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Job Sheet</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{rows.length} jobs</p>
					</div>
					<button type="button" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh job sheets" title="Refresh job sheets" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:opacity-60 ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<div className="mb-4 flex flex-wrap gap-2">
					{filters.map((filter) => (
						<button key={filter.key} type="button" aria-pressed={statusFilter === filter.key} onClick={() => { setStatusFilter(filter.key); setPage(0); }} className={`h-8 rounded-md border px-3 text-[11px] font-semibold uppercase tracking-wide transition ${filter.className} ${statusFilter === filter.key ? (isDark ? "bg-white/[0.06]" : "bg-white") : "bg-transparent"}`}>
							{filter.label}
						</button>
					))}
				</div>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search" aria-label="Search job sheet" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
							{search && (
								<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative">
								<select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 [color-scheme:dark]" : "border-slate-200 bg-white text-slate-700"}`}>
									{[10, 25, 50].map((size) => <option key={size} value={size}>{size} rows</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<details ref={columnVisibilityRef} className="relative">
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
							<button type="button" onClick={() => { setEditingJob(null); setShowAddDialog(true); }} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
								<Plus className="h-3.5 w-3.5" /> Add
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1500px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => <th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">{column.label}</th>)}
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row) => (
									<tr key={row.id} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => <td key={column.key} className="max-w-[240px] truncate whitespace-nowrap px-3 py-3 first:px-4">{cell(column.key, row)}</td>)}
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{isLoading ? "Loading job sheets…" : isError ? "Could not load job sheets" : "No job sheets available"}</p>
											<p className="mt-1 text-xs text-slate-500">{isError ? "Use refresh to try again." : "Add a job or change the status filter."}</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} jobs
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

			{(showAddDialog || editingJob) && (
				<AddJobSheet
					jobSheet={editingJob}
					onClose={() => {
						setShowAddDialog(false);
						setEditingJob(null);
					}}
					onSaved={saveJob}
				/>
			)}

			<ChangeStatusDialog
				isDark={isDark}
				open={Boolean(pendingStatusJob)}
				title="Change job sheet status"
				entityName={pendingStatusJob?.vehicle || pendingStatusJob?.technicianName || "this job sheet"}
				entityNoun="job sheet"
				currentStatus={
					pendingStatusJob ? jobSheetCurrentStatus(pendingStatusJob) : Status.ACTIVE
				}
				selectedStatus={selectedStatus}
				onSelectedStatusChange={setSelectedStatus}
				reason={statusReason}
				onReasonChange={setStatusReason}
				isSubmitting={isUpdatingStatus}
				onCancel={closeStatusDialog}
				onConfirm={() => void confirmStatusChange()}
				titleId="job-status-title"
			/>

			{pendingDeleteJob ? (
				<div className="fixed inset-0 z-[820] flex items-center justify-center p-4">
					<button type="button" aria-label="Close delete dialog" className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]" onClick={closeDeleteDialog} />
					<section
						role="dialog"
						aria-modal="true"
						aria-labelledby="job-delete-title"
						className={`relative w-full max-w-md rounded-2xl border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
							isDark ? "border-white/[0.10] bg-[#0a1630] text-white" : "border-slate-200 bg-white text-slate-900"
						}`}
					>
						<h2 id="job-delete-title" className="text-[15px] font-semibold">
							Delete job sheet
						</h2>
						<p className={`mt-2 text-[12px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							Delete job for <span className="font-medium">{pendingDeleteJob.vehicle}</span>
							{pendingDeleteJob.technicianName ? (
								<>
									{" "}
									(<span className="font-medium">{pendingDeleteJob.technicianName}</span>)
								</>
							) : null}
							? This cannot be undone.
						</p>
						<div className="mt-5 flex justify-end gap-2">
							<button
								type="button"
								onClick={closeDeleteDialog}
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
