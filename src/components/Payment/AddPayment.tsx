import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { ChevronDown, Loader2, X } from "lucide-react";
import { PaymentDetailsType, paymentDetailsTypeOptions } from "@/enums/PaymentDetailsType";
import { paymentTermOptions } from "@/enums/PaymentTerm";
import type { CreatePaymentDetailsRequest, PaymentDetails } from "@/interfaces/PaymentDetails";
import { decimalOnly } from "@/lib/formValidation";
import { useGetTransporterMasterQuery, useGetVehicleMasterQuery } from "@/store/services/api/Master";
import {
	buildPaymentPayload,
	emptyPaymentForm,
	formFromPayment,
	type PaymentFormState,
} from "@/components/Payment/paymentFormHelpers";

export type PaymentFormValues = CreatePaymentDetailsRequest;

type AddPaymentProps = {
	onClose: () => void;
	onSubmit: (values: PaymentFormValues) => void | Promise<void>;
	initialValues?: PaymentDetails;
	isSaving?: boolean;
};

export function AddPayment({ onClose, onSubmit, initialValues, isSaving = false }: AddPaymentProps) {
	const { data: transporterMaster = [], isLoading: transportersLoading } = useGetTransporterMasterQuery();
	const { data: vehicleMaster = [], isLoading: vehiclesLoading } = useGetVehicleMasterQuery();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const isEdit = Boolean(initialValues);

	const [form, setForm] = useState<PaymentFormState>(emptyPaymentForm);
	const [formError, setFormError] = useState("");

	const isVehicleType = form.type === PaymentDetailsType.VEHICLE;

	const vehicleOptions = useMemo(() => {
		if (!form.transporter) return [];
		return vehicleMaster.filter((item) => item.transporterId === form.transporter);
	}, [form.transporter, vehicleMaster]);

	const update = <K extends keyof PaymentFormState>(key: K, value: PaymentFormState[K]) => {
		setForm((current) => {
			const next = { ...current, [key]: value };
			if (key === "type" && value !== PaymentDetailsType.VEHICLE) next.vehicle = "";
			if (key === "transporter") next.vehicle = "";
			return next;
		});
		setFormError("");
	};

	const hydrate = (payment?: PaymentDetails) => {
		setForm(payment ? formFromPayment(payment, transporterMaster, vehicleMaster) : emptyPaymentForm());
		setFormError("");
	};

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !isSaving) onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [isSaving, onClose]);

	useEffect(() => {
		if (!initialValues) return;
		hydrate(initialValues);
		// Re-run when master loads so transporter/vehicle selects can resolve ids.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialValues, transporterMaster, vehicleMaster]);

	useEffect(() => {
		if (!form.vehicle) return;
		if (vehicleOptions.some((item) => item.id === form.vehicle)) return;
		setForm((current) => ({ ...current, vehicle: "" }));
	}, [form.vehicle, vehicleOptions]);

	const inputClass = `h-9 w-full rounded-md border px-3 text-[12px] outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const labelClass = `mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

	const field = (label: string, control: ReactNode, required = false, optional = false) => (
		<label className="block min-w-0">
			<span className={labelClass}>
				{label}
				{required ? <span className="ml-0.5 text-rose-400">*</span> : null}
				{optional ? <span className="ml-1 font-normal text-slate-500">(Optional)</span> : null}
			</span>
			{control}
		</label>
	);

	const selectControl = (
		key: keyof PaymentFormState,
		placeholder: string,
		options: readonly { value: string; label: string }[],
		disabled = false,
	) => (
		<span className="relative block">
			<select
				required
				value={String(form[key] ?? "")}
				disabled={disabled}
				onChange={(event) => update(key, event.target.value as PaymentFormState[typeof key])}
				className={`${inputClass} appearance-none pr-8 disabled:opacity-60`}
			>
				<option value="">{placeholder}</option>
				{options.map((option) => (
					<option key={option.value} value={option.value}>{option.label}</option>
				))}
			</select>
			<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
		</span>
	);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		const result = buildPaymentPayload(form);
		if (result.error) {
			setFormError(result.error);
			return;
		}
		await onSubmit(result.payload);
	};

	return (
		<div className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6">
			<button
				type="button"
				aria-label="Close payment form"
				className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]"
				onClick={() => {
					if (!isSaving) onClose();
				}}
			/>
			<form
				onSubmit={(event) => void submit(event)}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className={`relative flex max-h-[92vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-2xl border shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
			>
				<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
					<div>
						<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>
							Fleet operations
						</p>
						<h2 id={titleId} className="text-[15px] font-semibold">
							{isEdit ? "Edit Payment" : "Add Payment"}
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isSaving}
						aria-label="Close"
						className={`rounded-lg p-1.5 transition disabled:opacity-40 ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
					>
						<X className="h-5 w-5 stroke-[3]" />
					</button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
					{formError ? (
						<p
							role="alert"
							className={`mb-5 rounded-lg border px-3 py-2 text-[12px] ${isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}
						>
							{formError}
						</p>
					) : null}

					<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
						{field("Type", selectControl("type", "Select", paymentDetailsTypeOptions), true)}
						{field(
							"Transporter",
							selectControl(
								"transporter",
								transportersLoading ? "Loading..." : "Select Transporter",
								transporterMaster.map((item) => ({ value: item.id, label: item.name })),
								transportersLoading,
							),
							true,
						)}
						{isVehicleType
							? field(
									"Vehicle",
									selectControl(
										"vehicle",
										!form.transporter
											? "Select transporter first"
											: vehiclesLoading
												? "Loading..."
												: vehicleOptions.length === 0
													? "No vehicles"
													: "Select Vehicle",
										vehicleOptions.map((item) => ({ value: item.id, label: item.name })),
										!form.transporter || vehiclesLoading,
									),
									true,
								)
							: null}
						{field(
							"Selling Price",
							<input
								type="text"
								inputMode="decimal"
								value={form.sellingPrice}
								onChange={(event) => update("sellingPrice", decimalOnly(event.target.value))}
								className={inputClass}
							/>,
						)}
						{field("Payment Term", selectControl("paymentTerm", "Select", paymentTermOptions), true)}
						{field(
							"Installation Date",
							<input
								type="date"
								value={form.installationDate}
								onChange={(event) => update("installationDate", event.target.value)}
								className={inputClass}
							/>,
						)}
						{field(
							"Rental Due Date",
							<input
								type="date"
								value={form.rentalDueDate}
								onChange={(event) => update("rentalDueDate", event.target.value)}
								className={inputClass}
							/>,
						)}
						{field(
							"Technician Name",
							<input
								value={form.technicianName}
								placeholder="Technician Name"
								onChange={(event) => update("technicianName", event.target.value)}
								className={inputClass}
							/>,
							false,
							true,
						)}
						{field(
							"Rental",
							<input
								type="text"
								inputMode="decimal"
								value={form.rental}
								placeholder="Rental"
								onChange={(event) => update("rental", decimalOnly(event.target.value))}
								className={inputClass}
							/>,
							false,
							true,
						)}

						<label className="block min-w-0 sm:col-span-2 xl:col-span-4">
							<span className={labelClass}>
								Remark <span className="font-normal text-slate-500">(Optional)</span>
							</span>
							<input
								value={form.remark}
								maxLength={50}
								placeholder="Remark"
								onChange={(event) => update("remark", event.target.value)}
								className={inputClass}
							/>
							<span className="mt-1 block text-[11px] text-slate-500">Max 50 chars</span>
						</label>
					</div>
				</div>

				<footer className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"}`}>
					<button
						type="button"
						onClick={() => hydrate(initialValues)}
						disabled={isSaving}
						className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition disabled:opacity-50 ${isDark ? "border-violet-300/20 bg-violet-300/[0.10] text-violet-100 hover:bg-violet-300/[0.16]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}
					>
						Reset
					</button>
					<button
						type="submit"
						disabled={isSaving}
						className={`inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-[12px] font-semibold transition disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
					>
						{isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
						{isSaving ? "Saving..." : isEdit ? "Save Changes" : "Save"}
					</button>
				</footer>
			</form>
		</div>
	);
}
