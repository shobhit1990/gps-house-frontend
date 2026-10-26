import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Plus, Search } from "lucide-react";
import { vehicles } from "@/components/data/vehicles";

export type ServiceMaintenanceMode = "custom" | "template";

export type ServiceMaintenanceValues = {
	mode: ServiceMaintenanceMode;
	serviceName: string;
	vehicleNo: string;
	remark: string;
	odometerEnabled: boolean;
	odometerInterval: string;
	lastServiceOdometer: string;
	engineEnabled: boolean;
	engineInterval: string;
	lastServiceEngine: string;
	daysEnabled: boolean;
	daysInterval: string;
	lastServiceDate: string;
	odometerLeftEnabled: boolean;
	odometerLeft: string;
	engineLeftEnabled: boolean;
	engineLeft: string;
	daysLeftEnabled: boolean;
	daysLeft: string;
	updateRecord: boolean;
	notifyMobile: boolean;
	documentName: string;
	visibleToDriver: boolean;
	templateName: string;
	purchaseDate: string;
	thresholdKm: string;
	thresholdDays: string;
};

export type ServiceMaintenanceHandle = {
	reset: () => void;
	submit: () => { error: string } | { values: ServiceMaintenanceValues };
};

const vehicleOptions = vehicles.map((vehicle) => vehicle.vehicle);
const templates = ["General Service", "Engine Oil", "Tyre Check"];

