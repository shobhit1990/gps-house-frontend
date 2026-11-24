import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
	Activity,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Columns3,
	Loader2,
	Pencil,
	Plus,
	RefreshCw,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddPayment, type PaymentFormValues } from "@/components/Payment/AddPayment";
import {
	displayText,
	toDateDisplay,
	transporterDisplayName,
} from "@/components/Payment/paymentFormHelpers";
import { useAuth } from "@/contexts/AuthContext";
import { paymentTermLabel } from "@/enums/PaymentTerm";
import { Status, statusLabel } from "@/enums/Status";
import type { PaymentDetails } from "@/interfaces/PaymentDetails";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useGetTransporterMasterQuery } from "@/store/services/api/Master";
import {
	useCreatePaymentDetailsMutation,
	useDeletePaymentDetailsMutation,
	useGetPaymentDetailsListQuery,
	useLazyGetPaymentDetailsByIdQuery,
	useUpdatePaymentDetailsMutation,
} from "@/store/services/api/PaymentDetails";

type ColumnKey =
	| "vehicle"
	| "invoice"
	| "sellingPrice"
	| "transporter"
	| "paymentTerm"
	| "installationDate"
	| "rentalDueDate"
	| "technicianName"
	| "rental"
	| "remark"
	| "status"
	| "reason"
	| "actions";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "vehicle", label: "Vehicle" },
	{ key: "invoice", label: "Invoice" },
	{ key: "sellingPrice", label: "Selling Price" },
	{ key: "transporter", label: "Transporter Name" },
	{ key: "paymentTerm", label: "Payment Term" },
	{ key: "installationDate", label: "Installation Date" },
	{ key: "rentalDueDate", label: "Rental Due Date" },
	{ key: "technicianName", label: "Technician Name" },
	{ key: "rental", label: "Rental" },
	{ key: "remark", label: "Remark" },
	{ key: "status", label: "Status" },
	{ key: "reason", label: "Reason" },
	{ key: "actions", label: "Actions" },
];

