import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { MobileReportType } from "@/enums/MobileReportType";
import type { RegisterMobileRow } from "@/interfaces/RegisterMobileReport";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useLazyGetRegisterMobileReportQuery } from "@/store/services/api/RegisterMobileReport";
import { useGetClientMasterQuery, useGetTransporterMasterQuery } from "@/store/services/api/Master";
import { useGetUsersQuery } from "@/store/services/api/User";

type ColumnKey = "sn" | "username" | "activeCount";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "sn", label: "SN" },
	{ key: "username", label: "Username" },
	{ key: "activeCount", label: "Active Count" },
];

const userTypes = [
	{ id: MobileReportType.USER, name: "User" },
	{ id: MobileReportType.TRANSPORTER, name: "Transporter" },
];

const textValue = (value: string) => (value.trim() ? value : "—");

const notice =
	"This report shows the list of active registered mobile counts associated with a particular user. If the count exceeds the maximum limit, the user will not receive any notifications in the mobile application.";

export default function RegisterMobileReport() {
	const { data: clients = [], isLoading: clientsLoading } = useGetClientMasterQuery();
	const { data: allUsers = [], isLoading: usersLoading } = useGetUsersQuery();
	const [fetchRegisterMobile, { isFetching }] = useLazyGetRegisterMobileReportQuery();
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";

	const [rows, setRows] = useState<RegisterMobileRow[]>([]);
	const [searched, setSearched] = useState(false);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [client, setClient] = useState("");
	const [userType, setUserType] = useState<MobileReportType | "">("");
	const [entityId, setEntityId] = useState("");

	const isUserType = userType === MobileReportType.USER;
	const isTransporterType = userType === MobileReportType.TRANSPORTER;

	const {
		data: transporters = [],
		isLoading: transportersLoading,
		isFetching: transportersFetching,
	} = useGetTransporterMasterQuery(client ? { client } : undefined, {
		skip: !client || !isTransporterType,
	});

	const userOptions = useMemo(
		() =>
			allUsers
				.map((item) => ({
					id: item.externalId || String(item.id ?? ""),
					name: item.userName?.trim() || item.companyName?.trim() || item.externalId || "",
				}))
				.filter((item) => item.id && item.name),
		[allUsers],
	);

	const entityOptions = isUserType ? userOptions : isTransporterType ? transporters : [];
	const entityLoading = isUserType
		? usersLoading
		: isTransporterType
			? transportersLoading || transportersFetching
			: false;

	useEffect(() => {
		if (!entityId) return;
		if (entityOptions.some((item) => item.id === entityId)) return;
		setEntityId("");
	}, [entityId, entityOptions]);

	const filteredRows = useMemo(() => {
		if (!searched) return [];
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) =>
			[row.username, row.activeCount, row.userType, row.client, row.transporter].join(" ").toLowerCase().includes(query),
		);
	}, [rows, search, searched]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const selectClass = `h-10 w-full appearance-none rounded-lg border px-2.5 pr-7 text-[11px] outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-200 focus:border-cyan-300/35 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-800 focus:border-cyan-400 [color-scheme:light]"
	}`;

	const onClientChange = (next: string) => {
		setClient(next);
		setEntityId("");
	};

	const onUserTypeChange = (next: MobileReportType | "") => {
		setUserType(next);
		setEntityId("");
	};

	const applyFilters = async () => {
		if (!client) {
			toast.error("Select client.");
			return;
		}
		if (!userType) {
			toast.error("Select user type.");
			return;
		}
		if (isUserType && !entityId) {
			toast.error("Select user.");
			return;
		}
		if (isTransporterType && !entityId) {
			toast.error("Select transporter.");
			return;
		}

		try {
			const data = await fetchRegisterMobile({
				client,
				type: userType,
				...(isUserType ? { user: entityId } : {}),
				...(isTransporterType ? { transporter: entityId } : {}),
			}).unwrap();
			setRows(data);
			setSearched(true);
			setPage(0);
			if (data.length === 0) {
				toast.message("No registered mobiles for this filter.");
			} else {
				toast.success("Register mobile report loaded");
			}
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not load register mobile report."));
		}
	};

	const refresh = () => {
		setRows([]);
		setSearched(false);
		setSearch("");
		setClient("");
		setUserType("");
		setEntityId("");
		setPage(0);
		setPageSize(10);
	};

	const entityPlaceholder = !userType
		? "Select User Type"
		: entityLoading
			? isUserType
				? "Loading users…"
				: "Loading transporters…"
			: entityOptions.length === 0
				? isUserType
					? "No users"
					: "No transporters"
				: isUserType
					? "Select User"
					: "Select Transporter";

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
							Register Mobile Report
						</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>
							{searched ? filteredRows.length : 0} reports
						</p>
					</div>
					<button
						type="button"
						onClick={refresh}
						aria-label="Refresh register mobile report"
						title="Refresh register mobile report"
						className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<p
					className={`mb-4 rounded-xl border px-4 py-3 text-xs leading-5 ${isDark ? "border-amber-200/15 bg-amber-200/[0.06] text-amber-100/90" : "border-amber-200 bg-amber-50 text-amber-950"}`}
				>
					{notice}
				</p>

				<section
					aria-label="Register mobile filters"
					className={`mb-4 rounded-xl border p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-4 ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90"}`}
				>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<label className="relative block min-w-0 flex-1 sm:max-w-[200px]">
							<span className="sr-only">Client</span>
							<select
								id="register-mobile-client"
								aria-label="Select Client"
								value={client}
								disabled={clientsLoading}
								onChange={(event) => onClientChange(event.target.value)}
								className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-55`}
							>
								<option value="">{clientsLoading ? "Loading clients…" : "Select Client"}</option>
								{clients.map((option) => (
									<option key={option.id} value={option.id}>
										{option.name}
									</option>
								))}
							</select>
							<ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
						</label>
						<label className="relative block min-w-0 flex-1 sm:max-w-[200px]">
							<span className="sr-only">User Type</span>
							<select
								id="register-mobile-type"
								aria-label="Select User Type"
								value={userType}
								onChange={(event) => onUserTypeChange(event.target.value as MobileReportType | "")}
								className={selectClass}
							>
								<option value="">Select User Type</option>
								{userTypes.map((option) => (
									<option key={option.id} value={option.id}>
										{option.name}
									</option>
								))}
							</select>
							<ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
						</label>
						<label className="relative block min-w-0 flex-1 sm:max-w-[200px]">
							<span className="sr-only">{isUserType ? "User" : "Transporter"}</span>
							<select
								id="register-mobile-entity"
								aria-label={isUserType ? "Select User" : "Select Transporter"}
								value={entityId}
								disabled={!userType || entityLoading}
								onChange={(event) => setEntityId(event.target.value)}
								className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-55`}
							>
								<option value="">{entityPlaceholder}</option>
								{entityOptions.map((option) => (
									<option key={option.id} value={option.id}>
										{option.name}
									</option>
								))}
							</select>
							<ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
						</label>
						<button
							type="button"
							onClick={() => void applyFilters()}
							disabled={isFetching}
							className={`h-10 shrink-0 rounded-lg border px-5 text-[12px] font-semibold transition disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
						>
							{isFetching ? "Loading…" : "Search"}
						</button>
					</div>
				</section>

				<section
					className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}
				>
					<div
						className={`flex flex-col gap-3 border-b p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}
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
								aria-label="Search register mobile report"
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
						<div className="relative">
							<select
								aria-label="No of Rows"
								value={pageSize}
								onChange={(event) => {
									setPageSize(Number(event.target.value));
									setPage(0);
								}}
								className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 [color-scheme:dark]" : "border-slate-200 bg-white text-slate-700"}`}
							>
								<option value={10}>10 rows</option>
								<option value={25}>25 rows</option>
								<option value={50}>50 rows</option>
							</select>
							<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px] border-collapse text-left">
							<thead>
								<tr
									className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}
								>
									{columns.map((column) => (
										<th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">
											{column.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row, index) => (
									<tr
										key={row.id}
										className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
									>
										<td className="whitespace-nowrap px-4 py-3">{String(row.sn || safePage * pageSize + index + 1).padStart(2, "0")}</td>
										<td className={`whitespace-nowrap px-3 py-3 font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>
											{textValue(row.username)}
										</td>
										<td className="whitespace-nowrap px-3 py-3">{textValue(row.activeCount)}</td>
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={columns.length} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
												{isFetching ? "Loading…" : "No registered mobiles available"}
											</p>
											<p className="mt-1 text-xs text-slate-500">
												{searched
													? "Change the filters or search to see reports."
													: "Select client and user type, then search."}
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
