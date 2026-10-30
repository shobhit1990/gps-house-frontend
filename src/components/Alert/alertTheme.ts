/** Shared class helpers so every Alert page matches the app's light/dark theme. */

export const cardClass = (isDark: boolean) =>
	`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${
		isDark
			? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90"
			: "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
	}`;

export const filterCardClass = (isDark: boolean) =>
	`mb-4 rounded-xl border p-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/65" : "border-slate-200 bg-white/90 shadow-sm"}`;

export const toolbarClass = (isDark: boolean) =>
	`flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${
		isDark
			? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]"
			: "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"
	}`;

export const inputClass = (isDark: boolean) =>
	`h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-200 placeholder:text-slate-500 focus:border-cyan-300/35 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 [color-scheme:light]"
	}`;

export const searchInputClass = (isDark: boolean) =>
	`h-10 w-full rounded-lg border pl-9 pr-3 text-xs outline-none ${
		isDark
			? "border-white/[0.12] bg-[#03091c]/80 text-white placeholder:text-slate-400 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/[0.08]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
	}`;

export const searchIconClass = (isDark: boolean) =>
	`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-cyan-600/70"}`;

export const labelClass = (isDark: boolean) =>
	`mb-1.5 block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

export const checkboxLabelClass = (isDark: boolean) =>
	`flex w-fit cursor-pointer items-center gap-2 text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

export const checkboxClass = "h-4 w-4 rounded border-slate-400 accent-cyan-500";

export const sectionTitleClass = (isDark: boolean) =>
	`text-[13px] font-semibold ${isDark ? "text-white" : "text-slate-900"}`;

export const primaryButtonClass = (isDark: boolean) =>
	`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-4 text-xs font-semibold transition disabled:opacity-60 ${
		isDark
			? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50 hover:bg-cyan-300/[0.22]"
			: "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
	}`;

export const secondaryButtonClass = (isDark: boolean) =>
	`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-4 text-xs font-medium transition ${
		isDark
			? "border-white/[0.10] bg-[#03091c]/65 text-slate-300 hover:bg-white/[0.04]"
			: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
	}`;

export const dangerButtonClass = (isDark: boolean) =>
	`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
		isDark
			? "border-rose-300/25 bg-rose-400/[0.08] text-rose-200 hover:bg-rose-400/[0.15]"
			: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
	}`;

export const refreshButtonClass = (isDark: boolean) =>
	`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
		isDark
			? "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-cyan-100"
			: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
	}`;

export const tableHeadRowClass = (isDark: boolean) =>
	`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${
		isDark ? "border-white/[0.08] bg-white/[0.025] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600"
	}`;

export const thClass = "whitespace-nowrap px-4 py-3 font-medium";

export const tableRowClass = (isDark: boolean, selected = false) =>
	`border-b text-xs transition ${
		selected
			? isDark
				? "border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-50"
				: "border-cyan-200 bg-cyan-50 text-cyan-900"
			: isDark
				? "border-white/[0.06] text-slate-300 hover:bg-white/[0.025]"
				: "border-slate-200 text-slate-700 hover:bg-slate-50"
	}`;

export const rowActionClass = (isDark: boolean, tone: "cyan" | "rose") =>
	`h-7 rounded-md border px-3 text-[11px] font-semibold transition ${
		tone === "rose"
			? isDark
				? "border-rose-300/25 bg-rose-400/[0.06] text-rose-200 hover:bg-rose-400/[0.15]"
				: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
			: isDark
				? "border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-100 hover:bg-cyan-300/[0.16]"
				: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
	}`;
