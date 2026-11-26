import {useMemo, useState, useRef} from "react";
import { useCloseDetailsOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, Loader2, LoaderCircle, Pencil, Plus, Power, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddDriverDetailForm, type DriverDetailFormValues } from "@/components/VehicleForm/AddDriverDetailForm";
import { UploadDriverForm, type UploadDriverValues } from "@/components/VehicleForm/UploadDriverForm";
import { useAuth } from "@/contexts/AuthContext";
import { Status, statusLabel } from "@/enums/Status";
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
	useUpdateDriverDetailStatusMutation,
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
	reason: string;
};

type ColumnKey = keyof Omit<DriverRecord, "id">;

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "name", label: "Name" },
	{ key: "transporter", label: "Transporter" },
	{ key: "vehicle", label: "Vehicle" },
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

const inputClass = (isDark: boolean) =>
	`h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 placeholder:text-slate-600 focus:border-cyan-300/35 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-cyan-400"
	}`;

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
	transporter: transporterName || driver.transporterName || driver.transporter,
	vehicle: driver.deviceId ?? "",
	active: String(driver.status ?? "").trim().toLowerCase() === Status.ACTIVE,
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
	reason: driver.reason?.trim() ?? "",
});

export default function DriverDetails() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: driverDetails = [], isLoading, isError, refetch } = useGetDriverDetailsQuery();
	const { data: transporterOptions = [] } = useGetTransporterMasterQuery();
	const [createDriverDetail] = useCreateDriverDetailMutation();
	const [updateDriverDetail, { isLoading: isUpdatingDriver }] = useUpdateDriverDetailMutation();
	const [updateDriverDetailStatus, { isLoading: isUpdatingDriverStatus }] =
		useUpdateDriverDetailStatusMutation();
	const isUpdatingStatus = isUpdatingDriver || isUpdatingDriverStatus;
	const [deleteDriverDetail] = useDeleteDriverDetailMutation();
	const [getDriverDetailById] = useLazyGetDriverDetailByIdQuery();
	const [uploadedRows, setUploadedRows] = useState<DriverRecord[]>([]);
	const columnVisibilityRef = useRef<HTMLDetailsElement>(null);
	useCloseDetailsOnOutsideClick(columnVisibilityRef);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [showUploadDialog, setShowUploadDialog] = useState(false);
	const [editingDriver, setEditingDriver] = useState<DriverDetail | undefined>();
	const [pendingStatusDriver, setPendingStatusDriver] = useState<DriverRecord | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<Status>(Status.ACTIVE);
	const [statusReason, setStatusReason] = useState("");
	const transporterNames = useMemo(
		() => new Map(transporterOptions.map((transporter) => [transporter.id, transporter.name])),
		[transporterOptions],
	);
	const rows = useMemo(
		() => [
			...driverDetails.map((detail) =>
				toDriverRecord(detail, transporterNames.get(detail.transporter) ?? detail.transporterName ?? ""),
			),
			...uploadedRows,
		],
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
		/** `YYYY-MM-DD` (date input) → ISO 8601, e.g. `2026-11-21T00:00:00.000Z`. */
		const toIsoDate = (value: string) => {
			const day = value.trim().slice(0, 10);
			if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
				throw new Error(`Invalid date: ${value || "(empty)"}`);
			}
			return `${day}T00:00:00.000Z`;
		};
		const body: CreateDriverDetailRequest = {
			client: values.client,
			transporter: values.transporter,
			firstName: values.firstName,
			lastName: values.lastName,
			deviceId: values.deviceId,
			dateOfJoining: toIsoDate(values.joiningDate),
			dateOfBirth: toIsoDate(values.dateOfBirth),
			experience,
			salary,
			phoneNumber: values.phone,
			licenseNumber: values.licenseNumber,
			licenseToDrive: values.licenseToDrive.split(",").map((id) => id.trim()).filter(Boolean),
			licenseIssueDate: toIsoDate(values.licenseIssue),
			licenseExpiryDate: toIsoDate(values.licenseExpiry),
			lifeInsuranceNumber: values.insuranceNo,
			lifeInsuranceExpiryDate: toIsoDate(values.insuranceExpiry),
			mediclaimNumber: values.mediclaimNo,
			mediclaimExpiryDate: toIsoDate(values.mediclaimExpiry),
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
			const updated = await updateDriverDetail({ externalId, body }).unwrap();
			toast.success("Driver details updated.");
			setSearch("");
			setPage(0);
			return updated.externalId;
		}
		const created = await createDriverDetail(body).unwrap();
		toast.success("Driver details saved.");
		setSearch("");
		setPage(0);
		return created.externalId;
	};

	const uploadDrivers = (values: UploadDriverValues) => {
		setUploadedRows((current) => [
			...current,
			...values.drivers.map((driver, index) => ({
				...driver,
				id: `upload-${Date.now()}-${index}`,
				transporter: values.transporter,
				reason: "",
			})),
		]);
		setSearch("");
		setPage(0);
		setShowUploadDialog(false);
	};

	const editDriver = async (externalId: string) => {
		const fromList = driverDetails.find((item) => item.externalId === externalId);
		if (fromList) {
			setEditingDriver(fromList);
			setShowAddDialog(true);
		}
		try {
			const driver = await getDriverDetailById(externalId).unwrap();
			setEditingDriver(driver);
			setShowAddDialog(true);
		} catch (error) {
			if (!fromList) {
				toast.error(apiErrorMessage(error, "Unable to load driver details."));
			}
		}
	};

	const openStatusChange = (row: DriverRecord) => {
		if (row.id.startsWith("upload-")) {
			toast.info("Upload this driver before changing status.");
			return;
		}
		setPendingStatusDriver(row);
		setSelectedStatus(row.active ? Status.INACTIVE : Status.ACTIVE);
		setStatusReason("");
	};

	const closeStatusDialog = () => {
		if (isUpdatingStatus) return;
		setPendingStatusDriver(null);
		setStatusReason("");
	};

	const confirmStatusChange = async () => {
		if (!pendingStatusDriver) return;
		const currentStatus = pendingStatusDriver.active ? Status.ACTIVE : Status.INACTIVE;
		if (selectedStatus === currentStatus) {
			toast.error("Select a different status to change.");
			return;
		}
		if (selectedStatus === Status.INACTIVE && !statusReason.trim()) {
			toast.error("Please enter a reason when setting Inactive.");
			return;
		}
		const reason = selectedStatus === Status.INACTIVE ? statusReason.trim() : "";
		const source = driverDetails.find((item) => item.externalId === pendingStatusDriver.id);
		try {
			if (source) {
				await updateDriverDetail({
					externalId: pendingStatusDriver.id,
					body: {
						client: source.client,
						transporter: source.transporter,
						firstName: source.firstName,
						lastName: source.lastName,
						deviceId: source.deviceId,
						dateOfJoining: source.dateOfJoining,
						dateOfBirth: source.dateOfBirth,
						experience: source.experience,
						salary: source.salary,
						phoneNumber: source.phoneNumber,
						licenseNumber: source.licenseNumber,
						licenseToDrive: source.licenseToDrive,
						licenseIssueDate: source.licenseIssueDate,
						licenseExpiryDate: source.licenseExpiryDate,
						lifeInsuranceNumber: source.lifeInsuranceNumber,
						lifeInsuranceExpiryDate: source.lifeInsuranceExpiryDate,
						mediclaimNumber: source.mediclaimNumber,
						mediclaimExpiryDate: source.mediclaimExpiryDate,
						bloodGroup: source.bloodGroup,
						supervisorName: source.supervisorName,
						supervisorPhoneNumber: source.supervisorPhoneNumber,
						address: source.address,
						licenseAvailable: source.licenseAvailable,
						licenseVerified: source.licenseVerified,
						enableGeoVerifiedAttendance: source.enableGeoVerifiedAttendance,
						geofences: source.geofences,
						status: selectedStatus,
						reason,
					},
				}).unwrap();
			} else {
				await updateDriverDetailStatus({
					externalId: pendingStatusDriver.id,
					status: selectedStatus,
					reason,
				}).unwrap();
			}
			toast.success(`${pendingStatusDriver.name} is now ${statusLabel(selectedStatus).toLowerCase()}.`);
			closeStatusDialog();
			void refetch();
		} catch (error) {
			console.error("Failed to update driver status.", error);
			toast.error(apiErrorMessage(error, "Could not update the driver status."));
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

	const statusBadge = (row: DriverRecord) => (
		<span
			className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${
				row.active
					? isDark
						? "bg-emerald-400/15 text-emerald-300"
						: "bg-emerald-100 text-emerald-700"
					: isDark
						? "bg-rose-400/15 text-rose-200"
						: "bg-rose-50 text-rose-700"
			}`}
		>
			{row.active ? "Active" : "Inactive"}
		</span>
	);

	const cell = (key: ColumnKey, row: DriverRecord) => {
		if (key === "active") return statusBadge(row);
		if (key === "assigned") return chip(row.assigned, "Yes", "No");
		if (key === "licenseAvailable") return chip(row.licenseAvailable, "Yes", "No");
		if (key === "reason") {
			return (
				<span
					className={`block max-w-[220px] truncate ${isDark ? "text-slate-400" : "text-slate-600"}`}
					title={row.reason || undefined}
				>
					{row.reason || "—"}
				</span>
			);
		}
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
							<details ref={columnVisibilityRef} className="relative">
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
									<th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">Status</th>
									<th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">Reason</th>
									<th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">Action</th>
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row) => (
									<tr key={row.id} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => (
											<td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">{cell(column.key, row)}</td>
										))}
										<td className="whitespace-nowrap px-3 py-3">{statusBadge(row)}</td>
										<td className="whitespace-nowrap px-3 py-3">{cell("reason", row)}</td>
										<td className="px-3 py-3">
											<div className="flex items-center gap-1">
												{!row.id.startsWith("upload-") && (
													<>
														<button
															type="button"
															aria-label={`Edit ${row.name}`}
															title="Edit"
															onClick={() => void editDriver(row.id)}
															className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100 hover:bg-cyan-300/[0.14]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
														>
															<Pencil className="h-3.5 w-3.5" />
														</button>
														<button
															type="button"
															aria-label={`Change status of ${row.name}`}
															title="Change status"
															onClick={() => openStatusChange(row)}
															disabled={isUpdatingStatus}
															className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-50 ${
																isDark
																	? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.14]"
																	: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
															}`}
														>
															<Power className="h-3.5 w-3.5" />
														</button>
													</>
												)}
												<button
													type="button"
													aria-label={`Delete ${row.name}`}
													title="Delete"
													onClick={() => void removeDriver(row.id)}
													className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-rose-300/20 bg-rose-300/[0.08] text-rose-200 hover:bg-rose-300/[0.14]" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											</div>
										</td>
									</tr>
								))}
								{isError && (
									<tr>
										<td colSpan={visibleColumns.length + 3} role="alert" className="px-6 py-16 text-center text-sm text-rose-500">
											Could not load driver details. Refresh to try again.
										</td>
									</tr>
								)}
								{isLoading && pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length + 3} role="status" className="px-6 py-16 text-center">
											<LoaderCircle className="mx-auto h-5 w-5 animate-spin text-cyan-500" />
										</td>
									</tr>
								)}
								{!isLoading && !isError && pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length + 3} className="px-6 py-16 text-center">
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

			{pendingStatusDriver ? (
				<div className="fixed inset-0 z-[820] flex items-center justify-center p-4">
					<button
						type="button"
						aria-label="Close status dialog"
						className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]"
						onClick={closeStatusDialog}
					/>
					<section
						role="dialog"
						aria-modal="true"
						aria-labelledby="driver-status-title"
						className={`relative w-full max-w-md rounded-2xl border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
							isDark ? "border-white/[0.10] bg-[#0a1630] text-white" : "border-slate-200 bg-white text-slate-900"
						}`}
					>
						<h2 id="driver-status-title" className="text-[15px] font-semibold">
							Change driver status
						</h2>
						<p className={`mt-2 text-[12px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							Current status of <span className="font-medium">{pendingStatusDriver.name}</span> is{" "}
							<span className="font-medium">{pendingStatusDriver.active ? "Active" : "Inactive"}</span>. Choose
							Active or Inactive. Reason is required only when setting Inactive.
						</p>
						<label className="mt-4 block">
							<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								Status <span className="text-rose-400">*</span>
							</span>
							<select
								value={selectedStatus}
								onChange={(event) => setSelectedStatus(event.target.value as Status)}
								className={inputClass(isDark)}
							>
								<option value={Status.ACTIVE}>Active</option>
								<option value={Status.INACTIVE}>Inactive</option>
							</select>
						</label>
						{selectedStatus === Status.INACTIVE ? (
							<label className="mt-4 block">
								<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
									Reason <span className="text-rose-400">*</span>
								</span>
								<textarea
									value={statusReason}
									onChange={(event) => setStatusReason(event.target.value)}
									rows={3}
									placeholder={`Why is this driver being set ${statusLabel(selectedStatus).toLowerCase()}?`}
									className={`${inputClass(isDark)} h-auto resize-none py-2`}
								/>
							</label>
						) : null}
						<div className="mt-5 flex justify-end gap-2">
							<button
								type="button"
								onClick={closeStatusDialog}
								disabled={isUpdatingStatus}
								className={`h-9 rounded-lg border px-4 text-[12px] disabled:opacity-40 ${
									isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"
								}`}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => void confirmStatusChange()}
								disabled={isUpdatingStatus}
								className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold disabled:opacity-60 ${
									isDark
										? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50"
										: "border-cyan-300 bg-cyan-50 text-cyan-800"
								}`}
							>
								{isUpdatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
								Update Status
							</button>
						</div>
					</section>
				</div>
			) : null}
		</div>
	);
}
