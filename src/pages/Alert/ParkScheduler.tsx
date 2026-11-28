import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { ArrowUpDown, Loader2, Pencil, Plus, Power, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ChangeStatusDialog } from "@/components/common/ChangeStatusDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { AlertModal } from "@/components/Alert/AlertModal";
import { EmptyTableRow, TableFooter } from "@/components/Alert/AlertTable";
import {
	cardClass,
	inputClass,
	labelClass,
	primaryButtonClass,
	refreshButtonClass,
	searchIconClass,
	searchInputClass,
	secondaryButtonClass,
	tableHeadRowClass,
	tableRowClass,
	thClass,
	toolbarClass,
} from "@/components/Alert/alertTheme";
import { Sidebar } from "@/components/layout/Sidebar";
import { useGetClientMasterQuery, useGetTransporterMasterQuery, useGetVehicleMasterQuery } from "@/store/services/api/Master";
import {
	useCreateParkedScheduleMutation,
	useDeleteParkedScheduleMutation,
	useGetParkedSchedulesQuery,
	useUpdateParkedScheduleMutation,
	useUpdateParkedScheduleStatusMutation,
} from "@/store/services/api/ParkedSchedule";
import { useAuth } from "@/contexts/AuthContext";
import { Status, statusLabel } from "@/enums/Status";
import type { ParkedScheduleFrequency } from "@/interfaces/ParkedSchedule";
import { apiErrorMessage } from "@/lib/apiErrorMessage";

type ParkedRow = {
	id: string;
	transporter: string;
	vehicles: string;
	scheduled: string;
	parkedStartDate: string;
	parkedEndDate: string;
	startTime: string;
	endTime: string;
	status: Status;
	reason: string;
};

type ColumnKey = keyof Omit<ParkedRow, "id">;

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "transporter", label: "Transporter" },
	{ key: "vehicles", label: "Vehicle(s)" },
	{ key: "scheduled", label: "Scheduled" },
	{ key: "parkedStartDate", label: "Parked Start Date" },
	{ key: "parkedEndDate", label: "Parked End Date" },
	{ key: "startTime", label: "Start Time" },
	{ key: "endTime", label: "End Time" },
	{ key: "status", label: "Status" },
	{ key: "reason", label: "Reason" },
];

const schedules: ParkedScheduleFrequency[] = ["Daily", "Weekly", "Monthly"];

const emptyForm = {
	client: "",
	transporter: "",
	vehicle: "",
	scheduled: "Daily" as ParkedScheduleFrequency,
	startDate: "",
	endDate: "",
	from: "00:00",
	till: "00:00",
};

const dateLabel = (value?: string) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

const toDateInput = (value?: string) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value.slice(0, 10);
	return date.toISOString().slice(0, 10);
};

const toTimeInput = (value?: string) => {
	if (!value) return "00:00";
	return value.slice(0, 5);
};

const currentStatus = (value?: string) =>
	String(value ?? "").trim().toLowerCase() === Status.INACTIVE ? Status.INACTIVE : Status.ACTIVE;

const refId = (value: unknown): string => {
	if (typeof value === "string" || typeof value === "number") return String(value);
	if (value && typeof value === "object") {
		const record = value as { id?: string | number; externalId?: string };
		return String(record.externalId ?? record.id ?? "");
	}
	return "";
};

const refLabel = (value: unknown, ...keys: string[]): string => {
	if (typeof value === "string" || typeof value === "number") return String(value);
	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		for (const key of keys) {
			const label = record[key];
			if (typeof label === "string" || typeof label === "number") {
				const text = String(label).trim();
				if (text) return text;
			}
		}
	}
	return "";
};

