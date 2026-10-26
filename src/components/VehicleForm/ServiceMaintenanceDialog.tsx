import { useEffect, useId, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

export type ServiceRecord = {
	id: number;
	vehicleNo: string;
	serviceName: string;
	odometerInterval: string;
	lastServiceOdometer: string;
	nextServiceDueOdometer: string;
	currentOdometer: string;
	kmLeftForNextService: string;
	odometerLeft: string;
	engineHoursInterval: string;
	lastServiceEngineHour: string;
	nextServiceDueEngineHour: string;
	engineHourLeft: string;
	daysInterval: string;
	lastServiceOn: string;
	nextServiceDueOn: string;
	daysLeftForNextService: string;
	daysLeft: string;
	remark: string;
	documentName: string;
};

type ServiceMaintenanceDialogProps = {
	vehicleNo: string;
	records: ServiceRecord[];
	onClose: () => void;
};

const columns: { key: keyof ServiceRecord | "update" | "upload" | "clone"; label: string }[] = [
	{ key: "vehicleNo", label: "Vehicle No." },
	{ key: "serviceName", label: "Service Name" },
	{ key: "odometerInterval", label: "Odometer Interval" },
	{ key: "lastServiceOdometer", label: "Last Service Odometer" },
	{ key: "nextServiceDueOdometer", label: "Next Service Due On Odometer" },
	{ key: "currentOdometer", label: "Current Odometer" },
	{ key: "kmLeftForNextService", label: "KM Left for Next Service" },
	{ key: "odometerLeft", label: "Odometer Left" },
	{ key: "engineHoursInterval", label: "Engine Hours Interval" },
	{ key: "lastServiceEngineHour", label: "Last Service Engine Hour" },
	{ key: "nextServiceDueEngineHour", label: "Next Service Due On Engine Hour" },
	{ key: "engineHourLeft", label: "Engine Hour Left" },
	{ key: "daysInterval", label: "Days Interval" },
	{ key: "lastServiceOn", label: "Last Service On" },
	{ key: "nextServiceDueOn", label: "Next Service Due On" },
	{ key: "daysLeftForNextService", label: "Days Left for Next Service" },
	{ key: "daysLeft", label: "Days Left" },
	{ key: "update", label: "Update Record" },
	{ key: "remark", label: "Remark" },
	{ key: "upload", label: "Upload Doc" },
	{ key: "clone", label: "Clone" },
];

const dateKeys = new Set<keyof ServiceRecord>(["lastServiceOn", "nextServiceDueOn"]);

const formatDate = (value: string) => {
	if (!value) return "—";
	const [year, month, day] = value.split("-");
	if (!year || !month || !day) return value;
	return `${day}/${month}/${year}`;
};

export function ServiceMaintenanceDialog({ vehicleNo, records, onClose }: ServiceMaintenanceDialogProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const [pageSize, setPageSize] = useState(25);
	const [page, setPage] = useState(0);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = useMemo(
		() => records.slice(safePage * pageSize, (safePage + 1) * pageSize),
		[records, safePage, pageSize],
	);
	const rangeStart = records.length === 0 ? 0 : safePage * pageSize + 1;
	const rangeEnd = Math.min((safePage + 1) * pageSize, records.length);

	const cellText = (key: keyof ServiceRecord, row: ServiceRecord) => {
		const value = row[key];
		if (value === "" || value === undefined) return "—";
		return dateKeys.has(key) ? formatDate(String(value)) : String(value);
	};

	const actionClass = `h-7 rounded-md border px-2.5 text-[11px] font-semibold transition ${
		isDark
			? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]"
			: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
	}`;

	return (
		<div
			className={`fixed inset-0 z-[800] flex items-center justify-center p-2 backdrop-blur-sm sm:p-4 ${isDark ? "bg-[#020718]/80" : "bg-slate-900/50"}`}
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<section
				aria-labelledby={titleId}
				className={`flex max-h-[96vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
			>
				<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
					<div>
						<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>{vehicleNo}</p>
						<h2 id={titleId} className="text-[15px] font-semibold">Service And Maintenance</h2>
					</div>
					<button type="button" onClick={onClose} aria-label="Close service and maintenance" className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
						<X className="h-5 w-5 stroke-[3]" />
					</button>
				</header>

				<div className={`flex shrink-0 items-center justify-end gap-2 px-5 py-3 text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
					<span>Show</span>
					<div className="relative">
						<select
							aria-label="Show entries"
							value={pageSize}
							onChange={(event) => {
								setPageSize(Number(event.target.value));
								setPage(0);
							}}
							className={`h-8 appearance-none rounded-lg border pl-2.5 pr-7 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/70 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
						>
							{[10, 25, 50].map((size) => (
								<option key={size} value={size}>{size}</option>
							))}
						</select>
						<ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
					</div>
					<span>entries</span>
				</div>

				<div className="min-h-0 flex-1 overflow-auto px-5">
					<table className="w-full min-w-[2400px] border-collapse text-left">
						<thead>
							<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
								{columns.map((column) => (
									<th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium">{column.label}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{pageRows.map((row) => (
								<tr key={row.id} className={`border-b text-[11px] last:border-0 ${isDark ? "border-white/[0.055] text-slate-300" : "border-slate-200 text-slate-700"}`}>
									{columns.map((column) => (
										<td key={column.key} className="whitespace-nowrap px-3 py-3">
											{column.key === "vehicleNo" ? (
												<span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{row.vehicleNo}</span>
											) : column.key === "update" ? (
												<button type="button" className={actionClass}>Update</button>
											) : column.key === "upload" ? (
												<button type="button" className={actionClass}>Upload</button>
											) : column.key === "clone" ? (
												<button type="button" className={actionClass}>Clone</button>
											) : (
												cellText(column.key, row)
											)}
										</td>
									))}
								</tr>
							))}
							{pageRows.length === 0 && (
								<tr>
									<td colSpan={columns.length} className="px-6 py-10 text-center text-xs text-slate-500">
										No data available
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				<footer className={`flex shrink-0 flex-col gap-3 border-t px-5 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.08] text-slate-500" : "border-slate-200 text-slate-500"}`}>
					<span>
						Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{rangeStart} to {rangeEnd}</span> of {records.length} entries
					</span>
					<div className="flex items-center gap-1.5">
						<button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={safePage === 0} aria-label="Previous page" className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<span className={`min-w-12 text-center ${isDark ? "text-slate-300" : "text-slate-700"}`}>{records.length === 0 ? 0 : safePage + 1} / {records.length === 0 ? 0 : pageCount}</span>
						<button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={safePage >= pageCount - 1 || records.length === 0} aria-label="Next page" className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>
				</footer>
			</section>
		</div>
	);
}
