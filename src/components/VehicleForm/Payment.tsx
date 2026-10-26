type PaymentProps = {
	isDark: boolean;
	values: Record<string, string>;
	onChange: (name: string, value: string) => void;
};

const paymentFields = [
	{ name: "paymentType", label: "Type", type: "select", placeholder: "Select", options: ["One-time", "Rental"] },
	{ name: "paymentTransporter", label: "Transporter", type: "select", placeholder: "Select Transporter", required: true, options: ["Default Transporter"] },
	{ name: "sellingPrice", label: "Selling Price", type: "number", placeholder: "0" },
	{ name: "paymentTerm", label: "Payment Term", type: "select", placeholder: "Select", required: true, options: ["Monthly", "Quarterly", "Half Yearly", "Yearly"] },
	{ name: "installationDate", label: "Installation Date", type: "date" },
	{ name: "rentalDueDate", label: "Rental Due Date", type: "date" },
	{ name: "technicianName", label: "Technician Name", optional: true, placeholder: "Technician Name" },
	{ name: "rental", label: "Rental", optional: true, placeholder: "Rental" },
] as const;

export function Payment({ isDark, values, onChange }: PaymentProps) {
	const inputClass = `h-9 w-full rounded-md border px-3 text-[12px] font-normal outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const labelClass = `mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

	return (
		<section aria-label="Payment details">
			<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
				{paymentFields.map((field) => (
					<label key={field.name} className="block min-w-0">
						<span className={labelClass}>
							{field.label}
							{"required" in field && field.required && <span className="ml-0.5 text-rose-500">*</span>}
							{"optional" in field && field.optional && (
								<span className={`ml-1 font-normal ${isDark ? "text-slate-500" : "text-slate-500"}`}>(Optional)</span>
							)}
						</span>
						{"options" in field ? (
							<span className="relative block">
								<select
									value={values[field.name] ?? ""}
									onChange={(event) => onChange(field.name, event.target.value)}
									className={`${inputClass} appearance-none pr-9`}
									aria-required={"required" in field ? field.required : undefined}
								>
									<option value="">{field.placeholder}</option>
									{field.options.map((option) => <option key={option}>{option}</option>)}
								</select>
								<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-500"}`}>⌄</span>
							</span>
						) : (
							<input
								type={"type" in field ? field.type : "text"}
								value={values[field.name] ?? ""}
								onChange={(event) => onChange(field.name, event.target.value)}
								placeholder={"placeholder" in field ? field.placeholder : undefined}
								className={inputClass}
							/>
						)}
					</label>
				))}
				<label className="block min-w-0 sm:col-span-2">
					<span className={labelClass}>
						Remark <span className={`font-normal ${isDark ? "text-slate-500" : "text-slate-500"}`}>(Optional)</span>
					</span>
					<textarea
						value={values.paymentRemark ?? ""}
						onChange={(event) => onChange("paymentRemark", event.target.value)}
						placeholder="Remark"
						maxLength={50}
						rows={2}
						className={`w-full resize-y rounded-md border px-3 py-2 text-[12px] font-normal outline-none transition focus:ring-2 ${
							isDark
								? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10"
								: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
						}`}
					/>
					<span className={`mt-0.5 block text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
						Max 50 chars ({values.paymentRemark?.length ?? 0}/50)
					</span>
				</label>
			</div>
		</section>
	);
}