import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ChevronDown, Loader2, X } from "lucide-react";
import { Status } from "@/enums/Status";
import type { MasterOption } from "@/interfaces/EntityMaster";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useCreateJobSheetMutation } from "@/store/services/api/JobSheet";
import { useGetTechnicianMasterQuery, useGetVehicleMasterQuery } from "@/store/services/api/Master";

export type JobSheetFormValues = {
	vehicle: string;
	technician: string;
	contactPerson: string;
	phone: string;
	instruction: string;
};

type AddJobSheetProps = {
	onClose: () => void;
	onSaved: () => void;
};

const emptyValues = (): JobSheetFormValues => ({
	vehicle: "",
	technician: "",
	contactPerson: "",
	phone: "",
	instruction: "",
});

export function AddJobSheet({ onClose, onSaved }: AddJobSheetProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const { data: vehicles = [] } = useGetVehicleMasterQuery();
	const { data: technicians = [] } = useGetTechnicianMasterQuery();
	const [createJobSheet, { isLoading: isSaving }] = useCreateJobSheetMutation();
	const [values, setValues] = useState<JobSheetFormValues>(emptyValues);
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

	const update = (key: keyof JobSheetFormValues, value: string) => {
		setValues((current) => ({ ...current, [key]: value }));
		setFormError("");
	};

	const field = (label: string, control: ReactNode, required = false) => (
		<label className="block min-w-0">
			<span className={labelClass}>
				{label}
				{required && <span className="ml-0.5 text-rose-400">*</span>}
			</span>
			{control}
		</label>
	);

	const select = (key: keyof JobSheetFormValues, placeholder: string, options: MasterOption[], required = false) => (
		<span className="relative block">
			<select required={required} value={values[key]} onChange={(event) => update(key, event.target.value)} className={`${inputClass} appearance-none pr-8`}>
				<option value="">{placeholder}</option>
				{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
			</select>
			<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
		</span>
	);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (!values.vehicle || !values.technician || !values.contactPerson.trim() || !values.phone.trim()) {
			setFormError("Vehicle, Technician Name, Contact Person Name, and Phone No. are required.");
			return;
		}
		try {
			await createJobSheet({
				vehicle: values.vehicle,
				technician: values.technician,
				contactPersonName: values.contactPerson.trim(),
				phone: values.phone.trim(),
				instruction: values.instruction.trim() || undefined,
				status: Status.ACTIVE,
				reason: "New jobsheet created",
			}).unwrap();
			toast.success("Job sheet added.");
			onSaved();
		} catch (error) {
			console.error("Failed to create job sheet.", error);
			setFormError(apiErrorMessage(error, "Could not save the job sheet. Please try again."));
		}
	};

	return (
		<div className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6">
			<button type="button" aria-label="Close job sheet form" className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]" onClick={onClose} />
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
						<h2 id={titleId} className="text-[15px] font-semibold">Add Job Sheet</h2>
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
						{field("Vehicle", select("vehicle", "Select Vehicle", vehicles, true), true)}
						{field("Technician Name", select("technician", "Select Technician", technicians, true), true)}
						{field("Contact Person Name", <input required value={values.contactPerson} placeholder="Contact Person Name" onChange={(event) => update("contactPerson", event.target.value)} className={inputClass} />, true)}
						{field("Phone No.", <input required value={values.phone} placeholder="Phone No." onChange={(event) => update("phone", event.target.value)} className={inputClass} />, true)}
						<label className="block min-w-0 sm:col-span-2 xl:col-span-4">
							<span className={labelClass}>Instruction</span>
							<textarea value={values.instruction} placeholder="Landmark / Timing / Remark" rows={4} onChange={(event) => update("instruction", event.target.value)} className={`w-full resize-y rounded-md border px-3 py-2 text-[12px] outline-none transition focus:ring-2 ${isDark ? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10" : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"}`} />
						</label>
					</div>
				</div>

				<footer className={`flex shrink-0 items-center justify-end border-t px-5 py-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"}`}>
					<button type="submit" disabled={isSaving} className={`flex h-9 items-center gap-2 rounded-lg border px-4 text-[12px] font-semibold transition disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
						{isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
						Save
					</button>
				</footer>
			</form>
		</div>
	);
}
