import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { ArrowUpDown, Loader2, Pencil, Plus, Power, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import JoditEditor from "jodit-react";
import "jodit/es2021/jodit.min.css";
import { ChangeStatusDialog } from "@/components/common/ChangeStatusDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { AlertModal } from "@/components/Alert/AlertModal";
import { EmptyTableRow, TableFooter } from "@/components/Alert/AlertTable";
import {
	cardClass,
	checkboxClass,
	checkboxLabelClass,
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
import { useAuth } from "@/contexts/AuthContext";
import { useGetClientMasterQuery, useGetTransporterMasterQuery } from "@/store/services/api/Master";
import {
	useCreateAnnouncementMutation,
	useDeleteAnnouncementMutation,
	useGetAnnouncementsQuery,
	useUpdateAnnouncementMutation,
	useUpdateAnnouncementStatusMutation,
} from "@/store/services/api/Announcement";
import { Status, statusLabel } from "@/enums/Status";
import type {
	Announcement as AnnouncementRecord,
	AnnouncementAudience,
	AnnouncementMessageType,
	AnnouncementValidity,
} from "@/interfaces/Announcement";
import { apiErrorMessage } from "@/lib/apiErrorMessage";

type AnnouncementRow = {
	id: string;
	allocatedTo: string;
	clientList: string;
	transporterList: string;
	messageType: string;
	messageTitle: string;
	validFor: string;
	validityHours: string;
	validityDays: string;
	added: string;
	status: Status;
	reason: string;
};

type ColumnKey = keyof Omit<AnnouncementRow, "id">;

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "allocatedTo", label: "Allocated To" },
	{ key: "clientList", label: "Client List" },
	{ key: "transporterList", label: "Transporter List" },
	{ key: "messageType", label: "Message Type" },
	{ key: "messageTitle", label: "Message Title" },
	{ key: "validFor", label: "Announcement Valid For" },
	{ key: "validityHours", label: "Validity Hours" },
	{ key: "validityDays", label: "Validity Days" },
	{ key: "added", label: "Added" },
	{ key: "status", label: "Status" },
	{ key: "reason", label: "Reason" },
];

const audiences: { value: AnnouncementAudience; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "client", label: "Client" },
	{ value: "transporter", label: "Transporter" },
];
const audienceLabels = new Map(audiences.map((audience) => [audience.value, audience.label]));
const validityOptions: { value: AnnouncementValidity; label: string }[] = [
	{ value: "hours", label: "HOURS" },
	{ value: "days", label: "DAYS" },
];
const messageTypes: { value: AnnouncementMessageType; label: string }[] = [
	{ value: "text", label: "TEXT" },
	{ value: "image", label: "IMAGE" },
];

const normalizeMessageType = (value?: string): AnnouncementMessageType | "" => {
	const normalized = String(value ?? "").trim().toLowerCase();
	return normalized === "text" || normalized === "image" ? normalized : "";
};

type AnnouncementForm = {
	announcement: string;
	client: string;
	transporter: string;
	validity: string;
	duration: string;
	messageType: string;
	messageTitle: string;
	messageBody: string;
	messageImage: File | null;
	dontShowAgain: boolean;
	profileUpdate: boolean;
};

const emptyForm: AnnouncementForm = {
	announcement: "",
	client: "",
	transporter: "",
	validity: "",
	duration: "",
	messageTitle: "",
	messageType: "",
	messageBody: "",
	messageImage: null,
	dontShowAgain: false,
	profileUpdate: false,
};

const dateLabel = (value?: string) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
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

const cellText = (value: unknown) => {
	if (value == null || value === "") return "—";
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
	if (typeof value === "object") return refLabel(value, "name", "title", "label") || refId(value) || "—";
	return "—";
};

