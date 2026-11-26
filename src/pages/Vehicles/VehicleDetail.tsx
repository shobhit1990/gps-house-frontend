import {useEffect, useMemo, useState, useRef} from "react";
import { useCloseDetailsOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, Loader2, Pencil, Plus, Power, RefreshCw, RotateCcw, Search, Trash2, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddVehicleDetailForm, type VehicleDetailFormValues } from "@/components/VehicleForm/AddVehicleDetailForm";
import type { ServiceMaintenanceValues } from "@/components/VehicleForm/ServiceMaintenanceForm";
import { ServiceMaintenanceDialog, type ServiceRecord } from "@/components/VehicleForm/ServiceMaintenanceDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Status, statusLabel } from "@/enums/Status";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import type { ServiceMaintenance, ServiceMaintenanceVehicle } from "@/interfaces/ServiceMaintenance";
import type { Vehicle } from "@/interfaces/Vehicle";
import { useCreateServiceMaintenanceMutation, useLazyGetServiceMaintenancesByVehicleIdQuery } from "@/store/services/api/ServiceMaintenance";
import { useGetVehiclesQuery, useUpdateVehicleStatusMutation } from "@/store/services/api/Vehicle";

type VehicleDetailRecord = {
	id: number;
	client: string;
	transporter: string;
	vehicleNo: string;
	ownerName: string;
	ownedBy: string;
	vehicleBrand: string;
	vehicleModel: string;
	vehicleBody: string;
	capacity: number;
	manufactureDate: string;
	purchaseDate: string;
	active: boolean;
	reason: string;
	vehicleExternalId?: string;
};

type ColumnKey = keyof VehicleDetailRecord | "service";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "vehicleNo", label: "Vehicle No" },
	{ key: "ownerName", label: "Owner Name" },
	{ key: "ownedBy", label: "Owned By" },
	{ key: "vehicleBrand", label: "Vehicle Brand" },
	{ key: "vehicleModel", label: "Vehicle Model" },
	{ key: "vehicleBody", label: "Vehicle Body" },
	{ key: "capacity", label: "Capacity" },
	{ key: "manufactureDate", label: "Manufacture Date" },
	{ key: "purchaseDate", label: "Purchase Date" },
	{ key: "service", label: "Service & Maintenance" },
];

const seedRows: VehicleDetailRecord[] = [
	{
		id: 1,
		client: "",
		transporter: "",
		vehicleNo: "UP32ER2711",
		ownerName: "",
		ownedBy: "",
		vehicleBrand: "",
		vehicleModel: "",
		vehicleBody: "",
		capacity: 0,
		manufactureDate: "2025-10-26",
		purchaseDate: "2025-10-26",
		active: true,
		reason: "",
	},
	{
		id: 2,
		client: "",
		transporter: "",
		vehicleNo: "UP45AC5536",
		ownerName: "neeraj",
		ownedBy: "market",
		vehicleBrand: "",
		vehicleModel: "",
		vehicleBody: "Lowbed",
		capacity: 0,
		manufactureDate: "2026-10-21",
		purchaseDate: "2026-10-21",
		active: true,
		reason: "",
	},
	{
		id: 3,
		client: "",
		transporter: "",
		vehicleNo: "UP32HN8013",
		ownerName: "neeraj",
		ownedBy: "market",
		vehicleBrand: "",
		vehicleModel: "",
		vehicleBody: "Lowbed",
		capacity: 0,
		manufactureDate: "2026-10-21",
		purchaseDate: "2026-10-21",
		active: true,
		reason: "",
	},
];

const toFormValues = (row: VehicleDetailRecord): VehicleDetailFormValues => ({
	client: row.client,
	transporter: row.transporter,
	vehicleNo: row.vehicleNo,
	ownerName: row.ownerName,
	ownedBy: row.ownedBy,
	vehicleBrand: row.vehicleBrand,
	vehicleModel: row.vehicleModel,
	vehicleBody: row.vehicleBody,
	capacity: String(row.capacity ?? 0),
	manufactureDate: row.manufactureDate,
	purchaseDate: row.purchaseDate,
});

