import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Columns3, Plus, RefreshCw, Search, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";

type CoinRecord = {
	id: number;
	added: string;
	from: string;
	to: string;
	coinsDebit: number;
	coinsCredit: number;
	remainingCoins: number;
};

type ColumnKey = "added" | "from" | "to" | "coinsDebit" | "coinsCredit" | "remainingCoins";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "added", label: "Added" },
	{ key: "from", label: "From" },
	{ key: "to", label: "To" },
	{ key: "coinsDebit", label: "Coins Debit" },
	{ key: "coinsCredit", label: "Coins Credit" },
	{ key: "remainingCoins", label: "Remaining Coins" },
];

const assignTypes = ["Transporter", "Client"] as const;
type AssignType = (typeof assignTypes)[number];

const clients = ["arun.singh", "tushar.shukla", "gpshouse"];
const transporters = ["Aviator", "vicky.9", "vga", "rahul.sharma"];
const houseAccount = "gpshouse";

const todayLabel = () => {
	const now = new Date();
	return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
};

export default function CoinBanking() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const [rows, setRows] = useState<CoinRecord[]>([]);
	const [houseBalance, setHouseBalance] = useState(0);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showTransfer, setShowTransfer] = useState(false);
	const [assignType, setAssignType] = useState<AssignType>("Client");
	const [assignee, setAssignee] = useState("");
	const [coins, setCoins] = useState("0");
	const [formError, setFormError] = useState("");

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) => [row.added, row.from, row.to, String(row.coinsDebit), String(row.coinsCredit), String(row.remainingCoins)].join(" ").toLowerCase().includes(query));
	}, [rows, search]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	useEffect(() => {
		if (!showTransfer) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setShowTransfer(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [showTransfer]);

	const inputClass = `h-9 w-full rounded-md border px-3 text-[12px] outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const assigneeOptions = assignType === "Client" ? clients : transporters;
	const labelClass = `mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

	const resetTransfer = () => {
		setAssignType("Client");
		setAssignee("");
		setCoins("0");
		setFormError("");
	};

	const saveTransfer = (event: FormEvent) => {
		event.preventDefault();
		const amount = Number(coins);
		if (!assignee) {
			setFormError(assignType === "Client" ? "Select a client." : "Select a transporter.");
			return;
		}
		if (!Number.isInteger(amount) || amount <= 0) {
			setFormError("No. of Coins must be a whole number greater than 0.");
			return;
		}
		if (amount > houseBalance) {
			setFormError("Not enough coins.");
			return;
		}

		const nextBalance = houseBalance - amount;
		setHouseBalance(nextBalance);
		setRows((current) => [
			{
				id: current.reduce((max, row) => Math.max(max, row.id), 0) + 1,
				added: todayLabel(),
				from: houseAccount,
				to: assignee,
				coinsDebit: amount,
				coinsCredit: 0,
				remainingCoins: nextBalance,
			},
			...current,
		]);
		setSearch("");
		setPage(0);
		resetTransfer();
		setShowTransfer(false);
	};

	const cell = (key: ColumnKey, row: CoinRecord) => {
		if (key === "from" || key === "to") return <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{row[key]}</span>;
		return String(row[key]);
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
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Coin Banking</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{rows.length} transfers</p>
					</div>
					<button type="button" onClick={() => { setSearch(""); setPage(0); }} aria-label="Refresh coin banking" title="Refresh coin banking" className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}>
						<RefreshCw className="h-4 w-4" />
					</button>
				</section>

				<section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${isDark ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90" : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"}`}>
					<div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`} />
							<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search" aria-label="Search coin banking" className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"}`} />
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
							<span className={`inline-flex h-9 items-center rounded-lg border px-3 text-[11px] font-medium ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}>
								Remaining Coins : {houseBalance}
							</span>
							<details className="relative">
								<summary className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Column Visibility
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div className={`absolute right-0 top-11 z-30 max-h-52 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
									{columns.map((column) => (
										<label key={column.key} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"}`}>
											<input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={() => setHiddenColumns((current) => (current.includes(column.key) ? current.filter((item) => item !== column.key) : [...current, column.key]))} className="h-3.5 w-3.5 accent-cyan-300" />
											{column.label}
										</label>
									))}
								</div>
							</details>
							<button type="button" onClick={() => { resetTransfer(); setShowTransfer(true); }} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
								<Plus className="h-3.5 w-3.5" /> Transfer coins
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[860px] border-collapse text-left">
							<thead>
								<tr className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
									{visibleColumns.map((column) => <th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">{column.label}</th>)}
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row) => (
									<tr key={row.id} className={`border-b text-[11px] transition last:border-0 ${isDark ? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
										{visibleColumns.map((column) => <td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">{cell(column.key, row)}</td>)}
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>No coin transfers available</p>
											<p className="mt-1 text-xs text-slate-500">Transfer coins to see them here.</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"}`}>
						<span>
							Showing <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredRows.length)}</span> of {filteredRows.length} transfers
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

			{showTransfer && (
				<div className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6">
					<button type="button" aria-label="Close transfer form" className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]" onClick={() => setShowTransfer(false)} />
					<form
						onSubmit={saveTransfer}
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
						className={`relative w-full max-w-[440px] overflow-hidden rounded-2xl border shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
					>
						<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
							<h2 id={titleId} className="text-[15px] font-semibold">Transfer coins</h2>
							<button type="button" onClick={() => setShowTransfer(false)} aria-label="Close" className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
								<X className="h-5 w-5 stroke-[3]" />
							</button>
						</header>
						<div className="px-5 py-5">
							{formError && (
								<p role="alert" className={`mb-4 rounded-lg border px-3 py-2 text-[12px] ${isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
									{formError}
								</p>
							)}
							<div className="flex flex-col gap-4">
								<label className="relative block">
									<span className="sr-only">Assign type</span>
									<select aria-label="Assign type" value={assignType} onChange={(event) => { setAssignType(event.target.value as AssignType); setAssignee(""); setFormError(""); }} className={`${inputClass} h-10 appearance-none pr-8`}>
										{assignTypes.map((type) => <option key={type} value={type}>{type}</option>)}
									</select>
									<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								</label>
								<label className="relative block">
									<span className="sr-only">Select {assignType}</span>
									<select required aria-label={`Select ${assignType}`} value={assignee} onChange={(event) => { setAssignee(event.target.value); setFormError(""); }} className={`${inputClass} h-10 appearance-none pr-8`}>
										<option value="">Select {assignType}</option>
										{assigneeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
									</select>
									<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								</label>
								<label className="block">
									<span className={labelClass}>No. of Coins <span className="text-rose-400">*</span></span>
									<input required inputMode="numeric" aria-label="No. of Coins" value={coins} onChange={(event) => { setCoins(event.target.value.replace(/\D/g, "")); setFormError(""); }} className={`${inputClass} h-10`} />
								</label>
							</div>
							<div className="mt-5 flex justify-end">
								<button type="submit" className={`h-9 rounded-lg border px-5 text-[12px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
									Transfer
								</button>
							</div>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}
