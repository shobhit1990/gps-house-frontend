
import { useMemo, useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { autoTable } from "jspdf-autotable";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import {
  Activity,
  CarFront,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  FileDown,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddVehicleForm } from "@/components/VehicleForm/AddVehicleForm";
import { AddJobSheet } from "@/components/ManageTechnician/AddJobSheet";
import { useAuth } from "@/contexts/AuthContext";
import type { Vehicle } from "@/interfaces/Vehicle";
import { useGetClientMasterQuery, useGetDeviceMasterQuery, useGetTransporterMasterQuery } from "@/store/services/api/Master";
import { useUpdateDeviceMutation } from "@/store/services/api/AddDevice";
import { useGetVehiclesQuery, useUpdateVehicleMutation } from "@/store/services/api/Vehicle";
import type { UpdateVehicleRequest } from "@/interfaces/Vehicle";
import { apiErrorMessage } from "@/lib/apiErrorMessage";

type VehicleState =
  | "Running"
  | "Stopped"
  | "Overspeed"
  | "Idle"
  | "Unreachable"
  | "New"
  | "Inactive"
  | "Unreported";

type VehicleRecord = Record<string, string> & {
  vehicleId: string;
  deviceId: string;
  clientId: string;
  transporterId: string;
  filterStatus: VehicleState;
  month: string;
};

type EditableVehicleField = "vehicleNo" | "client" | "transporter" | "imei" | "address" | "vehicleLog" | "certificate" | "command";

const editableFields: Record<EditableVehicleField, { label: string; placeholder: string }> = {
  vehicleNo: { label: "Vehicle No.", placeholder: "Enter vehicle number" },
  client: { label: "Client", placeholder: "Select client" },
  transporter: { label: "Transporter", placeholder: "Select transporter" },
  imei: { label: "IMEI", placeholder: "Enter IMEI" },
  address: { label: "Address", placeholder: "Enter address" },
  vehicleLog: { label: "Vehicle Log", placeholder: "Enter vehicle log" },
  certificate: { label: "Certificate", placeholder: "Enter certificate" },
  command: { label: "Command", placeholder: "Enter command" },
};

const columns: { key: string; label: string }[] = [
  { key: "sn", label: "SN" },
  { key: "vehicleNo", label: "Vehicle No." },
  { key: "imei", label: "IMEI" },
  { key: "sim", label: "SIM" },
  { key: "client", label: "Client" },
  { key: "transporter", label: "Transporter" },
  { key: "company", label: "Company" },
  { key: "deviceType", label: "D_Type" },
  { key: "state", label: "State" },
  { key: "vehicleType", label: "V_Type" },
  { key: "fuelType", label: "Fuel Type" },
  { key: "operator", label: "Operator" },
  { key: "lastUpdated", label: "Last Updated" },
  { key: "vehicleStatus", label: "V_Status" },
  { key: "deviceStatus", label: "D_Status" },
  { key: "sensors", label: "Sensors" },
  { key: "added", label: "Added" },
  { key: "subscriptionStart", label: "Sub_Start" },
  { key: "subscriptionDue", label: "Sub_Due" },
  { key: "odometer", label: "Odometer (km)" },
  { key: "inactiveDate", label: "Inactive Date" },
  { key: "modifiedDate", label: "Modified Date" },
  { key: "overspeed", label: "Overspeed" },
  { key: "mileage", label: "Mileage" },
  { key: "port", label: "Port" },
  { key: "nickname", label: "Vehicle Nickname" },
  { key: "remark", label: "Remark" },
  { key: "driverAssigned", label: "D_Assigned" },
  { key: "ignitionWire", label: "Ign Wire" },
  { key: "loadingStatus", label: "Loading Status" },
  { key: "address", label: "Address" },
  { key: "vehicleLog", label: "Vehicle Log" },
  { key: "certificate", label: "Certificate" },
  { key: "command", label: "Command" },
  { key: "technician", label: "Assign To Technician" },
];

const chartOptions = [
  "Added",
  "Subscription Start",
  "Subscription Due",
  "Inactive Date",
  "Modified Date",
  "Device Type",
  "Vehicle Status",
];

const chartYearOptions = ["2024", "2025", "2026", "2027", "2028", "2029", "2030"];

type VehicleChartDatum = { name: string; count: number };

const chartDateFields: Record<string, string> = {
  Added: "added",
  "Subscription Start": "subscriptionStart",
  "Subscription Due": "subscriptionDue",
  "Inactive Date": "inactiveDate",
  "Modified Date": "modifiedDate",
};

const chartMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const chartColors = [
  "#06b6d4",
  "#8b5cf6",
  "#3b82f6",
  "#14b8a6",
  "#22c55e",
  "#f59e0b",
  "#f43f5e",
  "#94a3b8",
];

const getChartDateParts = (value: string): { year: string; month: number } | null => {
  const isoDate = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoDate) {
    const month = Number(isoDate[2]);
    return month >= 1 && month <= 12 ? { year: isoDate[1], month } : null;
  }

  const dayFirstDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dayFirstDate) {
    const month = Number(dayFirstDate[2]);
    return month >= 1 && month <= 12 ? { year: dayFirstDate[3], month } : null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : { year: String(date.getFullYear()), month: date.getMonth() + 1 };
};