export default function Payment() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: transporterMaster = [] } = useGetTransporterMasterQuery();
	const { data: rows = [], isLoading, isFetching, isError, refetch } = useGetPaymentDetailsListQuery();
	const [createPaymentDetails, { isLoading: isCreating }] = useCreatePaymentDetailsMutation();
	const [updatePaymentDetails, { isLoading: isUpdating }] = useUpdatePaymentDetailsMutation();
	const [deletePaymentDetails, { isLoading: isDeleting }] = useDeletePaymentDetailsMutation();
	const [loadPaymentDetails, { isFetching: isLoadingPayment }] = useLazyGetPaymentDetailsByIdQuery();

	const [search, setSearch] = useState("");
	const [selectedTransporters, setSelectedTransporters] = useState<string[]>([]);
	const [appliedTransporters, setAppliedTransporters] = useState<string[]>([]);
	const [transporterOpen, setTransporterOpen] = useState(false);
	const [transporterQuery, setTransporterQuery] = useState("");
	const transporterRef = useRef<HTMLDivElement>(null);
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [editingPayment, setEditingPayment] = useState<PaymentDetails | null>(null);
	const [pendingDelete, setPendingDelete] = useState<PaymentDetails | null>(null);
	const isSaving = isCreating || isUpdating;

	const transporterNameById = useMemo(() => {
		const map = new Map<string, string>();
		for (const item of transporterMaster) {
			map.set(item.id, item.name);
			if (item.externalId) map.set(String(item.externalId), item.name);
		}
		return map;
	}, [transporterMaster]);

	const resolveTransporterName = (row: PaymentDetails) =>
		transporterDisplayName(row, transporterNameById);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return rows.filter((row) => {
			const transporterName = transporterDisplayName(row, transporterNameById);
			if (appliedTransporters.length > 0 && !appliedTransporters.includes(transporterName)) return false;
			if (!query) return true;
			return [
				row.vehicle,
				row.invoice,
				row.sellingPrice,
				transporterName,
				row.paymentTerm,
				row.technicianName,
				row.rental,
				row.remark,
				row.type,
				row.status,
				row.reason,
			]
				.join(" ")
				.toLowerCase()
				.includes(query);
		});
	}, [appliedTransporters, rows, search, transporterNameById]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const closeDialog = () => {
		setShowAddDialog(false);
		setEditingPayment(null);
	};

	const savePayment = async (values: PaymentFormValues) => {
		try {
			if (editingPayment?.externalId) {
				await updatePaymentDetails({
					externalId: editingPayment.externalId,
					body: values,
				}).unwrap();
				toast.success("Payment details updated.");
			} else {
				await createPaymentDetails(values).unwrap();
				toast.success("Payment details created.");
			}
			setSearch("");
			setPage(0);
			closeDialog();
		} catch (error) {
			console.error("Failed to save payment details.", error);
			toast.error(apiErrorMessage(error, "Could not save payment details."));
		}
	};

	const editPayment = async (row: PaymentDetails) => {
		// Open immediately with list-row data so fields autofill, then refresh from getById.
		setEditingPayment(row);
		setShowAddDialog(true);
		if (!row.externalId) return;
		try {
			const payment = await loadPaymentDetails(row.externalId).unwrap();
			setEditingPayment(payment);
		} catch (error) {
			console.error("Failed to refresh payment details by id.", error);
			toast.error(apiErrorMessage(error, "Showing list data — could not refresh payment details."));
		}
	};

	const confirmDelete = async () => {
		if (!pendingDelete?.externalId) {
			toast.error("This payment does not have a valid ID.");
			return;
		}
		try {
			await deletePaymentDetails(pendingDelete.externalId).unwrap();
			toast.success("Payment details deleted.");
			setPendingDelete(null);
		} catch (error) {
			console.error("Failed to delete payment details.", error);
			toast.error(apiErrorMessage(error, "Could not delete payment details."));
		}
	};

	const cell = (key: ColumnKey, row: PaymentDetails) => {
		if (key === "transporter") {
			return (
				<span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>
					{displayText(resolveTransporterName(row))}
				</span>
			);
		}
		if (key === "installationDate" || key === "rentalDueDate") return toDateDisplay(row[key]);
		if (key === "sellingPrice" || key === "rental") return displayText(row[key]);
		if (key === "paymentTerm") return displayText(paymentTermLabel[row.paymentTerm] ?? row.paymentTerm);
		if (key === "status") {
			const active = String(row.status).toLowerCase() === Status.ACTIVE;
			return (
				<span
					className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${
						active
							? isDark
								? "bg-emerald-400/15 text-emerald-300"
								: "bg-emerald-100 text-emerald-700"
							: isDark
								? "bg-slate-300/[0.08] text-slate-300"
								: "bg-slate-100 text-slate-700"
					}`}
				>
					{statusLabel(active ? Status.ACTIVE : Status.INACTIVE)}
				</span>
			);
		}
		if (key === "actions") {
			return (
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => void editPayment(row)}
						disabled={isLoadingPayment || !row.externalId}
						aria-label="Edit payment"
						title="Edit payment"
						className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-50 ${isDark ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100 hover:bg-cyan-300/[0.14]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
					>
						<Pencil className="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onClick={() => setPendingDelete(row)}
						disabled={isDeleting || !row.externalId}
						aria-label="Delete payment"
						title="Delete payment"
						className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-50 ${isDark ? "border-rose-300/20 bg-rose-300/[0.08] text-rose-200 hover:bg-rose-300/[0.14]" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
				</div>
			);
		}
		if (key === "vehicle") return displayText(row.vehicle);
		if (key === "invoice") return displayText(row.invoice);
		if (key === "technicianName") return displayText(row.technicianName);
		if (key === "remark") return displayText(row.remark);
		if (key === "reason") return displayText(row.reason);
		return "—";
	};

	const transporters = transporterMaster.map((item) => item.name);
	const visibleTransporters = transporters.filter((name) =>
		name.toLowerCase().includes(transporterQuery.trim().toLowerCase()),
	);
	const transporterLabel =
		selectedTransporters.length === 0
			? "Select Transporter"
			: selectedTransporters.length === 1
				? selectedTransporters[0]
				: `${selectedTransporters.length} transporters`;

	useEffect(() => {
		if (!transporterOpen) return;
		const onPointer = (event: MouseEvent) => {
			if (!transporterRef.current?.contains(event.target as Node)) setTransporterOpen(false);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setTransporterOpen(false);
		};
		document.addEventListener("mousedown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [transporterOpen]);

	const toggleTransporter = (name: string) => {
		setSelectedTransporters((current) =>
			current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
		);
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>
							Payment Detail
						</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{rows.length} payments</p>
					</div>
					<button
						type="button"
						onClick={() => void refetch()}
						aria-label="Refresh payments"
						title="Refresh payments"
						disabled={isFetching}
						className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:opacity-50 ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<div className="mb-4 flex flex-wrap items-center gap-2">
					<div ref={transporterRef} className="relative w-full sm:w-[280px]">
						<button
							type="button"
							aria-expanded={transporterOpen}
							aria-haspopup="listbox"
							onClick={() => setTransporterOpen((open) => !open)}
							className={`flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400"}`}
						>
							<span className={`truncate ${selectedTransporters.length === 0 ? (isDark ? "text-slate-500" : "text-slate-400") : ""}`}>
								{transporterLabel}
							</span>
							<ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${transporterOpen ? "rotate-180" : ""}`} />
						</button>
						{transporterOpen && (
							<div className={`absolute left-0 top-12 z-40 w-full overflow-hidden rounded-xl border shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
								<div className="p-2">
									<input
										value={transporterQuery}
										onChange={(event) => setTransporterQuery(event.target.value)}
										placeholder="Search transporter"
										aria-label="Search transporter"
										className={`h-9 w-full rounded-md border px-3 text-xs outline-none ${isDark ? "border-white/[0.10] bg-[#03091c]/70 text-white placeholder:text-slate-600 focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-900 focus:border-cyan-400"}`}
									/>
								</div>
								<div className={`grid grid-cols-2 border-y text-[11px] ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
									<button
										type="button"
										onClick={() => setSelectedTransporters((current) => [...new Set([...current, ...visibleTransporters])])}
										className={`h-9 border-r font-medium transition ${isDark ? "border-white/[0.08] text-slate-300 hover:bg-cyan-300/[0.08] hover:text-cyan-100" : "border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800"}`}
									>
										Select All
									</button>
									<button
										type="button"
										onClick={() => setSelectedTransporters([])}
										className={`h-9 font-medium transition ${isDark ? "text-slate-300 hover:bg-white/[0.04] hover:text-white" : "text-slate-700 hover:bg-slate-50"}`}
									>
										Deselect All
									</button>
								</div>
								<ul role="listbox" aria-label="Transporters" aria-multiselectable="true" className="max-h-48 overflow-y-auto p-1">
									{visibleTransporters.map((name) => {
										const checked = selectedTransporters.includes(name);
										return (
											<li key={name}>
												<label className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
													<input
														type="checkbox"
														checked={checked}
														onChange={() => toggleTransporter(name)}
														className="h-3.5 w-3.5 accent-cyan-300"
													/>
													{name}
												</label>
											</li>
										);
									})}
									{visibleTransporters.length === 0 && (
										<li className="px-2 py-3 text-center text-[11px] text-slate-500">No transporter found</li>
									)}
								</ul>
							</div>
						)}
					</div>
					<button
						type="button"
						onClick={() => {
							setAppliedTransporters(selectedTransporters);
							setPage(0);
							setTransporterOpen(false);
						}}
						className={`h-10 rounded-lg border px-4 text-[12px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
					>
						Search
					</button>
				</div>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
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
								aria-label="Search payment"
								className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`}
							/>
							{search ? (
								<button
									type="button"
									onClick={() => setSearch("")}
									aria-label="Clear search"
									className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
								>
									<X className="h-3.5 w-3.5" />
								</button>
							) : null}
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
										<option key={size} value={size}>{size} rows</option>
									))}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<details className="relative">
								<summary className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Columns
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div className={`absolute right-0 top-11 z-30 max-h-52 w-52 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
									{columns.map((column) => (
										<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
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
									setEditingPayment(null);
									setShowAddDialog(true);
								}}
								className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
							>
								<Plus className="h-3.5 w-3.5" /> Add
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1280px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => (
										<th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">
											{column.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{isLoading ? (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-16 text-center text-xs text-slate-500">
											Loading payment details...
										</td>
									</tr>
								) : null}
								{isError ? (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
											<p className="text-sm font-medium text-rose-600">Could not load payment details.</p>
											<button
												type="button"
												onClick={() => void refetch()}
												className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${isDark ? "border-white/[0.08] text-slate-300 hover:bg-white/[0.05]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
											>
												<RefreshCw className="h-3.5 w-3.5" /> Retry
											</button>
										</td>
									</tr>
								) : null}
								{!isLoading && !isError
									? pageRows.map((row) => (
											<tr
												key={row.externalId || row.id}
												className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
											>
												{visibleColumns.map((column) => (
													<td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">
														{cell(column.key, row)}
													</td>
												))}
											</tr>
										))
									: null}
								{!isLoading && !isError && pageRows.length === 0 ? (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
												No payments available
											</p>
											<p className="mt-1 text-xs text-slate-500">Add a payment or change the transporter filter.</p>
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing{" "}
							<span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–
								{Math.min((safePage + 1) * pageSize, filteredRows.length)}
							</span>{" "}
							of {filteredRows.length} payments
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

			{showAddDialog ? (
				<AddPayment
					onClose={closeDialog}
					onSubmit={savePayment}
					initialValues={editingPayment ?? undefined}
					isSaving={isSaving}
				/>
			) : null}

			{pendingDelete ? (
				<div
					className="fixed inset-0 z-[810] flex items-center justify-center bg-[#020718]/60 p-4"
					onMouseDown={(event) => {
						if (event.target === event.currentTarget && !isDeleting) setPendingDelete(null);
					}}
				>
					<section
						role="alertdialog"
						aria-modal="true"
						aria-labelledby="payment-delete-title"
						className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
					>
						<h3 id="payment-delete-title" className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
							Delete payment details?
						</h3>
						<p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							This will permanently remove payment for{" "}
							<strong className={isDark ? "text-white" : "text-slate-900"}>
								{resolveTransporterName(pendingDelete) || "this transporter"}
							</strong>
							.
						</p>
						<div className="mt-5 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setPendingDelete(null)}
								disabled={isDeleting}
								className={`h-9 rounded-lg border px-4 text-[12px] disabled:opacity-40 ${isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"}`}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => void confirmDelete()}
								disabled={isDeleting}
								className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold disabled:opacity-60 ${isDark ? "border-rose-300/30 bg-rose-400/[0.16] text-rose-100 hover:bg-rose-400/[0.24]" : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
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
