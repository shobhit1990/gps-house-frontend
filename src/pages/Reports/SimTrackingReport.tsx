import { useEffect, useMemo, useRef, useState } from "react";
import { useCloseDetailsOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, RefreshCw, Search, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import type { SimTrackingRow } from "@/interfaces/SimTrackingReport";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useLazyGetSimTrackingReportQuery } from "@/store/services/api/SimTrackingReport";

type ColumnKey =
	| "vehicleNo"
	| "vehicleStatus"
	| "createdBy"
	| "simNo"
	| "consent"
	| "startDate"
	| "endDate"
	| "frequency"
	| "nextUpdate"
	| "trackCount"
	| "message"
	| "trackNow";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "vehicleNo", label: "Vehicle No." },
	{ key: "vehicleStatus", label: "Vehicle Status" },
	{ key: "createdBy", label: "Created By" },
	{ key: "simNo", label: "Sim_No" },
	{ key: "consent", label: "Consent" },
	{ key: "startDate", label: "Start Date" },
	{ key: "endDate", label: "End Date" },
	{ key: "frequency", label: "Frequency (Minutes)" },
	{ key: "nextUpdate", label: "Next Update" },
	{ key: "trackCount", label: "Track Count" },
	{ key: "message", label: "Message" },
	{ key: "trackNow", label: "Track Now" },
];

/** API uses `status=Active` / `status=Inactive`. */
const statuses = ["Active", "Inactive"] as const;

const textValue = (value: string) => (value.trim() ? value : "—");

