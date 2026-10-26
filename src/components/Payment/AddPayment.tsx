import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { ChevronDown, X } from "lucide-react";

export type PaymentFormValues = {
	type: string;
	transporter: string;
	sellingPrice: string;
	paymentTerm: string;
	installationDate: string;
	rentalDueDate: string;
	technicianName: string;
	rental: string;
	remark: string;
};

type AddPaymentProps = {
	onClose: () => void;
	onSubmit: (values: PaymentFormValues) => void;
};

const transporters = ["Aviator", "vicky.9", "vga", "rahul.sharma"];
const typeOptions = ["One-time", "Rental"];
const termOptions = ["Monthly", "Quarterly", "Half Yearly", "Yearly"];

const today = () => {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${month}-${day}`;
};

const emptyValues = (): PaymentFormValues => ({
	type: "",
	transporter: "",
	sellingPrice: "0",
	paymentTerm: "",
	installationDate: today(),
	rentalDueDate: today(),
	technicianName: "",
	rental: "",
	remark: "",
});

export function AddPayment({ onClose, onSubmit }: AddPaymentProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const [values, setValues] = useState<PaymentFormValues>(emptyValues);
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

	const update = (key: keyof PaymentFormValues, value: string) => {
		setValues((current) => ({ ...current, [key]: value }));
		setFormError("");
	};

	const select = (key: keyof PaymentFormValues, placeholder: string, options: string[], required = false) => (
		<span className="relative block">
			<select required={required} value={values[key]} onChange={(event) => update(key, event.target.value)} className={`${inputClass} appearance-none pr-8`}>
				<option value="">{placeholder}</option>
				{options.map((option) => (
					<option key={option} value={option}>{option}</option>
				))}
			</select>
			<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
		</span>
	);

	const field = (label: string, control: ReactNode, required = false, optional = false) => (
		<label className="block min-w-0">
			<span className={labelClass}>
				{label}
				{required && <span className="ml-0.5 text-rose-400">*</span>}
				{optional && <span className="ml-1 font-normal text-slate-500">(Optional)</span>}
			</span>
			{control}
		</label>
	);

	const submit = (event: FormEvent) => {
		event.preventDefault();
		if (!values.transporter || !values.paymentTerm) {
			setFormError("Transporter and Payment Term are required.");
			return;
		}
		onSubmit(values);
	};

	return (
		<div className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6">
			<button type="button" aria-label="Close payment form" className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]" onClick={onClose} />
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
						<h2 id={titleId} className="text-[15px] font-semibold">Add Payment</h2>
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
						{field("Type", select("type", "Select", typeOptions))}
						{field("Transporter", select("transporter", "Select Transporter", transporters, true), true)}
						{field("Selling Price", <input type="number" min={0} value={values.sellingPrice} onChange={(event) => update("sellingPrice", event.target.value)} className={inputClass} />)}
						{field("Payment Term", select("paymentTerm", "Select", termOptions, true), true)}
						{field("Installation Date", <input type="date" value={values.installationDate} onChange={(event) => update("installationDate", event.target.value)} className={inputClass} />)}
						{field("Rental Due Date", <input type="date" value={values.rentalDueDate} onChange={(event) => update("rentalDueDate", event.target.value)} className={inputClass} />)}
						{field("Technician Name", <input value={values.technicianName} placeholder="Technician Name" onChange={(event) => update("technicianName", event.target.value)} className={inputClass} />, false, true)}
						{field("Rental", <input value={values.rental} placeholder="Rental" onChange={(event) => update("rental", event.target.value)} className={inputClass} />, false, true)}
						<label className="block min-w-0 sm:col-span-2">
							<span className={labelClass}>
								Remark <span className="font-normal text-slate-500">(Optional)</span>
							</span>
							<input value={values.remark} maxLength={50} placeholder="Remark" onChange={(event) => update("remark", event.target.value)} className={inputClass} />
							<span className="mt-1 block text-[11px] text-slate-500">Max 50 chars</span>
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
