import { useMemo, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { ArrowUpDown, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
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

type AnnouncementRow = {
	id: number;
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

const audiences = ["All", "Client", "Transporter"];
const validityOptions = ["1 Hour", "6 Hours", "12 Hours", "24 Hours", "7 Days", "30 Days"];
const messageTypes = ["Information", "Warning", "Alert", "Update"];

const emptyForm = {
	announcement: "",
	validity: "",
	messageType: "",
	active: false,
	dontShowAgain: false,
	profileUpdate: false,
};

const todayLabel = () => {
	const now = new Date();
	const day = String(now.getDate()).padStart(2, "0");
	const month = String(now.getMonth() + 1).padStart(2, "0");
	return `${day}/${month}/${now.getFullYear()}`;
};

export default function Announcement() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [rows, setRows] = useState<AnnouncementRow[]>([]);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [sortKey, setSortKey] = useState<ColumnKey>("allocatedTo");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [formOpen, setFormOpen] = useState(false);
	const [form, setForm] = useState(emptyForm);

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

	const buildRow = (source: typeof emptyForm, id = Date.now()): AnnouncementRow => {
		const hourMatch = source.validity.match(/(\d+)\s*Hour/i);
		const dayMatch = source.validity.match(/(\d+)\s*Day/i);
		return {
			id,
			allocatedTo: source.announcement,
			clientList: source.announcement === "Client" || source.announcement === "All" ? "All clients" : "—",
			transporterList: source.announcement === "Transporter" || source.announcement === "All" ? "All transporters" : "—",
			messageType: source.messageType,
			messageTitle: source.profileUpdate ? "Profile Update" : source.dontShowAgain ? "Don't Show Again" : source.messageType,
			status: source.active ? "Active" : "Inactive",
			validFor: source.validity,
			validityHours: hourMatch?.[1] ?? "—",
			validityDays: dayMatch?.[1] ?? "—",
			added: todayLabel(),
		};
	};

	const saveAnnouncement = () => {
		if (!form.announcement || !form.validity || !form.messageType) {
			toast.error("Please select Announcement, Validity Time, and Message Type.");
			return;
		}
		setRows((current) => [buildRow(form), ...current]);
		setForm(emptyForm);
		setFormOpen(false);
		setPage(0);
		toast.success("Announcement saved.");
	};

	const field = (id: string, label: string, control: ReactNode) => (
		<div>
			<label htmlFor={id} className={labelClass(isDark)}>
				{label} <span className="text-rose-400">*</span>
			</label>
			{control}
		</div>
	);

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
					<button type="button" onClick={() => window.location.reload()} aria-label="Refresh announcements" className={refreshButtonClass(isDark)}>
						<RefreshCw className="h-4 w-4" />
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
						<button type="button" onClick={() => { setForm(emptyForm); setFormOpen(true); }} className={primaryButtonClass(isDark)}>
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
										title={rows.length === 0 ? "No announcements yet" : "No announcements match your search"}
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
														onClick={() => setRows((current) => [{ ...row, id: Date.now(), added: todayLabel() }, ...current])}
														className={rowActionClass(isDark, "cyan")}
													>
														Recreate
													</button>
													<button
														type="button"
														onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
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
					footer={
						<>
							<button type="button" onClick={() => setForm(emptyForm)} className={secondaryButtonClass(isDark)}>Reset</button>
							<button type="submit" className={primaryButtonClass(isDark)}>Save</button>
						</>
					}
				>
					<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
						{field("announcement-audience", "Announcement", (
							<select id="announcement-audience" value={form.announcement} onChange={(event) => setForm({ ...form, announcement: event.target.value })} className={inputClass(isDark)}>
								<option value="">Select</option>
								{audiences.map((name) => <option key={name} value={name}>{name}</option>)}
							</select>
						))}
						{field("announcement-validity", "Announcement Validity Time", (
							<select id="announcement-validity" value={form.validity} onChange={(event) => setForm({ ...form, validity: event.target.value })} className={inputClass(isDark)}>
								<option value="">Select</option>
								{validityOptions.map((name) => <option key={name} value={name}>{name}</option>)}
							</select>
						))}
						{field("announcement-type", "Message Type", (
							<select id="announcement-type" value={form.messageType} onChange={(event) => setForm({ ...form, messageType: event.target.value })} className={inputClass(isDark)}>
								<option value="">Select</option>
								{messageTypes.map((name) => <option key={name} value={name}>{name}</option>)}
							</select>
						))}
					</div>
					<div className="mt-6 flex flex-col items-start gap-3">
						<label className={checkboxLabelClass(isDark)}>
							<input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className={checkboxClass} />
							Active
						</label>
						<label className={checkboxLabelClass(isDark)}>
							<input type="checkbox" checked={form.dontShowAgain} onChange={(event) => setForm({ ...form, dontShowAgain: event.target.checked })} className={checkboxClass} />
							Request For Don't Show Again Option
						</label>
						<label className={checkboxLabelClass(isDark)}>
							<input type="checkbox" checked={form.profileUpdate} onChange={(event) => setForm({ ...form, profileUpdate: event.target.checked })} className={checkboxClass} />
							Request For Profile Update
						</label>
					</div>
				</AlertModal>
			)}
		</div>
	);
}
