import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type VehicleMultiSelectOption = {
	id: string;
	name: string;
};

type VehicleMultiSelectProps = {
	id?: string;
	options: VehicleMultiSelectOption[];
	values: string[];
	onValuesChange: (values: string[]) => void;
	disabled?: boolean;
	placeholder?: string;
	emptyText?: string;
	/** Used in the trigger when multiple items are selected, e.g. "3 clients selected". */
	entityLabel?: string;
	searchLabel?: string;
	isDark?: boolean;
	className?: string;
	/** When true, trigger matches Travel Summary flex filter row sizing. */
	compact?: boolean;
};

/**
 * Report filter multi-select: search + Select All / Deselect All.
 * Works for vehicle / client / transporter (pass `entityLabel`).
 */
export function VehicleMultiSelect({
	id,
	options,
	values,
	onValuesChange,
	disabled = false,
	placeholder = "Select Vehicle",
	emptyText = "No vehicles",
	entityLabel = "vehicles",
	searchLabel = "Search vehicles",
	isDark = false,
	className,
	compact = false,
}: VehicleMultiSelectProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");

	const selected = useMemo(() => new Set(values.map(String)), [values]);
	const labelById = useMemo(
		() => new Map(options.map((option) => [option.id, option.name] as const)),
		[options],
	);

	const visibleOptions = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return options;
		return options.filter((option) => option.name.toLowerCase().includes(q));
	}, [options, query]);

	const triggerLabel = useMemo(() => {
		if (values.length === 0) return placeholder;
		if (values.length === 1) return labelById.get(values[0]) ?? values[0];
		return `${values.length} ${entityLabel} selected`;
	}, [entityLabel, labelById, placeholder, values]);

	useEffect(() => {
		if (!open) return;
		const onPointer = (event: MouseEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};
		document.addEventListener("mousedown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	useEffect(() => {
		if (disabled) setOpen(false);
	}, [disabled]);

	const toggle = (idValue: string) => {
		const next = new Set(selected);
		if (next.has(idValue)) next.delete(idValue);
		else next.add(idValue);
		onValuesChange(Array.from(next));
	};

	const selectAllVisible = () => {
		const next = new Set(selected);
		for (const option of visibleOptions) next.add(option.id);
		onValuesChange(Array.from(next));
	};

	const deselectAll = () => onValuesChange([]);

	const controlClass = cn(
		"flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-xs outline-none transition",
		isDark
			? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-cyan-300/35 disabled:opacity-50"
			: "border-slate-200 bg-white text-slate-700 hover:border-cyan-400 disabled:opacity-50",
		className,
	);

	const menuClass = cn(
		"absolute left-0 top-12 z-40 w-full min-w-[200px] overflow-hidden rounded-xl border shadow-[0_18px_40px_rgba(0,0,0,0.4)]",
		isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white",
	);

	return (
		<div
			ref={rootRef}
			className={cn("relative min-w-0", compact ? "flex-1 sm:max-w-[180px]" : "w-full")}
		>
			<button
				id={id}
				type="button"
				aria-expanded={open}
				aria-haspopup="listbox"
				aria-label={placeholder}
				disabled={disabled}
				onClick={() => setOpen((current) => !current)}
				className={controlClass}
			>
				<span
					className={cn(
						"truncate",
						values.length === 0 && (isDark ? "text-slate-500" : "text-slate-400"),
					)}
				>
					{triggerLabel}
				</span>
				<ChevronDown
					className={cn(
						"h-3.5 w-3.5 shrink-0 text-slate-500 transition",
						open && "rotate-180",
					)}
				/>
			</button>
			{open && !disabled && (
				<div className={menuClass}>
					<div className="p-2">
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							aria-label={searchLabel}
							autoFocus
							className={cn(
								"h-9 w-full rounded-md border px-3 text-xs outline-none",
								isDark
									? "border-white/[0.10] bg-[#03091c]/70 text-white focus:border-cyan-300/35"
									: "border-slate-200 bg-white text-slate-900 focus:border-cyan-400",
							)}
						/>
					</div>
					<div
						className={cn(
							"grid grid-cols-2 border-y text-[11px]",
							isDark ? "border-white/[0.08]" : "border-slate-200",
						)}
					>
						<button
							type="button"
							onClick={selectAllVisible}
							disabled={visibleOptions.length === 0}
							className={cn(
								"h-9 border-r font-medium transition disabled:opacity-40",
								isDark
									? "border-white/[0.08] text-slate-300 hover:bg-cyan-300/[0.08] hover:text-cyan-100"
									: "border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800",
							)}
						>
							Select All
						</button>
						<button
							type="button"
							onClick={deselectAll}
							disabled={values.length === 0}
							className={cn(
								"h-9 font-medium transition disabled:opacity-40",
								isDark
									? "text-slate-300 hover:bg-white/[0.04] hover:text-white"
									: "text-slate-700 hover:bg-slate-50",
							)}
						>
							Deselect All
						</button>
					</div>
					<ul
						role="listbox"
						aria-label={placeholder}
						aria-multiselectable="true"
						className="max-h-48 overflow-y-auto p-1"
					>
						{visibleOptions.map((option) => {
							const checked = selected.has(option.id);
							return (
								<li key={option.id}>
									<label
										className={cn(
											"flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs",
											isDark
												? "text-slate-300 hover:bg-white/[0.04]"
												: "text-slate-700 hover:bg-slate-100",
										)}
									>
										<input
											type="checkbox"
											checked={checked}
											onChange={() => toggle(option.id)}
											className="h-3.5 w-3.5 accent-cyan-300"
										/>
										<span className="min-w-0 flex-1 break-words">{option.name}</span>
									</label>
								</li>
							);
						})}
						{visibleOptions.length === 0 && (
							<li className="px-2 py-3 text-center text-[11px] text-slate-500">
								{options.length === 0 ? emptyText : "Nothing found"}
							</li>
						)}
					</ul>
				</div>
			)}
		</div>
	);
}
