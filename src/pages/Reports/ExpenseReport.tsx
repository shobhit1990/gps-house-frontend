import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useCloseDetailsOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddExpense, type ExpenseFormValues } from "@/components/Reports/AddExpense";
import { VehicleMultiSelect } from "@/components/Reports/VehicleMultiSelect";
import { useAuth } from "@/contexts/AuthContext";
import { ExpenseFor, expenseForOptions } from "@/enums/ExpenseFor";
import { Status } from "@/enums/Status";
import {
	useGetClientMasterQuery,
	useGetExpenseTypeMasterQuery,
	useGetTransporterMasterQuery,
	useGetVehicleMasterQuery,
} from "@/store/services/api/Master";
import { useGetDriverDetailsQuery } from "@/store/services/api/DriverDetails";
import {
	useCreateExpenseMutation,
	useDeleteExpenseMutation,
	useGetExpensesQuery,
	useLazyGetExpenseByIdQuery,
	useUpdateExpenseMutation,
	type ExpenseListParams,
} from "@/store/services/api/ExpenseReport";
import type { CreateExpenseRequest, Expense } from "@/interfaces/Expense";
import type { MasterOption } from "@/interfaces/EntityMaster";
import { apiErrorMessage } from "@/lib/apiErrorMessage";

type ExpenseRecord = ExpenseFormValues & Pick<Expense, "id" | "externalId"> & {
	expenseTypeName: string;
	vehicleNo: string;
	driverName: string;
	tripName: string;
	added: string;
	createdBy: string;
	updated: string;
	documents: string;
};

type ColumnKey =
	| "sn"
	| "vehicleNo"
	| "driverName"
	| "tripName"
	| "expenseType"
	| "expenseDate"
	| "expenseName"
	| "quantity"
	| "amount"
	| "odometer"
	| "engineHours"
	| "supplier"
	| "buyer"
	| "description"
	| "added"
	| "createdBy"
	| "updated"
	| "edit"
	| "delete"
	| "documents";

type MenuKind = "client" | "transporter" | "expenseFor" | "entity";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "vehicleNo", label: "Vehicle No." },
	{ key: "driverName", label: "Driver Name" },
	{ key: "tripName", label: "Trip Name" },
	{ key: "expenseType", label: "Expense Type" },
	{ key: "expenseDate", label: "Expense Date" },
	{ key: "expenseName", label: "Expense Name" },
	{ key: "quantity", label: "Quantity" },
	{ key: "amount", label: "Amount" },
	{ key: "odometer", label: "Odometer" },
	{ key: "engineHours", label: "Engine Hours" },
	{ key: "supplier", label: "Supplier" },
	{ key: "buyer", label: "Buyer" },
	{ key: "description", label: "Description" },
	{ key: "added", label: "Added" },
	{ key: "createdBy", label: "Created By" },
	{ key: "updated", label: "Updated" },
	{ key: "edit", label: "Edit" },
	{ key: "delete", label: "Delete" },
	{ key: "documents", label: "Documents" },
];

/** Columns that depend on Expense For — swapped in ahead of the shared expense columns. */
const expenseForLeadColumns: Record<ExpenseFor, ColumnKey[]> = {
	[ExpenseFor.VEHICLE_WISE]: ["vehicleNo"],
	[ExpenseFor.DRIVER_WISE]: ["driverName"],
	[ExpenseFor.TRIP_WISE]: ["tripName"],
	[ExpenseFor.GENERAL_WISE]: [],
};

const pad = (value: number) => String(value).padStart(2, "0");

const todayRange = () => {
	const now = new Date();
	const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
	return { from: `${day}T00:00`, to: `${day}T23:59` };
};

const formatDateTime = (value: string) => {
	if (!value.trim()) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const textValue = (value: string) => (value.trim() ? value : "—");

const optionLabel = (id: string, options: { id: string; name: string }[], fallback: string) => {
	const match = options.find((option) => option.id === id)?.name;
	if (typeof match === "string" && match.trim()) return match;
	return typeof fallback === "string" ? fallback : typeof id === "string" ? id : "";
};

const valueAsString = (value: string | number | undefined) => (value === undefined ? "" : String(value));

const masterId = (value: string, options: MasterOption[]) =>
	options.find((option) => option.id === value || option.name === value)?.id ?? value;

const optionalNumber = (value: string) => (value.trim() ? Number(value) : undefined);

const dateTimeInputValue = (value: string) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** datetime-local → ISO UTC, e.g. 2026-11-20T15:36:00.000Z */
const toIsoExpenseDate = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toISOString();
};