const statusOptions: (VehicleState | "All")[] = [
  "All",
  "Running",
  "Stopped",
  "Overspeed",
  "Idle",
  "Unreachable",
  "New",
  "Inactive",
  "Unreported",
];

const displayValue = (value: unknown, fallback = "—"): string => {
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const relation = value as Record<string, unknown>;
    return displayValue(
      relation.name ??
        relation.companyName ??
        relation.vehicleTypeName ??
        relation.deviceTypeName ??
        relation.imei ??
        relation.externalId ??
        relation.id,
      fallback,
    );
  }
  return fallback;
};

const referenceId = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const reference = value as Record<string, unknown>;
    const id = reference.externalId ?? reference.id;
    return typeof id === "string" || typeof id === "number" ? String(id) : "";
  }
  return "";
};

const formatVehicleDate = (value: unknown, includeTime = false): string => {
  if (typeof value !== "string" || !value.trim()) return "—";

  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime && {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }),
  }).format(date);
};

const getVehicleMonth = (value: string): string => {
  const isoDate = value.match(/^(\d{4})-(\d{2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}`;

  const dayFirstDate = value.match(/^\d{1,2}\/(\d{1,2})\/(\d{4})/);
  return dayFirstDate
    ? `${dayFirstDate[2]}-${dayFirstDate[1].padStart(2, "0")}`
    : "";
};

const toVehicleRow = (vehicle: Vehicle, index: number): VehicleRecord => {
  const record = vehicle as Vehicle & Record<string, unknown>;
  const device = record.device && typeof record.device === "object"
    ? record.device as Record<string, unknown>
    : undefined;
  const lastUpdated = formatVehicleDate(
    record.lastUpdated ?? vehicle.updatedAt,
    true,
  );
  const status = displayValue(record.vehicleStatus ?? vehicle.status, "");
  const knownStatuses = statusOptions.filter(
    (option): option is VehicleState => option !== "All",
  );
  const filterStatus =
    knownStatuses.find(
      (option) => option.toLowerCase() === status.toLowerCase(),
    ) ?? "Unreported";

  return {
    vehicleId: vehicle.externalId,
    deviceId: referenceId(record.device),
    clientId: referenceId(vehicle.client),
    transporterId: referenceId(vehicle.transporter),
    sn: String(index + 1),
    vehicleNo: displayValue(vehicle.vehicle),
    imei: displayValue(record.imei ?? device?.imei),
    sim: displayValue(record.simNumber ?? record.sim),
    client: displayValue(vehicle.client, "Unassigned"),
    transporter: displayValue(vehicle.transporter, "Unassigned"),
    company: displayValue(record.company ?? record.companyName),
    deviceType: displayValue(record.deviceType ?? vehicle.device),
    state: displayValue(record.state),
    vehicleType: displayValue(vehicle.vehicleType),
    fuelType: displayValue(vehicle.fuelType),
    operator: displayValue(record.operator ?? record.simOperator),
    lastUpdated,
    vehicleStatus: displayValue(record.vehicleStatus ?? vehicle.status),
    deviceStatus: displayValue(record.deviceStatus),
    sensors: displayValue(record.sensors),
    added: formatVehicleDate(vehicle.createdAt),
    subscriptionStart: formatVehicleDate(vehicle.subscriptionStartDate),
    subscriptionDue: formatVehicleDate(vehicle.subscriptionDueDate),
    odometer: displayValue(vehicle.currentOdometerReading),
    inactiveDate: displayValue(record.inactiveDate),
    modifiedDate: formatVehicleDate(record.modifiedDate ?? vehicle.updatedAt, true),
    overspeed: displayValue(vehicle.overspeed),
    mileage: displayValue(vehicle.mileage),
    port: displayValue(record.port),
    nickname: displayValue(record.vehicleNickname ?? vehicle.vehicleNickname),
    remark: displayValue(vehicle.remark),
    driverAssigned: displayValue(record.driverAssigned),
    ignitionWire: displayValue(record.ignitionWire),
    loadingStatus: displayValue(record.loadingStatus),
    address: displayValue(record.address),
    vehicleLog: displayValue(record.vehicleLog),
    certificate: displayValue(record.certificate),
    command: displayValue(record.command),
    technician: displayValue(record.technician),
    filterStatus,
    month: getVehicleMonth(lastUpdated || vehicle.createdAt || ""),
  };
};

const statusTone: Record<VehicleState | "All", string> = {
  All: "cyan",
  Running: "emerald",
  Stopped: "rose",
  Overspeed: "orange",
  Idle: "amber",
  Unreachable: "blue",
  New: "slate",
  Inactive: "neutral",
  Unreported: "violet",
};

export default function Vehicle() {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const isDark = theme !== "light";

  // Chart view states
  const [chartOption, setChartOption] = useState("Added");
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const vehiclesQuery = chartDateFields[chartOption] && selectedYear
    ? { year: selectedYear }
    : undefined;

  const {
    currentData: vehicleData = [],
    isLoading: isVehiclesLoading,
    isError: isVehiclesError,
    refetch: refetchVehicles,
  } = useGetVehiclesQuery(vehiclesQuery);
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<Record<EditableVehicleField, string>>>>({});
  const rows = useMemo(
    () => vehicleData.map(toVehicleRow).map((row) => ({ ...row, ...localEdits[row.vehicleId] })),
    [vehicleData, localEdits],
  );
  const { data: clients = [] } = useGetClientMasterQuery();
  const { data: transporters = [] } = useGetTransporterMasterQuery();
  const { data: devices = [] } = useGetDeviceMasterQuery();
  const [updateVehicle, { isLoading: isSavingVehicle }] = useUpdateVehicleMutation();
  const [updateDevice, { isLoading: isSavingDevice }] = useUpdateDeviceMutation();
  const [editTarget, setEditTarget] = useState<{ row: VehicleRecord; field: EditableVehicleField } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");
  const [assignVehicleId, setAssignVehicleId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<VehicleState | "All">("All");
  const [clientFilter, setClientFilter] = useState("All clients");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("All types");
  const [transporterFilter, setTransporterFilter] =
    useState("All transporters");
  const [monthFilter, setMonthFilter] = useState("");

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const isSavingEdit = isSavingVehicle || isSavingDevice;

  const openFieldEditor = (row: VehicleRecord, field: EditableVehicleField) => {
    setEditTarget({ row, field });
    const optionValue =
      field === "client"
        ? clients.find((option) => option.id === row.clientId || option.name === row.client)?.id
        : field === "transporter"
          ? transporters.find((option) => option.id === row.transporterId || option.name === row.transporter)?.id
          : undefined;
    setEditValue(optionValue ?? (row[field] === "—" ? "" : row[field]));
    setEditError("");
  };

  const saveFieldEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    const { row, field } = editTarget;
    const value = editValue.trim();

    try {
      if (field === "vehicleNo" || field === "client" || field === "transporter") {
        const body: UpdateVehicleRequest =
          field === "vehicleNo"
            ? { vehicle: value }
            : field === "client"
              ? { client: value }
              : { transporter: value };
        await updateVehicle({ externalId: row.vehicleId, body }).unwrap();
      } else if (field === "imei") {
        const device = devices.find((item) =>
          item.externalId === row.deviceId ||
          item.id === row.deviceId ||
          item.name === row.imei,
        );
        if (!device) {
          setEditError("Could not find the device linked to this vehicle.");
          return;
        }
        await updateDevice({ externalId: device.id, body: { imei: value } }).unwrap();
      } else {
        setLocalEdits((current) => ({
          ...current,
          [row.vehicleId]: { ...current[row.vehicleId], [field]: value || "—" },
        }));
        toast.info(`${editableFields[field].label} updated in this view only; backend save is not connected yet.`);
      }

      if (field === "vehicleNo" || field === "client" || field === "transporter" || field === "imei") {
        toast.success(`${editableFields[field].label} updated.`);
      }
      setEditTarget(null);
    } catch (error) {
      console.error(`Failed to update vehicle ${field}.`, error);
      setEditError(apiErrorMessage(error, `Could not update ${editableFields[field].label}. Please try again.`));
    }
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        [
          row.vehicleNo,
          row.imei,
          row.sim,
          row.client,
          row.transporter,
          row.company,
          row.address,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" || row.filterStatus === statusFilter;

      const matchesClient =
        clientFilter === "All clients" || row.client === clientFilter;

      const matchesVehicleType =
        vehicleTypeFilter === "All types" ||
        row.vehicleType === vehicleTypeFilter;

      const matchesTransporter =
        transporterFilter === "All transporters" ||
        row.transporter === transporterFilter;

      const matchesMonth = !monthFilter || row.month === monthFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesClient &&
        matchesVehicleType &&
        matchesTransporter &&
        matchesMonth
      );
    });
  }, [
    rows,
    search,
    statusFilter,
    clientFilter,
    vehicleTypeFilter,
    transporterFilter,
    monthFilter,
  ]);

  const chartSummaryData = useMemo<VehicleChartDatum[]>(() => {
    if (chartOption === "Vehicle Status") {
      return statusOptions
        .filter((status): status is VehicleState => status !== "All")
        .map((status) => ({
          name: status,
          count: filteredRows.filter((row) => row.filterStatus === status).length,
        }))
        .filter((item) => item.count > 0);
    }

    if (chartOption === "Device Type") {
      const counts = new Map<string, number>();
      filteredRows.forEach((row) => {
        const name = row.deviceType === "—" ? "Unknown" : row.deviceType;
        counts.set(name, (counts.get(name) ?? 0) + 1);
      });
      return Array.from(counts, ([name, count]) => ({ name, count })).sort(
        (left, right) => right.count - left.count || left.name.localeCompare(right.name),
      );
    }

    const dateField = chartDateFields[chartOption];
    if (!dateField || !selectedYear) return [];

    const monthlyCounts = Array.from({ length: 12 }, () => 0);
    filteredRows.forEach((row) => {
      const date = getChartDateParts(row[dateField]);
      if (!date || date.year !== selectedYear) return;
      monthlyCounts[date.month - 1] += 1;
    });

    return chartMonths
      .map((name, index) => ({ name, count: monthlyCounts[index] }))
      .filter((item) => item.count > 0);
  }, [chartOption, filteredRows, selectedYear]);

  const chartTotal = chartSummaryData.reduce((total, item) => total + item.count, 0);

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(
      statusOptions.map((status) => [status, 0]),
    ) as Record<VehicleState | "All", number>;

    counts.All = rows.length;

    rows.forEach((row) => {
      counts[row.filterStatus] += 1;
    });

    return counts;
  }, [rows]);

  const visibleColumns = columns.filter(
    (column) => !hiddenColumns.includes(column.key),
  );

  const pageCount = Math.max(
    1,
    Math.ceil(filteredRows.length / pageSize),
  );

  const pageRows = filteredRows.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  const exportRows = filteredRows.map((row, index) => ({
    row,
    values: visibleColumns.map((column) =>
      column.key === "sn"
        ? String(index + 1).padStart(2, "0")
        : column.key === "vehicleStatus"
          ? row.vehicleStatus
          : row[column.key] || "—",
    ),
  }));

  const downloadPdf = () => {
    try {
      const pdf = new jsPDF({ orientation: "landscape" });

      autoTable(pdf, {
        head: [visibleColumns.map((column) => column.label)],
        body: exportRows.map(({ values }) => values),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [74, 32, 99] },
      });

      pdf.save("vehicles.pdf");
    } catch (error) {
      console.error("Failed to export vehicle data as PDF.", error);
      toast.error("Could not download the vehicle PDF.");
    }
  };

  const downloadExcel = () => {
    try {
      const data = exportRows.map(({ values }) =>
        Object.fromEntries(
          visibleColumns.map((column, index) => [
            column.label,
            values[index],
          ]),
        ),
      );

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicles");
      XLSX.writeFile(workbook, "vehicles.xlsx");
    } catch (error) {
      console.error("Failed to export vehicle data as Excel.", error);
      toast.error("Could not download the vehicle Excel file.");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setClientFilter("All clients");
    setVehicleTypeFilter("All types");
    setTransporterFilter("All transporters");
    setMonthFilter("");
    setPage(0);
  };

  const handleAddVehicle = () => {
    setStatusFilter("All");
    setPage(0);
  };

  const toggleColumn = (key: string) => {
    setHiddenColumns((current) =>
      current.includes(key)
        ? current.filter((column) => column !== key)
        : [...current, key],
    );
  };

  const toneClasses: Record<string, string> = {
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
    neutral: "border-slate-200 bg-slate-100 text-slate-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden font-sans ${
        isDark
          ? "bg-[#03091c] text-white"
          : "bg-[#f5f8ff] text-slate-900"
      }`}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.12] blur-[160px]" />
        <div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.08] blur-[170px]" />
      </div>

      <Sidebar onLogout={logout} />

      <main className="relative mx-auto max-w-[1900px] px-4 pb-8 pt-6 sm:px-6 lg:px-7 lg:pt-7">
        <section className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p
              className={`mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                isDark ? "text-cyan-200/70" : "text-cyan-700"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Fleet operations
            </p>

            <h1
              className={`text-xl font-semibold tracking-tight sm:text-2xl ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Vehicles
            </h1>

            <p
              className={`mt-1 text-xs ${
                isDark ? "text-slate-500" : "text-slate-600"
              }`}
            >
              Vehicle inventory, device status and subscriptions
            </p>
          </div>

          <div className="flex items-center gap-2"></div>
        </section>

        {/* Vehicle Status Filters */}
        <section
          aria-label="Vehicle status filters"
          className="mb-4 overflow-x-auto scrollbar-none"
        >
          <div className="flex min-w-max items-center gap-2 pb-1">
            {statusOptions.map((status) => {
              const isSelected = statusFilter === status;
              const tone = statusTone[status];

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(0);
                  }}
                  aria-pressed={isSelected}
                  className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[10px] font-semibold transition ${
                    isSelected
                      ? toneClasses[tone]
                      : isDark
                        ? "border-white/[0.07] bg-[#08142e]/60 text-slate-400 hover:border-white/[0.14] hover:text-slate-200"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  <span>{status === "All" ? "All" : status}</span>
                  <span className="opacity-70">
                    {statusCounts[status]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Vehicle Filters */}
        <section
          aria-label="Vehicle filters"
          className={`mb-4 rounded-xl border p-3 ${
            isDark
              ? "border-white/[0.08] bg-[#08142e]/65"
              : "border-slate-200 bg-white/90 shadow-sm"
          }`}
        >
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-[1.1fr_1fr_1.1fr_1fr_1fr_auto]">
            <label className="sr-only" htmlFor="client-filter">
              Client
            </label>

            <select
              id="client-filter"
              value={clientFilter}
              onChange={(event) => {
                setClientFilter(event.target.value);
                setPage(0);
              }}
              className={`h-10 min-w-0 rounded-lg border px-3 text-xs outline-none transition ${
                isDark
                  ? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 focus:border-cyan-300/35"
                  : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
              }`}
            >
              <option>All clients</option>
              {[...new Set(rows.map((row) => row.client))].map((client) => (
                <option key={client}>{client}</option>
              ))}
            </select>

            <label className="sr-only" htmlFor="vehicle-type-filter">
              Vehicle type
            </label>

            <select
              id="vehicle-type-filter"
              value={vehicleTypeFilter}
              onChange={(event) => {
                setVehicleTypeFilter(event.target.value);
                setPage(0);
              }}
              className={`h-10 min-w-0 rounded-lg border px-3 text-xs outline-none transition ${
                isDark
                  ? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 focus:border-cyan-300/35"
                  : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
              }`}
            >
              <option>All types</option>
              {[...new Set(rows.map((row) => row.vehicleType))].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>

            <label className="sr-only" htmlFor="transporter-filter">
              Transporter
            </label>

            <select
              id="transporter-filter"
              value={transporterFilter}
              onChange={(event) => {
                setTransporterFilter(event.target.value);
                setPage(0);
              }}
              className={`h-10 min-w-0 rounded-lg border px-3 text-xs outline-none transition ${
                isDark
                  ? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 focus:border-cyan-300/35"
                  : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
              }`}
            >
              <option>All transporters</option>
              {[...new Set(rows.map((row) => row.transporter))].map(
                (transporter) => (
                  <option key={transporter}>{transporter}</option>
                ),
              )}
            </select>

            <label className="sr-only" htmlFor="state-filter">
              Vehicle state
            </label>

            <select
              id="state-filter"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as VehicleState | "All",
                );
                setPage(0);
              }}
              className={`h-10 min-w-0 rounded-lg border px-3 text-xs outline-none transition ${
                isDark
                  ? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 focus:border-cyan-300/35"
                  : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
              }`}
            >
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>

            <label className="sr-only" htmlFor="month-filter">
              Month
            </label>

            <input
              id="month-filter"
              type="month"
              value={monthFilter}
              onChange={(event) => {
                setMonthFilter(event.target.value);
                setPage(0);
              }}
              className={`h-10 min-w-0 rounded-lg border px-3 text-xs outline-none transition ${
                isDark
                  ? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 focus:border-cyan-300/35 [color-scheme:dark]"
                  : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
              }`}
            />

            <button
              type="button"
              onClick={resetFilters}
              className={`col-span-2 flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-medium transition md:col-span-1 ${
                isDark
                  ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.13]"
                  : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </section>

``        <section
          aria-label="Chart view options"
  className={`relative z-40 mb-4 overflow-visible rounded-xl border ${
            isDark
              ? "border-white/[0.08] bg-[#08142e]/55"
              : "border-slate-200 bg-white/90"
          }`}
        >
          <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
            <span
              className={`shrink-0 px-1 text-xs font-medium ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Select Option For Chart View:
            </span>

            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {chartOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setChartOption(option);
                    if (chartDateFields[option]) {
                      setShowYearSelector(true);
                      setIsYearMenuOpen(false);
                      setSelectedYear("");
                      setShowChart(false);
                    } else {
                      setShowYearSelector(false);
                      setIsYearMenuOpen(false);
                      setShowChart(true);
                    }
                  }}
                  aria-pressed={chartOption === option}
                  className={`h-9 shrink-0 rounded-lg border px-4 text-[11px] font-medium transition ${
                    chartOption === option
                      ? isDark
                        ? "border-cyan-300/25 bg-cyan-300/[0.09] text-cyan-100"
                        : "border-black-200 bg-white-50 text-white-700 hover:bg-cyan-100"
                      : isDark
                        ? "border-white/[0.07] bg-white/[0.025] text-slate-400 hover:border-white/[0.14] hover:text-slate-200"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {showYearSelector && (
              <div className="flex shrink-0 items-center gap-2">
                <label
                  htmlFor="chart-year"
                  className={`whitespace-nowrap text-xs font-medium ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Select Year:
                </label>

                <div
                  className="relative z-50"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsYearMenuOpen(false);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setIsYearMenuOpen(false);
                  }}
                >
                  <button
                    id="chart-year"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isYearMenuOpen}
                    onClick={() => setIsYearMenuOpen((open) => !open)}
                    className={`flex h-9 min-w-[120px] items-center justify-between gap-3 rounded-lg border px-3 text-xs outline-none transition ${
                      isDark
                        ? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 hover:border-cyan-300/30 focus:border-cyan-300/35"
                        : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 focus:border-cyan-400"
                    }`}
                  >
                    {selectedYear || "Select Year"}
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${isYearMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isYearMenuOpen && (
                    <div
                      role="listbox"
                      aria-label="Available years"
                      className={`absolute left-0 top-full z-[100] mt-2 max-h-60 w-full min-w-[120px] overflow-y-auto rounded-lg border p-1 shadow-xl ${
                        isDark
                          ? "border-white/[0.10] bg-[#0b1835] text-slate-200"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {chartYearOptions.length > 0 ? (
                        chartYearOptions.map((year) => (
                          <button
                            key={year}
                            type="button"
                            role="option"
                            aria-selected={selectedYear === year}
                            onClick={() => {
                              setSelectedYear(year);
                              setShowChart(true);
                              setIsYearMenuOpen(false);
                            }}
                            className={`block w-full rounded-md px-3 py-2 text-left text-xs transition ${
                              selectedYear === year
                                ? "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-300/[0.12] dark:text-cyan-100"
                                : "hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-white/[0.06] dark:hover:text-cyan-100"
                            }`}
                          >
                            {year}
                          </button>
                        ))
                      ) : (
                        <p className={`px-3 py-2 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          No years available
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Close Year Selector */}
                <button
                  type="button"
                  onClick={() => {
                    setShowYearSelector(false);
                    setIsYearMenuOpen(false);
                  }}
                  aria-label="Close year selector"
                  title="Close"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
                    isDark
                      ? "border-white/[0.08] bg-[#08142e]/60 text-slate-400 hover:border-white/[0.15] hover:text-slate-200"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </section>

        {showChart && (
          <section
            aria-label={`${chartOption} chart`}
            className={`mb-4 overflow-hidden rounded-xl border ${
              isDark
                ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90"
                : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
            }`}
          >
            <header
              className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${
                isDark
                  ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]"
                  : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"
              }`}
            >
              <div>
                <h2 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {chartOption} distribution
                </h2>
                <p className={`mt-0.5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {chartDateFields[chartOption]
                    ? `Vehicle records for ${selectedYear}`
                    : `Based on ${filteredRows.length} matching vehicles`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowChart(false);
                  setShowYearSelector(false);
                }}
                aria-label="Close chart"
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                  isDark
                    ? "border-white/[0.08] bg-white/[0.035] text-slate-400 hover:text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {chartSummaryData.length === 0 ? (
              <div className={`px-4 py-16 text-center text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                No chart data available for the selected filters.
              </div>
            ) : (
              <div className="h-[320px] px-2 py-4 sm:px-5">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartSummaryData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius="48%"
                      outerRadius="70%"
                      paddingAngle={3}
                      stroke={isDark ? "#0b1835" : "#ffffff"}
                      strokeWidth={3}
                      isAnimationActive
                    >
                      {chartSummaryData.map((item, index) => (
                        <Cell
                          key={item.name}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#0b1835" : "#ffffff",
                        borderColor: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
                        borderRadius: 10,
                        color: isDark ? "#e2e8f0" : "#334155",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={28}
                      iconType="circle"
                      wrapperStyle={{
                        color: isDark ? "#cbd5e1" : "#475569",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className={`overflow-x-auto border-t ${isDark ? "border-white/[0.07]" : "border-slate-200"}`}>
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead>
                  <tr className={`border-b text-[10px] font-semibold uppercase tracking-[0.1em] ${
                    isDark
                      ? "border-white/[0.08] bg-white/[0.025] text-slate-400"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Vehicles</th>
                    <th className="px-4 py-3 text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {chartSummaryData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={`px-4 py-5 text-center ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                        No data available
                      </td>
                    </tr>
                  ) : (
                    chartSummaryData.map((item, index) => (
                      <tr
                        key={item.name}
                        className={`border-b last:border-0 ${
                          isDark
                            ? "border-white/[0.055] text-slate-300"
                            : "border-slate-200 text-slate-700"
                        }`}
                      >
                        <td className="px-4 py-2.5">
                          <span
                            className="mr-2 inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: chartColors[index % chartColors.length] }}
                          />
                          {item.name}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{item.count}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {chartTotal ? `${((item.count / chartTotal) * 100).toFixed(1)}%` : "0%"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {chartSummaryData.length > 0 && (
                  <tfoot>
                    <tr className={`font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3 text-right tabular-nums">{chartTotal}</td>
                      <td className="px-4 py-3 text-right tabular-nums">100%</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        )}

        {/* Vehicle Table */}
        <section
          className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${
            isDark
              ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90"
              : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
          }`}
        >
          <div
            className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${
              isDark
                ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]"
                : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"
            }`}
          >
            <label className="relative block min-w-0 sm:w-[300px]">
              <Search
                className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                  isDark ? "text-cyan-200/50" : "text-cyan-600/70"
                }`}
              />

              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder="Search vehicle, IMEI, client..."
                className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${
                  isDark
                    ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]"
                    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                }`}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${
                    isDark
                      ? "text-slate-500 hover:text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="page-size">
                Rows per page
              </label>

              <div className="relative">
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(0);
                  }}
                  className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${
                    isDark
                      ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 focus:border-cyan-300/35"
                      : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400"
                  }`}
                >
                  {[10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size} rows
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>

              <details className="relative">
                <summary
                  className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${
                    isDark
                      ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Columns3
                    className={`h-3.5 w-3.5 ${
                      isDark ? "text-cyan-200/70" : "text-cyan-600"
                    }`}
                  />
                  Columns
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                </summary>

                <div
                  className={`absolute right-0 top-11 z-20 max-h-72 w-60 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${
                    isDark
                      ? "border-white/[0.10] bg-[#0a1630]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {columns.map((column) => (
                    <label
                      key={column.key}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${
                        isDark
                          ? "text-slate-300 hover:bg-white/[0.04]"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.includes(column.key)}
                        onChange={() => toggleColumn(column.key)}
                        className="h-3.5 w-3.5 accent-cyan-300"
                      />
                      {column.label}
                    </label>
                  ))}
                </div>
              </details>

              <button
                type="button"
                onClick={downloadPdf}
                className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition ${
                  isDark
                    ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/20"
                    : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"
                }`}
              >
                <FileDown className="h-3.5 w-3.5" />
                Download PDF
              </button>

              <button
                type="button"
                onClick={downloadExcel}
                className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition ${
                  isDark
                    ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/20"
                    : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Download Excel
              </button>

              <button
                type="button"
                onClick={() => setShowAddDialog(true)}
                className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${
                  isDark
                    ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]"
                    : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Vehicle
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[2500px] border-collapse text-left">
              <thead>
                <tr
                  className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${
                    isDark
                      ? "border-white/[0.08] bg-white/[0.025] text-slate-500"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      className="whitespace-nowrap px-3 py-3 font-medium first:px-4"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {isVehiclesLoading && (
                  <tr>
                    <td
                      colSpan={visibleColumns.length}
                      className="px-6 py-16 text-center text-xs text-slate-500"
                    >
                      Loading vehicles...
                    </td>
                  </tr>
                )}

                {isVehiclesError && (
                  <tr>
                    <td
                      colSpan={visibleColumns.length}
                      className="px-6 py-16 text-center"
                    >
                      <p className="text-sm font-medium text-rose-600">
                        Could not load vehicles.
                      </p>
                      <button
                        type="button"
                        onClick={() => void refetchVehicles()}
                        className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                          isDark
                            ? "border-white/[0.08] text-slate-300 hover:bg-white/[0.05]"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry
                      </button>
                    </td>
                  </tr>
                )}

                {!isVehiclesLoading &&
                  !isVehiclesError &&
                  pageRows.map((row, rowIndex) => (
                  <tr
                    key={`${row.vehicleNo}-${row.sn}`}
                    className={`border-b text-[11px] transition last:border-0 ${
                      isDark
                        ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {visibleColumns.map((column) => {
                      const value = row[column.key] || "—";
                      const isStatus = column.key === "vehicleStatus";
                      const editableField = column.key in editableFields
                        ? column.key as EditableVehicleField
                        : null;

                      return (
                        <td
                          key={column.key}
                          className="max-w-[280px] whitespace-nowrap px-3 py-3 first:px-4"
                        >
                          {editableField ? (
                            <button
                              type="button"
                              onClick={() => openFieldEditor(row, editableField)}
                              title={`Edit ${editableFields[editableField].label}`}
                              className={`text-left transition hover:underline ${
                                column.key === "vehicleNo"
                                  ? `font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`
                                  : isDark
                                    ? "text-slate-300 hover:text-cyan-200"
                                    : "text-slate-700 hover:text-cyan-700"
                              } ${column.key === "address" ? "block max-w-[250px] truncate" : ""}`}
                            >
                              {value}
                            </button>
                          ) : column.key === "technician" ? (
                            <button
                              type="button"
                              onClick={() => setAssignVehicleId(row.vehicleId)}
                              title={`Assign technician to ${row.vehicleNo}`}
                              className={`font-medium transition hover:underline ${
                                isDark ? "text-cyan-200 hover:text-cyan-100" : "text-cyan-700 hover:text-cyan-800"
                              }`}
                            >
                              {value === "—" ? "Assign" : value}
                            </button>
                          ) : isStatus ? (
                            <span
                              className={`rounded-md border px-2 py-1 text-[9px] ${
                                isDark
                                  ? "border-violet-300/15 bg-violet-300/[0.07] text-violet-100"
                                  : "border-violet-200 bg-violet-50 text-violet-700"
                              }`}
                            >
                              {row.vehicleStatus}
                            </span>
                          ) : column.key === "sn" ? (
                            <span className="text-slate-500">
                              {String(
                                page * pageSize + rowIndex + 1,
                              ).padStart(2, "0")}
                            </span>
                          ) : column.key === "address" ? (
                            <span
                              className="block max-w-[250px] truncate"
                              title={value}
                            >
                              {value}
                            </span>
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  ))}

                {!isVehiclesLoading &&
                  !isVehiclesError &&
                  pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={visibleColumns.length}
                      className="px-6 py-16 text-center"
                    >
                      <CarFront
                        className={`mx-auto h-6 w-6 ${
                          isDark ? "text-slate-600" : "text-slate-400"
                        }`}
                      />

                      <p
                        className={`mt-3 text-sm font-medium ${
                          isDark ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        No vehicles match these filters
                      </p>

                      <p
                        className={`mt-1 text-xs ${
                          isDark ? "text-slate-500" : "text-slate-500"
                        }`}
                      >
                        Try clearing a filter or changing your search.
                      </p>
                    </td>
                  </tr>
                  )}
              </tbody>
            </table>
          </div>

          <footer
            className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${
              isDark
                ? "border-white/[0.07] text-slate-500"
                : "border-slate-200 text-slate-500"
            }`}
          >
            <span>
              Showing{" "}
              <span
                className={`font-medium ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                {filteredRows.length === 0
                  ? 0
                  : page * pageSize + 1}
                –
                {Math.min(
                  (page + 1) * pageSize,
                  filteredRows.length,
                )}
              </span>{" "}
              of {filteredRows.length} vehicles
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.max(0, current - 1))
                }
                disabled={page === 0}
                aria-label="Previous page"
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                  isDark
                    ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                } disabled:cursor-not-allowed disabled:opacity-35`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span
                className={`min-w-12 text-center ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                {page + 1} / {pageCount}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(pageCount - 1, current + 1),
                  )
                }
                disabled={page >= pageCount - 1}
                aria-label="Next page"
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                  isDark
                    ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                } disabled:cursor-not-allowed disabled:opacity-35`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </section>
      </main>

      {editTarget && (
        <div
          className={`fixed inset-0 z-[820] flex items-center justify-center p-4 backdrop-blur-sm ${
            isDark ? "bg-[#020718]/80" : "bg-slate-900/50"
          }`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSavingEdit) setEditTarget(null);
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-field-edit-title"
            onSubmit={saveFieldEdit}
            className={`w-full max-w-xl overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
              isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
            }`}
          >
            <header className={`flex items-center justify-between border-b px-5 py-4 ${
              isDark ? "border-white/[0.08] bg-[#08142e]" : "border-slate-200 bg-slate-50"
            }`}>
              <h2 id="vehicle-field-edit-title" className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                Edit {editableFields[editTarget.field].label}
              </h2>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                disabled={isSavingEdit}
                aria-label="Close edit form"
                className={`rounded-lg p-1.5 transition disabled:opacity-50 ${
                  isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-200"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="space-y-4 px-5 py-5">
              <label className={`block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                <span className="mb-1.5 block">{editableFields[editTarget.field].label}</span>
                {editTarget.field === "client" || editTarget.field === "transporter" ? (
                  <select
                    autoFocus
                    required
                    value={editValue}
                    onChange={(event) => { setEditValue(event.target.value); setEditError(""); }}
                    className={`h-10 w-full rounded-lg border px-3 text-xs outline-none focus:ring-2 ${
                      isDark
                        ? "border-white/[0.09] bg-[#03091c]/70 text-white focus:border-cyan-300/35 focus:ring-cyan-300/10"
                        : "border-slate-200 bg-white text-slate-900 focus:border-cyan-400 focus:ring-cyan-100"
                    }`}
                  >
                    <option value="">{editableFields[editTarget.field].placeholder}</option>
                    {(editTarget.field === "client" ? clients : transporters).map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                ) : editTarget.field === "address" ||
                  editTarget.field === "vehicleLog" ||
                  editTarget.field === "certificate" ||
                  editTarget.field === "command" ? (
                  <textarea
                    autoFocus
                    rows={4}
                    value={editValue}
                    placeholder={editableFields[editTarget.field].placeholder}
                    onChange={(event) => { setEditValue(event.target.value); setEditError(""); }}
                    className={`w-full resize-y rounded-lg border px-3 py-2 text-xs outline-none focus:ring-2 ${
                      isDark
                        ? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10"
                        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
                    }`}
                  />
                ) : (
                  <input
                    autoFocus
                    required
                    value={editValue}
                    placeholder={editableFields[editTarget.field].placeholder}
                    onChange={(event) => { setEditValue(event.target.value); setEditError(""); }}
                    className={`h-10 w-full rounded-lg border px-3 text-xs outline-none focus:ring-2 ${
                      isDark
                        ? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10"
                        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
                    }`}
                  />
                )}
              </label>
              {editTarget.field === "address" ||
              editTarget.field === "vehicleLog" ||
              editTarget.field === "certificate" ||
              editTarget.field === "command" ? (
                <p className={`text-[11px] ${isDark ? "text-amber-200/80" : "text-amber-700"}`}>
                  This value updates in the current table view only; backend saving is not connected yet.
                </p>
              ) : null}
              {editError && <p role="alert" className="text-xs text-rose-500">{editError}</p>}
            </div>
            <footer className={`flex justify-end gap-2 border-t px-5 py-3 ${
              isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"
            }`}>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                disabled={isSavingEdit}
                className={`h-9 rounded-lg border px-4 text-xs font-medium disabled:opacity-50 ${
                  isDark ? "border-white/[0.08] text-slate-300 hover:bg-white/[0.04]" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className={`inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-xs font-semibold disabled:opacity-60 ${
                  isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                }`}
              >
                {isSavingEdit && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save
              </button>
            </footer>
          </form>
        </div>
      )}

      {assignVehicleId && (
        <AddJobSheet
          initialVehicleId={assignVehicleId}
          onClose={() => setAssignVehicleId("")}
          onSaved={() => {
            setAssignVehicleId("");
            void refetchVehicles();
          }}
        />
      )}

      {/* Add Vehicle Dialog */}
      {showAddDialog && (
        <AddVehicleForm
          onClose={() => setShowAddDialog(false)}
          onSubmit={handleAddVehicle}
        />
      )}
    </div>
  );
}
