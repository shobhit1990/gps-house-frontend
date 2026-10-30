import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { ChevronDown, X } from "lucide-react";
import { nowDateTimeInput } from "@/components/Reports/expenseDate";
import { useGetClientMasterQuery, useGetTransporterMasterQuery } from "@/store/services/api/Master";

export type ExpenseFormValues = {
	client: string;
	transporter: string;
	expenseName: string;
	expenseType: string;
	amount: string;
	expenseDate: string;
	odometer: string;
	engineHours: string;
	description: string;
	quantity: string;
	supplier: string;
	buyer: string;
};

type AddExpenseProps = {
	initial?: ExpenseFormValues | null;
	onClose: () => void;
	onSubmit: (values: ExpenseFormValues) => void;
};

const expenseTypes = ["Fuel", "Toll", "Maintenance", "Parking", "Other"];

const emptyValues = (): ExpenseFormValues => ({
	client: "",
	transporter: "",
	expenseName: "",
	expenseType: "",
	amount: "",
	expenseDate: nowDateTimeInput(),
	odometer: "",
	engineHours: "",
	description: "",
	quantity: "",
	supplier: "",
	buyer: "",
});

export function AddExpense({ initial, onClose, onSubmit }: AddExpenseProps) {
	const { data: clientMaster = [] } = useGetClientMasterQuery();
	const clients = clientMaster.map((client) => client.name);
	const { data: transporterMaster = [] } = useGetTransporterMasterQuery();
	const transporters = transporterMaster.map((transporter) => transporter.name);
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const [values, setValues] = useState<ExpenseFormValues>(initial ?? emptyValues);
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

	const update = <K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) => {
		setValues((current) => ({ ...current, [key]: value }));
		setFormError("");
	};

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

	const select = (key: "client" | "transporter" | "expenseType", placeholder: string, options: string[]) => (
		<span className="relative block">
			<select required value={values[key]} onChange={(event) => update(key, event.target.value)} className={`${inputClass} appearance-none pr-8`}>
				<option value="">{placeholder}</option>
				{options.map((option) => <option key={option} value={option}>{option}</option>)}
			</select>
			<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
		</span>
	);

	const submit = (event: FormEvent) => {
		event.preventDefault();
		const amount = Number(values.amount);
		if (!values.client || !values.transporter || !values.expenseType || !values.amount.trim() || !values.expenseDate) {
			setFormError("Client, Transporter, Expense Type, Amount, and Expense Date are required.");
			return;
		}
		if (Number.isNaN(amount) || amount < 0) {
			setFormError("Amount must be a number that is 0 or more.");
			return;
		}
		onSubmit({ ...values, amount: String(amount) });
	};

	return (
		<div className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6">
			<button type="button" aria-label="Close expense form" className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]" onClick={onClose} />
			<form
				onSubmit={submit}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className={`relative flex max-h-[92vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-2xl border shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
			>
				<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
					<div>
						<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Reports</p>
						<h2 id={titleId} className="text-[15px] font-semibold">{initial ? "Edit Expense" : "Add Expense"}</h2>
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
						{field("Client", select("client", "Client", clients), true)}
						{field("Transporter", select("transporter", "Transporter", transporters), true)}
						{field("Expense Name", <input value={values.expenseName} placeholder="Expense Name" onChange={(event) => update("expenseName", event.target.value)} className={inputClass} />, false, true)}
						{field("Expense Type", select("expenseType", "Select Expense Type", expenseTypes), true)}
						{field("Amount", <input required inputMode="decimal" value={values.amount} placeholder="Amount" onChange={(event) => update("amount", event.target.value.replace(/[^\d.]/g, ""))} className={inputClass} />, true)}
						{field("Expense Date", <input required type="datetime-local" value={values.expenseDate} onChange={(event) => update("expenseDate", event.target.value)} className={inputClass} />, true)}
						{field("Odometer", <input inputMode="decimal" value={values.odometer} placeholder="Odometer" onChange={(event) => update("odometer", event.target.value.replace(/[^\d.]/g, ""))} className={inputClass} />, false, true)}
						{field("Engine Hours", <input inputMode="decimal" value={values.engineHours} placeholder="Engine Hours" onChange={(event) => update("engineHours", event.target.value.replace(/[^\d.]/g, ""))} className={inputClass} />, false, true)}
						{field("Description", <input value={values.description} placeholder="Description" onChange={(event) => update("description", event.target.value)} className={inputClass} />, false, true)}
						{field("Quantity", <input inputMode="decimal" value={values.quantity} placeholder="Quantity" onChange={(event) => update("quantity", event.target.value.replace(/[^\d.]/g, ""))} className={inputClass} />, false, true)}
						{field("Supplier", <input value={values.supplier} placeholder="Supplier" onChange={(event) => update("supplier", event.target.value)} className={inputClass} />, false, true)}
						{field("Buyer", <input value={values.buyer} placeholder="Buyer" onChange={(event) => update("buyer", event.target.value)} className={inputClass} />, false, true)}
					</div>
				</div>

				<footer className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"}`}>
					<button type="button" onClick={() => { setValues(initial ?? emptyValues()); setFormError(""); }} className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.10] text-violet-100 hover:bg-violet-300/[0.16]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
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