const today = () => {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${month}-${day}`;
};

const emptyValues = (): ServiceMaintenanceValues => ({
	mode: "custom",
	serviceName: "",
	vehicleNo: "",
	remark: "",
	odometerEnabled: false,
	odometerInterval: "",
	lastServiceOdometer: "",
	engineEnabled: false,
	engineInterval: "",
	lastServiceEngine: "",
	daysEnabled: false,
	daysInterval: "",
	lastServiceDate: "",
	odometerLeftEnabled: false,
	odometerLeft: "",
	engineLeftEnabled: false,
	engineLeft: "",
	daysLeftEnabled: false,
	daysLeft: "",
	updateRecord: false,
	notifyMobile: false,
	documentName: "",
	visibleToDriver: false,
	templateName: "",
	purchaseDate: today(),
	thresholdKm: "",
	thresholdDays: "",
});

export const ServiceMaintenanceForm = forwardRef<ServiceMaintenanceHandle>(function ServiceMaintenanceForm(_props, ref) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const menuRef = useRef<HTMLDivElement>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const [mode, setMode] = useState<ServiceMaintenanceMode | "">("");
	const [menuOpen, setMenuOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [values, setValues] = useState<ServiceMaintenanceValues>(emptyValues);

	useEffect(() => {
		if (!menuOpen) return;
		const onPointerDown = (event: MouseEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
		};
		document.addEventListener("mousedown", onPointerDown);
		return () => document.removeEventListener("mousedown", onPointerDown);
	}, [menuOpen]);

	const inputClass = (disabled = false) =>
		`h-[37px] w-full rounded-lg border px-3 text-[12px] outline-none transition focus:ring-2 ${
			disabled
				? isDark
					? "cursor-not-allowed border-white/[0.06] bg-white/[0.03] text-slate-600"
					: "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
				: isDark
					? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08] [color-scheme:dark]"
					: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
		}`;
	const labelClass = `text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;
	const sectionClass = `mt-6 border-t pt-5 text-[13px] font-semibold ${isDark ? "border-white/[0.08] text-white" : "border-slate-200 text-slate-900"}`;

	const patch = (next: Partial<ServiceMaintenanceValues>) => setValues((current) => ({ ...current, ...next }));

	const chooseMode = (nextMode: ServiceMaintenanceMode) => {
		setMode(nextMode);
		setMenuOpen(false);
		setQuery("");
		patch({ mode: nextMode });
	};

	const clearFile = () => {
		patch({ documentName: "" });
		if (fileRef.current) fileRef.current.value = "";
	};

	const reset = () => {
		setMode("");
		setMenuOpen(false);
		setQuery("");
		setValues(emptyValues());
		if (fileRef.current) fileRef.current.value = "";
	};

	useImperativeHandle(ref, () => ({
		reset,
		submit: () => {
			if (!mode) return { error: "Select a type." };
			if (mode === "custom") {
				if (!values.serviceName.trim() || !values.vehicleNo) return { error: "Service Name and Vehicle are required." };
			} else if (!values.vehicleNo || !values.templateName || !values.purchaseDate || !values.thresholdKm.trim() || !values.thresholdDays.trim()) {
				return { error: "Vehicle, Maintenance Template, Purchase Date, Threshold Km, and Threshold Days are required." };
			}
			return { values: { ...values, mode, serviceName: values.serviceName.trim() } };
		},
	}));

	const search = query.trim().toLowerCase();
	const showCustom = !search || "add custom".includes(search);
	const showTemplate = !search || "maintenance template".includes(search);
	const selectedLabel = mode === "custom" ? "+ Add Custom" : mode === "template" ? "Maintenance Template" : "Select";

	const checkInput = (label: string, checked: boolean, onCheck: (checked: boolean) => void, input: ReactNode) => (
		<div>
			<label className={`flex items-center gap-2 ${labelClass}`}>
				<input type="checkbox" checked={checked} onChange={(event) => onCheck(event.target.checked)} className="h-4 w-4 accent-cyan-500" />
				{label}
			</label>
			<div className="mt-2">{input}</div>
		</div>
	);

	return (
		<div>
			<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
				<div ref={menuRef} className="relative">
					<span className={`mb-1.5 flex items-center gap-1 ${labelClass}`}>
						Select Type <span className="text-rose-400">*</span>
					</span>
					<button
						type="button"
						aria-haspopup="listbox"
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((open) => !open)}
						className={`${inputClass()} flex items-center justify-between text-left`}
					>
						<span className={mode ? "" : isDark ? "text-slate-500" : "text-slate-400"}>{selectedLabel}</span>
						<span className="text-slate-500">⌄</span>
					</button>
					{menuOpen && (
						<div className={`mt-2 rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
							<label className="relative mb-2 block">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label="Search service type" className={`${inputClass()} pl-8`} />
							</label>
							{showCustom && (
								<button type="button" onClick={() => chooseMode("custom")} className={`mb-1 flex h-9 w-full items-center gap-2 rounded-lg border px-3 text-[12px] font-semibold ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
									<Plus className="h-3.5 w-3.5" /> Add Custom
								</button>
							)}
							{showTemplate && (
								<button type="button" onClick={() => chooseMode("template")} className={`flex h-9 w-full items-center rounded-lg px-3 text-left text-[12px] ${isDark ? "text-slate-200 hover:bg-white/[0.05]" : "text-slate-700 hover:bg-slate-50"}`}>
									Maintenance Template
								</button>
							)}
							{!showCustom && !showTemplate && <p className="px-2 py-3 text-center text-[12px] text-slate-500">No type matches.</p>}
						</div>
					)}
				</div>

				{mode === "custom" && (
					<label className={labelClass}>
						<span className="mb-1.5 flex items-center gap-1">Service Name <span className="text-rose-400">*</span></span>
						<input required value={values.serviceName} placeholder="Service Name" onChange={(event) => patch({ serviceName: event.target.value })} className={inputClass()} />
					</label>
				)}
				{mode === "template" && (
					<label className={labelClass}>
						<span className="mb-1.5 flex items-center gap-1">Vehicle <span className="text-rose-400">*</span></span>
						<select required value={values.vehicleNo} onChange={(event) => patch({ vehicleNo: event.target.value })} className={inputClass()}>
							<option value="">Select Vehicle</option>
							{vehicleOptions.map((vehicle) => <option key={vehicle}>{vehicle}</option>)}
						</select>
					</label>
				)}
				{mode === "custom" && (
					<label className={labelClass}>
						<span className="mb-1.5 flex items-center gap-1">Vehicle <span className="text-rose-400">*</span></span>
						<select required value={values.vehicleNo} onChange={(event) => patch({ vehicleNo: event.target.value })} className={inputClass()}>
							<option value="">Select Vehicle</option>
							{vehicleOptions.map((vehicle) => <option key={vehicle}>{vehicle}</option>)}
						</select>
					</label>
				)}
				{mode === "custom" && (
					<label className={labelClass}>
						<span className="mb-1.5 block">Remark</span>
						<input value={values.remark} placeholder="Remark" onChange={(event) => patch({ remark: event.target.value })} className={inputClass()} />
					</label>
				)}
				{mode === "template" && (
					<label className={labelClass}>
						<span className="mb-1.5 flex items-center gap-1">Maintenance Template <span className="text-rose-400">*</span></span>
						<select required value={values.templateName} onChange={(event) => patch({ templateName: event.target.value })} className={inputClass()}>
							<option value="">Select Template</option>
							{templates.map((template) => <option key={template}>{template}</option>)}
						</select>
					</label>
				)}
				{mode === "template" && (
					<label className={labelClass}>
						<span className="mb-1.5 flex items-center gap-1">Purchase Date <span className="text-rose-400">*</span></span>
						<input required type="date" value={values.purchaseDate} onChange={(event) => patch({ purchaseDate: event.target.value })} className={inputClass()} />
					</label>
				)}
				{mode === "template" && (
					<label className={labelClass}>
						<span className="mb-1.5 flex items-center gap-1">Threshold Km <span className="text-rose-400">*</span></span>
						<input required value={values.thresholdKm} placeholder="Threshold Km" onChange={(event) => patch({ thresholdKm: event.target.value })} className={inputClass()} />
					</label>
				)}
				{mode === "template" && (
					<label className={labelClass}>
						<span className="mb-1.5 flex items-center gap-1">Threshold Days <span className="text-rose-400">*</span></span>
						<input required value={values.thresholdDays} placeholder="Threshold Days" onChange={(event) => patch({ thresholdDays: event.target.value })} className={inputClass()} />
					</label>
				)}
			</div>

			{mode === "custom" && (
				<>
					<h3 className={sectionClass}>Service Interval</h3>
					<div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
						{checkInput("Odometer Interval", values.odometerEnabled, (checked) => patch({ odometerEnabled: checked, odometerInterval: checked ? values.odometerInterval : "", lastServiceOdometer: checked ? values.lastServiceOdometer : "" }), <input disabled={!values.odometerEnabled} value={values.odometerInterval} placeholder="Odometer Interval" onChange={(event) => patch({ odometerInterval: event.target.value })} className={inputClass(!values.odometerEnabled)} />)}
						<label className={labelClass}>
							<span className="mb-1.5 block">Last Service Odometer</span>
							<input disabled={!values.odometerEnabled} value={values.lastServiceOdometer} placeholder="Last Service Odometer" onChange={(event) => patch({ lastServiceOdometer: event.target.value })} className={inputClass(!values.odometerEnabled)} />
						</label>
						{checkInput("Engine Interval", values.engineEnabled, (checked) => patch({ engineEnabled: checked, engineInterval: checked ? values.engineInterval : "", lastServiceEngine: checked ? values.lastServiceEngine : "" }), <input disabled={!values.engineEnabled} value={values.engineInterval} placeholder="Engine Interval" onChange={(event) => patch({ engineInterval: event.target.value })} className={inputClass(!values.engineEnabled)} />)}
						<label className={labelClass}>
							<span className="mb-1.5 block">Last Service Engine</span>
							<input disabled={!values.engineEnabled} value={values.lastServiceEngine} placeholder="Last Service Engine" onChange={(event) => patch({ lastServiceEngine: event.target.value })} className={inputClass(!values.engineEnabled)} />
						</label>
						{checkInput("Days Interval", values.daysEnabled, (checked) => patch({ daysEnabled: checked, daysInterval: checked ? values.daysInterval : "", lastServiceDate: checked ? values.lastServiceDate : "" }), <input disabled={!values.daysEnabled} value={values.daysInterval} placeholder="Days Interval" onChange={(event) => patch({ daysInterval: event.target.value })} className={inputClass(!values.daysEnabled)} />)}
						<label className={labelClass}>
							<span className="mb-1.5 block">Last Service Date</span>
							<input disabled={!values.daysEnabled} type="date" value={values.lastServiceDate} onChange={(event) => patch({ lastServiceDate: event.target.value })} className={inputClass(!values.daysEnabled)} />
						</label>
					</div>

					<h3 className={sectionClass}>Service Trigger</h3>
					<div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
						{checkInput("Odometer Left", values.odometerLeftEnabled, (checked) => patch({ odometerLeftEnabled: checked, odometerLeft: checked ? values.odometerLeft : "" }), <input disabled={!values.odometerLeftEnabled} value={values.odometerLeft} placeholder="Odometer Left" onChange={(event) => patch({ odometerLeft: event.target.value })} className={inputClass(!values.odometerLeftEnabled)} />)}
						{checkInput("Engine Left", values.engineLeftEnabled, (checked) => patch({ engineLeftEnabled: checked, engineLeft: checked ? values.engineLeft : "" }), <input disabled={!values.engineLeftEnabled} value={values.engineLeft} placeholder="Engine Left" onChange={(event) => patch({ engineLeft: event.target.value })} className={inputClass(!values.engineLeftEnabled)} />)}
						{checkInput("Days Left", values.daysLeftEnabled, (checked) => patch({ daysLeftEnabled: checked, daysLeft: checked ? values.daysLeft : "" }), <input disabled={!values.daysLeftEnabled} value={values.daysLeft} placeholder="Days Left" onChange={(event) => patch({ daysLeft: event.target.value })} className={inputClass(!values.daysLeftEnabled)} />)}
						<label className={`flex h-[37px] items-center gap-2 self-end ${labelClass}`}>
							<input type="checkbox" checked={values.updateRecord} onChange={(event) => patch({ updateRecord: event.target.checked })} className="h-4 w-4 accent-cyan-500" />
							Update Record
						</label>
					</div>

					<h3 className={sectionClass}>Service Notifications</h3>
					<label className={`mt-4 flex items-center gap-2 ${labelClass}`}>
						<input type="checkbox" checked={values.notifyMobile} onChange={(event) => patch({ notifyMobile: event.target.checked })} className="h-4 w-4 accent-cyan-500" />
						Mobile
					</label>
				</>
			)}

			{mode && (
				<div>
					{mode === "custom" && <h3 className={sectionClass}>Service Documents</h3>}
					<label className={`mt-4 block ${labelClass}`}>
						<span className="mb-1.5 block">Upload Document <span className="font-normal text-slate-500">(Optional)</span></span>
						<span className="flex flex-wrap items-center gap-3">
							<input
								ref={fileRef}
								type="file"
								aria-label="Upload Document"
								onChange={(event) => patch({ documentName: event.target.files?.[0]?.name ?? "" })}
								className={`h-[37px] min-w-[240px] flex-1 rounded-lg border px-2 text-[12px] file:mr-3 file:rounded-md file:border-0 file:bg-transparent file:text-[12px] file:font-medium ${isDark ? "border-white/[0.09] bg-[#03091c]/70 text-slate-400 file:text-slate-200" : "border-slate-200 bg-white text-slate-600 file:text-slate-700"}`}
							/>
							<button type="button" onClick={clearFile} className={`h-[37px] rounded-lg border px-4 text-[12px] font-semibold ${isDark ? "border-violet-300/20 bg-violet-300/[0.10] text-violet-100 hover:bg-violet-300/[0.16]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
								Delete
							</button>
							{mode === "custom" && (
								<span className="flex items-center gap-2">
									<input type="checkbox" checked={values.visibleToDriver} onChange={(event) => patch({ visibleToDriver: event.target.checked })} className="h-4 w-4 accent-cyan-500" />
									Allow visibility to driver
								</span>
							)}
						</span>
					</label>
				</div>
			)}
		</div>
	);
});
