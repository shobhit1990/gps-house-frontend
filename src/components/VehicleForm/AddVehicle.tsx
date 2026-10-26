import type { ChangeEvent } from "react";
import type { VehicleFieldConfig } from "@/interfaces/AddVehicleFields";
import { addVehicleFields } from "@/interfaces/AddVehicleFields";

type AddVehicleProps = {
	isDark: boolean;
	values: Record<string, string>;
	onChange: (name: string, value: string) => void;
};

export function AddVehicle({ isDark, values, onChange }: AddVehicleProps) {
	const inputClass = `h-9 w-full rounded-md border px-3 text-[12px] font-normal outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;

	const renderField = (field: VehicleFieldConfig) => {
		const value = values[field.name] ?? "";
		const label = (
			<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
				{field.label}{field.required && <span className="ml-0.5 text-rose-500">*</span>}
			</span>
		);

		if (field.type === "checkbox") {
			return (
				<label key={field.name} className={`flex cursor-pointer items-center gap-2.5 text-[12px] font-medium ${
					isDark ? "text-slate-300" : "text-slate-700"
				}`}>
					<input
						type="checkbox"
						checked={value === "true"}
						onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(field.name, String(event.target.checked))}
						className="h-4 w-4 rounded border-slate-400 accent-cyan-500"
					/>
					{field.label}
				</label>
			);
		}

		return (
			<label key={field.name} className="block min-w-0">
				{label}
				{field.type === "select" ? (
					<span className="relative block">
						<select
							value={value}
							required={field.required}
							onChange={(event) => onChange(field.name, event.target.value)}
							className={`${inputClass} appearance-none pr-9`}
						>
							{field.options?.map((option, index) => (
								<option key={option} value={index === 0 && option.startsWith("Select ") ? "" : option}>
									{option}
								</option>
							))}
						</select>
						<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-500"}`}>⌄</span>
					</span>
				) : (
					<input
						type={field.type ?? "text"}
						value={value}
						required={field.required}
						placeholder={field.placeholder}
						onChange={(event) => onChange(field.name, event.target.value)}
						className={inputClass}
					/>
				)}
				{field.helper && (
					<span className={`mt-1 block text-[11px] font-normal ${isDark ? "text-slate-500" : "text-slate-500"}`}>
						{field.helper}
					</span>
				)}
			</label>
		);
	};

	return (
		<section aria-label="Add vehicle details">
			<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
				{addVehicleFields.filter((field) => field.type !== "checkbox").map(renderField)}
			</div>
			<div className="mt-4 flex flex-col items-start gap-3">
				{addVehicleFields.filter((field) => field.type === "checkbox").map(renderField)}
			</div>
		</section>
	);
}