/** Pre-fills the form from a saved announcement so it can be edited; an image has to be picked again only when replaced. */
const formFromRecord = (record: AnnouncementRecord): AnnouncementForm => ({
	announcement: record.announcement ?? "",
	client: refId(record.client),
	transporter: refId(record.transporter),
	validity: record.validityTime ?? "",
	duration: record.validityDuration === undefined || record.validityDuration === null ? "" : String(record.validityDuration),
	messageType: normalizeMessageType(record.messageType),
	messageTitle: (record.title ?? "").slice(0, 255),
	messageBody: record.body ?? "",
	messageImage: null,
	dontShowAgain: Boolean(record.requestForDontShowAgainOption),
	profileUpdate: Boolean(record.requestForProfileUpdate),
});

export default function Announcement() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const editorConfig = useMemo(() => ({
		buttons: ["bold", "italic", "underline", "|", "ul", "ol", "|", "fontsize"],
		height: 112,
		minHeight: 112,
		placeholder: "Type here...",
		showXPathInStatusbar: false,
		statusbar: false,
		theme: isDark ? "dark" : "default",
		toolbarAdaptive: false,
	}), [isDark]);
	const { data: clients = [] } = useGetClientMasterQuery();
	/** Unscoped list for table name resolution only. */
	const { data: allTransporters = [] } = useGetTransporterMasterQuery();
	const { data: announcements = [], isFetching, refetch } = useGetAnnouncementsQuery();
	const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation();
	const [updateAnnouncement, { isLoading: isUpdating }] = useUpdateAnnouncementMutation();
	const [updateAnnouncementStatus, { isLoading: isUpdatingStatus }] = useUpdateAnnouncementStatusMutation();
	const [deleteAnnouncement, { isLoading: isDeleting }] = useDeleteAnnouncementMutation();
	const isSaving = isCreating || isUpdating;
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [sortKey, setSortKey] = useState<ColumnKey>("allocatedTo");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [formOpen, setFormOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [editorResetKey, setEditorResetKey] = useState(0);
	const [form, setForm] = useState<AnnouncementForm>(emptyForm);
	const {
		data: transporters = [],
		isLoading: transportersLoading,
		isFetching: transportersFetching,
	} = useGetTransporterMasterQuery(form.client ? { client: form.client } : undefined, { skip: !form.client });
	const rows = useMemo<AnnouncementRow[]>(() => {
		const clientNames = new Map(clients.map((client) => [client.id, client.name]));
		const transporterNames = new Map(allTransporters.map((transporter) => [transporter.id, transporter.name]));
		return announcements.map((record) => {
			const status = currentStatus(record.status);
			const clientId = refId(record.client);
			const transporterId = refId(record.transporter);
			return {
				id: record.externalId,
				allocatedTo: audienceLabels.get(record.announcement) ?? record.announcement ?? "",
				clientList: clientId
					? clientNames.get(clientId) || refLabel(record.client, "name") || clientId
					: record.announcement === "all" ? "All clients" : "—",
				transporterList: transporterId
					? transporterNames.get(transporterId) || refLabel(record.transporter, "name") || transporterId
					: record.announcement === "all" ? "All transporters" : "—",
				messageType: normalizeMessageType(record.messageType).toUpperCase(),
				messageTitle: record.title ?? "",
				validFor: record.validityTime && record.validityDuration ? `${record.validityDuration} ${record.validityTime}` : "",
				validityHours: record.validityTime === "hours" ? String(record.validityDuration ?? "") : "—",
				validityDays: record.validityTime === "days" ? String(record.validityDuration ?? "") : "—",
				added: dateLabel(record.createdAt),
				status,
				reason: status === Status.INACTIVE ? (record.reason?.trim() ?? "") : "",
			};
		});
	}, [announcements, clients, allTransporters]);
	const [previewImageUrl, setPreviewImageUrl] = useState("");
	const [pendingStatus, setPendingStatus] = useState<AnnouncementRow | null>(null);
	const [pendingDelete, setPendingDelete] = useState<AnnouncementRow | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<Status>(Status.INACTIVE);
	const [statusReason, setStatusReason] = useState("");

	useEffect(() => {
		if (!previewOpen || !form.messageImage) {
			setPreviewImageUrl("");
			return;
		}
		const imageUrl = URL.createObjectURL(form.messageImage);
		setPreviewImageUrl(imageUrl);
		return () => URL.revokeObjectURL(imageUrl);
	}, [previewOpen, form.messageImage]);

	useEffect(() => {
		if (!form.transporter || !form.client) return;
		if (transportersLoading || transportersFetching) return;
		if (transporters.some((item) => item.id === form.transporter)) return;
		setForm((current) => ({ ...current, transporter: "" }));
	}, [form.client, form.transporter, transporters, transportersFetching, transportersLoading]);

	const pageSize = 10;
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		const matched = rows.filter((row) => !query || Object.values(row).join(" ").toLowerCase().includes(query));
		return [...matched].sort((left, right) => {
			const result = String(left[sortKey]).localeCompare(String(right[sortKey]), undefined, { numeric: true });
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
		setForm({ ...emptyForm });
		setPreviewOpen(false);
	};

	const openCreate = () => {
		setEditingId(null);
		setForm({ ...emptyForm });
		setEditorResetKey((current) => current + 1);
		setFormOpen(true);
	};

	const openEdit = (externalId: string) => {
		const record = announcements.find((item) => item.externalId === externalId);
		if (!record) return;
		setEditingId(externalId);
		setForm(formFromRecord(record));
		setEditorResetKey((current) => current + 1);
		setFormOpen(true);
	};

	const saveAnnouncement = async () => {
		if (
			!form.announcement ||
			((form.announcement === "client" || form.announcement === "transporter") && !form.client) ||
			(form.announcement === "transporter" && !form.transporter) ||
			!form.validity ||
			!Number.isInteger(Number(form.duration)) ||
			Number(form.duration) < 1 ||
			!form.messageType
		) {
			toast.error("Please complete the announcement audience, validity, duration, and message type.");
			return;
		}
		const messageType = normalizeMessageType(form.messageType);
		if (!messageType) {
			toast.error("Please select a valid message type.");
			return;
		}
		const title = form.messageTitle.trim().slice(0, 255);
		const existing = editingId ? announcements.find((item) => item.externalId === editingId) : undefined;
		const needsNewImage = messageType === "image" && !form.messageImage && !existing?.messageImage;
		if (needsNewImage) {
			toast.error("Please choose a message image.");
			return;
		}
		if (isSaving) return;
		try {
			const usesClient = form.announcement === "client" || form.announcement === "transporter";
			const body = {
				announcement: form.announcement as AnnouncementAudience,
				client: usesClient ? form.client : undefined,
				transporter: form.announcement === "transporter" ? form.transporter : undefined,
				validityTime: form.validity as AnnouncementValidity,
				validityDuration: Number(form.duration),
				messageType,
				title: title || undefined,
				body: messageType === "text" ? form.messageBody || undefined : undefined,
				messageImage: messageType === "image" ? form.messageImage ?? undefined : undefined,
				requestForDontShowAgainOption: form.dontShowAgain,
				requestForProfileUpdate: form.profileUpdate,
				...(editingId
					? {}
					: {
							status: Status.ACTIVE,
						}),
			};
			if (editingId) {
				await updateAnnouncement({ externalId: editingId, body }).unwrap();
				toast.success("Announcement updated.");
			} else {
				await createAnnouncement(body).unwrap();
				toast.success("Announcement saved.");
			}
			closeForm();
			setPage(0);
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not save the announcement."));
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
			await updateAnnouncementStatus({
				externalId: pendingStatus.id,
				status: selectedStatus,
				reason: selectedStatus === Status.INACTIVE ? statusReason.trim() : "",
			}).unwrap();
			toast.success(
				`${pendingStatus.messageTitle || "Announcement"} is now ${statusLabel(selectedStatus).toLowerCase()}.`,
			);
			closeStatusDialog();
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not update the announcement status."));
		}
	};

	const confirmDelete = async () => {
		if (!pendingDelete?.id) return;
		try {
			await deleteAnnouncement(pendingDelete.id).unwrap();
			toast.success("Announcement deleted.");
			setPendingDelete(null);
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not delete the announcement."));
		}
	};

	const field = (id: string, label: string, control: ReactNode, required = true) => (
		<div>
			<label htmlFor={id} className={labelClass(isDark)}>
				{label} {required && <span className="text-rose-400">*</span>}
			</label>
			{control}
		</div>
	);

	const updateAudience = (announcement: string) => {
		setForm((current) => ({
			...current,
			announcement,
			client: "",
			transporter: "",
			validity: "",
			duration: "",
			messageType: "",
			messageTitle: "",
			messageBody: "",
			messageImage: null,
		}));
	};

	const updateMessageType = (messageType: string) => {
		setForm((current) => ({
			...current,
			messageType,
			messageBody: "",
			messageImage: null,
			messageTitle: "",
		}));
		setEditorResetKey((current) => current + 1);
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

	const statusBadge = (status: Status) => (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
				status === Status.ACTIVE
					? isDark
						? "border-emerald-300/25 bg-emerald-300/[0.10] text-emerald-200"
						: "border-emerald-200 bg-emerald-50 text-emerald-700"
					: isDark
						? "border-rose-300/25 bg-rose-300/[0.08] text-rose-200"
						: "border-rose-200 bg-rose-50 text-rose-700"
			}`}
		>
			<span className={`h-1.5 w-1.5 rounded-full ${status === Status.ACTIVE ? "bg-emerald-400" : "bg-rose-400"}`} />
			{statusLabel(status)}
		</span>
	);

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
							<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Announcement</h1>
							<span className={`rounded-full border px-2.5 py-1 text-[10px] ${isDark ? "border-white/[0.08] bg-white/[0.04] text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>{rows.length} records</span>
						</div>
					</div>
					<button type="button" onClick={() => refetch()} aria-label="Refresh announcements" className={refreshButtonClass(isDark)}>
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
								onChange={(event) => { setSearch(event.target.value); setPage(0); }}
								placeholder="Search announcements..."
								aria-label="Search announcements"
								className={searchInputClass(isDark)}
							/>
						</label>
						<button type="button" onClick={openCreate} className={primaryButtonClass(isDark)}>
							<Plus className="h-3.5 w-3.5" /> Add Announcement
						</button>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1400px] border-collapse text-left">
							<thead>
								<tr className={tableHeadRowClass(isDark)}>
									{columns.map((column) => (
										<th key={column.key} scope="col" className={thClass}>
											<button type="button" onClick={() => sortBy(column.key)} className="inline-flex items-center gap-1.5 uppercase">
												{column.label}
												<ArrowUpDown className={`h-3 w-3 ${sortKey === column.key ? "opacity-100" : "opacity-50"}`} />
											</button>
										</th>
									))}
									<th scope="col" className={`${thClass} text-center`}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{pageRows.length === 0 ? (
									<EmptyTableRow
										isDark={isDark}
										colSpan={columns.length + 1}
										hint={rows.length === 0 ? "Click “Add Announcement” to create one." : undefined}
									/>
								) : (
									pageRows.map((row) => (
										<tr key={row.id} className={tableRowClass(isDark)}>
											{columns.map((column) => (
												<td key={column.key} className="whitespace-nowrap px-4 py-3">
													{column.key === "status" ? statusBadge(row.status) : cellText(row[column.key])}
												</td>
											))}
											<td className="px-4 py-2.5">
												<div className="flex items-center justify-center gap-1.5">
													<button
														type="button"
														title="Edit announcement"
														aria-label={`Edit ${row.messageTitle || row.id}`}
														onClick={() => openEdit(row.id)}
														className={iconButtonClass("cyan")}
													>
														<Pencil className="h-3.5 w-3.5" />
													</button>
													<button
														type="button"
														title="Change status"
														aria-label={`Change status of ${row.messageTitle || row.id}`}
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
														title="Delete announcement"
														aria-label={`Delete ${row.messageTitle || row.id}`}
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

					<TableFooter isDark={isDark} page={page} pageSize={pageSize} total={filteredRows.length} onPageChange={setPage} />
				</section>
			</main>

			{formOpen && (
				<AlertModal
					isDark={isDark}
					title={editingId ? "Edit Announcement" : "Add Announcement"}
					onClose={closeForm}
					onSubmit={saveAnnouncement}
					widthClass="max-w-6xl"
					footer={
						<>
							<button
								type="button"
								onClick={() => {
									if (editingId) {
										openEdit(editingId);
										return;
									}
									setForm({ ...emptyForm });
									setEditorResetKey((current) => current + 1);
									setPreviewOpen(false);
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
					<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
						{field("announcement-audience", "Announcement", (
							<select id="announcement-audience" value={form.announcement} onChange={(event) => updateAudience(event.target.value)} className={inputClass(isDark)}>
								<option value="">Select</option>
								{audiences.map((audience) => <option key={audience.value} value={audience.value}>{audience.label}</option>)}
							</select>
						))}
						{(form.announcement === "client" || form.announcement === "transporter") && field("announcement-client", "Client", (
							<select id="announcement-client" value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value, transporter: "" })} className={inputClass(isDark)}>
								<option value="">Select Client</option>
								{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
							</select>
						))}
						{form.announcement === "transporter" && field("announcement-transporter", "Transporter", (
							<select
								id="announcement-transporter"
								value={form.transporter}
								disabled={!form.client || transportersLoading || transportersFetching}
								onChange={(event) => setForm({ ...form, transporter: event.target.value })}
								className={`${inputClass(isDark)} disabled:cursor-not-allowed disabled:opacity-55`}
							>
								<option value="">
									{!form.client
										? "Select Transporter"
										: transportersLoading || transportersFetching
											? "Loading transporters…"
											: "Select Transporter"}
								</option>
								{transporters.map((transporter) => <option key={transporter.id} value={transporter.id}>{transporter.name}</option>)}
							</select>
						))}
						{field("announcement-validity", "Announcement Validity Time", (
							<select id="announcement-validity" value={form.validity} onChange={(event) => setForm({ ...form, validity: event.target.value, duration: event.target.value ? form.duration || "1" : "" })} className={inputClass(isDark)}>
								<option value="">Select</option>
								{validityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
							</select>
						))}
						{form.validity && field("announcement-duration", `Announcement For (${form.validity === "hours" ? "Hours" : "Days"})`, (
							<input
								id="announcement-duration"
								type="number"
								min="1"
								step="1"
								value={form.duration}
								onChange={(event) => setForm({ ...form, duration: event.target.value })}
								className={inputClass(isDark)}
							/>
						))}
						{field("announcement-type", "MESSAGE TYPE", (
							<select id="announcement-type" value={form.messageType} onChange={(event) => updateMessageType(event.target.value)} className={inputClass(isDark)}>
								<option value="">Select</option>
								{messageTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
							</select>
						))}
						{form.messageType && field("announcement-title", "Message Title", (
							<input
								id="announcement-title"
								value={form.messageTitle}
								placeholder="Message Title"
								maxLength={255}
								onChange={(event) => setForm({ ...form, messageTitle: event.target.value.slice(0, 255) })}
								className={inputClass(isDark)}
							/>
						), false)}
						{form.messageType === "image" && field("announcement-image", "Message Image", (
							<input
								id="announcement-image"
								type="file"
								accept="image/*"
								onChange={(event) => setForm({ ...form, messageImage: event.target.files?.[0] ?? null })}
								className={`h-10 w-full rounded-lg border px-2 py-1 text-xs ${isDark ? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 file:mr-2 file:rounded-md file:border-0 file:bg-white/[0.08] file:px-2 file:py-1 file:text-xs file:text-slate-200" : "border-slate-200 bg-white text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:text-slate-700"}`}
							/>
						), !editingId)}
					</div>
					{form.messageType === "text" && (
						<div className="mt-4">
							{field("announcement-body", "Body", (
								<div className={`overflow-hidden rounded-lg border ${isDark ? "border-white/[0.08] bg-[#03091c]/70" : "border-slate-200 bg-white"}`}>
									<JoditEditor
										key={editorResetKey}
										id="announcement-body"
										value={form.messageBody}
										config={editorConfig}
										onChange={(messageBody) => setForm((current) => ({ ...current, messageBody }))}
									/>
								</div>
							), false)}
						</div>
					)}
					<div className="mt-6 flex flex-col items-start gap-3">
						<label className={checkboxLabelClass(isDark)}>
							<input type="checkbox" checked={form.dontShowAgain} onChange={(event) => setForm({ ...form, dontShowAgain: event.target.checked })} className={checkboxClass} />
							Request For Don't Show Again
						</label>
						<label className={checkboxLabelClass(isDark)}>
							<input type="checkbox" checked={form.profileUpdate} onChange={(event) => setForm({ ...form, profileUpdate: event.target.checked })} className={checkboxClass} />
							Request for profile update
						</label>
					</div>
					{form.messageType && (
						<button type="button" onClick={() => setPreviewOpen(true)} className={primaryButtonClass(isDark)}>
							Preview
						</button>
					)}
				</AlertModal>
			)}
			{previewOpen && (
				<AlertModal
					isDark={isDark}
					title="Announcement Preview"
					onClose={() => setPreviewOpen(false)}
					widthClass="max-w-3xl"
				>
					<div className={`rounded-xl border p-5 ${isDark ? "border-white/[0.08] bg-[#03091c]/50" : "border-slate-200 bg-slate-50"}`}>
						{form.messageTitle && <h3 className="mb-3 text-lg font-semibold">{form.messageTitle}</h3>}
						{form.messageType === "text" && (
							<p className="whitespace-pre-wrap text-sm leading-6">
								{new DOMParser().parseFromString(form.messageBody, "text/html").body.textContent}
							</p>
						)}
						{form.messageType === "image" && previewImageUrl && (
							<img src={previewImageUrl} alt={form.messageTitle || "Announcement"} className="max-h-[60vh] max-w-medium rounded-lg object-contain" />
						)}
						{form.messageType === "image" && !previewImageUrl && (
							<p className="text-sm text-slate-100">
								{editingId ? "Existing image will be kept unless you choose a new one." : "Choose an image to preview."}
							</p>
						)}
					</div>
				</AlertModal>
			)}

			<ChangeStatusDialog
				isDark={isDark}
				open={Boolean(pendingStatus)}
				title="Change announcement status"
				entityName={pendingStatus?.messageTitle || "this announcement"}
				entityNoun="announcement"
				currentStatus={pendingStatus?.status ?? Status.ACTIVE}
				selectedStatus={selectedStatus}
				onSelectedStatusChange={setSelectedStatus}
				reason={statusReason}
				onReasonChange={setStatusReason}
				isSubmitting={isUpdatingStatus}
				onCancel={closeStatusDialog}
				onConfirm={() => void confirmStatusChange()}
				titleId="announcement-status-title"
				zIndexClassName="z-[810]"
			/>

			<DeleteConfirmDialog
				isDark={isDark}
				open={!!pendingDelete}
				title="Delete announcement?"
				entityName={pendingDelete?.messageTitle || "this announcement"}
				isSubmitting={isDeleting}
				onCancel={() => {
					if (!isDeleting) setPendingDelete(null);
				}}
				onConfirm={() => void confirmDelete()}
				titleId="announcement-delete-title"
				zIndexClassName="z-[810]"
			/>
		</div>
	);
}