const inputClass = (isDark: boolean) =>
	`h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 placeholder:text-slate-600 focus:border-cyan-300/35"
			: "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-cyan-400"
	}`;

const formatDate = (value: string) => {
	if (!value) return "—";
	const [year, month, day] = value.split("-");
	if (!year || !month || !day) return value;
	return `${day}/${month}/${year}`;
};

const addNumbers = (left: string, right: string) => {
	if (left === "" || right === "") return "";
	const total = Number(left) + Number(right);
	return Number.isFinite(total) ? String(total) : "";
};

const subtractNumbers = (left: string, right: string) => {
	if (left === "" || right === "") return "";
	const total = Number(left) - Number(right);
	return Number.isFinite(total) ? String(total) : "";
};

const toIsoDate = (date: Date) => {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
};

const addDays = (date: string, days: string) => {
	const count = Number(days);
	if (!date || days === "" || !Number.isFinite(count)) return "";
	const next = new Date(`${date}T00:00:00`);
	next.setDate(next.getDate() + count);
	return toIsoDate(next);
};

const daysUntil = (date: string) => {
	if (!date) return "";
	const target = new Date(`${date}T00:00:00`);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	return String(Math.round((target.getTime() - today.getTime()) / 86400000));
};

const textValue = (value?: string | number | null) => (value === undefined || value === null ? "" : String(value));

const serviceVehicleLabel = (vehicle: ServiceMaintenanceVehicle, fallback: string) => {
	if (typeof vehicle === "string") return fallback || vehicle;
	return vehicle.vehicle ?? vehicle.vehicleNo ?? vehicle.name ?? fallback;
};

const toServiceRecord = (service: ServiceMaintenance, fallbackVehicleNo: string): ServiceRecord => {
	const day = (value?: string) => (value ? value.slice(0, 10) : "");
	const nextServiceDueOn = day(service.nextServiceDueOn) || addDays(day(service.lastServiceDate), textValue(service.daysInterval));
	const nextOdometer = textValue(service.nextServiceDueOdometer) || addNumbers(textValue(service.lastServiceOdometer), textValue(service.odometerInterval));
	return {
		id: service.externalId,
		vehicleNo: serviceVehicleLabel(service.vehicle, fallbackVehicleNo),
		serviceName: service.serviceName ?? "",
		odometerInterval: textValue(service.odometerInterval),
		lastServiceOdometer: textValue(service.lastServiceOdometer),
		nextServiceDueOdometer: nextOdometer,
		currentOdometer: textValue(service.currentOdometer),
		kmLeftForNextService: subtractNumbers(nextOdometer, textValue(service.currentOdometer ?? service.lastServiceOdometer)),
		odometerLeft: textValue(service.odometerLeft),
		engineHoursInterval: textValue(service.engineInterval),
		lastServiceEngineHour: textValue(service.lastServiceEngine),
		nextServiceDueEngineHour: textValue(service.nextServiceDueEngineHour) || addNumbers(textValue(service.lastServiceEngine), textValue(service.engineInterval)),
		engineHourLeft: textValue(service.engineLeft),
		daysInterval: textValue(service.daysInterval),
		lastServiceOn: day(service.lastServiceDate),
		nextServiceDueOn,
		daysLeftForNextService: daysUntil(nextServiceDueOn),
		daysLeft: textValue(service.daysLeft) || daysUntil(nextServiceDueOn),
		remark: service.remark ?? "",
		documentName: service.serviceDocument ? "Uploaded" : "",
	};
};

const dayValue = (value?: string) => (value ? value.slice(0, 10) : "");

const toDetailRow = (vehicle: Vehicle, index: number): VehicleDetailRecord => ({
	id: Number(vehicle.id) || index + 1,
	client: String(vehicle.client ?? ""),
	transporter: String(vehicle.transporter ?? ""),
	vehicleNo: String(vehicle.vehicle ?? ""),
	ownerName: vehicle.ownerName ?? "",
	ownedBy: vehicle.ownedBy ?? "",
	vehicleBrand: vehicle.vehicleBrand ?? "",
	vehicleModel: vehicle.vehicleModel ?? "",
	vehicleBody: vehicle.vehicleBody ?? "",
	capacity: Number(vehicle.capacity ?? 0) || 0,
	manufactureDate: dayValue(vehicle.manufactureDate),
	purchaseDate: dayValue(vehicle.purchaseDate),
	active: String(vehicle.status ?? "").toLowerCase() !== Status.INACTIVE,
	reason: vehicle.reason ?? "",
	vehicleExternalId: String(vehicle.externalId || vehicle.id || ""),
});

