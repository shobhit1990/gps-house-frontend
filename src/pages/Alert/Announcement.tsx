import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { ArrowUpDown, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import JoditEditor from "jodit-react";
import "jodit/es2021/jodit.min.css";
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
	rowActionClass,
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
} from "@/store/services/api/Announcement";
import { Status } from "@/enums/Status";
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
	status: string;
	validFor: string;
	validityHours: string;
	validityDays: string;
	added: string;
};

type ColumnKey = keyof Omit<AnnouncementRow, "id">;

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "allocatedTo", label: "Allocated To" },
	{ key: "clientList", label: "Client List" },
	{ key: "transporterList", label: "Transporter List" },
	{ key: "messageType", label: "Message Type" },
	{ key: "messageTitle", label: "Message Title" },
	{ key: "status", label: "Status" },
	{ key: "validFor", label: "Announcement Valid For" },
	{ key: "validityHours", label: "Validity Hours" },
	{ key: "validityDays", label: "Validity Days" },
	{ key: "added", label: "Added" },
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
const messageTypes: AnnouncementMessageType[] = ["TEXT", "IMAGE"];

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
	active: boolean;
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
	active: true,
	dontShowAgain: false,
	profileUpdate: false,
};

const dateLabel = (value?: string) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

/** Pre-fills the form from a saved announcement so it can be recreated; an image has to be picked again. */
const formFromRecord = (record: AnnouncementRecord): AnnouncementForm => ({
	announcement: record.announcement ?? "",
	client: record.client ?? "",
	transporter: record.transporter ?? "",
	validity: record.validityTime ?? "",
	duration: record.validityDuration === undefined || record.validityDuration === null ? "" : String(record.validityDuration),
	messageType: record.messageType ?? "",
	messageTitle: record.title ?? "",
	messageBody: record.body ?? "",
	messageImage: null,
	active: true,
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
	const { data: transporters = [] } = useGetTransporterMasterQuery();
	const { data: announcements = [], isFetching, refetch } = useGetAnnouncementsQuery();
	const [createAnnouncement, { isLoading: isSaving }] = useCreateAnnouncementMutation();
	const [deleteAnnouncement] = useDeleteAnnouncementMutation();
	const rows = useMemo<AnnouncementRow[]>(() => {
		const clientNames = new Map(clients.map((client) => [client.id, client.name]));
		const transporterNames = new Map(transporters.map((transporter) => [transporter.id, transporter.name]));
		return announcements.map((record) => ({
			id: record.externalId,
			allocatedTo: audienceLabels.get(record.announcement) ?? record.announcement ?? "",
			clientList: record.client ? clientNames.get(record.client) ?? record.client : record.announcement === "all" ? "All clients" : "—",
			transporterList: record.transporter
				? transporterNames.get(record.transporter) ?? record.transporter
				: record.announcement === "all" ? "All transporters" : "—",
			messageType: record.messageType ?? "",
			messageTitle: record.title ?? "",
			status: record.status === Status.ACTIVE ? "Active" : "Inactive",
			validFor: record.validityTime && record.validityDuration ? `${record.validityDuration} ${record.validityTime}` : "",
			validityHours: record.validityTime === "hours" ? String(record.validityDuration ?? "") : "—",
			validityDays: record.validityTime === "days" ? String(record.validityDuration ?? "") : "—",
			added: dateLabel(record.createdAt),
		}));
	}, [announcements, clients, transporters]);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [sortKey, setSortKey] = useState<ColumnKey>("allocatedTo");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [formOpen, setFormOpen] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [editorResetKey, setEditorResetKey] = useState(0);
	const [form, setForm] = useState<AnnouncementForm>(emptyForm);
	const [previewImageUrl, setPreviewImageUrl] = useState("");

	useEffect(() => {
		if (!previewOpen || !form.messageImage) {
			setPreviewImageUrl("");
			return;
		}
		const imageUrl = URL.createObjectURL(form.messageImage);
		setPreviewImageUrl(imageUrl);
		return () => URL.revokeObjectURL(imageUrl);
	}, [previewOpen, form.messageImage]);

	const pageSize = 10;
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		const matched = rows.filter((row) => !query || Object.values(row).join(" ").toLowerCase().includes(query));
		return [...matched].sort((left, right) => {
			const result = left[sortKey].localeCompare(right[sortKey], undefined, { numeric: true });
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
		if (form.messageType === "IMAGE" && !form.messageImage) {
			toast.error("Please choose a message image.");
			return;
		}
		if (isSaving) return;
		try {
			const usesClient = form.announcement === "client" || form.announcement === "transporter";
			await createAnnouncement({
				announcement: form.announcement as AnnouncementAudience,
				client: usesClient ? form.client : undefined,
				transporter: form.announcement === "transporter" ? form.transporter : undefined,
				validityTime: form.validity as AnnouncementValidity,
				validityDuration: Number(form.duration),
				messageType: form.messageType as AnnouncementMessageType,
				title: form.messageTitle.trim() || undefined,
				body: form.messageType === "TEXT" ? form.messageBody || undefined : undefined,
				messageImage: form.messageType === "IMAGE" ? form.messageImage ?? undefined : undefined,
				requestForDontShowAgainOption: form.dontShowAgain,
				requestForProfileUpdate: form.profileUpdate,
				status: form.active ? Status.ACTIVE : Status.INACTIVE,
				reason: "New announcement created",
			}).unwrap();
			setForm({ ...emptyForm });
			setFormOpen(false);
			setPage(0);
			toast.success("Announcement saved.");
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not save the announcement."));
		}
	};

	const recreateAnnouncement = (externalId: string) => {
		const record = announcements.find((item) => item.externalId === externalId);
		if (!record) return;
		setForm(formFromRecord(record));
		setEditorResetKey((current) => current + 1);
		setFormOpen(true);
	};

	const removeAnnouncement = async (externalId: string) => {
		try {
			await deleteAnnouncement(externalId).unwrap();
			toast.success("Announcement deleted.");
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

	const updateAnnouncement = (announcement: string) => {
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

	const statusBadge = (status: string) => (
		<span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${
			status === "Active"
				? isDark ? "bg-emerald-400/15 text-emerald-300" : "bg-emerald-100 text-emerald-700"
				: isDark ? "bg-slate-500/15 text-slate-300" : "bg-slate-100 text-slate-600"
		}`}>
			{status}
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
						<button type="button" onClick={() => { setForm({ ...emptyForm }); setEditorResetKey((current) => current + 1); setFormOpen(true); }} className={primaryButtonClass(isDark)}>
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
													{column.key === "status" ? statusBadge(row.status) : row[column.key] || "—"}
												</td>
											))}
											<td className="px-4 py-2.5">
												<div className="flex items-center justify-center gap-2">
													<button
														type="button"
														onClick={() => recreateAnnouncement(row.id)}
														className={rowActionClass(isDark, "cyan")}
													>
														Recreate
													</button>
													<button
														type="button"
														onClick={() => removeAnnouncement(row.id)}
														className={rowActionClass(isDark, "rose")}
													>
														Delete
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
					title="Add Announcement"
					onClose={() => setFormOpen(false)}
					onSubmit={saveAnnouncement}
					widthClass="max-w-6xl"
					footer={
						<>
							<button
								type="button"
								onClick={() => {
									setForm({ ...emptyForm });
									setEditorResetKey((current) => current + 1);
									setPreviewOpen(false);
								}}
								className={secondaryButtonClass(isDark)}
							>
								Reset
							</button>
							<button type="submit" disabled={isSaving} className={primaryButtonClass(isDark)}>{isSaving ? "Saving..." : "Save"}</button>
						</>
					}
				>
					<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
						{field("announcement-audience", "Announcement", (
							<select id="announcement-audience" value={form.announcement} onChange={(event) => updateAnnouncement(event.target.value)} className={inputClass(isDark)}>
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
							<select id="announcement-transporter" value={form.transporter} onChange={(event) => setForm({ ...form, transporter: event.target.value })} className={inputClass(isDark)}>
								<option value="">Select Transporter</option>
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
								{messageTypes.map((name) => <option key={name} value={name}>{name}</option>)}
							</select>
						))}
						{form.messageType && field("announcement-title", "Message Title", (
							<input
								id="announcement-title"
								value={form.messageTitle}
								placeholder="Message Title"
								onChange={(event) => setForm({ ...form, messageTitle: event.target.value })}
								className={inputClass(isDark)}
							/>
						), false)}
						{form.messageType === "IMAGE" && field("announcement-image", "Message Image", (
							<input
								id="announcement-image"
								type="file"
								accept="image/*"
								onChange={(event) => setForm({ ...form, messageImage: event.target.files?.[0] ?? null })}
								className={`h-10 w-full rounded-lg border px-2 py-1 text-xs ${isDark ? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 file:mr-2 file:rounded-md file:border-0 file:bg-white/[0.08] file:px-2 file:py-1 file:text-xs file:text-slate-200" : "border-slate-200 bg-white text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:text-slate-700"}`}
							/>
						))}
					</div>
					{form.messageType === "TEXT" && (
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
							<input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className={checkboxClass} />
							Active
						</label>
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
						{form.messageType === "TEXT" && (
							<p className="whitespace-pre-wrap text-sm leading-6">
								{new DOMParser().parseFromString(form.messageBody, "text/html").body.textContent}
							</p>
						)}
						{form.messageType === "IMAGE" && previewImageUrl && (
							<img src={previewImageUrl} alt={form.messageTitle || "Announcement"} className="max-h-[60vh] max-w-medium rounded-lg object-contain" />
						)}
						{form.messageType === "IMAGE" && !previewImageUrl && (
							<p className="text-sm text-slate-100">Choose an image to preview.</p>
						)}
					</div>
				</AlertModal>
			)}
		</div>
	);
}