const buildExpensePayload = (values: ExpenseFormValues): CreateExpenseRequest => {
	const expenseFor = values.expenseFor || ExpenseFor.VEHICLE_WISE;
	return {
		client: values.client,
		transporter: values.transporter,
		expenseFor,
		...(expenseFor === ExpenseFor.VEHICLE_WISE && values.vehicle ? { vehicle: values.vehicle } : {}),
		...(expenseFor === ExpenseFor.DRIVER_WISE && values.driver ? { driver: values.driver } : {}),
		expenseName: values.expenseName.trim() || undefined,
		expenseType: values.expenseType,
		amount: Number(values.amount),
		expenseDate: toIsoExpenseDate(values.expenseDate),
		odometer: optionalNumber(values.odometer),
		engineHours: optionalNumber(values.engineHours),
		description: values.description.trim() || undefined,
		quantity: optionalNumber(values.quantity),
		supplier: values.supplier.trim() || undefined,
		buyer: values.buyer.trim() || undefined,
		status: Status.ACTIVE,
	};
};

export default function ExpenseReport() {
	const { data: clientMaster = [] } = useGetClientMasterQuery();
	const { data: expenseTypeMaster = [] } = useGetExpenseTypeMasterQuery();
	const { data: vehicleMaster = [] } = useGetVehicleMasterQuery();
	const { data: driverDetails = [] } = useGetDriverDetailsQuery();
	const [listParams, setListParams] = useState<ExpenseListParams | void>(undefined);
	const {
		data: expenseData = [],
		isFetching,
		isLoading,
		isError,
		error,
		refetch,
	} = useGetExpensesQuery(listParams);
	const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
	const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
	const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();
	const [getExpenseById] = useLazyGetExpenseByIdQuery();
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const initialRange = todayRange();
	const clientRef = useRef<HTMLDivElement>(null);
	const transporterRef = useRef<HTMLDivElement>(null);
	const expenseForRef = useRef<HTMLDivElement>(null);
	const entityRef = useRef<HTMLDivElement>(null);
	const columnVisibilityRef = useRef<HTMLDetailsElement>(null);
	useCloseDetailsOnOutsideClick(columnVisibilityRef);
	const [search, setSearch] = useState("");
	const [pageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [selectedClient, setSelectedClient] = useState("");
	const [selectedTransporter, setSelectedTransporter] = useState("");
	const [selectedExpenseFor, setSelectedExpenseFor] = useState<ExpenseFor | "">("");
	const [selectedEntity, setSelectedEntity] = useState("");
	const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
	const [from, setFrom] = useState(initialRange.from);
	const [to, setTo] = useState(initialRange.to);
	const [openMenu, setOpenMenu] = useState<MenuKind | null>(null);
	const [clientQuery, setClientQuery] = useState("");
	const [transporterQuery, setTransporterQuery] = useState("");
	const [expenseForQuery, setExpenseForQuery] = useState("");
	const [entityQuery, setEntityQuery] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [editing, setEditing] = useState<ExpenseRecord | null>(null);
	const [pendingDelete, setPendingDelete] = useState<ExpenseRecord | null>(null);

	const { data: transporterMaster = [], isFetching: transportersFetching } = useGetTransporterMasterQuery(
		selectedClient ? { client: selectedClient } : undefined,
		{ skip: !selectedClient },
	);

	useEffect(() => {
		if (!isError) return;
		toast.error(apiErrorMessage(error, "Could not load expenses."));
	}, [error, isError]);

	const rows = useMemo<ExpenseRecord[]>(
		() =>
			expenseData.map((expense) => {
				const expenseTypeId = masterId(expense.expenseType, expenseTypeMaster);
				return {
					client: masterId(expense.client, clientMaster),
					transporter: masterId(expense.transporter, transporterMaster),
					expenseFor: (expense.expenseFor as ExpenseFormValues["expenseFor"]) || "",
					vehicle: expense.vehicle ?? "",
					driver: expense.driver ?? "",
					expenseName: expense.expenseName ?? "",
					expenseType: expenseTypeId,
					expenseTypeName:
						expense.expenseTypeName ||
						expenseTypeMaster.find((option) => option.id === expenseTypeId)?.name ||
						"",
					amount: valueAsString(expense.amount),
					expenseDate: dateTimeInputValue(expense.expenseDate),
					odometer: valueAsString(expense.odometer),
					engineHours: valueAsString(expense.engineHours),
					description: expense.description ?? "",
					quantity: valueAsString(expense.quantity),
					supplier: expense.supplier ?? "",
					buyer: expense.buyer ?? "",
					id: expense.id,
					externalId: expense.externalId,
					vehicleNo: expense.vehicleNo ?? "",
					driverName: expense.driverName ?? "",
					tripName: expense.tripName ?? "",
					added: expense.createdAt ?? "",
					createdBy: expense.createdBy ?? "",
					updated: expense.updatedAt ?? "",
					documents: "",
				};
			}),
		[clientMaster, expenseData, expenseTypeMaster, transporterMaster],
	);
	const clients = clientMaster;
	const orderedColumns = useMemo(() => {
		const leadKeys = selectedExpenseFor ? expenseForLeadColumns[selectedExpenseFor] : [];
		const sn = columns.find((column) => column.key === "sn");
		const lead = leadKeys
			.map((key) => columns.find((column) => column.key === key))
			.filter((column): column is (typeof columns)[number] => Boolean(column));
		const rest = columns.filter((column) => column.key !== "sn" && !leadKeys.includes(column.key));
		return sn ? [sn, ...lead, ...rest] : [...lead, ...rest];
	}, [selectedExpenseFor]);
	const visibleColumns = orderedColumns.filter((column) => !hiddenColumns.includes(column.key));
	/** Filters are applied via `/expense/getAll` params; only text search stays client-side. */
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) => {
			const haystack = [
				row.vehicleNo,
				row.driverName,
				row.tripName,
				row.expenseTypeName,
				row.expenseName,
				row.amount,
				row.supplier,
				row.buyer,
				row.description,
				row.createdBy,
			]
				.join(" ")
				.toLowerCase();
			return haystack.includes(query);
		});
	}, [rows, search]);
	const totalExpense = filteredRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);
	const visibleClients = clients.filter((option) => option.name.toLowerCase().includes(clientQuery.trim().toLowerCase()));
	const visibleTransporters = transporterMaster.filter((option) =>
		option.name.toLowerCase().includes(transporterQuery.trim().toLowerCase()),
	);
	const visibleExpenseForOptions = expenseForOptions
		.map((option) => ({ id: option.value, name: option.label }))
		.filter((option) => option.name.toLowerCase().includes(expenseForQuery.trim().toLowerCase()));

	const vehicleOptions = useMemo(() => {
		if (!selectedTransporter) return [];
		return vehicleMaster.filter((item) => {
			const clientOk = !selectedClient || !item.clientId || item.clientId === selectedClient;
			return clientOk && item.transporterId === selectedTransporter;
		});
	}, [selectedClient, selectedTransporter, vehicleMaster]);

	const driverOptions = useMemo<MasterOption[]>(
		() =>
			driverDetails
				.filter((driver) => {
					if (selectedClient && driver.client && driver.client !== selectedClient) return false;
					if (selectedTransporter && driver.transporter && driver.transporter !== selectedTransporter) return false;
					return true;
				})
				.map((driver) => ({
					id: driver.externalId,
					externalId: driver.externalId,
					name: `${driver.firstName} ${driver.lastName}`.trim() || driver.externalId,
				})),
		[driverDetails, selectedClient, selectedTransporter],
	);

	const tripOptions = useMemo(() => {
		const names = rows.map((row) => row.tripName).filter(Boolean);
		return [...new Set(names)].sort((a, b) => a.localeCompare(b)).map((name) => ({ id: name, name }));
	}, [rows]);

	const entityOptions = useMemo(() => {
		if (selectedExpenseFor === ExpenseFor.DRIVER_WISE) return driverOptions;
		if (selectedExpenseFor === ExpenseFor.TRIP_WISE) return tripOptions;
		return [];
	}, [driverOptions, selectedExpenseFor, tripOptions]);

	const visibleEntities = entityOptions.filter((option) =>
		option.name.toLowerCase().includes(entityQuery.trim().toLowerCase()),
	);

	const entityPlaceholder =
		selectedExpenseFor === ExpenseFor.DRIVER_WISE
			? "Select Driver"
			: selectedExpenseFor === ExpenseFor.TRIP_WISE
				? "Select Trip"
				: "Select";

	const showVehicleFilter = selectedExpenseFor === ExpenseFor.VEHICLE_WISE;
	const showEntityFilter =
		selectedExpenseFor === ExpenseFor.DRIVER_WISE || selectedExpenseFor === ExpenseFor.TRIP_WISE;

	useEffect(() => {
		if (!openMenu) return;
		const onPointer = (event: MouseEvent) => {
			const target = event.target as Node;
			const menuRef =
				openMenu === "client"
					? clientRef
					: openMenu === "transporter"
						? transporterRef
						: openMenu === "expenseFor"
							? expenseForRef
							: entityRef;
			if (!menuRef.current?.contains(target)) setOpenMenu(null);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpenMenu(null);
		};
		document.addEventListener("mousedown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [openMenu]);

	useEffect(() => {
		if (!selectedTransporter) return;
		if (transporterMaster.some((item) => item.id === selectedTransporter)) return;
		setSelectedTransporter("");
		setSelectedExpenseFor("");
		setSelectedEntity("");
		setSelectedVehicles([]);
	}, [selectedTransporter, transporterMaster]);

	useEffect(() => {
		if (!selectedEntity) return;
		if (entityOptions.some((item) => item.id === selectedEntity)) return;
		setSelectedEntity("");
	}, [entityOptions, selectedEntity]);

	useEffect(() => {
		if (selectedVehicles.length === 0) return;
		const allowed = new Set(vehicleOptions.map((option) => option.id));
		const next = selectedVehicles.filter((id) => allowed.has(id));
		if (next.length !== selectedVehicles.length) setSelectedVehicles(next);
	}, [selectedVehicles, vehicleOptions]);

	const onClientChange = (next: string) => {
		setSelectedClient(next);
		setSelectedTransporter("");
		setSelectedExpenseFor("");
		setSelectedEntity("");
		setSelectedVehicles([]);
		setOpenMenu(null);
		setClientQuery("");
	};

	const onTransporterChange = (next: string) => {
		setSelectedTransporter(next);
		setSelectedExpenseFor("");
		setSelectedEntity("");
		setSelectedVehicles([]);
		setOpenMenu(null);
		setTransporterQuery("");
	};

	const onExpenseForChange = (next: string) => {
		setSelectedExpenseFor((next as ExpenseFor) || "");
		setSelectedEntity("");
		setSelectedVehicles([]);
		setOpenMenu(null);
		setExpenseForQuery("");
	};

	const buildListParams = (): ExpenseListParams => {
		const vehicleParam =
			selectedExpenseFor === ExpenseFor.VEHICLE_WISE && selectedVehicles.length > 0
				? selectedVehicles.join(",")
				: "";
		const driverId = selectedExpenseFor === ExpenseFor.DRIVER_WISE ? selectedEntity : "";
		const tripId = selectedExpenseFor === ExpenseFor.TRIP_WISE ? selectedEntity : "";
		return {
			...(selectedClient ? { client: selectedClient } : {}),
			...(selectedTransporter ? { transporter: selectedTransporter } : {}),
			...(selectedExpenseFor ? { expenseFor: selectedExpenseFor } : {}),
			...(vehicleParam ? { vehicle: vehicleParam } : {}),
			...(driverId ? { driver: driverId } : {}),
			...(tripId ? { trip: tripId } : {}),
			...(from ? { from: toIsoExpenseDate(from) } : {}),
			...(to ? { to: toIsoExpenseDate(to) } : {}),
		};
	};

	const applyFilters = () => {
		setListParams(buildListParams());
		setOpenMenu(null);
		setPage(0);
	};

	const saveExpense = async (values: ExpenseFormValues) => {
		const body = buildExpensePayload(values);
		try {
			if (editing) {
				await updateExpense({ externalId: editing.externalId, body }).unwrap();
				toast.success("Expense updated.");
			} else {
				await createExpense(body).unwrap();
				toast.success("Expense added.");
			}
			setSearch("");
			setPage(0);
			setEditing(null);
			setShowForm(false);
		} catch (error) {
			toast.error(apiErrorMessage(error, `Could not ${editing ? "update" : "add"} the expense.`));
		}
	};

	const editExpense = async (row: ExpenseRecord) => {
		try {
			const expense = await getExpenseById(row.externalId).unwrap();
			setEditing({
				...row,
				client: masterId(expense.client, clientMaster),
				transporter: masterId(expense.transporter, transporterMaster),
				expenseFor: (expense.expenseFor as ExpenseFormValues["expenseFor"]) || row.expenseFor || "",
				vehicle: expense.vehicle || row.vehicle || "",
				driver: expense.driver || row.driver || "",
				expenseName: expense.expenseName ?? "",
				expenseType: masterId(expense.expenseType, expenseTypeMaster),
				expenseTypeName: expense.expenseTypeName || expenseTypeMaster.find((option) => option.id === expense.expenseType)?.name || "",
				amount: valueAsString(expense.amount),
				expenseDate: dateTimeInputValue(expense.expenseDate),
				odometer: valueAsString(expense.odometer),
				engineHours: valueAsString(expense.engineHours),
				description: expense.description ?? "",
				quantity: valueAsString(expense.quantity),
				supplier: expense.supplier ?? "",
				buyer: expense.buyer ?? "",
			});
			setShowForm(true);
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not load the expense."));
		}
	};

	const confirmDelete = async () => {
		if (!pendingDelete) return;
		try {
			await deleteExpense(pendingDelete.externalId).unwrap();
			toast.success("Expense deleted.");
			setPendingDelete(null);
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not delete the expense."));
		}
	};

	const menuClass = `absolute left-0 top-12 z-40 w-full min-w-[220px] overflow-hidden rounded-xl border shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`;

	const singleSelect = (
		kind: MenuKind,
		ref: RefObject<HTMLDivElement | null>,
		emptyLabel: string,
		selected: string,
		setSelected: (next: string) => void,
		options: { id: string; name: string }[],
		query: string,
		setQuery: (value: string) => void,
		disabled = false,
	) => (
		<div ref={ref} className="relative min-w-0 flex-1 sm:max-w-[220px]">
			<button
				type="button"
				aria-expanded={openMenu === kind}
				aria-haspopup="listbox"
				aria-label={emptyLabel}
				disabled={disabled}
				onClick={() => {
					if (disabled) return;
					setOpenMenu((current) => (current === kind ? null : kind));
				}}
				className={`flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-xs outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400"}`}
			>
				<span className={`truncate ${selected ? "" : isDark ? "text-slate-500" : "text-slate-400"}`}>
					{selected
						? optionLabel(
								selected,
								options.length ? options : expenseForOptions.map((o) => ({ id: o.value, name: o.label })),
								selected,
							)
						: emptyLabel}
				</span>
				<ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${openMenu === kind ? "rotate-180" : ""}`} />
			</button>
			{openMenu === kind && !disabled && (
				<div className={menuClass}>
					<div className="p-2">
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							aria-label={`Search ${emptyLabel}`}
							autoFocus
							className={`h-9 w-full rounded-md border px-3 text-xs outline-none ${isDark ? "border-white/[0.10] bg-[#03091c]/70 text-white focus:border-cyan-300/35" : "border-slate-200 bg-white text-slate-900 focus:border-cyan-400"}`}
						/>
					</div>
					<ul role="listbox" aria-label={emptyLabel} className="max-h-48 overflow-y-auto p-1">
						{options.map((option) => {
							const isSelected = selected === option.id;
							return (
								<li key={option.id}>
									<button
										type="button"
										role="option"
										aria-selected={isSelected}
										onClick={() => {
											setSelected(option.id);
											setOpenMenu(null);
											setQuery("");
										}}
										className={`w-full rounded-md px-2.5 py-2 text-left text-xs ${
											isSelected
												? isDark
													? "bg-cyan-300/[0.16] text-cyan-50"
													: "bg-cyan-50 text-cyan-800"
												: isDark
													? "text-slate-300 hover:bg-white/[0.04]"
													: "text-slate-700 hover:bg-slate-100"
										}`}
									>
										{typeof option.name === "string" ? option.name : String(option.name ?? "")}
									</button>
								</li>
							);
						})}
						{options.length === 0 && <li className="px-2 py-3 text-center text-[11px] text-slate-500">Nothing found</li>}
					</ul>
				</div>
			)}
		</div>
	);

	const cell = (key: ColumnKey, row: ExpenseRecord, serial: number) => {
		if (key === "sn") return String(serial).padStart(2, "0");
		if (key === "vehicleNo" || key === "driverName" || key === "tripName") {
			const value = row[key];
			const isLead =
				(selectedExpenseFor === ExpenseFor.VEHICLE_WISE && key === "vehicleNo") ||
				(selectedExpenseFor === ExpenseFor.DRIVER_WISE && key === "driverName") ||
				(selectedExpenseFor === ExpenseFor.TRIP_WISE && key === "tripName");
			return (
				<span className={isLead ? `font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}` : undefined}>
					{textValue(value)}
				</span>
			);
		}
		if (key === "expenseType" || key === "expenseName") {
			const value = key === "expenseType"
				? row.expenseTypeName || expenseTypeMaster.find((option) => option.id === row.expenseType)?.name || row.expenseType
				: row.expenseName;
			return <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{textValue(value)}</span>;
		}
		if (key === "expenseDate" || key === "added" || key === "updated") return formatDateTime(row[key]);
		if (key === "edit") {
			return (
				<button type="button" onClick={() => void editExpense(row)} className={`h-7 rounded-md border px-3 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
					Edit
				</button>
			);
		}
		if (key === "delete") {
			return (
				<button type="button" onClick={() => setPendingDelete(row)} disabled={isDeleting && pendingDelete?.externalId === row.externalId} aria-label={`Delete expense ${row.expenseName || row.externalId}`} className={`rounded-md p-1.5 transition disabled:opacity-50 ${isDark ? "text-slate-400 hover:bg-rose-400/[0.10] hover:text-rose-200" : "text-slate-500 hover:bg-rose-50 hover:text-rose-600"}`}>
					<Trash2 className="h-3.5 w-3.5" />
				</button>
			);
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
							<Activity className="h-3.5 w-3.5" /> Reports
						</p>
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Expense Report</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{rows.length} expenses</p>
					</div>
					<button
						type="button"
						onClick={() => {
							const range = todayRange();
							setSearch("");
							setSelectedClient("");
							setSelectedTransporter("");
							setSelectedExpenseFor("");
							setSelectedEntity("");
							setSelectedVehicles([]);
							setFrom(range.from);
							setTo(range.to);
							setListParams(undefined);
							setClientQuery("");
							setTransporterQuery("");
							setExpenseForQuery("");
							setEntityQuery("");
							setOpenMenu(null);
							setPage(0);
							void refetch();
						}}
						aria-label="Refresh expenses"
						title="Refresh expenses"
						className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section className={`mb-4 rounded-xl border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-4 ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}>
					<div className="flex flex-col gap-2 xl:flex-row xl:items-center">
						{singleSelect("client", clientRef, "Select Client", selectedClient, onClientChange, visibleClients, clientQuery, setClientQuery)}
						{singleSelect(
							"transporter",
							transporterRef,
							!selectedClient
								? "Select Transporter"
								: transportersFetching
									? "Loading transporters…"
									: transporterMaster.length === 0
										? "No transporters"
										: "Select Transporter",
							selectedTransporter,
							onTransporterChange,
							visibleTransporters,
							transporterQuery,
							setTransporterQuery,
							!selectedClient || transportersFetching,
						)}
						{singleSelect(
							"expenseFor",
							expenseForRef,
							"Select",
							selectedExpenseFor,
							onExpenseForChange,
							visibleExpenseForOptions,
							expenseForQuery,
							setExpenseForQuery,
							!selectedTransporter,
						)}
						{showVehicleFilter && (
							<VehicleMultiSelect
								id="expense-report-vehicle"
								options={vehicleOptions}
								values={selectedVehicles}
								onValuesChange={setSelectedVehicles}
								disabled={!selectedTransporter}
								placeholder={
									!selectedTransporter
										? "Select Vehicle"
										: vehicleOptions.length === 0
											? "No vehicles"
											: "Select Vehicle"
								}
								emptyText="No vehicles"
								isDark={isDark}
								compact
							/>
						)}
						{showEntityFilter &&
							singleSelect(
								"entity",
								entityRef,
								!selectedTransporter
									? entityPlaceholder
									: entityOptions.length === 0
										? `No ${entityPlaceholder.replace("Select ", "").toLowerCase()}s`
										: entityPlaceholder,
								selectedEntity,
								(next) => {
									setSelectedEntity(next);
									setOpenMenu(null);
									setEntityQuery("");
								},
								visibleEntities,
								entityQuery,
								setEntityQuery,
								!selectedTransporter,
							)}
						<div className={`flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border px-2 sm:max-w-[360px] ${isDark ? "border-white/[0.08] bg-[#03091c]/65" : "border-slate-200 bg-white"}`}>
							<input type="datetime-local" aria-label="From date" value={from} onChange={(event) => setFrom(event.target.value)} className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
							<span className="text-slate-500">-</span>
							<input type="datetime-local" aria-label="To date" value={to} onChange={(event) => setTo(event.target.value)} className={`h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none ${isDark ? "text-slate-300 [color-scheme:dark]" : "text-slate-700"}`} />
						</div>
						<button type="button" onClick={applyFilters} className={`h-10 rounded-lg border px-5 text-[12px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
							Search
						</button>
					</div>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search" aria-label="Search expense" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
							{search && (
								<button type="button" onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<details ref={columnVisibilityRef} className="relative">
								<summary className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Column Visibility
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div className={`absolute right-0 top-11 z-30 max-h-52 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
									{orderedColumns.map((column) => (
										<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
											<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => setHiddenColumns((current) => (current.includes(column.key) ? current.filter((item) => item !== column.key) : [...current, column.key]))} className="h-3.5 w-3.5 accent-cyan-300" />
											{column.label}
										</label>
									))}
								</div>
							</details>
							<button type="button" onClick={() => { setEditing(null); setShowForm(true); }} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
								<Plus className="h-3.5 w-3.5" /> Add
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1800px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => <th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">{column.label}</th>)}
								</tr>
							</thead>
							<tbody>
								{(isLoading || isFetching) && pageRows.length === 0 && (
									<tr>
										<td colSpan={Math.max(visibleColumns.length, 1)} className="px-6 py-16 text-center text-sm text-slate-500">
											Loading expenses…
										</td>
									</tr>
								)}
								{isError && pageRows.length === 0 && !isFetching && (
									<tr>
										<td colSpan={Math.max(visibleColumns.length, 1)} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-rose-300" : "text-rose-600"}`}>Could not load expenses.</p>
											<button
												type="button"
												onClick={() => void refetch()}
												className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${isDark ? "border-white/[0.08] text-slate-300 hover:bg-white/[0.05]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
											>
												<RefreshCw className="h-3.5 w-3.5" />
												Retry
											</button>
										</td>
									</tr>
								)}
								{pageRows.map((row, index) => (
									<tr key={row.externalId || String(row.id)} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => <td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">{cell(column.key, row, safePage * pageSize + index + 1)}</td>)}
									</tr>
								))}
								{!isLoading && !isFetching && !isError && pageRows.length === 0 && (
									<tr>
										<td colSpan={Math.max(visibleColumns.length, 1)} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No expenses available</p>
											<p className="mt-1 text-xs text-slate-500">Try Search without date filters, or add an expense.</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<div className={`border-t px-4 py-3 text-[12px] font-medium ${isDark ? "border-white/[0.07] text-slate-200" : "border-slate-200 text-slate-700"}`}>
						Total Expense : {totalExpense}
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} expenses
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

			<DeleteConfirmDialog
				isDark={isDark}
				open={Boolean(pendingDelete)}
				title="Delete expense?"
				entityName={
					pendingDelete?.expenseName ||
					pendingDelete?.expenseTypeName ||
					pendingDelete?.vehicleNo ||
					"this expense"
				}
				isSubmitting={isDeleting}
				onCancel={() => setPendingDelete(null)}
				onConfirm={() => void confirmDelete()}
				titleId="expense-delete-title"
			/>

			{showForm && (
				<AddExpense
					initial={editing}
					isSaving={isCreating || isUpdating}
					onClose={() => { setShowForm(false); setEditing(null); }}
					onSubmit={saveExpense}
				/>
			)}
		</div>
	);
}
