import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, LoaderCircle, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddDriverDetailForm, type DriverDetailFormValues } from "@/components/VehicleForm/AddDriverDetailForm";
import { UploadDriverForm, type UploadDriverValues } from "@/components/VehicleForm/UploadDriverForm";
import { useAuth } from "@/contexts/AuthContext";
import { Status } from "@/enums/Status";
import type { DriverDetail } from "@/interfaces/DriverDetail";
import type { CreateDriverDetailRequest } from "@/interfaces/DriverDetail";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useGetTransporterMasterQuery } from "@/store/services/api/Master";
import {
	useCreateDriverDetailMutation,
	useDeleteDriverDetailMutation,
	useGetDriverDetailsQuery,
	useLazyGetDriverDetailByIdQuery,
	useUpdateDriverDetailMutation,
} from "@/store/services/api/DriverDetails";

type DriverRecord = {
	id: string;
	name: string;
	transporter: string;
	vehicle: string;
	active: boolean;
	assigned: boolean;
	joiningDate: string;
	leavingDate: string;
	insuranceNo: string;
	insuranceExpiry: string;
	licenseAvailable: boolean;
	licenseNumber: string;
	licenseType: string;
	licenseIssue: string;
	licenseExpiry: string;
	mediclaimNo: string;
	mediclaimExpiry: string;
	experience: number;
	age: number;
	phone: string;
	address: string;
	bloodGroup: string;
	supervisorName: string;
	supervisorPhone: string;
};

type ColumnKey = keyof Omit<DriverRecord, "id">;

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "name", label: "Name" },
	{ key: "transporter", label: "Transporter" },
	{ key: "vehicle", label: "Vehicle" },
	{ key: "active", label: "Active" },
	{ key: "assigned", label: "Assigned" },
	{ key: "joiningDate", label: "D.O.J" },
	{ key: "leavingDate", label: "D.O.L" },
	{ key: "insuranceNo", label: "Insurance No" },
	{ key: "insuranceExpiry", label: "Insurance Expiry Date" },
	{ key: "licenseAvailable", label: "License Available" },
	{ key: "licenseNumber", label: "License Number" },
	{ key: "licenseType", label: "License Type" },
	{ key: "licenseIssue", label: "License Issue" },
	{ key: "licenseExpiry", label: "License Expiry Date" },
	{ key: "mediclaimNo", label: "Mediclaim No" },
	{ key: "mediclaimExpiry", label: "Mediclaim Expiry Date" },
	{ key: "experience", label: "Experience" },
	{ key: "age", label: "Age" },
	{ key: "phone", label: "Phone No" },
	{ key: "address", label: "Address" },
	{ key: "bloodGroup", label: "Blood Group" },
	{ key: "supervisorName", label: "Supervisor Name" },
	{ key: "supervisorPhone", label: "Supervisor Phone No." },
];

const dateColumns = new Set<ColumnKey>(["joiningDate", "leavingDate", "insuranceExpiry", "licenseIssue", "licenseExpiry", "mediclaimExpiry"]);

const formatDate = (value: string) => {
	if (!value) return "—";
	const [year, month, day] = value.split("-");
	if (!year || !month || !day) return value;
	return `${day}/${month}/${year}`;
};

const textValue = (value: string | number | boolean) => (value === "" || value === null ? "—" : String(value));

const ageFromDob = (value: string) => {
	if (!value) return 0;
	const born = new Date(`${value}T00:00:00`);
	if (Number.isNaN(born.getTime())) return 0;
	const now = new Date();
	let age = now.getFullYear() - born.getFullYear();
	const month = now.getMonth() - born.getMonth();
	if (month < 0 || (month === 0 && now.getDate() < born.getDate())) age -= 1;
	return Math.max(0, age);
};

