import { useMemo, useState, useRef } from "react";
import { useCloseDetailsOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, Pencil, Power, RefreshCw, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChangeStatusDialog } from "@/components/common/ChangeStatusDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Status, statusLabel } from "@/enums/Status";

type EnquiryRecord = {
	id: number;
	enquiryBy: string;
	name: string;
	email: string;
	enquiryPhone: string;
	transporterPhone: string;
	enquiryFor: string;
	comment: string;
	enquiryDate: string;
	status: "Active" | "Inactive";
	reason: string;
};

type EnquiryFormValues = Omit<EnquiryRecord, "id" | "status" | "reason">;

const emptyForm: EnquiryFormValues = {
	enquiryBy: "",
	name: "",
	email: "",
	enquiryPhone: "",
	transporterPhone: "",
	enquiryFor: "",
	comment: "",
	enquiryDate: "",
};

const inputClass = (isDark: boolean) =>
	`h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 placeholder:text-slate-600 focus:border-cyan-300/35 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-cyan-400"
	}`;

type ColumnKey = keyof Omit<EnquiryRecord, "id">;

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "enquiryBy", label: "Enquiry By" },
	{ key: "name", label: "Name" },
	{ key: "email", label: "Email" },
	{ key: "enquiryPhone", label: "Enquiry Phone no." },
	{ key: "transporterPhone", label: "Transporter Phone no." },
	{ key: "enquiryFor", label: "Enquiry For" },
	{ key: "comment", label: "Comment" },
	{ key: "enquiryDate", label: "Enquiry Date" },
	{ key: "status", label: "Status" },
	{ key: "reason", label: "Reason" },
];

const seedRows: EnquiryRecord[] = [
	{
		id: 1,
		enquiryBy: "prashant.singh",
		name: "",
		email: "",
		enquiryPhone: "",
		transporterPhone: "",
		enquiryFor: "Gps",
		comment: "8368976196",
		enquiryDate: "24/01/2022",
		status: "Active",
		reason: "",
	},
];

const textValue = (value: string) => (value.trim() ? value : "—");