const displayCell = (key: keyof VehicleDetailRecord, row: VehicleDetailRecord) => {
	if (key === "manufactureDate" || key === "purchaseDate") return formatDate(row[key]);
	if (key === "capacity") return String(row.capacity);
	const value = row[key];
	return value === "" ? "—" : String(value);
};

export default function VehicleDetail() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [rows, setRows] = useState<VehicleDetailRecord[]>(seedRows);
	const columnVisibilityRef = useRef<HTMLDetailsElement>(null);
	useCloseDetailsOnOutsideClick(columnVisibilityRef);
	const [month, setMonth] = useState("");
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [editingRow, setEditingRow] = useState<VehicleDetailRecord | null>(null);
	const [pendingDelete, setPendingDelete] = useState<VehicleDetailRecord | null>(null);
	const [serviceRow, setServiceRow] = useState<VehicleDetailRecord | null>(null);
	const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
	const [pendingStatusRow, setPendingStatusRow] = useState<VehicleDetailRecord | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<Status>(Status.ACTIVE);
	const [statusReason, setStatusReason] = useState("");
	const { data: vehicles = [] } = useGetVehiclesQuery();
	const [createService] = useCreateServiceMaintenanceMutation();
	const [fetchServicesByVehicle, { isFetching: isServiceLoading }] = useLazyGetServiceMaintenancesByVehicleIdQuery();
	const [updateVehicleStatus, { isLoading: isUpdatingStatus }] = useUpdateVehicleStatusMutation();

	const vehicleIdByNo = useMemo(() => {
		const map = new Map<string, string>();
		for (const vehicle of vehicles) {
			const no = String(vehicle.vehicle ?? "").trim().toUpperCase();
			const id = String(vehicle.externalId || vehicle.id || "").trim();
			if (no && id) map.set(no, id);
		}
		return map;
	}, [vehicles]);

	useEffect(() => {
		if (!vehicles.length) return;
		setRows(vehicles.map((vehicle, index) => toDetailRow(vehicle, index)));
	}, [vehicles]);

	const resolveVehicleId = (row: VehicleDetailRecord) =>
		row.vehicleExternalId || vehicleIdByNo.get(row.vehicleNo.trim().toUpperCase()) || "";

	const openServices = async (row: VehicleDetailRecord) => {
		const externalId = resolveVehicleId(row);
		if (!externalId) {
			toast.error("Vehicle id not found for service lookup.");
			return;
		}
		const nextRow = { ...row, vehicleExternalId: externalId };
		setServiceRow(nextRow);
		setServiceRecords([]);
		try {
			const data = await fetchServicesByVehicle(externalId).unwrap();
			setServiceRecords(data.map((service) => toServiceRecord(service, nextRow.vehicleNo)));
		} catch (error) {
			console.error("Failed to load service maintenance by vehicle.", error);
			toast.error(apiErrorMessage(error, "Could not load services for this vehicle."));
			setServiceRecords([]);
		}
	};

	const closeServices = () => {
		setServiceRow(null);
		setServiceRecords([]);
	};

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return rows.filter((row) => {
			const matchesMonth = !month || row.purchaseDate.startsWith(month);
			const matchesSearch = !query || [row.vehicleNo, row.ownerName, row.ownedBy, row.vehicleBrand, row.vehicleModel, row.vehicleBody].join(" ").toLowerCase().includes(query);
			return matchesMonth && matchesSearch;
		});
	}, [rows, search, month]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const toggleColumn = (key: ColumnKey) => {
		setHiddenColumns((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
	};

	const resetFilters = () => {
		setMonth("");
		setSearch("");
		setPage(0);
	};

	const closeForm = () => {
		setShowAddDialog(false);
		setEditingRow(null);
	};

	const openEdit = (row: VehicleDetailRecord) => {
		setEditingRow(row);
		setShowAddDialog(true);
	};

	const openStatusChange = (row: VehicleDetailRecord) => {
		setPendingStatusRow(row);
		setSelectedStatus(row.active ? Status.INACTIVE : Status.ACTIVE);
		setStatusReason("");
	};

	const closeStatusDialog = () => {
		if (isUpdatingStatus) return;
		setPendingStatusRow(null);
		setStatusReason("");
	};

	const confirmStatusChange = async () => {
		if (!pendingStatusRow) return;
		const currentStatus = pendingStatusRow.active ? Status.ACTIVE : Status.INACTIVE;
		if (selectedStatus === currentStatus) {
			toast.error("Select a different status to change.");
			return;
		}
		if (selectedStatus === Status.INACTIVE && !statusReason.trim()) {
			toast.error("Please enter a reason when setting Inactive.");
			return;
		}
		const externalId =
			pendingStatusRow.vehicleExternalId ||
			vehicleIdByNo.get(pendingStatusRow.vehicleNo.trim().toUpperCase()) ||
			"";
		try {
			if (externalId) {
				await updateVehicleStatus({
					externalId,
					status: selectedStatus,
					reason: selectedStatus === Status.INACTIVE ? statusReason.trim() : "",
				}).unwrap();
			}
			const nextReason = selectedStatus === Status.INACTIVE ? statusReason.trim() : "";
			setRows((current) =>
				current.map((row) =>
					row.id === pendingStatusRow.id
						? {
								...row,
								active: selectedStatus === Status.ACTIVE,
								reason: nextReason,
								vehicleExternalId: externalId || row.vehicleExternalId,
							}
						: row,
				),
			);
			toast.success(`${pendingStatusRow.vehicleNo} is now ${statusLabel(selectedStatus).toLowerCase()}.`);
			closeStatusDialog();
		} catch (error) {
			console.error("Failed to update vehicle detail status.", error);
			toast.error(apiErrorMessage(error, "Could not update the vehicle status."));
		}
	};

	const saveVehicle = (values: VehicleDetailFormValues) => {
		const capacity = Number(values.capacity);
		const next: Omit<VehicleDetailRecord, "id"> = {
			client: values.client,
			transporter: values.transporter,
			vehicleNo: values.vehicleNo,
			ownerName: values.ownerName,
			ownedBy: values.ownedBy,
			vehicleBrand: values.vehicleBrand,
			vehicleModel: values.vehicleModel,
			vehicleBody: values.vehicleBody,
			capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : 0,
			manufactureDate: values.manufactureDate,
			purchaseDate: values.purchaseDate,
			active: editingRow?.active ?? true,
			reason: editingRow?.reason ?? "",
			vehicleExternalId: editingRow?.vehicleExternalId || vehicleIdByNo.get(values.vehicleNo.trim().toUpperCase()),
		};
		if (editingRow) {
			setRows((current) => current.map((row) => (row.id === editingRow.id ? { ...row, ...next } : row)));
			toast.success(`${values.vehicleNo} updated.`);
		} else {
			setRows((current) => [
				...current,
				{
					id: current.reduce((max, row) => Math.max(max, row.id), 0) + 1,
					...next,
				},
			]);
			toast.success(`${values.vehicleNo} added.`);
		}
		closeForm();
	};

	const confirmDelete = () => {
		if (!pendingDelete) return;
		setRows((current) => current.filter((row) => row.id !== pendingDelete.id));
		toast.success(`${pendingDelete.vehicleNo} deleted.`);
		setPendingDelete(null);
	};

	const saveService = async (values: ServiceMaintenanceValues) => {
		const optionalNumber = (value: string) => (value.trim() && Number.isFinite(Number(value)) ? Number(value) : undefined);
		const isTemplate = values.mode === "template";
		try {
			await createService({
				serviceName: isTemplate ? values.templateName : values.serviceName,
				vehicle: values.vehicleNo,
				remark: values.remark.trim() || undefined,
				odometerIntervalEnabled: isTemplate || values.odometerEnabled,
				odometerInterval: optionalNumber(isTemplate ? values.thresholdKm : values.odometerEnabled ? values.odometerInterval : ""),
				lastServiceOdometer: optionalNumber(!isTemplate && values.odometerEnabled ? values.lastServiceOdometer : ""),
				engineIntervalEnabled: !isTemplate && values.engineEnabled,
				engineInterval: optionalNumber(!isTemplate && values.engineEnabled ? values.engineInterval : ""),
				lastServiceEngine: optionalNumber(!isTemplate && values.engineEnabled ? values.lastServiceEngine : ""),
				daysIntervalEnabled: isTemplate || values.daysEnabled,
				daysInterval: optionalNumber(isTemplate ? values.thresholdDays : values.daysEnabled ? values.daysInterval : ""),
				lastServiceDate: (isTemplate ? values.purchaseDate : values.daysEnabled ? values.lastServiceDate : "") || undefined,
				odometerLeftEnabled: values.odometerLeftEnabled,
				odometerLeft: optionalNumber(values.odometerLeftEnabled ? values.odometerLeft : ""),
				engineLeftEnabled: values.engineLeftEnabled,
				engineLeft: optionalNumber(values.engineLeftEnabled ? values.engineLeft : ""),
				daysLeftEnabled: values.daysLeftEnabled,
				daysLeft: optionalNumber(values.daysLeftEnabled ? values.daysLeft : ""),
				updateRecord: values.updateRecord,
				mobile: values.notifyMobile,
				allowVisibilityToDriver: values.visibleToDriver,
			}).unwrap();
			toast.success("Service saved.");
			closeForm();
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not save the service."));
		}
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Vehicle Detail</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{rows.length} vehicles</p>
					</div>
					<button type="button" onClick={resetFilters} aria-label="Refresh vehicle details" title="Refresh vehicle details" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}>
						<RefreshCw className="h-4 w-4" />
					</button>
				</section>

				<section aria-label="Vehicle detail filters" className={`mb-4 rounded-xl border p-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/65" : "border-slate-200 bg-white/90 shadow-sm"}`}>
					<div className="flex flex-wrap items-center gap-2">
						<label className="sr-only" htmlFor="vehicle-detail-month">Purchase month</label>
						<input id="vehicle-detail-month" type="month" value={month} onChange={(event) => { setMonth(event.target.value); setPage(0); }} className={`${inputClass(isDark)} w-full sm:w-[220px] ${isDark ? "[color-scheme:dark]" : ""}`} />
						<button type="button" onClick={resetFilters} className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-medium transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.13]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
							<RotateCcw className="h-3.5 w-3.5" /> Reset
						</button>
					</div>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search vehicle, owner, body..." aria-label="Search vehicle details" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
							{search && (
								<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative">
								<select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
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
								<div className={`absolute right-0 top-11 z-20 max-h-72 w-60 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
									{columns.map((column) => (
										<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
											<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => toggleColumn(column.key)} className="h-3.5 w-3.5 accent-cyan-300" />
											{column.label}
										</label>
									))}
								</div>
							</details>
							<button
								type="button"
								onClick={() => {
									setEditingRow(null);
									setShowAddDialog(true);
								}}
								className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
							>
								<Plus className="h-3.5 w-3.5" /> Add
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1360px] border-collapse text-left">
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
											<td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">
												{column.key === "vehicleNo" ? (
													<span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{row.vehicleNo}</span>
												) : column.key === "service" ? (
													<button
														type="button"
														onClick={() => void openServices(row)}
														className={`text-[11px] font-semibold underline underline-offset-2 ${isDark ? "text-cyan-200 hover:text-cyan-100" : "text-cyan-700 hover:text-cyan-800"}`}
													>
														View
													</button>
												) : (
													displayCell(column.key, row)
												)}
											</td>
										))}
										<td className="whitespace-nowrap px-3 py-3">
											<button
												type="button"
												onClick={() => openStatusChange(row)}
												disabled={isUpdatingStatus}
												aria-label={`Change status of ${row.vehicleNo}`}
												title="Change status"
												className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold transition disabled:opacity-50 ${
													row.active
														? isDark
															? "bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25"
															: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
														: isDark
															? "bg-rose-400/15 text-rose-200 hover:bg-rose-400/25"
															: "bg-rose-50 text-rose-700 hover:bg-rose-100"
												}`}
											>
												{row.active ? "Active" : "Inactive"}
											</button>
										</td>
										<td className="whitespace-nowrap px-3 py-3">{row.active ? "—" : row.reason.trim() || "—"}</td>
										<td className="px-3 py-3">
											<div className="flex items-center gap-1">
												<button
													type="button"
													aria-label={`Edit ${row.vehicleNo}`}
													title="Edit"
													onClick={() => openEdit(row)}
													className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100 hover:bg-cyan-300/[0.14]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
												>
													<Pencil className="h-3.5 w-3.5" />
												</button>
												<button
													type="button"
													aria-label={`Change status of ${row.vehicleNo}`}
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
												<button
													type="button"
													aria-label={`Delete ${row.vehicleNo}`}
													title="Delete"
													onClick={() => setPendingDelete(row)}
													className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${isDark ? "border-rose-300/20 bg-rose-300/[0.08] text-rose-200 hover:bg-rose-300/[0.14]" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											</div>
										</td>
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length + 2} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No vehicles match these filters</p>
											<p className="mt-1 text-xs text-slate-500">Try clearing a filter or changing your search.</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} vehicles
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
				<AddVehicleDetailForm
					initialValues={editingRow ? toFormValues(editingRow) : null}
					onClose={closeForm}
					onSubmit={saveVehicle}
					onSaveService={saveService}
				/>
			)}

			{serviceRow && (
				<ServiceMaintenanceDialog
					vehicleNo={serviceRow.vehicleNo}
					records={serviceRecords}
					isLoading={isServiceLoading}
					onClose={closeServices}
				/>
			)}

			{pendingStatusRow ? (
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
						aria-labelledby="vehicle-detail-status-title"
						className={`relative w-full max-w-md rounded-2xl border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
							isDark ? "border-white/[0.10] bg-[#0a1630] text-white" : "border-slate-200 bg-white text-slate-900"
						}`}
					>
						<h2 id="vehicle-detail-status-title" className="text-[15px] font-semibold">
							Change vehicle status
						</h2>
						<p className={`mt-2 text-[12px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							Current status of <span className="font-medium">{pendingStatusRow.vehicleNo}</span> is{" "}
							<span className="font-medium">{pendingStatusRow.active ? "Active" : "Inactive"}</span>. Choose Active or
							Inactive. Reason is required only when setting Inactive.
						</p>
						<label className="mt-4 block">
							<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								Status <span className="text-rose-400">*</span>
							</span>
							<select
								value={selectedStatus}
								onChange={(event) => setSelectedStatus(event.target.value as Status)}
								className={`${inputClass(isDark)} ${isDark ? "[color-scheme:dark]" : ""}`}
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
									placeholder={`Why is this vehicle being set ${statusLabel(selectedStatus).toLowerCase()}?`}
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

			{pendingDelete && (
				<div
					className="fixed inset-0 z-[810] flex items-center justify-center bg-[#020718]/60 p-4"
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) setPendingDelete(null);
					}}
				>
					<section
						role="alertdialog"
						aria-modal="true"
						aria-labelledby="vehicle-detail-delete-title"
						className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
					>
						<h3 id="vehicle-detail-delete-title" className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
							Delete vehicle detail?
						</h3>
						<p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							This will remove{" "}
							<strong className={isDark ? "text-white" : "text-slate-900"}>{pendingDelete.vehicleNo}</strong> from the list.
						</p>
						<div className="mt-5 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setPendingDelete(null)}
								className={`h-9 rounded-lg border px-4 text-[12px] ${isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"}`}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={confirmDelete}
								className={`h-9 rounded-lg border px-4 text-[12px] font-semibold ${isDark ? "border-rose-300/30 bg-rose-400/[0.16] text-rose-100 hover:bg-rose-400/[0.24]" : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
							>
								Delete
							</button>
						</div>
					</section>
				</div>
			)}
		</div>
	);
}
