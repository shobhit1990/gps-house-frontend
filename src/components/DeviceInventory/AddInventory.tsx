import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { ChevronDown, X } from "lucide-react";

export type InventoryFormValues = {
	inventoryType: string;
	imei: string;
	sim: string;
	operator: string;
	secondarySim: string;
	secondarySimOperator: string;
	deviceType: string;
	assignType: string;
	password: string;
	active: boolean;
	ignitionWire: boolean;
	airConditionWire: boolean;
	analogSensor: boolean;
};

type AddInventoryProps = {
	onClose: () => void;
	onSubmit: (values: InventoryFormValues) => void;
};

const inventoryTypes = ["GPS Device", "Dashcam", "Fuel Sensor"];
const operators = ["Airtel Gprs (airtelgprs.com)"];
const deviceTypes = ["Concox (8505)"];
const assignTypes = ["Self", "Technician", "Client"];

const emptyValues = (): InventoryFormValues => ({
	inventoryType: "",
	imei: "",
	sim: "",
	operator: operators[0],
	secondarySim: "",
	secondarySimOperator: operators[0],
	deviceType: deviceTypes[0],
	assignType: "",
	password: "",
	active: true,
	ignitionWire: false,
	airConditionWire: false,
	analogSensor: false,
});

const digitsOnly = (value: string) => value.replace(/\D/g, "").slice(0, 24);

export function AddInventory({ onClose, onSubmit }: AddInventoryProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const [values, setValues] = useState<InventoryFormValues>(emptyValues);
	const [formError, setFormError] = useState("");

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const inputClass = `h-9 w-full rounded-md border px-3 text-[12px] outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const labelClass = `mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;
	const hintClass = "mt-1 block text-[11px] text-slate-500";

	const update = <K extends keyof InventoryFormValues>(key: K, value: InventoryFormValues[K]) => {
		setValues((current) => ({ ...current, [key]: value }));
		setFormError("");
	};

	const select = (key: keyof InventoryFormValues, placeholder: string, options: string[], required = false) => (
		<span className="relative block">
			<select required={required} value={String(values[key])} onChange={(event) => update(key, event.target.value)} className={`${inputClass} appearance-none pr-8`}>
				<option value="">{placeholder}</option>
				{options.map((option) => (
					<option key={option} value={option}>{option}</option>
				))}
			</select>
			<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
		</span>
	);

	const field = (label: string, control: ReactNode, required = false, hint?: string, optional = false) => (
		<label className="block min-w-0">
			<span className={labelClass}>
				{label}
				{required && <span className="ml-0.5 text-rose-400">*</span>}
				{optional && <span className="ml-1 font-normal text-slate-500">(Optional)</span>}
			</span>
			{control}
			{hint && <span className={hintClass}>{hint}</span>}
		</label>
	);

	const submit = (event: FormEvent) => {
		event.preventDefault();
		if (!values.inventoryType || !values.operator || !values.deviceType || !values.assignType) {
			setFormError("Inventory Type, Sim Operator, Device Type, and Assign Type are required.");
			return;
		}
		onSubmit(values);
	};

	const check = (key: "active" | "ignitionWire" | "airConditionWire" | "analogSensor", label: string) => (
		<label className={`flex cursor-pointer items-center gap-2.5 text-[12px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>
			<input type="checkbox" checked={values[key]} onChange={(event) => update(key, event.target.checked)} className="h-3.5 w-3.5 accent-cyan-300" />
			{label}
		</label>
	);

	return (
		<div className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6">
			<button type="button" aria-label="Close inventory form" className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]" onClick={onClose} />
			<form
				onSubmit={submit}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className={`relative flex max-h-[92vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-2xl border shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
			>
				<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
					<div>
						<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Fleet operations</p>
						<h2 id={titleId} className="text-[15px] font-semibold">Inventory Add</h2>
					</div>
					<button type="button" onClick={onClose} aria-label="Close" className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
						<X className="h-5 w-5 stroke-[3]" />
					</button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
					{formError && (
						<p role="alert" className={`mb-5 rounded-lg border px-3 py-2 text-[12px] ${isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
							{formError}
						</p>
					)}
					<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
						{field("Inventory Type", select("inventoryType", "Inventory Type", inventoryTypes, true), true)}
						{field("Imei", <input value={values.imei} maxLength={30} placeholder="Device Imei" onChange={(event) => update("imei", event.target.value)} className={inputClass} />, false, "Max 30 characters allowed")}
						{field("Sim Number", <input value={values.sim} inputMode="numeric" placeholder="Sim Number" onChange={(event) => update("sim", digitsOnly(event.target.value))} className={inputClass} />, false, "Only contains 24 digit")}
						{field("Sim Operator", select("operator", "Select", operators, true), true)}
						{field("Secondary Sim Number", <input value={values.secondarySim} inputMode="numeric" placeholder="Sim Number" onChange={(event) => update("secondarySim", digitsOnly(event.target.value))} className={inputClass} />, false, "Only contains 24 digit")}
						{field("Secondary Sim Operator", select("secondarySimOperator", "Select", operators))}
						{field("Device Type", select("deviceType", "Select", deviceTypes, true), true)}
						{field("Select Assign Type", select("assignType", "Select", assignTypes, true), true)}
						{field("Password", <input type="password" value={values.password} placeholder="Password" onChange={(event) => update("password", event.target.value)} className={inputClass} />, false, undefined, true)}
					</div>
					<div className="mt-5 flex flex-col gap-2.5">
						{check("active", "Active")}
						{check("ignitionWire", "Ignition wire connected in power(+)")}
						{check("airConditionWire", "Air condition wire connected in power(+)")}
						{check("analogSensor", "Analog Sensor")}
					</div>
				</div>

				<footer className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"}`}>
					<button type="button" onClick={() => { setValues(emptyValues()); setFormError(""); }} className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.10] text-violet-100 hover:bg-violet-300/[0.16]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
						Reset
					</button>
					<button type="submit" className={`h-9 rounded-lg border px-4 text-[12px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
						Save
					</button>
				</footer>
			</form>
		</div>
	);
}
