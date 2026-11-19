import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

type VehicleLogRow = {
	vehicle: string;
	event: string;
	oldData: string;
	newData: string;
	message: string;
	modifiedDate: string;
	createdBy: string;
};

type VehicleLogDialogProps = {
	vehicleNo: string;
	onClose: () => void;
};

const columns: { key: keyof VehicleLogRow; label: string }[] = [
	{ key: "vehicle", label: "Vehicle" },
	{ key: "event", label: "Event" },
	{ key: "oldData", label: "Old Data" },
	{ key: "newData", label: "New Data" },
	{ key: "message", label: "Message" },
	{ key: "modifiedDate", label: "Modified Date" },
	{ key: "createdBy", label: "Created By" },
];

const pageSizeOptions = [10, 25, 50, 100];

export function VehicleLogDialog({ vehicleNo, onClose }: VehicleLogDialogProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(25);
	const [page, setPage] = useState(0);

	// API not wired yet — empty list until backend is connected.
	const rows = useMemo<VehicleLogRow[]>(() => [], []);

	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) =>
			[
				row.vehicle,
				row.event,
				row.oldData,
				row.newData,
				row.message,
				row.modifiedDate,
				row.createdBy,
			]
				.join(" ")
				.toLowerCase()
				.includes(query),
		);
	}, [rows, search]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	return (
		<div
			className={`fixed inset-0 z-[830] flex items-center justify-center p-3 backdrop-blur-sm sm:p-4 ${
				isDark ? "bg-[#020718]/80" : "bg-slate-900/50"
			}`}
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
			onKeyDown={(event) => {
				if (event.key === "Escape") onClose();
			}}
		>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="vehicle-log-title"
				className={`flex max-h-[96vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
					isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
				}`}
			>
				<header
					className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${
						isDark ? "border-white/[0.08] bg-[#08142e]" : "border-slate-200 bg-slate-50"
					}`}
				>
					<div>
						<h2
							id="vehicle-log-title"
							className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
						>
							Vehicle Log
						</h2>
						<p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
							{vehicleNo}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close vehicle log"
						className={`rounded-lg p-1.5 transition ${
							isDark
								? "text-slate-400 hover:bg-white/[0.06] hover:text-white"
								: "text-slate-500 hover:bg-slate-200"
						}`}
					>
						<X className="h-4 w-4" />
					</button>
				</header>

				<div
					className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3 ${
						isDark ? "border-white/[0.08]" : "border-slate-200"
					}`}
				>
					<label className="relative block min-w-[220px] flex-1 max-w-sm">
						<Search
							className={`pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
								isDark ? "text-slate-500" : "text-slate-400"
							}`}
						/>
						<input
							type="search"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(0);
							}}
							placeholder="Search"
							aria-label="Search vehicle logs"
							className={`h-9 w-full rounded-lg border pl-9 pr-3 text-xs outline-none transition focus:ring-2 ${
								isDark
									? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10"
									: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
							}`}
						/>
					</label>

					<label className={`flex items-center gap-2 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
						<span>Show</span>
						<select
							value={pageSize}
							onChange={(event) => {
								setPageSize(Number(event.target.value));
								setPage(0);
							}}
							aria-label="Rows per page"
							className={`h-9 rounded-lg border px-2 text-xs outline-none focus:ring-2 ${
								isDark
									? "border-white/[0.09] bg-[#03091c]/70 text-white focus:border-cyan-300/35 focus:ring-cyan-300/10"
									: "border-slate-200 bg-white text-slate-900 focus:border-cyan-400 focus:ring-cyan-100"
							}`}
						>
							{pageSizeOptions.map((size) => (
								<option key={size} value={size}>
									{size}
								</option>
							))}
						</select>
						<span>entries</span>
					</label>
				</div>

				<div className="min-h-0 flex-1 overflow-auto">
					<table className="min-w-full border-collapse text-left text-[11px]">
						<thead
							className={`sticky top-0 z-10 ${
								isDark ? "bg-[#08142e] text-slate-300" : "bg-slate-50 text-slate-600"
							}`}
						>
							<tr className={`border-b ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
								{columns.map((column) => (
									<th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">
										{column.label}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{pageRows.map((row, index) => (
								<tr
									key={`${row.vehicle}-${row.event}-${row.modifiedDate}-${index}`}
									className={`border-b last:border-0 ${
										isDark
											? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]"
											: "border-slate-200 text-slate-700 hover:bg-slate-50"
									}`}
								>
									{columns.map((column) => (
										<td key={column.key} className="max-w-[280px] whitespace-nowrap px-4 py-3">
											{row[column.key] || "—"}
										</td>
									))}
								</tr>
							))}
							{pageRows.length === 0 && (
								<tr>
									<td
										colSpan={columns.length}
										className={`px-6 py-16 text-center text-xs ${
											isDark ? "text-slate-400" : "text-slate-500"
										}`}
									>
										No vehicle logs found.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				<footer
					className={`flex shrink-0 items-center justify-between gap-3 border-t px-5 py-3 ${
						isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"
					}`}
				>
					<p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
						{filteredRows.length === 0
							? "Showing 0 entries"
							: `Showing ${safePage * pageSize + 1}–${Math.min((safePage + 1) * pageSize, filteredRows.length)} of ${filteredRows.length}`}
					</p>
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							onClick={() => setPage((current) => Math.max(0, current - 1))}
							disabled={safePage === 0}
							aria-label="Previous page"
							className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${
								isDark
									? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]"
									: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
							}`}
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<span className={`min-w-12 text-center text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
							{safePage + 1} / {pageCount}
						</span>
						<button
							type="button"
							onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
							disabled={safePage >= pageCount - 1}
							aria-label="Next page"
							className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${
								isDark
									? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]"
									: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
							}`}
						>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>
				</footer>
			</section>
		</div>
	);
}
