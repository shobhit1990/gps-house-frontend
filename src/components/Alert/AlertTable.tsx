import { ChevronLeft, ChevronRight } from "lucide-react";

export function EmptyTableRow({
	isDark,
	colSpan,
	title = "No data available",
	hint,
}: {
	isDark: boolean;
	colSpan: number;
	title?: string;
	hint?: string;
}) {
	return (
		<tr>
			<td colSpan={colSpan} className="px-6 py-14 text-center">
				<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{title}</p>
				{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
			</td>
		</tr>
	);
}

export function TableFooter({
	isDark,
	page,
	pageSize,
	total,
	onPageChange,
}: {
	isDark: boolean;
	page: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
}) {
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	const from = total === 0 ? 0 : page * pageSize + 1;
	const to = Math.min((page + 1) * pageSize, total);
	const navButtonClass = `flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${
		isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
	}`;

	return (
		<footer className={`flex flex-col gap-3 border-t px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/[0.07] text-slate-400" : "border-slate-200 text-slate-600"}`}>
			<span>Showing {from} to {to} of {total} entries</span>
			<div className="flex items-center gap-1.5">
				<button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => onPageChange(page - 1)} className={navButtonClass}>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className={`min-w-12 text-center ${isDark ? "text-slate-300" : "text-slate-700"}`}>{page + 1} / {pageCount}</span>
				<button type="button" aria-label="Next page" disabled={page >= pageCount - 1} onClick={() => onPageChange(page + 1)} className={navButtonClass}>
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>
		</footer>
	);
}
