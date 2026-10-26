import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { ChevronDown, X } from "lucide-react";

export type TechnicianFormValues = {
	username: string;
	password: string;
	confirmPassword: string;
	company: string;
	timezone: string;
	name: string;
	email: string;
	phone: string;
	address: string;
	allowAllVehicles: boolean;
	active: boolean;
};

type AddTechnicianListProps = {
	onClose: () => void;
	onSubmit: (values: TechnicianFormValues) => void;
};

const timezones = ["(GMT+5:30) Asia/Calcutta", "(GMT+0:00) UTC", "(GMT-5:00) America/New_York"];
const usernamePattern = /^[A-Za-z0-9_.*@-]+$/;

const emptyValues = (): TechnicianFormValues => ({
	username: "",
	password: "",
	confirmPassword: "",
	company: "",
	timezone: timezones[0],
	name: "",
	email: "",
	phone: "",
	address: "",
	allowAllVehicles: false,
	active: true,
});

export function AddTechnicianList({ onClose, onSubmit }: AddTechnicianListProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const [values, setValues] = useState<TechnicianFormValues>(emptyValues);
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

	const update = <K extends keyof TechnicianFormValues>(key: K, value: TechnicianFormValues[K]) => {
		setValues((current) => ({ ...current, [key]: value }));
		setFormError("");
	};

	const field = (label: string, control: ReactNode, required = false, optional = false, hint?: string) => (
		<label className="block min-w-0">
			<span className={labelClass}>
				{label}
				{required && <span className="ml-0.5 text-rose-400">*</span>}
				{optional && <span className="ml-1 font-normal text-slate-500">(Optional)</span>}
			</span>
			{control}
			{hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
		</label>
	);

	const submit = (event: FormEvent) => {
		event.preventDefault();
		if (!values.username.trim() || !values.password || !values.confirmPassword || !values.company.trim() || !values.timezone) {
			setFormError("Username, Password, Confirm Password, Company Name, and Timezone are required.");
			return;
		}
		if (!usernamePattern.test(values.username.trim())) {
			setFormError("Username can only contain A-z, 0-9, _, -, ., *, and @.");
			return;
		}
		if (values.password !== values.confirmPassword) {
			setFormError("Password and Confirm Password must match.");
			return;
		}
		onSubmit({ ...values, username: values.username.trim() });
	};

	return (
		<div className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6">
			<button type="button" aria-label="Close technician form" className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]" onClick={onClose} />
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
						<h2 id={titleId} className="text-[15px] font-semibold">Add Technician</h2>
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
						{field("Username", <input required value={values.username} placeholder="Username" onChange={(event) => update("username", event.target.value)} className={inputClass} />, true, false, "Only contains [ A-z, 0-9, _, -, ., *, @ ]")}
						{field("Password", <input required type="password" value={values.password} placeholder="Password" onChange={(event) => update("password", event.target.value)} className={inputClass} />, true)}
						{field("Confirm Password", <input required type="password" value={values.confirmPassword} placeholder="Confirm Password" onChange={(event) => update("confirmPassword", event.target.value)} className={inputClass} />, true)}
						{field("Company Name", <input required value={values.company} placeholder="Company Name" onChange={(event) => update("company", event.target.value)} className={inputClass} />, true)}
						<label className="block min-w-0">
							<span className={labelClass}>Timezone <span className="text-rose-400">*</span></span>
							<span className="relative block">
								<select required value={values.timezone} onChange={(event) => update("timezone", event.target.value)} className={`${inputClass} appearance-none pr-8`}>
									{timezones.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</span>
						</label>
						{field("Name", <input value={values.name} placeholder="Name" onChange={(event) => update("name", event.target.value)} className={inputClass} />, false, true)}
						{field("Email", <input type="email" value={values.email} placeholder="Email" onChange={(event) => update("email", event.target.value)} className={inputClass} />, false, true)}
						{field("Phone", <input value={values.phone} placeholder="Phone" onChange={(event) => update("phone", event.target.value)} className={inputClass} />, false, true)}
						<label className="block min-w-0 sm:col-span-2">
							<span className={labelClass}>Address <span className="font-normal text-slate-500">(Optional)</span></span>
							<input value={values.address} placeholder="Address" onChange={(event) => update("address", event.target.value)} className={inputClass} />
						</label>
					</div>
					<div className="mt-5 flex flex-col gap-2.5">
						<label className={`flex cursor-pointer items-center gap-2.5 text-[12px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>
							<input type="checkbox" checked={values.allowAllVehicles} onChange={(event) => update("allowAllVehicles", event.target.checked)} className="h-3.5 w-3.5 accent-cyan-300" />
							Allow access to all vehicle list
						</label>
						<label className={`flex cursor-pointer items-center gap-2.5 text-[12px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>
							<input type="checkbox" checked={values.active} onChange={(event) => update("active", event.target.checked)} className="h-3.5 w-3.5 accent-cyan-300" />
							Active
						</label>
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