export default function ParkScheduler() {
	const { data: clients = [] } = useGetClientMasterQuery();
	const { data: allVehicles = [] } = useGetVehicleMasterQuery();
	const { data: schedulesData = [], isFetching, refetch } = useGetParkedSchedulesQuery();
	const [createParkedSchedule, { isLoading: isCreating }] = useCreateParkedScheduleMutation();
	const [updateParkedSchedule, { isLoading: isUpdating }] = useUpdateParkedScheduleMutation();
	const [updateParkedScheduleStatus, { isLoading: isUpdatingStatus }] = useUpdateParkedScheduleStatusMutation();
	const [deleteParkedSchedule, { isLoading: isDeleting }] = useDeleteParkedScheduleMutation();
	const isSaving = isCreating || isUpdating;
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [sortKey, setSortKey] = useState<ColumnKey>("transporter");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [formOpen, setFormOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState(emptyForm);
	/** Unscoped list for table name resolution only. */
	const { data: allTransporters = [] } = useGetTransporterMasterQuery();
	const {
		data: transporters = [],
		isLoading: transportersLoading,
		isFetching: transportersFetching,
	} = useGetTransporterMasterQuery(form.client ? { client: form.client } : undefined, { skip: !form.client });
	const vehicles = useMemo(() => {
		if (!form.client || !form.transporter) return [];
		return allVehicles.filter((item) => {
			const clientOk = !item.clientId || item.clientId === form.client;
			return clientOk && item.transporterId === form.transporter;
		});
	}, [allVehicles, form.client, form.transporter]);

	useEffect(() => {
		if (!form.transporter || !form.client) return;
		if (transportersLoading || transportersFetching) return;
		if (transporters.some((item) => item.id === form.transporter)) return;
		setForm((current) => ({ ...current, transporter: "", vehicle: "" }));
	}, [form.client, form.transporter, transporters, transportersFetching, transportersLoading]);

	useEffect(() => {
		if (!form.vehicle || !form.transporter) return;
		if (vehicles.some((item) => item.id === form.vehicle)) return;
		setForm((current) => ({ ...current, vehicle: "" }));
	}, [form.vehicle, form.transporter, vehicles]);

	const rows = useMemo<ParkedRow[]>(() => {
		const transporterNames = new Map(allTransporters.map((transporter) => [transporter.id, transporter.name]));
		const vehicleNames = new Map(allVehicles.map((vehicle) => [vehicle.id, vehicle.name]));
		return schedulesData.map((schedule) => {
			const transporterId = refId(schedule.transporter);
			const vehicleId = refId(schedule.vehicle);
			return {
				id: schedule.externalId,
				transporter:
					transporterNames.get(transporterId) ||
					refLabel(schedule.transporter, "companyName", "name") ||
					transporterId,
				vehicles:
					vehicleNames.get(vehicleId) ||
					refLabel(schedule.vehicle, "vehicle", "vehicleNo", "name") ||
					vehicleId,
				scheduled: schedule.scheduled ?? "",
				parkedStartDate: dateLabel(schedule.startDate),
				parkedEndDate: dateLabel(schedule.endDate),
				startTime: schedule.scheduledFrom ?? "",
				endTime: schedule.scheduledTill ?? "",
				status: currentStatus(schedule.status),
				reason:
					currentStatus(schedule.status) === Status.INACTIVE
						? (schedule.reason?.trim() ?? "")
						: "",
			};
		});
	}, [schedulesData, allTransporters, allVehicles]);
	const [pendingStatus, setPendingStatus] = useState<ParkedRow | null>(null);
	const [pendingDelete, setPendingDelete] = useState<ParkedRow | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<Status>(Status.INACTIVE);
	const [statusReason, setStatusReason] = useState("");

	const pageSize = 10;
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		const matched = rows.filter((row) => !query || Object.values(row).join(" ").toLowerCase().includes(query));
		return [...matched].sort((left, right) => {
			const result = String(left[sortKey] ?? "").localeCompare(String(right[sortKey] ?? ""), undefined, {
				numeric: true,
			});
			return sortDir === "asc" ? result : -result;
		});
	}, [rows, search, sortKey, sortDir]);

	const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

	const sortBy = (key: ColumnKey) => {
		if (sortKey === key) setSortDir((current) => (current === "asc" ? "desc" : "asc"));
		else {
			setSortKey(key);
			setSortDir("asc");
		}
	};

	const closeForm = () => {
		setFormOpen(false);
		setEditingId(null);
		setForm(emptyForm);
	};

	const openAddForm = () => {
		setEditingId(null);
		setForm(emptyForm);
		setFormOpen(true);
	};

	const openEdit = (row: ParkedRow) => {
		const record = schedulesData.find((schedule) => schedule.externalId === row.id);
		if (!record) {
			toast.error("Could not load this schedule for editing.");
			return;
		}
		setEditingId(row.id);
		setForm({
			client: refId(record.client),
			transporter: refId(record.transporter),
			vehicle: refId(record.vehicle),
			scheduled: (record.scheduled as ParkedScheduleFrequency) || "Daily",
			startDate: toDateInput(record.startDate),
			endDate: toDateInput(record.endDate),
			from: toTimeInput(record.scheduledFrom),
			till: toTimeInput(record.scheduledTill),
		});
		setFormOpen(true);
	};

	const saveSchedule = async () => {
		if (isSaving) return;
		if (
			!form.client ||
			!form.transporter ||
			!form.vehicle ||
			!form.scheduled ||
			!form.startDate ||
			!form.endDate ||
			!form.from ||
			!form.till
		) {
			toast.error("Please fill all required fields.");
			return;
		}
		if (form.endDate < form.startDate) {
			toast.error("Parked End Date cannot be before Parked Start Date.");
			return;
		}
		const body = {
			client: form.client,
			transporter: form.transporter,
			vehicle: form.vehicle,
			scheduled: form.scheduled,
			startDate: form.startDate,
			endDate: form.endDate,
			scheduledFrom: form.from,
			scheduledTill: form.till,
			status: Status.ACTIVE,
			reason: editingId ? undefined : "New parked schedule created",
		};
		try {
			if (editingId) {
				await updateParkedSchedule({ externalId: editingId, body }).unwrap();
				toast.success("Parked schedule updated.");
			} else {
				await createParkedSchedule(body).unwrap();
				toast.success("Parked schedule saved.");
			}
			closeForm();
			setPage(0);
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not save the parked schedule."));
		}
	};

	const closeStatusDialog = () => {
		setPendingStatus(null);
		setStatusReason("");
	};

	const confirmStatusChange = async () => {
		if (!pendingStatus?.id) return;
		if (selectedStatus === pendingStatus.status) {
			toast.error("Select a different status to change.");
			return;
		}
		if (selectedStatus === Status.INACTIVE && !statusReason.trim()) {
			toast.error("Please enter a reason when setting Inactive.");
			return;
		}
		try {
			await updateParkedScheduleStatus({
				externalId: pendingStatus.id,
				status: selectedStatus,
				reason: selectedStatus === Status.INACTIVE ? statusReason.trim() : "",
			}).unwrap();
			toast.success(
				`${pendingStatus.vehicles || "Schedule"} is now ${statusLabel(selectedStatus).toLowerCase()}.`,
			);
			closeStatusDialog();
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not update the schedule status."));
		}
	};

	const confirmDelete = async () => {
		if (!pendingDelete?.id) return;
		try {
			await deleteParkedSchedule(pendingDelete.id).unwrap();
			toast.success("Parked schedule deleted.");
			setPendingDelete(null);
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not delete the parked schedule."));
		}
	};

	const iconButtonClass = (tone: "cyan" | "violet" | "rose") => {
		const tones = {
			cyan: isDark
				? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100 hover:bg-cyan-300/[0.14]"
				: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
			violet: isDark
				? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.14]"
				: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
			rose: isDark
				? "border-rose-300/20 bg-rose-300/[0.08] text-rose-200 hover:bg-rose-300/[0.14]"
				: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
		};
		return `inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition disabled:opacity-50 ${tones[tone]}`;
	};

	const field = (id: string, label: string, control: ReactNode) => (
		<div>
			<label htmlFor={id} className={labelClass(isDark)}>
				{label} <span className="text-rose-400">*</span>
			</label>
			{control}
		</div>
	);

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
								Parked Scheduler
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
						onClick={() => refetch()}
						aria-label="Refresh parked schedules"
						className={refreshButtonClass(isDark)}
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
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
								placeholder="Search transporter, vehicle..."
								aria-label="Search parked schedules"
								className={searchInputClass(isDark)}
							/>
						</label>
						<button type="button" onClick={openAddForm} className={primaryButtonClass(isDark)}>
							<Plus className="h-3.5 w-3.5" /> Add Schedule
						</button>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1080px] border-collapse text-left">
							<thead>
								<tr className={tableHeadRowClass(isDark)}>
									{columns.map((column) => (
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
									<th scope="col" className={`${thClass} text-center`}>
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{pageRows.length === 0 ? (
									<EmptyTableRow
										isDark={isDark}
										colSpan={columns.length + 1}
										title={rows.length === 0 ? "No parked schedules yet" : "No schedules match your search"}
										hint={rows.length === 0 ? "Click “Add Schedule” to create one." : undefined}
									/>
								) : (
									pageRows.map((row) => (
										<tr key={row.id} className={tableRowClass(isDark)}>
											{columns.map((column) => (
												<td key={column.key} className="whitespace-nowrap px-4 py-3">
													{column.key === "status" ? (
														<span
															className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
																row.status === Status.ACTIVE
																	? isDark
																		? "border-emerald-300/25 bg-emerald-300/[0.10] text-emerald-200"
																		: "border-emerald-200 bg-emerald-50 text-emerald-700"
																	: isDark
																		? "border-rose-300/25 bg-rose-300/[0.08] text-rose-200"
																		: "border-rose-200 bg-rose-50 text-rose-700"
															}`}
														>
															<span
																className={`h-1.5 w-1.5 rounded-full ${
																	row.status === Status.ACTIVE ? "bg-emerald-400" : "bg-rose-400"
																}`}
															/>
															{statusLabel(row.status)}
														</span>
													) : (
														row[column.key] || "—"
													)}
												</td>
											))}
											<td className="px-4 py-2.5">
												<div className="flex items-center justify-center gap-1.5">
													<button
														type="button"
														title="Edit schedule"
														aria-label={`Edit schedule ${row.vehicles || row.id}`}
														onClick={() => openEdit(row)}
														className={iconButtonClass("cyan")}
													>
														<Pencil className="h-3.5 w-3.5" />
													</button>
													<button
														type="button"
														title="Change status"
														aria-label={`Change status of ${row.vehicles || row.id}`}
														onClick={() => {
															setSelectedStatus(row.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE);
															setStatusReason("");
															setPendingStatus(row);
														}}
														className={iconButtonClass("violet")}
													>
														<Power className="h-3.5 w-3.5" />
													</button>
													<button
														type="button"
														title="Delete schedule"
														aria-label={`Delete schedule ${row.vehicles || row.id}`}
														onClick={() => setPendingDelete(row)}
														className={iconButtonClass("rose")}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</button>
												</div>
											</td>
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

			{formOpen && (
				<AlertModal
					isDark={isDark}
					title={editingId ? "Edit Parked Schedule" : "Parked Schedule"}
					onClose={closeForm}
					onSubmit={saveSchedule}
					footer={
						<>
							<button
								type="button"
								onClick={() => {
									if (editingId) {
										const row = rows.find((item) => item.id === editingId);
										if (row) openEdit(row);
										return;
									}
									setForm(emptyForm);
								}}
								className={secondaryButtonClass(isDark)}
							>
								Reset
							</button>
							<button type="submit" disabled={isSaving} className={primaryButtonClass(isDark)}>
								{isSaving ? "Saving..." : editingId ? "Update" : "Save"}
							</button>
						</>
					}
				>
					<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
						{field(
							"park-client",
							"Client",
							<select
								id="park-client"
								value={form.client}
								onChange={(event) =>
									setForm({ ...form, client: event.target.value, transporter: "", vehicle: "" })
								}
								className={inputClass(isDark)}
							>
								<option value="">Select Client</option>
								{clients.map((client) => (
									<option key={client.id} value={client.id}>
										{client.name}
									</option>
								))}
							</select>,
						)}
						{field(
							"park-transporter",
							"Transporter",
							<select
								id="park-transporter"
								value={form.transporter}
								disabled={!form.client || transportersLoading || transportersFetching}
								onChange={(event) =>
									setForm({ ...form, transporter: event.target.value, vehicle: "" })
								}
								className={`${inputClass(isDark)} disabled:cursor-not-allowed disabled:opacity-55`}
							>
								<option value="">
									{!form.client
										? "Select Transporter"
										: transportersLoading || transportersFetching
											? "Loading transporters…"
											: "Select Transporter"}
								</option>
								{transporters.map((transporter) => (
									<option key={transporter.id} value={transporter.id}>
										{transporter.name}
									</option>
								))}
							</select>,
						)}
						{field(
							"park-vehicle",
							"Vehicle",
							<select
								id="park-vehicle"
								value={form.vehicle}
								disabled={!form.transporter}
								onChange={(event) => setForm({ ...form, vehicle: event.target.value })}
								className={`${inputClass(isDark)} disabled:cursor-not-allowed disabled:opacity-55`}
							>
								<option value="">Select Vehicle</option>
								{vehicles.map((vehicle) => (
									<option key={vehicle.id} value={vehicle.id}>
										{vehicle.name}
									</option>
								))}
							</select>,
						)}
						{field(
							"park-scheduled",
							"Scheduled",
							<select
								id="park-scheduled"
								value={form.scheduled}
								onChange={(event) =>
									setForm({ ...form, scheduled: event.target.value as ParkedScheduleFrequency })
								}
								className={inputClass(isDark)}
							>
								{schedules.map((name) => (
									<option key={name} value={name}>
										{name}
									</option>
								))}
							</select>,
						)}
						{field(
							"park-start-date",
							"Parked Start Date",
							<input
								id="park-start-date"
								type="date"
								value={form.startDate}
								onChange={(event) => setForm({ ...form, startDate: event.target.value })}
								className={inputClass(isDark)}
							/>,
						)}
						{field(
							"park-end-date",
							"Parked End Date",
							<input
								id="park-end-date"
								type="date"
								min={form.startDate || undefined}
								value={form.endDate}
								onChange={(event) => setForm({ ...form, endDate: event.target.value })}
								className={inputClass(isDark)}
							/>,
						)}
						{field(
							"park-from",
							"Scheduled From",
							<input
								id="park-from"
								type="time"
								value={form.from}
								onChange={(event) => setForm({ ...form, from: event.target.value })}
								className={inputClass(isDark)}
							/>,
						)}
						{field(
							"park-till",
							"Scheduled Till",
							<input
								id="park-till"
								type="time"
								value={form.till}
								onChange={(event) => setForm({ ...form, till: event.target.value })}
								className={inputClass(isDark)}
							/>,
						)}
					</div>
				</AlertModal>
			)}

			<ChangeStatusDialog
				isDark={isDark}
				open={Boolean(pendingStatus)}
				title="Change schedule status"
				entityName={pendingStatus?.vehicles || "this schedule"}
				entityNoun="schedule"
				currentStatus={pendingStatus?.status ?? Status.ACTIVE}
				selectedStatus={selectedStatus}
				onSelectedStatusChange={setSelectedStatus}
				reason={statusReason}
				onReasonChange={setStatusReason}
				isSubmitting={isUpdatingStatus}
				onCancel={closeStatusDialog}
				onConfirm={() => void confirmStatusChange()}
				titleId="park-status-title"
				zIndexClassName="z-[810]"
			/>

			<DeleteConfirmDialog
				isDark={isDark}
				open={!!pendingDelete}
				title="Delete schedule?"
				entityName={pendingDelete?.vehicles || "this vehicle"}
				description={
					<>
						This will permanently remove the schedule for{" "}
						<strong className={isDark ? "text-white" : "text-slate-900"}>
							{pendingDelete?.vehicles || "this vehicle"}
						</strong>
						.
					</>
				}
				isSubmitting={isDeleting}
				onCancel={() => {
					if (!isDeleting) setPendingDelete(null);
				}}
				onConfirm={() => void confirmDelete()}
				titleId="park-delete-title"
				zIndexClassName="z-[810]"
			/>
		</div>
	);
}