const toDriverRecord = (driver: DriverDetail, transporterName: string): DriverRecord => ({
	id: driver.externalId,
	name: `${driver.firstName} ${driver.lastName}`.trim(),
	transporter: transporterName || driver.transporter,
	vehicle: driver.deviceId ?? "",
	active: driver.status === Status.ACTIVE,
	assigned: false,
	joiningDate: driver.dateOfJoining ?? "",
	leavingDate: driver.dateOfLeaving ?? "",
	insuranceNo: driver.lifeInsuranceNumber ?? "",
	insuranceExpiry: driver.lifeInsuranceExpiryDate ?? "",
	licenseAvailable: driver.licenseAvailable ?? false,
	licenseNumber: driver.licenseNumber ?? "",
	licenseType: driver.licenseToDrive?.join(", ") ?? "",
	licenseIssue: driver.licenseIssueDate ?? "",
	licenseExpiry: driver.licenseExpiryDate ?? "",
	mediclaimNo: driver.mediclaimNumber ?? "",
	mediclaimExpiry: driver.mediclaimExpiryDate ?? "",
	experience: driver.experience ?? 0,
	age: ageFromDob(driver.dateOfBirth),
	phone: driver.phoneNumber ?? "",
	address: driver.address ?? "",
	bloodGroup: driver.bloodGroup ?? "",
	supervisorName: driver.supervisorName ?? "",
	supervisorPhone: driver.supervisorPhoneNumber ?? "",
});

