import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddRaisedTicket } from "@/components/Support/AddRaisedTicket";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";

const filters = ["Select Ticket Type", "Bug", "Feature Request", "General Inquiry", "Service Request"];

const columns = ["SN", "Ticket Id", "Ticket Type", "Status", "Added", "Updated", "Description", "Reopen"];
type DatePreset = "Today" | "Yesterday" | "This Month" | "Last Month" | "Custom Range";

const datePresets: DatePreset[] = ["Today", "Yesterday", "This Month", "Last Month", "Custom Range"];

function rangeForPreset(preset: Exclude<DatePreset, "Custom Range">): DateRange {
  const today = new Date();
  switch (preset) {
    case "Today":
      return { from: today, to: today };
    case "Yesterday": {
      const yesterday = subDays(today, 1);
      return { from: yesterday, to: yesterday };
    }
    case "This Month":
      return { from: startOfMonth(today), to: today };
    case "Last Month": {
      const lastMonth = subMonths(today, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
  }
}

function formatDateRange(range?: DateRange) {
  if (!range?.from) return "";
  const from = format(range.from, "dd/MM/yyyy");
  return range.to ? `${from} - ${format(range.to, "dd/MM/yyyy")}` : from;
}

function DateRangeFilter({
  isDark,
  label,
  isOpen,
  alignRight,
  value,
  onOpen,
  onClose,
  onApply,
}: {
  isDark: boolean;
  label: string;
  isOpen: boolean;
  alignRight?: boolean;
  value?: DateRange;
  onOpen: () => void;
  onClose: () => void;
  onApply: (range?: DateRange) => void;
}) {
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(value);
  const [activePreset, setActivePreset] = useState<DatePreset>("Custom Range");

  const openPicker = () => {
    setPendingRange(value);
    setActivePreset("Custom Range");
    onOpen();
  };

  const applyPreset = (preset: DatePreset) => {
    setActivePreset(preset);
    if (preset !== "Custom Range") setPendingRange(rangeForPreset(preset));
  };

  const surfaceClass = isDark
    ? "border-white/[0.10] bg-[#0a1630] text-slate-200"
    : "border-slate-200 bg-white text-slate-800";

  return (
    <div className="relative min-w-[220px] flex-1">
      <button
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        onClick={openPicker}
        className={`flex h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm font-medium outline-none transition focus:ring-2 ${
          isDark
            ? "border-white/[0.08] bg-[#0f172a] text-slate-200 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08]"
            : "border-slate-200 bg-white text-slate-700 focus:border-cyan-400 focus:ring-cyan-100"
        }`}
      >
        <span className={value?.from ? "" : isDark ? "text-slate-500" : "text-slate-400"}>
          {formatDateRange(value) || label}
        </span>
        <CalendarDays className={`h-4 w-4 shrink-0 ${isDark ? "text-cyan-200/60" : "text-slate-500"}`} />
      </button>

      {isOpen ? (
        <div
          className={`absolute top-full z-[700] mt-2 w-[min(800px,calc(100vw-2rem))] overflow-hidden rounded-xl border shadow-[0_24px_70px_rgba(0,0,0,0.28)] ${
            alignRight ? "right-0" : "left-0"
          } ${surfaceClass}`}
        >
          <div className="grid sm:grid-cols-[150px_minmax(0,1fr)]">
            <nav aria-label={`${label} date presets`} className={`border-b p-2 sm:border-b-0 sm:border-r ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
              {datePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`mb-1 w-full rounded-md px-3 py-2.5 text-left text-xs font-medium transition ${
                    activePreset === preset
                      ? isDark
                        ? "bg-cyan-300/[0.16] text-cyan-100"
                        : "bg-cyan-50 text-cyan-800"
                      : isDark
                        ? "text-slate-300 hover:bg-white/[0.05]"
                        : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </nav>

            <div className="min-w-0 overflow-x-auto p-2 sm:p-3">
              <Calendar
                mode="range"
                selected={pendingRange}
                onSelect={(range) => {
                  setPendingRange(range);
                  setActivePreset("Custom Range");
                }}
                numberOfMonths={2}
                defaultMonth={pendingRange?.from}
                className="mx-auto"
                classNames={{
                  months: "flex flex-col sm:flex-row sm:gap-4",
                  month: "space-y-3",
                  caption: "relative flex h-8 items-center justify-center",
                  caption_label: `text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`,
                  nav: "flex items-center gap-1",
                  nav_button: `h-7 w-7 rounded-md border p-1 ${isDark ? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`,
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell: `w-8 rounded-md text-center text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`,
                  row: "mt-1 flex w-full",
                  cell: "relative h-8 w-8 p-0 text-center text-xs",
                  day: `h-8 w-8 rounded-md p-0 text-xs ${isDark ? "text-slate-300 hover:bg-white/[0.08]" : "text-slate-700 hover:bg-slate-100"}`,
                  day_selected: isDark
                    ? "bg-cyan-300/[0.20] text-cyan-100 hover:bg-cyan-300/[0.28]"
                    : "bg-cyan-100 text-cyan-900 hover:bg-cyan-200",
                  day_range_start: isDark ? "rounded-l-md bg-cyan-300/[0.22]" : "rounded-l-md bg-cyan-100",
                  day_range_end: isDark ? "rounded-r-md bg-cyan-300/[0.22]" : "rounded-r-md bg-cyan-100",
                  day_range_middle: isDark ? "bg-cyan-300/[0.10] text-cyan-100" : "bg-cyan-50 text-cyan-900",
                  day_today: isDark ? "border border-violet-300/50" : "border border-violet-300",
                  day_outside: isDark ? "text-slate-600 opacity-60" : "text-slate-400 opacity-70",
                  day_disabled: "opacity-30",
                }}
              />
            </div>
          </div>

          <footer className={`flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2.5 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-slate-50/70"}`}>
            <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {formatDateRange(pendingRange) || "Select a date range"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`h-8 rounded-lg border px-3 text-xs font-medium ${isDark ? "border-white/[0.10] text-slate-300 hover:bg-white/[0.04]" : "border-slate-200 text-slate-700 hover:bg-white"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(pendingRange);
                  onClose();
                }}
                disabled={!pendingRange?.from}
                className={`h-8 rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDark
                    ? "border-cyan-300/35 bg-cyan-300/[0.16] text-cyan-50 hover:bg-cyan-300/[0.24]"
                    : "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
                }`}
              >
                Apply
              </button>
            </div>
          </footer>
        </div>
      ) : null}
    </div>
  );
}

export default function RaisedTicket() {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const [isAddTicketOpen, setIsAddTicketOpen] = useState(false);
  const [openDateFilter, setOpenDateFilter] = useState<"added" | "updated" | null>(null);
  const [addedDateRange, setAddedDateRange] = useState<DateRange>();
  const [updatedDateRange, setUpdatedDateRange] = useState<DateRange>();

  const panelClass = isDark
    ? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90"
    : "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]";

  const filterInputClass = isDark
    ? "border-white/[0.08] bg-[#0f172a] text-white placeholder:text-slate-500 focus:border-slate-400 focus:ring-0"
    : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:ring-0";

  const tableHeadClass = isDark
    ? "border-white/[0.08] bg-white/[0.025] text-slate-400"
    : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div className={`relative min-h-screen overflow-hidden font-sans ${isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"}`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.12] blur-[160px]" />
        <div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.08] blur-[170px]" />
      </div>

      <Sidebar onLogout={logout} />

      <main className="relative mx-auto max-w-[1900px] px-4 pb-8 pt-6 sm:px-6 lg:px-7 lg:pt-7">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={`mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>
              <Activity className="h-3.5 w-3.5" /> Support operations
            </p>
            <h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>
              Raise Ticket
            </h1>
          </div>

          <button
            type="button"
            aria-label="Refresh ticket list"
            title="Refresh ticket list"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </header>

        <section aria-label="Ticket filters" className={`mb-4 rounded-xl border p-3 ${panelClass}`}>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <select
                aria-label="Select ticket type"
                defaultValue="Select Ticket Type"
                className={`h-10 w-full appearance-none rounded-lg border px-3 pr-10 text-left text-sm font-medium outline-none transition ${filterInputClass}`}
              >
                {filters.map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>

            <DateRangeFilter
              isDark={isDark}
              label="Added Date Filter"
              isOpen={openDateFilter === "added"}
              value={addedDateRange}
              onOpen={() => setOpenDateFilter("added")}
              onClose={() => setOpenDateFilter(null)}
              onApply={setAddedDateRange}
            />

            <DateRangeFilter
              isDark={isDark}
              label="Updated Date Filter"
              isOpen={openDateFilter === "updated"}
              alignRight
              value={updatedDateRange}
              onOpen={() => setOpenDateFilter("updated")}
              onClose={() => setOpenDateFilter(null)}
              onApply={setUpdatedDateRange}
            />

            <button
              type="button"
              onClick={() => {
                setAddedDateRange(undefined);
                setUpdatedDateRange(undefined);
                setOpenDateFilter(null);
              }}
              className={`flex h-12 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-semibold transition ${
                isDark
                  ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.13]"
                  : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </section>

        <section className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${panelClass}`}>
          <div className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]" : "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"}`}>
            <label className="relative block min-w-0 w-full xl:max-w-[520px]">
              <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-cyan-200/50" : "text-slate-500"}`} />
              <input
                aria-label="Search tickets"
                placeholder="Search"
                className={`h-10 w-full rounded-lg border pl-9 pr-3 text-sm outline-none transition ${filterInputClass}`}
              />
            </label>

            <button
              type="button"
              onClick={() => setIsAddTicketOpen(true)}
              className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-[11px] font-semibold transition ${isDark ? "border-cyan-300/35 bg-cyan-300/[0.16] text-cyan-50 hover:bg-cyan-300/[0.24]" : "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"}`}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse">
              <thead>
                <tr className={tableHeadClass}>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className={`border-b px-4 py-3 text-left text-[9px] font-medium uppercase tracking-[0.12em] ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{column}</span>
                        {column !== "Status" && column !== "Description" && column !== "Reopen" ? (
                          <span className={`inline-flex h-3.5 w-3.5 items-center justify-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path d="M10 2.5 14.5 8H11v8H9V8H5.5L10 2.5Z" />
                            </svg>
                          </span>
                        ) : null}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={columns.length}
                    className={`px-4 py-20 text-center text-base font-semibold ${isDark ? "text-rose-300" : "text-rose-600"}`}
                  >
                    No data available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={`flex flex-wrap items-center justify-between gap-4 border-t px-4 py-3 text-xs ${isDark ? "border-white/[0.08] text-slate-400" : "border-slate-200 text-slate-600"}`}>
            <div className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Showing 0 to 0 of 0 entries
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Previous page"
                className={`flex h-9 w-9 items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}
                disabled
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next page"
                className={`flex h-9 w-9 items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "border-white/[0.08] bg-[#03091c]/65 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}
                disabled
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
      {isAddTicketOpen ? (
        <AddRaisedTicket
          isDark={isDark}
          onClose={() => setIsAddTicketOpen(false)}
          onSubmit={() => toast.info("Ticket submission is not connected yet.")}
        />
      ) : null}
    </div>
  );
}
