import { useMemo, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { ArrowUpDown, ChevronDown, Columns3, Plus, RefreshCw, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { AlertModal } from "@/components/Alert/AlertModal";
import { EmptyTableRow, TableFooter } from "@/components/Alert/AlertTable";
import {
	cardClass,
	checkboxClass,
	dangerButtonClass,
	filterCardClass,
	inputClass,
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
import { useGetClientMasterQuery, useGetTransporterMasterQuery, useGetVehicleMasterQuery } from "@/store/services/api/Master";
import { useAuth } from "@/contexts/AuthContext";

type ServiceRow = {
	id: number;
	vehicleNo: string;
	serviceName: string;
	odometerInterval: string;
	lastServiceOdometer: string;
	nextServiceDueOdometer: string;
	currentOdometer: string;
	kmLeft: string;
	odometerLeft: string;
	engineHoursInterval: string;
	lastServiceEngineHour: string;
	nextServiceDueEngineHour: string;
	engineHourLeft: string;
	daysInterval: string;
	lastServiceOn: string;
	nextServiceDueOn: string;
	daysLeftForNext: string;
	daysLeft: string;
	updateRecord: string;
	remark: string;
	uploadDoc: string;
	clone: string;
	client: string;
	transporter: string;
};

type ColumnKey = Exclude<keyof ServiceRow, "id" | "client" | "transporter">;

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "vehicleNo", label: "Vehicle No." },
	{ key: "serviceName", label: "Service Name" },
	{ key: "odometerInterval", label: "Odometer Interval" },
	{ key: "lastServiceOdometer", label: "Last Service Odometer" },
	{ key: "nextServiceDueOdometer", label: "Next Service Due On Odometer" },
	{ key: "currentOdometer", label: "Current Odometer" },
	{ key: "kmLeft", label: "KM Left for Next Service" },
	{ key: "odometerLeft", label: "Odometer Left" },
	{ key: "engineHoursInterval", label: "Engine Hours Interval" },
	{ key: "lastServiceEngineHour", label: "Last Service Engine Hour" },
	{ key: "nextServiceDueEngineHour", label: "Next Service Due On Engine Hour" },
	{ key: "engineHourLeft", label: "Engine Hour Left" },
	{ key: "daysInterval", label: "Days Interval" },
	{ key: "lastServiceOn", label: "Last Service On" },
	{ key: "nextServiceDueOn", label: "Next Service Due On" },
	{ key: "daysLeftForNext", label: "Days Left for Next Service" },
	{ key: "daysLeft", label: "Days Left" },
	{ key: "updateRecord", label: "Update Record" },
	{ key: "remark", label: "Remark" },
	{ key: "uploadDoc", label: "Upload Doc" },
	{ key: "clone", label: "Clone" },
];


const emptyForm = {
	serviceName: "",
	vehicleNo: "",
	remark: "",
	odometerEnabled: false,
	odometerInterval: "",
	lastServiceOdometer: "",
	engineEnabled: false,
	engineInterval: "",
	lastServiceEngine: "",
	daysEnabled: false,
	daysInterval: "",
	lastServiceDate: "",
	odometerLeftEnabled: false,
	odometerLeft: "",
	engineLeftEnabled: false,
	engineLeft: "",
	daysLeftEnabled: false,
	daysLeft: "",
	updateRecord: false,
	notifyMobile: false,
	documentName: "",
	visibleToDriver: false,
};

type FormState = typeof emptyForm;

export default function ServiceAndMaintenance() {
	const { data: clientMaster = [] } = useGetClientMasterQuery();
	const clients = clientMaster.map((client) => client.name);
	const { data: transporterMaster = [] } = useGetTransporterMasterQuery();
	const transporters = transporterMaster.map((transporter) => transporter.name);
	const { data: vehicles = [] } = useGetVehicleMasterQuery();
	const vehicleOptions = vehicles.map((vehicle) => vehicle.name);
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const fileRef = useRef<HTMLInputElement>(null);
	const bulkRef = useRef<HTMLInputElement>(null);
	const [rows, setRows] = useState<ServiceRow[]>([]);
	const [client, setClient] = useState("");
	const [transporter, setTransporter] = useState("");
	const [vehicle, setVehicle] = useState("");
	const [applied, setApplied] = useState({ client: "", transporter: "", vehicle: "" });
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showColumns, setShowColumns] = useState(false);
	const [sortKey, setSortKey] = useState<ColumnKey>("vehicleNo");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [formOpen, setFormOpen] = useState(false);
	const [form, setForm] = useState<FormState>(emptyForm);

	const pageSize = 10;
	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));

	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		const matched = rows.filter((row) => {
			const matchesFilters =
				(!applied.client || row.client === applied.client) &&
				(!applied.transporter || row.transporter === applied.transporter) &&
				(!applied.vehicle || row.vehicleNo === applied.vehicle);
			const matchesSearch = !query || Object.values(row).join(" ").toLowerCase().includes(query);
			return matchesFilters && matchesSearch;
		});
		return [...matched].sort((left, right) => {
			const result = left[sortKey].localeCompare(right[sortKey], undefined, { numeric: true });
			return sortDir === "asc" ? result : -result;
		});
	}, [rows, applied, search, sortKey, sortDir]);

	const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

	const fieldClass = (disabled = false) =>
		`h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
			disabled
				? isDark
					? "cursor-not-allowed border-white/[0.06] bg-white/[0.03] text-slate-600 placeholder:text-slate-600"
					: "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 placeholder:text-slate-400"
				: isDark
					? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 [color-scheme:dark]"
					: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400"
		}`;

	const labelClass = `text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;
	const sectionClass = `border-t pt-5 text-[13px] font-semibold ${isDark ? "border-white/[0.08] text-white" : "border-slate-200 text-slate-900"}`;

	const patch = (next: Partial<FormState>) => setForm((current) => ({ ...current, ...next }));

	const openForm = () => {
		setForm(emptyForm);
		if (fileRef.current) fileRef.current.value = "";
		setFormOpen(true);
	};

	const saveForm = () => {
		if (!form.serviceName.trim() || !form.vehicleNo) {
			toast.error("Service Name and Vehicle are required.");
			return;
		}
		setRows((current) => [
			{
				id: Date.now(),
				vehicleNo: form.vehicleNo,
				serviceName: form.serviceName.trim(),
				odometerInterval: form.odometerEnabled ? form.odometerInterval : "",
				lastServiceOdometer: form.odometerEnabled ? form.lastServiceOdometer : "",
				nextServiceDueOdometer: "",
				currentOdometer: "",
				kmLeft: "",
				odometerLeft: form.odometerLeftEnabled ? form.odometerLeft : "",
				engineHoursInterval: form.engineEnabled ? form.engineInterval : "",
				lastServiceEngineHour: form.engineEnabled ? form.lastServiceEngine : "",
				nextServiceDueEngineHour: "",
				engineHourLeft: form.engineLeftEnabled ? form.engineLeft : "",
				daysInterval: form.daysEnabled ? form.daysInterval : "",
				lastServiceOn: form.daysEnabled ? form.lastServiceDate : "",
				nextServiceDueOn: "",
				daysLeftForNext: "",
				daysLeft: form.daysLeftEnabled ? form.daysLeft : "",
				updateRecord: form.updateRecord ? "Yes" : "No",
				remark: form.remark,
				uploadDoc: form.documentName,
				clone: "Clone",
				client,
				transporter,
			},
			...current,
		]);
		setFormOpen(false);
		setPage(0);
		toast.success("Service saved.");
	};

	const sortBy = (key: ColumnKey) => {
		if (sortKey === key) setSortDir((current) => (current === "asc" ? "desc" : "asc"));
		else {
			setSortKey(key);
			setSortDir("asc");
		}
	};

	const checkField = (label: string, checked: boolean, onCheck: (checked: boolean) => void, control: ReactNode) => (
		<div>
			<label className={`flex items-center gap-2 ${labelClass}`}>
				<input type="checkbox" checked={checked} onChange={(event) => onCheck(event.target.checked)} className={checkboxClass} />
				{label}
			</label>
			<div className="mt-2">{control}</div>
		</div>
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
							<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Service & Maintenance</h1>
							<span className={`rounded-full border px-2.5 py-1 text-[10px] ${isDark ? "border-white/[0.08] bg-white/[0.04] text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>{rows.length} records</span>
						</div>
					</div>
					<button type="button" onClick={() => window.location.reload()} aria-label="Refresh services" className={refreshButtonClass(isDark)}>
						<RefreshCw className="h-4 w-4" />
					</button>
				</section>

				<section aria-label="Service filters" className={filterCardClass(isDark)}>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
						<label className="sr-only" htmlFor="service-client">Client</label>
						<select id="service-client" value={client} onChange={(event) => setClient(event.target.value)} className={inputClass(isDark)}>
							<option value="">Select Client</option>
							{clients.map((name) => <option key={name} value={name}>{name}</option>)}
						</select>
						<label className="sr-only" htmlFor="service-transporter">Transporter</label>
						<select id="service-transporter" value={transporter} onChange={(event) => setTransporter(event.target.value)} className={inputClass(isDark)}>
							<option value="">Select Transporter</option>
							{transporters.map((name) => <option key={name} value={name}>{name}</option>)}
						</select>
						<label className="sr-only" htmlFor="service-vehicle">Vehicle</label>
						<select id="service-vehicle" value={vehicle} onChange={(event) => setVehicle(event.target.value)} className={inputClass(isDark)}>
							<option value="">Select Vehicle</option>
							{vehicleOptions.map((name) => <option key={name} value={name}>{name}</option>)}
						</select>
						<button type="button" onClick={() => { setApplied({ client, transporter, vehicle }); setPage(0); }} className={primaryButtonClass(isDark)}>
							<Search className="h-3.5 w-3.5" /> Search
						</button>
					</div>
				</section>

				<section className={cardClass(isDark)}>
					<div className={toolbarClass(isDark)}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={searchIconClass(isDark)} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search vehicle, service..." aria-label="Search services" className={searchInputClass(isDark)} />
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative">
								<button type="button" onClick={() => setShowColumns((open) => !open)} aria-expanded={showColumns} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-medium ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
									<Columns3 className="h-3.5 w-3.5" /> Column Visibility <ChevronDown className="h-3 w-3" />
								</button>
								{showColumns && (
									<div className={`absolute right-0 z-30 mt-2 max-h-72 w-64 overflow-y-auto rounded-lg border p-2 shadow-xl ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
										{columns.map((column) => (
											<label key={column.key} className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.05]" : "text-slate-700 hover:bg-slate-50"}`}>
												<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => setHiddenColumns((current) => current.includes(column.key) ? current.filter((item) => item !== column.key) : [...current, column.key])} className="h-3.5 w-3.5 accent-cyan-400" />
												{column.label}
											</label>
										))}
									</div>
								)}
							</div>
							<button type="button" onClick={() => bulkRef.current?.click()} className={`${secondaryButtonClass(isDark)} h-9 text-[11px]`}>
								<Upload className="h-3.5 w-3.5" /> Bulk Upload
							</button>
							<input ref={bulkRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" aria-label="Bulk upload file" onChange={(event) => { if (event.target.files?.[0]) toast.success(`${event.target.files[0].name} selected.`); event.target.value = ""; }} />
							<button type="button" onClick={openForm} className={`${primaryButtonClass(isDark)} h-9 text-[11px]`}>
								<Plus className="h-3.5 w-3.5" /> Add Service
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[2200px] border-collapse text-left">
							<thead>
								<tr className={tableHeadRowClass(isDark)}>
									{visibleColumns.map((column) => (
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
										colSpan={visibleColumns.length + 1}
										title={rows.length === 0 ? "No services yet" : "No services match these filters"}
										hint={rows.length === 0 ? "Click “Add Service” to create one." : "Try clearing a filter or changing your search."}
									/>
								) : (
									pageRows.map((row) => (
										<tr key={row.id} className={tableRowClass(isDark)}>
											{visibleColumns.map((column) => (
												<td key={column.key} className="whitespace-nowrap px-4 py-3">{row[column.key] || "—"}</td>
											))}
											<td className="px-4 py-2.5">
												<div className="flex items-center justify-center gap-2">
													<button type="button" onClick={() => setRows((current) => [{ ...row, id: Date.now() }, ...current])} className={rowActionClass(isDark, "cyan")}>Clone</button>
													<button type="button" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} className={rowActionClass(isDark, "rose")}>Delete</button>
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
					title="Add Service"
					onClose={() => setFormOpen(false)}
					onSubmit={saveForm}
					footer={
						<>
							<button type="button" onClick={() => { setForm(emptyForm); if (fileRef.current) fileRef.current.value = ""; }} className={secondaryButtonClass(isDark)}>Reset</button>
							<button type="submit" className={primaryButtonClass(isDark)}>Save</button>
						</>
					}
				>
					<div className="space-y-6">
						<section>
							<h3 className={`mb-4 text-[13px] font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Service Info</h3>
							<div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
								<label className={labelClass}>
									<span className="mb-1.5 block">Service Name <span className="text-rose-400">*</span></span>
									<input value={form.serviceName} placeholder="Service Name" onChange={(event) => patch({ serviceName: event.target.value })} className={fieldClass()} />
								</label>
								<label className={labelClass}>
									<span className="mb-1.5 block">Vehicle <span className="text-rose-400">*</span></span>
									<select value={form.vehicleNo} onChange={(event) => patch({ vehicleNo: event.target.value })} className={fieldClass()}>
										<option value="">Select Vehicles</option>
										{vehicleOptions.map((name) => <option key={name} value={name}>{name}</option>)}
									</select>
								</label>
								<label className={labelClass}>
									<span className="mb-1.5 block">Remark</span>
									<input value={form.remark} placeholder="Remark" onChange={(event) => patch({ remark: event.target.value })} className={fieldClass()} />
								</label>
							</div>
						</section>

						<section>
							<h3 className={sectionClass}>Service Interval</h3>
							<div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
								{checkField("Odometer Interval", form.odometerEnabled, (checked) => patch({ odometerEnabled: checked, odometerInterval: checked ? form.odometerInterval : "", lastServiceOdometer: checked ? form.lastServiceOdometer : "" }), <input disabled={!form.odometerEnabled} value={form.odometerInterval} placeholder="Odometer Interval" onChange={(event) => patch({ odometerInterval: event.target.value })} className={fieldClass(!form.odometerEnabled)} />)}
								<label className={labelClass}>
									<span className="mb-1.5 block">Last Service Odometer</span>
									<input disabled={!form.odometerEnabled} value={form.lastServiceOdometer} placeholder="Last Service Odometer" onChange={(event) => patch({ lastServiceOdometer: event.target.value })} className={fieldClass(!form.odometerEnabled)} />
								</label>
								{checkField("Engine Interval", form.engineEnabled, (checked) => patch({ engineEnabled: checked, engineInterval: checked ? form.engineInterval : "", lastServiceEngine: checked ? form.lastServiceEngine : "" }), <input disabled={!form.engineEnabled} value={form.engineInterval} placeholder="Engine Interval" onChange={(event) => patch({ engineInterval: event.target.value })} className={fieldClass(!form.engineEnabled)} />)}
								<label className={labelClass}>
									<span className="mb-1.5 block">Last Service Engine</span>
									<input disabled={!form.engineEnabled} value={form.lastServiceEngine} placeholder="Last Service Engine" onChange={(event) => patch({ lastServiceEngine: event.target.value })} className={fieldClass(!form.engineEnabled)} />
								</label>
								{checkField("Days Interval", form.daysEnabled, (checked) => patch({ daysEnabled: checked, daysInterval: checked ? form.daysInterval : "", lastServiceDate: checked ? form.lastServiceDate : "" }), <input disabled={!form.daysEnabled} value={form.daysInterval} placeholder="Days Interval" onChange={(event) => patch({ daysInterval: event.target.value })} className={fieldClass(!form.daysEnabled)} />)}
								<label className={labelClass}>
									<span className="mb-1.5 block">Last Service Date</span>
									<input disabled={!form.daysEnabled} type="date" value={form.lastServiceDate} onChange={(event) => patch({ lastServiceDate: event.target.value })} className={fieldClass(!form.daysEnabled)} />
								</label>
							</div>
						</section>

						<section>
							<h3 className={sectionClass}>Service Trigger</h3>
							<div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
								{checkField("Odometer Left", form.odometerLeftEnabled, (checked) => patch({ odometerLeftEnabled: checked, odometerLeft: checked ? form.odometerLeft : "" }), <input disabled={!form.odometerLeftEnabled} value={form.odometerLeft} placeholder="Odometer Left" onChange={(event) => patch({ odometerLeft: event.target.value })} className={fieldClass(!form.odometerLeftEnabled)} />)}
								{checkField("Engine Left", form.engineLeftEnabled, (checked) => patch({ engineLeftEnabled: checked, engineLeft: checked ? form.engineLeft : "" }), <input disabled={!form.engineLeftEnabled} value={form.engineLeft} placeholder="Engine Left" onChange={(event) => patch({ engineLeft: event.target.value })} className={fieldClass(!form.engineLeftEnabled)} />)}
								{checkField("Days Left", form.daysLeftEnabled, (checked) => patch({ daysLeftEnabled: checked, daysLeft: checked ? form.daysLeft : "" }), <input disabled={!form.daysLeftEnabled} value={form.daysLeft} placeholder="Days Left" onChange={(event) => patch({ daysLeft: event.target.value })} className={fieldClass(!form.daysLeftEnabled)} />)}
								<label className={`flex items-center gap-2 self-start pt-1 ${labelClass}`}>
									<input type="checkbox" checked={form.updateRecord} onChange={(event) => patch({ updateRecord: event.target.checked })} className={checkboxClass} />
									Update Record
								</label>
							</div>
						</section>

						<section>
							<h3 className={sectionClass}>Service Notifications</h3>
							<label className={`mt-4 flex items-center gap-2 ${labelClass}`}>
								<input type="checkbox" checked={form.notifyMobile} onChange={(event) => patch({ notifyMobile: event.target.checked })} className={checkboxClass} />
								Mobile
							</label>
						</section>

						<section>
							<h3 className={sectionClass}>Service Documents</h3>
							<label className={`mt-4 block ${labelClass}`}>
								<span className="mb-1.5 block">Upload Document <span className="font-normal text-slate-500">(Optional)</span></span>
								<span className="flex flex-wrap items-center gap-3">
									<input ref={fileRef} type="file" aria-label="Upload Document" onChange={(event) => patch({ documentName: event.target.files?.[0]?.name ?? "" })} className={`h-10 min-w-[240px] flex-1 rounded-lg border px-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-transparent file:text-xs file:font-medium ${isDark ? "border-white/[0.09] bg-[#03091c]/70 text-slate-400 file:text-slate-200" : "border-slate-200 bg-white text-slate-600 file:text-slate-700"}`} />
									<button type="button" onClick={() => { patch({ documentName: "" }); if (fileRef.current) fileRef.current.value = ""; }} className={dangerButtonClass(isDark)}>Delete</button>
									<label className="flex items-center gap-2">
										<input type="checkbox" checked={form.visibleToDriver} onChange={(event) => patch({ visibleToDriver: event.target.checked })} className={checkboxClass} />
										Allow visibility to driver
									</label>
								</span>
							</label>
						</section>
					</div>
				</AlertModal>
			)}
		</div>
	);
}
