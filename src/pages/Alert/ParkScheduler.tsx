import { useMemo, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { ArrowUpDown, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { AlertModal } from "@/components/Alert/AlertModal";
import { EmptyTableRow, TableFooter } from "@/components/Alert/AlertTable";
import {
	cardClass,
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
import { useGetClientMasterQuery, useGetTransporterMasterQuery, useGetVehicleMasterQuery } from "@/store/services/api/Master";
import { useAuth } from "@/contexts/AuthContext";

type ParkedRow = {
	id: number;
	transporter: string;
	vehicles: string;
	scheduled: string;
	parkedStartDate: string;
	parkedEndDate: string;
	startTime: string;
	endTime: string;
};

type ColumnKey = keyof Omit<ParkedRow, "id">;

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "transporter", label: "Transporter" },
	{ key: "vehicles", label: "Vehicle(s)" },
	{ key: "scheduled", label: "Scheduled" },
	{ key: "parkedStartDate", label: "Parked Start Date" },
	{ key: "parkedEndDate", label: "Parked End Date" },
	{ key: "startTime", label: "Start Time" },
	{ key: "endTime", label: "End Time" },
];

const schedules = ["Daily", "Weekly", "Monthly"];

const emptyForm = {
	client: "",
	transporter: "",
	vehicle: "",
	scheduled: "Daily",
	from: "00:00",
	till: "00:00",
};

export default function ParkScheduler() {
	const { data: clientMaster = [] } = useGetClientMasterQuery();
	const clients = clientMaster.map((client) => client.name);
	const { data: transporterMaster = [] } = useGetTransporterMasterQuery();
	const transporters = transporterMaster.map((transporter) => transporter.name);
	const { data: vehicles = [] } = useGetVehicleMasterQuery();
	const vehicleOptions = vehicles.map((vehicle) => vehicle.name);
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [rows, setRows] = useState<ParkedRow[]>([]);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [sortKey, setSortKey] = useState<ColumnKey>("transporter");
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

	const saveSchedule = () => {
		if (!form.client || !form.transporter || !form.vehicle || !form.scheduled || !form.from || !form.till) {
			toast.error("Please fill all required fields.");
			return;
		}
		setRows((current) => [
			{
				id: Date.now(),
				transporter: form.transporter,
				vehicles: form.vehicle,
				scheduled: form.scheduled,
				parkedStartDate: "—",
				parkedEndDate: "—",
				startTime: form.from,
				endTime: form.till,
			},
			...current,
		]);
		setForm(emptyForm);
		setFormOpen(false);
		setPage(0);
		toast.success("Parked schedule saved.");
	};

	const field = (id: string, label: string, control: ReactNode) => (
		<div>
			<label htmlFor={id} className={labelClass(isDark)}>
				{label} <span className="text-rose-400">*</span>
			</label>
			{control}
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
							<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Parked Scheduler</h1>
							<span className={`rounded-full border px-2.5 py-1 text-[10px] ${isDark ? "border-white/[0.08] bg-white/[0.04] text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>{rows.length} records</span>
						</div>
					</div>
					<button type="button" onClick={() => window.location.reload()} aria-label="Refresh parked schedules" className={refreshButtonClass(isDark)}>
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
								placeholder="Search transporter, vehicle..."
								aria-label="Search parked schedules"
								className={searchInputClass(isDark)}
							/>
						</label>
						<button type="button" onClick={() => { setForm(emptyForm); setFormOpen(true); }} className={primaryButtonClass(isDark)}>
							<Plus className="h-3.5 w-3.5" /> Add Schedule
						</button>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[980px] border-collapse text-left">
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
										title={rows.length === 0 ? "No parked schedules yet" : "No schedules match your search"}
										hint={rows.length === 0 ? "Click “Add Schedule” to create one." : undefined}
									/>
								) : (
									pageRows.map((row) => (
										<tr key={row.id} className={tableRowClass(isDark)}>
											{columns.map((column) => (
												<td key={column.key} className="whitespace-nowrap px-4 py-3">{row[column.key] || "—"}</td>
											))}
											<td className="px-4 py-2.5 text-center">
												<button type="button" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} className={rowActionClass(isDark, "rose")}>
													Delete
												</button>
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
					title="Parked Schedule"
					onClose={() => setFormOpen(false)}
					onSubmit={saveSchedule}
					footer={
						<>
							<button type="button" onClick={() => setForm(emptyForm)} className={secondaryButtonClass(isDark)}>Reset</button>
							<button type="submit" className={primaryButtonClass(isDark)}>Save</button>
						</>
					}
				>
					<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
						{field("park-client", "Client", (
							<select id="park-client" value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} className={inputClass(isDark)}>
								<option value="">Select Client</option>
								{clients.map((name) => <option key={name} value={name}>{name}</option>)}
							</select>
						))}
						{field("park-transporter", "Transporter", (
							<select id="park-transporter" value={form.transporter} onChange={(event) => setForm({ ...form, transporter: event.target.value })} className={inputClass(isDark)}>
								<option value="">Select Transporter</option>
								{transporters.map((name) => <option key={name} value={name}>{name}</option>)}
							</select>
						))}
						{field("park-vehicle", "Vehicle", (
							<select id="park-vehicle" value={form.vehicle} onChange={(event) => setForm({ ...form, vehicle: event.target.value })} className={inputClass(isDark)}>
								<option value="">Select Vehicle</option>
								{vehicleOptions.map((name) => <option key={name} value={name}>{name}</option>)}
							</select>
						))}
						{field("park-scheduled", "Scheduled", (
							<select id="park-scheduled" value={form.scheduled} onChange={(event) => setForm({ ...form, scheduled: event.target.value })} className={inputClass(isDark)}>
								{schedules.map((name) => <option key={name} value={name}>{name}</option>)}
							</select>
						))}
						{field("park-from", "Scheduled From", (
							<input id="park-from" type="time" value={form.from} onChange={(event) => setForm({ ...form, from: event.target.value })} className={inputClass(isDark)} />
						))}
						{field("park-till", "Scheduled Till", (
							<input id="park-till" type="time" value={form.till} onChange={(event) => setForm({ ...form, till: event.target.value })} className={inputClass(isDark)} />
						))}
					</div>
				</AlertModal>
			)}
		</div>
	);
}