export default function DriverDetails() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: driverDetails = [], isLoading, isError, refetch } = useGetDriverDetailsQuery();
	const { data: transporterOptions = [] } = useGetTransporterMasterQuery();
	const [createDriverDetail] = useCreateDriverDetailMutation();
	const [updateDriverDetail] = useUpdateDriverDetailMutation();
	const [deleteDriverDetail] = useDeleteDriverDetailMutation();
	const [getDriverDetailById] = useLazyGetDriverDetailByIdQuery();
	const [uploadedRows, setUploadedRows] = useState<DriverRecord[]>([]);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [showUploadDialog, setShowUploadDialog] = useState(false);
	const [editingDriver, setEditingDriver] = useState<DriverDetail | undefined>();
	const transporterNames = useMemo(
		() => new Map(transporterOptions.map((transporter) => [transporter.id, transporter.name])),
		[transporterOptions],
	);
	const rows = useMemo(
		() => [...driverDetails.map((detail) => toDriverRecord(detail, transporterNames.get(detail.transporter) ?? "")), ...uploadedRows],
		[driverDetails, transporterNames, uploadedRows],
	);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) =>
			[row.name, row.transporter, row.vehicle, row.phone, row.address, row.licenseNumber, row.insuranceNo, row.supervisorName]
				.join(" ")
				.toLowerCase()
				.includes(query),
		);
	}, [rows, search]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const saveDriver = async (values: DriverDetailFormValues, externalId?: string) => {
		const experience = Number(values.experience);
		const salary = Number(values.salary);
		if (!Number.isFinite(experience) || !Number.isFinite(salary)) {
			throw new Error("Experience and salary must be valid numbers.");
		}
		const body: CreateDriverDetailRequest = {
			client: values.client,
			transporter: values.transporter,
			firstName: values.firstName,
			lastName: values.lastName,
			deviceId: values.deviceId,
			dateOfJoining: values.joiningDate,
			dateOfBirth: values.dateOfBirth,
			experience,
			salary,
			phoneNumber: values.phone,
			licenseNumber: values.licenseNumber,
			licenseToDrive: values.licenseToDrive.split(",").map((id) => id.trim()).filter(Boolean),
			licenseIssueDate: values.licenseIssue,
			licenseExpiryDate: values.licenseExpiry,
			lifeInsuranceNumber: values.insuranceNo,
			lifeInsuranceExpiryDate: values.insuranceExpiry,
			mediclaimNumber: values.mediclaimNo,
			mediclaimExpiryDate: values.mediclaimExpiry,
			bloodGroup: values.bloodGroup,
			supervisorName: values.supervisorName,
			supervisorPhoneNumber: values.supervisorPhone,
			address: values.address,
			licenseAvailable: values.licenseAvailable,
			licenseVerified: values.licenseVerified,
			enableGeoVerifiedAttendance: values.geoAttendance,
			geofences: values.geofences.split(",").map((id) => id.trim()).filter(Boolean),
			status: values.active ? Status.ACTIVE : Status.INACTIVE,
			reason: values.reason,
		};
		if (externalId) {
			await updateDriverDetail({ externalId, body }).unwrap();
			toast.success("Driver details updated.");
		} else {
			await createDriverDetail(body).unwrap();
			toast.success("Driver details saved.");
		}
		setSearch("");
		setPage(0);
	};

	const uploadDrivers = (values: UploadDriverValues) => {
		setUploadedRows((current) => [
			...current,
			...values.drivers.map((driver, index) => ({
				...driver,
				id: `upload-${Date.now()}-${index}`,
				transporter: values.transporter,
			})),
		]);
		setSearch("");
		setPage(0);
		setShowUploadDialog(false);
	};

	const editDriver = async (externalId: string) => {
		try {
			const driver = await getDriverDetailById(externalId).unwrap();
			setEditingDriver(driver);
			setShowAddDialog(true);
		} catch (error) {
			toast.error(apiErrorMessage(error, "Unable to load driver details."));
		}
	};

	const removeDriver = async (id: string) => {
		if (id.startsWith("upload-")) {
			setUploadedRows((current) => current.filter((row) => row.id !== id));
			return;
		}
		try {
			await deleteDriverDetail(id).unwrap();
			toast.success("Driver details deleted.");
		} catch (error) {
			toast.error(apiErrorMessage(error, "Unable to delete driver details."));
		}
	};

	const toggleColumn = (key: ColumnKey) => {
		setHiddenColumns((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
	};

	const chip = (on: boolean, onLabel: string, offLabel: string) => (
		<span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${on ? (isDark ? "bg-emerald-400/15 text-emerald-300" : "bg-emerald-100 text-emerald-700") : (isDark ? "bg-slate-500/15 text-slate-300" : "bg-slate-100 text-slate-600")}`}>
			{on ? onLabel : offLabel}
		</span>
	);

	const cell = (key: ColumnKey, row: DriverRecord) => {
		if (key === "active") return chip(row.active, "Active", "Inactive");
		if (key === "assigned") return chip(row.assigned, "Yes", "No");
		if (key === "licenseAvailable") return chip(row.licenseAvailable, "Yes", "No");
		if (dateColumns.has(key)) return formatDate(String(row[key]));
		if (key === "name" || key === "vehicle") {
			const value = textValue(row[key]);
			return value === "—" ? value : <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{value}</span>;
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Driver Detail</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{rows.length} drivers</p>
					</div>
					<button type="button" onClick={() => void refetch()} aria-label="Refresh driver details" title="Refresh driver details" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}>
						<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search name, vehicle, phone..." aria-label="Search drivers" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
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
							<details className="relative">
								<summary className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Columns
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div className={`absolute right-0 top-11 z-30 max-h-52 w-64 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
									{columns.map((column) => (
										<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
											<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => toggleColumn(column.key)} className="h-3.5 w-3.5 accent-cyan-300" />
											{column.label}
										</label>
									))}
								</div>
							</details>
							<button type="button" onClick={() => setShowAddDialog(true)} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
								<Plus className="h-3.5 w-3.5" /> Add
							</button>
							<button type="button" onClick={() => setShowUploadDialog(true)} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.10] text-violet-100 hover:bg-violet-300/[0.16]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
								<Upload className="h-3.5 w-3.5" /> Bulk Upload
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[2200px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => (
										<th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">{column.label}</th>
									))}
									<th scope="col" className="w-24 px-3 py-3"><span className="sr-only">Actions</span></th>
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row) => (
									<tr key={row.id} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => (
											<td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">{cell(column.key, row)}</td>
										))}
										<td className="px-3 py-3">
											<div className="flex items-center gap-1">
											{!row.id.startsWith("upload-") && (
												<button type="button" aria-label={`Edit ${row.name}`} onClick={() => void editDriver(row.id)} className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100 hover:bg-cyan-300/[0.14]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
													<Pencil className="h-3.5 w-3.5" />
												</button>
											)}
											<button type="button" aria-label={`Delete ${row.name}`} onClick={() => void removeDriver(row.id)} className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.14]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
											</div>
										</td>
									</tr>
								))}
								{isError && (
									<tr>
										<td colSpan={visibleColumns.length + 1} role="alert" className="px-6 py-16 text-center text-sm text-rose-500">
											Could not load driver details. Refresh to try again.
										</td>
									</tr>
								)}
								{isLoading && pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length + 1} role="status" className="px-6 py-16 text-center">
											<LoaderCircle className="mx-auto h-5 w-5 animate-spin text-cyan-500" />
										</td>
									</tr>
								)}
								{!isLoading && !isError && pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length + 1} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No drivers match this search</p>
											<p className="mt-1 text-xs text-slate-500">Try another name, vehicle, or phone number.</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} drivers
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

			{showAddDialog && (
				<AddDriverDetailForm
					driver={editingDriver}
					onClose={() => {
						setShowAddDialog(false);
						setEditingDriver(undefined);
					}}
					onSubmit={saveDriver}
				/>
			)}
			{showUploadDialog && <UploadDriverForm onClose={() => setShowUploadDialog(false)} onSubmit={uploadDrivers} />}
		</div>
	);
}