export default function SimTrackingReport() {
	const [fetchSimTracking, { isFetching }] = useLazyGetSimTrackingReportQuery();
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const statusRef = useRef<HTMLDivElement>(null);
	const columnVisibilityRef = useRef<HTMLDetailsElement>(null);
	useCloseDetailsOnOutsideClick(columnVisibilityRef);

	const [rows, setRows] = useState<SimTrackingRow[]>([]);
	const [remainingCoins, setRemainingCoins] = useState(0);
	const [searched, setSearched] = useState(false);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const pageSize = 10;
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [status, setStatus] = useState<(typeof statuses)[number]>("Active");
	const [statusOpen, setStatusOpen] = useState(false);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		if (!searched) return [];
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) =>
			[
				row.vehicleNo,
				row.vehicleStatus,
				row.createdBy,
				row.simNo,
				row.consent,
				row.startDate,
				row.endDate,
				row.frequency,
				row.nextUpdate,
				row.trackCount,
				row.message,
			]
				.join(" ")
				.toLowerCase()
				.includes(query),
		);
	}, [rows, search, searched]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	useEffect(() => {
		if (!statusOpen) return;
		const onPointer = (event: MouseEvent) => {
			if (!statusRef.current?.contains(event.target as Node)) setStatusOpen(false);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setStatusOpen(false);
		};
		document.addEventListener("mousedown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [statusOpen]);

	const applyFilters = async () => {
		if (!status) {
			toast.error("Select status.");
			return;
		}

		try {
			const result = await fetchSimTracking({ status }).unwrap();
			setRows(result.rows);
			setRemainingCoins(result.remainingCoins);
			setSearched(true);
			setPage(0);
			setStatusOpen(false);
			if (result.rows.length === 0) {
				toast.message(`No ${status.toLowerCase()} SIM tracking reports.`);
			} else {
				toast.success("SIM tracking report loaded");
			}
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not load SIM tracking report."));
		}
	};

	const refresh = () => {
		setRows([]);
		setRemainingCoins(0);
		setSearched(false);
		setSearch("");
		setStatus("Active");
		setStatusOpen(false);
		setHiddenColumns([]);
		setPage(0);
	};

	const cell = (key: ColumnKey, row: SimTrackingRow) => {
		if (key === "vehicleNo") {
			return (
				<span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>
					{textValue(row.vehicleNo)}
				</span>
			);
		}
		if (key === "vehicleStatus") {
			const active = row.vehicleStatus === "Active";
			return (
				<span
					className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${
						active
							? isDark
								? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100"
								: "border-cyan-200 bg-cyan-50 text-cyan-700"
							: isDark
								? "border-rose-300/25 bg-rose-400/15 text-rose-200"
								: "border-rose-200 bg-rose-50 text-rose-700"
					}`}
				>
					{row.vehicleStatus}
				</span>
			);
		}
		if (key === "trackNow") {
			return (
				<button
					type="button"
					aria-label={`Track ${row.vehicleNo || "vehicle"} now`}
					className={`h-7 rounded-lg border px-2.5 text-[10px] font-semibold ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}
				>
					Track Now
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>
							SIM Tracking Report
						</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>
							{searched ? filteredRows.length : 0} reports
						</p>
					</div>
					<button
						type="button"
						onClick={refresh}
						aria-label="Refresh SIM tracking report"
						title="Refresh SIM tracking report"
						className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section
					aria-label="SIM tracking filters"
					className={`mb-4 rounded-xl border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-4 ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}
				>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<div ref={statusRef} className="relative w-full sm:max-w-[220px]">
							<button
								type="button"
								aria-expanded={statusOpen}
								aria-haspopup="listbox"
								aria-label="Status"
								onClick={() => setStatusOpen((open) => !open)}
								className={`flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-200 hover:border-cyan-300/35" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400"}`}
							>
								<span className="truncate">{status}</span>
								<ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${statusOpen ? "rotate-180" : ""}`} />
							</button>
							{statusOpen && (
								<ul
									role="listbox"
									aria-label="Status"
									className={`absolute left-0 top-12 z-40 w-full overflow-hidden rounded-xl border p-1 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
								>
									{statuses.map((item) => (
										<li key={item}>
											<button
												type="button"
												role="option"
												aria-selected={status === item}
												onClick={() => {
													setStatus(item);
													setStatusOpen(false);
												}}
												className={`w-full rounded-md px-2.5 py-2 text-left text-xs transition ${
													status === item
														? isDark
															? "bg-cyan-300/[0.16] text-cyan-50"
															: "bg-cyan-50 text-cyan-800"
														: isDark
															? "text-slate-300 hover:bg-white/[0.04]"
															: "text-slate-700 hover:bg-slate-100"
												}`}
											>
												{item}
											</button>
										</li>
									))}
								</ul>
							)}
						</div>
						<button
							type="button"
							onClick={() => void applyFilters()}
							disabled={isFetching}
							className={`h-10 rounded-lg border px-5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
						>
							{isFetching ? (
								"Searching..."
							) : (
								<>
									<Search className="mr-1.5 inline h-3.5 w-3.5" />
									Search
								</>
							)}
						</button>
					</div>
				</section>

				<section
					className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}
				>
					<div
						className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}
					>
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
								aria-label="Search SIM tracking"
								className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`}
							/>
							{search && (
								<button
									type="button"
									onClick={() => setSearch("")}
									aria-label="Clear search"
									className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
								>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<span
								className={`inline-flex h-9 items-center rounded-lg border px-3 text-[11px] font-medium ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
							>
								Remaining Coins : {remainingCoins}
							</span>
							<details ref={columnVisibilityRef} className="relative">
								<summary
									className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
								>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Column Visibility
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div
									className={`absolute right-0 top-11 z-30 max-h-52 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
								>
									{columns.map((column) => (
										<label
											key={column.key}
											className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}
										>
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
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1400px] border-collapse text-left">
							<thead>
								<tr
									className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}
								>
									{visibleColumns.map((column) => (
										<th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">
											{column.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{isFetching && pageRows.length === 0 && (
									<tr>
										<td colSpan={Math.max(visibleColumns.length, 1)} className="px-6 py-16 text-center text-sm text-slate-500">
											Loading SIM tracking report…
										</td>
									</tr>
								)}
								{pageRows.map((row) => (
									<tr
										key={row.id || row.externalId}
										className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
									>
										{visibleColumns.map((column) => (
											<td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">
												{cell(column.key, row)}
											</td>
										))}
									</tr>
								))}
								{!isFetching && pageRows.length === 0 && (
									<tr>
										<td colSpan={Math.max(visibleColumns.length, 1)} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
												No SIM tracking reports available
											</p>
											<p className="mt-1 text-xs text-slate-500">
												Select Active or Inactive status, then search.
											</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer
						className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}
					>
						<span>
							Showing{" "}
							<span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–
								{Math.min((safePage + 1) * pageSize, filteredRows.length)}
							</span>{" "}
							of {filteredRows.length} reports
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
		</div>
	);
}