export default function Enquiry() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [rows, setRows] = useState<EnquiryRecord[]>(seedRows);
	const columnVisibilityRef = useRef<HTMLDetailsElement>(null);
	useCloseDetailsOnOutsideClick(columnVisibilityRef);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [pendingStatusRow, setPendingStatusRow] = useState<EnquiryRecord | null>(null);
	const [pendingDelete, setPendingDelete] = useState<EnquiryRecord | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<Status>(Status.ACTIVE);
	const [statusReason, setStatusReason] = useState("");
	const [editingRow, setEditingRow] = useState<EnquiryRecord | null>(null);
	const [formValues, setFormValues] = useState<EnquiryFormValues>(emptyForm);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) =>
			[
				row.enquiryBy,
				row.name,
				row.email,
				row.enquiryPhone,
				row.transporterPhone,
				row.enquiryFor,
				row.comment,
				row.enquiryDate,
				row.status,
				row.reason,
			]
				.join(" ")
				.toLowerCase()
				.includes(query),
		);
	}, [rows, search]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const openEdit = (row: EnquiryRecord) => {
		setEditingRow(row);
		setFormValues({
			enquiryBy: row.enquiryBy,
			name: row.name,
			email: row.email,
			enquiryPhone: row.enquiryPhone,
			transporterPhone: row.transporterPhone,
			enquiryFor: row.enquiryFor,
			comment: row.comment,
			enquiryDate: row.enquiryDate,
		});
	};

	const closeEditDialog = () => {
		setEditingRow(null);
		setFormValues(emptyForm);
	};

	const saveEnquiry = () => {
		if (!editingRow) return;
		if (!formValues.enquiryBy.trim()) {
			toast.error("Enquiry By is required.");
			return;
		}
		setRows((current) =>
			current.map((row) =>
				row.id === editingRow.id
					? {
							...row,
							enquiryBy: formValues.enquiryBy.trim(),
							name: formValues.name.trim(),
							email: formValues.email.trim(),
							enquiryPhone: formValues.enquiryPhone.trim(),
							transporterPhone: formValues.transporterPhone.trim(),
							enquiryFor: formValues.enquiryFor.trim(),
							comment: formValues.comment.trim(),
							enquiryDate: formValues.enquiryDate.trim(),
						}
					: row,
			),
		);
		toast.success(`${formValues.enquiryBy.trim()} updated.`);
		closeEditDialog();
	};

	const openStatusChange = (row: EnquiryRecord) => {
		const currentStatus = row.status === "Active" ? Status.ACTIVE : Status.INACTIVE;
		setSelectedStatus(currentStatus === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE);
		setStatusReason("");
		setPendingStatusRow(row);
	};

	const closeStatusDialog = () => {
		setPendingStatusRow(null);
		setStatusReason("");
	};

	const updateFormField = <K extends keyof EnquiryFormValues>(key: K, value: EnquiryFormValues[K]) => {
		setFormValues((current) => ({ ...current, [key]: value }));
	};

	const confirmDelete = () => {
		if (!pendingDelete) return;
		setRows((current) => current.filter((item) => item.id !== pendingDelete.id));
		toast.success(`${pendingDelete.enquiryBy || "Enquiry"} deleted.`);
		setPendingDelete(null);
	};

	const confirmStatusChange = () => {
		if (!pendingStatusRow) return;
		const currentStatus = pendingStatusRow.status === "Active" ? Status.ACTIVE : Status.INACTIVE;
		if (selectedStatus === currentStatus) {
			toast.error("Select a different status to change.");
			return;
		}
		if (selectedStatus === Status.INACTIVE && !statusReason.trim()) {
			toast.error("Please enter a reason when setting Inactive.");
			return;
		}
		const nextReason = selectedStatus === Status.INACTIVE ? statusReason.trim() : "";
		setRows((current) =>
			current.map((row) =>
				row.id === pendingStatusRow.id
					? {
							...row,
							status: selectedStatus === Status.ACTIVE ? "Active" : "Inactive",
							reason: nextReason,
						}
					: row,
			),
		);
		toast.success(
			`${pendingStatusRow.enquiryBy || "Enquiry"} is now ${statusLabel(selectedStatus).toLowerCase()}.`,
		);
		closeStatusDialog();
	};

	const renderCell = (key: ColumnKey, row: EnquiryRecord) => {
		if (key === "enquiryBy") {
			return <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{row.enquiryBy}</span>;
		}
		if (key === "status") {
			const active = row.status === "Active";
			return (
				<span
					className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${
						active
							? isDark
								? "bg-emerald-400/15 text-emerald-300"
								: "bg-emerald-100 text-emerald-700"
							: isDark
								? "bg-rose-400/15 text-rose-200"
								: "bg-rose-50 text-rose-700"
					}`}
				>
					{row.status}
				</span>
			);
		}
		if (key === "reason") {
			return textValue(row.reason);
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Enquiry</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{rows.length} enquiries</p>
					</div>
					<button
						type="button"
						onClick={() => {
							setSearch("");
							setPage(0);
						}}
						aria-label="Refresh enquiries"
						title="Refresh enquiries"
						className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}
					>
						<RefreshCw className="h-4 w-4" />
					</button>
				</section>

				<section
					className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}
				>
					<div
						className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}
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
								aria-label="Search enquiry"
								className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`}
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
									className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 [color-scheme:dark]" : "border-slate-200 bg-white text-slate-700"}`}
								>
									{[10, 25, 50].map((size) => (
										<option key={size} value={size}>
											{size} rows
										</option>
									))}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<details ref={columnVisibilityRef} className="relative">
								<summary
									className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
								>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Column Visibility
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div
									className={`absolute right-0 top-11 z-30 max-h-52 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
								>
									{columns.map((column) => (
										<label
											key={column.key}
											className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}
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
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1100px] border-collapse text-left">
							<thead>
								<tr
									className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}
								>
									{visibleColumns.map((column) => (
										<th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">
											{column.label}
										</th>
									))}
									<th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
										Action
									</th>
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row) => (
									<tr
										key={row.id}
										className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
									>
										{visibleColumns.map((column) => (
											<td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">
												{renderCell(column.key, row)}
											</td>
										))}
										<td className="px-3 py-3">
											<div className="flex items-center gap-1.5">
												<button
													type="button"
													title="Edit enquiry"
													aria-label={`Edit ${row.enquiryBy}`}
													onClick={() => openEdit(row)}
													className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100 hover:bg-cyan-300/[0.14]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
												>
													<Pencil className="h-3.5 w-3.5" />
												</button>
												<button
													type="button"
													title="Change status"
													aria-label={`Change status of ${row.enquiryBy}`}
													onClick={() => openStatusChange(row)}
													className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.14]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}
												>
													<Power className="h-3.5 w-3.5" />
												</button>
												<button
													type="button"
													title="Delete"
													aria-label={`Delete ${row.enquiryBy}`}
													onClick={() => setPendingDelete(row)}
													className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-rose-300/20 bg-rose-300/[0.08] text-rose-100 hover:bg-rose-300/[0.14]" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
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
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No enquiries match this search</p>
											<p className="mt-1 text-xs text-slate-500">Try another name, phone, or comment.</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer
						className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}
					>
						<span>
							Showing{" "}
							<span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredRows.length)}
							</span>{" "}
							of {filteredRows.length} enquiries
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								onClick={() => setPage((current) => Math.max(0, current - 1))}
								disabled={safePage === 0}
								aria-label="Previous page"
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
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
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</footer>
				</section>
			</main>

			{editingRow && (
				<div className="fixed inset-0 z-[820] flex items-center justify-center p-4">
					<button type="button" aria-label="Close edit dialog" className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]" onClick={closeEditDialog} />
					<section
						role="dialog"
						aria-modal="true"
						aria-labelledby="enquiry-edit-title"
						className={`relative w-full max-w-lg rounded-2xl border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${isDark ? "border-white/[0.10] bg-[#0a1630] text-white" : "border-slate-200 bg-white text-slate-900"}`}
					>
						<h2 id="enquiry-edit-title" className="text-[15px] font-semibold">
							Edit enquiry
						</h2>
						<div className="mt-4 grid gap-3 sm:grid-cols-2">
							<label className="block sm:col-span-2">
								<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
									Enquiry By <span className="text-rose-400">*</span>
								</span>
								<input type="text" value={formValues.enquiryBy} onChange={(event) => updateFormField("enquiryBy", event.target.value)} className={inputClass(isDark)} />
							</label>
							<label className="block">
								<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Name</span>
								<input type="text" value={formValues.name} onChange={(event) => updateFormField("name", event.target.value)} className={inputClass(isDark)} />
							</label>
							<label className="block">
								<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Email</span>
								<input type="email" value={formValues.email} onChange={(event) => updateFormField("email", event.target.value)} className={inputClass(isDark)} />
							</label>
							<label className="block">
								<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Enquiry Phone no.</span>
								<input type="text" value={formValues.enquiryPhone} onChange={(event) => updateFormField("enquiryPhone", event.target.value)} className={inputClass(isDark)} />
							</label>
							<label className="block">
								<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Transporter Phone no.</span>
								<input type="text" value={formValues.transporterPhone} onChange={(event) => updateFormField("transporterPhone", event.target.value)} className={inputClass(isDark)} />
							</label>
							<label className="block">
								<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Enquiry For</span>
								<input type="text" value={formValues.enquiryFor} onChange={(event) => updateFormField("enquiryFor", event.target.value)} className={inputClass(isDark)} />
							</label>
							<label className="block">
								<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Enquiry Date</span>
								<input type="text" value={formValues.enquiryDate} onChange={(event) => updateFormField("enquiryDate", event.target.value)} placeholder="DD/MM/YYYY" className={inputClass(isDark)} />
							</label>
							<label className="block sm:col-span-2">
								<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Comment</span>
								<textarea value={formValues.comment} onChange={(event) => updateFormField("comment", event.target.value)} rows={3} className={`${inputClass(isDark)} h-auto resize-none py-2`} />
							</label>
						</div>
						<div className="mt-5 flex justify-end gap-2">
							<button
								type="button"
								onClick={closeEditDialog}
								className={`h-9 rounded-lg border px-4 text-[12px] ${isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"}`}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={saveEnquiry}
								className={`h-9 rounded-lg border px-4 text-[12px] font-semibold ${isDark ? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50" : "border-cyan-300 bg-cyan-50 text-cyan-800"}`}
							>
								Save
							</button>
						</div>
					</section>
				</div>
			)}

			<DeleteConfirmDialog
				isDark={isDark}
				open={Boolean(pendingDelete)}
				title="Delete enquiry?"
				entityName={pendingDelete?.enquiryBy || pendingDelete?.name || "this enquiry"}
				onCancel={() => setPendingDelete(null)}
				onConfirm={confirmDelete}
				titleId="enquiry-delete-title"
			/>

			<ChangeStatusDialog
				isDark={isDark}
				open={Boolean(pendingStatusRow)}
				title="Change enquiry status"
				entityName={pendingStatusRow?.enquiryBy || "this enquiry"}
				entityNoun="enquiry"
				currentStatus={pendingStatusRow?.status === "Active" ? Status.ACTIVE : Status.INACTIVE}
				selectedStatus={selectedStatus}
				onSelectedStatusChange={setSelectedStatus}
				reason={statusReason}
				onReasonChange={setStatusReason}
				onCancel={closeStatusDialog}
				onConfirm={confirmStatusChange}
				titleId="enquiry-status-title"
			/>
		</div>
	);
}
